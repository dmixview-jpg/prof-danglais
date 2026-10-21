# Icônes et écrans de lancement des apps iOS et Android (Capacitor), à partir des rendus 3D.
# Usage : python3 outils/icones_natives.py   (depuis la racine du dépôt ; nécessite Pillow)
import glob, os
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(RACINE, "outils", "logo")
RES = os.path.join(RACINE, "android", "app", "src", "main", "res")
IOS = os.path.join(RACINE, "ios", "App", "App", "Assets.xcassets")
BLEU = (75, 116, 255)  # couleur du fond du logo, bord haut

arrondi = Image.open(os.path.join(LOGO, "logo-3d-arrondi-2048.png")).convert("RGBA")  # tuile, fond transparent
carre = Image.open(os.path.join(LOGO, "logo-3d-carre-2048.png")).convert("RGB")        # plein cadre
maskable = Image.open(os.path.join(LOGO, "logo-3d-maskable-1024.png")).convert("RGB")  # dessin dans la zone sûre


def taille(img, px):
    return img.resize((px, px), Image.LANCZOS)


def rond(img, px):
    im = taille(img, px * 4).convert("RGBA")
    masque = Image.new("L", im.size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(masque).ellipse((0, 0, im.width - 1, im.height - 1), fill=255)
    im.putalpha(masque)
    return im.resize((px, px), Image.LANCZOS)


def lancement(largeur, hauteur):
    # Écran de lancement : fond bleu du logo, tuile au centre (le tiers du petit côté)
    fond = Image.new("RGB", (largeur, hauteur), BLEU)
    cote = min(largeur, hauteur) // 3
    tuile = taille(arrondi, cote)
    fond.paste(tuile, ((largeur - cote) // 2, (hauteur - cote) // 2), tuile)
    return fond


# Android : icône adaptative (avant-plan 108 dp + fond uni) et icônes classiques (48 dp)
for dossier, echelle in {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}.items():
    d = os.path.join(RES, f"mipmap-{dossier}")
    taille(maskable, int(108 * echelle)).save(os.path.join(d, "ic_launcher_foreground.png"), optimize=True)
    taille(arrondi, int(48 * echelle)).save(os.path.join(d, "ic_launcher.png"), optimize=True)
    rond(carre, int(48 * echelle)).save(os.path.join(d, "ic_launcher_round.png"), optimize=True)
with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            f'    <color name="ic_launcher_background">#{BLEU[0]:02X}{BLEU[1]:02X}{BLEU[2]:02X}</color>\n</resources>\n')
for chemin in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    with Image.open(chemin) as ancien:
        l, h = ancien.size
    lancement(l, h).save(chemin, optimize=True)

# iOS : une icône 1024 px sans transparence (iOS arrondit les coins), écran de lancement 2732 px
taille(carre, 1024).save(os.path.join(IOS, "AppIcon.appiconset", "AppIcon-512@2x.png"), optimize=True)
for chemin in glob.glob(os.path.join(IOS, "Splash.imageset", "*.png")):
    lancement(2732, 2732).save(chemin, optimize=True)
print("Icônes et écrans de lancement générés (android/, ios/).")
