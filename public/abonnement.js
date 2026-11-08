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
  let source = null; // 'web' (Stripe), 'magasin' (App Store, Google Play) ou 'admin' (accès complet sans abonnement)
  // Historique Stripe de la personne : un ancien abonné n'a pas droit à un nouvel essai gratuit,
  // et un paiement en retard se règle en mettant la carte à jour (portail Stripe).
  let historique = { deja: false, retard: false, recent: null, retractation: null };
  // Droit de rétractation (Union européenne, EEE, Royaume-Uni) : 14 jours après l'abonnement.
  const DELAI_RETRACTATION = 14;
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
  let finPayee = null; // fin de la période payée (Stripe ou magasin), lue en ligne
  let aConfirmer = false;
  // Marque « essai utilisé » (essais/{uid}) : un paiement abandonné peut être repris pendant une heure.
  const ESSAI_REPRISE = 3600000;
  let essaiLe = null;
  const PAYS_RETRACTATION = ['Allemagne', 'Autriche', 'Belgique', 'Bulgarie', 'Chypre', 'Croatie', 'Danemark', 'Espagne',
    'Estonie', 'Finlande', 'France', 'Grèce', 'Hongrie', 'Irlande', 'Islande', 'Italie', 'Lettonie', 'Liechtenstein',
    'Lituanie', 'Luxembourg', 'Malte', 'Norvège', 'Pays-Bas', 'Pologne', 'Portugal', 'République tchèque', 'Roumanie',
    'Royaume-Uni', 'Slovaquie', 'Slovénie', 'Suède'];
  const enDate = (v) => {
    if (!v) return null;
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const jourLong = (d) => d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

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
    // Retard de paiement et essai déjà utilisé : abonnements Stripe seulement (le magasin gère les siens)
    const retard = !M && historique.retard;
    let prix = c.prix;
    if (M) prix = M.actif() ? await M.offres().catch(() => []) : [];
    const essaiDe = (p) => (M ? (p && p.essai ? c.essaiJours || 0 : 0) : historique.deja ? 0 : c.essaiJours || 0);
    // Ce que Premium débloque, compté dans le programme (reste juste si on ajoute des leçons)
    const payants = COURSE.levels.filter((l) => !c.gratuit.includes(l.id));
    const etapes = payants.flatMap((l) => l.units.flatMap((u) => u.lessons));
    const n = {
      niveaux: payants.length, de: payants[0].code, a: payants[payants.length - 1].code,
      lecons: etapes.filter((l) => !l.review && !l.dialogue).length,
      bilans: etapes.filter((l) => l.review).length,
      dialogues: COURSE.scenarios.filter((sc) => sc.locked).length,
    };
    // Site Web sans paiement (paiementSite=false) : on s'abonne dans l'app, puis on se connecte ici.
    if (!M && c.paiementSite === false) return ouvrirSite(c, n, prix);
    let choix = prix.find((p) => p.parDefaut) || prix[0] || null;
    const note = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
    const tell = (text, kind = 'bad') => { note.hidden = !text; note.textContent = text; note.dataset.kind = kind; };
    const fine = h('p', { class: 'paywall-fine' });
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
      if (retard) return;
      if (!choix) { cta.textContent = 'S’abonner'; fine.hidden = true; return; }
      const essai = essaiDe(choix);
      cta.textContent = essai ? `Commencer mes ${essai} jours gratuits` : `S’abonner : ${choix.montant} / ${choix.periode}`;
      const debut = `${essai ? `Gratuit pendant ${essai} jours, puis ` : ''}${choix.montant} par ${choix.periode}`;
      fine.textContent = M
        ? `${debut}, renouvelé automatiquement. Paiement par ${M.NOM}, avec ${M.COMPTE}. Annule en tout temps dans les réglages d’abonnement de ${M.NOM}, au moins 24 heures avant le renouvellement.`
        : `${debut}, taxes comprises, renouvelé automatiquement. Annule en tout temps dans « Mon compte ». Paiement sécurisé par Stripe.`;
    }
    maj();

    const pret = compte() && compte().user() && choix;
    if (!pret) {
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
    if (retard) {
      tell('Ton dernier paiement n’est pas passé. Mets ta carte à jour pour retrouver tout le parcours.');
      cta.textContent = 'Mettre à jour mon paiement';
      plansBox.hidden = true;
      fine.hidden = true;
      cta.addEventListener('click', () => gerer(tell));
    } else cta.addEventListener('click', async () => {
      cta.disabled = true;
      cta.textContent = M ? 'Ouverture de l’achat…' : 'Ouverture du paiement…';
      try {
        if (!M) return await payer(choix, essaiDe(choix));
        if (await M.acheter(choix)) return activerApresAchat();
        cta.disabled = false; // achat annulé par la personne
        maj();
      } catch (err) {
        tell(err.message || 'Le paiement n’a pas pu s’ouvrir. Réessaie dans un instant.');
        cta.disabled = false;
        maj();
      }
    });
    const restaurer = M && M.actif() ? h('button', {
      type: 'button', class: 'auth-link paywall-restore',
      onclick: async (e) => {
        const btn = e.currentTarget; // currentTarget redevient null après le premier await
        btn.disabled = true;
        try {
          if (await M.restaurer()) return activerApresAchat();
          tell(`Aucun abonnement actif trouvé avec ${M.COMPTE}.`);
        } catch {
          tell('Impossible de vérifier tes achats. Vérifie ta connexion, puis réessaie.');
        }
        btn.disabled = false;
      },
    }, 'Restaurer mes achats') : null;

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
      h('p', { class: 'paywall-fine' }, 'En t’abonnant, tu acceptes les ',
        h('a', { href: M ? 'conditions.html#magasins' : 'conditions.html#premium', target: '_blank', rel: 'noopener' }, 'conditions de vente'),
        M ? ' et la ' : ' (renouvellement, annulation, remboursements). Europe et Royaume-Uni : 14 jours pour te rétracter.',
        M ? h('a', { href: 'confidentialite.html', target: '_blank', rel: 'noopener' }, 'politique de confidentialité') : null,
        M ? '.' : null),
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
          tell('Aucun abonnement actif sur ce compte. Dans l’app, vérifie que tu es connecté avec le même courriel.');
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

  // Crée la session de paiement Stripe, puis envoie la personne sur la page de paiement.
  async function payer(prix, essai) {
    const { user, db } = { user: compte().user(), db: compte().db() };
    // Courriel confirmé exigé par les règles Firestore : les reçus doivent arriver à la bonne personne.
    await user.reload();
    if (!user.emailVerified) {
      user.sendEmailVerification().catch(() => {});
      throw new Error(`Confirme d’abord ton courriel : clique sur le lien envoyé à ${user.email}, puis réessaie.`);
    }
    await user.getIdToken(true);
    const session = {
      price: prix.id,
      success_url: `${base()}?abonnement=ok`,
      cancel_url: `${base()}?abonnement=annule`,
      allow_promotion_codes: true,
    };
    if (essai) session.trial_period_days = essai;
    // Stripe Tax : TVA, TPS/TVQ, GST… calculées selon le pays du client (abonnement.json)
    if (conf().taxesAutomatiques) session.automatic_tax = true;
    const ref = db.collection('customers').doc(user.uid).collection('checkout_sessions').doc();
    if (essai && !essaiLe) {
      // Premier essai : la marque et la demande partent ensemble (les règles l'exigent)
      const lot = db.batch();
      lot.set(db.collection('essais').doc(user.uid), { le: firebase.firestore.FieldValue.serverTimestamp() });
      lot.set(ref, session);
      await lot.commit();
      essaiLe = new Date();
    } else {
      await ref.set(session);
    }
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
  // Abonnement pris dans un magasin : ses réglages d'abonnement.
  async function gerer(tell) {
    const M = magasin();
    if (source === 'magasin' && M) return M.gerer();
    if (source === 'magasin') return tell('Ton abonnement a été pris dans l’App Store ou Google Play : gère-le dans les réglages d’abonnement de ton téléphone.');
    if (M) return tell('Ton abonnement a été pris sur le site Web : gère-le depuis le site, dans « Mon compte ».');
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
    const ligne = premium && source === 'admin'
      ? h('div', { class: 'account-premium' }, h('p', null, '🔑 Accès complet : compte administrateur.'))
      : premium
      ? h('div', { class: 'account-premium' },
        h('p', null, '⭐ Premium actif. Merci de ton soutien!'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => gerer(tell) }, 'Gérer mon abonnement'),
        source === 'magasin' && magasin() ? h('a', { class: 'auth-link account-retract', href: magasin().lienRemboursement(), target: '_blank', rel: 'noopener' }, `Demander un remboursement à ${magasin().NOM}`) : null)
      : h('button', { type: 'button', class: 'btn yellow', onclick: () => { $('.account-sheet:not(.paywall)').hidden = true; ouvrir(); } }, '⭐ Passer à Premium');
    const r = historique.retractation;
    const recu = r && enDate(r.demandeLe);
    const retract = r
      ? h('p', { class: 'account-retract muted' }, `Demande de rétractation reçue${recu ? ` le ${jourLong(recu)}` : ''}. Nous te répondons par courriel.`)
      : finRetractation()
        ? h('button', { type: 'button', class: 'auth-link account-retract', onclick: () => { $('.account-sheet:not(.paywall)').hidden = true; retracter(); } }, 'Me rétracter du contrat')
        : null;
    return retract ? h('div', { class: 'account-sub' }, ligne, retract) : ligne;
  }

  // ---------------------------------------------------------------- Droit de rétractation
  // Date limite pour se rétracter de l'abonnement le plus récent, ou null si le délai est passé.
  function finRetractation() {
    const sub = historique.recent;
    const debut = sub && enDate(sub.created);
    if (!debut || !['trialing', 'active', 'past_due'].includes(sub.status)) return null;
    const fin = new Date(debut.getTime() + DELAI_RETRACTATION * JOUR);
    return fin > new Date() ? fin : null;
  }

  // Fonction de rétractation en deux étapes (directive européenne 2023/2673) : on confirme,
  // puis un accusé de réception s'affiche avec la date et l'heure de la demande.
  function retracter() {
    const sub = historique.recent;
    const fin = finRetractation();
    if (!sub || !fin) return;
    const essai = sub.status === 'trialing';
    const note = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
    const pays = h('select', { id: 'retract-pays', required: true },
      h('option', { value: '' }, 'Choisis ton pays'),
      ...PAYS_RETRACTATION.map((p) => h('option', { value: p }, p)),
      h('option', { value: 'Autre pays' }, 'Autre pays'));
    const confirmer = h('button', { type: 'submit', class: 'btn primary' }, 'Confirmer la rétractation');
    const form = h('form', { class: 'auth-form retract-form', novalidate: true },
      h('label', { class: 'field' }, h('span', null, 'Pays de résidence'), pays),
      note, confirmer);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!pays.value) { note.hidden = false; note.textContent = 'Choisis ton pays de résidence.'; return; }
      confirmer.disabled = true;
      confirmer.textContent = 'Envoi…';
      const user = compte().user();
      try {
        await compte().db().collection('customers').doc(user.uid).collection('retractations').add({
          abonnement: sub.id, pays: pays.value, courriel: user.email || '',
          demandeLe: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch {
        note.hidden = false;
        note.textContent = 'La demande n’a pas pu être envoyée. Vérifie ta connexion, puis réessaie.';
        confirmer.disabled = false;
        confirmer.textContent = 'Confirmer la rétractation';
        return;
      }
      const maintenant = new Date();
      historique.retractation = { demandeLe: maintenant };
      const autre = pays.value === 'Autre pays';
      sheet.replaceChildren(h('div', { class: 'account-card card paywall-card' },
        h('h2', { id: 'paywall-title' }, 'Demande de rétractation reçue'),
        h('p', null, `Reçue le ${jourLong(maintenant)} à ${maintenant.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}.`),
        h('p', { class: 'muted' }, autre
          ? `Nous l’examinons selon la loi de ton pays et te répondons par courriel à ${user.email}.`
          : `Nous te confirmons la rétractation par courriel à ${user.email}. Ton abonnement sera arrêté${essai ? ' sans aucun prélèvement' : ' et les montants payés te seront remboursés dans les 14 jours, sur ton moyen de paiement'}.`),
        h('button', { type: 'button', class: 'btn primary', onclick: fermer }, 'Fermer')));
    });
    sheet.replaceChildren(h('div', { class: 'account-card card paywall-card' },
      h('h2', { id: 'paywall-title' }, 'Me rétracter du contrat'),
      h('p', null, `Ton abonnement a commencé le ${jourLong(enDate(sub.created))}. Si tu habites dans l’Union européenne, l’EEE ou au Royaume-Uni, tu peux te rétracter jusqu’au ${jourLong(fin)}, sans donner de raison.`),
      h('p', { class: 'muted' }, essai
        ? 'Tu es encore dans ton essai gratuit : ton abonnement sera arrêté et rien ne sera prélevé.'
        : 'Ton abonnement sera arrêté et les montants payés te seront remboursés. Ailleurs, la demande est examinée selon la loi de ton pays.'),
      form,
      h('p', { class: 'paywall-fine' }, 'Détails : ', h('a', { href: 'conditions.html#retractation', target: '_blank', rel: 'noopener' }, 'droit de rétractation'), '.'),
      h('button', { type: 'button', class: 'btn ghost', onclick: fermer }, 'Annuler')));
    sheet.hidden = false;
    document.body.classList.add('auth-open');
    pays.focus();
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
  // Premium par Stripe (site Web) ou par un magasin (RevenueCat) : un seul compte, le même accès.
  async function estPremium(user, forcer) {
    const { claims } = await user.getIdTokenResult(forcer);
    const droit = (conf().magasins || {}).droit || 'premium';
    const web = claims.stripeRole === 'premium';
    const app = Array.isArray(claims.revenueCatEntitlements) && claims.revenueCatEntitlements.includes(droit);
    // Administrateur (marque admin=true) : tout le parcours, sans abonnement. Les règles Firestore font la même vérification.
    const admin = claims.admin === true && claims.email_verified === true;
    source = web ? 'web' : app ? 'magasin' : admin ? 'admin' : null;
    return web || app || admin;
  }
  async function lireHistorique(user) {
    const db = compte().db();
    const client = db.collection('customers').doc(user.uid);
    const [subs, retr, marque, rc] = await Promise.all([client.collection('subscriptions').get(), client.collection('retractations').get(),
      db.collection('essais').doc(user.uid).get(), db.collection('revenuecat').doc(user.uid).get().catch(() => null)]);
    essaiLe = marque.exists ? enDate(marque.data().le) : null;
    const liste = subs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const statuts = liste.map((x) => x.status);
    const recent = liste.sort((a, b) => (enDate(b.created) || 0) - (enDate(a.created) || 0))[0] || null;
    const retractation = (recent && retr.docs.map((d) => d.data()).find((x) => x.abonnement === recent.id)) || null;
    // Essai déjà utilisé : la marque essais/{uid} a plus d'une heure (les règles Firestore refusent alors tout nouvel essai)
    const essaiPasse = !!essaiLe && Date.now() - essaiLe.getTime() > ESSAI_REPRISE;
    // Fin de la période payée : abonnement Stripe actif ou en essai, ou droit d'accès du magasin
    const fins = liste.filter((x) => x.status === 'active' || x.status === 'trialing').map((x) => enDate(x.current_period_end));
    const droitMagasin = rc && rc.exists && ((rc.data().entitlements || {})[(conf().magasins || {}).droit || 'premium']);
    if (droitMagasin) fins.push(enDate(droitMagasin.grace_period_expires_date) || enDate(droitMagasin.expires_date));
    const valides = fins.filter(Boolean).map((d) => d.getTime());
    finPayee = valides.length ? Math.max(...valides) : null;
    historique = { deja: statuts.length > 0 || essaiPasse, retard: statuts.some((st) => st === 'past_due' || st === 'unpaid'), recent, retractation };
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
    if (magasin()) magasin().connecter(user.uid, user.email).catch(() => {});

    const cache = lireCache(user.uid);
    const valide = copieValide(cache);
    if (valide) { premium = true; applyPremium(cache.data); }
    aConfirmer = !!cache && !valide;
    let statut;
    try {
      // En ligne, on redemande le statut à Firebase (abonnement pris ou annulé sur un autre appareil).
      statut = retour === 'ok' ? await attendreActivation(user) : await estPremium(user, navigator.onLine);
    } catch {
      // Hors connexion : la copie déjà téléchargée reste utilisée, si elle a été vérifiée il y a moins de 30 jours.
      if (aConfirmer) toast(MSG_CONFIRMER);
      return;
    }
    if (retour === 'annule') toast('Paiement annulé. Tu peux t’abonner quand tu veux.');
    if (retour === 'ok' && !statut) toast('Paiement reçu : l’activation peut prendre une minute. Rouvre l’app dans un instant.');
    premium = statut;
    await lireHistorique(user).catch(() => {});
    if (statut) {
      try {
        await charger(user);
        aConfirmer = false;
        if (retour === 'ok') { toast('Bienvenue dans Premium! Tout le parcours est débloqué. 🎉'); confetti(); }
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
