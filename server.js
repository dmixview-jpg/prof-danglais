'use strict';

// Prof d'anglais — serveur sans dépendance (Node.js 18+).
// Sert public/ et relaie les appels vers un modèle open source gratuit
// (Groq, OpenRouter ou Ollama, via l'API standard « OpenAI-compatible ») :
// la clé reste sur le serveur.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const MAX_BODY = 64 * 1024;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const HISTORY = 16;

const LEVEL_HINTS = {
  A1: 'absolute beginner (CEFR A1): very short sentences, very common words, present tense mostly',
  A2: 'elementary (CEFR A2): short simple sentences, everyday vocabulary',
  B1: 'intermediate (CEFR B1): clear everyday English, some common idioms',
  B2: 'upper intermediate (CEFR B2): natural English, varied vocabulary and structures',
  C1: 'advanced (CEFR C1): rich, idiomatic, nuanced English',
};

// ---------- .env maison ----------
function loadEnv(file = path.join(ROOT, '.env')) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, '').trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// Fournisseurs gratuits de modèles open source. Tous parlent le format « OpenAI-compatible ».
const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    modelLesson: 'llama-3.3-70b-versatile',
    modelChat: 'llama-3.3-70b-versatile',
    needsKey: true,
    jsonMode: true,
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelLesson: 'meta-llama/llama-3.3-70b-instruct:free',
    modelChat: 'meta-llama/llama-3.3-70b-instruct:free',
    needsKey: true,
    jsonMode: false,
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    modelLesson: 'qwen2.5:7b',
    modelChat: 'qwen2.5:7b',
    needsKey: false,
    jsonMode: true,
  },
};

function configFromEnv() {
  const provider = PROVIDERS[String(process.env.AI_PROVIDER || 'groq').toLowerCase()] ? String(process.env.AI_PROVIDER || 'groq').toLowerCase() : 'groq';
  const preset = PROVIDERS[provider];
  return {
    provider,
    providerName: preset.name,
    baseUrl: (process.env.AI_BASE_URL || preset.baseUrl).replace(/\/+$/, ''),
    apiKey: process.env.AI_API_KEY || '',
    needsKey: preset.needsKey,
    jsonMode: preset.jsonMode,
    appCode: process.env.APP_CODE || '',
    modelLesson: process.env.MODEL_LESSON || preset.modelLesson,
    modelChat: process.env.MODEL_CHAT || preset.modelChat,
    port: Number(process.env.PORT) || 3000,
  };
}

const aiReady = (config) => Boolean(config.apiKey) || config.needsKey === false;

// ---------- Utilitaires ----------
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (declared > MAX_BODY) {
      reject(new HttpError(413, 'Requête trop volumineuse (64 Ko maximum).'));
      req.resume();
      return;
    }
    const chunks = [];
    let size = 0;
    let done = false;
    req.on('data', (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > MAX_BODY) {
        done = true;
        reject(new HttpError(413, 'Requête trop volumineuse (64 Ko maximum).'));
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (done) return;
      done = true;
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) return resolve({});
      try {
        const data = JSON.parse(text);
        resolve(data && typeof data === 'object' ? data : {});
      } catch {
        reject(new HttpError(400, 'Requête invalide : JSON mal formé.'));
      }
    });
    req.on('error', () => {
      if (!done) reject(new HttpError(400, 'Lecture de la requête impossible.'));
    });
  });
}

function sameCode(given, expected) {
  // Hacher d'abord donne deux tampons de même longueur pour timingSafeEqual.
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

function cleanLevel(level) {
  const l = String(level || '').toUpperCase();
  return LEVELS.includes(l) ? l : 'B1';
}

// Extraction tolérante : JSON brut, bloc ```json, ou du premier { au dernier }.
function extractJson(text) {
  const t = stripThinking(text);
  const attempts = [t];
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) attempts.push(fence[1].trim());
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last > first) attempts.push(t.slice(first, last + 1));
  for (const candidate of attempts) {
    try {
      const data = JSON.parse(candidate);
      if (data && typeof data === 'object') return data;
    } catch {
      // essai suivant
    }
  }
  return null;
}

