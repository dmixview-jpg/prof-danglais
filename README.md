# Prof d'anglais 🇬🇧💬

Ton coach d'anglais personnel, pensé pour un francophone du Québec et utilisé sur **iPhone et iPad** comme une vraie app (PWA). Il est propulsé par Claude (Anthropic).

- **Leçon** : choisis un sujet. Claude prépare une leçon adaptée à ton niveau, avec des explications en français, des exemples à écouter, du vocabulaire et un petit quiz.
- **Conversation** : discute en anglais avec « Coach ». Il te répond simplement et corrige ton dernier message dans un encadré jaune.
- **Vocabulaire** : cartes mémoire (anglais / français). Un mot est maîtrisé après 3 « Je sais ».
- **Prononciation** : un bouton 🔊 sur chaque exemple, chaque mot et chaque réponse du coach.
- Niveaux **A1 à C1**, mode sombre automatique, fonctionne hors ligne pour ce qui est déjà chargé.

La clé API reste sur le serveur : elle n'est jamais envoyée au navigateur.

---

## 1. Installer Node.js

Il faut **Node.js 18 ou plus récent**. Aucun autre paquet n'est nécessaire.

1. Va sur <https://nodejs.org> et télécharge la version **LTS**.
2. Installe-la (macOS ou Windows), puis ouvre le Terminal (ou PowerShell) et vérifie :

   ```bash
   node -v
   ```

   Tu dois voir `v18` ou plus.

## 2. Créer ta clé API Anthropic

1. Va sur <https://console.anthropic.com> et crée un compte (ou connecte-toi).
2. Dans **Billing**, ajoute un moyen de paiement ou des crédits. L'utilisation est facturée à l'usage : une leçon coûte environ quelques cents, un message de conversation beaucoup moins.
3. Dans **API Keys**, clique sur **Create Key**, donne-lui un nom (ex. : « prof-danglais ») et **copie la clé** (elle commence par `sk-ant-`). Elle ne s'affiche qu'une fois.

> Ne partage jamais cette clé et ne la mets jamais dans Git.

## 3. Configurer le fichier `.env`

Dans le dossier du projet :

```bash
cp .env.example .env
```

Puis ouvre `.env` avec un éditeur de texte et remplis-le :

```ini
ANTHROPIC_API_KEY=sk-ant-ta-cle-ici
APP_CODE=un-code-secret-a-toi
MODEL_LESSON=claude-sonnet-5-5
MODEL_CHAT=claude-haiku-5-5
PORT=3000
```

| Variable | Rôle | Défaut |
|---|---|---|
| `ANTHROPIC_API_KEY` | Ta clé Anthropic (obligatoire) | — |
| `APP_CODE` | Code demandé dans l'app (conseillé à la maison, **obligatoire en ligne**) | aucun |
| `MODEL_LESSON` | Modèle qui prépare les leçons | `claude-sonnet-5-5` |
| `MODEL_CHAT` | Modèle de la conversation (rapide et économique) | `claude-haiku-5-5` |
| `PORT` | Port du serveur | `3000` |

## 4. Démarrer

```bash
npm start
```

Ouvre <http://localhost:3000> sur ton ordinateur. Pour arrêter le serveur : `Ctrl + C`.

Pour lancer les tests (ils simulent Anthropic, aucun appel réel ni frais) :

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

## 6. Héberger en ligne sur Render (accès partout)

1. Mets le projet sur GitHub (le fichier `.env` est exclu grâce au `.gitignore`).
2. Sur <https://render.com>, crée un compte, puis **New → Web Service** et choisis ton dépôt.
3. Réglages :
   - **Runtime** : Node
   - **Build Command** : `npm install` (rien n'est installé, mais Render l'exige)
   - **Start Command** : `npm start`
4. Dans **Environment**, ajoute les variables `ANTHROPIC_API_KEY` et **`APP_CODE`**. Ne crée pas `PORT` : Render le fournit lui-même.
5. Déploie. Ton app est disponible à une adresse du type `https://prof-danglais.onrender.com`.

> ⚠️ **En ligne, le code d'accès est obligatoire.** Sans `APP_CODE`, n'importe qui trouvant l'adresse pourrait utiliser ta clé, et c'est toi qui paierais. Choisis un code long et difficile à deviner.

Le forfait gratuit de Render met le service en veille après une période d'inactivité. Le premier chargement peut alors prendre 30 à 60 secondes.

