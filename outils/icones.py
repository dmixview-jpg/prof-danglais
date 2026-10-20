# Génère les icônes de l’app à partir des rendus 3D Blender (outils/logo/).
# Usage : python3 outils/icones.py public/icons   (nécessite Pillow : pip install pillow)
# Pour refaire les rendus eux-mêmes, voir outils/logo/logo3d.py.
import os, sys
from PIL import Image

out = sys.argv[1]
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo")
arrondi = Image.open(os.path.join(LOGO, "logo-3d-arrondi-2048.png")).convert("RGBA")  # tuile, fond transparent
carre = Image.open(os.path.join(LOGO, "logo-3d-carre-2048.png")).convert("RGB")        # plein cadre
maskable = Image.open(os.path.join(LOGO, "logo-3d-maskable-1024.png")).convert("RGB")  # dans la zone sûre (80 %)


def size(img, px):
    return img.resize((px, px), Image.LANCZOS)


# Android et navigateurs : tuile arrondie sur fond transparent
size(arrondi, 512).save(f"{out}/icon-512.png", optimize=True)
size(arrondi, 192).save(f"{out}/icon-192.png", optimize=True)
# Android « maskable » : le système découpe lui-même (cercle, goutte…)
size(maskable, 512).save(f"{out}/icon-maskable-512.png", optimize=True)
# iPhone / iPad : carré plein, iOS arrondit les coins
size(carre, 180).save(f"{out}/apple-touch-icon.png", optimize=True)
# Onglet du navigateur et logo de l’en-tête
size(arrondi, 64).save(f"{out}/favicon-64.png", optimize=True)
print("Icônes générées dans", out)
