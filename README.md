# Prof d'anglais 🇬🇧💬

Ton coach d'anglais personnel, pensé pour un francophone du Québec et utilisé sur **iPhone et iPad** comme une vraie app (PWA). L'app est **100 % gratuite** : elle utilise des modèles d'IA **open source** (Llama, Qwen, Mistral, Gemma…) chez des fournisseurs gratuits, ou directement sur ton ordinateur.

- **Un petit chat bleu animé** te guide partout. Il remue la queue et frétille de l'oreille. Il salue, réfléchit pendant que l'IA travaille, parle quand tu touches 🔊, saute de joie quand tu réponds juste et fait « oups » quand tu te trompes. Il est dessiné en code : aucune image à télécharger.
- **Un parcours complet, de l'alphabet à la maîtrise** : 7 niveaux (Pré-A1, A1, A2, B1, B2, C1, C2), 36 unités et 179 leçons, plus un bilan à la fin de chaque unité. Le bouton « Continuer » ouvre toujours la prochaine leçon, et chaque leçon terminée rapporte jusqu'à 3 étoiles. Voir la section [Le parcours](#le-parcours).
- **Leçon** : chaque leçon contient :
  - des explications en étapes illustrées ;
  - des exemples à écouter ;
  - un dialogue de la vie réelle ;
  - des mots utiles ;
  - une astuce sur les pièges des francophones ;
  - 7 exercices de 3 types : choix de réponse, écoute (« Qu'as-tu entendu? ») et remise des mots en ordre.
- **Leçon libre** : tu peux aussi demander une leçon sur n'importe quel sujet.
- **Conversation** : discute en anglais avec « Coach ». Il te répond simplement et corrige ton dernier message dans un encadré jaune.
- **Vocabulaire** : cartes mémoire (anglais / français). Un mot est maîtrisé après 3 « Je sais ».
- **Prononciation** : un bouton 🔊 sur chaque exemple, chaque mot et chaque réponse du coach. La voix est celle de l'iPhone : gratuite et sans Internet.
- Niveaux **A1 à C1**, mode sombre automatique, fonctionne hors ligne pour ce qui est déjà chargé.
- **S'adapte à chaque appareil** : testée sur tous les formats d'iPhone, du SE 1re génération à l'iPhone 17 Pro Max (encoche et Dynamic Island compris). En portrait, les onglets sont en bas et disparaissent quand le clavier s'ouvre. En paysage, ils passent dans un en-tête mince pour garder un maximum de place. Sur iPad, ils passent en haut à droite. Sur grand iPad en paysage, la leçon et le vocabulaire s'affichent sur deux colonnes. Le portrait, le paysage et le Split View / Slide Over sont aussi pris en charge.

La clé API reste sur le serveur : elle n'est jamais envoyée au navigateur.

---

## Le parcours

Le programme suit le **Cadre européen commun de référence (CECR)**, comme les grands cours en ligne (Cambridge English, British Council, BBC Learning English) et la progression des grammaires de référence. Il est pensé pour un francophone du Québec : chaque leçon aborde les pièges typiques (faux amis, « I have 30 years », depuis → present perfect, etc.).

| Niveau | Ce que tu sauras faire | Exemples d'unités |
|---|---|---|
| 🌱 **Pré-A1 · Premiers pas** | Prononcer l'alphabet et les sons anglais, compter, saluer | L'alphabet (interactif), épeler, TH / H / R / W, nombres, couleurs, jours et mois |
| 🐣 **A1 · Débutant** | Te présenter, parler de ton quotidien | to be, présent simple, famille et maison, nourriture, présent continu, passé simple |
| 🌿 **A2 · Élémentaire** | Raconter, comparer, faire des projets | passé continu, comparatifs, futur, present perfect, conseils, vie pratique |
| 🌳 **B1 · Intermédiaire** | Te débrouiller partout, travailler en anglais | conditionnels, voix passive, discours indirect, relatives, entrevue d'embauche |
| 🌲 **B2 · Intermédiaire avancé** | Argumenter et nuancer avec aisance | 3ᵉ conditionnel, déduction, phrases complexes, collocations, faux amis |
| 🏔️ **C1 · Avancé** | T'exprimer avec précision dans tous les contextes | inversion, subjonctif, écriture professionnelle, idiomes, accents |
| 🏆 **C2 · Maîtrise** | Comprendre et t'exprimer comme un natif instruit | connotations, figures de style, culture anglophone, écriture experte, art oratoire |

**Comment les leçons sont créées :**
- **Pré-A1, rédigé à la main.** Les 9 leçons des premiers pas sont écrites directement dans l'app. Elles fonctionnent sans IA et hors ligne.
- **A1 à C2, générées par l'IA.** L'IA génère chaque leçon la première fois, à partir de l'objectif pédagogique détaillé que fixe le programme. La leçon est ensuite **gardée sur l'appareil** : elle s'ouvre instantanément la fois suivante, même hors ligne. Le bouton **↻** demande une nouvelle version si une leçon ne te plaît pas.
- **Les bilans d'unité** révisent toutes les leçons de l'unité.

Pour modifier le programme, ajouter une leçon ou changer un objectif, édite `outils/programme/programme.py` (A1 à C2) ou `outils/programme/premiers_pas.py` (Pré-A1), puis lance :

```bash
python3 outils/programme/construire.py
```

Cette commande régénère `public/curriculum.json`.

## 1. Installer Node.js

Il faut **Node.js 18 ou plus récent**. Aucun autre paquet n'est nécessaire.

1. Va sur <https://nodejs.org> et télécharge la version **LTS**.
2. Installe-la (macOS ou Windows), puis ouvre le Terminal (ou PowerShell) et vérifie :

   ```bash
   node -v
   ```

   Tu dois voir `v18` ou plus.

## 2. Choisir ton IA gratuite (open source)

Le serveur parle le format standard « compatible OpenAI ». Il fonctionne donc avec beaucoup de services. Trois options sont préréglées :

| Fournisseur | Modèle par défaut | Coût | Pour qui |
|---|---|---|---|
| **Groq** (conseillé) | Llama 3.3 70B (Meta, open source) | Gratuit, sans carte de crédit. Environ 1 000 requêtes par jour et 30 par minute. | Le meilleur choix pour commencer : rapide, bon en français, fonctionne même en ligne (Render). |
| **OpenRouter** | `meta-llama/llama-3.3-70b-instruct:free` | Gratuit avec les modèles qui finissent par `:free` (limite quotidienne). | Pour essayer d'autres modèles open source gratuits (Qwen, Mistral, Gemma, DeepSeek…). |
| **Ollama** | Qwen 2.5 7B (Alibaba, open source) | Gratuit et **illimité**, 100 % privé. | Si ton ordinateur a au moins 8 Go de RAM. L'ordinateur doit rester allumé. |

> Les limites gratuites changent parfois. Consulte la page « Limits » de ton fournisseur pour les chiffres à jour.

### Option A : Groq (conseillé)

1. Va sur <https://console.groq.com> et crée un compte gratuit (Google ou courriel).
2. Ouvre **API Keys** → **Create API Key**, donne-lui un nom (ex. : « prof-danglais ») et **copie la clé** (elle commence par `gsk_`).

### Option B : OpenRouter

1. Va sur <https://openrouter.ai> et crée un compte gratuit.
2. Ouvre **Keys** → **Create Key** et copie la clé (elle commence par `sk-or-`).
3. Pour choisir un autre modèle gratuit, cherche les modèles marqués **(free)** sur <https://openrouter.ai/models> et copie leur identifiant (finissant par `:free`) dans `MODEL_LESSON` et `MODEL_CHAT`.

### Option C : Ollama (sur ton ordinateur, sans compte)

1. Installe Ollama depuis <https://ollama.com>, puis ouvre l'application.
2. Dans le Terminal, télécharge le modèle (environ 4,7 Go) :

   ```bash
   ollama pull qwen2.5:7b
   ```

3. Aucune clé n'est nécessaire. Laisse Ollama ouvert pendant que tu utilises l'app.

Autres modèles open source qui fonctionnent bien : `llama3.1:8b`, `gemma3:12b`, `mistral-nemo` (mets le nom dans `MODEL_LESSON` et `MODEL_CHAT` après un `ollama pull`).

> Ne partage jamais ta clé et ne la mets jamais dans Git.

## 3. Configurer le fichier `.env`

Dans le dossier du projet :

```bash
cp .env.example .env
```

Puis ouvre `.env` avec un éditeur de texte et remplis-le. Exemple avec Groq :

```ini
AI_PROVIDER=groq
AI_API_KEY=gsk_ta-cle-ici
APP_CODE=un-code-secret-a-toi
```

Exemple avec Ollama :

```ini
AI_PROVIDER=ollama
APP_CODE=un-code-secret-a-toi
```

| Variable | Rôle | Défaut |
|---|---|---|
| `AI_PROVIDER` | `groq`, `openrouter` ou `ollama` | `groq` |
| `AI_API_KEY` | Clé gratuite du fournisseur (inutile avec Ollama) | — |
| `APP_CODE` | Code demandé dans l'app (conseillé à la maison, **obligatoire en ligne**) | aucun |
| `MODEL_LESSON` | Modèle qui prépare les leçons | selon le fournisseur |
| `MODEL_CHAT` | Modèle de la conversation | selon le fournisseur |
| `AI_BASE_URL` | Adresse d'un autre service compatible OpenAI (LM Studio, Together, Mistral…) | selon le fournisseur |
| `PORT` | Port du serveur | `3000` |

## 4. Démarrer

```bash
npm start
```

Le Terminal affiche le fournisseur et les modèles utilisés. Ouvre <http://localhost:3000> sur ton ordinateur. Pour arrêter le serveur : `Ctrl + C`.

Pour lancer les tests (ils simulent l'IA, aucun appel réel) :

```bash
npm test
```

## 5. Utiliser l'app sur ton iPhone ou ton iPad (même Wi-Fi)

1. L'ordinateur et l'iPhone doivent être sur le **même réseau Wi-Fi**.
2. Trouve l'adresse IP locale de l'ordinateur :
   - **macOS** : Réglages Système → Wi-Fi → Détails, ou dans le Terminal : `ipconfig getifaddr en0`
   - **Windows** : `ipconfig` dans PowerShell, ligne « Adresse IPv4 »
3. Sur l'iPhone, ouvre Safari et va à `http://ADRESSE-IP:3000` (ex. : `http://192.168.1.42:3000`).
4. Si macOS demande d'autoriser les connexions entrantes pour `node`, accepte.

> En Wi-Fi local (http), l'app fonctionne, mais le mode hors ligne (service worker) ne s'active qu'en **https**, donc une fois hébergée en ligne.

## 6. Héberger en ligne gratuitement sur Render (accès partout)

Render offre un forfait gratuit pour les petits serveurs. Avec Groq ou OpenRouter, tout reste gratuit. (Ollama, lui, ne fonctionne que sur ton ordinateur.)

1. Mets le projet sur GitHub (le fichier `.env` est exclu grâce au `.gitignore`).
2. Sur <https://render.com>, crée un compte gratuit, puis **New → Web Service** et choisis ton dépôt.
3. Réglages :
   - **Runtime** : Node
   - **Instance type** : Free
   - **Build Command** : `npm install` (rien n'est installé, mais Render l'exige)
   - **Start Command** : `npm start`
4. Dans **Environment**, ajoute `AI_PROVIDER`, `AI_API_KEY` et **`APP_CODE`**. Ne crée pas `PORT` : Render le fournit lui-même.
5. Déploie. Ton app est disponible à une adresse du type `https://prof-danglais.onrender.com`.

> ⚠️ **En ligne, le code d'accès est obligatoire.** Sans `APP_CODE`, n'importe qui trouvant l'adresse pourrait épuiser ta limite gratuite. Choisis un code long et difficile à deviner.

Le forfait gratuit de Render met le service en veille après une période d'inactivité. Le premier chargement peut alors prendre 30 à 60 secondes.

## 7. Ajouter l'app à l'écran d'accueil

**iPhone / iPad (Safari)** :
1. Ouvre l'adresse de l'app dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.

L'icône 3D « EN » apparaît et l'app s'ouvre en plein écran, sans la barre de Safari. Le code d'accès est demandé une fois, puis gardé sur l'appareil.

## 8. Personnaliser

| Quoi | Où |
|---|---|
| Couleurs, polices, tailles | `public/styles.css` (variables en haut du fichier, et bloc `prefers-color-scheme: dark`) |
| Programme du parcours (niveaux, unités, leçons) | `outils/programme/`, puis `python3 outils/programme/construire.py` |
| Sujets suggérés, scénarios de conversation, message d'accueil | `public/app.js` : `TOPICS`, `SCENARIOS`, `WELCOME` |
| Leçon et mots d'exemple | `public/app.js` : `SAMPLE_LESSON`, `SAMPLE_VOCAB` |
| Nombre de « Je sais » pour maîtriser un mot | `public/app.js` : `MASTERED` |
| Vitesse de la voix | `public/app.js` : `u.rate = 0.92` dans `speak()` |
| Consignes données à l'IA (style des leçons, du coach) | `server.js` : `LESSON_SYSTEM` et `CHAT_SYSTEM` |
| Mascotte, le petit chat bleu (dessin, couleurs, animations) | `public/app.js` : fonction `mascot()`. `public/styles.css` : section « Mascotte : petit chat bleu » |
| Fournisseurs et modèles par défaut | `server.js` : `PROVIDERS`, ou `.env` |
| Icônes 3D | `outils/icones.py` (Python + Pillow), puis `python3 outils/icones.py public/icons` |
| Nom de l'app | `public/manifest.webmanifest`, `public/index.html` |

Après une modification de fichiers dans `public/`, change le nom du cache dans `public/sw.js` (ex. : `prof-danglais-v3`) pour que les appareils récupèrent la nouvelle version.

Tes données (niveau, leçon courante, conversation, carnet de vocabulaire) sont enregistrées **dans le navigateur de chaque appareil** (localStorage). Elles ne sont pas synchronisées entre l'iPhone et l'iPad.

## 9. Problèmes fréquents

| Problème | Solution |
|---|---|
| « Clé API manquante » | Le fichier `.env` n'existe pas ou `AI_API_KEY` est vide. Vérifie le fichier, puis redémarre avec `npm start`. |
| « Clé API refusée » | La clé est mal copiée, a été supprimée, ou ne correspond pas à `AI_PROVIDER` (une clé Groq ne marche pas sur OpenRouter). |
| « Limite gratuite atteinte » | Attends une minute, ou le lendemain si la limite quotidienne est atteinte. Tu peux aussi passer à un autre fournisseur gratuit ou à Ollama. |
| « Modèle introuvable » | Vérifie `MODEL_LESSON` / `MODEL_CHAT` dans `.env`, ou laisse-les vides pour les valeurs par défaut. Les modèles gratuits d'OpenRouter changent parfois : choisis-en un autre marqué `:free`. |
| « Ollama ne répond pas » | Ouvre l'application Ollama. Vérifie dans le Terminal avec `ollama list` que le modèle est téléchargé. |
| Une leçon du parcours est décevante | Touche ↻ en haut de la leçon pour en générer une nouvelle version. |
| « La leçon reçue était incomplète » | Le modèle a mal formé sa réponse (fréquent avec les petits modèles). Réessaie, ou choisis un modèle plus grand (ex. : Llama 3.3 70B sur Groq). |
| Les réponses d'Ollama sont très lentes | Normal sur un ordinateur sans carte graphique. Essaie un modèle plus petit, comme `qwen2.5:3b`. |
| L'iPhone n'arrive pas à ouvrir la page | Même Wi-Fi? Bonne adresse IP? Le serveur tourne-t-il? Le pare-feu de l'ordinateur bloque-t-il `node`? |
| `EADDRINUSE` au démarrage | Le port est déjà pris : change `PORT` dans `.env` (ex. : `3001`). |
| Le code d'accès est redemandé | Le code a changé sur le serveur ou est mal saisi. Entre le code actuel. |
| Pas de son avec 🔊 | Vérifie que l'iPhone n'est pas en mode silencieux (bouton sur le côté) et que le volume est monté. |
| L'app affiche une ancienne version ou l'ancienne icône | Supprime l'app de l'écran d'accueil puis ajoute-la de nouveau. Sinon, change le nom du cache dans `public/sw.js`. |
| `node: command not found` | Node.js n'est pas installé ou le Terminal doit être rouvert après l'installation. |
| Le premier chargement sur Render est très lent | Normal avec le forfait gratuit : le service se réveille. |

## Structure du projet

```
prof-danglais/
├── server.js              # Serveur Node sans dépendance + relais vers l'IA open source
├── package.json
├── .env.example           # Modèle de configuration
├── test/server.test.js    # Tests avec une fausse IA
├── outils/icones.py       # Générateur des icônes 3D
├── outils/programme/      # Programme du parcours (Pré-A1 → C2) et son générateur
└── public/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── manifest.webmanifest
    ├── sw.js              # Cache hors ligne (jamais pour /api/)
    ├── curriculum.json    # Parcours généré par outils/programme/construire.py
    └── icons/
```

### API du serveur

| Route | Corps | Réponse |
|---|---|---|
| `GET /api/health` | — | `{ ok, needsCode, hasKey }` |
| `POST /api/lesson` | `{ topic, level }` ou `{ lessonId }` (leçon du parcours) | La leçon en JSON |
| `POST /api/chat` | `{ level, messages }` | `{ content, fix }` |

Si `APP_CODE` est défini, les routes `POST` exigent l'en-tête `x-app-code`. Sinon, elles répondent `401`.
