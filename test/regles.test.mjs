// Tests des règles Firestore (firestore.rules) sur l'émulateur Firebase : npm run test:regles
// Il faut Java 11 ou plus récent. Chaque test joue une attaque ou un usage normal.
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const conf = JSON.parse(fs.readFileSync(new URL('../outils/programme/abonnement.json', import.meta.url)));
const PRIX = conf.prix[0].id;
// paiementSite=false : seuls Apple et Google encaissent, aucune demande Stripe n'est acceptée
const WEB = conf.paiementSite !== false;
const testWeb = (nom, fn) => test(nom, { skip: !WEB && 'paiement sur le site désactivé' }, fn);
const SITE = conf.sites[0] || 'https://exemple.invalid/';
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
const nonConfirme = (uid) => env.authenticatedContext(uid, { email: `${uid}@exemple.com`, email_verified: false }).firestore();
const session = (extra = {}) => ({ price: PRIX, success_url: `${SITE}?abonnement=ok`, cancel_url: `${SITE}?abonnement=annule`, allow_promotion_codes: true, ...extra });
const commande = (db, uid, data) => addDoc(collection(db, 'customers', uid, 'checkout_sessions'), data);
function avecEssai(db, uid, extra = {}) {
  const b = writeBatch(db);
  b.set(doc(db, 'essais', uid), { le: serverTimestamp() });
  b.set(doc(collection(db, 'customers', uid, 'checkout_sessions')), session({ trial_period_days: conf.essaiJours, ...extra }));
  return b.commit();
}
const prepare = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

testWeb('paiement normal, avec le premier essai gratuit', async () => {
  await assertSucceeds(avecEssai(confirme('ana'), 'ana'));
});
testWeb('paiement normal, sans essai', async () => {
  await assertSucceeds(commande(confirme('ana'), 'ana', session()));
});
test('paiement sur le site désactivé : toute demande Stripe est refusée', { skip: WEB && 'paiement sur le site actif' }, async () => {
  const db = confirme('ana');
  await assertFails(commande(db, 'ana', session()));
  await assertFails(avecEssai(db, 'ana'));
  for (const p of conf.prix) await assertFails(commande(db, 'ana', session({ price: p.id })));
});
test('refusé : courriel pas confirmé', async () => {
  await assertFails(commande(nonConfirme('ana'), 'ana', session()));
});
test('refusé : essai de 730 jours', async () => {
  await assertFails(avecEssai(confirme('ana'), 'ana', { trial_period_days: 730 }));
});
test('refusé : essai sans la marque « essai utilisé »', async () => {
  await assertFails(commande(confirme('ana'), 'ana', session({ trial_period_days: conf.essaiJours })));
});
test('refusé : deuxième essai, une fois la première heure passée', async () => {
  await prepare((db) => setDoc(doc(db, 'essais', 'ana'), { le: Timestamp.fromMillis(Date.now() - 2 * 3600e3) }));
  const db = confirme('ana');
  await assertFails(commande(db, 'ana', session({ trial_period_days: conf.essaiJours })));
  if (WEB) await assertSucceeds(commande(db, 'ana', session()));
});
testWeb('accepté : paiement repris dans l’heure, avec le même essai', async () => {
  await prepare((db) => setDoc(doc(db, 'essais', 'ana'), { le: Timestamp.fromMillis(Date.now() - 10 * 60e3) }));
  await assertSucceeds(commande(confirme('ana'), 'ana', session({ trial_period_days: conf.essaiJours })));
});
test('refusé : effacer ou changer la marque d’essai', async () => {
  await prepare((db) => setDoc(doc(db, 'essais', 'ana'), { le: Timestamp.fromMillis(0) }));
  const db = confirme('ana');
  await assertFails(deleteDoc(doc(db, 'essais', 'ana')));
  await assertFails(updateDoc(doc(db, 'essais', 'ana'), { le: serverTimestamp() }));
});
test('refusé : prix fabriqué (line_items / price_data)', async () => {
  const db = confirme('ana');
  await assertFails(commande(db, 'ana', { ...session(), line_items: [{ price_data: { currency: 'cad', unit_amount: 1, product: 'prod_x', recurring: { interval: 'year' } }, quantity: 1 }] }));
  await assertFails(commande(db, 'ana', session({ price: 'price_inconnu' })));
});
test('refusé : retour du paiement vers un autre site', async () => {
  const db = confirme('ana');
  await assertFails(commande(db, 'ana', session({ success_url: 'https://pirate.example/' })));
  await assertFails(commande(db, 'ana', session({ cancel_url: `https://pirate.example/?${SITE}` })));
});
test('refusé : champs Stripe non prévus (remise, mode, métadonnées)', async () => {
  const db = confirme('ana');
  await assertFails(commande(db, 'ana', session({ promotion_code: 'promo_x' })));
  await assertFails(commande(db, 'ana', session({ mode: 'payment' })));
  await assertFails(commande(db, 'ana', session({ metadata: { a: 1 } })));
});
test('refusé : modifier une demande de paiement déjà créée', async () => {
  const db = confirme('ana');
  const ref = doc(collection(db, 'customers', 'ana', 'checkout_sessions'));
  await prepare((adm) => setDoc(doc(adm, 'customers', 'ana', 'checkout_sessions', ref.id), session()));
  await assertFails(updateDoc(ref, { trial_period_days: 730 }));
});
test('refusé : payer au nom de quelqu’un d’autre', async () => {
  await assertFails(commande(confirme('ana'), 'bob', session()));
});

