'use strict';

// ---------- Stockage local ----------
const KEYS = {
  level: 'pd.level',
  tab: 'pd.tab',
  vocab: 'pd.vocab',
  days: 'pd.days',
  lessons: 'pd.lessons',
  progress: 'pd.progress',
  pathLevel: 'pd.pathLevel',
  dialogues: 'pd.dialogues', // meilleures étoiles par dialogue guidé
  voice: 'pd.voice',
  rate: 'pd.rate',
};
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MASTERED = 3;

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // stockage plein ou désactivé : on continue sans
    }
  },
};

// ---------- Petits utilitaires DOM ----------
const $ = (sel) => document.querySelector(sel);

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

let toastTimer;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2200);
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Glisser à gauche / à droite (iPhone, iPad).
function onSwipe(el, onLeft, onRight) {
  let x0 = null;
  let y0 = null;
  el.addEventListener('touchstart', (e) => {
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? onLeft : onRight)();
  });
}

// ---------- Série de jours et statistiques (motivation) ----------
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function markActive() {
  const days = store.get(KEYS.days, []);
  const today = dayKey();
  if (!days.includes(today)) {
    store.set(KEYS.days, [...days, today].slice(-400));
    renderStats();
  }
}

function streak() {
  const days = new Set(store.get(KEYS.days, []));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // la série tient jusqu'à ce soir
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function renderStats() {
  const box = $('#stats');
  if (!box) return;
  const s = streak();
  const mastered = getVocab().filter((w) => w.known >= MASTERED).length;
  const lessons = Math.max(store.get(KEYS.lessons, 0), Object.keys(store.get(KEYS.progress, {})).length);
  const stat = (icon, value, label) => h('div', { class: 'stat' },
    h('span', { class: 'stat-icon', 'aria-hidden': 'true' }, icon),
    h('span', { class: 'stat-value' }, String(value)),
    h('span', { class: 'stat-label' }, label));
  box.replaceChildren(
    stat('🔥', s, s > 1 ? 'jours de suite' : 'jour de suite'),
    stat('⭐', mastered, mastered > 1 ? 'mots maîtrisés' : 'mot maîtrisé'),
    stat('📚', lessons, lessons > 1 ? 'leçons' : 'leçon'));
}

function greet() {
  const hour = new Date().getHours();
  $('#hello').textContent = hour < 5 ? 'Bonne nuit! 🌙' : hour < 12 ? 'Bonjour! ☀️' : hour < 18 ? 'Bon après-midi! 👋' : 'Bonsoir! 🌆';
}

// ---------- Mascotte : un petit chat bleu animé (dessin SVG, aucune image à télécharger) ----------
// Humeurs : idle, wave, think, talk, happy, oops.
let mascotCount = 0;
function mascot(mood = 'idle', cls = '') {
  const id = `mg${++mascotCount}`;
  const el = h('span', { class: `mascot ${cls}`, 'aria-hidden': 'true', 'data-mood': mood, 'data-base': mood });
  el.innerHTML = `
<svg viewBox="-12 -6 144 138" focusable="false">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#86acff"/><stop offset="1" stop-color="#3f6ff0"/>
    </linearGradient>
  </defs>
  <ellipse class="m-shadow" cx="60" cy="127" rx="36" ry="5"/>
  <g class="m-all">
    <path class="m-tail" d="M34 116 C 4 118, -4 88, 14 74"/>
    <ellipse cx="60" cy="102" rx="31" ry="24" fill="url(#${id})"/>
    <ellipse class="m-belly" cx="60" cy="106" rx="17" ry="15"/>
    <ellipse class="m-paw" cx="47" cy="123" rx="9" ry="5.5"/>
    <ellipse class="m-paw" cx="73" cy="123" rx="9" ry="5.5"/>
    <g class="m-head">
      <g class="m-ear m-ear-l"><path d="M24 46 L27 8 L55 28 Z" class="m-ear-out"/><path d="M31 38 L32.5 17 L48 29 Z" class="m-ear-in"/></g>
      <g class="m-ear m-ear-r"><path d="M96 46 L93 8 L65 28 Z" class="m-ear-out"/><path d="M89 38 L87.5 17 L72 29 Z" class="m-ear-in"/></g>
      <ellipse cx="60" cy="58" rx="41" ry="34" fill="url(#${id})"/>
      <ellipse class="m-gloss" cx="38" cy="38" rx="13" ry="5.5" transform="rotate(-22 38 38)"/>
      <g class="m-eyes">
        <g class="m-eye"><ellipse cx="44" cy="59" rx="9" ry="10.5" fill="#fff"/><circle class="m-pupil" cx="45.5" cy="61" r="5.8"/><circle cx="48" cy="58" r="2.1" fill="#fff"/></g>
        <g class="m-eye"><ellipse cx="76" cy="59" rx="9" ry="10.5" fill="#fff"/><circle class="m-pupil" cx="77.5" cy="61" r="5.8"/><circle cx="80" cy="58" r="2.1" fill="#fff"/></g>
      </g>
      <path class="m-eyes-happy" d="M36 62 q8 -10 16 0 M68 62 q8 -10 16 0"/>
      <ellipse class="m-cheek" cx="32" cy="73" rx="6.5" ry="3.8"/>
      <ellipse class="m-cheek" cx="88" cy="73" rx="6.5" ry="3.8"/>
      <path class="m-whiskers" d="M27 69 l-17 -4 M27 75 l-17 1 M93 69 l17 -4 M93 75 l17 1"/>
      <path class="m-nose" d="M55.5 69 h9 l-4.5 5 z"/>
      <path class="m-mouth m-smile" d="M52 76 q4 4.5 8 0 q4 4.5 8 0"/>
      <g class="m-mouth m-open"><ellipse cx="60" cy="80" rx="6.5" ry="5.5"/><ellipse cx="60" cy="83" rx="4" ry="2.2" fill="#ff8fa3"/></g>
      <circle class="m-mouth m-o" cx="60" cy="80" r="3.6"/>
    </g>
    <path class="m-arm m-arm-l" d="M35 96 q-7 9 -4 19"/>
    <path class="m-arm m-arm-r" d="M85 96 q7 9 4 19"/>
    <g class="m-wave-arm"><path d="M86 99 Q101 94 107 77"/><circle cx="107.5" cy="74" r="6"/></g>
  </g>
  <g class="m-dots"><circle cx="112" cy="22" r="4"/><circle cx="121" cy="9" r="5"/><circle cx="131" cy="-5" r="6"/></g>
  <g class="m-stars"><path d="M0 14 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1z"/><path d="M116 40 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1z"/></g>
</svg>`;
  return el;
}

function setMood(el, mood, ms) {
  if (!el) return;
  clearTimeout(el._moodTimer);
  el.dataset.mood = mood;
  if (ms) el._moodTimer = setTimeout(() => (el.dataset.mood = el.dataset.base), ms);
}

// Pluie de confettis pour fêter une réussite.
function confetti() {
  if (reducedMotion()) return;
  const colors = ['#2b59c3', '#ffe166', '#ff8fa3', '#5fd08f', '#7d9cf0', '#ffb347'];
  const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < 70; i++) {
    const piece = h('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty('--r', `${Math.random() * 900 - 450}deg`);
    piece.style.setProperty('--d', `${1.8 + Math.random() * 1.4}s`);
    piece.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    box.append(piece);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 4000);
}

// ---------- Prononciation : voix américaine (en-US) ----------
// Les voix varient selon l'appareil : on ne garde que les voix américaines et on classe
// les plus naturelles en premier (« Améliorée », « Premium », « Natural »…).
const NOVELTY_VOICES = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|fred|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;
const GREAT_VOICES = /ava|evan|samantha|allison|nathan|zoe|susan|tom|joelle|noelle|aria|jenny|guy|michelle|google us english/i;
const isUS = (v) => /^en[-_]us$/i.test(v.lang);
let usVoices = [];
let voice = null;

function voiceScore(v) {
  let score = 0;
  if (/enhanced|premium|natural|neural|amélioré|ameliore/i.test(v.name)) score += 50;
  if (GREAT_VOICES.test(v.name)) score += 30;
  if (NOVELTY_VOICES.test(v.name)) score -= 200;
  if (v.localService) score += 5;
  return score;
}

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  usVoices = speechSynthesis.getVoices().filter(isUS).sort((a, b) => voiceScore(b) - voiceScore(a));
  const saved = store.get(KEYS.voice, '');
  voice = usVoices.find((v) => v.voiceURI === saved) || usVoices.find((v) => voiceScore(v) >= 0) || usVoices[0] || null;
  renderVoiceCard();
}

