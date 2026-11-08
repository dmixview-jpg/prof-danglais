'use strict';
const test = require('node:test');
const assert = require('node:assert');
const rc = require('../revenuecat');

const SECRET = 'un-secret-assez-long-pour-le-test';

test('en-tête Authorization : accepté avec ou sans Bearer, refusé sinon', () => {
  assert.ok(rc.autorise(SECRET, SECRET));
  assert.ok(rc.autorise(`Bearer ${SECRET}`, SECRET));
  assert.ok(!rc.autorise('Bearer autre-chose-de-long-123', SECRET));
  assert.ok(!rc.autorise(undefined, SECRET));
  assert.ok(!rc.autorise('', SECRET));
  assert.ok(!rc.autorise(SECRET, 'court'), 'un secret trop court est refusé');
});

test('comptes touchés : uid Firebase seulement, anonymes ignorés, transfert des deux côtés', () => {
  assert.deepStrictEqual(rc.comptesTouches({ event: { type: 'RENEWAL', app_user_id: 'abcDEF123456', original_app_user_id: '$RCAnonymousID:x', aliases: ['abcDEF123456', '../etc'] } }), ['abcDEF123456']);
  assert.deepStrictEqual(rc.comptesTouches({ event: { type: 'TRANSFER', transferred_from: ['ancienCompte1'], transferred_to: ['nouveauCompte2'] } }), ['ancienCompte1', 'nouveauCompte2']);
  assert.deepStrictEqual(rc.comptesTouches({}), []);
  assert.deepStrictEqual(rc.comptesTouches(null), []);
  assert.deepStrictEqual(rc.comptesTouches({ event: { app_user_id: 'a/b/c/d/e/f' } }), []);
});

test('droits actifs : expiration, délai de grâce et achat sans fin', () => {
  const maintenant = Date.parse('2026-11-06T12:00:00Z');
  const abonne = { entitlements: {
    premium: { expires_date: '2026-12-06T12:00:00Z' },
    expire: { expires_date: '2026-11-01T12:00:00Z' },
    grace: { expires_date: '2026-11-05T12:00:00Z', grace_period_expires_date: '2026-11-10T12:00:00Z' },
    avie: { expires_date: null },
  } };
  assert.deepStrictEqual(rc.droitsActifs(abonne, maintenant), ['avie', 'grace', 'premium']);
  assert.deepStrictEqual(rc.droitsActifs({}, maintenant), []);
});

test('attributs du jeton : les autres rôles sont conservés, le droit retiré à l’expiration', () => {
  assert.deepStrictEqual(rc.nouveauxAttributs({ admin: true, stripeRole: 'premium' }, ['premium']),
    { admin: true, stripeRole: 'premium', revenueCatEntitlements: ['premium'] });
  assert.deepStrictEqual(rc.nouveauxAttributs({ admin: true, revenueCatEntitlements: ['premium'] }, []), { admin: true });
  assert.ok(rc.memes(['b', 'a'], ['a', 'b']));
  assert.ok(!rc.memes(undefined, ['premium']));
});

test('lecture chez RevenueCat : clé secrète envoyée, erreur si la réponse est mauvaise', async () => {
  let vu;
  const ok = async (url, opts) => { vu = { url, opts }; return { ok: true, json: async () => ({ subscriber: { entitlements: {} } }) }; };
  await rc.lireAbonne('abcDEF123456', 'sk_test', ok);
  assert.strictEqual(vu.url, 'https://api.revenuecat.com/v1/subscribers/abcDEF123456');
  assert.strictEqual(vu.opts.headers.Authorization, 'Bearer sk_test');
  await assert.rejects(rc.lireAbonne('abcDEF123456', 'sk', async () => ({ ok: false, status: 401 })));
  await assert.rejects(rc.lireAbonne('abcDEF123456', 'sk', async () => ({ ok: true, json: async () => ({}) })));
});

test('copie Firestore : champs utiles seulement, aucun jeton d’achat', () => {
  const copie = rc.copiePourFirestore({
    entitlements: { premium: { expires_date: 'x', product_identifier: 'premium_mensuel', purchase_token: 'secret' } },
    subscriptions: { premium_mensuel: { store: 'play_store', is_sandbox: true, store_transaction_id: 'T', expires_date: 'x' } },
    subscriber_attributes: { $email: { value: 'a@b.c', updated_at_ms: 1 }, $phone: { value: '555' } },
    other_purchases: { x: {} },
  });
  assert.deepStrictEqual(copie.entitlements, { premium: { expires_date: 'x', product_identifier: 'premium_mensuel' } });
  assert.deepStrictEqual(copie.subscriptions, { premium_mensuel: { store: 'play_store', is_sandbox: true, expires_date: 'x' } });
  assert.deepStrictEqual(copie.subscriber_attributes, { $email: { value: 'a@b.c' } });
  assert.strictEqual(copie.other_purchases, undefined);
});