## 7. Ajouter l'app à l'écran d'accueil

**iPhone / iPad (Safari)** :
1. Ouvre l'adresse de l'app dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.

L'icône « EN » bleue apparaît et l'app s'ouvre en plein écran, sans la barre de Safari. Le code d'accès est demandé une fois, puis gardé sur l'appareil.

## 8. Personnaliser

| Quoi | Où |
|---|---|
| Couleurs, polices, tailles | `public/styles.css` (variables en haut du fichier, et bloc `prefers-color-scheme: dark`) |
| Sujets suggérés, scénarios de conversation, message d'accueil | `public/app.js` : `TOPICS`, `SCENARIOS`, `WELCOME` |
| Leçon et mots d'exemple | `public/app.js` : `SAMPLE_LESSON`, `SAMPLE_VOCAB` |
| Nombre de « Je sais » pour maîtriser un mot | `public/app.js` : `MASTERED` |
| Vitesse de la voix | `public/app.js` : `u.rate = 0.92` dans `speak()` |
| Consignes données à Claude (style des leçons, du coach) | `server.js` : `LESSON_SYSTEM` et `CHAT_SYSTEM` |
| Modèles utilisés | `.env` : `MODEL_LESSON`, `MODEL_CHAT` |
| Nom et icônes de l'app | `public/manifest.webmanifest`, `public/index.html`, `public/icons/` |

Après une modification de fichiers dans `public/`, change le nom du cache dans `public/sw.js` (ex. : `prof-danglais-v2`) pour que les appareils récupèrent la nouvelle version.

Tes données (niveau, leçon courante, conversation, carnet de vocabulaire) sont enregistrées **dans le navigateur de chaque appareil** (localStorage). Elles ne sont pas synchronisées entre l'iPhone et l'iPad.

## 9. Problèmes fréquents

| Problème | Solution |
|---|---|
| « Clé API manquante » | Le fichier `.env` n'existe pas ou `ANTHROPIC_API_KEY` est vide. Vérifie le fichier, puis redémarre avec `npm start`. |
| « Clé API refusée par Anthropic » | La clé est mal copiée ou a été supprimée. Crées-en une nouvelle sur console.anthropic.com. |
| « Trop de demandes ou crédit épuisé » | Ajoute des crédits dans **Billing** sur console.anthropic.com, ou attends une minute. |
| « Modèle introuvable » | Vérifie l'orthographe de `MODEL_LESSON` / `MODEL_CHAT` dans `.env`, ou supprime ces lignes pour utiliser les valeurs par défaut. |
| L'iPhone n'arrive pas à ouvrir la page | Même Wi-Fi? Bonne adresse IP? Le serveur tourne-t-il? Le pare-feu de l'ordinateur bloque-t-il `node`? |
| `EADDRINUSE` au démarrage | Le port est déjà pris : change `PORT` dans `.env` (ex. : `3001`). |
| Le code d'accès est redemandé | Le code a changé sur le serveur ou est mal saisi. Entre le code actuel. |
| Pas de son avec 🔊 | Vérifie que l'iPhone n'est pas en mode silencieux (bouton sur le côté) et que le volume est monté. |
| L'app affiche une ancienne version | Ferme complètement l'app et rouvre-la. Sinon, change le nom du cache dans `public/sw.js`. |
| `node: command not found` | Node.js n'est pas installé ou le Terminal doit être rouvert après l'installation. |
| Le premier chargement sur Render est très lent | Normal avec le forfait gratuit : le service se réveille. |

## Structure du projet

```
prof-danglais/
├── server.js              # Serveur Node sans dépendance + relais vers l'API Anthropic
├── package.json
├── .env.example           # Modèle de configuration
├── test/server.test.js    # Tests avec un faux Anthropic
└── public/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── manifest.webmanifest
    ├── sw.js              # Cache hors ligne (jamais pour /api/)
    └── icons/
```

### API du serveur

| Route | Corps | Réponse |
|---|---|---|
| `GET /api/health` | — | `{ ok, needsCode, hasKey }` |
| `POST /api/lesson` | `{ topic, level }` | La leçon en JSON |
| `POST /api/chat` | `{ level, messages }` | `{ content, fix }` |

Si `APP_CODE` est défini, les routes `POST` exigent l'en-tête `x-app-code`. Sinon, elles répondent `401`.
