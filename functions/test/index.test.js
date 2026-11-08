'use strict';
// Vérifie que index.js n'utilise que l'API modulaire de firebase-admin (la v14 a retiré admin.auth()).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('API modulaire de firebase-admin seulement', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
  assert.ok(!/\badmin\.(auth|firestore)\b/.test(src), 'admin.auth() / admin.firestore() n’existent plus en v14');
  assert.strictEqual(typeof require('firebase-admin/auth').getAuth, 'function');
  assert.strictEqual(typeof require('firebase-admin/firestore').getFirestore, 'function');
});

test('événement de test RevenueCat : 200 sans toucher à Firebase', async () => {
  process.env.REVENUECAT_WEBHOOK_SECRET = 'un-secret-assez-long-pour-le-test';
  process.env.REVENUECAT_API_KEY = 'sk_test';
  process.env.GCLOUD_PROJECT = 'demo-test';
  const { revenuecatWebhook } = require('../index.js');
  const rep = { code: 0, set() { return rep; }, status(c) { rep.code = c; return rep; }, send() { return rep; }, json() { return rep; } };
  const req = (auth) => ({ method: 'POST', body: { event: { type: 'TEST', app_user_id: 'abcdef123456' } }, get: () => auth });
  await revenuecatWebhook(req('Bearer mauvais-secret-de-test-123'), rep);
  assert.strictEqual(rep.code, 401);
  await revenuecatWebhook(req('un-secret-assez-long-pour-le-test'), rep);
  assert.strictEqual(rep.code, 200);
});
