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
// };
//
// Ces valeurs ne sont pas secrètes : la sécurité vient des règles Firestore (firestore.rules).
window.PD_FIREBASE = null;
