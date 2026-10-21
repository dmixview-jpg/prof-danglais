// Envoie le contenu payant (outils/premium/contenu.json, produit par construire.py)
// dans Firestore : un document contenu/{niveau} par niveau, lisible par les abonnés seulement.
//
//   FIREBASE_SERVICE_ACCOUNT="$(cat cle.json)" node outils/programme/publier_premium.mjs
//   node outils/programme/publier_premium.mjs --essai     (vérifie sans rien envoyer)
//
// La clé est un « compte de service » Firebase (Paramètres du projet → Comptes de service →
// Générer une nouvelle clé privée). Elle est secrète : ne la mets jamais dans le dépôt ;
// sur GitHub, elle va dans les secrets (FIREBASE_SERVICE_ACCOUNT). Aucune dépendance npm.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cleDeService, jetonGoogle } from '../google.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const essai = process.argv.includes('--essai');
const contenu = JSON.parse(readFileSync(join(ROOT, 'outils', 'premium', 'contenu.json'), 'utf8'));

// Conversion JSON → format des valeurs Firestore (API REST)
function valeur(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valeur) } };
  return { mapValue: { fields: champs(v) } };
}
const champs = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, valeur(v)]));

const docs = Object.entries(contenu.levels).map(([niveau, part]) => {
  const body = JSON.stringify({ fields: champs({ ...part, build: contenu.build }) });
  return { niveau, body, ko: Math.round(Buffer.byteLength(body) / 1024) };
});
for (const d of docs) {
  if (d.ko > 900) throw new Error(`contenu/${d.niveau} : ${d.ko} Ko, trop proche de la limite de 1 Mo de Firestore`);
}
console.log(`Version ${contenu.build} : ${docs.map((d) => `${d.niveau} (${d.ko} Ko)`).join(', ')}`);
if (essai) process.exit(0);

const cle = cleDeService();
const token = await jetonGoogle(cle, 'https://www.googleapis.com/auth/datastore');
for (const d of docs) {
  const url = `https://firestore.googleapis.com/v1/projects/${cle.project_id}/databases/(default)/documents/contenu/${d.niveau}`;
  const res = await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: d.body });
  if (!res.ok) throw new Error(`contenu/${d.niveau} : échec ${res.status} : ${await res.text()}`);
  console.log(`✓ contenu/${d.niveau}`);
}
console.log('Contenu payant publié.');
