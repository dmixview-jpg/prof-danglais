# Dialogues guidés rattachés aux unités du parcours (un par unité, de A1 à C2).
# Les dialogues de dialogues.py qui correspondent déjà à une unité sont rattachés dans RATTACHEMENTS.
from aide import coach, rep
from dialogues import S

RATTACHEMENTS = {
    "intro": "a1.1", "day": "a1.2", "cafe": "a1.4", "directions": "a1.5",
    "hobbies": "a2.4", "doctor": "a2.5", "hotel": "a2.6",
    "apartment": "b1.5", "interview": "b1.6", "networking": "b2.5", "salary": "c1.6",
}

NOUVEAUX = [

# ----------------------------- A1 -----------------------------
S("family", "👨‍👩‍👧", "Ma famille", "A1", "Une collègue regarde la photo sur ton bureau.", [
  coach("Oh, nice photo! Is this your family?", "Oh, belle photo! C’est ta famille?"),
  rep(["Yes, this is my husband and my two kids.", "Yes, this is my husband and my two childs.", "Yes, this are my husband and my two kids."], 0, "child → children au pluriel, ou kids. Et « this is » pour présenter."),
  coach("They’re so cute! How old are they?", "Ils sont tellement mignons! Quel âge ont-ils?"),
  rep(["My son has eight years and my daughter has five.", "My son is eight and my daughter is five.", "My son is eight years and my daughter five years."], 1, "L’âge se dit avec be : my son is eight."),
  coach("Do you have a house or an apartment?", "As-tu une maison ou un appartement?"),
  rep(["We have a house. There is three bedrooms.", "We have a house. There are three bedrooms.", "We have a house. It has three bedroom."], 1, "Pluriel : there are three bedrooms."),
  coach("Nice! Where is it?", "Bien! Où est-elle?"),
  rep(["It’s in Laval, next to a big park.", "It’s in Laval, next of a big park.", "It’s at Laval, beside of a big park."], 0, "next to = à côté de, et in + ville."),
  coach("Sounds perfect for the kids!", "Ça a l’air parfait pour les enfants!"),
]),

S("weekend", "🏕️", "Ta fin de semaine", "A1", "Lundi matin, un collègue te parle de ta fin de semaine.", [
  coach("Good morning! How was your weekend?", "Bonjour! Comment s’est passée ta fin de semaine?"),
  rep(["It was great, thanks!", "It were great, thanks!", "It is great, thanks!"], 0, "Au passé : it was."),
  coach("What did you do?", "Qu’as-tu fait?"),
  rep(["I goed to a sugar shack with my family.", "I went to a sugar shack with my family.", "I go to a sugar shack with my family."], 1, "go → went (irrégulier)."),
  coach("Fun! Did you eat a lot?", "Amusant! As-tu beaucoup mangé?"),
  rep(["Yes, I ate too much!", "Yes, I eated too much!", "Yes, I did ate too much!"], 0, "eat → ate. Pas de did dans une phrase affirmative."),
  coach("Ha ha! And on Sunday?", "Ha ha! Et dimanche?"),
  rep(["I didn’t did anything. I relaxed at home.", "I didn’t do anything. I relaxed at home.", "I don’t did anything. I relaxed at home."], 1, "didn’t + verbe de base : didn’t do."),
  coach("Sounds like a perfect weekend!", "Ça ressemble à une fin de semaine parfaite!"),
]),

# ----------------------------- A2 -----------------------------
S("memory", "📖", "Un souvenir de voyage", "A2", "Tu racontes une anecdote de voyage à une amie.", [
  coach("So, what happened in New York?", "Alors, que s’est-il passé à New York?"),
  rep(["We was walking in Central Park when it started to rain.", "We were walking in Central Park when it started to rain.", "We were walking in Central Park when it was starting to rain."], 1, "Action en cours (passé continu) interrompue par une action courte (passé simple)."),
  coach("Oh no! Did you have an umbrella?", "Oh non! Aviez-vous un parapluie?"),
  rep(["No, so we ran into a museum.", "No, so we runned into a museum.", "No, so we were run into a museum."], 0, "run → ran."),
  coach("Smart! Was it interesting?", "Bien pensé! C’était intéressant?"),
  rep(["Yes, I was really interesting by the paintings.", "Yes, I was really interested in the paintings.", "Yes, I was really interesting in the paintings."], 1, "Ce que je ressens : interested (in)."),
  coach("And after that?", "Et après?"),
  rep(["Eventually, the sun came out and we had a picnic.", "Eventually, the sun was coming out and we have a picnic.", "Possibly, the sun came out and we had a picnic."], 0, "Eventually = finalement (pas « éventuellement »)."),
  coach("What a great story!", "Quelle belle histoire!"),
]),

S("phoneshop", "📱", "Choisir un cellulaire", "A2", "Tu compares deux téléphones dans un magasin.", [
  coach("Hi! Are you looking for a new phone?", "Bonjour! Cherchez-vous un nouveau téléphone?"),
  rep(["Yes. What’s the difference between these two?", "Yes. What is the difference between this two?", "Yes. Which is the difference of these two?"], 0, "these two (pluriel) et the difference between."),
  coach("This one is cheaper, but that one has a better camera.", "Celui-ci est moins cher, mais celui-là a une meilleure caméra."),
  rep(["Is the battery more good?", "Is the battery better too?", "Is the battery gooder too?"], 1, "good → better."),
  coach("Yes, and it’s the fastest phone in the store.", "Oui, et c’est le téléphone le plus rapide du magasin."),
  rep(["It’s more expensive than I thought.", "It’s expensiver than I thought.", "It’s more expensive that I thought."], 0, "Adjectif long : more expensive than."),
  coach("It’s on sale this week: two hundred dollars off.", "Il est en solde cette semaine : deux cents dollars de rabais."),
  rep(["Oh! That’s a good deal. I’ll take it.", "Oh! That’s a rip-off. I’ll take it.", "Oh! That’s a good deal. I take it tomorrow."], 0, "a good deal = une bonne affaire; I’ll take it = je le prends (décision)."),
  coach("Great choice!", "Excellent choix!"),
]),

S("plans", "🗓️", "Planifier une sortie", "A2", "Tu organises une sortie avec un ami.", [
  coach("Hey! Are you doing anything on Saturday?", "Salut! Fais-tu quelque chose samedi?"),
  rep(["Nothing yet. Why?", "Nothing still. Why?", "Anything yet. Why?"], 0, "Nothing yet = rien encore."),
  coach("Would you like to go to the Jazz Festival?", "Aimerais-tu aller au Festival de jazz?"),
  rep(["I’d love to go!", "I’d love going!", "I love to go!"], 0, "I’d love to = avec plaisir."),
  coach("Great! How about meeting at the metro at six?", "Super! Que dirais-tu de nous retrouver au métro à six heures?"),
  rep(["Perfect. I’ll bring some snacks.", "Perfect. I bring some snacks.", "Perfect. I’m bringing to some snacks."], 0, "Offre spontanée : I’ll bring."),
  coach("Do you think it’s going to rain?", "Penses-tu qu’il va pleuvoir?"),
  rep(["I don’t think it will rain. The forecast is sunny.", "I think it won’t to rain. The forecast is sunny.", "I don’t think it rains. The forecast is sunny."], 0, "Prédiction : I don’t think it will…"),
  coach("Awesome. See you Saturday!", "Génial. À samedi!"),
]),

# ----------------------------- B1 -----------------------------
S("oldfriend", "🤗", "Retrouver un vieil ami", "B1", "Tu croises un ami du secondaire que tu n’as pas vu depuis longtemps.", [
  coach("No way! Is that you? I haven’t seen you in years!", "Pas vrai! C’est toi? Ça fait des années que je ne t’ai pas vu!"),
  rep(["I know! Since when did we see each other?", "I know! It’s been at least ten years!", "I know! It is ten years that we don’t see us!"], 1, "It’s been ten years = ça fait dix ans."),
  coach("So, what have you been doing all this time?", "Alors, qu’est-ce que tu deviens?"),
  rep(["I’ve been working as a nurse in Sherbrooke.", "I work as a nurse in Sherbrooke since years.", "I’m working as a nurse in Sherbrooke since years."], 0, "Activité qui dure : present perfect continu."),
  coach("You used to want to be a pilot, right?", "Tu voulais devenir pilote, non?"),
  rep(["Yes! I used to dream about it every day.", "Yes! I was used to dream about it every day.", "Yes! I use to dream about it every day."], 0, "Habitude passée : used to + verbe."),
  coach("And do you like living in the Eastern Townships?", "Et aimes-tu vivre en Estrie?"),
  rep(["I love it, but I’m still not used to driving everywhere.", "I love it, but I’m still not used to drive everywhere.", "I love it, but I don’t still use to drive everywhere."], 0, "be used to + -ing."),
  coach("Let’s grab a coffee soon and catch up!", "Prenons un café bientôt pour se raconter tout ça!"),
]),

S("whatif", "🤔", "Et si on déménageait?", "B1", "Ton conjoint ou ta conjointe a reçu une offre d’emploi à Vancouver.", [
  coach("If I accept the job in Vancouver, would you come with me?", "Si j’accepte l’emploi à Vancouver, viendrais-tu avec moi?"),
  rep(["If you accept it, I’ll think about it seriously.", "If you will accept it, I’ll think about it seriously.", "If you accepted it, I’ll think about it seriously."], 0, "Premier conditionnel : if + présent, will."),
  coach("What would you miss the most?", "Qu’est-ce qui te manquerait le plus?"),
  rep(["If we moved, I would miss my family.", "If we would move, I would miss my family.", "If we move, I would miss my family."], 0, "Deuxième conditionnel : if + passé, would."),
  coach("I know. I wish they lived closer to us anyway.", "Je sais. J’aimerais qu’ils habitent plus près de nous de toute façon."),
  rep(["Me too. I wish I can see them more often.", "Me too. I wish I could see them more often.", "Me too. I wish I would see them more often."], 1, "wish + could."),
  coach("So, what should I do?", "Alors, que devrais-je faire?"),
  rep(["If I were you, I’d accept. It’s a great opportunity.", "If I was you, I’ll accept. It’s a great opportunity.", "If I am you, I would accept. It’s a great opportunity."], 0, "If I were you, I’d…"),
  coach("Okay. Let’s talk about it tonight.", "D’accord. On en reparle ce soir."),
]),

S("tour", "🏰", "Visite guidée du Vieux-Québec", "B1", "Tu es guide et tu fais visiter Québec à des touristes.", [
  coach("This place is amazing. When was the city founded?", "Cet endroit est magnifique. Quand la ville a-t-elle été fondée?"),
  rep(["It was founded in 1608 by Samuel de Champlain.", "It founded in 1608 by Samuel de Champlain.", "It was found in 1608 by Samuel de Champlain."], 0, "Passif passé : was founded (fonder = found, founded)."),
  coach("And the big castle on the hill?", "Et le gros château sur la colline?"),
  rep(["The Château Frontenac was built in 1893. It’s a hotel.", "The Château Frontenac built in 1893. It’s a hotel.", "The Château Frontenac has built in 1893. It’s a hotel."], 0, "Passif : was built."),
  coach("Is French spoken everywhere here?", "Parle-t-on français partout ici?"),
  rep(["Yes, French is spoken by almost everyone.", "Yes, French is speaking by almost everyone.", "Yes, French speaks by almost everyone."], 0, "is spoken = on parle."),
  coach("Can we visit the walls?", "Peut-on visiter les remparts?"),
  rep(["Yes, but the north part is being repaired right now.", "Yes, but the north part is repairing right now.", "Yes, but the north part is been repaired right now."], 0, "En ce moment : is being repaired."),
  coach("Thanks, you’re a great guide!", "Merci, vous êtes un excellent guide!"),
]),

S("message", "📨", "Transmettre un message", "B1", "Ta collègue revient de vacances. Tu lui transmets les messages reçus.", [
  coach("Hi! Did anyone call while I was away?", "Salut! Quelqu’un a-t-il appelé pendant mon absence?"),
  rep(["Yes, Mr. Lee called. He said he would send the contract on Monday.", "Yes, Mr. Lee called. He said he will sends the contract on Monday.", "Yes, Mr. Lee called. He told he would send the contract on Monday."], 0, "Discours indirect : said + would. On dit « tell someone », pas « he told that »."),
  coach("Great. Anything else?", "Super. Autre chose?"),
  rep(["Sophie asked if you could call her back.", "Sophie asked could you call her back.", "Sophie asked if could you call her back."], 0, "Question rapportée : if + ordre sujet-verbe."),
  coach("Did the boss say anything?", "Le patron a-t-il dit quelque chose?"),
  rep(["He told us to finish the report by Friday.", "He said us to finish the report by Friday.", "He told to us finish the report by Friday."], 0, "tell + personne + to + verbe."),
  coach("Okay. Was the client happy with our offer?", "D’accord. Le client était-il content de notre offre?"),
  rep(["She explained that she needed more time to decide.", "She explained me that she needed more time to decide.", "She explained that she needs more time for deciding."], 0, "explain (sans complément de personne direct) + concordance des temps."),
  coach("Thanks for keeping track of everything!", "Merci d’avoir tout noté!"),
]),

# ----------------------------- B2 -----------------------------
S("missed", "⏰", "Un rendez-vous manqué", "B2", "Tu as raté un souper important. Tu t’expliques avec une amie.", [
  coach("We waited for you for an hour! What happened?", "On t’a attendu une heure! Que s’est-il passé?"),
  rep(["I’m so sorry. I had been working all day and I fell asleep.", "I’m so sorry. I have worked all day and I fell asleep.", "I’m so sorry. I was work all day and I fell asleep."], 0, "Durée avant un moment passé : had been working."),
  coach("You should have called me.", "Tu aurais dû m’appeler."),
  rep(["You’re right. If I had seen the time, I would have called.", "You’re right. If I would have seen the time, I would have called.", "You’re right. If I saw the time, I would have called."], 0, "Troisième conditionnel : if + past perfect, would have."),
  coach("Well, it was Marie’s birthday…", "Eh bien, c’était l’anniversaire de Marie…"),
  rep(["I know. I wish I hadn’t missed it.", "I know. I wish I didn’t miss it.", "I know. I wish I wouldn’t have missed it."], 0, "Regret sur le passé : wish + past perfect."),
  coach("Maybe you can make it up to her.", "Peut-être que tu peux te faire pardonner."),
  rep(["Good idea. If I hadn’t slept, I’d be less embarrassed now!", "Good idea. If I didn’t sleep, I’d be less embarrassed now!", "Good idea. If I hadn’t slept, I’ll be less embarrassed now!"], 0, "Conditionnel mixte : condition passée, résultat présent."),
  coach("Ha ha. Bring her a cake and all will be forgiven.", "Ha ha. Apporte-lui un gâteau et tout sera pardonné."),
]),

S("mystery", "🕵️", "Le mystère du bureau", "B2", "Quelqu’un a mangé le lunch de ta collègue dans le frigo.", [
  coach("Someone ate my lunch! Who could it be?", "Quelqu’un a mangé mon lunch! Qui ça peut bien être?"),
  rep(["It can’t have been Tom. He’s on vacation.", "It mustn’t be Tom. He was on vacation.", "It can’t be been Tom. He’s on vacation."], 0, "Impossibilité au passé : can’t have been."),
  coach("What about Julie? She was here all morning.", "Et Julie? Elle était ici toute la matinée."),
  rep(["She might have taken it by mistake.", "She might took it by mistake.", "She may has taken it by mistake."], 0, "Possibilité au passé : might have + participe."),
  coach("Look, there’s sauce on Kevin’s desk!", "Regarde, il y a de la sauce sur le bureau de Kevin!"),
  rep(["Then it must have been Kevin!", "Then it must be been Kevin!", "Then it should have been Kevin!"], 0, "Certitude au passé : must have been."),
  coach("He seems very guilty right now…", "Il a l’air très coupable en ce moment…"),
  rep(["He looks as if he’s about to apologize.", "He looks like as he’s about to apologize.", "He seems as he’s about to apologize."], 0, "look as if + proposition."),
  coach("Case closed!", "Affaire classée!"),
]),

S("movie", "🎬", "Recommander un film", "B2", "Un ami te demande quoi regarder ce soir.", [
  coach("Can you recommend a good movie for tonight?", "Peux-tu me recommander un bon film pour ce soir?"),
  rep(["What you really need is a good thriller.", "What you really need it is a good thriller.", "That you really need is a good thriller."], 0, "Mise en relief : What you need is…"),
  coach("Okay, which one?", "D’accord, lequel?"),
  rep(["« Prisoners », which is set in Pennsylvania, is amazing.", "« Prisoners », that is set in Pennsylvania, is amazing.", "« Prisoners », who is set in Pennsylvania, is amazing."], 0, "Relative explicative avec virgules : which (pas that)."),
  coach("Who directed it?", "Qui l’a réalisé?"),
  rep(["It was Denis Villeneuve who directed it.", "It was Denis Villeneuve which directed it.", "It is Denis Villeneuve who has directed it yesterday."], 0, "It was + personne + who…"),
  coach("Oh, I love his films. Have you seen « Dune »?", "Oh, j’adore ses films. As-tu vu « Dune »?"),
  rep(["Yes, both of them. Neither was boring.", "Yes, both of them. Neither were boring.", "Yes, the both. Neither was boring."], 0, "both of them; neither + verbe au singulier en anglais soigné."),
  coach("Perfect, I’ll watch « Prisoners » tonight!", "Parfait, je regarde « Prisoners » ce soir!"),
]),

S("news", "📰", "Les nouvelles du jour", "B2", "Tu discutes de l’actualité au dîner avec des collègues.", [
  coach("Did you hear about the new metro line?", "As-tu entendu parler de la nouvelle ligne de métro?"),
  rep(["Yes. It is said to be ready by 2030.", "Yes. It is said that to be ready by 2030.", "Yes. They say it to be ready by 2030."], 0, "Passif de rapport : It is said to be…"),
  coach("I doubt it. These projects are always late.", "J’en doute. Ces projets sont toujours en retard."),
  rep(["The mayor denied being behind schedule.", "The mayor denied to be behind schedule.", "The mayor denied that being behind schedule."], 0, "deny + -ing."),
  coach("Did she say anything else?", "A-t-elle dit autre chose?"),
  rep(["She suggested building a second line.", "She suggested to build a second line.", "She suggested us to build a second line."], 0, "suggest + -ing (ou suggest that…)."),
  coach("Who’s going to pay for that?", "Qui va payer pour ça?"),
  rep(["Taxpayers, I suppose. The city will get the province to help.", "Taxpayers, I suppose. The city will get the province help.", "Taxpayers, I suppose. The city will make the province to help."], 0, "get someone to do something."),
  coach("Let’s hope so!", "Espérons-le!"),
]),

S("debate", "⚔️", "Débat : le télétravail", "B2", "En réunion, on débat du retour au bureau.", [
  coach("I think everyone should come back to the office five days a week.", "Je pense que tout le monde devrait revenir au bureau cinq jours par semaine."),
  rep(["I see your point, but remote work has clear advantages.", "I am agree with you, but remote work has clear advantages.", "You are wrong, remote work is better, period."], 0, "Désaccord poli : I see your point, but…"),
  coach("Like what?", "Comme quoi?"),
  rep(["Admittedly, communication is harder, but people save two hours of commuting.", "Admittedly, communication is more hard, but people save two hours of commute.", "Admitting, communication is harder, but people saves two hours of commuting."], 0, "Admittedly = je le reconnais (concession)."),
  coach("But productivity drops at home.", "Mais la productivité baisse à la maison."),
  rep(["Studies tend to suggest the opposite, at least to some extent.", "Studies tend to suggesting the opposite, at least to some extend.", "Studies are tending to suggest the opposite, at least at some extent."], 0, "Nuancer : tend to, to some extent."),
  coach("So what do you propose?", "Alors, que proposes-tu?"),
  rep(["A hybrid model: three days at the office and two at home.", "A hybrid model: three days in the office and two at the home.", "An hybrid model: three days at the office and two at home."], 0, "a hybrid (h prononcé), at home sans the."),
  coach("That’s a fair compromise.", "C’est un compromis raisonnable."),
]),

# ----------------------------- C1 -----------------------------
S("toast", "🥂", "Un discours pour une collègue", "C1", "Tu portes un toast au départ à la retraite d’une collègue.", [
  coach("Would you like to say a few words for Linda?", "Aimerais-tu dire quelques mots pour Linda?"),
  rep(["Of course. Never have I worked with someone so generous.", "Of course. Never I have worked with someone so generous.", "Of course. Never have I work with someone so generous."], 0, "Inversion après never : Never have I + participe."),
  coach("That’s lovely. Go on!", "C’est touchant. Continue!"),
  rep(["Not only did she train half of us, but she also made us laugh every day.", "Not only she trained half of us, but she also made us laugh every day.", "Not only did she trained half of us, but she also made us laugh every day."], 0, "Not only + did + sujet + verbe de base."),
  coach("Everyone agrees with that!", "Tout le monde est d’accord avec ça!"),
  rep(["What we’ll miss most is her kindness.", "What we’ll miss most it is her kindness.", "That we’ll miss most is her kindness."], 0, "Mise en relief : What we’ll miss most is…"),
  coach("Beautiful. How will you finish?", "Magnifique. Comment vas-tu conclure?"),
  rep(["Linda, we do hope you enjoy every minute of your retirement!", "Linda, we do hoping you enjoy every minute of your retirement!", "Linda, we hope do you enjoy every minute of your retirement!"], 0, "Do d’insistance : we do hope."),
  coach("Cheers to Linda!", "À Linda!"),
]),

S("launch", "🚀", "Planifier un lancement", "C1", "Tu prépares le lancement d’un produit avec ta gestionnaire.", [
  coach("Where will we be with the project by the end of June?", "Où en serons-nous dans le projet à la fin juin?"),
  rep(["By then, we’ll have finished the testing phase.", "By then, we’ll finish the testing phase since a month.", "By then, we’re finishing the testing phase already."], 0, "Futur antérieur : will have finished."),
  coach("And what will the team be doing in July?", "Et que fera l’équipe en juillet?"),
  rep(["We’ll be working on the marketing campaign.", "We’ll working on the marketing campaign.", "We’ll be work on the marketing campaign."], 0, "Futur continu : will be + -ing."),
  coach("Did we really need to hire a consultant?", "Avions-nous vraiment besoin d’engager un consultant?"),
  rep(["In hindsight, we needn’t have hired one. The team managed alone.", "In hindsight, we didn’t need have hired one. The team managed alone.", "In hindsight, we mustn’t have hired one. The team managed alone."], 0, "needn’t have = on l’a fait, mais c’était inutile."),
  coach("Good to know. Anything else for the board?", "Bon à savoir. Autre chose pour le conseil?"),
  rep(["It’s essential that every department be informed before the launch.", "It’s essential that every department is informing before the launch.", "It’s essential that every departments be informed before the launch."], 0, "Subjonctif formel : it’s essential that… be."),
  coach("Perfect. Let’s make it happen.", "Parfait. Allons-y."),
]),

S("email", "✉️", "Un courriel délicat", "C1", "Ta gestionnaire t’aide à réviser un courriel à un client mécontent.", [
  coach("Your draft says « You’re wrong about the invoice ». Too direct?", "Ton brouillon dit « Vous vous trompez sur la facture ». Trop direct?"),
  rep(["Yes. « There seems to be a misunderstanding regarding the invoice » is better.", "Yes. « There is seeming a misunderstanding about the invoice » is better.", "Yes. « You are a bit wrong about the invoice » is better."], 0, "Formule diplomatique : There seems to be a misunderstanding."),
  coach("Good. How do you explain the delay?", "Bien. Comment expliques-tu le retard?"),
  rep(["The delay was due to an unexpected supplier issue.", "The delay was because an unexpected supplier issue.", "The delay was due of an unexpected supplier issue."], 0, "due to + nom (nominalisation, registre soutenu)."),
  coach("And what do we offer?", "Et qu’offrons-nous?"),
  rep(["We would be happy to offer a 10% discount on your next order.", "We would be happy to offer a discount of 10% for your next order, no?", "We are happy offering 10% discount on your next order."], 0, "Offre formelle : We would be happy to…"),
  coach("How do you close?", "Comment conclus-tu?"),
  rep(["Please do not hesitate to contact me should you have any questions.", "Please don’t hesitate to contact me if you would have questions.", "Please do not hesitate contacting me should you having questions."], 0, "should you have = if you have (formel)."),
  coach("Excellent. Send it!", "Excellent. Envoie-le!"),
]),

S("dinner", "🍷", "Souper entre amis", "C1", "Au souper, tes amis anglophones parlent de façon très familière.", [
  coach("Man, this week was rough. My boss kept me on my toes.", "Mon vieux, quelle semaine difficile. Mon patron m’a tenu sur le qui-vive."),
  rep(["Sounds like you need a break. Hang in there!", "Sounds like you need a break. Hang on there!", "Sounds like you need a pause. Hang there in!"], 0, "Hang in there! = tiens bon!"),
  coach("Totally. Anyway, did you hear Sam quit out of the blue?", "Totalement. En passant, as-tu su que Sam a démissionné sans prévenir?"),
  rep(["No way! I thought he was gonna stick around.", "No way! I thought he was going stick around.", "No way! I thought he was gonna stick around him."], 0, "gonna = going to (familier); stick around = rester."),
  coach("Yeah, he said the job wasn’t his cup of tea.", "Ouais, il a dit que l’emploi n’était pas son genre."),
  rep(["Fair enough. Better late than never, I guess.", "Fair enough. Better later than never, I guess.", "Fair enough. Better late than nothing, I guess."], 0, "Expression figée : better late than never."),
  coach("Want more wine?", "Encore du vin?"),
  rep(["I’m good, thanks. I’m driving.", "I’m well, thanks. I’m driving.", "I’m fine with, thanks. I drive."], 0, "I’m good = non merci (familier, très courant)."),
  coach("Smart move!", "Bonne décision!"),
]),

S("subtext", "😏", "Lire entre les lignes", "C1", "Tu présentes une idée en réunion. Les réactions sont… ambiguës.", [
  coach("That’s… an interesting idea.", "C’est… une idée intéressante."),
  rep(["I sense some hesitation. What concerns do you have?", "Thanks! So you love it, great!", "Why you say interesting like that?"], 0, "« Interesting » dit avec hésitation signale souvent un doute : on invite poliment à le préciser."),
  coach("Well, I’m not sure the timing is ideal.", "Eh bien, je ne suis pas certain que le moment soit idéal."),
  rep(["Fair point. Would it make more sense to wait until the fall?", "So you say no. Okay, bye.", "The timing is perfect, I don’t agree with you at all."], 0, "« Not sure the timing is ideal » = poliment non. On propose une alternative."),
  coach("Oh great, another meeting on Friday at 5 p.m.", "Oh super, encore une réunion vendredi à 17 h."),
  rep(["I hear you. Let’s move it to Thursday morning.", "Yes, it’s great, I agree!", "Why are you happy about a meeting on Friday?"], 0, "« Oh great » sur un ton sarcastique = ce n’est pas une bonne nouvelle."),
  coach("Thursday works. Thanks for being flexible.", "Jeudi, ça marche. Merci d’être flexible."),
  rep(["No worries. I’ll send an updated invite.", "No problems. I will send an updated invitation to you all of you.", "Not worry. I send the new invite."], 0, "No worries = pas de souci; invite (nom) = invitation, familier."),
  coach("Perfect.", "Parfait."),
]),

# ----------------------------- C2 -----------------------------
S("words", "🔬", "Choisir le mot juste", "C2", "Tu révises le texte d’un collègue avec une éditrice.", [
  coach("He wrote: « Our CEO is very stubborn. » How does that sound?", "Il a écrit : « Notre PDG est très têtu. » Comment ça sonne?"),
  rep(["Negative. « Determined » or « resolute » would be more flattering.", "Fine. « Stubborn » is a compliment in English.", "Negative. « Pigheaded » would sound better."], 0, "stubborn est péjoratif; determined/resolute sont positifs."),
  coach("Good. And « Our products are cheap »?", "Bien. Et « Nos produits sont cheap »?"),
  rep(["« Affordable » is better: « cheap » can suggest low quality.", "« Cheap » is perfect, it’s more honest.", "« Inexpensive quality » is better."], 0, "cheap peut vouloir dire de mauvaise qualité; affordable est neutre."),
  coach("He also wrote « We will persuade customers that it works. »", "Il a aussi écrit « Nous persuaderons les clients que ça marche. »"),
  rep(["« Convince » fits better: we convince people that something is true.", "« Persuade » is the only correct option.", "« Convict » fits better here."], 0, "convince that… (croire), persuade to… (agir)."),
  coach("Last one: « The results were not bad at all. »", "Dernier : « Les résultats n’étaient pas mauvais du tout. »"),
  rep(["That’s litotes. In a report, « The results were strong » is clearer.", "That’s perfect. Reports should always use double negatives.", "That’s hyperbole. Change nothing."], 0, "Litote (not bad) : efficace à l’oral, moins clair dans un rapport."),
  coach("You have a great eye for nuance.", "Tu as l’œil pour les nuances."),
]),

S("hockey", "🏒", "Soirée de hockey", "C2", "Tu regardes une partie avec des collègues de Toronto.", [
  coach("If the Leafs win tonight, it’ll be a slam dunk for the playoffs.", "Si les Leafs gagnent ce soir, les séries seront dans la poche."),
  rep(["Sure, but let’s not count our chickens before they hatch.", "Sure, but let’s not count our chicken before it hatches eggs.", "Sure, but let’s not sell the bear’s skin."], 0, "Équivalent anglais de « vendre la peau de l’ours » : don’t count your chickens before they hatch."),
  coach("Ha! Spoken like a true Habs fan.", "Ha! On reconnaît bien le partisan du Canadien."),
  rep(["Guilty as charged. Montreal has twenty-four Stanley Cups, after all.", "Guilty like charged. Montreal has twenty-four Stanley Cup, after all.", "Guilty of charge. Montreal has twenty-four Stanley Cups, after all."], 0, "Expression figée : guilty as charged."),
  coach("Your boss really dropped the ball on that project, eh?", "Ton patron a vraiment échappé la balle sur ce projet, hein?"),
  rep(["He did, but he stepped up to the plate and fixed it.", "He did, but he stepped on the plate and fixed it.", "He did, but he made a hat trick of errors and fixed it."], 0, "step up to the plate = prendre ses responsabilités."),
  coach("Another double-double before the third period?", "Un autre double-double avant la troisième période?"),
  rep(["Sure, it’s on me this time.", "Sure, it’s on my charge this time.", "Sure, I invite you this time."], 0, "It’s on me = c’est moi qui paie."),
  coach("Deal!", "Marché conclu!"),
]),

S("workshop", "✒️", "Atelier d’écriture", "C2", "Tu participes à un atelier d’écriture. L’animatrice commente ton texte.", [
  coach("Your sentence « Due to the fact that it was raining » feels heavy.", "Ta phrase « Due to the fact that it was raining » est lourde."),
  rep(["You’re right. « Because it was raining » is more concise.", "You’re right. « Due to the fact of the rain falling » is better.", "You’re right. « In view of the fact that rain was occurring » is better."], 0, "Concision : because au lieu de due to the fact that."),
  coach("Also, « She was very sad » tells rather than shows.", "Aussi, « She was very sad » raconte au lieu de montrer."),
  rep(["How about « She stared at the untouched coffee until it went cold »?", "How about « She was extremely very sad »?", "How about « She had a big sadness »?"], 0, "Show, don’t tell : une image concrète plutôt qu’un adjectif."),
  coach("Nice. Where does the comma go in your dialogue?", "Bien. Où va la virgule dans ton dialogue?"),
  rep(["“I’m leaving,” she said.", "“I’m leaving” , she said.", "“I’m leaving” she said, ."], 0, "En anglais, la virgule va à l’intérieur des guillemets."),
  coach("Last thing: avoid « It was decided by the committee that… »", "Dernière chose : évite « It was decided by the committee that… »"),
  rep(["« The committee decided that… » is more direct.", "« It has been decided by the committee that… » is more direct.", "« A decision was made by the committee for… » is more direct."], 0, "Voix active : plus directe et plus claire."),
  coach("Your writing is getting sharper every week.", "Ton écriture devient plus précise chaque semaine."),
]),

S("rebuttal", "🛡️", "Répliquer en débat public", "C2", "Lors d’un débat municipal, une opposante conteste ton projet de pistes cyclables.", [
  coach("Bike lanes only benefit a tiny minority.", "Les pistes cyclables ne profitent qu’à une infime minorité."),
  rep(["That may be true today, but usage tends to grow once safe lanes exist.", "That is false and you know it.", "That may be true today, but usage tend to growing when lanes exist."], 0, "Concession puis contre-argument : That may be true, but…"),
  coach("They also hurt local businesses.", "Elles nuisent aussi aux commerces locaux."),
  rep(["Actually, studies from Toronto suggest the opposite: cyclists shop more often.", "Actually, studies from Toronto suggest the opposite: cyclists shops more often.", "Currently, studies from Toronto suggest the opposite: cyclists shop more often."], 0, "Actually = en fait (pas « actuellement »)."),
  coach("You’re ignoring the cost for taxpayers.", "Vous ignorez le coût pour les contribuables."),
  rep(["I’m not ignoring it. Let me reframe the question: what does congestion cost us?", "I’m not ignoring nothing. Let me reframe the question: what does congestion costs us?", "I don’t ignore. Let me reframe: what congestion costs us?"], 0, "Recadrer le débat (reframe) plutôt que se défendre."),
  coach("So, you admit it’s expensive?", "Donc, vous admettez que c’est cher?"),
  rep(["It’s an investment, and every dollar spent saves us more in the long run.", "It’s an investment, and every dollars spent save us more in the long run.", "It’s an invest, and every dollar spent saves us more in long run."], 0, "every + singulier; in the long run = à long terme."),
  coach("Thank you. Next speaker, please.", "Merci. Personne suivante, s’il vous plaît."),
]),
]

UNITES_NOUVEAUX = {
    "family": "a1.3", "weekend": "a1.6",
    "memory": "a2.1", "phoneshop": "a2.2", "plans": "a2.3",
    "oldfriend": "b1.1", "whatif": "b1.2", "tour": "b1.3", "message": "b1.4",
    "missed": "b2.1", "mystery": "b2.2", "movie": "b2.3", "news": "b2.4", "debate": "b2.6",
    "toast": "c1.1", "launch": "c1.2", "email": "c1.3", "dinner": "c1.4", "subtext": "c1.5",
    "words": "c2.1", "hockey": "c2.2", "workshop": "c2.3", "rebuttal": "c2.4",
}
