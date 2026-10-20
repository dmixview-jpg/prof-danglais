'use strict';

// Tests du serveur de fichiers et du contenu du parcours (aucune IA, aucun réseau).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createServer } = require('../server.js');

const COURSE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'curriculum.json'), 'utf8'));

let server;
let base;
test.before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('santé', async () => {
  const res = await fetch(base + '/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('fichiers statiques', async () => {
  const index = await fetch(base + '/');
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /text\/html/);
  assert.match(await index.text(), /Prof d'anglais/);
  for (const [p, type] of [['/app.js', /javascript/], ['/styles.css', /css/], ['/sw.js', /javascript/], ['/manifest.webmanifest', /manifest/], ['/curriculum.json', /json/], ['/icons/icon-512.png', /png/], ['/icons/apple-touch-icon.png', /png/]]) {
    const res = await fetch(base + p);
    assert.equal(res.status, 200, p);
    assert.match(res.headers.get('content-type'), type, p);
  }
  assert.equal((await fetch(base + '/inexistant.txt')).status, 404);
});

test('compression gzip du parcours', async () => {
  const raw = await new Promise((resolve, reject) => {
    require('http').get(base + '/curriculum.json', { headers: { 'accept-encoding': 'gzip' } }, (res) => {
      assert.equal(res.headers['content-encoding'], 'gzip');
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
  assert.equal(JSON.parse(zlib.gunzipSync(raw)).levels.length, 7);
});

test('traversée de chemin bloquée', async () => {
  for (const p of ['/..%2fserver.js', '/%2e%2e/%2e%2e/etc/passwd', '/icons/..%2f..%2fpackage.json']) {
    const res = await fetch(base + p);
    assert.notEqual(res.status, 200, p);
    assert.doesNotMatch(await res.text(), /createServer|"name"|root:/, p);
  }
});

test('aucune route d’IA : seules les requêtes GET sont acceptées', async () => {
  const res = await fetch(base + '/api/lesson', { method: 'POST', body: '{}' });
  assert.equal(res.status, 405);
});

test('parcours complet : 7 niveaux, de Pré-A1 à C2, toutes les leçons rédigées', () => {
  assert.deepEqual(COURSE.levels.map((l) => l.code), ['Pré-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  const all = COURSE.levels.flatMap((l) => l.units.flatMap((u) => u.lessons));
  const lessons = all.filter((l) => !l.dialogue);
  assert.equal(lessons.filter((l) => !l.review).length, 179);
  assert.equal(lessons.filter((l) => l.review).length, 36);
  const ids = all.map((l) => l.id);
  for (const l of lessons) {
    assert.ok(l.content, `${l.id} : contenu manquant`);
    assert.ok(!('brief' in l), `${l.id} : reste un objectif destiné à l’IA`);
  }
  assert.equal(new Set(ids).size, ids.length, 'identifiants uniques');
});

test('chaque leçon est complète et ses exercices sont valides', () => {
  for (const level of COURSE.levels) {
    for (const unit of level.units) {
      for (const { id, content: c } of unit.lessons.filter((l) => !l.dialogue)) {
        assert.ok(c.title && c.objective, `${id} : titre ou objectif`);
        assert.ok(c.explanation.length >= 2 && c.explanation.every((s) => s.text), `${id} : explications`);
        assert.ok(c.examples.length >= 2 && c.examples.every((x) => x.en && x.fr), `${id} : exemples`);
        assert.ok(c.exercises.length >= 4, `${id} : au moins 4 exercices`);
        for (const x of c.exercises) {
          assert.ok(['choice', 'listen', 'order'].includes(x.type), `${id} : type ${x.type}`);
          assert.ok(x.explain, `${id} : explication d’exercice`);
          if (x.type === 'order') {
            const n = x.sentence.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean).length;
            assert.ok(n >= 2 && n <= 14 && x.fr, `${id} : phrase à ordonner « ${x.sentence} »`);
          } else {
            assert.equal(x.options.length, 3, `${id} : 3 options`);
            assert.equal(new Set(x.options).size, 3, `${id} : options distinctes ${x.options}`);
            assert.ok(Number.isInteger(x.answer) && x.answer >= 0 && x.answer <= 2, `${id} : index de réponse`);
            if (x.type === 'listen') assert.ok(x.audio, `${id} : audio`);
            else assert.ok(x.question, `${id} : question`);
          }
        }
      }
    }
  }
});

test('un dialogue guidé par unité, de A1 à C2, placé avant le bilan', () => {
  const byId = new Map(COURSE.scenarios.map((s) => [s.id, s]));
  for (const level of COURSE.levels.filter((l) => l.id !== 'pre')) {
    for (const unit of level.units) {
      const nodes = unit.lessons.filter((l) => l.dialogue);
      assert.equal(nodes.length, 1, `${unit.id} : un dialogue`);
      const sc = byId.get(nodes[0].dialogue);
      assert.ok(sc, `${unit.id} : dialogue ${nodes[0].dialogue} introuvable`);
      assert.equal(sc.unit, unit.id);
      assert.equal(sc.level, level.code, `${sc.id} : niveau de l’unité`);
      assert.equal(unit.lessons.at(-2).id, nodes[0].id, `${unit.id} : dialogue juste avant le bilan`);
    }
  }
});

test('dialogues guidés : 35 situations, de A1 à C2, réponses valides', () => {
  const sc = COURSE.scenarios;
  assert.equal(sc.length, 35);
  assert.equal(new Set(sc.map((s) => s.id)).size, 35);
  assert.deepEqual([...new Set(sc.map((s) => s.level))].sort(), ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  for (const s of sc) {
    assert.ok(s.title && s.intro && s.emoji, `${s.id} : en-tête`);
    assert.ok(s.turns[0].coach, `${s.id} : le chat parle en premier`);
    const asks = s.turns.filter((t) => t.options);
    assert.ok(asks.length >= 4, `${s.id} : au moins 4 réponses à choisir`);
    for (const t of asks) {
      assert.equal(new Set(t.options).size, 3, `${s.id} : 3 options distinctes`);
      assert.ok(t.answer >= 0 && t.answer <= 2 && t.explain, `${s.id} : réponse et correction`);
    }
    for (const t of s.turns.filter((x) => x.coach)) assert.ok(t.fr, `${s.id} : traduction de « ${t.coach} »`);
  }
});