const speechRate = () => store.get(KEYS.rate, 0.92);

// Seconde voix américaine pour les dialogues (une autre personne).
function otherVoice() {
  return usVoices.find((v) => v !== voice && voiceScore(v) >= 0) || voice;
}

function utterance(text, rate, v = voice) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; // sans voix choisie, l'appareil prend sa voix américaine par défaut
  u.rate = rate || speechRate();
  if (v) u.voice = v;
  return u;
}

// talker : mascotte qui « parle » (bouche animée) pendant la lecture.
function speak(text, talker, rate) {
  if (!('speechSynthesis' in window)) {
    toast('La synthèse vocale n’est pas disponible sur cet appareil.');
    return;
  }
  speechSynthesis.cancel();
  const u = utterance(text, rate);
  if (talker) {
    u.onstart = () => setMood(talker, 'talk');
    u.onend = u.onerror = () => setMood(talker, talker.dataset.base);
  }
  speechSynthesis.speak(u);
}

// Réglages de la voix : choix de la voix américaine, vitesse, essai.
const RATES = [[0.75, '🐢 Lente'], [0.92, 'Normale'], [1.05, '🐇 Rapide']];
function renderVoiceCard() {
  const box = document.getElementById('voice-card');
  if (!box) return;
  const select = h('select', { id: 'voice-select', 'aria-label': 'Voix américaine' },
    usVoices.length
      ? usVoices.map((v) => {
        const o = h('option', { value: v.voiceURI }, v.name.replace(/\s*\((English|anglais)[^)]*\)/i, ''));
        if (voice && v.voiceURI === voice.voiceURI) o.selected = true;
        return o;
      })
      : [h('option', { value: '' }, 'Voix américaine de l’appareil')]);
  select.addEventListener('change', () => {
    store.set(KEYS.voice, select.value);
    voice = usVoices.find((v) => v.voiceURI === select.value) || voice;
    speak('Hi! I’m your English coach.');
  });
  const rate = speechRate();
  box.replaceChildren(
    h('h2', null, h('span', { class: 'h-icon', 'aria-hidden': 'true' }, '🔊'), h('span', { class: 'mark' }, 'Voix américaine')),
    h('div', { class: 'voice-row' },
      select,
      h('button', { type: 'button', class: 'btn primary', onclick: () => speak('Hi! I’m your English coach. Let’s practice together!') }, '▶ Essayer')),
    h('div', { class: 'rate-row', role: 'group', 'aria-label': 'Vitesse de la voix' }, RATES.map(([r, label]) =>
      h('button', {
        type: 'button', class: `rate-btn${Math.abs(rate - r) < 0.01 ? ' on' : ''}`, 'aria-pressed': String(Math.abs(rate - r) < 0.01),
        onclick: () => { store.set(KEYS.rate, r); renderVoiceCard(); speak('This is my speaking speed.'); },
      }, label))),
    h('details', { class: 'voice-help' },
      h('summary', null, '📱 Une voix plus naturelle sur iPhone ou iPad'),
      h('p', null, 'Réglages → Accessibilité → Contenu énoncé → Voix → Anglais → choisis une voix « États-Unis » marquée « Améliorée » ou « Premium » (ex. : Ava, Evan, Zoe) et télécharge-la. Reviens ensuite ici et choisis-la dans la liste.')));
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

const speakBtn = (text, talker) =>
  h('button', { type: 'button', class: 'speak', 'aria-label': `Écouter : ${text}`, onclick: () => speak(text, talker) }, '🔊');

// ---------- Niveau ----------
const levelSelect = $('#level');
const LEVEL_NAMES = { A1: 'Débutant', A2: 'Élémentaire', B1: 'Intermédiaire', B2: 'Avancé', C1: 'Autonome', C2: 'Maîtrise' };
const compactHeader = matchMedia('(max-width: 419px), (min-width: 700px) and (max-width: 939px), (orientation: landscape) and (max-height: 500px)');
function labelLevels() {
  for (const opt of levelSelect.options) {
    opt.textContent = compactHeader.matches ? `Niveau ${opt.value}` : `${opt.value} · ${LEVEL_NAMES[opt.value]}`;
  }
}
labelLevels();
compactHeader.addEventListener?.('change', labelLevels);
const getLevel = () => (LEVELS.includes(store.get(KEYS.level)) ? store.get(KEYS.level) : 'A1');
levelSelect.value = getLevel();
levelSelect.addEventListener('change', () => {
  store.set(KEYS.level, levelSelect.value);
  store.set(KEYS.pathLevel, levelSelect.value.toLowerCase());
  openUnits.clear();
  renderPath();
  renderContinue();
  dlgLevel = levelSelect.value;
  renderScenarios();
  toast(`Niveau ${levelSelect.value} : ton parcours est à jour`);
});

// ---------- Onglets ----------
function showTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  document.querySelectorAll('.panel').forEach((p) => (p.hidden = p.id !== `panel-${name}`));
  store.set(KEYS.tab, name);
  if (name === 'vocab') renderVocab();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));

// =====================================================================
// LEÇON
// =====================================================================
const STEP_EMOJIS = ['💡', '🔍', '⚠️', '✨', '🎯'];

const heroMascot = mascot('wave', 'hero-buddy');
$('#hero-mascot').append(heroMascot);
setTimeout(() => (heroMascot.dataset.base = 'idle', setMood(heroMascot, 'idle')), 2600);

// ---------- Parcours : de l'alphabet à la maîtrise ----------
let COURSE = null; // contenu de /curriculum.json
const courseIndex = new Map(); // id → { lesson, unit, level, order }
const courseOrder = []; // ids dans l'ordre du parcours
const openUnits = new Set();

