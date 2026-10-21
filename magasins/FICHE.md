# Fiches App Store et Google Play

Textes prêts à copier dans App Store Connect et la Play Console (langue principale : français).
Les chiffres viennent du programme (`public/curriculum.json`) : à mettre à jour si on ajoute des leçons.

## Identité

| Champ | Valeur | Limite |
|---|---|---|
| Nom de l'app (les deux magasins) | Prof d'anglais | 30 |
| Sous-titre (App Store) | Apprendre l'anglais pas à pas | 30 |
| Identifiant de l'app (bundle / package) | `ca.profdanglais.app` (définitif après le premier envoi) | — |
| Catégorie | Éducation (secondaire : Référence) | — |
| Classification | 4+ (App Store) · Tout public (Google Play) : aucun contenu sensible | — |
| Public cible (Google Play) | 18 ans et plus (comme les conditions) | — |
| Prix de l'app | Gratuite, avec abonnement Premium dans l'app | — |

## Mots-clés (App Store, 100 caractères)

```
anglais,apprendre,cours,leçon,vocabulaire,grammaire,conversation,débutant,prononciation,parler,ESL
```

## Texte promotionnel (App Store, 170 caractères) · Description courte (Google Play, 80 caractères)

```
Ton coach d'anglais en français, de Pré-A1 à C2. Pré-A1 gratuit.
```

## Description (les deux magasins, 4000 caractères)

```
Apprends l'anglais en français, à ton rythme, de l'alphabet jusqu'à la maîtrise.

Prof d'anglais est un vrai parcours, pensé pour les francophones : chaque leçon explique simplement, en français, ce qu'il faut savoir, puis te fait pratiquer tout de suite. Tu avances étape par étape, du niveau Pré-A1 jusqu'au C2 du Cadre européen.

UN PARCOURS COMPLET
• 7 niveaux, de Pré-A1 à C2
• 179 leçons courtes et 36 bilans pour vérifier tes progrès
• Grammaire, vocabulaire, prononciation et situations de la vie courante
• Des astuces de prof pour éviter les pièges des francophones

PARLE DANS DE VRAIES SITUATIONS
• 35 dialogues guidés : au café, à l’hôtel, en entrevue d’embauche, chez le médecin…
• Choisis ta réponse, reçois une correction claire et la bonne formulation
• Voix anglaise pour chaque phrase, à la vitesse de ton choix

TON CARNET DE VOCABULAIRE
• Ajoute les mots que tu veux retenir
• Révise-les avec des cartes mémoire

PENSÉ POUR TOI
• Fonctionne hors connexion, même dans le métro ou en avion
• Ta progression est sauvegardée dans ton compte et te suit sur tous tes appareils
• Aucune publicité, aucun pisteur

GRATUIT POUR COMMENCER
Le niveau Pré-A1 est entièrement gratuit. Avec Premium, débloque les niveaux A1 à C2, leurs bilans et tous les dialogues guidés : abonnement mensuel ou annuel, avec essai gratuit de 7 jours pour un premier abonnement.

L'abonnement se renouvelle automatiquement, sauf annulation au moins 24 heures avant la fin de la période en cours. Le paiement est débité de ton compte Apple ou Google Play. Tu peux gérer ou annuler ton abonnement en tout temps dans les réglages de ton compte.

Conditions d'utilisation : https://<ton-site>/conditions.html
Politique de confidentialité : https://<ton-site>/confidentialite.html
```

## Notes de version (première version)

```
Première version de Prof d'anglais : le parcours complet de Pré-A1 à C2, les dialogues guidés, le carnet de vocabulaire et la synchronisation de ta progression.
```

## Visuels (`magasins/captures/`)

Générés par `python3 outils/captures_magasins.py` à partir de captures de l'app.

| Fichier | Où le déposer |
|---|---|
| `iphone-6.9-*.jpg` (1320 × 2868) | App Store Connect → iPhone 6,9 po (les autres tailles d'iPhone sont déduites) |
| `ipad-13-*.jpg` (2064 × 2752) | App Store Connect → iPad 13 po |
| `android-*.jpg` (1080 × 1920) | Play Console → Captures d'écran de téléphone |
| `google-play-banniere-1024x500.jpg` | Play Console → Bannière |
| `google-play-icone-512.png` | Play Console → Icône de l'application |

## Achats intégrés (identiques dans les deux magasins)

| Produit | Identifiant | Durée | Prix suggéré | Essai |
|---|---|---|---|---|
| Premium mensuel | `premium_mensuel` | 1 mois | 6,99 $ CA | aucun |
| Premium annuel | `premium_annuel` | 1 an | 49,99 $ CA | 7 jours gratuits (offre d'introduction) |

Les deux produits vont dans le même groupe d'abonnements « Premium ». Les magasins convertissent le prix dans chaque pays ; tu peux l'ajuster pays par pays. Leur commission est de 15 % pour un petit développeur (programmes « Small Business » d'Apple, tarif des abonnements chez Google), contre environ 3 % pour Stripe sur le site : tu peux garder les mêmes prix ou les monter un peu dans les apps.
