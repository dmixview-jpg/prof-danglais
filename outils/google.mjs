// Connexion aux services Google avec un compte de service Firebase (JWT signé RS256).
// Sans dépendance npm. La clé (JSON) est secrète : elle vient de la variable FIREBASE_SERVICE_ACCOUNT.
import { createSign } from 'node:crypto';

export function cleDeService() {
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!brut) {
    console.error('FIREBASE_SERVICE_ACCOUNT manquant : rien n’a été fait.');
    process.exit(1);
  }
  return JSON.parse(brut);
}

export async function jetonGoogle(cle, scope) {
  const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const entete = b64({ alg: 'RS256', typ: 'JWT' });
  const corps = b64({ iss: cle.client_email, aud: 'https://oauth2.googleapis.com/token', scope, iat: now, exp: now + 3600 });
  const signature = createSign('RSA-SHA256').update(`${entete}.${corps}`).sign(cle.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${entete}.${corps}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Connexion à Google refusée (${res.status}) : ${await res.text()}`);
  return (await res.json()).access_token;
}