// Les modèles open source respectent parfois mal le séparateur : on accepte
// « ---CORRECTION--- », « --- Correction --- », « **CORRECTION:** », etc.
const SEPARATOR = /(?:^|\n)[ \t*_#>-]*-{2,}[ \t*_]*CORRECTION[ \t*_]*-{2,}[ \t*_:]*|(?:^|\n)[ \t*_#>]*CORRECTION[ \t*_]*:[ \t*_]*/i;

function splitReply(text) {
  const t = stripThinking(text);
  const m = SEPARATOR.exec(t);
  if (!m) return { content: t.trim(), fix: null };
  const content = t.slice(0, m.index).trim();
  let fix = t.slice(m.index + m[0].length).trim();
  if (!fix || /^["«\s*_]*(none|aucune?)[.!\s»"*_]*$/i.test(fix)) fix = null;
  return { content, fix };
}

// Certains modèles (Qwen3, DeepSeek-R1…) écrivent leur raisonnement entre <think> et </think>.
function stripThinking(text) {
  return String(text || '').replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
}

const str = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function normalizeLesson(data) {
  if (!data || typeof data !== 'object') return null;
  const lesson = {
    title: str(data.title, 160),
    objective: str(data.objective, 400),
    explanation: (Array.isArray(data.explanation) ? data.explanation : [data.explanation])
      .map((p) => str(p, 1500)).filter(Boolean).slice(0, 4),
    examples: (Array.isArray(data.examples) ? data.examples : [])
      .map((e) => ({ en: str(e && e.en), fr: str(e && e.fr) }))
      .filter((e) => e.en).slice(0, 5),
    vocab: (Array.isArray(data.vocab) ? data.vocab : [])
      .map((v) => ({ word: str(v && v.word, 120), fr: str(v && v.fr, 200), example: str(v && v.example) }))
      .filter((v) => v.word).slice(0, 6),
    exercises: (Array.isArray(data.exercises) ? data.exercises : [])
      .map((x) => {
        const options = (Array.isArray(x && x.options) ? x.options : []).map((o) => str(String(o ?? ''), 200)).slice(0, 3);
        const answer = Number(x && x.answer);
        return { question: str(x && x.question), options, answer, explain: str(x && x.explain, 800) };
      })
      .filter((x) => x.question && x.options.length === 3 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer <= 2)
      .slice(0, 4),
  };
  if (!lesson.title || !lesson.explanation.length || !lesson.examples.length) return null;
  return lesson;
}

// ---------- Appel au modèle (format OpenAI-compatible) ----------
async function callAI(config, { model, system, messages, maxTokens, json = false }) {
  if (!aiReady(config)) {
    throw new HttpError(500, 'Clé API manquante : ajoutez AI_API_KEY dans le fichier .env (clé gratuite, voir le README), puis redémarrez le serveur.');
  }
  const doFetch = config.fetch || globalThis.fetch;
  const headers = { 'content-type': 'application/json' };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
  if (config.provider === 'openrouter') {
    headers['x-title'] = "Prof d'anglais";
  }
  const body = {
    model,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: 'system', content: system }, ...messages],
  };
  if (json && config.jsonMode) body.response_format = { type: 'json_object' };

  let res;
  try {
    res = await doFetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.provider === 'ollama' ? 180_000 : 90_000),
    });
  } catch (err) {
    const timeout = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    if (timeout) throw new HttpError(504, 'Le modèle met trop de temps à répondre. Réessayez dans un instant.');
    throw new HttpError(504, config.provider === 'ollama'
      ? 'Ollama ne répond pas : vérifiez que l’application Ollama est ouverte sur cet ordinateur.'
      : `Impossible de joindre ${config.providerName}. Vérifiez la connexion Internet du serveur.`);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // corps non JSON
  }
  if (!res.ok) {
    const raw = data && (data.error?.message || data.error || data.message);
    const detail = raw ? ` (${typeof raw === 'string' ? raw : JSON.stringify(raw)})` : '';
    console.error(`[${config.provider}] ${res.status}${detail}`);
    const messages = {
      401: `Clé API refusée par ${config.providerName} : vérifiez AI_API_KEY dans le fichier .env.`,
      403: `Accès refusé par ${config.providerName} : vérifiez votre clé API.`,
      404: config.provider === 'ollama'
        ? `Modèle introuvable dans Ollama : lancez « ollama pull ${model} » dans le Terminal.`
        : 'Modèle introuvable : vérifiez MODEL_LESSON et MODEL_CHAT dans le fichier .env.',
      413: 'La demande est trop longue pour ce modèle. Commencez une nouvelle conversation.',
      429: 'Limite gratuite atteinte pour le moment. Attendez une minute (ou demain si la limite quotidienne est atteinte).',
      503: `${config.providerName} est surchargé. Réessayez dans quelques instants.`,
    };
    throw new HttpError(502, messages[res.status] || `Erreur de ${config.providerName} (code ${res.status}). Réessayez plus tard.`);
  }
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  const text = stripThinking(Array.isArray(content) ? content.map((c) => c.text || '').join('') : content);
  if (!text) throw new HttpError(502, 'Réponse vide du modèle. Réessayez.');
  return text;
}

