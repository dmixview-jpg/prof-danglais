# Visuels des fiches App Store et Google Play : légende + capture de l'app, aux tailles exigées.
# Usage : python3 outils/captures_magasins.py DOSSIER_DES_CAPTURES_BRUTES magasins/captures
#   Captures brutes : tel-N-nom.png (393×852 à ×3) et tab-N-nom.png (1032×1376 à ×2).
import glob, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BRUT, OUT = sys.argv[1], sys.argv[2]
POLICE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo", "Fredoka-Bold.ttf")
LEGENDES = {
    "accueil": "Ton coach d’anglais,\nde l’alphabet à la maîtrise",
    "parcours": "Un parcours clair,\nde Pré-A1 à C2",
    "lecon": "Des leçons courtes,\nexpliquées en français",
    "exercice": "Pratique avec\ndes exercices variés",
    "dialogue": "Converse dans\nde vraies situations",
    "vocabulaire": "Ton carnet de mots,\navec la voix anglaise",
}
# Format : (largeur, hauteur, largeur de la capture, haut de la capture, taille du texte)
FORMATS = {
    "iphone-6.9": ("tel", 1320, 2868, 1080, 600, 92),
    "ipad-13": ("tab", 2064, 2752, 1640, 520, 104),
    "android": ("tel", 1080, 1920, 700, 420, 66),
}


def fond(l, h):
    # Dégradé bleu du logo (#6aa6ff → #3f5df5)
    haut, bas = (106, 166, 255), (63, 93, 245)
    img = Image.new("RGB", (l, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        d.line([(0, y), (l, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(haut, bas)))
    return img


def arrondi(img, r):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), r, fill=255)
    img = img.convert("RGBA")
    img.putalpha(m)
    return img


os.makedirs(OUT, exist_ok=True)
for nom_format, (prefixe, L, H, larg, haut, taille) in FORMATS.items():
    for chemin in sorted(glob.glob(os.path.join(BRUT, f"{prefixe}-*.png"))):
        num, ecran = os.path.basename(chemin)[:-4].split("-")[1:]
        img = fond(L, H)
        d = ImageDraw.Draw(img)
        police = ImageFont.truetype(POLICE, taille)
        d.multiline_text((L / 2, haut * 0.48), LEGENDES[ecran], font=police, fill="white", anchor="mm", align="center", spacing=taille * 0.25)
        cap = Image.open(chemin).convert("RGB")
        cap = cap.resize((larg, round(cap.height * larg / cap.width)), Image.LANCZOS)
        r = larg // 14
        ombre = Image.new("RGBA", (L, H), (0, 0, 0, 0))
        ImageDraw.Draw(ombre).rounded_rectangle(((L - larg) // 2, haut + 24, (L + larg) // 2, haut + cap.height + 24), r, fill=(20, 30, 90, 110))
        img.paste(ombre.filter(ImageFilter.GaussianBlur(40)), (0, 0), ombre.filter(ImageFilter.GaussianBlur(40)))
        img.paste(arrondi(cap, r), ((L - larg) // 2, haut), arrondi(cap, r))
        img.save(os.path.join(OUT, f"{nom_format}-{num}-{ecran}.jpg"), quality=90, optimize=True)
print("Visuels générés dans", OUT)

# Google Play : bannière (1024×500) et icône (512×512, carré plein)
LOGO = os.path.join(os.path.dirname(POLICE))
b = fond(1024, 500)
tuile = Image.open(os.path.join(LOGO, "logo-3d-arrondi-2048.png")).convert("RGBA").resize((330, 330), Image.LANCZOS)
b.paste(tuile, (70, 85), tuile)
d = ImageDraw.Draw(b)
d.text((440, 205), "Prof d’anglais", font=ImageFont.truetype(POLICE, 78), fill="white", anchor="lm")
d.text((442, 290), "De l’alphabet à la maîtrise, pas à pas", font=ImageFont.truetype(POLICE, 31), fill=(230, 238, 255), anchor="lm")
b.save(os.path.join(OUT, "google-play-banniere-1024x500.jpg"), quality=92)
Image.open(os.path.join(LOGO, "logo-3d-carre-2048.png")).convert("RGB").resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "google-play-icone-512.png"), optimize=True)