const getProgress = () => store.get(KEYS.progress, {});
const isDone = (id) => Boolean(getProgress()[id]);
const getPathLevel = () => {
  const id = store.get(KEYS.pathLevel, 'pre');
  return COURSE?.levels.some((l) => l.id === id) ? id : 'pre';
};

async function loadCourse() {
  try {
    const res = await fetch('/curriculum.json');
    COURSE = await res.json();
  } catch {
    $('#path').replaceChildren(h('div', { class: 'status error' }, 'Impossible de charger le parcours. Vérifie ta connexion, puis recharge la page.'));
    return;
  }
  for (const level of COURSE.levels) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        courseIndex.set(lesson.id, { lesson, unit, level, order: courseOrder.length });
        courseOrder.push(lesson.id);
      }
    }
  }
  const code = COURSE.levels.find((l) => l.id === getPathLevel()).code;
  levelSelect.value = LEVELS.includes(code) ? code : 'A1';
  renderPath();
}

// Prochaine leçon à faire : la première non terminée du niveau choisi.
function nextLessonId(levelId = getPathLevel()) {
  const level = COURSE?.levels.find((l) => l.id === levelId);
  if (!level) return null;
  const ids = level.units.flatMap((u) => u.lessons.map((l) => l.id));
  return ids.find((id) => !isDone(id)) || null;
}

function crumbOf(id) {
  const e = courseIndex.get(id);
  if (!e) return '';
  return `${e.level.code} · Unité ${e.unit.id.split('.')[1]}`;
}

function renderContinue() {
  const btn = $('#continue-btn');
  const id = nextLessonId();
  const e = id && courseIndex.get(id);
  btn.hidden = !COURSE;
  if (!e) {
    $('#continue-title').textContent = 'Niveau terminé! 🎉';
    $('#continue-sub').textContent = 'Choisis le niveau suivant dans ton parcours.';
    btn.onclick = () => $('#level-chips').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  $('#continue-title').textContent = `${e.lesson.emoji} ${e.lesson.title}`;
  $('#continue-sub').textContent = `Continuer · ${crumbOf(id)}`;
  btn.onclick = () => openCourseLesson(id);
}

function levelProgress(level) {
  const ids = level.units.flatMap((u) => u.lessons.map((l) => l.id));
  return { done: ids.filter(isDone).length, total: ids.length };
}

function renderPath() {
  if (!COURSE) return;
  const current = getPathLevel();
  const level = COURSE.levels.find((l) => l.id === current);
  const next = nextLessonId(current);
  const nextUnit = next ? courseIndex.get(next).unit.id : null;
  if (!openUnits.size && nextUnit) openUnits.add(nextUnit);

  $('#level-chips').replaceChildren(...COURSE.levels.map((lv) => {
    const p = levelProgress(lv);
    return h('button', {
      type: 'button', class: `level-pill${lv.id === current ? ' on' : ''}`, 'aria-pressed': String(lv.id === current),
      onclick: () => {
        store.set(KEYS.pathLevel, lv.id);
        openUnits.clear();
        // le niveau de la conversation et des leçons libres suit le parcours
        const lvl = LEVELS.includes(lv.code) ? lv.code : 'A1';
        levelSelect.value = lvl;
        store.set(KEYS.level, lvl);
        renderPath();
        renderContinue();
      },
    },
    h('span', { class: 'pill-emoji', 'aria-hidden': 'true' }, lv.emoji),
    h('span', { class: 'pill-code' }, lv.code),
    h('span', { class: 'pill-count' }, p.done ? `${p.done}/${p.total}` : ''));
  }));

  const p = levelProgress(level);
  const header = h('div', { class: 'level-card' },
    h('div', { class: 'level-card-top' },
      h('span', { class: 'level-big-emoji', 'aria-hidden': 'true' }, level.emoji),
      h('div', null, h('div', { class: 'level-code' }, level.code), h('h3', null, level.name))),
    h('p', null, level.desc),
    h('div', { class: 'progress' }, h('span', { style: `width:${(p.done / p.total) * 100}%` })),
    h('div', { class: 'level-count' }, `${p.done} / ${p.total} leçons terminées`));

  const OFFSETS = [0, 46, 66, 46, 0, -46, -66, -46];
  const units = level.units.map((unit, u) => {
    const done = unit.lessons.filter((l) => isDone(l.id)).length;
    const open = openUnits.has(unit.id);
    const banner = h('button', {
      type: 'button', class: `unit-banner tint-${u % 6}`, 'aria-expanded': String(open),
      onclick: () => {
        if (openUnits.has(unit.id)) openUnits.delete(unit.id);
        else openUnits.add(unit.id);
        renderPath();
      },
    },
    h('span', { class: 'unit-emoji', 'aria-hidden': 'true' }, unit.emoji),
    h('span', { class: 'unit-text' },
      h('span', { class: 'unit-num' }, `Unité ${u + 1}`),
      h('span', { class: 'unit-title' }, unit.title),
      h('span', { class: 'unit-goal' }, unit.goal)),
    h('span', { class: `unit-count${done === unit.lessons.length ? ' full' : ''}` }, done === unit.lessons.length ? '⭐' : `${done}/${unit.lessons.length}`),
    h('span', { class: 'unit-chevron', 'aria-hidden': 'true' }, open ? '▴' : '▾'));
    if (!open) return h('section', { class: 'unit' }, banner);

    const nodes = unit.lessons.map((lesson, i) => {
      const prog = getProgress()[lesson.id];
      const isNext = lesson.id === next;
      const state = prog ? 'done' : isNext ? 'next' : 'todo';
      const off = OFFSETS[i % OFFSETS.length];
      return h('div', { class: `node-row ${state}${off > 0 ? ' buddy-left' : ''}`, style: `--off:${off}px` },
        h('button', {
          type: 'button', class: `node ${state}${lesson.review ? ' review' : ''}${lesson.dialogue ? ' dialogue' : ''}`,
          'aria-label': `${lesson.title}${prog ? ', terminée' : ''}`,
          onclick: () => openCourseLesson(lesson.id),
        }, h('span', { 'aria-hidden': 'true' }, lesson.emoji)),
        isNext ? mascot('wave', 'node-buddy') : null,
        h('div', { class: 'node-label' },
          lesson.title,
          prog ? h('span', { class: 'node-stars', 'aria-hidden': 'true' }, '★'.repeat(prog.stars) + '☆'.repeat(3 - prog.stars)) : null));
    });
    return h('section', { class: 'unit' }, banner, h('div', { class: 'node-path' }, nodes));
  });

  $('#path').replaceChildren(header, ...units);
}

// ---------- Vue « leçon » ----------
let currentLesson = null; // { id?, lesson }

function showLessonView(crumb) {
  $('#home').hidden = true;
  $('#lesson-view').hidden = false;
  $('#lesson-crumb').textContent = crumb;
  window.scrollTo({ top: 0 });
}

function showHome() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('#lesson-view').hidden = true;
  $('#home').hidden = false;
  renderPath();
  renderContinue();
  renderStats();
  window.scrollTo({ top: 0 });
}
$('#back-home').addEventListener('click', showHome);

