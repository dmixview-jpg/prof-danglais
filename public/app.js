'use strict';

// ---------- Stockage local ----------
const KEYS = {
  level: 'pd.level',
  code: 'pd.code',
  tab: 'pd.tab',
  lesson: 'pd.lesson',
  chat: 'pd.chat',
  vocab: 'pd.vocab',
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

function speak(text) {
  if (!('speechSynthesis' in window)) {
    toast('La synthèse vocale n’est pas disponible sur cet appareil.');
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.92;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

const speakBtn = (text) =>
  h('button', { type: 'button', class: 'speak', 'aria-label': `Écouter : ${text}`, onclick: () => speak(text) }, '🔊');

// ---------- Code d'accès et API ----------
let gateResolvers = [];

function showGate(message) {
  $('#gate').hidden = false;
  const err = $('#gate-error');
  err.textContent = message || '';
  err.hidden = !message;
  setTimeout(() => $('#gate-code').focus(), 50);
  return new Promise((resolve) => gateResolvers.push(resolve));
}

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
const compactHeader = matchMedia('(max-width: 419px), (min-width: 700px) and (max-width: 939px)');
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
  'Present perfect',
  'Se présenter',
  'Commander au restaurant',
  'Verbes irréguliers',
  'Parler de son travail',
  'Prépositions in/on/at',
  'Prendre un rendez-vous',
  'Futur : will / going to',
];

const SAMPLE_LESSON = {
  sample: true,
  level: 'A2',
  title: 'Le present perfect : parler d’expériences et de résultats',
  objective: 'Savoir quand et comment utiliser le present perfect (have/has + participe passé).',
  explanation: [
    'Le present perfect se forme avec have (ou has à la 3e personne du singulier) suivi du participe passé : I have visited, she has eaten. À l’oral, on contracte souvent : I’ve, she’s, we’ve.',
    'On l’utilise pour une expérience de vie sans moment précis (« I have been to Toronto »), pour une action passée qui a un résultat maintenant (« I have lost my keys ») ou pour une situation qui dure encore, avec for et since (« I have lived here for ten years »).',
    'Piège classique pour un francophone : dès qu’on donne un moment précis et terminé (yesterday, last week, in 2019), on passe au prétérit. On dit « I saw him yesterday », jamais « I have seen him yesterday ».',
    'Avec ever (déjà, dans les questions), never (jamais), already (déjà), yet (encore / déjà, dans les négations et questions) et just (venir de), le present perfect est presque toujours le bon choix.',
  ],
  examples: [
    { en: 'Have you ever eaten poutine?', fr: 'As-tu déjà mangé de la poutine?' },
    { en: 'I have lived in Quebec City since 2015.', fr: 'J’habite à Québec depuis 2015.' },
    { en: 'She has just finished her report.', fr: 'Elle vient de terminer son rapport.' },
    { en: 'We haven’t seen that movie yet.', fr: 'Nous n’avons pas encore vu ce film.' },
    { en: 'I lost my phone yesterday, but I have found it now.', fr: 'J’ai perdu mon téléphone hier, mais je l’ai retrouvé.' },
  ],
  vocab: [
    { word: 'ever', fr: 'déjà (dans une question)', example: 'Have you ever been to Vancouver?' },
    { word: 'already', fr: 'déjà', example: 'I have already paid the bill.' },
    { word: 'yet', fr: 'encore / déjà (négation, question)', example: 'Has the bus arrived yet?' },
    { word: 'since', fr: 'depuis (un moment précis)', example: 'I have worked here since January.' },
    { word: 'for', fr: 'depuis / pendant (une durée)', example: 'We have known each other for years.' },
  ],
  exercises: [
    { question: 'I ___ to Montreal many times.', options: ['have been', 'was', 'am'], answer: 0, explain: 'Expérience répétée sans moment précis : present perfect (have been).' },
    { question: 'She ___ her keys yesterday.', options: ['has lost', 'lost', 'have lost'], answer: 1, explain: '« Yesterday » est un moment passé et terminé : on utilise le prétérit (lost).' },
    { question: 'We have lived here ___ 2018.', options: ['for', 'during', 'since'], answer: 2, explain: '« Since » + point de départ précis (2018). « For » s’emploie avec une durée (for six years).' },
    { question: 'Has he finished his homework ___?', options: ['yet', 'already', 'ever'], answer: 0, explain: 'En fin de question, « yet » veut dire « déjà / à présent ».' },
  ],
};

$('#topic-chips').append(...TOPICS.map((t) =>
  h('button', { type: 'button', class: 'chip', onclick: () => { $('#topic').value = t; createLesson(t); } }, t)
));

$('#lesson-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const topic = $('#topic').value.trim();
  if (!topic) {
    $('#topic').focus();
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
  status.className = 'status';
  status.hidden = false;
  status.replaceChildren(h('span', { class: 'spinner' }), `Ton prof prépare la leçon « ${topic} »… (environ 15 secondes)`);
  try {
    const lesson = await api('/api/lesson', { topic, level: getLevel() });
    store.set(KEYS.lesson, lesson);
    status.hidden = true;
    renderLesson(lesson);
    $('#lesson').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    status.className = 'status error';
    status.textContent = err.message;
  } finally {
    lessonBusy = false;
    btn.disabled = false;
  }
}

function withBlank(question) {
  const parts = question.split(/_{2,}/);
  const out = [];
  parts.forEach((p, i) => {
    if (i) out.push(h('span', { class: 'blank', 'aria-label': 'blanc' }));
    out.push(p);
  });
  return out;
}

function renderLesson(lesson) {
  const root = $('#lesson');
  const vocabWords = new Set(getVocab().map((v) => v.en.toLowerCase()));

  const examples = h('ul', { class: 'list' }, (lesson.examples || []).map((ex) =>
    h('li', { class: 'example' },
      h('div', { class: 'txt' }, h('div', { class: 'en', lang: 'en' }, ex.en), h('div', { class: 'fr' }, ex.fr)),
      speakBtn(ex.en))
  ));

  const vocab = h('ul', { class: 'list' }, (lesson.vocab || []).map((v) => {
    const inBook = vocabWords.has(v.word.toLowerCase());
    const add = h('button', {
      type: 'button', class: 'btn ghost small', disabled: inBook,
      onclick: () => {
        addWord(v.word, v.fr, v.example);
        add.disabled = true;
        add.textContent = '✓ Au carnet';
        toast(`« ${v.word} » ajouté au carnet`);
      },
    }, inBook ? '✓ Au carnet' : '+ Carnet');
    return h('li', { class: 'vocab-item' },
      speakBtn(v.word),
      h('div', { class: 'txt' },
        h('div', null, h('span', { class: 'en', lang: 'en' }, v.word), ' — ', h('span', { class: 'fr' }, v.fr)),
        v.example ? h('div', { class: 'ex', lang: 'en' }, v.example) : null),
      add);
  }));

  const exercises = lesson.exercises || [];
  let answered = 0;
  let correct = 0;
  const score = h('div', { class: 'score', hidden: true });

  const quiz = exercises.map((ex, i) => {
    const explain = h('div', { class: 'explain', hidden: true });
    const buttons = ex.options.map((opt, j) =>
      h('button', {
        type: 'button', class: 'option', lang: 'en',
        onclick: () => {
          buttons.forEach((b) => (b.disabled = true));
          buttons[ex.answer].classList.add('correct');
          const good = j === ex.answer;
          if (!good) buttons[j].classList.add('wrong');
          explain.replaceChildren(h('strong', null, good ? '✅ Bravo! ' : '❌ Pas tout à fait. '), ex.explain || '');
          explain.hidden = false;
          answered++;
          if (good) correct++;
          if (answered === exercises.length) {
            const msg = correct === exercises.length ? 'Parfait! 🎉' : correct >= exercises.length / 2 ? 'Bien joué!' : 'Continue, tu progresses!';
            score.textContent = `Score : ${correct} / ${exercises.length} — ${msg}`;
            score.hidden = false;
          }
        },
      }, `${String.fromCharCode(65 + j)}. ${opt}`)
    );
    return h('div', { class: 'exercise' },
      h('div', { class: 'q', lang: 'en' }, `${i + 1}. `, withBlank(ex.question)),
      h('div', { class: 'options' }, buttons),
      explain);
  });

  root.replaceChildren(
    h('div', { class: 'card lesson-main' },
      h('div', { class: 'lead-meta' },
        lesson.sample ? h('span', { class: 'badge' }, 'Exemple') : null,
        lesson.level ? h('span', null, `Niveau ${lesson.level}`) : null),
      h('h1', null, lesson.title),
      lesson.objective ? h('p', { class: 'objective' }, h('strong', null, 'Objectif : '), lesson.objective) : null,
      (lesson.explanation || []).map((p) => h('p', null, p))),
    examples.childElementCount ? h('div', { class: 'card lesson-examples' }, h('h2', null, h('span', { class: 'mark' }, 'Exemples')), examples) : null,
    vocab.childElementCount ? h('div', { class: 'card lesson-vocab' }, h('h2', null, h('span', { class: 'mark' }, 'Vocabulaire')), vocab) : null,
    quiz.length ? h('div', { class: 'card lesson-quiz' }, h('h2', null, h('span', { class: 'mark' }, 'À toi de jouer')), quiz, score) : null,
  );
}

// =====================================================================
// CONVERSATION
// =====================================================================
const WELCOME = "Hi! I'm your English coach. How are you today? Tell me about your day, in English. Don't worry about mistakes: I'll help you fix them.";

const SCENARIOS = [
  { label: 'Parler de ma journée', text: "Let's talk about my day. Ask me questions about what I did today." },
  { label: 'Entretien d’embauche', text: "Let's role-play a job interview. You are the interviewer and I am the candidate. Please start." },
  { label: 'Au café', text: "Let's role-play at a café. You are the barista and I am the customer. Please start." },
  { label: 'Chez le médecin', text: "Let's role-play a visit to the doctor. You are the doctor and I am the patient. Please start." },
  { label: 'Visiter un appartement', text: "Let's role-play visiting an apartment for rent. You are the landlord and I am looking for a place. Please start." },
  { label: 'Parler de mes loisirs', text: "Let's talk about my hobbies and free time. Ask me questions." },
];

let chat = store.get(KEYS.chat, null);
if (!Array.isArray(chat) || !chat.length) chat = [{ role: 'assistant', content: WELCOME }];
let chatController = null;

const chatLog = $('#chat-log');
const chatInput = $('#chat-input');

$('#scenario-chips').append(...SCENARIOS.map((s) =>
  h('button', { type: 'button', class: 'chip', onclick: () => sendChat(s.text) }, s.label)
));

function msgNode(m) {
  const isCoach = m.role === 'assistant';
  return h('div', { class: `msg ${m.role}` },
    h('div', { class: 'who' }, isCoach ? 'Coach' : 'Moi'),
    h('div', { class: 'bubble-row' },
      h('div', { class: 'bubble', lang: isCoach ? 'en' : null }, m.content),
      isCoach ? speakBtn(m.content) : null),
    m.fix ? h('div', { class: 'fix' }, h('strong', null, 'Correction'), m.fix) : null);
}

function renderChat() {
  chatLog.replaceChildren(...chat.map(msgNode));
  scrollChat();
}

function scrollChat() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
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
  chat.push({ role: 'user', content: text });
  saveChat();
  chatLog.append(msgNode(chat[chat.length - 1]));
  const typing = h('div', { class: 'msg assistant typing' },
    h('div', { class: 'who' }, 'Coach'),
    h('div', { class: 'bubble' }, h('span', { class: 'dots' }, h('span', null, '●'), h('span', null, '●'), h('span', null, '●'))));
  chatLog.append(typing);
  scrollChat();

  chatController = new AbortController();
  setChatBusy(true);
  try {
    const messages = chat.slice(-HISTORY).map(({ role, content }) => ({ role, content }));
    const reply = await api('/api/chat', { level: getLevel(), messages }, { signal: chatController.signal });
    const m = { role: 'assistant', content: reply.content, fix: reply.fix || null };
    chat.push(m);
    saveChat();
    typing.replaceWith(msgNode(m));
  } catch (err) {
    typing.remove();
    if (err.name !== 'AbortError') {
      chatLog.append(h('div', { class: 'status error' }, err.message));
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
  { en: 'to look forward to', fr: 'avoir hâte de', example: 'I look forward to seeing you.' },
  { en: 'actually', fr: 'en fait (faux ami : pas « actuellement »)', example: 'Actually, I prefer tea.' },
  { en: 'appointment', fr: 'rendez-vous', example: 'I have a doctor’s appointment at 3.' },
  { en: 'to figure out', fr: 'comprendre, trouver la solution', example: 'I can’t figure out this problem.' },
  { en: 'to get along with', fr: 's’entendre avec', example: 'I get along with my coworkers.' },
].map((w) => ({ ...w, id: uid(), known: 0, sample: true }));

function getVocab() {
  const list = store.get(KEYS.vocab, null);
  return Array.isArray(list) ? list : SAMPLE_VOCAB;
}
function setVocab(list) {
  store.set(KEYS.vocab, list);
}

function addWord(en, fr, example) {
  const list = getVocab();
  const existing = list.find((w) => w.en.toLowerCase() === en.toLowerCase());
  if (existing) return false;
  list.unshift({ id: uid(), en, fr, example: example || '', known: 0 });
  setVocab(list);
  deck = null;
  if (!$('#panel-vocab').hidden) renderVocab();
  return true;
}

let deck = null; // ids des mots à réviser, dans l'ordre
let flipped = false;

function progressDots(known) {
  const n = Math.min(known, MASTERED);
  return '●'.repeat(n) + '○'.repeat(MASTERED - n);
}

function renderFlash() {
  const wrap = $('#flash');
  const list = getVocab();
  const byId = new Map(list.map((w) => [w.id, w]));
  if (!deck) deck = list.filter((w) => w.known < MASTERED).map((w) => w.id);
  deck = deck.filter((id) => byId.has(id) && byId.get(id).known < MASTERED);

  if (!deck.length) {
    wrap.replaceChildren(h('div', { class: 'card flash-empty' },
      h('h2', null, list.length ? 'Bravo, tout est maîtrisé! 🎉' : 'Ton carnet est vide'),
      h('p', { class: 'muted' }, list.length
        ? 'Ajoute de nouveaux mots ci-dessous ou depuis une leçon (bouton « + Carnet »).'
        : 'Ajoute des mots ci-dessous ou depuis une leçon (bouton « + Carnet »).')));
    return;
  }

  const word = byId.get(deck[0]);
  const card = h('button', {
    type: 'button', class: `flashcard${flipped ? ' flipped' : ''}`, 'aria-label': 'Retourner la carte',
    onclick: () => {
      flipped = !flipped;
      card.classList.toggle('flipped', flipped);
    },
  },
  h('div', { class: 'inner' },
    h('div', { class: 'face front', lang: 'en' },
      word.sample ? h('span', { class: 'badge' }, 'Exemple') : null,
      h('div', { class: 'word' }, word.en),
      h('div', { class: 'hint' }, 'Touche pour voir la traduction')),
    h('div', { class: 'face back' },
      h('div', { class: 'word' }, word.fr || '—'),
      word.example ? h('div', { class: 'muted', lang: 'en' }, word.example) : null)));

  const review = () => {
    deck.push(deck.shift());
    flipped = false;
    renderFlash();
  };
  const know = () => {
    const all = getVocab();
    const w = all.find((x) => x.id === word.id);
    if (w) {
      w.known = (w.known || 0) + 1;
      setVocab(all);
      if (w.known >= MASTERED) toast(`« ${w.en} » est maîtrisé! 🎉`);
    }
    deck.shift();
    if (w && w.known < MASTERED) deck.push(w.id);
    flipped = false;
    renderVocab();
  };

  wrap.replaceChildren(
    h('div', { class: 'flash-head' },
      h('h2', null, h('span', { class: 'mark' }, 'Cartes mémoire')),
      h('span', { class: 'muted' }, `${deck.length} à réviser`)),
    card,
    h('div', { class: 'flash-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => speak(word.en) }, '🔊 Écouter'),
      h('span', { class: 'dots-progress', style: 'align-self:center;justify-self:center', title: 'Progression' }, progressDots(word.known || 0)),
      h('button', { type: 'button', class: 'btn danger', onclick: review }, 'À revoir'),
      h('button', { type: 'button', class: 'btn good', onclick: know }, 'Je sais')));
}

function renderList() {
  const list = getVocab();
  const mastered = list.filter((w) => w.known >= MASTERED).length;
  $('#vocab-count').textContent = list.length ? `· ${list.length} mot${list.length > 1 ? 's' : ''}, ${mastered} maîtrisé${mastered > 1 ? 's' : ''}` : '';
  $('#vocab-list').replaceChildren(...list.map((w) =>
    h('li', null,
      speakBtn(w.en),
      h('div', { class: 'txt' },
        h('div', null,
          h('span', { class: 'en', lang: 'en' }, w.en), ' — ', h('span', { class: 'fr' }, w.fr), ' ',
          w.sample ? h('span', { class: 'badge' }, 'Exemple') : null),
        w.known >= MASTERED
          ? h('span', { class: 'mastered' }, '✓ Maîtrisé')
          : h('span', { class: 'dots-progress', 'aria-label': `${w.known || 0} sur ${MASTERED}` }, progressDots(w.known || 0))),
      h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => {
          setVocab(getVocab().filter((x) => x.id !== w.id));
          renderVocab();
        },
      }, 'Retirer'))
  ));
}

function renderVocab() {
  renderFlash();
  renderList();
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
