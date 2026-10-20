import sys, math
# Génère les icônes 3D de l’app : python3 outils/icones.py public/icons  (nécessite Pillow : pip install pillow)
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
out = sys.argv[1]
import os
FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",   # Linux
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",       # macOS
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",                            # Windows
]
FONT = next((f for f in FONTS if os.path.exists(f)), FONTS[0])
S = 2048

def lin(size, c1, c2, angle=90):
    """Dégradé linéaire de c1 à c2 (angle 90 = haut→bas, 135 = haut-gauche→bas-droite)."""
    w, h = size
    d = int(math.hypot(w, h)) + 4
    m = Image.linear_gradient("L").resize((d, d), Image.BILINEAR).rotate(angle - 90, resample=Image.BICUBIC)
    m = m.crop(((d - w) // 2, (d - h) // 2, (d - w) // 2 + w, (d - h) // 2 + h))
    return Image.composite(Image.new("RGBA", size, c2), Image.new("RGBA", size, c1), m)

def fill(mask, layer):
    img = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    img.paste(layer, (0, 0), mask)
    return img

def shifted(mask, dx, dy):
    m = Image.new("L", mask.size, 0)
    m.paste(mask, (dx, dy))
    return m

def extrude(mask, depth, color_top, color_bottom):
    """Épaisseur 3D : empile le masque décalé vers le bas avec un dégradé de couleur."""
    img = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    for i in range(depth, 0, -2):
        t = i / depth
        c = tuple(int(color_top[k] + (color_bottom[k] - color_top[k]) * t) for k in range(3)) + (255,)
        img.paste(Image.new("RGBA", mask.size, c), (0, 0), shifted(mask, int(i * 0.35), i))
    return img

def icon(size, scale, rounded=False):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # Fond : dégradé bleu + halo lumineux en haut à gauche
    bg = lin((S, S), (84, 130, 240, 255), (24, 58, 150, 255), 135)
    halo = Image.new("L", (S, S), 0)
    ImageDraw.Draw(halo).ellipse([-S * .3, -S * .35, S * .75, S * .6], fill=110)
    halo = halo.filter(ImageFilter.GaussianBlur(S * .12))
    bg = Image.composite(Image.new("RGBA", (S, S), (150, 185, 255, 255)), bg, halo)
    if rounded:
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * .22), fill=255)
        img.paste(bg, (0, 0), m)
    else:
        img = bg

    c = S / 2
    w, h = S * .70 * scale, S * .50 * scale
    x0, y0 = c - w / 2, c - h / 2 - S * .06 * scale
    x1, y1 = x0 + w, y0 + h
    depth = int(S * .045 * scale)

    bubble = Image.new("L", (S, S), 0)
    bd = ImageDraw.Draw(bubble)
    bd.rounded_rectangle([x0, y0, x1, y1], radius=int(h * .34), fill=255)
    bd.polygon([(x0 + w * .18, y1 - 10), (x0 + w * .42, y1 - 10), (x0 + w * .12, y1 + h * .30)], fill=255)

    # Ombre portée douce
    shadow = shifted(bubble, int(depth * .6), int(depth * 2.4)).filter(ImageFilter.GaussianBlur(S * .035 * scale))
    img.alpha_composite(fill(shadow.point(lambda v: int(v * .55)), Image.new("RGBA", (S, S), (8, 20, 60, 255))))

    # Épaisseur de la bulle
    img.alpha_composite(extrude(bubble, depth, (196, 208, 236), (120, 140, 196)))
    # Face avant : dégradé blanc → bleu très pâle
    img.alpha_composite(fill(bubble, lin((S, S), (255, 255, 255, 255), (220, 229, 248, 255), 100)))
    # Reflet brillant en haut
    gloss = Image.new("L", (S, S), 0)
    ImageDraw.Draw(gloss).rounded_rectangle([x0 + w * .06, y0 + h * .05, x1 - w * .06, y0 + h * .42], radius=int(h * .2), fill=255)
    gloss = ImageChops.multiply(gloss, bubble).filter(ImageFilter.GaussianBlur(S * .01))
    fade = Image.linear_gradient("L").resize((1, int(h * .37))).point(lambda v: 255 - v)
    fmask = Image.new("L", (S, S), 0)
    fmask.paste(fade.resize((S, int(h * .37))), (0, int(y0 + h * .05)))
    alpha = ImageChops.multiply(gloss, fmask).point(lambda v: int(v * .75))
    gl = Image.new("RGBA", (S, S), (255, 255, 255, 0))
    gl.putalpha(alpha)
    img.alpha_composite(gl)

    # Trait surligneur jaune en relief, légèrement incliné
    hw, hh = w * .66, h * .24
    hy = y0 + h * .56
    hl = Image.new("L", (S, S), 0)
    ImageDraw.Draw(hl).rounded_rectangle([c - hw / 2, hy, c + hw / 2, hy + hh], radius=int(hh * .4), fill=255)
    hl = hl.rotate(4, center=(c, hy + hh / 2), resample=Image.BICUBIC)
    hdepth = int(depth * .45)
    img.alpha_composite(extrude(hl, hdepth, (226, 170, 30), (196, 140, 20)))
    img.alpha_composite(fill(hl, lin((S, S), (255, 236, 140, 255), (255, 206, 60, 255), 90)))

    # Lettres « EN » extrudées
    font = ImageFont.truetype(FONT, int(h * .56))
    tmask = Image.new("L", (S, S), 0)
    td = ImageDraw.Draw(tmask)
    bb = td.textbbox((0, 0), "EN", font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    tx, ty = c - tw / 2 - bb[0] - depth * .2, y0 + h / 2 - th / 2 - bb[1] - depth * .25
    td.text((tx, ty), "EN", font=font, fill=255)
    tdepth = int(depth * .7)
    tshadow = shifted(tmask, int(tdepth * .8), int(tdepth * 1.6)).filter(ImageFilter.GaussianBlur(S * .008 * scale))
    img.alpha_composite(fill(tshadow.point(lambda v: int(v * .35)), Image.new("RGBA", (S, S), (10, 30, 90, 255))))
    img.alpha_composite(extrude(tmask, tdepth, (28, 62, 150), (14, 36, 100)))
    img.alpha_composite(fill(tmask, lin((S, S), (78, 124, 236, 255), (36, 78, 190, 255), 90)))
    # liseré clair sur le haut des lettres
    edge = ImageChops.subtract(tmask, shifted(tmask, 0, int(S * .006)))
    img.alpha_composite(fill(edge.point(lambda v: int(v * .6)), Image.new("RGBA", (S, S), (190, 210, 255, 255))))

    return img.resize((size, size), Image.LANCZOS)

icon(512, 1).save(f"{out}/icon-512.png")
icon(192, 1).save(f"{out}/icon-192.png")
icon(512, .74).save(f"{out}/icon-maskable-512.png")
icon(180, 1).convert("RGB").save(f"{out}/apple-touch-icon.png")
icon(64, 1, rounded=True).save(f"{out}/favicon-64.png")