// Toutes les leçons sont rédigées d'avance : elles s'ouvrent instantanément, même hors ligne.
function openCourseLesson(id) {
  const e = courseIndex.get(id);
  if (!e) return;
  // le dialogue guidé de l'unité s'ouvre dans l'onglet Conversation
  if (e.lesson.dialogue) {
    showTab('chat');
    startDialogue(e.lesson.dialogue);
    return;
  }
  if ($('#panel-lesson').hidden) showTab('lesson');
  showLessonView(`${crumbOf(id)} · ${e.lesson.review ? 'Bilan' : `Leçon ${id.split('.')[2]}`}`);
  renderLesson({ ...e.lesson.content, level: e.level.code }, id);
}

// ---------- Recherche dans le parcours ----------
const fold = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function searchLessons(query) {
  const q = fold(query.trim());
  const box = $('#search-results');
  if (q.length < 2) return box.replaceChildren();
  const words = q.split(/\s+/);
  const hits = [];
  for (const id of courseOrder) {
    const { lesson, unit, level } = courseIndex.get(id);
    if (lesson.review || !lesson.content) continue;
    const c = lesson.content;
    const text = fold([lesson.title, c.objective, unit.title, level.code, level.name,
      ...(c.vocab || []).map((v) => v.word)].join(' '));
    if (words.every((w) => text.includes(w))) hits.push(id);
    if (hits.length >= 12) break;
  }
  box.replaceChildren(...(hits.length ? hits.map((id) => {
    const { lesson } = courseIndex.get(id);
    return h('li', null, h('button', { type: 'button', class: 'search-hit', onclick: () => openCourseLesson(id) },
      tile(lesson.emoji, '📘', courseIndex.get(id).order),
      h('span', { class: 'txt' }, h('span', { class: 'hit-title' }, lesson.title), h('span', { class: 'muted hit-crumb' }, crumbOf(id))),
      isDone(id) ? h('span', { class: 'hit-done', 'aria-label': 'terminée' }, '✓') : null));
  }) : [h('li', { class: 'muted no-hit' }, 'Aucune leçon trouvée. Essaie un autre mot.')]));
}
$('#search').addEventListener('input', (ev) => searchLessons(ev.target.value));

// Leçon du parcours terminée : étoiles selon le score.
function completeCourseLesson(id, correct, total) {
  const stars = correct === total ? 3 : correct / total >= 0.6 ? 2 : 1;
  const progress = getProgress();
  const first = !progress[id];
  if (!progress[id] || progress[id].stars < stars) progress[id] = { stars, at: dayKey() };
  store.set(KEYS.progress, progress);
  if (first) store.set(KEYS.lessons, store.get(KEYS.lessons, 0) + 1);
  markActive();
  renderStats();
  const nextId = courseOrder[courseIndex.get(id).order + 1];
  return { stars: progress[id].stars, nextId };
}

function withBlank(question) {
  const out = [];
  question.split(/_{2,}/).forEach((p, i) => {
    if (i) out.push(h('span', { class: 'blank', 'aria-label': 'blanc' }));
    out.push(p);
  });
  return out;
}

const tile = (emoji, fallback, i = 0) => h('span', { class: `emoji-tile tint-${i % 6}`, 'aria-hidden': 'true' }, emoji || fallback);
const sectionTitle = (icon, text) => h('h2', null, h('span', { class: 'h-icon', 'aria-hidden': 'true' }, icon), h('span', { class: 'mark' }, text));

