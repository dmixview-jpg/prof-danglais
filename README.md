# Prof d'anglais 🇬🇧💬

Ton coach d'anglais personnel, pensé pour un francophone du Québec et utilisé sur **iPhone et iPad** comme une vraie app (PWA).

**100 % gratuit, sans IA, sans compte et sans clé.** Toutes les leçons et tous les dialogues sont rédigés d'avance et intégrés à l'app. Rien n'est envoyé sur Internet. Une fois chargée, l'app fonctionne **entièrement hors ligne**.

- **Un parcours complet, de l'alphabet à la maîtrise** :
  - 7 niveaux (Pré-A1, A1, A2, B1, B2, C1, C2), 36 unités et **179 leçons rédigées** ;
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
- **Recherche** : trouve une leçon par mot-clé (ex. : « present perfect », « courriel »).
- **Conversation : 35 dialogues guidés**, de A1 à C2, un par unité du parcours, plus un dialogue bonus. Exemples : café, famille, médecin, entrevue d'embauche, mystère au bureau, discours de retraite, soirée de hockey, débat public.
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

Le programme suit le **Cadre européen commun de référence (CECR)**, comme les grands cours en ligne (Cambridge English, British Council, BBC Learning English) et la progression des grammaires de référence. Chaque leçon aborde les pièges typiques des francophones du Québec : faux amis, « I have 30 years », « depuis » → present perfect, etc.

| Niveau | Ce que tu sauras faire | Exemples d'unités |
|---|---|---|
| 🌱 **Pré-A1 · Premiers pas** | Prononcer l'alphabet et les sons anglais, compter, saluer | L'alphabet (interactif), épeler, TH / H / R / W, nombres, couleurs, jours et mois |
| 🐣 **A1 · Débutant** | Te présenter, parler de ton quotidien | to be, présent simple, famille et maison, nourriture, présent continu, passé simple |
| 🌿 **A2 · Élémentaire** | Raconter, comparer, faire des projets | passé continu, comparatifs, futur, present perfect, conseils, vie pratique |
| 🌳 **B1 · Intermédiaire** | Te débrouiller partout, travailler en anglais | conditionnels, voix passive, discours indirect, relatives, entrevue d'embauche |
| 🌲 **B2 · Intermédiaire avancé** | Argumenter et nuancer avec aisance | 3ᵉ conditionnel, déduction, phrases complexes, collocations, faux amis |
| 🏔️ **C1 · Avancé** | T'exprimer avec précision dans tous les contextes | inversion, subjonctif, écriture professionnelle, idiomes, accents |
| 🏆 **C2 · Maîtrise** | Comprendre et t'exprimer comme un natif instruit | connotations, figures de style, culture anglophone, écriture experte, art oratoire |

Le niveau choisi dans l'en-tête et celui du parcours vont ensemble : changer l'un change l'autre. Il sélectionne aussi les dialogues de ton niveau dans l'onglet Conversation.

Chaque unité de A1 à C2 se termine par un **dialogue guidé** (nœud 🎭 dans le chemin) qui met en pratique la grammaire et le vocabulaire de l'unité : passé simple pour « Ta fin de semaine », conditionnels pour « Et si on déménageait? », déduction pour « Le mystère du bureau », inversion pour « Un discours pour une collègue »… Réussir le dialogue fait avancer le parcours, que tu l'ouvres depuis le chemin ou depuis l'onglet Conversation.

### Modifier ou ajouter du contenu

Le contenu est écrit en Python, dans un format simple, dans `outils/programme/` :

| Fichier | Contenu |
|---|---|
| `premiers_pas.py` | Niveau Pré-A1 |
| `contenu/a1_u1.py` … `contenu/c2_u4.py` | Une unité par fichier (5 leçons) |
| `contenu/dialogues.py` | Les premiers dialogues guidés |
| `contenu/dialogues_unites.py` | Les dialogues des unités, et l'unité à laquelle chaque dialogue est rattaché |
| `aide.py` | Les petites fonctions pour écrire une leçon : étape, exemple, mot, réplique, exercice |

Après une modification, régénère le fichier lu par l'app :

```bash
python3 outils/programme/construire.py
```

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

