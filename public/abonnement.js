'use strict';
// =====================================================================
// ABONNEMENT PREMIUM (Stripe, via l'extension Firebase « Run Payments with Stripe »)
// Actif seulement si curriculum.json contient un bloc « abonnement » (voir abonnement.json).
// - Paiement : un document customers/{uid}/checkout_sessions reçoit l'adresse de la page
//   de paiement Stripe ; on y envoie la personne.
// - Statut : l'extension ajoute stripeRole = 'premium' au jeton de connexion des abonnés.
// - Contenu payant : documents contenu/{niveau}, lisibles par les abonnés seulement
//   (firestore.rules), gardés sur l'appareil pour l'usage hors connexion.
// =====================================================================
(function () {
  const CACHE = 'pd.premium';
  const conf = () => (typeof COURSE !== 'undefined' && COURSE && COURSE.abonnement) || null;
  const base = () => location.origin + location.pathname;
  const compte = () => window.PDCompte || null;
  let premium = false;
  // Historique Stripe de la personne : un ancien abonné n'a pas droit à un nouvel essai gratuit,
  // et un paiement en retard se règle en mettant la carte à jour (portail Stripe).
  let historique = { deja: false, retard: false };

  // ---------------------------------------------------------------- Page « Débloque tout »
  const sheet = h('div', { class: 'account-sheet paywall', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'paywall-title' });
  document.body.append(sheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) fermer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) fermer(); });

  function fermer() {
    sheet.hidden = true;
    if (!document.querySelector('.auth:not([hidden]), .account-sheet:not([hidden])')) document.body.classList.remove('auth-open');
  }

  function ouvrir() {
    const c = conf();
    if (!c) return;
    const essai = historique.deja ? 0 : c.essaiJours || 0;
    // Ce que Premium débloque, compté dans le programme (reste juste si on ajoute des leçons)
    const payants = COURSE.levels.filter((l) => !c.gratuit.includes(l.id));
    const etapes = payants.flatMap((l) => l.units.flatMap((u) => u.lessons));
    const n = {
      niveaux: payants.length, de: payants[0].code, a: payants[payants.length - 1].code,
      lecons: etapes.filter((l) => !l.review && !l.dialogue).length,
      bilans: etapes.filter((l) => l.review).length,
      dialogues: COURSE.scenarios.filter((sc) => sc.locked).length,
    };
    let choix = c.prix.find((p) => p.parDefaut) || c.prix[0];
    const note = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
    const tell = (text, kind = 'bad') => { note.hidden = !text; note.textContent = text; note.dataset.kind = kind; };
    const fine = h('p', { class: 'paywall-fine' });
    const cta = h('button', { type: 'button', class: 'btn yellow paywall-cta' });
    const plans = c.prix.map((p) => h('button', {
      type: 'button', class: 'plan', role: 'radio', 'data-id': p.id,
      onclick: () => { choix = p; maj(); },
    },
    h('span', { class: 'plan-name' }, p.nom),
    h('span', { class: 'plan-price' }, p.montant, h('small', null, ` / ${p.periode}`)),
    p.badge ? h('span', { class: 'plan-badge' }, p.badge) : null));
    const plansBox = h('div', { class: 'plans', role: 'radiogroup', 'aria-label': 'Formule' }, ...plans);
    function maj() {
      plans.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === choix.id)));
      if (historique.retard) return;
      cta.textContent = essai ? `Commencer mes ${essai} jours gratuits` : `S’abonner : ${choix.montant} / ${choix.periode}`;
      fine.textContent = `${essai ? `Gratuit pendant ${essai} jours, puis ` : ''}${choix.montant} par ${choix.periode}, renouvelé automatiquement. Annule en tout temps dans « Mon compte ». Paiement sécurisé par Stripe.`;
    }
    maj();

    const pret = compte() && compte().user();
    if (!pret) {
      cta.disabled = true;
      tell('Les abonnements ouvrent bientôt. Merci de ta patience!', 'good');
    }
    if (historique.retard) {
      tell('Ton dernier paiement n’est pas passé. Mets ta carte à jour pour retrouver tout le parcours.');
      cta.textContent = 'Mettre à jour mon paiement';
      plansBox.hidden = true;
      fine.hidden = true;
      cta.addEventListener('click', () => gerer(tell));
    } else cta.addEventListener('click', async () => {
      cta.disabled = true;
      cta.textContent = 'Ouverture du paiement…';
      try {
        await payer(choix, essai);
      } catch (err) {
        tell(err.message || 'Le paiement n’a pas pu s’ouvrir. Réessaie dans un instant.');
        cta.disabled = false;
        maj();
      }
    });

    sheet.replaceChildren(h('div', { class: 'account-card card paywall-card' },
      mascot('happy', 'paywall-buddy'),
      h('h2', { id: 'paywall-title' }, 'Débloque tout le parcours'),
      h('p', { class: 'muted paywall-sub' }, 'Pré-A1 est gratuit. Avec Premium, continue jusqu’à la maîtrise.'),
      h('ul', { class: 'paywall-perks' },
        h('li', null, `📚 ${n.niveaux} niveaux, de ${n.de} à ${n.a} : ${n.lecons} leçons et ${n.bilans} bilans`),
        h('li', null, `🎭 ${n.dialogues} dialogues guidés pour pratiquer de vraies situations`),
        h('li', null, '☁️ Ta progression sur tous tes appareils, même hors connexion')),
      plansBox,
      note, cta, fine,
      h('button', { type: 'button', class: 'btn ghost', onclick: fermer }, 'Plus tard')));
    sheet.hidden = false;
    document.body.classList.add('auth-open');
    cta.focus();
  }

  // Crée la session de paiement Stripe, puis envoie la personne sur la page de paiement.
  async function payer(prix, essai) {
    const { user, db } = { user: compte().user(), db: compte().db() };
    const session = {
      price: prix.id,
      success_url: `${base()}?abonnement=ok`,
      cancel_url: `${base()}?abonnement=annule`,
      allow_promotion_codes: true,
    };
    if (essai) session.trial_period_days = essai;
    const ref = await db.collection('customers').doc(user.uid).collection('checkout_sessions').add(session);
    await new Promise((ok, fail) => {
      const timer = setTimeout(() => { stop(); fail(new Error('Le service de paiement ne répond pas. Vérifie ta connexion, puis réessaie.')); }, 25000);
      const stop = ref.onSnapshot((snap) => {
        const { error, url } = snap.data() || {};
        if (error) { clearTimeout(timer); stop(); fail(new Error(`Paiement impossible : ${error.message}`)); }
        if (url) { clearTimeout(timer); stop(); location.assign(url); ok(); }
      }, (err) => { clearTimeout(timer); fail(new Error(compte().message(err))); });
    });
  }

  // Portail Stripe : changer de carte, de formule, ou annuler.
  async function gerer(tell) {
    try {
      // Nom de la fonction : ext-<identifiant de l'extension>-createPortalLink (abonnement.json)
      const fn = compte().functions(conf().region).httpsCallable(conf().fonctionPortail || 'ext-firestore-stripe-payments-createPortalLink');
      const { data } = await fn({ returnUrl: base(), locale: 'auto' });
      location.assign(data.url);
    } catch {
      tell('Impossible d’ouvrir la gestion de l’abonnement. Vérifie ta connexion, puis réessaie.');
    }
  }

  // Ligne affichée dans le menu « Mon compte »
  function ligneCompte(tell) {
    if (!conf()) return null;
    return premium
      ? h('div', { class: 'account-premium' },
        h('p', null, '⭐ Premium actif. Merci de ton soutien!'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => gerer(tell) }, 'Gérer mon abonnement'))
      : h('button', { type: 'button', class: 'btn yellow', onclick: () => { $('.account-sheet:not(.paywall)').hidden = true; ouvrir(); } }, '⭐ Passer à Premium');
  }

  // ---------------------------------------------------------------- Statut et contenu
  const lireCache = (uid) => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      return c && c.uid === uid ? c.data : null;
    } catch { return null; }
  };
  const coursePret = () => new Promise((ok) => {
    const t = setInterval(() => { if (conf() || (typeof COURSE !== 'undefined' && COURSE)) { clearInterval(t); ok(); } }, 100);
  });
  async function estPremium(user, forcer) {
    const r = await user.getIdTokenResult(forcer);
    return r.claims.stripeRole === 'premium';
  }
  async function lireHistorique(user) {
    const snap = await compte().db().collection('customers').doc(user.uid).collection('subscriptions').get();
    const statuts = snap.docs.map((d) => d.data().status);
    historique = { deja: statuts.length > 0, retard: statuts.some((st) => st === 'past_due' || st === 'unpaid') };
  }
  async function charger(user) {
    const db = compte().db();
    const ids = COURSE.levels.filter((l) => !conf().gratuit.includes(l.id)).map((l) => l.id);
    const docs = await Promise.all(ids.map((id) => db.collection('contenu').doc(id).get()));
    const data = { levels: {} };
    docs.forEach((d, i) => { if (d.exists) data.levels[ids[i]] = d.data(); });
    try { localStorage.setItem(CACHE, JSON.stringify({ uid: user.uid, data })); } catch { /* stockage plein */ }
    applyPremium(data);
  }

  // Retour de la page de paiement : l'extension met quelques secondes à activer l'abonnement.
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
    const params = new URLSearchParams(location.search);
    const retour = params.get('abonnement');
    if (retour) history.replaceState(null, '', base());

    const cache = lireCache(user.uid);
    if (cache) { premium = true; applyPremium(cache); }
    let statut;
    try {
      // En ligne, on redemande le statut à Firebase (abonnement pris ou annulé sur un autre appareil).
      statut = retour === 'ok' ? await attendreActivation(user) : await estPremium(user, navigator.onLine);
    } catch {
      return; // hors connexion : on garde la copie déjà téléchargée
    }
    if (retour === 'annule') toast('Paiement annulé. Tu peux t’abonner quand tu veux.');
    if (retour === 'ok' && !statut) toast('Paiement reçu : l’activation peut prendre une minute. Rouvre l’app dans un instant.');
    premium = statut;
    if (statut) {
      try {
        await charger(user);
        if (retour === 'ok') { toast('Bienvenue dans Premium! Tout le parcours est débloqué. 🎉'); confetti(); }
      } catch { /* hors connexion : la copie locale reste utilisée */ }
    } else if (cache) {
      // Abonnement terminé : on retire le contenu payant de l'appareil.
      try { localStorage.removeItem(CACHE); } catch { /* rien */ }
      location.reload();
    } else {
      await lireHistorique(user).catch(() => {});
    }
  });

  window.PDAbonnement = { ouvrir, ligneCompte, estPremium: () => premium };
})();
