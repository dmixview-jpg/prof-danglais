'use strict';
// =====================================================================
// ABONNEMENT PREMIUM : achats intégrés de l'App Store et de Google Play (RevenueCat, magasin.js)
// Actif seulement si curriculum.json contient un bloc « abonnement » (voir abonnement.json).
// - Paiement : dans les apps seulement. Apple et Google encaissent ; le site Web renvoie vers les apps.
// - Statut : la fonction revenuecatWebhook (functions/) ajoute revenueCatEntitlements au jeton.
// - Contenu payant : documents contenu/{niveau}, lisibles par les abonnés seulement
//   (firestore.rules), gardés sur l'appareil pour l'usage hors connexion.
// =====================================================================
(function () {
  const CACHE = 'pd.premium';
  const conf = () => (typeof COURSE !== 'undefined' && COURSE && COURSE.abonnement) || null;
  const compte = () => window.PDCompte || null;
  let premium = false;
  let source = null; // 'magasin' (App Store, Google Play) ou 'admin' (accès complet sans abonnement)
  const JOUR = 86400000;
  // Copie hors connexion du contenu Premium : valable 30 jours après la dernière vérification en
  // ligne de l'abonnement. Ensuite, il faut se connecter à Internet une fois pour la garder.
  const HORS_LIGNE_MAX = 30 * JOUR;
  // La copie ne dépasse jamais la fin de la période payée (mois en cours), plus 3 jours de marge
  // pour un renouvellement fait hors connexion. Un abonné qui ne paie plus perd donc l'accès
  // à la fin de son mois, même s'il reste hors ligne.
  const MARGE_RENOUVELLEMENT = 3 * JOUR;
  // Horloge reculée sur l'appareil pour prolonger la copie : elle n'est plus valide.
  const RECUL_TOLERE = 10 * 60000;
  let finPayee = null; // fin de la période payée dans le magasin, lue en ligne
  let aConfirmer = false;
  const enDate = (v) => {
    if (!v) return null;
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // ---------------------------------------------------------------- Page « Débloque tout »
  const sheet = h('div', { class: 'account-sheet paywall', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'paywall-title' });
  document.body.append(sheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) fermer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) fermer(); });

  function fermer() {
    sheet.hidden = true;
    if (!document.querySelector('.auth:not([hidden]), .account-sheet:not([hidden])')) document.body.classList.remove('auth-open');
  }

  // Dans les apps des magasins (App Store, Google Play) : achats intégrés seulement (magasin.js)
  const magasin = () => (window.PDMagasin && window.PDMagasin.natif ? window.PDMagasin : null);

  async function ouvrir() {
    const c = conf();
    if (!c) return;
    const M = magasin();
    let prix = c.prix;
    if (M) prix = M.actif() ? await M.offres().catch(() => []) : [];
    // Essai : seulement si le magasin confirme que la personne y a droit, avec sa vraie durée
    // (règle 3.1.2(c) d'Apple). Un ancien abonné voit donc directement le prix.
    const essaiDe = (p) => (p && p.essai ? p.essaiJours || c.essaiJours || 0 : 0);
    // Ce que Premium débloque, compté dans le programme (reste juste si on ajoute des leçons)
    const payants = COURSE.levels.filter((l) => !c.gratuit.includes(l.id));
    const etapes = payants.flatMap((l) => l.units.flatMap((u) => u.lessons));
    const n = {
      niveaux: payants.length, de: payants[0].code, a: payants[payants.length - 1].code,
      lecons: etapes.filter((l) => !l.review && !l.dialogue).length,
      bilans: etapes.filter((l) => l.review).length,
      dialogues: COURSE.scenarios.filter((sc) => sc.locked).length,
    };
    // Site Web : on s'abonne dans l'app, puis on se connecte ici avec le même compte.
    if (!M) return ouvrirSite(c, n, prix);
    let choix = prix.find((p) => p.parDefaut) || prix[0] || null;
    const note = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
    const tell = (text, kind = 'bad') => { note.hidden = !text; note.textContent = text; note.dataset.kind = kind; };
    const fine = h('p', { class: 'paywall-fine' });
    // Prix du renouvellement, en caractères lisibles juste sous le bouton (règle 3.1.2(c) d'Apple)
    const prixLigne = h('p', { class: 'paywall-price' });
    const confirmer = aConfirmer && !navigator.onLine;
    const cta = h('button', { type: 'button', class: 'btn yellow paywall-cta' });
    const plans = prix.map((p) => h('button', {
      type: 'button', class: 'plan', role: 'radio', 'data-id': p.id,
      onclick: () => { choix = p; maj(); },
    },
    h('span', { class: 'plan-name' }, p.nom),
    h('span', { class: 'plan-price' }, p.montant, h('small', null, ` / ${p.periode}`)),
    p.badge ? h('span', { class: 'plan-badge' }, p.badge) : null));
    const plansBox = h('div', { class: 'plans', role: 'radiogroup', 'aria-label': 'Formule' }, ...plans);
    function maj() {
      plans.forEach((b) => b.setAttribute('aria-checked', String(!!choix && b.dataset.id === choix.id)));
      if (!choix) { cta.textContent = 'S’abonner'; fine.hidden = true; prixLigne.hidden = true; return; }
      const essai = essaiDe(choix);
      cta.textContent = essai ? `Commencer mes ${essai} jours gratuits` : `S’abonner : ${choix.montant} / ${choix.periode}`;
      const debut = `${essai ? `Gratuit pendant ${essai} jours, puis ` : ''}${choix.montant} par ${choix.periode}`;
      prixLigne.textContent = `${debut}. Sans engagement.`;
      fine.textContent = `${debut}, renouvelé automatiquement. Paiement par ${M.NOM}, avec ${M.COMPTE}. Annule à tout moment dans les réglages d’abonnement de ${M.NOM}, au moins 24 heures avant le renouvellement.`;
    }
    maj();

    // Sans compte (essai sans compte) : l'abonnement suit le compte sur tous les appareils,
    // il faut donc d'abord en créer un, gratuitement.
    const sansCompte = !!(compte() && !compte().user() && compte().connexion);
    const pret = compte() && compte().user() && choix;
    if (sansCompte && choix) {
      tell('Crée ton compte gratuit pour t’abonner : ton abonnement et ta progression te suivront sur tous tes appareils.', 'good');
    } else if (!pret) {
      cta.disabled = true;
      tell('Les abonnements ouvrent bientôt. Merci de ta patience!', 'good');
    }
    // Abonné hors connexion depuis plus de 30 jours : pas besoin de payer, seulement de se connecter
    if (confirmer) {
      tell(MSG_CONFIRMER, 'good');
      cta.disabled = true;
      cta.textContent = 'Connexion Internet requise';
      plansBox.hidden = true;
      fine.hidden = true;
    }
    cta.addEventListener('click', async () => {
      if (sansCompte) { fermer(); compte().connexion('signup'); return; }
      cta.disabled = true;
      cta.textContent = 'Ouverture de l’achat…';
      try {
        if (await M.acheter(choix)) return activerApresAchat();
        cta.disabled = false; // achat annulé par la personne
        maj();
      } catch (err) {
        tell(err.message || 'Le paiement n’a pas pu s’ouvrir. Vérifie ta connexion, puis réessaie.');
        cta.disabled = false;
        maj();
      }
    });
    // Toujours visible dans l'app des magasins (exigé par Apple et Google), même avant l'ouverture des ventes.
    const restaurer = h('button', {
      type: 'button', class: 'auth-link paywall-restore',
      onclick: async (e) => {
        const btn = e.currentTarget; // currentTarget redevient null après le premier await
        if (!M.actif()) return tell('Les abonnements ouvrent bientôt. Merci de ta patience!', 'good');
        if (sansCompte) { fermer(); compte().connexion('login'); return; }
        btn.disabled = true;
        try {
          if (await M.restaurer()) return activerApresAchat();
          tell(`Aucun abonnement actif trouvé avec ${M.COMPTE}.`);
        } catch {
          tell('Impossible de vérifier tes achats. Vérifie ta connexion, puis réessaie.');
        }
        btn.disabled = false;
      },
    }, 'Restaurer mes achats');

    sheet.replaceChildren(h('div', { class: 'account-card card paywall-card' },
      mascot('happy', 'paywall-buddy'),
      h('h2', { id: 'paywall-title' }, 'Débloque tout le parcours'),
      h('p', { class: 'muted paywall-sub' }, 'Pré-A1 est gratuit. Avec Premium, continue jusqu’à la maîtrise.'),
      h('ul', { class: 'paywall-perks' },
        h('li', null, `📚 ${n.niveaux} niveaux, de ${n.de} à ${n.a} : ${n.lecons} leçons et ${n.bilans} bilans`),
        h('li', null, `🎭 ${n.dialogues} dialogues guidés pour pratiquer de vraies situations`),
        h('li', null, '☁️ Ta progression sur tous tes appareils, même hors connexion')),
      plansBox,
      note, cta, prixLigne, fine,
      h('p', { class: 'paywall-fine' }, 'En t’abonnant, tu acceptes les ',
        h('a', { href: 'conditions.html#magasins', target: '_blank', rel: 'noopener' }, 'conditions de vente'),
        ' et la ', h('a', { href: 'confidentialite.html', target: '_blank', rel: 'noopener' }, 'politique de confidentialité'), '.'),
      restaurer,
      h('button', { type: 'button', class: 'btn ghost', onclick: fermer }, 'Plus tard')));
    sheet.hidden = false;
    document.body.classList.add('auth-open');
    cta.focus();
  }

  // Page « Débloque tout » du site Web quand les abonnements se prennent seulement dans les apps :
  // Apple et Google encaissent, relancent les paiements refusés et versent les revenus.
  function ouvrirSite(c, n, prix) {
    const note = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
    const tell = (text, kind = 'bad') => { note.hidden = !text; note.textContent = text; note.dataset.kind = kind; };
    const liens = c.liensMagasins || {};
    const magasins = [
      liens.ios ? h('a', { class: 'btn primary', href: liens.ios, target: '_blank', rel: 'noopener' }, '📱 App Store (iPhone, iPad)') : null,
      liens.android ? h('a', { class: 'btn primary', href: liens.android, target: '_blank', rel: 'noopener' }, '▶ Google Play (Android)') : null,
    ].filter(Boolean);
    const user = compte() && compte().user();
    const verifier = user ? h('button', {
      type: 'button', class: 'auth-link paywall-restore',
      onclick: async (e) => {
        const btn = e.currentTarget; // currentTarget redevient null après le premier await
        btn.disabled = true;
        try {
          await synchroniserMagasin();
          if (await estPremium(user, true)) return activerApresAchat();
          tell('Aucun abonnement actif sur ce compte. Dans l’app, vérifie que tu es connecté avec la même adresse e-mail.');
        } catch {
          tell('Impossible de vérifier ton abonnement. Vérifie ta connexion, puis réessaie.');
        }
        btn.disabled = false;
      },
    }, 'Je suis déjà abonné : vérifier') : null;
    sheet.replaceChildren(h('div', { class: 'account-card card paywall-card' },
      mascot('happy', 'paywall-buddy'),
      h('h2', { id: 'paywall-title' }, 'Débloque tout le parcours'),
      h('p', { class: 'muted paywall-sub' }, 'Pré-A1 est gratuit. Avec Premium, continue jusqu’à la maîtrise.'),
      h('ul', { class: 'paywall-perks' },
        h('li', null, `📚 ${n.niveaux} niveaux, de ${n.de} à ${n.a} : ${n.lecons} leçons et ${n.bilans} bilans`),
        h('li', null, `🎭 ${n.dialogues} dialogues guidés pour pratiquer de vraies situations`),
        h('li', null, '☁️ Ta progression sur tous tes appareils, même hors connexion')),
      h('p', null, h('strong', null, 'Abonne-toi dans l’app Prof d’anglais'), ' sur ton iPhone, ton iPad ou ton téléphone Android',
        prix.length ? ` (${prix.map((p) => `${p.montant} / ${p.periode}`).join(' ou ')}, ou l’équivalent dans ta devise)` : '',
        '. Ensuite, connecte-toi ici avec le même compte : tout le parcours se débloque aussi sur le site.'),
      ...magasins,
      magasins.length ? null : h('p', { class: 'auth-msg', 'data-kind': 'good' }, 'L’app arrive bientôt dans l’App Store et Google Play.'),
      h('p', { class: 'paywall-fine' }, 'Le paiement, les renouvellements et les remboursements sont gérés par Apple ou Google. ',
        h('a', { href: 'conditions.html#premium', target: '_blank', rel: 'noopener' }, 'Conditions de vente')),
      note, verifier,
      h('button', { type: 'button', class: 'btn ghost', onclick: fermer }, 'Plus tard')));
    sheet.hidden = false;
    document.body.classList.add('auth-open');
    (sheet.querySelector('a.btn') || sheet.querySelector('button')).focus();
  }

  // Demande au serveur de relire l'abonnement chez RevenueCat (fonction synchroniserMagasin).
  // Sans réponse, le webhook RevenueCat active quand même l'accès quelques secondes plus tard.
  async function synchroniserMagasin() {
    const m = conf().magasins || {};
    try {
      await compte().functions(m.region || 'northamerica-northeast1').httpsCallable(m.fonction || 'synchroniserMagasin')();
    } catch { /* le webhook prend le relais */ }
  }

  // Après un achat dans le magasin : le serveur relit l'abonnement chez RevenueCat et active l'accès.
  async function activerApresAchat() {
    fermer();
    const user = compte().user();
    await synchroniserMagasin();
    if (!(await attendreActivation(user))) {
      toast('Achat reçu : l’activation peut prendre une minute. Rouvre l’app dans un instant.');
      return;
    }
    premium = true;
    try {
      await charger(user);
      toast('Bienvenue dans Premium! Tout le parcours est débloqué. 🎉');
      confetti();
    } catch { /* hors connexion : réessai au prochain lancement */ }
  }

  // Gérer l'abonnement : réglages d'abonnement de l'App Store ou de Google Play.
  async function gerer(tell) {
    const M = magasin();
    if (M) return M.gerer();
    return tell('Ton abonnement a été pris dans l’App Store ou Google Play : gère-le dans les réglages d’abonnement de ton téléphone.');
  }

  // Ligne affichée dans le menu « Mon compte »
  function ligneCompte(tell) {
    if (!conf()) return null;
    const ligne = premium && source === 'admin'
      ? h('div', { class: 'account-premium' }, h('p', null, '🔑 Accès complet : compte administrateur.'))
      : premium
      ? h('div', { class: 'account-premium' },
        h('p', null, '⭐ Premium actif. Merci de ton soutien!'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => gerer(tell) }, 'Gérer mon abonnement'),
        source === 'magasin' && magasin() ? h('a', { class: 'auth-link account-retract', href: magasin().lienRemboursement(), target: '_blank', rel: 'noopener' }, `Demander un remboursement à ${magasin().NOM}`) : null)
      : h('button', { type: 'button', class: 'btn yellow', onclick: () => { $('.account-sheet:not(.paywall)').hidden = true; ouvrir(); } }, '⭐ Passer à Premium');
    return ligne;
  }

  // ---------------------------------------------------------------- Statut et contenu
  const MSG_CONFIRMER = 'Connecte-toi à Internet pour confirmer ton abonnement Premium : c’est nécessaire au moins une fois tous les 30 jours.';
  const lireCache = (uid) => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (!c || c.uid !== uid) return null;
      if (!c.verifieLe) { // copie d'une version précédente : le délai commence maintenant
        c.verifieLe = Date.now();
        localStorage.setItem(CACHE, JSON.stringify(c));
      }
      return c;
    } catch { return null; }
  };
  // Copie hors connexion encore utilisable : vérifiée en ligne il y a moins de 30 jours, période
  // payée pas encore terminée (plus la marge), et horloge de l'appareil pas reculée.
  function copieValide(c) {
    if (!c) return false;
    const now = Date.now();
    if (c.vuLe && now < c.vuLe - RECUL_TOLERE) return false;
    if (now - c.verifieLe >= HORS_LIGNE_MAX) return false;
    if (c.jusqua && now >= c.jusqua + MARGE_RENOUVELLEMENT) return false;
    if (!c.vuLe || now > c.vuLe) {
      c.vuLe = now;
      try { localStorage.setItem(CACHE, JSON.stringify(c)); } catch { /* rien */ }
    }
    return true;
  }
  const coursePret = () => new Promise((ok) => {
    const t = setInterval(() => { if (conf() || (typeof COURSE !== 'undefined' && COURSE)) { clearInterval(t); ok(); } }, 100);
  });
  // Premium pris dans un magasin (RevenueCat) : le même accès dans l'app et sur le site.
  async function estPremium(user, forcer) {
    const { claims } = await user.getIdTokenResult(forcer);
    const droit = (conf().magasins || {}).droit || 'premium';
    const app = Array.isArray(claims.revenueCatEntitlements) && claims.revenueCatEntitlements.includes(droit);
    // Administrateur (marque admin=true) : tout le parcours, sans abonnement. Les règles Firestore font la même vérification.
    const admin = claims.admin === true && claims.email_verified === true;
    source = app ? 'magasin' : admin ? 'admin' : null;
    return app || admin;
  }
  // Fin de la période payée (copie revenuecat/{uid}) : la copie hors connexion ne la dépasse pas.
  async function lireFinPayee(user) {
    const rc = await compte().db().collection('revenuecat').doc(user.uid).get().catch(() => null);
    const droit = rc && rc.exists && ((rc.data().entitlements || {})[(conf().magasins || {}).droit || 'premium']);
    const fin = droit && (enDate(droit.grace_period_expires_date) || enDate(droit.expires_date));
    finPayee = fin ? fin.getTime() : null;
  }
  async function charger(user) {
    const db = compte().db();
    const ids = COURSE.levels.filter((l) => !conf().gratuit.includes(l.id)).map((l) => l.id);
    const docs = await Promise.all(ids.map((id) => db.collection('contenu').doc(id).get()));
    const data = { levels: {} };
    docs.forEach((d, i) => { if (d.exists) data.levels[ids[i]] = d.data(); });
    // verifieLe : l'abonnement vient d'être confirmé en ligne (le contenu vient de Firebase)
    const now = Date.now();
    try { localStorage.setItem(CACHE, JSON.stringify({ uid: user.uid, data, verifieLe: now, vuLe: now, jusqua: finPayee })); } catch { /* stockage plein */ }
    applyPremium(data);
  }

  // Après un achat : le webhook ou synchroniserMagasin met quelques secondes à activer l'accès.
  async function attendreActivation(user) {
    toast('Activation de ton abonnement…');
    for (let i = 0; i < 12; i++) {
      if (await estPremium(user, true).catch(() => false)) return true;
      await new Promise((ok) => setTimeout(ok, 2500));
    }
    return false;
  }

  document.addEventListener('pd:connecte', async (e) => {
    const user = e.detail.user;
    await coursePret();
    if (!conf()) return;
    if (magasin()) magasin().connecter(user.uid, user.email).catch(() => {});

    const cache = lireCache(user.uid);
    const valide = copieValide(cache);
    if (valide) { premium = true; applyPremium(cache.data); }
    aConfirmer = !!cache && !valide;
    let statut;
    try {
      // En ligne, on redemande le statut à Firebase (abonnement pris ou annulé sur un autre appareil).
      statut = await estPremium(user, navigator.onLine);
    } catch {
      // Hors connexion : la copie déjà téléchargée reste utilisée, si elle a été vérifiée il y a moins de 30 jours.
      if (aConfirmer) toast(MSG_CONFIRMER);
      return;
    }
    premium = statut;
    await lireFinPayee(user).catch(() => {});
    if (statut) {
      try {
        await charger(user);
        aConfirmer = false;
      } catch {
        // hors connexion (jeton encore valide en mémoire) : la copie locale reste utilisée
        if (aConfirmer) toast(MSG_CONFIRMER);
      }
    } else if (cache) {
      // Abonnement terminé : on retire le contenu payant de l'appareil.
      aConfirmer = false;
      try { localStorage.removeItem(CACHE); } catch { /* rien */ }
      if (valide) location.reload();
    }
  });

  window.PDAbonnement = { ouvrir, ligneCompte, estPremium: () => premium };
})();
