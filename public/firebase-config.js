// Configuration des comptes utilisateurs (Firebase).
// Tant que cette valeur reste à null, l'app fonctionne sans comptes, comme avant.
// Pour activer les comptes, remplace null par la configuration de ton projet Firebase
// (console Firebase → Paramètres du projet → Vos applications → Config). Exemple :
//
// window.PD_FIREBASE = {
//   apiKey: 'AIza…',
//   authDomain: 'prof-danglais.firebaseapp.com',
//   projectId: 'prof-danglais',
//   appId: '1:123456789:web:abc123',
//   appCheck: '6Lc…', // facultatif mais conseillé : clé de site reCAPTCHA Enterprise (voir le README, « Sécurité »)
// };
//
// Ces valeurs ne sont pas secrètes : la sécurité vient des règles Firestore (firestore.rules).
window.PD_FIREBASE = {
  apiKey: 'AIzaSyAT0RDC6vGxISzvQs7nClEAT9-bjTitWHQ',
  authDomain: 'prof-danglais-f2db6.firebaseapp.com',
  projectId: 'prof-danglais-f2db6',
  appId: '1:147917123161:web:a50daed0a5646fec244b48',
};
