'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { calculer, statutPremium } = require('../stats');

const maintenant = Date.parse('2026-11-08T12:00:00Z');
const il = (jours) => new Date(maintenant - jours * 86400000).toUTCString();
const comptes = [
  { uid: 'a', email: 'a@x.ca', emailVerified: true, metadata: { creationTime: il(1), lastSignInTime: il(0.5) }, customClaims: { revenueCatEntitlements: ['premium'] } },
  { uid: 'b', email: 'b@x.ca', emailVerified: false, metadata: { creationTime: il(10), lastSignInTime: il(10) }, customClaims: { admin: true } },
  { uid: 'c', email: 'c@x.ca', emailVerified: true, metadata: { creationTime: il(60), lastSignInTime: il(45) }, customClaims: { stripeRole: 'premium' } },
];
const docs = [
  { uid: 'a', data: { name: 'Ana', data: { lessons: 4, pathLevel: 'A1', days: ['2026-11-07', '2026-11-08'] } } },
  { uid: 'b', data: { data: { lessons: 1, level: 'pre', days: ['2026-10-29'] } } },
];

test('statut Premium : magasin, site ou aucun', () => {
  assert.strictEqual(statutPremium({ revenueCatEntitlements: ['premium'] }), 'magasin');
  assert.strictEqual(statutPremium({ stripeRole: 'premium' }), 'site');
  assert.strictEqual(statutPremium({ admin: true }), null);
  assert.strictEqual(statutPremium(undefined), null);
});

test('chiffres agrégés', () => {
  const s = calculer(comptes, docs, maintenant);
  assert.deepStrictEqual(s.utilisateurs, { total: 3, verifies: 2, nouveaux7: 1, nouveaux30: 2, actifs1: 1, actifs7: 1, actifs30: 2 });
  assert.deepStrictEqual(s.premium, { total: 2, magasin: 1, site: 1, conversion: 2 / 3 });
  assert.strictEqual(s.apprentissage.lecons, 5);
  assert.strictEqual(s.apprentissage.niveaux.a1, 1);
  assert.strictEqual(s.apprentissage.niveaux.pre, 1);
  assert.strictEqual(s.inscriptionsParJour.length, 30);
  assert.strictEqual(s.inscriptionsParJour.reduce((t, x) => t + x.n, 0), 2);
  assert.strictEqual(s.actifsParJour.find((x) => x.jour === '2026-11-08').n, 1);
});

test('liste des comptes : plus récents d’abord, limitée', () => {
  const s = calculer(comptes, docs, maintenant, 2);
  assert.deepStrictEqual(s.comptes.map((c) => c.courriel), ['a@x.ca', 'b@x.ca']);
  assert.strictEqual(s.comptes[0].nom, 'Ana');
  assert.strictEqual(s.comptes[0].premium, 'magasin');
  assert.strictEqual(s.comptes[1].admin, true);
  assert.strictEqual(s.tronque, true);
});

test('aucun compte : pas de division par zéro', () => {
  const s = calculer([], [], maintenant);
  assert.strictEqual(s.premium.conversion, 0);
  assert.strictEqual(s.apprentissage.moyenneParActif, 0);
});
