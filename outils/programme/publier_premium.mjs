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
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const essai = process.argv.includes('--essai');
const contenu = JSON.parse(readFileSync(join(ROOT, 'outils', 'premium', 'contenu.json'), 'utf8'));

// Conversion JSON → format des valeurs Firestore (API REST)
export function valeur(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valeur) } };
  return { mapValue: { fields: champs(v) } };
}
export const champs = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, valeur(v)]));

const docs = Object.entries(contenu.levels).map(([niveau, part]) => {
  const body = JSON.stringify({ fields: champs({ ...part, build: contenu.build }) });
  return { niveau, body, ko: Math.round(Buffer.byteLength(body) / 1024) };
});
for (const d of docs) {
  if (d.ko > 900) throw new Error(`contenu/${d.niveau} : ${d.ko} Ko, trop proche de la limite de 1 Mo de Firestore`);
}
console.log(`Version ${contenu.build} : ${docs.map((d) => `${d.niveau} (${d.ko} Ko)`).join(', ')}`);
if (essai) process.exit(0);

const brut = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!brut) {
  console.error('FIREBASE_SERVICE_ACCOUNT manquant : rien n’a été envoyé.');
  process.exit(1);
}
const cle = JSON.parse(brut);

// Jeton d'accès Google à partir du compte de service (JWT signé RS256)
async function jeton() {
  const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const entete = b64({ alg: 'RS256', typ: 'JWT' });
  const corps = b64({
    iss: cle.client_email, aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/datastore', iat: now, exp: now + 3600,
  });
  const signature = createSign('RSA-SHA256').update(`${entete}.${corps}`).sign(cle.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${entete}.${corps}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Connexion à Google refusée (${res.status}) : ${await res.text()}`);
  return (await res.json()).access_token;
}

const token = await jeton();
for (const d of docs) {
  const url = `https://firestore.googleapis.com/v1/projects/${cle.project_id}/databases/(default)/documents/contenu/${d.niveau}`;
  const res = await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: d.body });
  if (!res.ok) throw new Error(`contenu/${d.niveau} : échec ${res.status} : ${await res.text()}`);
  console.log(`✓ contenu/${d.niveau}`);
}
console.log('Contenu payant publié.');
