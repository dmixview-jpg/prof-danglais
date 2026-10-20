'use strict';

// ---------- Stockage local ----------
const KEYS = {
  level: 'pd.level',
  code: 'pd.code',
  tab: 'pd.tab',
  lesson: 'pd.lesson',
  chat: 'pd.chat',
  vocab: 'pd.vocab',
  days: 'pd.days',
  lessons: 'pd.lessons',
};
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const MASTERED = 3;
const HISTORY = 16;

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
  const lessons = store.get(KEYS.lessons, 0);
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

// ---------- Prononciation ----------
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  voice = voices.find((v) => v.lang === 'en-US' && /samantha|ava|allison|google us/i.test(v.name))
    || voices.find((v) => v.lang === 'en-US')
    || voices.find((v) => /^en[-_]/i.test(v.lang))
    || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

// talker : mascotte qui « parle » (bouche animée) pendant la lecture.
function speak(text, talker) {
  if (!('speechSynthesis' in window)) {
    toast('La synthèse vocale n’est pas disponible sur cet appareil.');
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.92;
  if (voice) u.voice = voice;
  if (talker) {
    u.onstart = () => setMood(talker, 'talk');
    u.onend = u.onerror = () => setMood(talker, talker.dataset.base);
  }
  speechSynthesis.speak(u);
}

const speakBtn = (text, talker) =>
  h('button', { type: 'button', class: 'speak', 'aria-label': `Écouter : ${text}`, onclick: () => speak(text, talker) }, '🔊');

// ---------- Code d'accès et API ----------
let gateResolvers = [];

function showGate(message) {
  $('#gate').hidden = false;
  const err = $('#gate-error');
  err.textContent = message || '';
  err.hidden = !message;
  if (message) setMood($('#gate-mascot .mascot'), 'oops', 1500);
  setTimeout(() => $('#gate-code').focus(), 50);
  return new Promise((resolve) => gateResolvers.push(resolve));
}

$('#gate-mascot').append(mascot('wave', 'gate-buddy'));
$('#gate-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = $('#gate-code').value.trim();
  if (!code) return;
  store.set(KEYS.code, code);
  $('#gate').hidden = true;
  $('#gate-code').value = '';
  const resolvers = gateResolvers;
  gateResolvers = [];
  resolvers.forEach((r) => r());
});

async function api(path, body, { signal } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let res;
    try {
      res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-code': store.get(KEYS.code, '') },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw new Error(navigator.onLine === false
        ? 'Pas de connexion Internet. Réessaie quand tu seras en ligne.'
        : 'Impossible de joindre le serveur. Est-il bien démarré?');
    }
    let data = {};
    try {
      data = await res.json();
    } catch {
      // réponse non JSON
    }
    if (res.status === 401) {
      await showGate(store.get(KEYS.code, '') ? 'Code incorrect. Réessaie.' : '');
      continue;
    }
    if (!res.ok) throw new Error(data.error || `Erreur du serveur (${res.status}).`);
    return data;
  }
  throw new Error('Code d’accès refusé.');
}

// ---------- Niveau ----------
const levelSelect = $('#level');
const LEVEL_NAMES = { A1: 'Débutant', A2: 'Élémentaire', B1: 'Intermédiaire', B2: 'Avancé', C1: 'Autonome' };
const compactHeader = matchMedia('(max-width: 419px), (min-width: 700px) and (max-width: 939px), (orientation: landscape) and (max-height: 500px)');
function labelLevels() {
  for (const opt of levelSelect.options) {
    opt.textContent = compactHeader.matches ? `Niveau ${opt.value}` : `${opt.value} · ${LEVEL_NAMES[opt.value]}`;
  }
}
labelLevels();
compactHeader.addEventListener?.('change', labelLevels);
const getLevel = () => (LEVELS.includes(store.get(KEYS.level)) ? store.get(KEYS.level) : 'A2');
levelSelect.value = getLevel();
levelSelect.addEventListener('change', () => {
  store.set(KEYS.level, levelSelect.value);
  toast(`Niveau ${levelSelect.value} enregistré`);
});

// ---------- Onglets ----------
function showTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  document.querySelectorAll('.panel').forEach((p) => (p.hidden = p.id !== `panel-${name}`));
  store.set(KEYS.tab, name);
  if (name === 'chat') scrollChat();
  if (name === 'vocab') renderVocab();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));

