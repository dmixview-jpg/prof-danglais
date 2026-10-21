'use strict';
// =====================================================================
// COMPTES UTILISATEURS (Firebase Authentication + Firestore)
// Inactif tant que firebase-config.js n'est pas rempli : l'app marche alors sans comptes.
// La progression reste d'abord sur l'appareil (localStorage), puis se copie dans le compte
// (document users/{uid}). Hors connexion, la personne connectée garde l'app ; tout se
// synchronise au retour d'Internet.
// =====================================================================
(function () {
  const CONFIG = window.PD_FIREBASE;
  if (!CONFIG || !CONFIG.apiKey) return;

  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const OWNER = 'pd.owner'; // compte à qui appartiennent les données de cet appareil
  const PENDING = 'pd.syncPending'; // des changements attendent d'être envoyés
  const SYNCED = {
    progress: KEYS.progress, lessons: KEYS.lessons, days: KEYS.days, dialogues: KEYS.dialogues,
    vocab: KEYS.vocab, level: KEYS.level, pathLevel: KEYS.pathLevel,
  };
  const SYNCED_KEYS = Object.values(SYNCED);

  let auth = null;
  let db = null;
  let user = null;
  let pushTimer = null;
  let isAdmin = false; // marque admin=true (outils/admin/nommer_admin.mjs) : lien vers admin.html
  let pendingName = ''; // prénom saisi à l'inscription, avant que Firebase l'ait enregistré
  const displayName = () => (user && user.displayName) || pendingName || '';

  const MESSAGES = {
    'auth/invalid-email': 'Ce courriel n’est pas valide.',
    'auth/missing-email': 'Écris ton courriel.',
    'auth/missing-password': 'Écris ton mot de passe.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/email-already-in-use': 'Un compte existe déjà avec ce courriel. Connecte-toi plutôt.',
    'auth/invalid-credential': 'Courriel ou mot de passe incorrect.',
    'auth/invalid-login-credentials': 'Courriel ou mot de passe incorrect.',
    'auth/wrong-password': 'Courriel ou mot de passe incorrect.',
    'auth/user-not-found': 'Courriel ou mot de passe incorrect.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/too-many-requests': 'Trop d’essais. Attends quelques minutes, puis réessaie.',
    'auth/network-request-failed': 'Pas de connexion Internet. Connecte-toi au Wi-Fi ou aux données, puis réessaie.',
    'auth/requires-recent-login': 'Par sécurité, déconnecte-toi puis reconnecte-toi, et recommence.',
  };
  const message = (e) => MESSAGES[e && e.code] || 'Une erreur est survenue. Réessaie dans un instant.';

  // ---------------------------------------------------------------- Écran de connexion
  const screen = h('div', { class: 'auth', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'auth-title' });
  const msg = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
  const nameField = h('label', { class: 'field', 'data-only': 'signup' },
    h('span', null, 'Prénom'),
    h('input', { id: 'auth-name', type: 'text', autocomplete: 'given-name', maxlength: '40', enterkeyhint: 'next' }));
  const emailInput = h('input', { id: 'auth-email', type: 'email', autocomplete: 'email', inputmode: 'email', autocapitalize: 'none', spellcheck: 'false', required: true, enterkeyhint: 'next' });
  const passInput = h('input', { id: 'auth-pass', type: 'password', autocomplete: 'current-password', minlength: '6', required: true, enterkeyhint: 'go' });
  const eye = h('button', { type: 'button', class: 'pw-toggle', 'aria-label': 'Afficher le mot de passe' }, 'Afficher');
  eye.addEventListener('click', () => {
    const show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    eye.textContent = show ? 'Masquer' : 'Afficher';
    eye.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  });
  const submit = h('button', { type: 'submit', class: 'btn primary auth-submit' }, 'Se connecter');
  const forgot = h('button', { type: 'button', class: 'auth-link', 'data-only': 'login' }, 'Mot de passe oublié?');
  const hint = h('p', { class: 'auth-hint', 'data-only': 'signup' }, 'Au moins 6 caractères. Ta progression sera sauvegardée dans ton compte et te suivra sur tous tes appareils.');
  const form = h('form', { class: 'auth-form', novalidate: true },
    nameField,
    h('label', { class: 'field' }, h('span', null, 'Courriel'), emailInput),
    h('label', { class: 'field' }, h('span', null, 'Mot de passe'), h('div', { class: 'pw' }, passInput, eye)),
    hint,
    h('label', { class: 'consent', 'data-only': 'signup' },
      h('input', { id: 'auth-consent', type: 'checkbox' }),
      h('span', null, 'J’ai 18 ans ou plus et j’accepte les ',
        h('a', { href: 'conditions.html', target: '_blank', rel: 'noopener' }, 'Conditions d’utilisation et de vente'),
        ' et la ', h('a', { href: 'confidentialite.html', target: '_blank', rel: 'noopener' }, 'Politique de confidentialité'), '.')),
    msg, submit, forgot);
  const tabs = ['login', 'signup'].map((mode) => h('button', {
    type: 'button', role: 'tab', 'data-mode': mode, onclick: () => setMode(mode),
  }, mode === 'login' ? 'Se connecter' : 'Créer un compte'));
  const loading = h('div', { class: 'auth-loading' }, h('span', { class: 'auth-spinner', 'aria-hidden': 'true' }), 'Chargement…');
  const body = h('div', { class: 'auth-body' }, h('div', { class: 'auth-switch', role: 'tablist' }, ...tabs), form);
  screen.append(h('div', { class: 'auth-card' },
    mascot('wave', 'auth-buddy'),
    h('h1', { id: 'auth-title' }, 'Prof d’anglais'),
    h('p', { class: 'auth-sub' }, 'Ton coach d’anglais, de l’alphabet à la maîtrise.'),
    loading, body,
    h('p', { class: 'legal-links' },
      h('a', { href: 'conditions.html', target: '_blank', rel: 'noopener' }, 'Conditions'), ' · ',
      h('a', { href: 'confidentialite.html', target: '_blank', rel: 'noopener' }, 'Confidentialité'))));
  document.body.classList.add('auth-open');
  document.body.append(screen);

  let mode = 'login';
  function setMode(m) {
    mode = m;
    screen.dataset.mode = m;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === m)));
    submit.textContent = m === 'login' ? 'Se connecter' : 'Créer mon compte';
    passInput.autocomplete = m === 'login' ? 'current-password' : 'new-password';
    say('');
  }
  function say(text, kind = 'bad') {
    msg.hidden = !text;
    msg.textContent = text;
    msg.dataset.kind = kind;
  }
  function busy(on) {
    submit.disabled = on;
    submit.textContent = on ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte';
  }
  function showLoading(text = 'Chargement…') {
    loading.lastChild.textContent = text;
    loading.hidden = false;
    body.hidden = true;
    screen.hidden = false;
    document.body.classList.add('auth-open');
  }
  function showForm() {
    loading.hidden = true;
    body.hidden = false;
    screen.hidden = false;
    document.body.classList.add('auth-open');
    setMode(mode);
  }
  function hideScreen() {
    screen.hidden = true;
    document.body.classList.remove('auth-open');
  }
  setMode('login');
  showLoading();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth) return;
    const email = emailInput.value.trim();
    const pass = passInput.value;
    const name = $('#auth-name').value.trim();
    if (mode === 'signup' && !name) return say('Écris ton prénom.');
    if (mode === 'signup' && !$('#auth-consent').checked) return say('Coche la case pour confirmer que tu as 18 ans ou plus et que tu acceptes les conditions.');
    if (!email) return say(MESSAGES['auth/missing-email']);
    if (!pass) return say(MESSAGES['auth/missing-password']);
    busy(true);
    try {
      if (mode === 'login') {
        await auth.signInWithEmailAndPassword(email, pass);
      } else {
        pendingName = name;
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await cred.user.updateProfile({ displayName: name });
        greet(name);
        renderAccount();
        cred.user.sendEmailVerification().catch(() => {});
        // Preuve du consentement : version des textes (date d'entrée en vigueur) et date d'acceptation
        db.collection('users').doc(cred.user.uid).set({
          consent: { version: (window.PD_LEGAL && window.PD_LEGAL.enVigueur) || '', at: firebase.firestore.FieldValue.serverTimestamp() },
        }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      say(message(err));
    } finally {
      busy(false);
    }
  });

  forgot.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) return say('Écris ton courriel ci-dessus, puis touche « Mot de passe oublié? ».');
    try {
      await auth.sendPasswordResetEmail(email);
      say('Si un compte existe pour ce courriel, un lien pour choisir un nouveau mot de passe vient d’être envoyé.', 'good');
    } catch (err) {
      say(err.code === 'auth/user-not-found'
        ? 'Si un compte existe pour ce courriel, un lien pour choisir un nouveau mot de passe vient d’être envoyé.'
        : message(err), err.code === 'auth/user-not-found' ? 'good' : 'bad');
    }
  });

  // ---------------------------------------------------------------- Menu « Mon compte »
  const accountBtn = $('#account-btn');
  const sheet = h('div', { class: 'account-sheet', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'account-title' });
  document.body.append(sheet);
  accountBtn.addEventListener('click', openSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  function renderAccount() {
    if (!user) { accountBtn.hidden = true; return; }
    const label = (displayName() || user.email || '?').trim();
    accountBtn.textContent = label.charAt(0).toUpperCase();
    accountBtn.setAttribute('aria-label', `Mon compte : ${label}`);
    accountBtn.hidden = false;
  }

  function openSheet() {
    const note = h('p', { class: 'auth-msg', role: 'alert', hidden: true });
    const tell = (text, kind = 'bad') => { note.hidden = !text; note.textContent = text; note.dataset.kind = kind; };
    let confirmDelete = false;
    const del = h('button', { type: 'button', class: 'btn ghost account-delete' }, 'Supprimer mon compte');
    del.addEventListener('click', async () => {
      // Un abonnement Stripe continuerait d'être facturé : on demande de l'annuler d'abord.
      if (window.PDAbonnement && window.PDAbonnement.estPremium()) {
        tell('Ton abonnement Premium est actif. Annule-le d’abord avec « Gérer mon abonnement », puis supprime ton compte.');
        return;
      }
      if (!confirmDelete) {
        confirmDelete = true;
        del.textContent = 'Confirmer : tout supprimer définitivement';
        del.classList.add('danger');
        tell('Ton compte et toute ta progression seront effacés. Cette action est définitive.');
        return;
      }
      del.disabled = true;
      let erased = false;
      try {
        await db.collection('users').doc(user.uid).delete();
        erased = true;
        await user.delete();
        forgetDevice();
        location.reload();
      } catch (err) {
        // Firebase demande parfois de se reconnecter avant de supprimer : on remet la progression en ligne.
        if (erased) await push().catch(() => {});
        del.disabled = false;
        tell(message(err));
      }
    });
    const verify = !user.emailVerified
      ? h('p', { class: 'account-verify' }, 'Courriel pas encore confirmé. ',
        h('button', {
          type: 'button', class: 'auth-link',
          onclick: () => user.sendEmailVerification()
            .then(() => tell('Lien de confirmation envoyé. Vérifie ta boîte de réception.', 'good'))
            .catch((err) => tell(message(err))),
        }, 'Renvoyer le lien'))
      : null;
    sheet.replaceChildren(h('div', { class: 'account-card card' },
      h('div', { class: 'account-head' },
        h('span', { class: 'account-avatar', 'aria-hidden': 'true' }, accountBtn.textContent),
        h('div', null,
          h('h2', { id: 'account-title' }, displayName() || 'Mon compte'),
          h('p', { class: 'muted' }, user.email))),
      h('p', { class: 'account-sync' }, syncLabel()),
      verify,
      window.PDAbonnement ? window.PDAbonnement.ligneCompte(tell) : null,
      isAdmin ? h('a', { class: 'btn ghost', href: 'admin.html' }, '📊 Tableau de bord des abonnements') : null,
      note,
      h('button', { type: 'button', class: 'btn primary', onclick: signOut }, 'Se déconnecter'),
      del,
      h('button', { type: 'button', class: 'btn ghost', onclick: closeSheet }, 'Fermer'),
      h('p', { class: 'legal-links' },
        h('a', { href: 'conditions.html', target: '_blank', rel: 'noopener' }, 'Conditions d’utilisation et de vente'), ' · ',
        h('a', { href: 'confidentialite.html', target: '_blank', rel: 'noopener' }, 'Confidentialité'))));
    sheet.hidden = false;
    document.body.classList.add('auth-open');

    async function signOut() {
      if (store.get(PENDING, false) && !navigator.onLine) {
        return tell('Tes derniers progrès ne sont pas encore sauvegardés en ligne. Connecte-toi à Internet, puis déconnecte-toi.');
      }
      await withTimeout(push(), 6000).catch(() => {});
      await auth.signOut();
      forgetDevice();
      location.reload();
    }
  }
  function closeSheet() {
    sheet.hidden = true;
    if (screen.hidden) document.body.classList.remove('auth-open');
    accountBtn.focus();
  }
  function syncLabel() {
    if (store.get(PENDING, false)) return navigator.onLine ? '⏳ Sauvegarde en cours…' : '📴 Hors connexion : ta progression sera sauvegardée au retour d’Internet.';
    return '✅ Progression sauvegardée dans ton compte.';
  }

  // ---------------------------------------------------------------- Synchronisation
  const readLocal = () => {
    const out = {};
    for (const [name, key] of Object.entries(SYNCED)) out[name] = store.get(key, null);
    return out;
  };
  const writeLocal = (data) => {
    for (const [name, key] of Object.entries(SYNCED)) {
      if (data[name] === null || data[name] === undefined) localStorage.removeItem(key);
      else store.set(key, data[name]);
    }
  };
  const clearLocal = () => SYNCED_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch { /* rien */ } });
  function forgetDevice() {
    clearLocal();
    // pd.premium : copie hors ligne du contenu payant (abonnement.js), propre à chaque compte
    try { ['pd.premium', OWNER, PENDING].forEach((k) => localStorage.removeItem(k)); } catch { /* rien */ }
  }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  const docRef = () => db.collection('users').doc(user.uid);

  async function push() {
    if (!user) return;
    store.set(PENDING, true);
    await docRef().set({
      name: displayName(),
      data: readLocal(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }); // merge : garde le consentement enregistré à l'inscription
    store.set(PENDING, false);
  }
  function schedulePush() {
    store.set(PENDING, true);
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push().catch(() => {}), 1500);
  }

  // Associe cet appareil au compte, puis réunit la progression locale et celle du compte.
  async function adopt(u) {
    let remote = null;
    let reached = false;
    try {
      const snap = await withTimeout(db.collection('users').doc(u.uid).get(), 8000);
      remote = snap.exists ? (snap.data().data || null) : null;
      reached = true;
    } catch { /* hors connexion : on continue avec ce qu'il y a sur l'appareil */ }

    const owner = store.get(OWNER, null);
    if (owner && owner !== u.uid) {
      // Une autre personne était connectée sur cet appareil : on repart de ses données à elle.
      if (!reached) {
        showForm();
        say('Pour changer de compte sur cet appareil, connecte-toi une première fois avec Internet.');
        await auth.signOut();
        return false;
      }
      clearLocal();
      store.set(OWNER, u.uid);
      if (remote) writeLocal(PDFusion.merge(null, remote));
      location.reload();
      return false;
    }
    if (!owner) store.set(OWNER, u.uid); // première connexion : la progression déjà faite rejoint le compte

    if (remote) {
      const local = readLocal();
      const merged = PDFusion.merge(local, remote);
      if (!PDFusion.same(merged, remote)) schedulePush();
      if (!PDFusion.same(merged, PDFusion.merge(local, null))) {
        writeLocal(merged);
        location.reload();
        return false;
      }
    } else if (reached || store.get(PENDING, false)) {
      schedulePush();
    }
    return true;
  }

  // ---------------------------------------------------------------- Démarrage
  function loadScript(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = fail;
      document.head.append(s);
    });
  }

  // Accès partagé avec abonnement.js
  window.PDCompte = {
    user: () => user,
    db: () => db,
    functions: (region) => firebase.app().functions(region),
    message,
    forget: forgetDevice,
  };

  ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js', 'firebase-functions-compat.js']
    .reduce((p, f) => p.then(() => loadScript(SDK + f)), Promise.resolve())
    .then(() => {
      firebase.initializeApp(CONFIG);
      auth = firebase.auth();
      auth.languageCode = 'fr';
      db = firebase.firestore();
      store.onSet = (key) => { if (user && SYNCED_KEYS.includes(key)) schedulePush(); };
      window.addEventListener('online', () => { if (user && store.get(PENDING, false)) push().catch(() => {}); });

      auth.onAuthStateChanged(async (u) => {
        user = u;
        renderAccount();
        if (!u) { showForm(); return; }
        showLoading('Récupération de ta progression…');
        if (await adopt(u)) {
          greet(displayName());
          renderAccount();
          hideScreen();
          document.dispatchEvent(new CustomEvent('pd:connecte', { detail: { user: u } }));
          u.getIdTokenResult().then((r) => { isAdmin = !!r.claims.admin; }).catch(() => {});
        }
      });
    })
    .catch(() => {
      showForm();
      body.hidden = true;
      say('Impossible de joindre le service de connexion. Vérifie ta connexion Internet, puis rouvre l’app.');
      loading.hidden = true;
      screen.querySelector('.auth-card').append(msg);
    });
})();
