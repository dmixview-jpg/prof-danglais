'use strict';
// Fusion de deux progressions (celle de l'appareil et celle du compte en ligne).
// On ne perd jamais rien : on garde le meilleur résultat de chaque côté.
(function (root) {
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const arr = (v) => (Array.isArray(v) ? v : []);

  function merge(local, remote) {
    const a = obj(local), b = obj(remote);

    // Leçons : la meilleure note en étoiles
    const progress = {};
    for (const src of [obj(a.progress), obj(b.progress)]) {
      for (const [id, p] of Object.entries(src)) {
        if (!progress[id] || (p && p.stars > progress[id].stars)) progress[id] = p;
      }
    }

    // Dialogues guidés : le meilleur score
    const dialogues = {};
    for (const src of [obj(a.dialogues), obj(b.dialogues)]) {
      for (const [id, stars] of Object.entries(src)) dialogues[id] = Math.max(dialogues[id] || 0, stars || 0);
    }

    // Jours d'activité : l'union, triée, limitée aux 400 derniers
    const days = [...new Set([...arr(a.days), ...arr(b.days)])].sort().slice(-400);

    // Carnet : l'union par mot anglais, en gardant la fiche la mieux maîtrisée
    const vocab = [];
    const seen = new Map();
    for (const w of [...arr(a.vocab), ...arr(b.vocab)]) {
      if (!w || typeof w.en !== 'string') continue;
      const k = w.en.toLowerCase();
      if (!seen.has(k)) { seen.set(k, vocab.length); vocab.push(w); }
      else if ((w.known || 0) > (vocab[seen.get(k)].known || 0)) vocab[seen.get(k)] = w;
    }

    return {
      progress,
      dialogues,
      days,
      vocab,
      lessons: Math.max(a.lessons || 0, b.lessons || 0, Object.keys(progress).length),
      level: a.level || b.level || null,
      pathLevel: a.pathLevel || b.pathLevel || null,
    };
  }

  // Comparaison indépendante de l'ordre des clés
  function stable(v) {
    if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
    if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
    return JSON.stringify(v === undefined ? null : v);
  }
  const same = (x, y) => stable(x) === stable(y);

  const api = { merge, same };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PDFusion = api;
})(typeof self !== 'undefined' ? self : this);
