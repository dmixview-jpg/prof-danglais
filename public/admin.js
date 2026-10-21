'use strict';
// Tableau de bord des abonnements (admin.html), réservé aux comptes marqués admin=true.
// Lit en lecture seule les abonnements que l'extension Stripe recopie dans Firestore
// (customers/{uid}/subscriptions/{id}) ; firestore.rules en interdit l'accès aux autres comptes.
(function () {
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const CONFIG = window.PD_FIREBASE;
  const $ = (sel) => document.querySelector(sel);
  let auth = null;
  let db = null;
  let rows = [];
  let customers = {};
  let retractations = [];
  let filter = 'all';

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  }
  const show = (id) => ['state', 'login', 'dash'].forEach((x) => { $(`#${x}`).hidden = x !== id; });
  function state(text, ...extra) {
    $('#state').replaceChildren(h('p', null, text), ...extra);
    show('state');
  }

  // ---------------------------------------------------------------- Mise en forme
  const DAY = 86400000;
  function toDate(v) {
    if (!v) return null;
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const date = (v) => { const d = toDate(v); return d ? d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; };
  const money = (cents, cur = 'cad') => (cents / 100).toLocaleString('fr-CA', { style: 'currency', currency: cur.toUpperCase() });
  function plan(r) {
    const pr = (r.items && r.items[0] && r.items[0].price) || {};
    const interval = pr.recurring && pr.recurring.interval;
    const cents = typeof pr.unit_amount === 'number' ? pr.unit_amount : null;
    return {
      nom: interval === 'year' ? 'Annuel' : interval === 'month' ? 'Mensuel' : 'Formule',
      cents, interval, cur: pr.currency || 'cad',
      mensuel: cents == null ? 0 : interval === 'year' ? cents / 12 : interval === 'month' ? cents : 0,
      texte: cents == null ? '' : `${money(cents, pr.currency)} / ${interval === 'year' ? 'an' : 'mois'}`,
    };
  }
  const STATUS = {
    active: ['Actif', 'good'], trialing: ['En essai', 'info'], past_due: ['Paiement en retard', 'warn'],
    unpaid: ['Impayé', 'bad'], canceled: ['Annulé', 'off'], incomplete: ['Paiement incomplet', 'warn'],
    incomplete_expired: ['Expiré', 'off'], paused: ['En pause', 'off'],
  };
  const late = (r) => r.status === 'past_due' || r.status === 'unpaid';
  const ending = (r) => (r.status === 'active' || r.status === 'trialing') && r.cancel_at_period_end;
  const email = (r) => (customers[r.uid] && customers[r.uid].email) || r.courriel || `Compte ${r.uid.slice(0, 8)}…`;
  function stripeLink(r) {
    const c = customers[r.uid] || {};
    return c.stripeLink || (c.stripeId ? `https://dashboard.stripe.com/customers/${c.stripeId}` : null);
  }
  function nextLine(r) {
    if (r.status === 'trialing') return `${r.cancel_at_period_end ? 'Essai sans suite, se termine' : 'Fin de l’essai'} le ${date(r.trial_end)}`;
    if (r.status === 'canceled' || r.status === 'incomplete_expired') return `Terminé le ${date(r.ended_at || r.canceled_at)}`;
    if (late(r)) return `En retard depuis le ${date(r.current_period_start)}`;
    if (r.cancel_at_period_end) return `Se termine le ${date(r.cancel_at || r.current_period_end)}`;
    return `Prochain paiement le ${date(r.current_period_end)}`;
  }

  // ---------------------------------------------------------------- Affichage
  function render() {
    const now = Date.now();
    const active = rows.filter((r) => r.status === 'active');
    const trials = rows.filter((r) => r.status === 'trialing');
    const soon = trials.filter((r) => { const d = toDate(r.trial_end); return d && d - now < 3 * DAY && !r.cancel_at_period_end; });
    const mrr = active.reduce((s, r) => s + plan(r).mensuel, 0);
    const recent = rows.filter((r) => r.status === 'canceled' && now - (toDate(r.ended_at || r.canceled_at) || 0) < 30 * DAY);
    const kpi = (label, value, sub, tone = '') => h('div', { class: `kpi card ${tone}` },
      h('span', { class: 'kpi-label' }, label), h('span', { class: 'kpi-value' }, value), h('span', { class: 'kpi-sub' }, sub));
    $('#kpis').replaceChildren(
      kpi('Abonnés payants', String(active.length), ((n) => `dont ${n} annuel${n > 1 ? 's' : ''}`)(active.filter((r) => plan(r).interval === 'year').length)),
      kpi('Essais en cours', String(trials.length), soon.length ? `${soon.length} ${soon.length > 1 ? 'se terminent' : 'se termine'} d’ici 3 jours` : 'aucun ne se termine d’ici 3 jours'),
      kpi('Revenu mensuel récurrent', money(Math.round(mrr)), `≈ ${money(Math.round(mrr * 12))} par an, avant frais Stripe`),
      kpi('Paiements en retard', String(rows.filter(late).length), 'Stripe réessaie automatiquement', rows.some(late) ? 'alert' : ''),
      kpi('Annulations prévues', String(rows.filter(ending).length), 'accès gardé jusqu’à la fin de la période'),
      kpi('Départs (30 jours)', String(recent.length), 'abonnements terminés'));

    const todo = [
      ...retractations.filter((x) => !x.traiteLe).map((x) => ({
        r: x, icon: '↩️', fait: x,
        text: `Rétractation demandée le ${date(x.demandeLe)} (${x.pays}). ${x.pays === 'Autre pays' ? 'Vérifie si la loi de son pays l’impose. ' : ''}Dans Stripe : annule l’abonnement et rembourse, puis confirme par courriel.`,
      })),
      ...rows.filter(late).map((r) => ({ r, icon: '⚠️', text: `Paiement en retard (${plan(r).texte || plan(r).nom}). Stripe réessaie ; écris à la personne si ça dure.` })),
      ...soon.map((r) => ({ r, icon: '⏳', text: `Fin de l’essai le ${date(r.trial_end)} : premier paiement de ${plan(r).texte || plan(r).nom}.` })),
      ...rows.filter(ending).map((r) => ({ r, icon: '👋', text: `A demandé l’annulation : accès jusqu’au ${date(r.cancel_at || r.current_period_end || r.trial_end)}.` })),
    ];
    $('#todo').replaceChildren(...(todo.length ? todo.map(({ r, icon, text, fait }) => h('li', null,
      h('span', { class: 'todo-icon', 'aria-hidden': 'true' }, icon),
      h('span', { class: 'todo-text' }, h('strong', null, email(r)), ' ', text),
      stripeLink(r) ? h('a', { href: stripeLink(r), target: '_blank', rel: 'noopener', class: 'todo-link' }, 'Stripe ↗') : null,
      fait ? h('button', { type: 'button', class: 'todo-link todo-done', onclick: (e) => traiter(fait, e.currentTarget) }, 'Marquer comme traitée') : null))
      : [h('li', { class: 'todo-empty' }, 'Rien à signaler. 🎉')]));

    const FILTERS = [['all', 'Tous', () => true], ['active', 'Actifs', (r) => r.status === 'active'], ['trialing', 'Essais', (r) => r.status === 'trialing'],
      ['late', 'En retard', late], ['canceled', 'Terminés', (r) => r.status === 'canceled' || r.status === 'incomplete_expired']];
    $('#filters').replaceChildren(...FILTERS.map(([id, label, test]) => h('button', {
      type: 'button', class: `chip${filter === id ? ' on' : ''}`, 'aria-pressed': String(filter === id),
      onclick: () => { filter = id; render(); },
    }, `${label} · ${rows.filter(test).length}`)));
    const list = rows.filter(FILTERS.find(([id]) => id === filter)[2])
      .sort((a, b) => (toDate(b.created) || 0) - (toDate(a.created) || 0));
    $('#subs').replaceChildren(...(list.length ? list.map((r) => {
      const [label, tone] = STATUS[r.status] || [r.status, 'off'];
      const p = plan(r);
      return h('article', { class: 'sub' },
        h('div', { class: 'sub-main' }, h('strong', { class: 'sub-email' }, email(r)), h('span', { class: 'muted' }, `Depuis le ${date(r.created)}`)),
        h('div', { class: 'sub-plan' }, h('span', null, p.nom), h('span', { class: 'muted' }, p.texte)),
        h('div', { class: 'sub-status' }, h('span', { class: `pill ${tone}` }, label), ending(r) ? h('span', { class: 'pill off' }, 'Annulation demandée') : null),
        h('div', { class: 'sub-next muted' }, nextLine(r)),
        stripeLink(r) ? h('a', { class: 'btn ghost small sub-link', href: stripeLink(r), target: '_blank', rel: 'noopener' }, 'Stripe ↗') : h('span'));
    }) : [h('p', { class: 'muted subs-empty' }, rows.length ? 'Aucun abonnement dans cette catégorie.' : 'Aucun abonnement pour l’instant. Ils apparaîtront ici dès le premier essai.')]));
    $('#updated').textContent = `Mis à jour le ${new Date().toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}`;
    show('dash');
  }

  // Rétractation réglée dans Stripe : on la retire de « À faire ».
  async function traiter(x, btn) {
    btn.disabled = true;
    try {
      await db.collection('customers').doc(x.uid).collection('retractations').doc(x.id)
        .set({ traiteLe: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      x.traiteLe = new Date();
      render();
    } catch {
      btn.disabled = false;
      alert('Impossible d’enregistrer. Vérifie ta connexion, puis réessaie.');
    }
  }

  async function load() {
    $('#refresh').disabled = true;
    try {
      const [snap, retr] = await Promise.all([db.collectionGroup('subscriptions').get(), db.collectionGroup('retractations').get()]);
      rows = snap.docs.map((d) => ({ id: d.id, uid: d.ref.parent.parent.id, ...d.data() }));
      retractations = retr.docs.map((d) => ({ id: d.id, uid: d.ref.parent.parent.id, ...d.data() }));
      const uids = [...new Set([...rows, ...retractations].map((r) => r.uid))];
      customers = Object.fromEntries(await Promise.all(uids.map(async (uid) => {
        const c = await db.collection('customers').doc(uid).get();
        return [uid, c.exists ? c.data() : {}];
      })));
      render();
    } catch (err) {
      state(err && err.code === 'permission-denied'
        ? 'Accès refusé par les règles Firebase. Vérifie que firestore.rules est publié et que ton compte est administrateur.'
        : 'Impossible de charger les abonnements. Vérifie ta connexion Internet, puis actualise.');
    } finally {
      $('#refresh').disabled = false;
    }
  }

  // ---------------------------------------------------------------- Connexion
  if (!CONFIG || !CONFIG.apiKey) {
    state('Les comptes ne sont pas encore configurés : remplis public/firebase-config.js (voir le README).');
    return;
  }
  const loadScript = (src) => new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.append(s);
  });
  ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js']
    .reduce((p, f) => p.then(() => loadScript(SDK + f)), Promise.resolve())
    .then(() => {
      firebase.initializeApp(CONFIG);
      auth = firebase.auth();
      auth.languageCode = 'fr';
      db = firebase.firestore();
      $('#refresh').addEventListener('click', load);
      $('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = $('#login-msg');
        msg.hidden = true;
        try {
          await auth.signInWithEmailAndPassword($('#login-email').value.trim(), $('#login-pass').value);
        } catch {
          msg.textContent = 'Courriel ou mot de passe incorrect.';
          msg.hidden = false;
        }
      });
      auth.onAuthStateChanged(async (u) => {
        $('#refresh').hidden = !u;
        $('#who').textContent = u ? u.email : '';
        if (!u) return show('login');
        state('Vérification de ton accès…');
        const { claims } = await u.getIdTokenResult(true).catch(() => ({ claims: {} }));
        if (!claims.admin) {
          $('#refresh').hidden = true;
          return state(`Accès réservé à l’administration : le compte ${u.email} n’est pas administrateur.`,
            h('button', { type: 'button', class: 'btn ghost', onclick: () => auth.signOut() }, 'Changer de compte'));
        }
        state('Chargement des abonnements…');
        load();
      });
    })
    .catch(() => state('Impossible de joindre Firebase. Vérifie ta connexion Internet, puis actualise la page.'));
})();