L'app peut demander une connexion au démarrage : chaque personne crée son compte (prénom, courriel, mot de passe) et retrouve sa progression sur tous ses appareils. Tant que `public/firebase-config.js` contient `null`, l'app fonctionne **sans comptes**, comme avant.

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

## Abonnement payant (Stripe)

Pré-A1 reste gratuit ; les niveaux A1 à C2 et les dialogues guidés demandent un abonnement Premium (mensuel ou annuel, avec essai gratuit). Tant que `actif` vaut `false` dans `outils/programme/abonnement.json`, tout reste gratuit, comme avant.

**Comment le contenu est protégé**
- Avec l'abonnement actif, `construire.py` ne met dans `public/curriculum.json` que le contenu gratuit ; les niveaux payants n'y gardent que leurs titres (avec un cadenas). Le contenu payant va dans `outils/premium/contenu.json` (jamais publié ni enregistré dans Git).
- `outils/programme/publier_premium.mjs` l'envoie dans Firestore (`contenu/{niveau}`). Les règles de `firestore.rules` ne le laissent lire qu'aux comptes abonnés (`stripeRole == 'premium'`, ajouté par l'extension Stripe). Les abonnés en gardent une copie sur l'appareil pour l'usage hors connexion ; elle est retirée si l'abonnement se termine.
- Le code est dans `public/abonnement.js` (page « Débloque tout le parcours », paiement, gestion de l'abonnement).

**Mise en route** (après avoir activé les comptes, section précédente)
1. **Firebase → Utilisation et facturation → Modifier le forfait → Blaze** (paiement à l'usage, nécessaire à l'extension Stripe). Ajoute une alerte de budget, par exemple 5 $.
2. Crée un compte sur <https://stripe.com> et travaille d'abord en **mode test**.
3. **Stripe → Catalogue de produits → Ajouter un produit** « Prof d'anglais Premium ». Dans ses **métadonnées**, ajoute `firebaseRole` = `premium`. Crée deux prix récurrents en CAD : 6,99 $ par mois et 49,99 $ par an.
4. **Stripe → Paramètres → Portail client** : active-le (annulation, changement de formule, carte de paiement).
5. **Firebase → Extensions → « Run Payments with Stripe »** : installe-la en suivant ses instructions (clé API Stripe, webhook à créer dans Stripe). Collections : `customers` et `products`. Pour « Automatically delete Stripe customer objects », garde « Do not delete » (l'historique des paiements reste dans Stripe pour ta comptabilité). Reporte dans `abonnement.json` la région choisie (`region`) et, si tu as changé l'identifiant de l'extension, le nom de la fonction du portail (`fonctionPortail` : `ext-<identifiant>-createPortalLink`).
6. Dans `outils/programme/abonnement.json` : remplace les `price_A_REMPLACER_…` par les identifiants de tes prix Stripe, vérifie les montants affichés, puis mets `"actif": true`.
7. **Firebase → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée**. Copie tout le contenu du fichier dans un secret GitHub nommé `FIREBASE_SERVICE_ACCOUNT` (**Settings → Secrets and variables → Actions**). Cette clé est secrète : ne la mets jamais dans le dépôt.
8. **Rends le dépôt GitHub privé** : sinon les leçons payantes restent lisibles dans les fichiers du programme (`outils/programme/`). Avec un compte GitHub gratuit, GitHub Pages ne publie pas un dépôt privé : héberge alors `public/` sur Netlify ou Cloudflare Pages (gratuits, reliés au dépôt privé), et ajoute la nouvelle adresse aux domaines autorisés de Firebase.
9. Lance `python3 outils/programme/construire.py`, puis publie sur `main`. Le workflow « Publier le contenu Premium » envoie le contenu payant dans Firebase. Tu peux vérifier en local avec `node outils/programme/publier_premium.mjs --essai`.
10. Teste un abonnement en mode test avec la carte `4242 4242 4242 4242`, puis passe Stripe en mode réel (nouvelles clés dans l'extension, nouveaux identifiants de prix dans `abonnement.json`).

**Règles de gestion déjà programmées**
- L'essai gratuit (`essaiJours`) n'est offert qu'une fois : une personne qui a déjà eu un abonnement voit « S'abonner », sans nouvel essai.
- Paiement refusé : l'extension retire l'accès Premium dès que l'abonnement passe « en retard », pendant que Stripe réessaie. Dans l'app, la page d'abonnement affiche alors « Mettre à jour mon paiement » (portail Stripe) ; l'accès revient dès que le paiement passe.
- Annulation : l'accès reste ouvert jusqu'à la fin de la période payée, puis les niveaux A1 à C2 se verrouillent et la copie hors connexion est effacée.
- Un compte avec un abonnement actif ne peut pas être supprimé dans l'app : il faut d'abord annuler l'abonnement (sinon Stripe continuerait de facturer).

**À prévoir avant d'ouvrir les abonnements :** des conditions d'utilisation, une politique de confidentialité et une politique de remboursement (Stripe et la loi les demandent). Au Québec, l'inscription aux taxes TPS/TVQ est obligatoire au-delà de 30 000 $ de revenus sur 12 mois ; Stripe Tax peut les calculer.

## Tableau de bord des abonnements (admin)

La page `admin.html` (ex. : `https://<ton-site>/admin.html`) résume les abonnements : abonnés payants, essais en cours, revenu mensuel récurrent, paiements en retard, annulations prévues et départs des 30 derniers jours. La section « À faire » signale les paiements en retard, les essais qui se terminent d'ici 3 jours et les annulations demandées, avec un lien vers la fiche Stripe de chaque personne. La page est en lecture seule ; remboursements et factures se font dans Stripe.

**Accès réservé.** Seuls les comptes marqués administrateur peuvent lire ces données (règles de `firestore.rules`). Pour te donner l'accès :
1. Crée ton compte dans l'app (comme un utilisateur).
2. Sur GitHub : **Actions → Nommer un administrateur → Run workflow**, écris ton courriel, puis **Run workflow**. (Le secret `FIREBASE_SERVICE_ACCOUNT` doit exister, voir « Abonnement payant ».)
3. Dans l'app, déconnecte-toi puis reconnecte-toi : le menu « Mon compte » affiche maintenant **📊 Tableau de bord des abonnements**.

Pour retirer l'accès, relance le même workflow en cochant « Retirer l'accès ». En local : `FIREBASE_SERVICE_ACCOUNT="$(cat cle.json)" node outils/admin/nommer_admin.mjs courriel@exemple.com`.

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
├── firestore.rules            # Règles de sécurité Firebase (comptes, contenu payant, Stripe)
├── test/server.test.js        # Tests du serveur et de tout le contenu
├── test/fusion.test.js        # Tests de la fusion des progressions (comptes)
├── test/abonnement.test.js    # Tests de la séparation gratuit / payant
├── outils/icones.py           # Icônes de l'app, tirées des rendus du logo
├── outils/google.mjs          # Connexion aux services Google (compte de service)
├── outils/admin/              # nommer_admin.mjs : accès au tableau de bord
├── outils/logo/               # Logo 3D : script Blender, rendus HD et police Fredoka (OFL)
├── outils/programme/          # Tout le contenu pédagogique (Python) et son générateur
│   ├── construire.py
│   ├── abonnement.json        # Abonnement Premium : actif?, prix Stripe, essai gratuit
│   ├── publier_premium.mjs    # Envoie le contenu payant dans Firebase
│   ├── aide.py
│   ├── premiers_pas.py
│   └── contenu/               # a1_u1.py … c2_u4.py, dialogues.py, dialogues_unites.py
└── public/                    # L'app (à publier telle quelle)
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── compte.js              # Comptes utilisateurs et synchronisation (Firebase)
    ├── abonnement.js          # Abonnement Premium (page d'abonnement, Stripe)
    ├── admin.html, admin.js   # Tableau de bord des abonnements (administrateurs)
    ├── fusion.js              # Fusion de la progression appareil + compte
    ├── firebase-config.js     # Configuration Firebase (null = sans comptes)
    ├── curriculum.json        # Généré : leçons, bilans et dialogues
    ├── manifest.webmanifest
    ├── sw.js                  # Cache hors ligne
    └── icons/
```

## Licence

© 2026 dmixview-jpg. **Tous droits réservés.** Le code, le contenu pédagogique, le logo et les visuels ne peuvent être ni copiés, ni modifiés, ni republiés sans autorisation écrite. Voir [LICENSE](LICENSE). La police Fredoka garde sa propre licence (SIL OFL).