// =====================================================================
// LEÇON
// =====================================================================
const TOPICS = [
  { emoji: '⏳', label: 'Present perfect', topic: 'Present perfect' },
  { emoji: '👋', label: 'Se présenter', topic: 'Se présenter' },
  { emoji: '🍽️', label: 'Au restaurant', topic: 'Commander au restaurant' },
  { emoji: '🔀', label: 'Verbes irréguliers', topic: 'Verbes irréguliers' },
  { emoji: '💼', label: 'Mon travail', topic: 'Parler de son travail' },
  { emoji: '📍', label: 'In / on / at', topic: 'Prépositions in/on/at' },
  { emoji: '📅', label: 'Rendez-vous', topic: 'Prendre un rendez-vous' },
  { emoji: '🔮', label: 'Will / going to', topic: 'Futur : will / going to' },
];
const STEP_EMOJIS = ['💡', '🔍', '⚠️', '✨', '🎯'];

const SAMPLE_LESSON = {
  sample: true,
  level: 'A2',
  title: 'Le present perfect',
  objective: 'Parler de tes expériences et de résultats.',
  explanation: [
    { emoji: '🧱', text: 'Formation : have (ou has avec he, she, it) + participe passé. Ex. : I have visited, she has eaten.' },
    { emoji: '🌍', text: 'On l’utilise pour une expérience de vie, sans dire quand : « I have been to Toronto ».' },
    { emoji: '⏰', text: 'Avec un moment précis et terminé (yesterday, last week, in 2019), on utilise le prétérit : « I saw him yesterday ».' },
    { emoji: '🔑', text: 'Mots indices : ever, never, already, yet, just, for, since.' },
  ],
  examples: [
    { emoji: '🍟', en: 'Have you ever eaten poutine?', fr: 'As-tu déjà mangé de la poutine?' },
    { emoji: '🏠', en: 'I have lived in Quebec City since 2015.', fr: 'J’habite à Québec depuis 2015.' },
    { emoji: '📄', en: 'She has just finished her report.', fr: 'Elle vient de terminer son rapport.' },
    { emoji: '🎬', en: 'We haven’t seen that movie yet.', fr: 'Nous n’avons pas encore vu ce film.' },
  ],
  vocab: [
    { emoji: '❓', word: 'ever', fr: 'déjà (question)', example: 'Have you ever been to Vancouver?' },
    { emoji: '✅', word: 'already', fr: 'déjà', example: 'I have already paid the bill.' },
    { emoji: '⏳', word: 'yet', fr: 'encore / déjà', example: 'Has the bus arrived yet?' },
    { emoji: '📍', word: 'since', fr: 'depuis (un moment)', example: 'I have worked here since January.' },
    { emoji: '⏱️', word: 'for', fr: 'depuis (une durée)', example: 'We have known each other for years.' },
  ],
  exercises: [
    { question: 'I ___ to Montreal many times.', options: ['have been', 'was', 'am'], answer: 0, explain: 'Expérience répétée, sans moment précis : have been.' },
    { question: 'She ___ her keys yesterday.', options: ['has lost', 'lost', 'have lost'], answer: 1, explain: '« Yesterday » = moment terminé : prétérit (lost).' },
    { question: 'We have lived here ___ 2018.', options: ['for', 'during', 'since'], answer: 2, explain: '« Since » + point de départ (2018).' },
    { question: 'Has he finished his homework ___?', options: ['yet', 'already', 'ever'], answer: 0, explain: 'En fin de question, on utilise « yet ».' },
  ],
};

const heroMascot = mascot('wave', 'hero-buddy');
$('#hero-mascot').append(heroMascot);
setTimeout(() => (heroMascot.dataset.base = 'idle', setMood(heroMascot, 'idle')), 2600);

$('#topic-chips').append(...TOPICS.map((t, i) =>
  h('button', { type: 'button', class: `topic-tile tint-${i % 6}`, onclick: () => { $('#topic').value = t.topic; createLesson(t.topic); } },
    h('span', { class: 'topic-emoji', 'aria-hidden': 'true' }, t.emoji),
    h('span', { class: 'topic-label' }, t.label))
));

$('#lesson-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const topic = $('#topic').value.trim();
  if (!topic) {
    $('#topic').focus();
    setMood(heroMascot, 'oops', 1200);
    toast('Écris un sujet ou choisis une suggestion.');
    return;
  }
  createLesson(topic);
});

