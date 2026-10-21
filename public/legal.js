'use strict';
// Remplit les coordonnées des pages légales à partir de legal-config.js.
(function () {
  const L = window.PD_LEGAL || {};
  const LABELS = {
    nom: 'nom du commerçant', courriel: 'courriel de contact', adresse: 'adresse postale',
    telephone: 'téléphone', responsable: 'nom du responsable',
  };
  const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  document.querySelectorAll('[data-legal]').forEach((el) => {
    const key = el.dataset.legal;
    const v = key === 'enVigueur' ? (L.enVigueur ? date(L.enVigueur) : '') : (L[key] || (key === 'responsable' ? L.nom : ''));
    if (v && key === 'courriel') {
      el.replaceChildren(Object.assign(document.createElement('a'), { href: `mailto:${v}`, textContent: v }));
    } else if (v) {
      el.textContent = v;
    } else if (el.dataset.optional !== undefined) {
      el.closest('[data-line]') ? el.closest('[data-line]').remove() : el.remove();
    } else {
      el.textContent = `[à compléter : ${LABELS[key] || key}]`;
      el.classList.add('todo-info');
    }
  });
})();
