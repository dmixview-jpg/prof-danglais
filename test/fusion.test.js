// Tests de la fusion des progressions (appareil + compte en ligne) : npm test
const test = require('node:test');
const assert = require('node:assert');
const { merge, same } = require('../public/fusion.js');

test('garde la meilleure note de chaque leçon et de chaque dialogue', () => {
  const m = merge(
    { progress: { a: { stars: 2 }, b: { stars: 3 } }, dialogues: { cafe: 1 } },
    { progress: { a: { stars: 3 }, c: { stars: 1 } }, dialogues: { cafe: 3, hotel: 2 } },
  );
  assert.deepStrictEqual(m.progress, { a: { stars: 3 }, b: { stars: 3 }, c: { stars: 1 } });
  assert.deepStrictEqual(m.dialogues, { cafe: 3, hotel: 2 });
  assert.strictEqual(m.lessons, 3);
});

test('réunit le carnet sans doublons et garde le mot le mieux maîtrisé', () => {
  const m = merge({ vocab: [{ en: 'Hello', known: 1 }] }, { vocab: [{ en: 'hello', known: 3 }, { en: 'Bye', known: 0 }] });
  assert.deepStrictEqual(m.vocab.map((w) => [w.en, w.known]), [['hello', 3], ['Bye', 0]]);
});

test('réunit les jours d’activité, triés et sans doublons', () => {
  const m = merge({ days: ['2026-10-02', '2026-10-01'] }, { days: ['2026-10-01', '2026-10-03'] });
  assert.deepStrictEqual(m.days, ['2026-10-01', '2026-10-02', '2026-10-03']);
});

test('accepte une progression vide ou absente', () => {
  const m = merge(null, undefined);
  assert.deepStrictEqual(m, { progress: {}, dialogues: {}, days: [], vocab: [], lessons: 0, level: null, pathLevel: null });
});

test('la fusion est stable : refusionner ne change rien', () => {
  const m = merge({ progress: { a: { stars: 1 } }, level: 'B1' }, { progress: { b: { stars: 2 } }, level: 'A2' });
  assert.ok(same(m, merge(m, m)));
  assert.strictEqual(m.level, 'B1');
  assert.ok(same({ x: 1, y: [1, 2] }, { y: [1, 2], x: 1 }));
});