// Explication en étapes illustrées, à faire défiler (glisser ou boutons).
function stepsCard(steps) {
  let i = 0;
  const last = steps.length - 1;
  const track = h('div', { class: 'step-track' }, steps.map((s, k) =>
    h('div', { class: `step tint-${k % 6}`, 'aria-roledescription': 'étape' },
      h('div', { class: 'step-emoji', 'aria-hidden': 'true' }, s.emoji || STEP_EMOJIS[k % STEP_EMOJIS.length]),
      h('p', null, s.text))));
  const viewport = h('div', { class: 'step-viewport' }, track);
  const dots = h('div', { class: 'step-dots' }, steps.map((_, k) =>
    h('button', { type: 'button', class: 'step-dot', 'aria-label': `Étape ${k + 1}`, onclick: () => go(k) })));
  const prev = h('button', { type: 'button', class: 'btn ghost round', 'aria-label': 'Étape précédente', onclick: () => go(i - 1) }, '←');
  const next = h('button', {
    type: 'button', class: 'btn primary',
    onclick: () => (i === last ? $('.lesson-alphabet, .lesson-examples, .lesson-quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : go(i + 1)),
  });
  function go(k) {
    i = Math.max(0, Math.min(last, k));
    track.style.transform = `translateX(${-100 * i}%)`;
    [...track.children].forEach((c, n) => {
      c.classList.toggle('active', n === i);
      c.setAttribute('aria-hidden', String(n !== i));
    });
    [...dots.children].forEach((d, n) => d.setAttribute('aria-current', String(n === i)));
    prev.disabled = i === 0;
    next.textContent = i === last ? 'La suite ↓' : 'Suivant →';
  }
  onSwipe(viewport, () => go(i + 1), () => go(i - 1));
  go(0);
  return h('div', { class: 'card lesson-steps' },
    sectionTitle('🧠', 'Comprendre'),
    viewport,
    steps.length > 1 ? h('div', { class: 'steps-nav' }, prev, dots, next) : null);
}

// Alphabet interactif : toucher une lettre pour l'entendre.
const ALPHABET = [
  ['A', 'é-i', 1], ['B', 'bi'], ['C', 'si'], ['D', 'di'], ['E', 'i', 1], ['F', 'èf'], ['G', 'dji', 1],
  ['H', 'éitch'], ['I', 'aï', 1], ['J', 'djé-i', 1], ['K', 'ké-i'], ['L', 'èl'], ['M', 'èm'], ['N', 'èn'],
  ['O', 'ô-ou'], ['P', 'pi'], ['Q', 'kiou'], ['R', 'ar', 1], ['S', 'èss'], ['T', 'ti'], ['U', 'iou'],
  ['V', 'vi'], ['W', 'dobeul-iou', 1], ['X', 'èks'], ['Y', 'ouaï', 1], ['Z', 'zi (zèd au Canada)'],
];
function alphabetCard() {
  return h('div', { class: 'card lesson-alphabet' },
    sectionTitle('🔤', 'Touche une lettre'),
    h('p', { class: 'muted small-note' }, 'Prononciation approximative en français. Les lettres pièges ont un point jaune.'),
    h('div', { class: 'alpha-grid' }, ALPHABET.map(([letter, sound, trap], i) => {
      const btn = h('button', {
        type: 'button', class: `alpha-tile tint-${i % 6}${trap ? ' trap' : ''}`, 'aria-label': `Lettre ${letter}, se prononce ${sound}`,
        onclick: () => {
          speak(letter);
          btn.classList.remove('pop');
          void btn.offsetWidth;
          btn.classList.add('pop');
        },
      }, h('span', { class: 'alpha-letter', lang: 'en' }, letter), h('span', { class: 'alpha-sound' }, sound));
      return btn;
    })));
}

// Dialogue de la vie réelle, ligne par ligne ou en entier.
function dialogueCard(lines) {
  const people = [...new Set(lines.map((l) => l.who || '?'))];
  const rows = lines.map((l) => {
    const side = Math.max(0, people.indexOf(l.who || '?')) % 2;
    return h('div', { class: `dl-line side-${side}` },
      h('span', { class: `dl-avatar tint-${side ? 5 : 0}`, 'aria-hidden': 'true' }, (l.who || '?').slice(0, 1).toUpperCase()),
      h('div', { class: 'dl-bubble' },
        h('div', { class: 'dl-who' }, l.who),
        h('div', { class: 'en', lang: 'en' }, l.en),
        l.fr ? h('div', { class: 'fr' }, l.fr) : null),
      speakBtn(l.en));
  });
  const playAll = h('button', { type: 'button', class: 'btn ghost small' }, '▶ Tout écouter');
  playAll.addEventListener('click', () => speakSequence(lines.map((l, i) => ({ text: l.en, row: rows[i], alt: people.indexOf(l.who) % 2 === 1 }))));
  return h('div', { class: 'card lesson-dialogue' },
    h('div', { class: 'card-head' }, sectionTitle('🎭', 'Dialogue'), playAll),
    h('div', { class: 'dl-list' }, rows));
}

// Lit une suite de répliques ; deux voix différentes si l'appareil en a.
function speakSequence(items) {
  if (!('speechSynthesis' in window)) return toast('La synthèse vocale n’est pas disponible sur cet appareil.');
  speechSynthesis.cancel();
  const other = otherVoice();
  items.forEach((it) => {
    const u = utterance(it.text, null, it.alt ? other : voice);
    u.onstart = () => it.row.classList.add('playing');
    u.onend = u.onerror = () => it.row.classList.remove('playing');
    speechSynthesis.speak(u);
  });
}

function tipCard(tip) {
  return h('div', { class: 'tip-card' },
    h('span', { class: 'tip-emoji', 'aria-hidden': 'true' }, tip.emoji || '💡'),
    h('div', null, h('strong', null, 'Astuce de prof'), h('p', null, tip.text)));
}

// Quiz : une question à la fois, trois types d'exercices, la mascotte réagit.
function quizCard(exercises, onComplete) {
  const card = h('div', { class: 'card lesson-quiz' });
  const buddy = mascot('idle', 'quiz-buddy');
  let idx = 0;
  let correct = 0;

  function answered(good, explainEl, nextEl, text) {
    if (good) correct++;
    setMood(buddy, good ? 'happy' : 'oops', 1600);
    markActive();
    explainEl.replaceChildren(h('span', { class: 'explain-icon', 'aria-hidden': 'true' }, good ? '🎉' : '💡'), h('span', null, text || (good ? 'Bravo!' : '')));
    explainEl.hidden = false;
    nextEl.hidden = false;
  }

  function optionsFor(ex, explain, next) {
    const buttons = ex.options.map((opt, j) =>
      h('button', {
        type: 'button', class: 'option', lang: 'en',
        onclick: () => {
          buttons.forEach((b) => (b.disabled = true));
          buttons[ex.answer].classList.add('correct');
          if (j !== ex.answer) buttons[j].classList.add('wrong');
          answered(j === ex.answer, explain, next, ex.explain);
        },
      }, h('span', { class: 'opt-letter', 'aria-hidden': 'true' }, 'ABC'[j]), h('span', null, opt)));
    return h('div', { class: 'options' }, buttons);
  }

  // Remettre les mots dans l'ordre : toucher les tuiles pour construire la phrase.
  function orderFor(ex, explain, next) {
    const clean = (s) => s.replace(/[.,!?;:]/g, '').trim();
    const words = clean(ex.sentence).split(/\s+/);
    let bank = words.map((w, i) => ({ w, i }));
    for (let k = bank.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [bank[k], bank[r]] = [bank[r], bank[k]];
    }
    if (bank.every((t, k) => t.w === words[k]) && bank.length > 1) bank.push(bank.shift());
    const picked = [];
    const line = h('div', { class: 'order-line', 'aria-label': 'Ta phrase' });
    const pool = h('div', { class: 'order-bank' });
    let done = false;
    function draw() {
      line.replaceChildren(...(picked.length ? picked.map((t) => h('button', {
        type: 'button', class: 'word-tile in-line', lang: 'en', disabled: done,
        onclick: () => { picked.splice(picked.indexOf(t), 1); bank.push(t); draw(); },
      }, t.w)) : [h('span', { class: 'order-hint' }, 'Touche les mots dans le bon ordre')]));
      pool.replaceChildren(...bank.map((t) => h('button', {
        type: 'button', class: 'word-tile', lang: 'en', disabled: done,
        onclick: () => { bank = bank.filter((b) => b !== t); picked.push(t); draw(); check(); },
      }, t.w)));
    }
    function check() {
      if (bank.length) return;
      done = true;
      const good = picked.map((t) => t.w.toLowerCase()).join(' ') === words.map((w) => w.toLowerCase()).join(' ');
      line.classList.add(good ? 'good' : 'bad');
      draw();
      speak(ex.sentence);
      answered(good, explain, next, good ? ex.explain : `Réponse : « ${ex.sentence} ». ${ex.explain || ''}`);
    }
    draw();
    return h('div', { class: 'order-ex' }, line, pool);
  }

  function renderQuestion() {
    if (idx >= exercises.length) return renderScore();
    const ex = exercises[idx];
    const type = ex.type || 'choice';
    const explain = h('div', { class: 'explain', hidden: true });
    const next = h('button', {
      type: 'button', class: 'btn primary next-q', hidden: true,
      onclick: () => { idx++; renderQuestion(); card.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    }, idx === exercises.length - 1 ? 'Mon score 🏆' : 'Suivant →');

    let prompt;
    let body;
    if (type === 'listen') {
      prompt = h('div', { class: 'q-bubble listen-bubble' },
        h('div', { class: 'q-label' }, '🎧 Qu’as-tu entendu?'),
        h('div', { class: 'listen-btns' },
          h('button', { type: 'button', class: 'btn primary listen-play', onclick: () => speak(ex.audio, buddy) }, '🔊 Écouter'),
          h('button', { type: 'button', class: 'btn ghost listen-slow', 'aria-label': 'Écouter lentement', onclick: () => speak(ex.audio, buddy, 0.6) }, '🐢')));
      body = optionsFor(ex, explain, next);
    } else if (type === 'order') {
      prompt = h('div', { class: 'q-bubble' },
        h('div', { class: 'q-label' }, '🧩 Remets les mots dans l’ordre'),
        h('div', { class: 'q-fr' }, `« ${ex.fr} »`));
      body = orderFor(ex, explain, next);
    } else {
      prompt = h('div', { class: 'q-bubble', lang: 'en' }, withBlank(ex.question));
      body = optionsFor(ex, explain, next);
    }

    card.replaceChildren(
      h('div', { class: 'quiz-head' }, sectionTitle('🏆', 'Exercices'), h('span', { class: 'quiz-count' }, `${idx + 1} / ${exercises.length}`)),
      h('div', { class: 'progress', 'aria-hidden': 'true' }, h('span', { style: `width:${(idx / exercises.length) * 100}%` })),
      h('div', { class: 'quiz-q' }, buddy, prompt),
      body,
      explain,
      next);
  }

  function renderScore() {
    const n = exercises.length;
    const great = correct >= n / 2;
    const result = onComplete ? onComplete(correct, n) : null;
    const msg = correct === n ? 'Parfait!' : great ? 'Bien joué!' : 'Continue, tu progresses!';
    const stars = result ? result.stars : (correct === n ? 3 : correct / n >= 0.6 ? 2 : 1);
    card.replaceChildren(
      h('div', { class: 'score-screen' },
        mascot(great ? 'happy' : 'wave', 'score-buddy'),
        h('div', { class: 'stars', 'aria-label': `${stars} étoiles sur 3` },
          [0, 1, 2].map((k) => h('span', { class: k < stars ? 'star on' : 'star', style: `animation-delay:${0.2 + k * 0.2}s` }, '★'))),
        h('div', { class: 'score-text' }, `${correct} / ${n} · ${msg}`),
        result ? h('div', { class: 'done-chip' }, '✅ Leçon terminée') : null,
        h('div', { class: 'score-actions' },
          h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = 0; correct = 0; renderQuestion(); } }, '🔁 Recommencer'),
          result && result.nextId
            ? h('button', { type: 'button', class: 'btn primary', onclick: () => openCourseLesson(result.nextId) }, 'Leçon suivante →')
            : h('button', { type: 'button', class: 'btn primary', onclick: showHome }, '🧭 Mon parcours'))));
    if (correct === n) confetti();
  }

  renderQuestion();
  return card;
}

