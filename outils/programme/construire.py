# Construit public/curriculum.json à partir du programme.
#   python3 outils/programme/construire.py
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from premiers_pas import PRE  # noqa: E402
from programme import LEVELS  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def build_level(level):
    lid, code, name, emoji, ai, desc, units = level
    out_units = []
    for u, (utitle, uemoji, goal, lessons) in enumerate(units, 1):
        uid = f"{lid}.{u}"
        out_lessons = []
        for n, (lemoji, ltitle, body) in enumerate(lessons, 1):
            lesson = {"id": f"{uid}.{n}", "emoji": lemoji, "title": ltitle}
            if isinstance(body, dict):
                lesson["content"] = {"title": ltitle, **body}
            else:
                lesson["brief"] = body
            out_lessons.append(lesson)
        out_lessons.append({"id": f"{uid}.review", "emoji": "🏁", "title": "Bilan de l’unité", "review": True})
        out_units.append({"id": uid, "emoji": uemoji, "title": utitle, "goal": goal, "lessons": out_lessons})
    return {"id": lid, "code": code, "name": name, "emoji": emoji, "ai": ai, "desc": desc, "units": out_units}


data = {"version": 1, "levels": [build_level(PRE)] + [build_level(l) for l in LEVELS]}
ids = [l["id"] for lv in data["levels"] for u in lv["units"] for l in u["lessons"]]
assert len(ids) == len(set(ids)), "identifiants en double"
path = os.path.join(ROOT, "public", "curriculum.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
total = sum(1 for i in ids if not i.endswith(".review"))
print(f"{path} : {len(data['levels'])} niveaux, "
      f"{sum(len(lv['units']) for lv in data['levels'])} unités, {total} leçons + bilans, "
      f"{os.path.getsize(path) // 1024} Ko")
