// Coordonnées affichées dans les Conditions et la Politique de confidentialité.
// La Loi sur la protection du consommateur (contrats à distance) exige le nom, l'adresse et un
// moyen de joindre le commerçant ; la Loi 25 exige le titre et les coordonnées du responsable de
// la protection des renseignements personnels ; le RGPD européen, un représentant dans l'Union
// européenne et au Royaume-Uni. Tant qu'un champ est vide, la page affiche « à compléter ».
window.PD_LEGAL = {
  nom: '',          // ton nom complet, ou le nom de ton entreprise
  courriel: '',     // courriel de contact (aide, abonnement, vie privée)
  adresse: '',      // adresse postale complète
  telephone: '',    // facultatif
  responsable: '',  // responsable de la protection des renseignements personnels (souvent toi)
  // Clients en Europe (RGPD, article 27) : représentant établi dans l'Union européenne, et au
  // Royaume-Uni (UK GDPR). Nom et adresse, ex. : 'EU-Rep SARL, 1 rue X, 75001 Paris, France'.
  representantUE: '',
  representantRU: '',
  enVigueur: '2026-10-21', // date d'entrée en vigueur (change-la à chaque modification des textes)
};
