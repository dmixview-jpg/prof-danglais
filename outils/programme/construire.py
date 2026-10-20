# Construit public/curriculum.json à partir du programme rédigé (aucune IA).
#   python3 outils/programme/construire.py
import importlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "contenu"))
from premiers_pas import PRE  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))

# (id, code, nom, emoji, description, nombre d'unités) — chaque unité est dans contenu/<id>_u<n>.py
LEVELS = [
    ("a1", "A1", "Débutant", "🐣", "Te présenter, parler de ton quotidien et comprendre des phrases simples.", 6),
    ("a2", "A2", "Élémentaire", "🌿", "Raconter, comparer, parler de projets et te débrouiller dans la vie pratique.", 6),
    ("b1", "B1", "Intermédiaire", "🌳", "Te débrouiller dans la plupart des situations, raconter, argumenter et travailler en anglais.", 6),
    ("b2", "B2", "Intermédiaire avancé", "🌲", "Comprendre l’essentiel de textes complexes, argumenter et parler avec aisance.", 6),
    ("c1", "C1", "Avancé", "🏔️", "T’exprimer avec aisance et précision, à l’oral comme à l’écrit, même dans des contextes exigeants.", 6),
    ("c2", "C2", "Maîtrise", "🏆", "Comprendre pratiquement tout et t’exprimer avec la précision et la finesse d’un locuteur natif instruit.", 4),
]


def review_of(unit_title, lessons):
    """Bilan d'unité assemblé à partir des leçons : une règle, un exemple et deux exercices par leçon."""
    steps, examples, vocab, exercises = [], [], [], []
    for emoji, title, c in lessons:
        steps.append({"emoji": emoji, "text": f"{title} — {c['explanation'][0]['text']}"})
        examples.append(c["examples"][0])
        vocab.extend(c["vocab"][:1])
        picks = [x for x in c["exercises"] if x["type"] == "choice"][:1] + \
                [x for x in c["exercises"] if x["type"] != "choice"][:1]
        exercises.extend(picks)
    return {
        "title": f"Bilan : {unit_title}",
        "objective": "Réviser toutes les leçons de l’unité.",
        "explanation": steps, "examples": examples, "vocab": vocab,
        "tip": {"emoji": "🏁", "text": "Une erreur? Rouvre la leçon correspondante dans le parcours, puis refais ce bilan pour gagner 3 étoiles."},
        "exercises": exercises,
    }


def build_level(lid, code, name, emoji, desc, units):
    out_units = []
    for u, (utitle, uemoji, goal, lessons) in enumerate(units, 1):
        uid = f"{lid}.{u}"
        out = [{"id": f"{uid}.{n}", "emoji": le, "title": lt, "content": {"title": lt, **c}}
               for n, (le, lt, c) in enumerate(lessons, 1)]
        review = review_of(utitle, lessons)
        out.append({"id": f"{uid}.review", "emoji": "🏁", "title": "Bilan de l’unité", "review": True, "content": review})
        out_units.append({"id": uid, "emoji": uemoji, "title": utitle, "goal": goal, "lessons": out})
    return {"id": lid, "code": code, "name": name, "emoji": emoji, "desc": desc, "units": out_units}


# ---------- Vérification du contenu ----------
def check_lesson(where, c, problems):
    def bad(msg):
        problems.append(f"{where} : {msg}")
    for key, minimum in (("explanation", 2), ("examples", 2), ("exercises", 3)):
        if len(c.get(key, [])) < minimum:
            bad(f"« {key} » trop court")
    for x in c.get("exercises", []):
        t = x["type"]
        if t in ("choice", "listen"):
            opts = x["options"]
            if len(opts) != 3 or len(set(opts)) != 3 or not all(opts):
                bad(f"options invalides {opts}")
            if not (0 <= x["answer"] <= 2):
                bad(f"index de réponse invalide {x}")
            if t == "choice" and "___" not in x["question"] and "?" not in x["question"] and "=" not in x["question"]:
                bad(f"question sans blanc : {x['question']}")
            if t == "listen":
                norm = lambda z: re.sub(r"[^a-z0-9’']", "", z.lower())
                same = [i for i, o in enumerate(opts) if norm(o) == norm(x["audio"])]
                if same and same[0] != x["answer"]:
                    bad(f"écoute : la réponse lue est l’option {same[0]}, pas {x['answer']} ({x['audio']})")
        elif t == "order":
            n = len(re.sub(r"[.,!?;:]", "", x["sentence"]).split())
            if not 2 <= n <= 14:
                bad(f"phrase à ordonner de {n} mots : {x['sentence']}")
        if not x.get("explain"):
            bad(f"exercice sans explication : {x}")


def main():
    levels = [build_level(PRE[0], PRE[1], PRE[2], PRE[3], PRE[5],
                          [(t, em, g, [(le, lt, c) for le, lt, c in ls]) for t, em, g, ls in PRE[6]])]
    missing = []
    for lid, code, name, emoji, desc, count in LEVELS:
        units = []
        for n in range(1, count + 1):
            try:
                units.append(importlib.import_module(f"{lid}_u{n}").UNIT)
            except ModuleNotFoundError:
                missing.append(f"{lid}_u{n}")
        if units:
            levels.append(build_level(lid, code, name, emoji, desc, units))

    scenarios = []
    try:
        scenarios = importlib.import_module("dialogues").SCENARIOS
    except ModuleNotFoundError:
        missing.append("dialogues")

    problems = []
    ids = []
    for lv in levels:
        for u in lv["units"]:
            for l in u["lessons"]:
                ids.append(l["id"])
                check_lesson(l["id"], l["content"], problems)
    if len(ids) != len(set(ids)):
        problems.append("identifiants en double")
    for s in scenarios:
        for i, turn in enumerate(s["turns"]):
            if "options" in turn and (len(set(turn["options"])) != 3 or not 0 <= turn["answer"] <= 2):
                problems.append(f"dialogue {s['id']} réplique {i} : options invalides")
    if problems:
        print("\n".join(problems))
        sys.exit(1)

    data = {"version": 2, "levels": levels, "scenarios": scenarios}
    path = os.path.join(ROOT, "public", "curriculum.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    total = sum(1 for i in ids if not i.endswith(".review"))
    print(f"{path} : {len(levels)} niveaux, {sum(len(lv['units']) for lv in levels)} unités, "
          f"{total} leçons + bilans, {len(scenarios)} dialogues, {os.path.getsize(path) // 1024} Ko")
    if missing:
        print("À rédiger :", ", ".join(missing))


if __name__ == "__main__":
    main()
