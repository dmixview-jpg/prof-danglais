'use strict';
// =====================================================================
// Statistiques du tableau de bord (fonction statsAdmin), sans dépendance à Firebase.
// Entrées : comptes Firebase Auth (listUsers) et documents users/{uid} (progression).
// Sortie : chiffres agrégés + liste des comptes (les plus récents d'abord), pour admin.html.
// =====================================================================
const JOUR = 86400000;
const NIVEAUX = ['pre', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const jourIso = (t) => new Date(t).toISOString().slice(0, 10);
const enMs = (d) => { const t = d ? Date.parse(d) : NaN; return Number.isFinite(t) ? t : null; };

function statutPremium(claims) {
  const c = claims || {};
  if (Array.isArray(c.revenueCatEntitlements) && c.revenueCatEntitlements.includes('premium')) return 'magasin';
  if (c.stripeRole === 'premium') return 'site';
  return null;
}

// Dernier jour d'activité : jours de pratique enregistrés par l'app, sinon dernière connexion.
function derniereActivite(compte, donnees) {
  const jours = (donnees && Array.isArray(donnees.days)) ? donnees.days.filter((j) => typeof j === 'string').sort() : [];
  const parJours = jours.length ? enMs(`${jours[jours.length - 1]}T12:00:00Z`) : null;
  const meta = compte.metadata || {};
  const parConnexion = enMs(meta.lastRefreshTime) || enMs(meta.lastSignInTime);
  return Math.max(parJours || 0, parConnexion || 0) || null;
}

function calculer(comptes, docs, maintenant = Date.now(), limiteListe = 500) {
  const parUid = new Map(docs.map((d) => [d.uid, d.data || {}]));
  const debut30 = maintenant - 30 * JOUR;
  const inscriptions = {};
  for (let i = 29; i >= 0; i--) inscriptions[jourIso(maintenant - i * JOUR)] = 0;
  const actifsParJour = Object.fromEntries(Object.keys(inscriptions).map((j) => [j, 0]));
  const niveaux = Object.fromEntries(NIVEAUX.map((n) => [n, 0]));
  let verifies = 0; let nouveaux7 = 0; let nouveaux30 = 0; let actifs1 = 0; let actifs7 = 0; let actifs30 = 0;
  let lecons = 0; let premium = 0; let premiumMagasin = 0; let premiumSite = 0;

  const liste = comptes.map((c) => {
    const donnees = (parUid.get(c.uid) || {}).data || {};
    const cree = enMs((c.metadata || {}).creationTime);
    const actif = derniereActivite(c, donnees);
    const statut = statutPremium(c.customClaims);
    const nbLecons = Number.isFinite(donnees.lessons) ? donnees.lessons : 0;
    const niveau = String(donnees.pathLevel || donnees.level || '').toLowerCase();
    if (c.emailVerified) verifies++;
    if (cree && cree >= maintenant - 7 * JOUR) nouveaux7++;
    if (cree && cree >= debut30) { nouveaux30++; const j = jourIso(cree); if (j in inscriptions) inscriptions[j]++; }
    if (actif && actif >= maintenant - JOUR) actifs1++;
    if (actif && actif >= maintenant - 7 * JOUR) actifs7++;
    if (actif && actif >= debut30) actifs30++;
    for (const j of (Array.isArray(donnees.days) ? donnees.days : [])) if (j in actifsParJour) actifsParJour[j]++;
    if (niveau in niveaux) niveaux[niveau]++;
    lecons += nbLecons;
    if (statut) { premium++; if (statut === 'magasin') premiumMagasin++; else premiumSite++; }
    return {
      courriel: c.email || '', nom: (parUid.get(c.uid) || {}).name || c.displayName || '',
      verifie: !!c.emailVerified, desactive: !!c.disabled, admin: !!(c.customClaims || {}).admin,
      inscrit: cree, actif, lecons: nbLecons, niveau: niveau || null,
      joursPratique: Array.isArray(donnees.days) ? donnees.days.length : 0, premium: statut,
    };
  }).sort((a, b) => (b.inscrit || 0) - (a.inscrit || 0));

  return {
    genereLe: maintenant,
    utilisateurs: { total: comptes.length, verifies, nouveaux7, nouveaux30, actifs1, actifs7, actifs30 },
    premium: { total: premium, magasin: premiumMagasin, site: premiumSite, conversion: comptes.length ? premium / comptes.length : 0 },
    apprentissage: { lecons, moyenneParActif: actifs30 ? lecons / actifs30 : 0, niveaux },
    inscriptionsParJour: Object.entries(inscriptions).map(([jour, n]) => ({ jour, n })),
    actifsParJour: Object.entries(actifsParJour).map(([jour, n]) => ({ jour, n })),
    comptes: liste.slice(0, limiteListe),
    tronque: liste.length > limiteListe,
  };
}

module.exports = { calculer, statutPremium, derniereActivite, NIVEAUX };
