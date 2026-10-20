'use strict';

// Tests du serveur avec un faux fetch Anthropic (aucun appel réseau réel).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer, extractJson, splitReply } = require('../server.js');

const LESSON = {
  title: 'Le present perfect',
  objective: 'Parler d’expériences.',
  explanation: ['Paragraphe 1.', 'Paragraphe 2.'],
  examples: [{ en: 'I have been to Paris.', fr: 'Je suis allé à Paris.' }, { en: 'She has eaten.', fr: 'Elle a mangé.' }, { en: 'We have met.', fr: 'Nous nous sommes rencontrés.' }],
  vocab: [{ word: 'ever', fr: 'déjà', example: 'Have you ever...?' }, { word: 'yet', fr: 'encore', example: 'Not yet.' }, { word: 'since', fr: 'depuis', example: 'Since 2010.' }, { word: 'for', fr: 'pendant', example: 'For years.' }],
  exercises: [0, 1, 2, 0].map((answer, i) => ({ question: `Question ${i} ___ here.`, options: ['a', 'b', 'c'], answer, explain: 'Parce que.' })),
};

const calls = [];
let nextText = '';
async function fakeFetch(url, init) {
  calls.push({ url, init, body: JSON.parse(init.body) });
  return {
    ok: true,
    status: 200,
    json: async () => ({ content: [{ type: 'text', text: nextText }] }),
  };
}

let server;
let base;
const realFetch = globalThis.fetch;

test.before(async () => {
  server = createServer({
    apiKey: 'sk-test', appCode: 'secret', modelLesson: 'lesson-model', modelChat: 'chat-model', fetch: fakeFetch,
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const post = (path, body, code = 'secret') => realFetch(base + path, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(code ? { 'x-app-code': code } : {}) },
  body: JSON.stringify(body),
});

test('santé', async () => {
  const res = await realFetch(base + '/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, needsCode: true, hasKey: true });
});

test('fichiers statiques', async () => {
  const index = await realFetch(base + '/');
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /text\/html/);
  assert.match(await index.text(), /Prof d'anglais/);
  for (const [path, type] of [['/app.js', /javascript/], ['/styles.css', /css/], ['/sw.js', /javascript/], ['/manifest.webmanifest', /manifest/], ['/icons/icon-512.png', /png/], ['/icons/apple-touch-icon.png', /png/]]) {
    const res = await realFetch(base + path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), type, path);
  }
  assert.equal((await realFetch(base + '/inexistant.txt')).status, 404);
});

test('traversée de chemin bloquée', async () => {
  for (const p of ['/..%2fserver.js', '/%2e%2e/%2e%2e/etc/passwd', '/icons/..%2f..%2fpackage.json']) {
    const res = await realFetch(base + p);
    assert.notEqual(res.status, 200, p);
    assert.doesNotMatch(await res.text(), /createServer|"name"|root:/, p);
  }
});

test('401 sans code ou avec un mauvais code', async () => {
  const before = calls.length;
  let res = await post('/api/lesson', { topic: 'x', level: 'A1' }, null);
  assert.equal(res.status, 401);
  assert.match((await res.json()).error, /Code/);
  res = await post('/api/chat', { messages: [{ role: 'user', content: 'hi' }] }, 'mauvais');
  assert.equal(res.status, 401);
  assert.equal(calls.length, before, 'aucun appel à Anthropic');
});

test('leçon (JSON dans un bloc ```json)', async () => {
  nextText = 'Voici la leçon :\n```json\n' + JSON.stringify(LESSON) + '\n```';
  const res = await post('/api/lesson', { topic: 'present perfect', level: 'b1' });
  assert.equal(res.status, 200);
  const lesson = await res.json();
  assert.equal(lesson.title, LESSON.title);
  assert.equal(lesson.level, 'B1');
  assert.equal(lesson.exercises.length, 4);
  assert.equal(lesson.vocab.length, 4);
  const call = calls.at(-1);
  assert.equal(call.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(call.init.headers['x-api-key'], 'sk-test');
  assert.equal(call.init.headers['anthropic-version'], '2023-06-01');
  assert.equal(call.body.model, 'lesson-model');
  assert.match(call.body.system, /B1/);
});

test('leçon : sujet manquant et JSON illisible', async () => {
  let res = await post('/api/lesson', { topic: '  ' });
  assert.equal(res.status, 400);
  nextText = 'désolé, pas de JSON';
  res = await post('/api/lesson', { topic: 'x' });
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /Réessayez/);
});

test('conversation : réponse et correction séparées', async () => {
  nextText = "Great! What did you eat?\n---CORRECTION---\n« I goed » → « I went » : go est irrégulier.";
  const history = [{ role: 'assistant', content: 'Hi! How are you?' }];
  for (let i = 0; i < 20; i++) history.push({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` });
  history.push({ role: 'user', content: 'I goed to the restaurant.' });
  const res = await post('/api/chat', { level: 'A2', messages: history });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.content, 'Great! What did you eat?');
  assert.match(data.fix, /went/);
  const sent = calls.at(-1).body;
  assert.equal(sent.model, 'chat-model');
  assert.ok(sent.messages.length <= 16);
  assert.equal(sent.messages[0].role, 'user');
  assert.equal(sent.messages.at(-1).content, 'I goed to the restaurant.');

  nextText = 'Nice! And you?\n---CORRECTION---\nnone';
  const ok = await (await post('/api/chat', { messages: [{ role: 'user', content: 'I am fine.' }] })).json();
  assert.deepEqual(ok, { content: 'Nice! And you?', fix: null });
});

test('corps limité à 64 Ko', async () => {
  const res = await post('/api/chat', { messages: [{ role: 'user', content: 'x'.repeat(70 * 1024) }] });
  assert.equal(res.status, 413);
});

test('erreur Anthropic traduite en français', async () => {
  const s = createServer({ apiKey: 'k', appCode: '', modelChat: 'm', fetch: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'invalid x-api-key' } }) }) });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const res = await realFetch(`http://127.0.0.1:${s.address().port}/api/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  });
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /Clé API refusée/);
  s.close();
});

test('extractJson et splitReply', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson('```json\n{"a":2}\n```'), { a: 2 });
  assert.deepEqual(extractJson('Voici : {"a":3} merci'), { a: 3 });
  assert.equal(extractJson('rien'), null);
  assert.deepEqual(splitReply('Hello?'), { content: 'Hello?', fix: null });
});
