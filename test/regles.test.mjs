// Tests des règles Firestore (firestore.rules) sur l'émulateur Firebase : npm run test:regles
// Il faut Java 11 ou plus récent. Chaque test joue une attaque ou un usage normal.
import test, { before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-prof-danglais',
    firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(() => env && env.cleanup());
beforeEach(() => env.clearFirestore());

const confirme = (uid, extra = {}) => env.authenticatedContext(uid, { email: `${uid}@exemple.com`, email_verified: true, ...extra }).firestore();
const prepare = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

test('Stripe retiré : aucune demande de paiement, d’essai ni de rétractation sur le site', async () => {
  const db = confirme('ana');
  await assertFails(addDoc(collection(db, 'customers', 'ana', 'checkout_sessions'), { price: 'price_x', success_url: 'https://exemple.invalid/' }));
  await assertFails(setDoc(doc(db, 'essais', 'ana'), { le: serverTimestamp() }));
  await assertFails(addDoc(collection(db, 'customers', 'ana', 'retractations'), { abonnement: 'sub_1', pays: 'France', courriel: 'ana@exemple.com', demandeLe: serverTimestamp() }));
  await assertFails(getDoc(doc(db, 'products', 'prod_1')));
});

test('abonnements des magasins : la personne et l’admin au courriel confirmé seulement', async () => {
  await prepare((db) => setDoc(doc(db, 'revenuecat', 'bob'), { entitlements: {} }));
  await assertFails(getDoc(doc(env.authenticatedContext('pirate', { admin: true, email_verified: false }).firestore(), 'revenuecat', 'bob')));
  await assertSucceeds(getDoc(doc(confirme('moi', { admin: true }), 'revenuecat', 'bob')));
  await assertSucceeds(getDoc(doc(confirme('bob'), 'revenuecat', 'bob')));
  await assertFails(getDoc(doc(confirme('ana'), 'revenuecat', 'bob')));
  await assertFails(setDoc(doc(confirme('bob'), 'revenuecat', 'bob'), { entitlements: { premium: {} } }));
});

test('progression : seulement ses données, et seulement les champs prévus', async () => {
  const db = confirme('ana');
  await assertSucceeds(setDoc(doc(db, 'users', 'ana'), { name: 'Ana', data: { progress: {}, vocab: [] }, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, 'users', 'ana'), { data: { progress: {}, gros: 'x' } }));
  await assertFails(setDoc(doc(db, 'users', 'ana'), { stripeRole: 'premium' }));
  await assertFails(getDoc(doc(db, 'users', 'bob')));
});

test('progression : types et tailles limités (pas de document énorme ni de valeur absurde)', async () => {
  const db = confirme('ana');
  const ecrire = (data) => setDoc(doc(db, 'users', 'ana'), { name: 'Ana', data, updatedAt: serverTimestamp() });
  // Ce que l'app envoie vraiment, y compris null pour ce qui n'existe pas encore
  await assertSucceeds(ecrire({ progress: { 'a1.1.1': { stars: 3, at: '2026-11-19' } }, lessons: 12, days: ['2026-11-19'],
    dialogues: { intro: 3 }, vocab: [{ en: 'cat', fr: 'chat' }], level: 'A1', pathLevel: 'a1' }));
  await assertSucceeds(ecrire({ progress: null, lessons: null, days: null, dialogues: null, vocab: null, level: null, pathLevel: null }));
  await assertSucceeds(ecrire({ vocab: Array.from({ length: 3000 }, (_, i) => ({ en: `w${i}` })) }));
  await assertFails(ecrire({ vocab: Array.from({ length: 3001 }, (_, i) => ({ en: `w${i}` })) }));
  await assertFails(ecrire({ vocab: 'x'.repeat(1000) }));
  await assertFails(ecrire({ lessons: 1e300 }));
  await assertFails(ecrire({ lessons: -1 }));
  await assertFails(ecrire({ lessons: '12' }));
  await assertFails(ecrire({ days: Array.from({ length: 401 }, () => '2026-01-01') }));
  await assertFails(ecrire({ level: 'x'.repeat(11) }));
  await assertFails(ecrire({ progress: ['a1.1.1'] }));
});

test('contenu Premium : abonnés seulement', async () => {
  await prepare((db) => setDoc(doc(db, 'contenu', 'b1'), { lessons: {} }));
  await assertFails(getDoc(doc(confirme('ana'), 'contenu', 'b1')));
  await assertFails(getDoc(doc(confirme('ana', { stripeRole: 'premium' }), 'contenu', 'b1')), 'Stripe retiré : stripeRole ne donne plus accès');
  await assertSucceeds(getDoc(doc(confirme('ana', { revenueCatEntitlements: ['premium'] }), 'contenu', 'b1')));
  await assertSucceeds(getDoc(doc(confirme('ana', { admin: true }), 'contenu', 'b1')));
  await assertFails(getDoc(doc(confirme('ana', { admin: 'oui' }), 'contenu', 'b1')));
  await assertFails(setDoc(doc(confirme('ana', { admin: true }), 'contenu', 'b1'), { lessons: {} }));
  await assertFails(setDoc(doc(confirme('ana', { stripeRole: 'premium' }), 'contenu', 'b1'), { lessons: {} }));
});