let lessonBusy = false;
async function createLesson(topic) {
  if (lessonBusy) return;
  lessonBusy = true;
  const btn = $('#lesson-btn');
  const status = $('#lesson-status');
  btn.disabled = true;
  status.className = 'status thinking';
  status.hidden = false;
  status.replaceChildren(
    mascot('think', 'status-buddy'),
    h('div', null, h('strong', null, 'Je prépare ta leçon…'), h('div', { class: 'muted' }, `« ${topic} »`)));
  status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try {
    const lesson = await api('/api/lesson', { topic, level: getLevel() });
    store.set(KEYS.lesson, lesson);
    store.set(KEYS.lessons, store.get(KEYS.lessons, 0) + 1);
    markActive();
    renderStats();
    status.hidden = true;
    renderLesson(lesson);
    $('#lesson').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    status.className = 'status error';
    status.replaceChildren(mascot('oops', 'status-buddy'), h('div', null, err.message));
  } finally {
    lessonBusy = false;
    btn.disabled = false;
  }
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
    onclick: () => (i === last ? $('.lesson-examples, .lesson-quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : go(i + 1)),
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
    next.textContent = i === last ? 'Exemples ↓' : 'Suivant →';
  }
  onSwipe(viewport, () => go(i + 1), () => go(i - 1));
  go(0);
  return h('div', { class: 'card lesson-steps' },
    h('h2', null, h('span', { class: 'h-icon', 'aria-hidden': 'true' }, '🧠'), h('span', { class: 'mark' }, 'Comprendre')),
    viewport,
    steps.length > 1 ? h('div', { class: 'steps-nav' }, prev, dots, next) : null);
}

// Quiz : une question à la fois, la mascotte réagit.
function quizCard(exercises) {
  const card = h('div', { class: 'card lesson-quiz' });
  const buddy = mascot('idle', 'quiz-buddy');
  let idx = 0;
  let correct = 0;

  function renderQuestion() {
    if (idx >= exercises.length) return renderScore();
    const ex = exercises[idx];
    const explain = h('div', { class: 'explain', hidden: true });
    const next = h('button', {
      type: 'button', class: 'btn primary next-q', hidden: true,
      onclick: () => { idx++; renderQuestion(); },
    }, idx === exercises.length - 1 ? 'Mon score 🏆' : 'Suivant →');
    const buttons = ex.options.map((opt, j) =>
      h('button', {
        type: 'button', class: 'option', lang: 'en',
        onclick: () => {
          buttons.forEach((b) => (b.disabled = true));
          buttons[ex.answer].classList.add('correct');
          const good = j === ex.answer;
          if (good) correct++;
          else buttons[j].classList.add('wrong');
          setMood(buddy, good ? 'happy' : 'oops', 1600);
          markActive();
          explain.replaceChildren(h('span', { class: 'explain-icon', 'aria-hidden': 'true' }, good ? '🎉' : '💡'), h('span', null, ex.explain || (good ? 'Bravo!' : '')));
          explain.hidden = false;
          next.hidden = false;
        },
      }, h('span', { class: 'opt-letter', 'aria-hidden': 'true' }, 'ABC'[j]), h('span', null, opt)));
    card.replaceChildren(
      h('div', { class: 'quiz-head' },
        h('h2', null, h('span', { class: 'h-icon', 'aria-hidden': 'true' }, '🏆'), h('span', { class: 'mark' }, 'Quiz')),
        h('span', { class: 'quiz-count' }, `${idx + 1} / ${exercises.length}`)),
      h('div', { class: 'progress', 'aria-hidden': 'true' }, h('span', { style: `width:${(idx / exercises.length) * 100}%` })),
      h('div', { class: 'quiz-q' }, buddy, h('div', { class: 'q-bubble', lang: 'en' }, withBlank(ex.question))),
      h('div', { class: 'options' }, buttons),
      explain,
      next);
  }

  function renderScore() {
    const n = exercises.length;
    const great = correct >= n / 2;
    const big = mascot(great ? 'happy' : 'wave', 'score-buddy');
    const msg = correct === n ? 'Parfait!' : great ? 'Bien joué!' : 'Continue, tu progresses!';
    card.replaceChildren(
      h('div', { class: 'score-screen' },
        big,
        h('div', { class: 'stars', 'aria-label': `${correct} sur ${n}` },
          Array.from({ length: n }, (_, k) => h('span', { class: k < correct ? 'star on' : 'star', style: `animation-delay:${0.2 + k * 0.18}s` }, '★'))),
        h('div', { class: 'score-text' }, `${correct} / ${n} · ${msg}`),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = 0; correct = 0; renderQuestion(); } }, '🔁 Recommencer')));
    if (correct === n) confetti();
  }

  renderQuestion();
  return card;
}