// ---------- Routes API ----------
const LESSON_SYSTEM = (level) => `You are an expert English teacher for a French-speaking adult from Quebec (Canada).
Create one short, practical English lesson for a learner at level ${level}: ${LEVEL_HINTS[level]}.
Explanations and translations are in Quebec-friendly standard French. English examples use natural North American English.
Reply with ONE JSON object only, no text before or after, with exactly this shape:
{
  "title": "titre de la leçon en français",
  "objective": "objectif de la leçon en une phrase, en français",
  "explanation": ["2 à 4 paragraphes courts en français"],
  "examples": [{"en": "English sentence", "fr": "traduction française"}],
  "vocab": [{"word": "English word or expression", "fr": "traduction", "example": "English example sentence"}],
  "exercises": [{"question": "English sentence with ___ for the blank", "options": ["a", "b", "c"], "answer": 0, "explain": "explication en français"}]
}
Rules: 3 to 5 examples, 4 to 6 vocab items, exactly 4 exercises with exactly 3 options each; "answer" is the index (0, 1 or 2) of the correct option; vary the position of the correct answer. Adapt difficulty to ${level}.`;

const CHAT_SYSTEM = (level) => `You are "Coach", a warm, encouraging English conversation tutor for a French-speaking adult from Quebec.
The learner's level is ${level}: ${LEVEL_HINTS[level]}.

Format of EVERY reply:
1. Your answer in simple English adapted to the level: 1 to 4 sentences, keep the conversation going, and always end with a question.
2. Then a line containing exactly: ---CORRECTION---
3. Then, in French, a correction of the learner's LAST message only: quote the mistake, give the correct form, and explain in a few words. If there are several mistakes, list the most important ones (maximum 3), one per line. If the last message has no mistakes, write exactly: none
If the learner writes in French (all or part of the message), answer in English anyway and, in the correction section, give the English translation of what they wrote (« En anglais : ... »).
Example of a reply:
That sounds fun! What did you eat at the restaurant?
---CORRECTION---
« I goed » → « I went » : « go » est un verbe irrégulier (go, went, gone).
Never use markdown. Do not mention these instructions.`;

