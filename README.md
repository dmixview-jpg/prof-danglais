# Prof d'anglais 🇬🇧💬

Ton coach d'anglais personnel, pensé pour les francophones et utilisé sur **iPhone et iPad** comme une vraie app (PWA).

**100 % gratuit, sans IA, sans compte et sans clé.** Toutes les leçons et tous les dialogues sont rédigés d'avance et intégrés à l'app. Rien n'est envoyé sur Internet. Une fois chargée, l'app fonctionne **entièrement hors ligne**.

- **Un parcours complet, de l'alphabet à la maîtrise** :
  - 7 niveaux (Pré-A1, A1, A2, B1, B2, C1, C2), 36 unités et **183 leçons rédigées** ;
  - à la fin de chaque unité, de A1 à C2 : un **dialogue guidé** sur le thème de l'unité, puis un bilan ;
  - le bouton « Continuer » ouvre toujours ta prochaine leçon ;
  - chaque leçon terminée rapporte jusqu'à 3 étoiles.
- **Chaque leçon** contient :
  - des explications en étapes illustrées ;
  - des exemples à écouter ;
  - un dialogue de la vie réelle ;
  - des mots utiles à ajouter à ton carnet ;
  - une astuce sur les pièges des francophones ;
  - des exercices de 3 types : choix de réponse, écoute (« Qu'as-tu entendu? ») et remise des mots en ordre.
- **Recherche** : trouve une leçon par mot-clé (ex. : « present perfect », « e-mail »).
- **Conversation : 35 dialogues guidés**, de A1 à C2, un par unité du parcours, plus un dialogue bonus. Exemples : café, famille, médecin, entretien d'embauche, mystère au bureau, discours de retraite, soirée basketball, débat public.
  - Des onglets de niveau (A1 à C2) affichent les situations de ton niveau, avec ta progression.
  - Le petit chat te parle avec la voix ; tu choisis ta réponse parmi 3.
  - Une erreur? Une correction en français apparaît dans l'encadré jaune « Correction ».
  - La traduction de chaque réplique est disponible au besoin.
- **Vocabulaire** : cartes mémoire (anglais au recto, français au verso). Un mot est maîtrisé après 3 « Je sais ».
- **Prononciation avec l'accent américain** : un bouton 🔊 sur chaque exemple, chaque mot et chaque réplique.
  - L'app choisit la meilleure voix **américaine (en-US)** de l'appareil.
  - La carte **🔊 Voix américaine**, en bas de l'accueil, permet de changer de voix et de vitesse.
- **Un petit chat bleu animé** te guide partout : il salue, parle quand tu touches 🔊, saute de joie quand tu réponds juste et fait « oups » quand tu te trompes.
- Mode sombre automatique.
- **S'adapte à tous les iPhone et iPad**, en portrait comme en paysage.

---

## Le parcours

Le programme suit le **Cadre européen commun de référence (CECR)**, comme les grands cours en ligne (Cambridge English, British Council, BBC Learning English) et la progression des grammaires de référence. Chaque leçon aborde les pièges typiques des francophones : faux amis, « I have 30 years », « depuis » → present perfect, etc.

| Niveau | Ce que tu sauras faire | Exemples d'unités |
|---|---|---|
| 🌱 **Pré-A1 · Premiers pas** | Prononcer l'alphabet et les sons anglais, compter, saluer | L'alphabet (interactif), épeler, TH / H / R / W, nombres, couleurs, jours et mois |
| 🐣 **A1 · Débutant** | Te présenter, parler de ton quotidien | to be, présent simple, famille et maison, nourriture, présent continu, passé simple |
| 🌿 **A2 · Élémentaire** | Raconter, comparer, faire des projets | passé continu, comparatifs, futur, present perfect, conseils, vie pratique |
| 🌳 **B1 · Intermédiaire** | Te débrouiller partout, travailler en anglais | conditionnels, voix passive, discours indirect, relatives, entretien d'embauche |
| 🌲 **B2 · Intermédiaire avancé** | Argumenter et nuancer avec aisance | 3ᵉ conditionnel, déduction, phrases complexes, collocations, faux amis |
| 🏔️ **C1 · Avancé** | T'exprimer avec précision dans tous les contextes | inversion, subjonctif, écriture professionnelle, idiomes, accents |
| 🏆 **C2 · Maîtrise** | Comprendre et t'exprimer comme un natif instruit | connotations, figures de style, culture anglophone, écriture experte, art oratoire |

Le niveau choisi dans l'en-tête et celui du parcours vont ensemble : changer l'un change l'autre. Il sélectionne aussi les dialogues de ton niveau dans l'onglet Conversation.

Chaque unité de A1 à C2 se termine par un **dialogue guidé** (nœud 🎭 dans le chemin) qui met en pratique la grammaire et le vocabulaire de l'unité : passé simple pour « Ton week-end », conditionnels pour « Et si on déménageait? », déduction pour « Le mystère du bureau », inversion pour « Un discours pour une collègue »… Réussir le dialogue fait avancer le parcours, que tu l'ouvres depuis le chemin ou depuis l'onglet Conversation.

### Modifier ou ajouter du contenu

Le contenu est écrit en Python, dans un format simple, dans `outils/programme/` :

| Fichier | Contenu |
|---|---|
| `premiers_pas.py` | Niveau Pré-A1 |
| `contenu/a1_u1.py` … `contenu/c2_u4.py` | Une unité par fichier (5 leçons), **dans le dépôt privé** |
| `contenu/dialogues.py` | Les premiers dialogues guidés, **dans le dépôt privé** |
| `contenu/dialogues_unites.py` | Les dialogues des unités, et l'unité à laquelle chaque dialogue est rattaché, **dans le dépôt privé** |
| `parcours_public.json` | Titres et cadenas des niveaux payants, réécrit par `construire.py` |
| `aide.py` | Les petites fonctions pour écrire une leçon : étape, exemple, mot, réplique, exercice |

Après une modification, régénère le fichier lu par l'app :

```bash
python3 outils/programme/construire.py
```

Les leçons payantes (A1 à C2) et les dialogues sont dans le dépôt **privé** `prof-danglais-premium`, pour ne pas être lisibles ici. Pour les modifier, clone-le dans `outils/programme/contenu/` (dossier ignoré par Git) : `git clone https://github.com/dmixview-jpg/prof-danglais-premium.git outils/programme/contenu`. Sans lui, `construire.py` reconstruit seulement Pré-A1 et reprend les titres des niveaux payants dans `parcours_public.json`, et les tests du contenu complet sont sautés.

Le script vérifie le contenu (3 options distinctes, bonne réponse valide, phrases à remettre en ordre…). Il refuse de construire s'il trouve une erreur, puis écrit `public/curriculum.json`. Les bilans d'unité sont assemblés automatiquement à partir des leçons.

---

## 1. Installer Node.js

Il faut **Node.js 18 ou plus récent**. Aucun autre paquet n'est nécessaire.

1. Va sur <https://nodejs.org> et télécharge la version **LTS**.
2. Installe-la, puis ouvre le Terminal (ou PowerShell) et vérifie :

   ```bash
   node -v
   ```

   Tu dois voir `v18` ou plus.

## 2. Démarrer

Dans le dossier du projet :

```bash
npm start
```

Ouvre <http://localhost:3000> sur ton ordinateur. Pour arrêter le serveur : `Ctrl + C`.

Pour changer de port, copie `.env.example` en `.env` et modifie `PORT` (c'est le seul réglage).

Pour lancer les tests (serveur et vérification de tout le contenu) :

```bash
npm test
```

## 3. Utiliser l'app sur ton iPhone ou ton iPad (même Wi-Fi)

1. L'ordinateur et l'iPhone doivent être sur le **même réseau Wi-Fi**.
2. Trouve l'adresse IP locale de l'ordinateur :
   - **macOS** : Réglages Système → Wi-Fi → Détails, ou dans le Terminal : `ipconfig getifaddr en0`
   - **Windows** : `ipconfig` dans PowerShell, ligne « Adresse IPv4 »
3. Sur l'iPhone, ouvre Safari et va à `http://ADRESSE-IP:3000` (ex. : `http://192.168.1.42:3000`).
4. Si macOS demande d'autoriser les connexions entrantes pour `node`, accepte.

> En Wi-Fi local (http), l'app fonctionne, mais le **mode hors ligne** (service worker) ne s'active qu'en **https**. Pour l'avoir partout, même sans Internet, héberge l'app en ligne (étape suivante, gratuit).

## 4. Mettre l'app en ligne gratuitement (accès partout, hors ligne)

L'app n'a besoin d'aucun serveur spécial : c'est un **site statique**. Il suffit de publier le dossier `public/`.

**Option intégrée : GitHub Pages (gratuit, automatique)**
Le projet contient déjà le déploiement (`.github/workflows/pages.yml`). Il lance les tests, puis publie `public/` à chaque mise à jour de la branche `main`.
1. Sur GitHub, dans ton dépôt : **Settings → Pages → Source : GitHub Actions** (à faire une seule fois).
2. Fusionne tes changements dans `main`, ou lance le déploiement à la main : **Actions → Publier sur GitHub Pages → Run workflow**.
3. L'app est en ligne à `https://<ton-compte>.github.io/prof-danglais/`. Les chemins de l'app sont relatifs : elle fonctionne aussi dans ce sous-dossier.

**Autre option : Netlify Drop (2 minutes, gratuit)**
1. Va sur <https://app.netlify.com/drop> et crée un compte gratuit.
2. Glisse-dépose le dossier **`public`** du projet dans la page.
3. Ton app est en ligne en **https**, à une adresse du type `https://nom-au-hasard.netlify.app`. Tu peux changer ce nom dans les réglages du site.

**Autre option : Render (site statique gratuit, depuis GitHub)**
1. Mets le projet sur GitHub.
2. Sur <https://render.com> : **New → Static Site**, puis choisis ton dépôt.
3. **Build Command** : laisse vide. **Publish Directory** : `public`.
4. Déploie. L'adresse ressemble à `https://prof-danglais.onrender.com`. Un site statique ne se met jamais en veille.

Il n'y a ni clé ni donnée personnelle à protéger : ta progression reste sur ton appareil. Aucun code d'accès n'est donc nécessaire.

## Comptes utilisateurs (Firebase, gratuit)

Au démarrage, l'app propose de se connecter ou d'**essayer sans compte** (niveau gratuit, progression gardée sur l'appareil ; exigé par Apple, règle 5.1.1(v)). Avec un compte (prénom, courriel, mot de passe), la progression est sauvegardée et suit la personne sur tous ses appareils ; le compte est nécessaire pour s'abonner. La progression faite sans compte rejoint le compte à la première connexion. Tant que `public/firebase-config.js` contient `null`, l'app fonctionne **sans comptes**, comme avant.

**Activer les comptes (une seule fois, environ 10 minutes)**
1. Va sur <https://console.firebase.google.com> avec ton compte Google, puis **Créer un projet** (nom : `prof-danglais`). Google Analytics n'est pas nécessaire.
2. **Authentication → Commencer → Adresse e-mail/Mot de passe → Activer → Enregistrer.**
3. **Authentication → Paramètres → Domaines autorisés → Ajouter un domaine** : `dmixview-jpg.github.io` (l'adresse de ton app en ligne).
4. **Firestore Database → Créer une base de données**, en mode **production**. Région conseillée : `northamerica-northeast1` (Montréal).
5. **Firestore Database → Règles** : remplace tout par le contenu du fichier `firestore.rules`, puis **Publier**. Ces règles font que chaque personne ne peut lire et modifier que sa propre progression.
6. **Paramètres du projet (roue dentée) → Vos applications → icône `</>` (Web)** : donne un nom, puis **Enregistrer l'application**. Copie les valeurs `apiKey`, `authDomain`, `projectId` et `appId` dans `public/firebase-config.js` (un exemple est dans le fichier).
7. Publie : les comptes sont actifs dès que la mise à jour arrive sur `main`.

Facultatif : **Authentication → Modèles** permet de mettre en français les courriels de confirmation et de nouveau mot de passe.

**Comment ça marche**
- La progression (étoiles, carnet, jours de suite, niveau) reste sur l'appareil et se copie dans le compte (document Firestore `users/{identifiant}`). Hors connexion, la personne connectée garde l'app ; tout se synchronise au retour d'Internet.
- À la première connexion, la progression déjà faite sur l'appareil rejoint le compte. Plusieurs personnes peuvent se connecter tour à tour sur le même appareil : chacune retrouve la sienne.
- Le menu du compte (bouton rond avec l'initiale) permet de se déconnecter ou de **supprimer son compte** et toutes ses données.
- Les valeurs de `firebase-config.js` ne sont pas secrètes ; la protection vient des règles Firestore. Le code est dans `public/compte.js` (comptes et synchronisation) et `public/fusion.js` (fusion des progressions, testée par `npm test`).
- Les courriels de tes utilisateurs sont gardés par Firebase (Google). Si l'app s'ouvre au public, prévois une courte politique de confidentialité.

## Abonnements : Apple et Google encaissent

Pré-A1 reste gratuit ; les niveaux A1 à C2 et les dialogues guidés demandent un abonnement Premium (mensuel par défaut, ou annuel, avec 7 jours d'essai gratuit). Tant que `actif` vaut `false` dans `outils/programme/abonnement.json`, tout reste gratuit, comme avant.

**On s'abonne seulement dans les apps.** Le site ne vend rien et n'utilise plus Stripe. Apple et Google :
- encaissent le paiement et envoient les reçus ;
- perçoivent et reversent les taxes de chaque pays (TVA, TPS/TVQ…) : tu n'as pas à t'inscrire aux taxes à l'étranger pour ces ventes ;
- relancent les cartes refusées, gèrent les remboursements et le droit de rétractation ;
- te versent les revenus chaque mois, moins leur commission de 15 % (petit développeur) : Apple environ 33 jours après la fin de son mois financier, Google vers le 15 du mois suivant.

Sur le site, la page « Débloque tout le parcours » invite à s'abonner dans l'app, puis à se connecter avec le même compte : l'accès Premium suit le compte partout. Ajoute l'adresse des fiches de l'app dans `liensMagasins` (`abonnement.json`) dès qu'elles existent.

**Paiements refusés : réglages à faire dans les magasins**
- **App Store Connect → Apps → Abonnements → Période de grâce de facturation** : active-la (6 ou 16 jours). Apple réessaie la carte pendant 60 jours au total ; après la période de grâce, l'accès est coupé.
- **Play Console → Monétiser → Abonnements → Période de grâce** (jusqu'à 30 jours) **et suspension du compte** (« account hold », jusqu'à 30 jours) : pendant la suspension, l'accès est coupé ; il revient dès que le paiement passe.
- RevenueCat prévient Firebase à chaque changement : la fonction `revenuecatWebhook` retire le rôle Premium quand le droit d'accès expire, et l'app efface la copie hors connexion à la fin de la période payée.

## Contenu Premium : protection et mise en route

**Comment le contenu est protégé**
- Avec l'abonnement actif, `construire.py` ne met dans `public/curriculum.json` que le contenu gratuit ; les niveaux payants n'y gardent que leurs titres (avec un cadenas). Le contenu payant va dans `outils/premium/contenu.json` (jamais publié ni enregistré dans Git).
- Les sources des leçons payantes sont dans le dépôt privé `prof-danglais-premium`, pas dans ce dépôt public.
- `outils/programme/publier_premium.mjs` l'envoie dans Firestore (`contenu/{niveau}`). Les règles de `firestore.rules` ne le laissent lire qu'aux abonnés des magasins (`revenueCatEntitlements` contient `premium`, donné par la fonction `revenuecatWebhook`) et aux administrateurs. Les abonnés en gardent une copie sur l'appareil pour l'usage hors connexion ; elle est retirée si l'abonnement se termine.
- Le code est dans `public/abonnement.js` (page « Débloque tout le parcours », accès Premium) et `public/magasin.js` (achats intégrés).

**Mise en route** (après avoir activé les comptes, section précédente)
1. **Firebase → Utilisation et facturation → Modifier le forfait → Blaze** : nécessaire aux fonctions Firebase (`functions/`, dont `revenuecatWebhook`). Ajoute une alerte de budget, par exemple 5 $.
2. **Firebase → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée**. Copie tout le contenu du fichier dans un secret GitHub nommé `FIREBASE_SERVICE_ACCOUNT` du dépôt **privé** `prof-danglais-premium` (**Settings → Secrets and variables → Actions**). Cette clé est secrète : ne la mets jamais dans le dépôt.
3. Les leçons payantes sont déjà dans le dépôt privé `prof-danglais-premium` : ce dépôt-ci peut rester public (GitHub Pages gratuit). Attention, l'historique Git de ce dépôt contient encore les anciennes versions des leçons.
4. Publie les leçons sur `main` du dépôt privé : son workflow « Publier le contenu Premium » envoie le contenu payant dans Firebase. Tu peux vérifier en local avec `node outils/programme/publier_premium.mjs --essai`.
5. Configure les abonnements dans App Store Connect, la Play Console et RevenueCat (section « App Store et Google Play »), vérifie les montants affichés dans `abonnement.json`, puis mets `"actif": true` et relance `python3 outils/programme/construire.py`.

**Règles de gestion déjà programmées**
- L'essai gratuit (`essaiJours`) est géré par Apple et Google, qui ne l'offrent qu'une fois par compte de magasin.
- Annulation : l'accès reste ouvert jusqu'à la fin de la période payée, puis les niveaux A1 à C2 se verrouillent et la copie hors connexion est effacée.
- Hors connexion : la copie des leçons Premium reste utilisable jusqu'à la **fin de la période payée** (plus 3 jours de marge pour un renouvellement fait hors ligne), et au plus 30 jours après la dernière vérification en ligne (`HORS_LIGNE_MAX` dans `abonnement.js`). Un abonné qui ne paie plus perd donc l'accès à la fin de son mois, même s'il reste hors ligne. Si l'horloge de l'appareil est reculée pour prolonger la copie, elle n'est plus acceptée. Ensuite, l'app demande de se connecter à Internet une fois.
- En ligne, l'accès Premium est vérifié par Firebase à chaque ouverture de l'app : dès que RevenueCat signale la fin du droit d'accès, les règles Firestore refusent le contenu payant et la copie de l'appareil est effacée. Le jeton de connexion se renouvelle au plus tard toutes les heures.
- Supprimer son compte dans l'app n'annule pas l'abonnement chez Apple ou Google : la personne l'annule dans les réglages de son téléphone.

**Avant d'ouvrir les abonnements :** remplis les politiques (section suivante).

## Conditions et confidentialité (clientèle internationale)

> Les textes visent les abonnements achetés dans l'App Store et Google Play : Apple et Google vendent, perçoivent les taxes, remboursent et gèrent la rétractation.

L'app vise une clientèle francophone en Europe, dans les Amériques, en Afrique et en Asie. Deux pages publiques, liées depuis l'écran de connexion, le menu « Mon compte » et la page d'abonnement, couvrent ces régions :
- `public/conditions.html` : conditions d'utilisation et de vente.
  - Réservé aux personnes de 18 ans ou plus ayant l'âge de la majorité dans leur pays.
  - Offert partout sauf en Chine continentale, où Firebase est bloqué.
  - Prix en $ CA, taxes du pays comprises ; essai offert une fois ; rappel avant le renouvellement annuel.
  - Pas de remboursement partiel en dehors de ces cas et des exceptions prévues.
  - Loi du Québec, sans priver le client des protections obligatoires de son pays.
- `public/confidentialite.html` : politique de confidentialité.
  - Loi 25 et RGPD : bases légales et transferts internationaux (Canada, États-Unis, UE).
  - Droits valables partout.
  - Section « Selon votre région » : Canada, Europe, États-Unis, Amérique latine, Afrique, Asie et Océanie, avec l'autorité à joindre dans chaque pays.

Pour créer un compte, la personne doit cocher « J'ai 18 ans ou plus et l'âge de la majorité dans mon pays, et j'accepte les conditions ». La version acceptée et la date d'acceptation sont enregistrées dans son profil (`users/{uid}.consent`).

**Polices.** Les polices sont hébergées avec l'app (`public/fonts/`, licence OFL) : aucune adresse IP n'est envoyée à Google Fonts, ce que des tribunaux européens ont jugé contraire au RGPD.

**À faire avant la mise en ligne payante**
1. Remplis `public/legal-config.js` : nom ou nom d'entreprise, courriel de contact, adresse postale, téléphone (facultatif) et responsable des renseignements personnels. Ce sont des mentions obligatoires au Québec comme en Europe. Tant qu'un champ est vide, les pages affichent « [à compléter : …] » en surligné.
2. **Représentants en Europe** (`representantUE`, `representantRU`) : un commerçant hors Europe qui vend à des Européens doit en désigner un dans l'Union européenne et un au Royaume-Uni (article 27 du RGPD). Des entreprises spécialisées offrent ce service, souvent pour quelques centaines d'euros par an.
3. Republie `firestore.rules` après chaque modification des règles.
4. Loi 25 : avant de confier des renseignements à Firebase et RevenueCat (serveurs hors Québec), fais et garde une courte évaluation des facteurs relatifs à la vie privée. Tiens aussi un registre des incidents de confidentialité, même vide.
5. Si tu modifies un texte de façon importante, change `enVigueur` dans `legal-config.js` et préviens les abonnés 30 jours à l'avance.
6. Ces textes sont un bon point de départ, pas un avis juridique. Fais-les relire par un avocat avant d'encaisser de vrais paiements, idéalement quelqu'un qui connaît le droit de la consommation européen, puisque l'Europe est le marché le plus encadré.

## Sécurité

**Les données de carte ne passent jamais par l'app.** Le paiement se fait uniquement par les achats intégrés d'Apple et de Google ; le site ne vend rien.

**Ce que les règles Firestore (`firestore.rules`) bloquent**
- Aucune demande de paiement, d'essai ou de rétractation ne peut être écrite dans Firestore : le site ne vend rien.
- Pour être administrateur, le courriel doit être confirmé : sinon, quelqu'un pourrait créer un compte avec ton adresse avant toi (`nommer_admin.mjs` le refuse aussi).
- Chaque personne ne lit et n'écrit que ses données, avec seulement les champs prévus. Le contenu Premium n'est lisible qu'avec le droit d'accès donné par RevenueCat.

Ces règles sont testées sur l'émulateur Firebase (Java 11 ou plus récent) : `npm run test:regles`. Le workflow « Règles Firestore » les vérifie à chaque modification.

**App Check (anti-robots, conseillé avant l'ouverture)** : seule ta vraie app peut alors parler à Firebase, pas un script qui créerait des milliers de comptes ou gonflerait ta facture.
1. **Google Cloud → Sécurité → reCAPTCHA** (même projet que Firebase) : crée une clé de site **Web**, avec ton domaine (ex. `dmixview-jpg.github.io`).
2. **Firebase → App Check → Applications** : enregistre l'app Web avec **reCAPTCHA Enterprise** et cette clé.
3. Ajoute la clé dans `public/firebase-config.js` : `appCheck: '6Lc…'`.
4. Laisse App Check en mode **surveillance** quelques jours (Firebase → App Check → API → Firestore, Authentication). Active l'**application obligatoire** (« Enforce ») quand presque toutes les requêtes sont vérifiées.
5. Apps des magasins : App Check n'y est pas encore actif (il faudrait App Attest et Play Integrity). N'active pas « Enforce » avant de publier les apps, ou elles seraient bloquées.

**En-têtes de sécurité** : chaque page déclare une politique de sécurité du contenu (CSP) qui n'autorise que les fichiers de l'app, Firebase et reCAPTCHA. Le fichier `public/_headers` ajoute la protection contre l'affichage dans un faux site (clickjacking) et le https obligatoire. Netlify et Cloudflare Pages l'appliquent ; GitHub Pages l'ignore.

**Autres protections en place**
- SDK Firebase 12.19 inclus dans l'app ; `npm audit` ne signale aucune faille connue.
- Android : sauvegarde des données de l'app désactivée (`allowBackup="false"`), pour que la session et la copie Premium ne puissent pas être extraites d'une sauvegarde. iOS : aucune exception au https.
- Workflows GitHub : chaque action est épinglée par son empreinte (commit), pour qu'une action piratée ne puisse pas voler tes clés de signature. Dependabot (`.github/dependabot.yml`) propose les mises à jour chaque semaine.
- Aucun secret dans l'historique Git (vérifié : clés Firebase, Apple, Google, RevenueCat, fichiers de clés).

**À faire toi-même**
- Double authentification (application ou clé de sécurité, pas SMS) sur GitHub, Google/Firebase, Apple, Google Play et RevenueCat. Un gestionnaire de mots de passe, un mot de passe unique par service.
- GitHub → **Settings → Branches** : protège `main` (fusion par PR seulement). **Settings → Code security** : active Dependabot et Secret scanning.
- Google Cloud → **IAM** : donne au compte de service de `FIREBASE_SERVICE_ACCOUNT` seulement les rôles nécessaires (Cloud Datastore User, Firebase Authentication Admin), pas « Propriétaire ».
- Firebase → **Authentication → Paramètres** : active la protection contre l'énumération des adresses e-mail.
- Firebase → **Authentication → Paramètres → Règles relatives aux mots de passe** : 8 caractères minimum, au moins une lettre et un chiffre, mode **Appliquer**. L'app affiche déjà ces exigences.
- Firebase → **Utilisation et facturation** : alerte de budget (ex. 5 $).

## Tableau de bord des abonnements (admin)

La page `admin.html` (ex. : `https://<ton-site>/admin.html`) résume tous les abonnements de l'App Store et de Google Play (RevenueCat) : abonnés payants, essais en cours, revenu mensuel récurrent, paiements en retard, annulations prévues et départs des 30 derniers jours. La section « À faire » signale les paiements en retard, les essais qui se terminent d'ici 3 jours et les annulations demandées. La page est en lecture seule ; remboursements et factures se font chez Apple et Google.

**Abonnés des magasins.** Ils y apparaissent dès que les fonctions Firebase du dossier `functions/` sont déployées (section « App Store et Google Play »). L'app donne aussi le courriel du compte à RevenueCat pour reconnaître chaque abonné. Le revenu des magasins est estimé avec les prix de `abonnement.json`, avant la commission d'Apple ou de Google. Les achats de test (sandbox) sont listés avec la mention « Test », mais ne sont pas comptés.

**Accès réservé.** Seuls les comptes marqués administrateur peuvent lire ces données (règles de `firestore.rules`). Pour te donner l'accès :
1. Crée ton compte dans l'app (comme un utilisateur).
2. Sur GitHub : **Actions → Nommer un administrateur → Run workflow**, écris ton courriel, puis **Run workflow**. (Le secret `FIREBASE_SERVICE_ACCOUNT` doit exister, voir « Contenu Premium : protection et mise en route ».)
3. Dans l'app, déconnecte-toi puis reconnecte-toi : le menu « Mon compte » affiche maintenant **📊 Tableau de bord des abonnements**.

Pour retirer l'accès, relance le même workflow en cochant « Retirer l'accès ». En local : `FIREBASE_SERVICE_ACCOUNT="$(cat cle.json)" node outils/admin/nommer_admin.mjs courriel@exemple.com`.

## App Store et Google Play

L'app web est emballée en vraies apps iPhone/iPad et Android avec **Capacitor** (dossiers `android/` et `ios/`). Les fichiers de `public/` sont inclus dans l'app : elle marche hors connexion dès le premier lancement. Le SDK Firebase et les polices sont aussi inclus (`public/vendor/`, `public/fonts/`), car Apple interdit de télécharger du code. Aucun Mac n'est nécessaire : le workflow **Apps mobiles** construit les deux apps sur GitHub.

**Ce qui change dans les apps**
- **Paiement** : Apple et Google exigent leurs achats intégrés pour débloquer du contenu. C'est le seul moyen de s'abonner.
  - L'app utilise **RevenueCat** (`public/magasin.js`), gratuit jusqu'à 2 500 $ US de revenus par mois.
  - Un abonnement pris dans l'App Store ou dans Google Play donne le même accès Premium sur le site, avec le même compte.
- **Remboursements et rétractation** : pour les achats dans les magasins, c'est Apple ou Google qui s'en chargent (section « Achat dans l'App Store ou Google Play » des conditions).
- **Mises à jour** :
  - une modification de `public/` demande une nouvelle version dans les magasins, avec un nouvel examen ;
  - le contenu Premium, lui, vient de Firebase et se met à jour sans nouvelle version.
- **Commission** : 15 % pour un petit développeur.

**1. Comptes**
- **Apple Developer Program** : 99 $ US par an, sur <https://developer.apple.com/programs/>.
  - En tant que particulier, ton nom apparaît comme vendeur.
  - Une entreprise doit avoir un numéro D-U-N-S (gratuit).
  - Dans **App Store Connect → Accords**, signe l'accord des apps payantes et remplis les informations bancaires et fiscales : sans cela, pas d'achats intégrés.
- **Google Play Console** : 25 $ US, une seule fois, sur <https://play.google.com/console>.
  - Un nouveau compte personnel doit faire un **test fermé avec au moins 12 testeurs pendant 14 jours** avant la mise en production. Tes amis intéressés peuvent servir de testeurs.
  - Remplis le profil de paiement (Payments profile) pour vendre.
- **RevenueCat** : compte gratuit sur <https://www.revenuecat.com>.

**2. Créer les apps et les abonnements** (détails et prix dans `magasins/FICHE.md`)
1. Apple :
   - **Certificates, Identifiers & Profiles → Identifiers** : enregistre l'identifiant `ca.profdanglais.app`. Il sera définitif après le premier envoi : change-le avant si tu préfères, dans `capacitor.config.json`, `android/app/build.gradle`, le projet iOS et `mobile.yml`.
   - **App Store Connect → Apps → Nouvelle app** : crée l'app avec cet identifiant.
   - **Abonnements** : crée le groupe « Premium », avec les produits `premium_mensuel` et `premium_annuel` (offre d'introduction : 7 jours gratuits).
2. Google : **Play Console → Créer une application**, puis **Monétiser → Abonnements** : crée les mêmes deux produits (forfait de base, plus une offre d'essai gratuit de 7 jours).
3. RevenueCat :
   - ajoute l'app iOS (clé d'achats intégrés d'App Store Connect) et l'app Android (compte de service Google) ;
   - crée le droit d'accès (entitlement) `premium`, rattaché aux quatre produits ;
   - crée une offre (offering) « default » avec les forfaits Monthly et Annual.
4. **Fonctions Firebase** (dossier `functions/`, remplacent l'extension RevenueCat : les extensions Firebase s'arrêtent le 31 mars 2027) :
   - `revenuecatWebhook` reçoit chaque changement d'abonnement (achat, renouvellement, échec de paiement, annulation, expiration, remboursement). Elle ne croit pas le message : elle relit l'abonnement chez RevenueCat avec la clé secrète, puis met à jour l'attribut `revenueCatEntitlements` du compte (lu par `firestore.rules`) et le document `revenuecat/{uid}` (tableau de bord, fin de la période payée).
   - `synchroniserMagasin` : l'app l'appelle juste après un achat ou une restauration, pour activer l'accès sans attendre le webhook. Elle ne touche que le compte connecté, au plus une fois toutes les 10 secondes.
   - `supprimerCompte` : l'app l'appelle quand la personne supprime son compte. Elle efface la progression, la copie de l'abonnement (`revenuecat/{uid}`), la marque d'essai, les données de paiement du site (`customers/{uid}`), la fiche RevenueCat, puis le compte de connexion. Elle exige une connexion de moins de 10 minutes (l'app redemande le mot de passe). Tant qu'elle n'est pas déployée, l'app efface seulement la progression et le compte.
   - `statsAdmin` : chiffres du tableau de bord. La liste nominative des comptes n'est envoyée que lorsque l'administration la demande (bouton de l'onglet des comptes).
   - Deux secrets, rangés dans Secret Manager (jamais dans le code ni dans le chat) :
     - `REVENUECAT_WEBHOOK_SECRET` : une longue valeur aléatoire, aussi collée dans RevenueCat (**Integrations → Webhooks → Authorization header value**) ;
     - `REVENUECAT_API_KEY` : clé API secrète RevenueCat, version V1 (**Project settings → API keys → + New secret API key**).
   - Déploiement depuis **Google Cloud Shell** (<https://shell.cloud.google.com>, déjà connecté à ton compte, rien à installer) :
     ```
     git clone https://github.com/dmixview-jpg/prof-danglais.git && cd prof-danglais
     npx -y firebase-tools@15 functions:secrets:set REVENUECAT_WEBHOOK_SECRET --project prof-danglais-f2db6
     npx -y firebase-tools@15 functions:secrets:set REVENUECAT_API_KEY --project prof-danglais-f2db6
     (cd functions && npm ci)
     npx -y firebase-tools@15 deploy --only functions --project prof-danglais-f2db6
     ```
     Chaque commande `secrets:set` demande la valeur : colle-la toi-même (elle ne s'affiche pas).
   - Dans RevenueCat, **Integrations → Webhooks → + Add** : adresse `https://northamerica-northeast1-prof-danglais-f2db6.cloudfunctions.net/revenuecatWebhook`, en-tête Authorization = la valeur de `REVENUECAT_WEBHOOK_SECRET`, environnement « Both ». Envoie un **test event** : il doit répondre 200.
   - N'utilise pas **Integrations → Firebase** de RevenueCat (il sert à l'extension).
5. Copie les **clés publiques des SDK** RevenueCat (`appl_…`, `goog_…`) dans `outils/programme/abonnement.json`, bloc `magasins`. Lance `python3 outils/programme/construire.py` et republie `firestore.rules` (accès Premium par RevenueCat).
6. Dans **App Store Connect → Tarifs et disponibilité** et **Play Console → Pays**, retire la Chine continentale.

**3. Construire et envoyer** (workflow **Actions → Apps mobiles**)
- À chaque modification de l'app, le workflow vérifie que les deux apps se construisent (onglet Actions, résultat vert). Le paquet Android (`.aab`) est téléchargeable dans les artefacts.
- Secrets GitHub à créer (**Settings → Secrets and variables → Actions**) :
  - **Android** :
    - Crée ta clé d'importation sur ton ordinateur avec `keytool -genkey -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload` (outil fourni avec Java).
    - `ANDROID_KEYSTORE_BASE64` : le fichier encodé, avec `base64 -i upload.jks` sur Mac ou `base64 -w0 upload.jks` sur Linux.
    - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`upload`) et `ANDROID_KEY_PASSWORD`.
    - `PLAY_SERVICE_ACCOUNT_JSON` : le compte de service Google Cloud invité dans la Play Console, avec le droit de publier.
    - Garde `upload.jks` et ses mots de passe en lieu sûr. Avec la signature d'apps par Google Play, une clé d'importation perdue peut être remplacée.
  - **Apple** :
    - `APPLE_TEAM_ID` : identifiant d'équipe à 10 caractères.
    - `ASC_KEY_ID`, `ASC_ISSUER_ID` et `ASC_PRIVATE_KEY` (contenu du fichier `.p8`) : clé d'API d'**App Store Connect → Utilisateurs et accès → Intégrations**, avec le rôle Admin pour que les certificats se créent seuls.
- **Actions → Apps mobiles → Run workflow**, coche « Envoyer aux magasins » et indique le numéro de version. Le workflow construit, signe et envoie la version à **TestFlight** et au **test interne** de Google Play.
- **Premier envoi Google Play** : la Play Console exige que le tout premier `.aab` soit déposé à la main. Télécharge-le dans les artefacts du workflow, puis dépose-le dans **Tests → Test interne**.

**4. Fiche et examen**
- Textes, mots-clés, visuels (`magasins/captures/`) et note pour l'équipe d'examen : `magasins/FICHE.md`.
- Questionnaires de confidentialité (App Store « Confidentialité de l'app », Google « Sécurité des données ») : `magasins/DONNEES.md`.
- Donne un **compte de démonstration** aux équipes d'examen : Pré-A1 s'essaie sans compte, mais l'achat de l'abonnement demande un compte (voir `magasins/DONNEES.md`).
- Teste les achats avec des comptes de test : **Sandbox** chez Apple (TestFlight), **testeurs de licence** chez Google.

## 5. Ajouter l'app à l'écran d'accueil

**iPhone / iPad (Safari)** :
1. Ouvre l'adresse de l'app dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.

L'icône « EN » apparaît et l'app s'ouvre en plein écran, sans la barre de Safari. Ouvre-la une fois avec Internet : ensuite, elle fonctionne aussi en mode avion.

## 6. Personnaliser

| Quoi | Où |
|---|---|
| Leçons, unités, niveaux, dialogues | `outils/programme/`, puis `python3 outils/programme/construire.py` |
| Couleurs, polices, tailles | `public/styles.css` (variables en haut du fichier, et bloc `prefers-color-scheme: dark`) |
| Mots d'exemple du carnet | `public/app.js` : `SAMPLE_VOCAB` |
| Nombre de « Je sais » pour maîtriser un mot | `public/app.js` : `MASTERED` |
| Voix et vitesse | Dans l'app : carte **🔊 Voix américaine**. Dans le code : `pickVoice()` et `RATES` dans `public/app.js` |
| Mascotte, le petit chat bleu | `public/app.js` : fonction `mascot()`. `public/styles.css` : section « Mascotte : petit chat bleu » |
| Logo 3D | `outils/logo/logo3d.py` (Blender, moteur Cycles) : refait les rendus `outils/logo/logo-3d-*.png`. Les commandes sont en tête du fichier. |
| Icônes | `python3 outils/icones.py public/icons` (Python + Pillow) : tire toutes les tailles d'icônes des rendus de `outils/logo/` |
| Nom de l'app | `public/manifest.webmanifest`, `public/index.html` |

Après une modification de fichiers dans `public/`, change le nom du cache dans `public/sw.js` (ex. : `prof-danglais-v14`). Sinon, les appareils gardent l'ancienne version.

Tes données (niveau, progression, étoiles, carnet de vocabulaire, voix choisie) sont enregistrées **dans le navigateur de chaque appareil** (localStorage). Elles ne sont pas synchronisées entre l'iPhone et l'iPad.

## 7. Problèmes fréquents

| Problème | Solution |
|---|---|
| L'iPhone n'arrive pas à ouvrir la page | Même Wi-Fi? Bonne adresse IP? Le serveur tourne-t-il? Le pare-feu de l'ordinateur bloque-t-il `node`? |
| L'app ne marche pas hors ligne | Le mode hors ligne exige une adresse **https** (app en ligne, étape 4). Ouvre l'app une fois avec Internet pour qu'elle se mette en cache. |
| La voix sonne robotique | Télécharge une voix américaine de qualité. Sur iPhone ou iPad : Réglages → Accessibilité → Contenu énoncé → Voix → Anglais → une voix « États-Unis » marquée « Améliorée » ou « Premium » (Ava, Evan, Zoe…). Choisis-la ensuite dans **🔊 Voix américaine**. |
| Pas de son avec 🔊 | Vérifie que l'iPhone n'est pas en mode silencieux et que le volume est monté. |
| L'app affiche une ancienne version | Ferme complètement l'app et rouvre-la. Sinon, change le nom du cache dans `public/sw.js`. |
| `construire.py` affiche des erreurs | Il indique la leçon et le problème (ex. : options en double). Corrige le fichier indiqué et relance. |
| `EADDRINUSE` au démarrage | Le port est déjà pris : mets `PORT=3001` dans `.env`. |
| `node: command not found` | Node.js n'est pas installé, ou le Terminal doit être rouvert après l'installation. |

## Structure du projet

```
prof-danglais/
├── server.js                  # Petit serveur de fichiers sans dépendance (Node 18+)
├── package.json
├── .env.example               # Seul réglage : PORT
├── firestore.rules            # Règles de sécurité Firebase (comptes, contenu payant)
├── firebase.json              # Émulateur Firebase pour tester les règles (npm run test:regles)
├── test/server.test.js        # Tests du serveur et de tout le contenu
├── test/fusion.test.js        # Tests de la fusion des progressions (comptes)
├── test/abonnement.test.js    # Tests de la séparation gratuit / payant
├── test/regles.test.mjs       # Attaques contre les règles Firestore, jouées sur l'émulateur
├── outils/icones.py           # Icônes de l'app, tirées des rendus du logo
├── outils/icones_natives.py   # Icônes et écrans de lancement iOS / Android
├── outils/captures_magasins.py # Visuels des fiches App Store / Google Play
├── capacitor.config.json      # Apps iOS et Android (Capacitor)
├── android/, ios/             # Projets natifs générés par Capacitor
├── magasins/                  # Fiches des magasins, confidentialité, visuels
├── outils/google.mjs          # Connexion aux services Google (compte de service)
├── outils/admin/              # nommer_admin.mjs : accès au tableau de bord
├── outils/logo/               # Logo 3D : script Blender, rendus HD et police Fredoka (OFL)
├── outils/programme/          # Tout le contenu pédagogique (Python) et son générateur
│   ├── construire.py
│   ├── abonnement.json        # Abonnement Premium : actif?, prix affichés, essai gratuit
│   ├── publier_premium.mjs    # Envoie le contenu payant dans Firebase
│   ├── aide.py
│   ├── premiers_pas.py
│   └── contenu/               # a1_u1.py … c2_u4.py, dialogues.py, dialogues_unites.py
└── public/                    # L'app (à publier telle quelle)
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── compte.js              # Comptes utilisateurs et synchronisation (Firebase)
    ├── abonnement.js          # Abonnement Premium (page d'abonnement, accès Premium)
    ├── magasin.js             # Achats intégrés App Store / Google Play (RevenueCat)
    ├── vendor/firebase/       # SDK Firebase inclus dans l'app
    ├── admin.html, admin.js   # Tableau de bord des abonnements (administrateurs)
    ├── fusion.js              # Fusion de la progression appareil + compte
    ├── conditions.html        # Conditions d'utilisation et de vente
    ├── confidentialite.html   # Politique de confidentialité (Loi 25)
    ├── legal-config.js        # Identité du commerçant et date d'entrée en vigueur
    ├── legal.js, legal.css    # Remplissage et mise en page des deux pages
    ├── fonts/                 # Polices hébergées avec l'app (OFL)
    ├── firebase-config.js     # Configuration Firebase (null = sans comptes)
    ├── curriculum.json        # Généré : leçons, bilans et dialogues
    ├── manifest.webmanifest
    ├── sw.js                  # Cache hors ligne
    └── icons/
```

## Licence

© 2026 dmixview-jpg. **Tous droits réservés.** Le code, le contenu pédagogique, le logo et les visuels ne peuvent être ni copiés, ni modifiés, ni republiés sans autorisation écrite. Voir [LICENSE](LICENSE). La police Fredoka garde sa propre licence (SIL OFL).