function renderLesson(lesson, courseId) {
  const root = $('#lesson');
  const vocabWords = new Set(getVocab().map((v) => v.en.toLowerCase()));
  const steps = (lesson.explanation || []).map((s) => (typeof s === 'string' ? { emoji: '', text: s } : s)).filter((s) => s && s.text);

  const examples = h('ul', { class: 'list' }, (lesson.examples || []).map((ex, i) =>
    h('li', { class: 'example' },
      tile(ex.emoji, '💬', i),
      h('div', { class: 'txt' }, h('div', { class: 'en', lang: 'en' }, ex.en), h('div', { class: 'fr' }, ex.fr)),
      speakBtn(ex.en))
  ));

  const vocab = h('div', { class: 'vocab-grid' }, (lesson.vocab || []).map((v, i) => {
    const inBook = vocabWords.has(v.word.toLowerCase());
    const add = h('button', {
      type: 'button', class: 'btn ghost small add-word', disabled: inBook, 'aria-label': `Ajouter « ${v.word} » au carnet`,
      onclick: () => {
        addWord(v.word, v.fr, v.example, v.emoji);
        add.disabled = true;
        add.textContent = '✓';
        toast(`« ${v.word} » ajouté au carnet`);
      },
    }, inBook ? '✓' : '+ Carnet');
    return h('div', { class: `word-card tint-${(i + 2) % 6}` },
      h('div', { class: 'word-emoji', 'aria-hidden': 'true' }, v.emoji || '📝'),
      h('div', { class: 'en', lang: 'en' }, v.word),
      h('div', { class: 'fr' }, v.fr),
      h('div', { class: 'word-actions' }, speakBtn(v.word), add));
  }));

  const onComplete = courseId ? (correct, total) => completeCourseLesson(courseId, correct, total) : null;

  root.replaceChildren(...[
    h('div', { class: 'card lesson-main' },
      h('div', { class: 'lead-meta' },
        lesson.sample ? h('span', { class: 'badge' }, 'Exemple') : null,
        lesson.level ? h('span', { class: 'level-chip' }, lesson.level) : null,
        courseId && isDone(courseId) ? h('span', { class: 'level-chip done' }, '✓ Terminée') : null),
      h('h1', null, lesson.title),
      lesson.objective ? h('p', { class: 'objective' }, h('span', { 'aria-hidden': 'true' }, '🎯 '), lesson.objective) : null),
    steps.length ? stepsCard(steps) : null,
    lesson.special === 'alphabet' ? alphabetCard() : null,
    examples.childElementCount ? h('div', { class: 'card lesson-examples' }, sectionTitle('💬', 'Exemples'), examples) : null,
    (lesson.dialogue || []).length ? dialogueCard(lesson.dialogue) : null,
    vocab.childElementCount ? h('div', { class: 'card lesson-vocab' }, sectionTitle('🧩', 'Mots utiles'), vocab) : null,
    lesson.tip && lesson.tip.text ? tipCard(lesson.tip) : null,
    (lesson.exercises || []).length ? quizCard(lesson.exercises, onComplete) : null,
  ].filter(Boolean));
}

// =====================================================================
// CONVERSATION : dialogues guidés (le chat parle, tu choisis ta réponse)
// =====================================================================
const chatLog = $('#chat-log');
$('#dlg-mascot').append(mascot('wave', 'hero-buddy'));
const getDialogueStars = () => store.get(KEYS.dialogues, {});
let dialogue = null; // { scenario, idx, correct, asked }

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
let dlgLevel = null; // niveau affiché dans la liste des situations (par défaut : le tien)

function renderScenarios() {
  if (!COURSE) return;
  const best = getDialogueStars();
  const mine = getLevel();
  if (!dlgLevel) dlgLevel = mine;
  // onglets de niveau, avec le nombre de situations réussies
  $('#dlg-levels').replaceChildren(...LEVEL_ORDER.map((lv) => {
    const all = COURSE.scenarios.filter((sc) => sc.level === lv);
    const done = all.filter((sc) => best[sc.id]).length;
    return h('button', {
      type: 'button', class: `dlg-level${lv === dlgLevel ? ' on' : ''}`, 'aria-pressed': String(lv === dlgLevel),
      onclick: () => { dlgLevel = lv; renderScenarios(); },
    }, h('span', { class: 'pill-code' }, lv), h('span', { class: 'pill-count' }, `${done}/${all.length}`));
  }));
  const list = COURSE.scenarios.filter((sc) => sc.level === dlgLevel)
    .sort((a, b) => (a.unit || 'zz').localeCompare(b.unit || 'zz'));
  $('#scenario-chips').replaceChildren(...list.map((sc, i) => {
    const stars = best[sc.id] || 0;
    return h('button', { type: 'button', class: `scenario-card tint-${i % 6}`, onclick: () => startDialogue(sc.id) },
      h('span', { class: 'scenario-emoji', 'aria-hidden': 'true' }, sc.emoji),
      h('span', { class: 'scenario-title' }, sc.title),
      h('span', { class: 'scenario-unit' }, sc.unit ? `Unité ${sc.unit.split('.')[1]}` : 'Bonus'),
      h('span', { class: 'scenario-meta' },
        stars ? h('span', { class: 'scenario-stars', 'aria-label': `${stars} étoiles sur 3` }, '★'.repeat(stars) + '☆'.repeat(3 - stars))
          : h('span', { class: 'scenario-new' }, 'À faire')));
  }));
}

