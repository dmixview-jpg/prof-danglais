# Construit public/curriculum.json à partir du programme rédigé (aucune IA).
#   python3 outils/programme/construire.py
# Si l'abonnement est actif (abonnement.json), seuls les niveaux gratuits gardent leur contenu
# dans public/ ; le contenu payant va dans outils/premium/contenu.json, envoyé à Firebase
# par publier_premium.mjs et lisible seulement par les abonnés.
#   python3 outils/programme/construire.py --essai DOSSIER   (tests : abonnement forcé, sorties dans DOSSIER)
#   python3 outils/programme/construire.py --tout DOSSIER    (tests : tout le contenu, sans abonnement)
import hashlib
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


# Dialogue guidé rattaché à chaque unité (rempli dans main) : id d'unité → dialogue
DIALOGUE_OF_UNIT = {}


def build_level(lid, code, name, emoji, desc, units):
    out_units = []
    for u, (utitle, uemoji, goal, lessons) in enumerate(units, 1):
        uid = f"{lid}.{u}"
        out = [{"id": f"{uid}.{n}", "emoji": le, "title": lt, "content": {"title": lt, **c}}
               for n, (le, lt, c) in enumerate(lessons, 1)]
        review = review_of(utitle, lessons)
        sc = DIALOGUE_OF_UNIT.get(uid)
        if sc:
            out.append({"id": f"{uid}.dialogue", "emoji": "🎭", "title": f"Dialogue : {sc['title']}", "dialogue": sc["id"]})
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


def load_scenarios():
    from dialogues import SCENARIOS
    from dialogues_unites import NOUVEAUX, RATTACHEMENTS, UNITES_NOUVEAUX
    links = {**RATTACHEMENTS, **UNITES_NOUVEAUX}
    scenarios = [dict(sc) for sc in SCENARIOS + NOUVEAUX]
    for sc in scenarios:
        if sc["id"] in links:
            sc["unit"] = links[sc["id"]]
            DIALOGUE_OF_UNIT[sc["unit"]] = sc
    return scenarios


def split_premium(data, config):
    """Retire le contenu des niveaux payants de data (en place) et le renvoie à part."""
    free = set(config["gratuit"])
    code_to_id = {lv["code"]: lv["id"] for lv in data["levels"]}
    premium = {}
    for lv in data["levels"]:
        if lv["id"] in free:
            continue
        bucket = premium.setdefault(lv["id"], {"lessons": {}, "scenarios": {}})
        for u in lv["units"]:
            for l in u["lessons"]:
                if "content" in l:
                    bucket["lessons"][l["id"]] = l.pop("content")
                    l["locked"] = True
    for sc in data["scenarios"]:
        lid = code_to_id.get(sc["level"])
        if lid and lid not in free:
            premium.setdefault(lid, {"lessons": {}, "scenarios": {}})["scenarios"][sc["id"]] = sc.pop("turns")
            sc["locked"] = True
    data["abonnement"] = {k: config[k] for k in ("gratuit", "essaiJours", "region", "fonctionPortail", "prix")}
    return premium


def main():
    args = sys.argv[1:]
    test_dir = None
    with open(os.path.join(HERE, "abonnement.json"), encoding="utf-8") as f:
        config = json.load(f)
    for flag, actif in (("--essai", True), ("--tout", False)):
        if flag in args:
            test_dir = args[args.index(flag) + 1]
            config["actif"] = actif
    scenarios = load_scenarios()
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

    problems = []
    ids = []
    for lv in levels:
        for u in lv["units"]:
            for l in u["lessons"]:
                ids.append(l["id"])
                if "dialogue" not in l:
                    check_lesson(l["id"], l["content"], problems)
            if lv["id"] != "pre" and u["id"] not in DIALOGUE_OF_UNIT:
                problems.append(f"unité {u['id']} sans dialogue guidé")
            sc = DIALOGUE_OF_UNIT.get(u["id"])
            if sc and sc["level"] != lv["code"]:
                problems.append(f"dialogue {sc['id']} : niveau {sc['level']} ≠ unité {lv['code']}")
    if len({s["id"] for s in scenarios}) != len(scenarios):
        problems.append("dialogues : identifiants en double")
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
    premium = split_premium(data, config) if config.get("actif") else None
    out_dir = test_dir or os.path.join(ROOT, "public")
    path = os.path.join(out_dir, "curriculum.json")
    os.makedirs(out_dir, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    if premium is not None:
        blob = json.dumps(premium, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        build = hashlib.sha256(blob.encode()).hexdigest()[:12]
        prem_dir = test_dir or os.path.join(ROOT, "outils", "premium")
        os.makedirs(prem_dir, exist_ok=True)
        with open(os.path.join(prem_dir, "contenu.json"), "w", encoding="utf-8") as f:
            json.dump({"build": build, "levels": premium}, f, ensure_ascii=False, separators=(",", ":"))
        print(f"Abonnement actif : {sum(len(p['lessons']) for p in premium.values())} leçons et "
              f"{sum(len(p['scenarios']) for p in premium.values())} dialogues réservés aux abonnés (version {build})")
    total = sum(1 for i in ids if not i.endswith((".review", ".dialogue")))
    print(f"{path} : {len(levels)} niveaux, {sum(len(lv['units']) for lv in levels)} unités, "
          f"{total} leçons + bilans, {len(scenarios)} dialogues, {os.path.getsize(path) // 1024} Ko")
    if missing:
        print("À rédiger :", ", ".join(missing))


if __name__ == "__main__":
    main()
