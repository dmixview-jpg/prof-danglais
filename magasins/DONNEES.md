# Confidentialité dans les magasins

Réponses aux questionnaires d'App Store Connect (« Confidentialité de l'app ») et de la Play Console
(« Sécurité des données »). Elles décrivent ce que fait l'app aujourd'hui : à revoir si on ajoute
un outil d'analyse, des notifications ou un autre fournisseur.

## Ce que l'app recueille

| Donnée | Pourquoi | Liée à la personne | Partagée | Suivi publicitaire |
|---|---|---|---|---|
| Prénom | Fonctionnement de l'app (salutation) | Oui | Non | Non |
| Adresse courriel | Fonctionnement de l'app, gestion du compte | Oui | Non | Non |
| Identifiant du compte (uid Firebase) | Fonctionnement de l'app, achats, analyse (tableau de bord) | Oui | Non | Non |
| Progression (leçons, étoiles, mots du carnet, jours de pratique) | Fonctionnement de l'app (synchronisation), analyse (tableau de bord) | Oui | Non | Non |
| Historique d'achats (abonnement) | Fonctionnement de l'app (accès Premium) | Oui | Non | Non |

« Analyse » : le tableau de bord de l'administration (`admin.html`) montre l'activité de chaque compte
(leçons faites, jours de pratique, dernière activité) pour suivre l'usage de l'app. Apple et Google
classent cet usage dans la finalité « Analyse » (Analytics), même sans outil d'analyse externe.

Les fournisseurs qui traitent ces données pour notre compte (Google Firebase, RevenueCat)
ne sont pas un « partage » au sens des deux magasins.

## App Store Connect

- **Suivi (tracking)** : Non. Aucune demande d'autorisation de suivi (ATT) n'est donc nécessaire.
- **Types de données** :
  - Coordonnées → Nom, Adresse e-mail ;
  - Contenu de l'utilisateur → Autre contenu de l'utilisateur (progression) ;
  - Identifiants → Identifiant de l'utilisateur ;
  - Achats → Historique des achats.
- **Pour chaque type** : « Fonctionnalités de l'app », lié à l'identité, pas utilisé pour le suivi.
  - En plus, pour **Identifiant de l'utilisateur** et **Autre contenu de l'utilisateur** : cocher aussi « Analyse » (Analytics).
- **URL de la politique de confidentialité** : `https://dmixview-jpg.github.io/prof-danglais/confidentialite.html`.

## Play Console : Sécurité des données

- **Données recueillies** :
  - Informations personnelles → Nom, Adresse e-mail, ID utilisateur ;
  - Informations financières → Historique des achats ;
  - Activité dans les applis → Autre contenu généré par l'utilisateur (progression).
- **Partagées avec des tiers** : Non.
- **Données chiffrées en transit** : Oui.
- **Pour chaque type** :
  - collecte obligatoire ;
  - finalités : fonctionnement de l'appli et gestion du compte ; en plus, « Analyse » pour l'ID utilisateur et la progression ;
  - traitement éphémère : non.
- **Suppression des données** :
  - la personne peut demander la suppression : Oui, dans l'app (« Mon compte » → « Supprimer mon compte »). La fonction `supprimerCompte` efface la progression, la copie de l'abonnement, les données de paiement, la fiche RevenueCat et le compte ;
  - lien Web : `https://dmixview-jpg.github.io/prof-danglais/confidentialite.html#droits`, qui donne le courriel pour les demandes.
- **URL de la politique de confidentialité** : `https://dmixview-jpg.github.io/prof-danglais/confidentialite.html`.

## Comptes de démonstration (examen par Apple et Google)

L'app demande une connexion au démarrage : les équipes d'examen ont besoin d'un compte.
Crée un compte de démonstration (ex. : `revue.apple@<ton-domaine>`) et donne-le dans :
- App Store Connect → Informations de l'examen de l'app → Connexion requise ;
- Play Console → Accès à l'application → Instructions d'accès.

Note pour l'équipe d'examen (à copier) :

```
Prof d'anglais est un parcours d'anglais pour francophones. Connectez-vous avec le compte de démonstration ci-dessus. Le niveau Pré-A1 est gratuit ; les niveaux A1 à C2 se débloquent avec l'abonnement Premium (achats intégrés, testables en sandbox). La création de compte sert à sauvegarder la progression et l'abonnement sur tous les appareils ; la suppression du compte se fait dans Mon compte → Supprimer mon compte. La voix anglaise utilise la synthèse vocale de l'appareil.
```
