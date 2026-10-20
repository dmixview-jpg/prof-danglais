# Petites fonctions pour écrire les leçons et les dialogues de façon compacte.

def st(emoji, text):
    """Étape d'explication illustrée."""
    return {"emoji": emoji, "text": text}

def e(emoji, en, fr):
    """Exemple."""
    return {"emoji": emoji, "en": en, "fr": fr}

def v(emoji, word, fr, example):
    """Mot utile."""
    return {"emoji": emoji, "word": word, "fr": fr, "example": example}

def d(who, en, fr):
    """Réplique de dialogue."""
    return {"who": who, "en": en, "fr": fr}

def ch(question, options, answer, explain):
    """Exercice à choix de réponse (question avec ___)."""
    return {"type": "choice", "question": question, "options": options, "answer": answer, "explain": explain}

def li(audio, options, answer, explain):
    """Exercice d'écoute : la phrase est lue, on choisit ce qu'on a entendu."""
    return {"type": "listen", "audio": audio, "options": options, "answer": answer, "explain": explain}

def od(sentence, fr, explain=""):
    """Exercice de remise en ordre des mots."""
    return {"type": "order", "sentence": sentence, "fr": fr, "explain": explain}

def L(emoji, title, objective, steps, examples, vocab, dialogue, tip, exercises):
    """Leçon complète."""
    content = {"objective": objective, "explanation": steps, "examples": examples, "vocab": vocab,
               "tip": {"emoji": "💡", "text": tip}, "exercises": exercises}
    if dialogue:
        content["dialogue"] = dialogue
    return (emoji, title, content)

# ----- Dialogues guidés (onglet Conversation) -----

def coach(en, fr):
    """Réplique du chat (l'interlocuteur)."""
    return {"coach": en, "fr": fr}

def rep(options, answer, explain):
    """Réponse à choisir : 3 options, l'index de la bonne et la correction en français."""
    return {"options": options, "answer": answer, "explain": explain}