function renderLesson(lesson) {
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

  root.replaceChildren(
    h('div', { class: 'card lesson-main' },
      h('div', { class: 'lead-meta' },
        lesson.sample ? h('span', { class: 'badge' }, 'Exemple') : null,
        lesson.level ? h('span', { class: 'level-chip' }, lesson.level) : null),
      h('h1', null, lesson.title),
      lesson.objective ? h('p', { class: 'objective' }, h('span', { 'aria-hidden': 'true' }, '🎯 '), lesson.objective) : null),
    steps.length ? stepsCard(steps) : null,
    examples.childElementCount ? h('div', { class: 'card lesson-examples' }, h('h2', null, h('span', { class: 'h-icon', 'aria-hidden': 'true' }, '💬'), h('span', { class: 'mark' }, 'Exemples')), examples) : null,
    vocab.childElementCount ? h('div', { class: 'card lesson-vocab' }, h('h2', null, h('span', { class: 'h-icon', 'aria-hidden': 'true' }, '🧩'), h('span', { class: 'mark' }, 'Mots utiles')), vocab) : null,
    (lesson.exercises || []).length ? quizCard(lesson.exercises) : null,
  );
}

// =====================================================================
// CONVERSATION
// =====================================================================
const WELCOME = "Hi! I'm your English coach. How are you today? Tell me about your day, in English. Don't worry about mistakes: I'll help you fix them.";

const SCENARIOS = [
  { emoji: '☀️', label: 'Ma journée', text: "Let's talk about my day. Ask me questions about what I did today." },
  { emoji: '💼', label: 'Entretien', text: "Let's role-play a job interview. You are the interviewer and I am the candidate. Please start." },
  { emoji: '☕', label: 'Au café', text: "Let's role-play at a café. You are the barista and I am the customer. Please start." },
  { emoji: '🩺', label: 'Médecin', text: "Let's role-play a visit to the doctor. You are the doctor and I am the patient. Please start." },
  { emoji: '🏠', label: 'Appartement', text: "Let's role-play visiting an apartment for rent. You are the landlord and I am looking for a place. Please start." },
  { emoji: '🎸', label: 'Loisirs', text: "Let's talk about my hobbies and free time. Ask me questions." },
];

let chat = store.get(KEYS.chat, null);
if (!Array.isArray(chat) || !chat.length) chat = [{ role: 'assistant', content: WELCOME }];
let chatController = null;

const chatLog = $('#chat-log');
const chatInput = $('#chat-input');

$('#scenario-chips').append(...SCENARIOS.map((s, i) =>
  h('button', { type: 'button', class: `scenario-card tint-${i % 6}`, onclick: () => { scenariosOpen = false; sendChat(s.text); } },
    h('span', { class: 'scenario-emoji', 'aria-hidden': 'true' }, s.emoji),
    h('span', null, s.label))
));

// La grille de scénarios s'affiche au début, puis se replie pour laisser la place à la discussion.
let scenariosOpen = false;
function updateScenarios() {
  const fresh = chat.length <= 1;
  $('#scenario-chips').hidden = !(fresh || scenariosOpen);
  $('#scenario-toggle').hidden = fresh;
  $('#scenario-toggle').setAttribute('aria-expanded', String(scenariosOpen));
}
$('#scenario-toggle').addEventListener('click', () => {
  scenariosOpen = !scenariosOpen;
  updateScenarios();
});

function msgNode(m, live = false) {
  if (m.role === 'user') {
    return h('div', { class: 'msg user' }, h('div', { class: 'bubble' }, m.content));
  }
  const avatar = mascot('idle', live ? 'avatar' : 'avatar still');
  return h('div', { class: 'msg assistant' },
    avatar,
    h('div', { class: 'msg-body' },
      h('div', { class: 'bubble-row' },
        h('div', { class: 'bubble', lang: 'en' }, m.content),
        speakBtn(m.content, avatar)),
      m.fix
        ? h('div', { class: 'fix' }, h('strong', null, '✏️ Correction'), m.fix)
        : m.ok ? h('div', { class: 'ok-chip' }, '✅ Aucune faute, bravo!') : null));
}

