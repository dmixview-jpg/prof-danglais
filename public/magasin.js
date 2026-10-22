'use strict';
// =====================================================================
// ACHATS DANS L'APP (App Store et Google Play), avec RevenueCat
// Dans les apps installées depuis les magasins, Apple et Google exigent leur propre système de
// paiement pour débloquer du contenu : Stripe n'y est jamais proposé.
// - RevenueCat gère les achats des deux magasins ; l'identifiant client est l'uid Firebase.
// - Son extension Firebase ajoute revenueCatEntitlements = ['premium'] au jeton de connexion,
//   que firestore.rules accepte comme stripeRole = 'premium' (même contenu, même compte).
// - Clés publiques des SDK dans abonnement.json (magasins.ios, magasins.android).
// Sur le Web, ce module ne fait rien.
// =====================================================================
(function () {
  const C = window.Capacitor;
  const natif = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  const plateforme = natif ? C.getPlatform() : 'web';
  const Purchases = natif && C.Plugins ? C.Plugins.Purchases : null;
  const NOM = plateforme === 'ios' ? 'l’App Store' : 'Google Play';
  const COMPTE = plateforme === 'ios' ? 'ton identifiant Apple' : 'ton compte Google Play';
  const LIENS = {
    ios: { gerer: 'https://apps.apple.com/account/subscriptions', rembourser: 'https://reportaproblem.apple.com' },
    android: { gerer: 'https://play.google.com/store/account/subscriptions', rembourser: 'https://support.google.com/googleplay/answer/2479637' },
  };
  const conf = () => (typeof COURSE !== 'undefined' && COURSE && COURSE.abonnement) || {};
  const cle = () => ((conf().magasins || {})[plateforme]) || '';
  const droit = () => (conf().magasins || {}).droit || 'premium';
  let configure = null;

  // Les vues Web natives ignorent target="_blank" : les pages légales s'ouvrent dans l'app, et
  // Capacitor ouvre les adresses externes (Apple, Google, autorités…) dans le navigateur.
  if (natif) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[target="_blank"]');
      if (!a) return;
      e.preventDefault();
      location.href = new URL(a.href, location.href).href;
    });
  }

  const actif = () => !!(Purchases && cle());

  // Une seule configuration par lancement ; un changement de compte passe par logIn.
  // Le courriel du compte est donné à RevenueCat pour reconnaître l'abonné dans le tableau de bord.
  async function connecter(uid, courriel) {
    if (!actif()) return;
    if (!configure) configure = Purchases.configure({ apiKey: cle(), appUserID: uid }).then(() => uid);
    const deja = await configure;
    if (deja !== uid) {
      await Purchases.logIn({ appUserID: uid });
      configure = Promise.resolve(uid);
    }
    if (courriel) await Purchases.setEmail({ email: courriel }).catch(() => {});
  }

  // Formules du magasin, avec le prix local fourni par Apple ou Google (devise et taxes du pays).
  async function offres() {
    const { current } = await Purchases.getOfferings();
    const paquets = (current && current.availablePackages) || [];
    return paquets
      .filter((p) => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL')
      .map((p) => {
        const annuel = p.packageType === 'ANNUAL';
        const intro = p.product.introPrice;
        const libre = p.product.defaultOption && p.product.defaultOption.freePhase;
        return {
          id: p.identifier, paquet: p, nom: annuel ? 'Annuel' : 'Mensuel', periode: annuel ? 'an' : 'mois',
          montant: p.product.priceString, badge: annuel ? rabais(paquets, p) : null, parDefaut: annuel,
          essai: !!((intro && intro.price === 0) || libre),
        };
      })
      .sort((a, b) => (a.periode === 'mois' ? -1 : 1) - (b.periode === 'mois' ? -1 : 1));
  }

  // Rabais de la formule annuelle, calculé sur les prix du magasin (ils varient selon le pays).
  function rabais(paquets, annuel) {
    const mensuel = paquets.find((x) => x.packageType === 'MONTHLY');
    const m = mensuel && mensuel.product.price;
    const a = annuel.product.price;
    if (!(m > 0 && a > 0)) return null;
    const pct = Math.round((1 - a / (m * 12)) * 100);
    return pct >= 5 ? `≈ ${pct} % de rabais` : null;
  }

  const actifDans = (info) => !!(info && info.entitlements && info.entitlements.active && info.entitlements.active[droit()]);

  // Achat : la feuille de paiement d'Apple ou de Google s'ouvre. Renvoie false si la personne annule.
  async function acheter(offre) {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: offre.paquet });
      return actifDans(customerInfo);
    } catch (err) {
      // Erreur brute du pont natif : le code peut être sur l'erreur ou dans err.data (1 = annulé)
      const d = (err && err.data) || {};
      if (err && (err.userCancelled || d.userCancelled || String(err.code) === '1' || String(d.code) === '1')) return false;
      throw new Error(`Achat impossible : ${(err && err.message) || 'réessaie dans un instant.'}`);
    }
  }

  async function restaurer() {
    const { customerInfo } = await Purchases.restorePurchases();
    return actifDans(customerInfo);
  }

  // Gestion et annulation : réglages d'abonnement du magasin.
  async function gerer() {
    let url = LIENS[plateforme].gerer;
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      if (customerInfo && customerInfo.managementURL) url = customerInfo.managementURL;
    } catch { /* lien général du magasin */ }
    location.href = url;
  }

  window.PDMagasin = {
    natif, plateforme, NOM, COMPTE, actif, connecter, offres, acheter, restaurer, gerer,
    lienRemboursement: () => (LIENS[plateforme] || {}).rembourser,
  };
})();
