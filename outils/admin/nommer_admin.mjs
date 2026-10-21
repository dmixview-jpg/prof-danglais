// Donne (ou retire) l'accès au tableau de bord admin.html à un compte de l'app.
//   FIREBASE_SERVICE_ACCOUNT="$(cat cle.json)" node outils/admin/nommer_admin.mjs courriel@exemple.com
//   … nommer_admin.mjs courriel@exemple.com --retirer
// Le compte doit déjà exister (créé dans l'app). Ajoute la marque admin=true au compte sans toucher
// aux autres (ex. stripeRole de l'abonnement). La personne doit se déconnecter puis se reconnecter.
// Sur GitHub : Actions → « Nommer un administrateur » → Run workflow.
import { cleDeService, jetonGoogle } from '../google.mjs';

const courriel = (process.argv[2] || '').trim().toLowerCase();
const retirer = process.argv.includes('--retirer');
if (!courriel.includes('@')) {
  console.error('Indique le courriel du compte : node outils/admin/nommer_admin.mjs courriel@exemple.com');
  process.exit(1);
}

const cle = cleDeService();
const token = await jetonGoogle(cle, 'https://www.googleapis.com/auth/identitytoolkit');
const api = (action, body) => fetch(`https://identitytoolkit.googleapis.com/v1/projects/${cle.project_id}/accounts:${action}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(async (r) => {
  if (!r.ok) throw new Error(`${action} : échec ${r.status} : ${await r.text()}`);
  return r.json();
});

const { users } = await api('lookup', { email: [courriel] });
if (!users || !users.length) {
  console.error('Aucun compte avec ce courriel. Crée d’abord le compte dans l’app, puis recommence.');
  process.exit(1);
}
const user = users[0];
const marques = JSON.parse(user.customAttributes || '{}');
if (retirer) delete marques.admin;
else marques.admin = true;
await api('update', { localId: user.localId, customAttributes: JSON.stringify(marques) });
console.log(retirer ? 'Accès administrateur retiré.' : 'Accès administrateur donné. Déconnecte-toi puis reconnecte-toi dans l’app.');