function renderChat() {
  const lastCoach = chat.map((m) => m.role).lastIndexOf('assistant');
  const nodes = chat.map((m, i) => msgNode(m, i === lastCoach));
  if (chat.length === 1) {
    nodes.unshift(h('div', { class: 'chat-hero' }, mascot('wave', 'hero-buddy'), h('div', { class: 'chat-hero-text' }, 'Parle-moi en anglais!')));
  }
  chatLog.replaceChildren(...nodes);
  updateScenarios();
  scrollChat();
}

function scrollChat() {
  requestAnimationFrame(() => {
    if (!$('#panel-chat').hidden) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
}

function saveChat() {
  store.set(KEYS.chat, chat.slice(-60));
}

function setChatBusy(busy) {
  $('#chat-stop').hidden = !busy;
  $('#chat-send').disabled = busy;
}

async function sendChat(text) {
  text = (text || '').trim();
  if (!text || chatController) return;
  chatLog.querySelector('.chat-hero')?.remove();
  chatLog.querySelectorAll('.mascot.avatar').forEach((a) => a.classList.add('still'));
  chat.push({ role: 'user', content: text });
  saveChat();
  updateScenarios();
  markActive();
  chatLog.append(msgNode(chat[chat.length - 1]));
  const typing = h('div', { class: 'msg assistant typing' },
    mascot('think', 'avatar'),
    h('div', { class: 'bubble' }, h('span', { class: 'dots' }, h('span', null, '●'), h('span', null, '●'), h('span', null, '●'))));
  chatLog.append(typing);
  scrollChat();

  chatController = new AbortController();
  setChatBusy(true);
  try {
    const messages = chat.slice(-HISTORY).map(({ role, content }) => ({ role, content }));
    const reply = await api('/api/chat', { level: getLevel(), messages }, { signal: chatController.signal });
    const m = { role: 'assistant', content: reply.content, fix: reply.fix || null, ok: !reply.fix };
    chat.push(m);
    saveChat();
    const node = msgNode(m, true);
    typing.replaceWith(node);
    setMood(node.querySelector('.mascot'), m.fix ? 'talk' : 'happy', 1400);
  } catch (err) {
    typing.remove();
    if (err.name !== 'AbortError') {
      chatLog.append(h('div', { class: 'status error' }, mascot('oops', 'status-buddy'), h('div', null, err.message)));
    }
  } finally {
    chatController = null;
    setChatBusy(false);
    scrollChat();
  }
}

$('#chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value;
  if (!text.trim()) return;
  chatInput.value = '';
  autoGrow();
  sendChat(text);
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !matchMedia('(pointer: coarse)').matches) {
    e.preventDefault();
    $('#chat-form').requestSubmit();
  }
});

function autoGrow() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
}
chatInput.addEventListener('input', autoGrow);

$('#chat-stop').addEventListener('click', () => {
  chatController?.abort();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
});

$('#chat-reset').addEventListener('click', () => {
  if (chat.length > 1 && !confirm('Commencer une nouvelle conversation? L’historique actuel sera effacé.')) return;
  chatController?.abort();
  chat = [{ role: 'assistant', content: WELCOME }];
  saveChat();
  renderChat();
});

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
renderLesson(store.get(KEYS.lesson, null) || SAMPLE_LESSON);
renderChat();
showTab(['lesson', 'chat', 'vocab'].includes(store.get(KEYS.tab)) ? store.get(KEYS.tab) : 'lesson');

(async function checkServer() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    const info = await res.json();
    if (!info.hasKey) {
      const banner = $('#banner');
      banner.textContent = '⚠️ Le serveur n’a pas de clé d’IA : ajoute ta clé gratuite AI_API_KEY dans le fichier .env (voir le README), puis redémarre-le.';
      banner.hidden = false;
    }
    if (info.needsCode && !store.get(KEYS.code, '')) await showGate();
  } catch {
    // hors ligne : l'app reste utilisable avec ce qui est en cache
  }
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