test('admin : courriel confirmé exigé', async () => {
  await prepare((db) => setDoc(doc(db, 'customers', 'bob', 'subscriptions', 's1'), { status: 'active' }));
  await assertFails(getDoc(doc(env.authenticatedContext('pirate', { admin: true, email_verified: false }).firestore(), 'customers', 'bob', 'subscriptions', 's1')));
  await assertSucceeds(getDoc(doc(confirme('moi', { admin: true }), 'customers', 'bob', 'subscriptions', 's1')));
  await assertFails(getDoc(doc(confirme('ana'), 'customers', 'bob', 'subscriptions', 's1')));
});

test('progression : seulement ses données, et seulement les champs prévus', async () => {
  const db = confirme('ana');
  await assertSucceeds(setDoc(doc(db, 'users', 'ana'), { name: 'Ana', data: { progress: {}, vocab: [] }, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, 'users', 'ana'), { data: { progress: {}, gros: 'x' } }));
  await assertFails(setDoc(doc(db, 'users', 'ana'), { stripeRole: 'premium' }));
  await assertFails(getDoc(doc(db, 'users', 'bob')));
});

test('contenu Premium : abonnés seulement', async () => {
  await prepare((db) => setDoc(doc(db, 'contenu', 'b1'), { lessons: {} }));
  await assertFails(getDoc(doc(confirme('ana'), 'contenu', 'b1')));
  await assertSucceeds(getDoc(doc(confirme('ana', { stripeRole: 'premium' }), 'contenu', 'b1')));
  await assertFails(setDoc(doc(confirme('ana', { stripeRole: 'premium' }), 'contenu', 'b1'), { lessons: {} }));
});

test('rétractation : avec le courriel de son propre compte', async () => {
  const db = confirme('ana');
  const r = (courriel) => addDoc(collection(db, 'customers', 'ana', 'retractations'), { abonnement: 'sub_1', pays: 'France', courriel, demandeLe: serverTimestamp() });
  await assertSucceeds(r('ana@exemple.com'));
  await assertFails(r('autre@exemple.com'));
});

test('les constantes des règles suivent abonnement.json', () => {
  const regles = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  for (const p of conf.prix) assert.strictEqual(regles.includes(`'${p.id}'`), WEB, `prix ${p.id} : lance construire.py`);
  assert.ok(regles.includes(`function essaiJours() { return ${conf.essaiJours}; }`), 'lance construire.py');
});
