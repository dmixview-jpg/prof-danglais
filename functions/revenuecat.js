'use strict';
// =====================================================================
// Logique RevenueCat, sans dépendance à Firebase (testée par test/revenuecat.test.js).
// Principe de sécurité : on ne croit jamais le contenu d'un webhook. Il sert seulement de
// signal « ce compte a changé » ; l'état réel est relu chez RevenueCat avec la clé secrète,
// côté serveur. Un message forgé ou rejoué ne peut donc donner aucun accès, et l'ordre
// d'arrivée des événements n'a pas d'importance.
// =====================================================================
const crypto = require('node:crypto');

// Comparaison en temps constant de l'en-tête Authorization (avec ou sans « Bearer »).
function autorise(entete, secret) {
  if (typeof entete !== 'string' || typeof secret !== 'string' || secret.length < 16) return false;
  const recu = entete.replace(/^Bearer\s+/i, '').trim();
  const a = crypto.createHash('sha256').update(recu).digest();
  const b = crypto.createHash('sha256').update(secret.trim()).digest();
  return crypto.timingSafeEqual(a, b);
}

// Identifiants Firebase plausibles : l'app configure RevenueCat avec l'uid du compte.
// Les identifiants anonymes de RevenueCat ($RCAnonymousID:…) sont ignorés.
const UID = /^[A-Za-z0-9_-]{6,128}$/;
const estUid = (x) => typeof x === 'string' && UID.test(x);

// Comptes à resynchroniser pour un événement (un transfert touche l'ancien et le nouveau compte).
function comptesTouches(corps) {
  const ev = corps && typeof corps === 'object' ? corps.event : null;
  if (!ev || typeof ev !== 'object') return [];
  const liste = ev.type === 'TRANSFER'
    ? [].concat(ev.transferred_from || [], ev.transferred_to || [])
    : [ev.app_user_id, ev.original_app_user_id].concat(Array.isArray(ev.aliases) ? ev.aliases : []);
  return [...new Set(liste.filter(estUid))].slice(0, 10);
}

const enMs = (d) => {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : null;
};

// Droits d'accès actifs maintenant : pas encore expirés, délai de grâce de facturation compris.
// expires_date absent = achat sans fin (aucun n'est vendu, mais RevenueCat le permet).
function droitsActifs(abonne, maintenant = Date.now()) {
  const droits = (abonne && abonne.entitlements) || {};
  return Object.keys(droits).filter((nom) => {
    const d = droits[nom] || {};
    if (!d.expires_date) return true;
    const fin = Math.max(enMs(d.expires_date) || 0, enMs(d.grace_period_expires_date) || 0);
    return fin > maintenant;
  }).sort();
}

// Nouveaux attributs du jeton : on garde ceux des autres sources (admin, stripeRole…).
function nouveauxAttributs(actuels, actifs) {
  const suite = { ...(actuels || {}) };
  if (actifs.length) suite.revenueCatEntitlements = actifs;
  else delete suite.revenueCatEntitlements;
  return suite;
}

const memes = (a, b) => JSON.stringify((a || []).slice().sort()) === JSON.stringify((b || []).slice().sort());

// Lecture de l'état réel chez RevenueCat (API REST v1, clé secrète).
async function lireAbonne(uid, cleApi, fetchFn = fetch) {
  const rep = await fetchFn(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${cleApi}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!rep.ok) throw new Error(`RevenueCat a répondu ${rep.status}`);
  const corps = await rep.json();
  if (!corps || typeof corps.subscriber !== 'object') throw new Error('Réponse RevenueCat inattendue');
  return corps.subscriber;
}

// Copie gardée dans Firestore (revenuecat/{uid}) : seulement les champs que l'app et le tableau
// de bord lisent. Rien de sensible (pas de reçu, pas de jeton d'achat).
function copiePourFirestore(abonne) {
  const garder = (o, champs) => Object.fromEntries(champs.filter((c) => o[c] !== undefined).map((c) => [c, o[c]]));
  const droits = {};
  for (const [nom, d] of Object.entries(abonne.entitlements || {})) {
    droits[nom] = garder(d || {}, ['expires_date', 'grace_period_expires_date', 'product_identifier', 'purchase_date']);
  }
  const abonnements = {};
  for (const [id, s] of Object.entries(abonne.subscriptions || {})) {
    abonnements[id] = garder(s || {}, ['expires_date', 'grace_period_expires_date', 'purchase_date', 'original_purchase_date',
      'period_type', 'store', 'is_sandbox', 'unsubscribe_detected_at', 'billing_issues_detected_at', 'refunded_at']);
  }
  const courriel = abonne.subscriber_attributes && abonne.subscriber_attributes.$email;
  return {
    entitlements: droits,
    subscriptions: abonnements,
    subscriber_attributes: courriel && typeof courriel.value === 'string' ? { $email: { value: courriel.value } } : {},
    first_seen: abonne.first_seen || null,
  };
}

module.exports = { autorise, estUid, comptesTouches, droitsActifs, nouveauxAttributs, memes, lireAbonne, copiePourFirestore };