function scrollChat() {
  requestAnimationFrame(() => {
    if (!$('#panel-chat').hidden) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
}

function coachNode(turn, live) {
  const avatar = mascot('idle', live ? 'avatar' : 'avatar still');
  const fr = h('div', { class: 'fr-line', hidden: true }, turn.fr);
  const node = h('div', { class: 'msg assistant' },
    avatar,
    h('div', { class: 'msg-body' },
      h('div', { class: 'bubble-row' },
        h('div', { class: 'bubble', lang: 'en' }, turn.coach),
        speakBtn(turn.coach, avatar)),
      turn.fr ? h('button', {
        type: 'button', class: 'fr-toggle', 'aria-expanded': 'false',
        onclick: (ev) => { fr.hidden = !fr.hidden; ev.currentTarget.setAttribute('aria-expanded', String(!fr.hidden)); },
      }, '🇫🇷 Traduction') : null,
      fr));
  return { node, avatar };
}

function startDialogue(id) {
  const scenario = COURSE.scenarios.find((sc) => sc.id === id);
  if (!scenario) return;
  dialogue = { scenario, idx: 0, correct: 0, asked: scenario.turns.filter((t) => t.options).length };
  $('#dlg-home').hidden = true;
  $('#dlg-view').hidden = false;
  $('#dlg-crumb').textContent = `${scenario.emoji} ${scenario.title} · ${scenario.level}`;
  chatLog.replaceChildren(h('div', { class: 'dlg-intro' }, h('span', { 'aria-hidden': 'true' }, '🎬 '), scenario.intro));
  $('#dlg-choices').replaceChildren();
  window.scrollTo({ top: 0 });
  nextTurn();
}

function showDialogueHome() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  dialogue = null;
  $('#dlg-view').hidden = true;
  $('#dlg-home').hidden = false;
  renderScenarios();
  window.scrollTo({ top: 0 });
}
$('#dlg-back').addEventListener('click', showDialogueHome);

function updateDialogueProgress() {
  const done = dialogue.scenario.turns.slice(0, dialogue.idx).filter((t) => t.options).length;
  $('#dlg-progress').style.width = `${(done / dialogue.asked) * 100}%`;
}

// Affiche les répliques du chat jusqu'à la prochaine réponse à choisir.
function nextTurn() {
  const { scenario } = dialogue;
  chatLog.querySelectorAll('.mascot.avatar').forEach((a) => a.classList.add('still'));
  let lastAvatar = null;
  const spoken = [];
  while (dialogue.idx < scenario.turns.length && scenario.turns[dialogue.idx].coach) {
    const turn = scenario.turns[dialogue.idx];
    const { node, avatar } = coachNode(turn, true);
    chatLog.append(node);
    spoken.push(turn.coach);
    lastAvatar = avatar;
    dialogue.idx++;
  }
  if (spoken.length) speak(spoken.join(' '), lastAvatar);
  updateDialogueProgress();
  scrollChat();
  if (dialogue.idx >= scenario.turns.length) return endDialogue();
  showChoices(scenario.turns[dialogue.idx]);
}

function showChoices(turn) {
  // ordre mélangé pour éviter que la bonne réponse soit toujours au même endroit
  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  const box = $('#dlg-choices');
  box.replaceChildren(
    h('div', { class: 'choices-label' }, '💬 Choisis ta réponse'),
    ...order.map((k) => h('button', {
      type: 'button', class: 'option choice-btn', lang: 'en',
      onclick: () => answer(turn, k),
    }, h('span', null, turn.options[k]))));
}

function answer(turn, k) {
  const good = k === turn.answer;
  if (good) dialogue.correct++;
  markActive();
  $('#dlg-choices').replaceChildren();
  chatLog.append(h('div', { class: `msg user${good ? '' : ' wrong'}` }, h('div', { class: 'bubble', lang: 'en' }, turn.options[k])));
  if (good) {
    chatLog.append(h('div', { class: 'ok-chip dlg-ok' }, `✅ Bien dit! ${turn.explain}`));
  } else {
    chatLog.append(h('div', { class: 'fix dlg-fix' },
      h('strong', null, '✏️ Correction'),
      h('div', { class: 'fix-better', lang: 'en' }, `Mieux : « ${turn.options[turn.answer]} »`),
      turn.explain));
  }
  const last = chatLog.querySelector('.msg.assistant:last-of-type .mascot');
  setMood(last, good ? 'happy' : 'oops', 1400);
  dialogue.idx++;
  scrollChat();
  setTimeout(() => dialogue && nextTurn(), reducedMotion() ? 0 : 900);
}

function endDialogue() {
  const { scenario, correct, asked } = dialogue;
  const stars = correct === asked ? 3 : correct / asked >= 0.6 ? 2 : 1;
  const best = getDialogueStars();
  if (!best[scenario.id] || best[scenario.id] < stars) best[scenario.id] = stars;
  store.set(KEYS.dialogues, best);
  // un dialogue rattaché à une unité compte comme une étape du parcours
  const courseId = scenario.unit && courseIndex.has(`${scenario.unit}.dialogue`) ? `${scenario.unit}.dialogue` : null;
  const result = courseId ? completeCourseLesson(courseId, correct, asked) : null;
  $('#dlg-progress').style.width = '100%';
  $('#dlg-choices').replaceChildren(h('div', { class: 'card score-screen dlg-end' },
    mascot(correct / asked >= 0.5 ? 'happy' : 'wave', 'score-buddy'),
    h('div', { class: 'stars', 'aria-label': `${stars} étoiles sur 3` },
      [0, 1, 2].map((n) => h('span', { class: n < stars ? 'star on' : 'star', style: `animation-delay:${0.2 + n * 0.2}s` }, '★'))),
    h('div', { class: 'score-text' }, `${correct} / ${asked} bonnes réponses`),
    h('div', { class: 'score-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => startDialogue(scenario.id) }, '🔁 Recommencer'),
      result && result.nextId
        ? h('button', { type: 'button', class: 'btn primary', onclick: () => { showDialogueHome(); openCourseLesson(result.nextId); } }, 'Suite du parcours →')
        : h('button', { type: 'button', class: 'btn primary', onclick: showDialogueHome }, '🎭 Autre situation'))));
  if (correct === asked) confetti();
  scrollChat();
}

// =====================================================================
// VOCABULAIRE
// =====================================================================
const SAMPLE_VOCAB = [
  { emoji: '🤩', en: 'to look forward to', fr: 'avoir hâte de', example: 'I look forward to seeing you.' },
  { emoji: '💡', en: 'actually', fr: 'en fait (pas « actuellement »)', example: 'Actually, I prefer tea.' },
  { emoji: '📅', en: 'appointment', fr: 'rendez-vous', example: 'I have a doctor’s appointment at 3.' },
  { emoji: '🧩', en: 'to figure out', fr: 'trouver, comprendre', example: 'I can’t figure out this problem.' },
  { emoji: '🤝', en: 'to get along with', fr: 's’entendre avec', example: 'I get along with my coworkers.' },
].map((w) => ({ ...w, id: uid(), known: 0, sample: true }));

function getVocab() {
  const list = store.get(KEYS.vocab, null);
  return Array.isArray(list) ? list : SAMPLE_VOCAB;
}
function setVocab(list) {
  store.set(KEYS.vocab, list);
}

function addWord(en, fr, example, emoji) {
  const list = getVocab();
  if (list.some((w) => w.en.toLowerCase() === en.toLowerCase())) return false;
  list.unshift({ id: uid(), emoji: emoji || '', en, fr, example: example || '', known: 0 });
  setVocab(list);
  deck = null;
  if (!$('#panel-vocab').hidden) renderVocab();
  return true;
}

let deck = null; // ids des mots à réviser, dans l'ordre
let flipped = false;

function progressDots(known) {
  const n = Math.min(known, MASTERED);
  return h('span', { class: 'dots-progress', 'aria-label': `${n} sur ${MASTERED}` },
    Array.from({ length: MASTERED }, (_, k) => h('i', { class: k < n ? 'on' : '' })));
}

function renderFlash() {
  const wrap = $('#flash');
  const list = getVocab();
  const byId = new Map(list.map((w) => [w.id, w]));
  if (!deck) deck = list.filter((w) => w.known < MASTERED).map((w) => w.id);
  deck = deck.filter((id) => byId.has(id) && byId.get(id).known < MASTERED);

  if (!deck.length) {
    wrap.replaceChildren(h('div', { class: 'card flash-empty' },
      mascot(list.length ? 'happy' : 'wave', 'empty-buddy'),
      h('h2', null, list.length ? 'Tout est maîtrisé! 🎉' : 'Ton carnet est vide'),
      h('p', { class: 'muted' }, 'Ajoute des mots ici ou avec « + Carnet » dans une leçon.')));
    return;
  }

  const word = byId.get(deck[0]);
  const card = h('button', {
    type: 'button', class: `flashcard enter${flipped ? ' flipped' : ''}`, 'aria-label': 'Retourner la carte',
    onclick: () => {
      flipped = !flipped;
      card.classList.toggle('flipped', flipped);
    },
  },
  h('div', { class: 'inner' },
    h('div', { class: 'face front', lang: 'en' },
      word.sample ? h('span', { class: 'badge' }, 'Exemple') : null,
      h('div', { class: 'face-emoji', 'aria-hidden': 'true' }, word.emoji || '📝'),
      h('div', { class: 'word' }, word.en),
      h('div', { class: 'hint', 'aria-hidden': 'true' }, '👆')),
    h('div', { class: 'face back' },
      h('div', { class: 'face-emoji small', 'aria-hidden': 'true' }, word.emoji || '📝'),
      h('div', { class: 'word' }, word.fr || '—'),
      word.example ? h('div', { class: 'muted', lang: 'en' }, word.example) : null)));
  onSwipe(card, () => review(), () => know());

  // La carte s'envole (à gauche : à revoir, à droite : je sais) avant la suivante.
  const leave = (dir, then) => {
    card.classList.add(dir);
    setTimeout(then, reducedMotion() ? 0 : 280);
  };
  const review = () => leave('fly-left', () => {
    markActive();
    deck.push(deck.shift());
    flipped = false;
    renderFlash();
  });
  const know = () => leave('fly-right', () => {
    markActive();
    const all = getVocab();
    const w = all.find((x) => x.id === word.id);
    if (w) {
      w.known = (w.known || 0) + 1;
      setVocab(all);
      if (w.known >= MASTERED) {
        toast(`« ${w.en} » est maîtrisé! 🎉`);
        confetti();
      }
    }
    deck.shift();
    if (w && w.known < MASTERED) deck.push(w.id);
    flipped = false;
    renderVocab();
  });

  wrap.replaceChildren(
    h('div', { class: 'flash-head' },
      h('h2', null, h('span', { class: 'mark' }, 'Cartes mémoire')),
      h('span', { class: 'count-chip' }, `🃏 ${deck.length}`)),
    card,
    h('div', { class: 'flash-actions' },
      h('button', { type: 'button', class: 'btn ghost', 'aria-label': 'Écouter', onclick: () => speak(word.en) }, '🔊'),
      progressDots(word.known || 0),
      h('button', { type: 'button', class: 'btn danger', onclick: review }, '🔁 À revoir'),
      h('button', { type: 'button', class: 'btn good', onclick: know }, '✅ Je sais')));
}

function renderList() {
  const list = getVocab();
  const mastered = list.filter((w) => w.known >= MASTERED).length;
  $('#vocab-count').textContent = list.length ? `· ${list.length} · ⭐ ${mastered}` : '';
  $('#vocab-list').replaceChildren(...list.map((w, i) =>
    h('li', null,
      tile(w.emoji, '📝', i),
      h('div', { class: 'txt' },
        h('div', null,
          h('span', { class: 'en', lang: 'en' }, w.en), ' ',
          w.sample ? h('span', { class: 'badge' }, 'Exemple') : null),
        h('div', { class: 'fr' }, w.fr),
        w.known >= MASTERED ? h('span', { class: 'mastered' }, '⭐ Maîtrisé') : progressDots(w.known || 0)),
      speakBtn(w.en),
      h('button', {
        type: 'button', class: 'btn ghost small icon-btn', 'aria-label': `Retirer « ${w.en} »`, title: 'Retirer',
        onclick: () => {
          setVocab(getVocab().filter((x) => x.id !== w.id));
          renderVocab();
        },
      }, '🗑️'))
  ));
}

function renderVocab() {
  renderFlash();
  renderList();
  renderStats();
}

$('#vocab-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const en = $('#vocab-en').value.trim();
  const fr = $('#vocab-fr').value.trim();
  if (!en || !fr) {
    toast('Écris le mot anglais et sa traduction.');
    return;
  }
  if (!addWord(en, fr)) {
    toast('Ce mot est déjà dans ton carnet.');
    return;
  }
  $('#vocab-en').value = '';
  $('#vocab-fr').value = '';
  toast(`« ${en} » ajouté`);
  renderVocab();
});

// Sur iPhone, le clavier remonte la barre d'onglets fixe : on la cache pendant la saisie.
const isTextField = (el) => el && el.matches && el.matches('input[type="text"], input[type="password"], textarea');
document.addEventListener('focusin', (e) => {
  if (isTextField(e.target)) document.body.classList.add('keyboard');
});
document.addEventListener('focusout', () => {
  setTimeout(() => {
    if (!isTextField(document.activeElement)) document.body.classList.remove('keyboard');
  }, 50);
});

// =====================================================================
// DÉMARRAGE
// =====================================================================
if (!Array.isArray(store.get(KEYS.vocab, null))) setVocab(SAMPLE_VOCAB);
greet();
renderStats();
loadCourse().then(() => {
  renderContinue();
  renderScenarios();
});
showTab(['lesson', 'chat', 'vocab'].includes(store.get(KEYS.tab)) ? store.get(KEYS.tab) : 'lesson');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
