'use strict';
// =====================================================================
// Accès Premium des abonnés App Store et Google Play.
// RevenueCat encaisse via Apple et Google, puis prévient ce webhook à chaque changement
// (achat, renouvellement, échec de paiement, annulation, expiration, remboursement).
// La fonction relit l'état chez RevenueCat et met à jour :
// - l'attribut revenueCatEntitlements du compte Firebase (lu par firestore.rules) ;
// - le document revenuecat/{uid} (fin de période payée, tableau de bord).
// Remplace l'extension RevenueCat (les extensions Firebase s'arrêtent le 31 mars 2027).
// Secrets (Secret Manager, jamais dans le code) :
// - REVENUECAT_WEBHOOK_SECRET : valeur de l'en-tête Authorization du webhook RevenueCat ;
// - REVENUECAT_API_KEY : clé API secrète RevenueCat (sk_…), lecture des abonnés.
// =====================================================================
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
// API modulaire de firebase-admin (la v14 n'a plus getAuth() ni getFirestore()).
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const rc = require('./revenuecat');

initializeApp();
const SECRET_WEBHOOK = defineSecret('REVENUECAT_WEBHOOK_SECRET');
const CLE_API = defineSecret('REVENUECAT_API_KEY');
const REGION = 'northamerica-northeast1';
const COLLECTION = 'revenuecat';
const DELAI_APPEL = 10 * 1000; // l'app ne peut pas forcer une resynchronisation plus souvent

// Met un compte à jour à partir de l'état réel chez RevenueCat.
async function synchroniser(uid) {
  let utilisateur;
  try {
    utilisateur = await getAuth().getUser(uid);
  } catch (e) {
    // Compte inconnu de Firebase (événement de test, compte supprimé) : rien à faire.
    if (e && (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-uid')) return { ignore: true };
    throw e;
  }
  const abonne = await rc.lireAbonne(uid, CLE_API.value());
  const actifs = rc.droitsActifs(abonne);
  const avant = (utilisateur.customClaims || {}).revenueCatEntitlements;
  if (!rc.memes(avant, actifs)) {
    await getAuth().setCustomUserClaims(uid, rc.nouveauxAttributs(utilisateur.customClaims, actifs));
  }
  await getFirestore().collection(COLLECTION).doc(uid).set({
    ...rc.copiePourFirestore(abonne),
    majLe: FieldValue.serverTimestamp(),
  });
  return { actifs };
}

// Webhook appelé par RevenueCat (Integrations → Webhooks).
exports.revenuecatWebhook = onRequest(
  { region: REGION, secrets: [SECRET_WEBHOOK, CLE_API], maxInstances: 5, memory: '256MiB', timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') { res.set('Allow', 'POST').status(405).send(''); return; }
    if (!rc.autorise(req.get('Authorization'), SECRET_WEBHOOK.value())) {
      logger.warn('Webhook RevenueCat refusé : en-tête Authorization invalide');
      res.status(401).send('');
      return;
    }
    // Événement de test du tableau de bord RevenueCat : le mot de passe est bon, rien d'autre à faire.
    if (req.body && req.body.event && req.body.event.type === 'TEST') { res.status(200).json({ ok: true, test: true }); return; }
    const uids = rc.comptesTouches(req.body);
    try {
      for (const uid of uids) await synchroniser(uid);
      res.status(200).json({ ok: true, comptes: uids.length });
    } catch (e) {
      // 500 : RevenueCat renvoie l'événement plus tard (plusieurs essais).
      logger.error('Synchronisation RevenueCat impossible', { message: e && e.message, code: e && e.code });
      res.status(500).send('');
    }
  },
);

// Appelée par l'app juste après un achat ou une restauration : l'accès s'active sans attendre le webhook.
// Ne concerne que le compte connecté ; l'état vient toujours de RevenueCat, jamais de l'app.
exports.synchroniserMagasin = onCall(
  { region: REGION, secrets: [CLE_API], maxInstances: 5, memory: '256MiB', timeoutSeconds: 30 },
  async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
    const uid = req.auth.uid;
    const ref = getFirestore().collection(COLLECTION).doc(uid);
    const doc = await ref.get();
    const maj = doc.exists && doc.get('majLe');
    if (maj && Date.now() - maj.toMillis() < DELAI_APPEL) return { actifs: rc.droitsActifs(doc.data()) };
    try {
      const { actifs = [] } = await synchroniser(uid);
      return { actifs };
    } catch (e) {
      logger.error('Synchronisation demandée par l’app impossible', { message: e && e.message });
      throw new HttpsError('unavailable', 'Vérification impossible pour le moment. Réessaie dans un instant.');
    }
  },
);
