# Après une modification : python3 outils/programme/construire.py
# Niveau « Premiers pas » (Pré-A1).

def ch(question, options, answer, explain):
    return {"type": "choice", "question": question, "options": options, "answer": answer, "explain": explain}

def li(audio, options, answer, explain):
    return {"type": "listen", "audio": audio, "options": options, "answer": answer, "explain": explain}

def od(sentence, fr, explain=""):
    return {"type": "order", "sentence": sentence, "fr": fr, "explain": explain}

def st(emoji, text):
    return {"emoji": emoji, "text": text}

def ex(emoji, en, fr):
    return {"emoji": emoji, "en": en, "fr": fr}

def vo(emoji, word, fr, example):
    return {"emoji": emoji, "word": word, "fr": fr, "example": example}

def dl(who, en, fr):
    return {"who": who, "en": en, "fr": fr}

PRE = ("pre", "Pré-A1", "Premiers pas", "🌱", "A1",
 "Découvrir les sons de l’anglais, l’alphabet et tes tout premiers mots.", [
 ("Les sons de l’anglais", "🔤", "Reconnaître et prononcer les lettres et les sons propres à l’anglais.", [
  ("🔤", "L’alphabet", {
    "special": "alphabet",
    "objective": "Reconnaître et prononcer les 26 lettres en anglais.",
    "explanation": [
      st("🔤", "L’anglais utilise les mêmes 26 lettres que le français, mais leurs noms se prononcent autrement. Touche chaque lettre du tableau pour l’entendre."),
      st("⚠️", "Le grand piège : A se dit « é-i », E se dit « i » et I se dit « aï ». C’est presque l’inverse du français!"),
      st("🔁", "G se dit « dji » et J se dit « djé-i ». On les mélange souvent : pense à « Gee! » et au prénom « Jay »."),
      st("🍁", "Z se dit « zed » au Canada et au Royaume-Uni, et « zi » aux États-Unis. Les deux sont corrects."),
    ],
    "examples": [
      ex("📺", "CBC", "La radio-télévision publique anglophone du Canada : « si-bi-si »."),
      ex("🇺🇸", "USA", "Les États-Unis : « iou-èss-é-i »."),
      ex("🕵️", "FBI", "La police fédérale américaine : « èf-bi-aï »."),
      ex("👌", "OK", "D’accord : « ô-ou-ké-i »."),
      ex("🪪", "ID", "Une pièce d’identité : « aï-di »."),
    ],
    "vocab": [
      vo("🐝", "bee", "abeille (se prononce comme B)", "A bee is on the flower."),
      vo("👀", "see", "voir (se prononce comme C)", "I see you!"),
      vo("👁️", "eye", "œil (se prononce comme I)", "Close your eyes."),
      vo("🫵", "you", "tu, vous (se prononce comme U)", "Thank you!"),
      vo("❓", "why", "pourquoi (se prononce comme Y)", "Why not?"),
    ],
    "tip": st("💡", "Plusieurs lettres sonnent comme des mots : B = bee, C = see, I = eye, U = you, Y = why. C’est pour ça qu’on écrit « C U » pour « see you » dans les textos!"),
    "exercises": [
      li("J", ["G", "J", "I"], 1, "J se dit « djé-i » (comme Jay). G se dit « dji »."),
      li("E", ["A", "E", "I"], 1, "E se dit « i » en anglais."),
      li("I", ["A", "E", "I"], 2, "I se dit « aï », comme le mot eye (œil)."),
      ch("The letter ___ sounds like the word « why ».", ["W", "Y", "U"], 1, "Y se dit « ouaï », comme why (pourquoi)."),
      li("H", ["H", "A", "K"], 0, "H se dit « éitch »."),
      ch("In Canada, the letter Z is usually called « ___ ».", ["zee", "zed", "zeta"], 1, "Au Canada, on dit « zed ». Aux États-Unis, « zee »."),
    ],
  }),
  ("🗣️", "Épeler en anglais", {
    "objective": "Épeler ton nom, ton courriel et comprendre un mot épelé.",
    "explanation": [
      st("🗣️", "Au téléphone, au bureau ou à la frontière, on te demandera souvent : « Can you spell that, please? » (Pouvez-vous épeler?)."),
      st("🔠", "Pour une lettre double, on dit « double » : Anne = A, double N, E. Pour une majuscule : « capital A »."),
      st("📧", "Dans un courriel : @ se dit « at », le point « dot », le tiret « dash » et _ « underscore »."),
      st("🧩", "Pour éviter les confusions (B/P, M/N), on précise : « B as in Boy », « N as in Nancy »."),
    ],
    "examples": [
      ex("📞", "Can you spell your last name, please?", "Pouvez-vous épeler votre nom de famille?"),
      ex("🔤", "It’s R, O, Y. Roy.", "C’est R, O, Y. Roy."),
      ex("📧", "My email is marie dot roy at gmail dot com.", "Mon courriel est marie.roy@gmail.com."),
      ex("🅱️", "Is that B as in Boy?", "Est-ce B comme dans Boy?"),
      ex("✌️", "Pelletier: P, E, double L, E, T, I, E, R.", "Pelletier : P, E, deux L, E, T, I, E, R."),
    ],
    "vocab": [
      vo("🗣️", "to spell", "épeler", "How do you spell your name?"),
      vo("👤", "first name", "prénom", "My first name is Julie."),
      vo("👪", "last name", "nom de famille", "My last name is Gagnon."),
      vo("📧", "email address", "adresse courriel", "What’s your email address?"),
      vo("🔘", "dot", "point (dans une adresse)", "gmail dot com"),
      vo("📍", "at", "arobase @", "julie at outlook dot com"),
    ],
    "dialogue": [
      dl("Réceptionniste", "Hello! What’s your name, please?", "Bonjour! Quel est votre nom?"),
      dl("Marie", "Marie Tremblay.", "Marie Tremblay."),
      dl("Réceptionniste", "Can you spell your last name?", "Pouvez-vous épeler votre nom de famille?"),
      dl("Marie", "Sure. T, R, E, M, B, L, A, Y.", "Bien sûr. T, R, E, M, B, L, A, Y."),
      dl("Réceptionniste", "Thank you. And your email address?", "Merci. Et votre adresse courriel?"),
      dl("Marie", "It’s marie dot tremblay at gmail dot com.", "C’est marie.tremblay@gmail.com."),
      dl("Réceptionniste", "Perfect, thanks!", "Parfait, merci!"),
    ],
    "tip": st("💡", "Les francophones confondent souvent E et I en épelant. Entraîne-toi avec ton propre nom : c’est le mot que tu épelleras le plus souvent!"),
    "exercises": [
      li("T, O, M.", ["TOM", "TIM", "DOM"], 0, "T, O, M : Tom. O se dit « ô-ou »."),
      li("E, V, A.", ["IVA", "EVA", "AVA"], 1, "E se dit « i » : E, V, A = Eva."),
      li("J, A, C, K.", ["JACK", "GACK", "JAKE"], 0, "J (« djé-i »), A (« é-i »), C, K : Jack."),
      ch("In an email address, « @ » is read ___.", ["at", "and", "dot"], 0, "@ se lit « at »."),
      od("Can you spell your name", "Peux-tu épeler ton nom?", "La question commence par Can : Can you spell…?"),
      ch("How do you say « deux L » when you spell a name?", ["two L", "double L", "L and L"], 1, "On dit « double L »."),
    ],
  }),
  ("👅", "Les sons TH, H, R et W", {
    "objective": "Prononcer les sons anglais qui n’existent pas en français.",
    "explanation": [
      st("👅", "TH : place le bout de la langue entre tes dents et souffle. Doux dans « think » (penser), vibrant dans « this » (ceci). Évite « tink » ou « dis »!"),
      st("💨", "H : en anglais, le H se prononce! Souffle comme sur une vitre : « hello », « happy », « house ». Attention : « eat » (manger) ≠ « heat » (chaleur)."),
      st("🌀", "R : la langue recule sans toucher le palais et les lèvres s’arrondissent un peu. Pas de R roulé ni de R de gorge : « red », « car »."),
      st("👄", "W : arrondis les lèvres comme pour « ou » : « water », « what », « window ». C’est le « ou » de « oui »."),
    ],
    "examples": [
      ex("🤔", "I think this is the third one.", "Je pense que c’est le troisième."),
      ex("🏠", "His house is huge.", "Sa maison est immense."),
      ex("🔴", "The red car is really fast.", "L’auto rouge est vraiment rapide."),
      ex("💧", "We want warm water.", "Nous voulons de l’eau tiède."),
      ex("🙏", "Thank you, that’s very helpful.", "Merci, ça m’aide beaucoup."),
    ],
    "vocab": [
      vo("🤔", "think", "penser", "I think so."),
      vo("3️⃣", "three", "trois (≠ tree, arbre)", "I have three cats."),
      vo("🎩", "hat", "chapeau", "Nice hat!"),
      vo("💇", "hair", "cheveux (≠ air)", "She has long hair."),
      vo("➡️", "right", "droite, correct", "Turn right."),
      vo("🪟", "window", "fenêtre", "Open the window, please."),
    ],
    "tip": st("💡", "Paires à pratiquer avec 🔊 : three / tree (trois / arbre), hair / air (cheveux / air), eat / heat (manger / chaleur), think / sink (penser / évier)."),
    "exercises": [
      li("three", ["tree", "three", "free"], 1, "« three » commence par TH : la langue entre les dents."),
      li("hair", ["air", "hair", "here"], 1, "On entend le souffle du H : hair (cheveux)."),
      li("heat", ["eat", "it", "heat"], 2, "Le H se prononce : heat (chaleur)."),
      ch("Which word starts with a TH sound?", ["tank", "think", "sink"], 1, "think : la langue entre les dents."),
      li("west", ["vest", "west", "best"], 1, "W : lèvres arrondies comme « ou » : west (ouest)."),
      od("Thank you for the help", "Merci pour l’aide", "Thank you for + nom : Thank you for the help."),
    ],
  }),
  ("🐑", "Voyelles courtes et longues", {
    "objective": "Entendre la différence entre les voyelles courtes et longues (ship / sheep).",
    "explanation": [
      st("🐑", "« sheep » (mouton) a un i long : étire-le en souriant. « ship » (bateau) a un i court et détendu, entre « i » et « é »."),
      st("⚽", "« full » (plein) a un « ou » court, « fool » (idiot) un « ou » long. Même chose pour « pull » et « pool »."),
      st("⚠️", "Une voyelle mal prononcée change le sens : « leave » (partir) ≠ « live » (vivre)."),
      st("📏", "Truc : une voyelle longue s’étire, une voyelle courte est rapide et relâchée. Compare les paires avec 🔊."),
    ],
    "examples": [
      ex("🚢", "The ship is big.", "Le bateau est gros."),
      ex("🐑", "The sheep is white.", "Le mouton est blanc."),
      ex("🏡", "I live in Quebec.", "J’habite au Québec."),
      ex("🚪", "I leave at five.", "Je pars à cinq heures."),
      ex("🏊", "The pool is full.", "La piscine est pleine."),
    ],
    "vocab": [
      vo("🚢", "ship", "bateau", "The ship is in the port."),
      vo("🐑", "sheep", "mouton", "Look at the sheep!"),
      vo("🏡", "live", "vivre, habiter", "Where do you live?"),
      vo("🚪", "leave", "partir, quitter", "Don’t leave now!"),
      vo("🥛", "full", "plein", "My glass is full."),
      vo("🏊", "pool", "piscine", "Let’s go to the pool."),
    ],
    "tip": st("💡", "Le « i » court anglais n’existe pas en français. Pense à un « i » paresseux, presque un « é » : sit, big, fish, it."),
    "exercises": [
      li("sheep", ["ship", "sheep", "shop"], 1, "i long : sheep (mouton)."),
      li("live", ["leave", "live", "love"], 1, "i court : live (vivre)."),
      li("full", ["fool", "fall", "full"], 2, "ou court : full (plein)."),
      ch("Which word has a LONG vowel?", ["sit", "seat", "sick"], 1, "seat (siège) a un i long."),
      li("pool", ["pull", "pool", "poll"], 1, "ou long : pool (piscine)."),
      od("I live in a big city", "J’habite dans une grande ville", "Sujet + verbe + lieu : I live in…"),
    ],
  }),
 ]),
 ("Mes premiers mots", "🌱", "Saluer, compter, décrire les couleurs et parler du calendrier.", [
  ("👋", "Bonjour et politesse", {
    "objective": "Saluer, remercier, t’excuser et dire au revoir poliment.",
    "explanation": [
      st("👋", "Pour saluer : « Hi! » (familier), « Hello! » (neutre), « Good morning / Good afternoon / Good evening » (plus poli)."),
      st("🙏", "Les mots magiques : please (s’il te plaît), thank you ou thanks (merci), you’re welcome (de rien)."),
      st("😬", "« Sorry! » si tu bouscules quelqu’un, « Excuse me » pour attirer l’attention ou pour passer."),
      st("🌙", "Pour partir : « Bye! », « See you! », « Have a nice day! ». « Good night » veut dire bonne nuit, jamais bonsoir."),
    ],
    "examples": [
      ex("☀️", "Good morning! How are you?", "Bonjour! Comment allez-vous?"),
      ex("🙂", "I’m fine, thanks. And you?", "Je vais bien, merci. Et vous?"),
      ex("🙋", "Excuse me, where is the washroom?", "Excusez-moi, où sont les toilettes?"),
      ex("😅", "Sorry, I don’t understand.", "Désolé, je ne comprends pas."),
      ex("👋", "See you tomorrow!", "À demain!"),
    ],
    "vocab": [
      vo("👋", "hello", "bonjour", "Hello, Sam!"),
      vo("🙏", "please", "s’il te plaît", "A coffee, please."),
      vo("💐", "thank you", "merci", "Thank you so much!"),
      vo("😅", "sorry", "désolé, pardon", "Sorry, I’m late."),
      vo("🙋", "excuse me", "excusez-moi", "Excuse me, is this seat free?"),
      vo("🚪", "goodbye", "au revoir", "Goodbye, see you soon!"),
    ],
    "dialogue": [
      dl("Sam", "Hi! I’m Sam. Nice to meet you.", "Salut! Je suis Sam. Enchanté."),
      dl("Julie", "Hi Sam! I’m Julie. Nice to meet you too.", "Salut Sam! Moi, c’est Julie. Enchantée aussi."),
      dl("Sam", "How are you?", "Comment ça va?"),
      dl("Julie", "I’m good, thanks. And you?", "Bien, merci. Et toi?"),
      dl("Sam", "Great, thank you!", "Super, merci!"),
      dl("Julie", "Have a nice day!", "Bonne journée!"),
      dl("Sam", "You too! Bye!", "Toi aussi! Salut!"),
    ],
    "tip": st("💡", "« How are you? » est souvent une simple salutation. On répond brièvement (« Good, thanks! And you? ») sans raconter sa journée."),
    "exercises": [
      ch("Someone says « Thank you! ». You answer: « ___ »", ["You’re welcome!", "Good night!", "Sorry!"], 0, "« You’re welcome » = de rien."),
      ch("You arrive at a party at 8 p.m. You say: « Good ___! »", ["night", "evening", "morning"], 1, "Good evening = bonsoir. Good night = bonne nuit (en partant ou au coucher)."),
      li("Nice to meet you.", ["Nice to meet you.", "Nice to see you.", "Nice to be you."], 0, "Nice to meet you = enchanté (première rencontre)."),
      od("Excuse me, where is the washroom?", "Excusez-moi, où sont les toilettes?", "Excuse me + question : where is…?"),
      ch("You bump into someone. You say: « ___ »", ["Sorry!", "Please!", "Hello!"], 0, "Sorry! = pardon / désolé."),
      od("Have a nice day!", "Bonne journée!", "Have a nice day : une formule très courante."),
    ],
  }),
  ("🔢", "Les nombres de 0 à 20", {
    "objective": "Compter de 0 à 20 et donner ton numéro de téléphone.",
    "explanation": [
      st("🔢", "0 zero, 1 one, 2 two, 3 three, 4 four, 5 five, 6 six, 7 seven, 8 eight, 9 nine, 10 ten."),
      st("🔟", "11 eleven, 12 twelve, puis on ajoute « -teen » : thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen. 20 = twenty."),
      st("📞", "Pour un numéro de téléphone, on dit chaque chiffre : 514-555-0198 = five one four, five five five, oh one nine eight. Le 0 se dit souvent « oh »."),
      st("⚠️", "« three » commence par TH (≠ tree, arbre) et « eight » rime avec « day »."),
    ],
    "examples": [
      ex("🎂", "My son is nine.", "Mon fils a neuf ans."),
      ex("📞", "My number is five one four, five five five, oh one nine eight.", "Mon numéro est le 514-555-0198."),
      ex("🐱", "I have two cats and one dog.", "J’ai deux chats et un chien."),
      ex("🕗", "The store opens at eight.", "Le magasin ouvre à huit heures."),
      ex("🚌", "Take bus number fifteen.", "Prends l’autobus numéro quinze."),
    ],
    "vocab": [
      vo("0️⃣", "zero", "zéro (« oh » au téléphone)", "Zero degrees."),
      vo("1️⃣", "eleven", "onze", "Eleven players."),
      vo("🕛", "twelve", "douze", "It’s twelve o’clock."),
      vo("🔢", "thirteen", "treize", "Thirteen is not lucky."),
      vo("⏱️", "fifteen", "quinze", "Fifteen minutes."),
      vo("🎲", "twenty", "vingt", "Twenty dollars."),
    ],
    "tip": st("💡", "De 13 à 19, l’accent tombe sur « teen » : thirTEEN, fifTEEN. Ça évite de confondre avec thirty, fifty (prochaine leçon)."),
    "exercises": [
      li("twelve", ["11", "12", "20"], 1, "twelve = 12."),
      li("fifteen", ["15", "50", "5"], 0, "fifteen = 15 (accent sur -teen)."),
      li("eight", ["8", "18", "3"], 0, "eight = 8, rime avec day."),
      ch("6 + 7 = ___", ["thirteen", "thirty", "twelve"], 0, "6 + 7 = 13 = thirteen."),
      li("five one four, two oh three", ["514-203", "514-230", "541-203"], 0, "Chiffre par chiffre, et « oh » pour 0."),
      od("My phone number is five one four", "Mon numéro de téléphone est cinq un quatre", "My phone number is…"),
    ],
  }),
  ("💯", "Les nombres jusqu’à 100", {
    "objective": "Compter jusqu’à 100, dire ton âge et des prix simples.",
    "explanation": [
      st("🔟", "Les dizaines : 20 twenty, 30 thirty, 40 forty (sans « u »!), 50 fifty, 60 sixty, 70 seventy, 80 eighty, 90 ninety, 100 one hundred."),
      st("➕", "On ajoute l’unité avec un trait d’union : 21 twenty-one, 45 forty-five, 99 ninety-nine. Pas de « soixante-dix » ni de « quatre-vingts » : c’est plus simple qu’en français!"),
      st("🎯", "Piège : thirTEEN (13) a l’accent à la fin, THIRty (30) au début. Compare avec 🔊."),
      st("🎂", "Pour l’âge, on utilise « be » : I’m 34 (years old). Jamais « I have 34 »."),
    ],
    "examples": [
      ex("🎂", "My mother is fifty-two.", "Ma mère a cinquante-deux ans."),
      ex("💲", "It’s thirty dollars.", "C’est trente dollars."),
      ex("🏠", "I live at forty-four Maple Street.", "J’habite au 44, rue Maple."),
      ex("🌡️", "It’s minus thirty outside!", "Il fait moins trente dehors!"),
      ex("💯", "One hundred percent!", "Cent pour cent!"),
    ],
    "vocab": [
      vo("3️⃣", "thirty", "trente", "Thirty days."),
      vo("4️⃣", "forty", "quarante (sans u)", "Forty people."),
      vo("5️⃣", "fifty", "cinquante", "Fifty cents."),
      vo("8️⃣", "eighty", "quatre-vingts", "Eighty years old."),
      vo("💯", "hundred", "cent", "A hundred dollars."),
      vo("💵", "dollar", "dollar", "It costs ten dollars."),
    ],
    "tip": st("💡", "Au Canada, on dit les prix ainsi : 3,50 $ = « three fifty », 12,99 $ = « twelve ninety-nine »."),
    "exercises": [
      li("thirteen", ["13", "30", "3"], 0, "thirTEEN = 13 (accent à la fin)."),
      li("thirty", ["13", "30", "33"], 1, "THIRty = 30 (accent au début)."),
      li("forty-five", ["45", "54", "95"], 0, "forty-five = 45."),
      ch("40 is written ___.", ["fourty", "forty", "fourteen"], 1, "forty, sans « u », même si four en a un."),
      ch("« J’ai 25 ans » = « ___ twenty-five. »", ["I have", "I’m", "I do"], 1, "L’âge se dit avec be : I’m twenty-five."),
      od("I am thirty years old", "J’ai trente ans", "I am + âge + years old."),
    ],
  }),
  ("🎨", "Les couleurs", {
    "objective": "Nommer les couleurs et décrire des objets du quotidien.",
    "explanation": [
      st("🎨", "red (rouge), blue (bleu), green (vert), yellow (jaune), black (noir), white (blanc), orange, pink (rose), purple (mauve), brown (brun), gray (gris)."),
      st("📍", "En anglais, la couleur vient AVANT le nom : a blue car (une auto bleue), a red apple (une pomme rouge)."),
      st("🚫", "Les adjectifs ne prennent jamais de « s » : two black cats, jamais « blacks »."),
      st("💡", "Pour nuancer : light blue (bleu pâle), dark green (vert foncé). Pour demander : « What color is it? »"),
    ],
    "examples": [
      ex("🚗", "I have a blue car.", "J’ai une auto bleue."),
      ex("🍁", "The maple leaf is red.", "La feuille d’érable est rouge."),
      ex("🐈‍⬛", "She has two black cats.", "Elle a deux chats noirs."),
      ex("👕", "My favorite color is green.", "Ma couleur préférée est le vert."),
      ex("🍌", "What color is a banana? It’s yellow.", "De quelle couleur est une banane? Jaune."),
    ],
    "vocab": [
      vo("🔴", "red", "rouge", "A red apple."),
      vo("🔵", "blue", "bleu", "The sky is blue."),
      vo("🟡", "yellow", "jaune", "A yellow taxi."),
      vo("🟣", "purple", "mauve, violet", "Purple flowers."),
      vo("🟤", "brown", "brun", "Brown eyes."),
      vo("⚪", "gray", "gris", "A gray sky."),
    ],
    "tip": st("💡", "« Purple » = mauve ou violet, et « brown » = brun. Au Canada, on écrit aussi « colour » et « grey » (orthographe britannique)."),
    "exercises": [
      ch("« Une pomme rouge » = « ___ »", ["an apple red", "a red apple", "a reds apple"], 1, "La couleur se place avant le nom."),
      li("purple", ["mauve / violet", "rose", "brun"], 0, "purple = mauve ou violet."),
      ch("The sky is ___.", ["blue", "brown", "pink"], 0, "Le ciel est bleu : blue."),
      li("yellow", ["jaune", "vert", "blanc"], 0, "yellow = jaune."),
      ch("« Deux chiens noirs » = « two ___ dogs »", ["blacks", "black", "noir"], 1, "Pas de « s » aux adjectifs."),
      od("My favorite color is green", "Ma couleur préférée est le vert", "My favorite color is…"),
    ],
  }),
  ("📅", "Les jours et les mois", {
    "objective": "Dire les jours, les mois et la date.",
    "explanation": [
      st("📅", "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday. Ils prennent toujours une majuscule!"),
      st("🗓️", "January, February, March, April, May, June, July, August, September, October, November, December. Majuscule aussi."),
      st("📌", "On dit « on » pour un jour ou une date (on Monday, on May 5th) et « in » pour un mois ou une année (in May, in 2025)."),
      st("🔢", "Pour la date, on utilise first, second, third, fourth… : « My birthday is on June 24th » (twenty-fourth)."),
    ],
    "examples": [
      ex("🎉", "My birthday is on June 24th.", "Mon anniversaire est le 24 juin."),
      ex("📆", "Today is Wednesday.", "Aujourd’hui, c’est mercredi."),
      ex("❄️", "It snows a lot in December.", "Il neige beaucoup en décembre."),
      ex("🏢", "I work from Monday to Friday.", "Je travaille du lundi au vendredi."),
      ex("🎄", "Christmas is on December 25th.", "Noël, c’est le 25 décembre."),
    ],
    "vocab": [
      vo("🐪", "Wednesday", "mercredi (« WENZ-dé »)", "See you on Wednesday!"),
      vo("4️⃣", "Thursday", "jeudi", "The meeting is on Thursday."),
      vo("🛋️", "weekend", "fin de semaine", "Have a nice weekend!"),
      vo("🗓️", "month", "mois", "Next month."),
      vo("🎂", "birthday", "anniversaire", "Happy birthday!"),
      vo("📍", "today", "aujourd’hui", "What day is it today?"),
    ],
    "tip": st("💡", "Wednesday se prononce « WENZ-day » : le premier « d » est muet!"),
    "exercises": [
      ch("My birthday is ___ July.", ["on", "in", "at"], 1, "in + mois."),
      ch("We have a meeting ___ Monday.", ["in", "on", "at"], 1, "on + jour."),
      li("Thursday", ["mardi", "jeudi", "samedi"], 1, "Thursday = jeudi (TH au début)."),
      li("Wednesday", ["mercredi", "lundi", "dimanche"], 0, "Wednesday = mercredi."),
      ch("Which is correct?", ["monday", "Monday", "MONday"], 1, "Les jours prennent une majuscule."),
      od("My birthday is in March", "Mon anniversaire est en mars", "in + mois."),
    ],
  }),
 ]),
])