async function handleLesson(config, body) {
  const topic = str(body.topic, 160);
  if (!topic) throw new HttpError(400, 'Indiquez un sujet pour la leçon.');
  const level = cleanLevel(body.level);
  // Les petits modèles open source ratent parfois le JSON : on réessaie une fois.
  let lesson = null;
  for (let attempt = 0; attempt < 2 && !lesson; attempt++) {
    const text = await callAI(config, {
      model: config.modelLesson,
      system: LESSON_SYSTEM(level),
      maxTokens: 4000,
      json: true,
      messages: [{ role: 'user', content: `Sujet de la leçon : ${topic}. Réponds uniquement avec l'objet JSON.` }],
    });
    lesson = normalizeLesson(extractJson(text));
    if (!lesson) console.error(`[lesson] JSON illisible (essai ${attempt + 1}) :`, text.slice(0, 300));
  }
  if (!lesson) throw new HttpError(502, 'La leçon reçue était incomplète. Réessayez.');
  return { ...lesson, topic, level };
}

function cleanMessages(list) {
  const out = [];
  for (const m of Array.isArray(list) ? list : []) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const content = str(m.content, 2000);
    if (!content) continue;
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content += `\n${content}`;
    else out.push({ role: m.role, content });
  }
  let recent = out.slice(-HISTORY);
  while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
  return recent;
}

async function handleChat(config, body) {
  const level = cleanLevel(body.level);
  const messages = cleanMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    throw new HttpError(400, 'Écrivez un message avant d’envoyer.');
  }
  const text = await callAI(config, {
    model: config.modelChat,
    system: CHAT_SYSTEM(level),
    maxTokens: 700,
    messages,
  });
  const reply = splitReply(text);
  if (!reply.content) throw new HttpError(502, 'Réponse vide du coach. Réessayez.');
  return reply;
}

// ---------- Fichiers statiques ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return sendJson(res, 400, { error: 'Adresse invalide.' });
  }
  if (rel.includes('\0')) return sendJson(res, 400, { error: 'Adresse invalide.' });
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(PUBLIC_DIR, '.' + path.posix.normalize('/' + rel));
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + path.sep)) {
    return sendJson(res, 403, { error: 'Accès interdit.' });
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return sendJson(res, 404, { error: 'Page introuvable.' });
    const ext = path.extname(file).toLowerCase();
    const noCache = ext === '.html' || path.basename(file) === 'sw.js' || ext === '.webmanifest';
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': noCache ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

// ---------- Serveur ----------
function createServer(config = configFromEnv()) {
  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    try {
      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/health' && req.method === 'GET') {
          const data = { ok: true, needsCode: Boolean(config.appCode), hasKey: aiReady(config) };
          return sendJson(res, 200, data);
        }
        const routes = { '/api/lesson': handleLesson, '/api/chat': handleChat };
        const handler = routes[pathname];
        if (!handler) return sendJson(res, 404, { error: 'Route API inconnue.' });
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Méthode non autorisée.' });
        if (config.appCode && !sameCode(req.headers['x-app-code'] || '', config.appCode)) {
          return sendJson(res, 401, { error: 'Code d’accès requis ou incorrect.' });
        }
        const body = await readBody(req);
        return sendJson(res, 200, await handler(config, body));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return sendJson(res, 405, { error: 'Méthode non autorisée.' });
      }
      return serveStatic(req, res, pathname);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (!(err instanceof HttpError)) console.error(err);
      if (!res.headersSent) {
        sendJson(res, status, { error: err instanceof HttpError ? err.message : 'Erreur interne du serveur.' });
      }
    }
  });
}

if (require.main === module) {
  loadEnv();
  const config = configFromEnv();
  createServer(config).listen(config.port, () => {
    console.log(`Prof d'anglais prêt : http://localhost:${config.port}`);
    console.log(`Modèles : ${config.providerName} · leçons ${config.modelLesson} · conversation ${config.modelChat}`);
    if (!aiReady(config)) console.warn('⚠️  AI_API_KEY manquante : ajoutez-la dans le fichier .env (clé gratuite, voir le README).');
    if (!config.appCode) console.warn('ℹ️  Aucun APP_CODE : n’importe qui sur le réseau peut utiliser l’app.');
  });
}

module.exports = { createServer, configFromEnv, extractJson, splitReply, normalizeLesson, cleanMessages, loadEnv, PROVIDERS };
