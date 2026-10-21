// Tests de la séparation gratuit / payant (abonnement actif) : npm test
const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-abo-'));
execFileSync('python3', [path.join(__dirname, '..', 'outils', 'programme', 'construire.py'), '--essai', dir]);
const pub = JSON.parse(fs.readFileSync(path.join(dir, 'curriculum.json'), 'utf8'));
const prem = JSON.parse(fs.readFileSync(path.join(dir, 'contenu.json'), 'utf8'));
const fullDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-tout-'));
execFileSync('python3', [path.join(__dirname, '..', 'outils', 'programme', 'construire.py'), '--tout', fullDir]);
const full = JSON.parse(fs.readFileSync(path.join(fullDir, 'curriculum.json'), 'utf8'));
const committed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'curriculum.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'outils', 'programme', 'abonnement.json'), 'utf8'));
const lessons = (data) => data.levels.flatMap((lv) => lv.units.flatMap((u) => u.lessons.map((l) => ({ lv: lv.id, l }))));

test('Pré-A1 reste entièrement gratuit', () => {
  for (const { lv, l } of lessons(pub).filter((x) => x.lv === 'pre')) assert.ok(l.content, l.id);
});

test('les niveaux A1 à C2 sont verrouillés, sans aucun contenu public', () => {
  const paid = lessons(pub).filter((x) => x.lv !== 'pre' && !x.l.dialogue);
  assert.ok(paid.length > 200);
  for (const { l } of paid) {
    assert.strictEqual(l.content, undefined, l.id);
    assert.strictEqual(l.locked, true, l.id);
    assert.ok(l.title && l.emoji, `${l.id} garde son titre pour le parcours`);
  }
  for (const sc of pub.scenarios) {
    assert.strictEqual(sc.turns, undefined, sc.id);
    assert.ok(sc.locked && sc.title, sc.id);
  }
});

test('tout le contenu retiré se retrouve dans le fichier Premium', () => {
  for (const { lv, l } of lessons(full).filter((x) => x.lv !== 'pre' && x.l.content)) {
    assert.deepStrictEqual(prem.levels[lv].lessons[l.id], l.content, l.id);
  }
  for (const sc of full.scenarios) {
    const lv = full.levels.find((x) => x.code === sc.level).id;
    assert.deepStrictEqual(prem.levels[lv].scenarios[sc.id], sc.turns, sc.id);
  }
});

test('aucun texte payant ne fuit dans le fichier public', () => {
  const text = JSON.stringify(pub);
  const sample = lessons(full).filter((x) => x.lv === 'b2' && x.l.content).slice(0, 5);
  for (const { l } of sample) {
    assert.ok(!text.includes(l.content.examples[0].en), `exemple de ${l.id} visible`);
    assert.ok(!text.includes(l.content.exercises[0].explain), `explication de ${l.id} visible`);
  }
  assert.ok(pub.abonnement && pub.abonnement.essaiJours >= 0 && pub.abonnement.prix.length);
});

test('public/curriculum.json est à jour et suit le réglage actif de abonnement.json', () => {
  assert.deepStrictEqual(committed, config.actif ? pub : full,
    'Lance python3 outils/programme/construire.py puis enregistre public/curriculum.json');
});
