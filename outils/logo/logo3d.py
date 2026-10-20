# Logo 3D « Prof d'anglais » rendu avec Blender (moteur Cycles).
#
# Avec Blender installé :
#   blender -b -P outils/logo/logo3d.py -- outils/logo/logo-3d-arrondi-2048.png 2048 160 arrondi
#   blender -b -P outils/logo/logo3d.py -- outils/logo/logo-3d-carre-2048.png 2048 160 carre
#   blender -b -P outils/logo/logo3d.py -- outils/logo/logo-3d-maskable-1024.png 1024 160 maskable
# Ou sans Blender, avec le module Python « bpy » (pip install bpy) :
#   python outils/logo/logo3d.py -- <sortie.png> <taille> <échantillons> <arrondi|carre|maskable>
# Puis : python3 outils/icones.py public/icons
import sys, os, math
import bpy, addon_utils
from mathutils import Vector

ICI = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = args[3] if len(args) > 3 else 'arrondi'
OUT = os.path.abspath(args[0]) if args else os.path.join(ICI, f'logo-3d-{MODE}.png')
SIZE = int(args[1]) if len(args) > 1 else 2048
SAMPLES = int(args[2]) if len(args) > 2 else 160
FONT = os.path.join(ICI, 'Fredoka-Bold.ttf')  # Fredoka Bold, licence SIL OFL (OFL.txt)

bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('cycles')
scene = bpy.context.scene


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)


def material(name, color, rough=0.3, coat=0.6, sss=0.0, metal=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.08
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.4, 0.5, 0.9)
        b.inputs['Subsurface Scale'].default_value = 0.08
    if emit:
        b.inputs['Emission Color'].default_value = srgb(emit)
        b.inputs['Emission Strength'].default_value = strength
    return m


def add_bump(m, strength=0.02, scale=60.0):
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = 0.02
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m


def gradient_material(name, stops, angle=-45, rough=0.32, coat=0.7, glow=None):
    """Dégradé linéaire (coordonnées générées) + halo radial clair optionnel."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n = nt.nodes
    b = n['Principled BSDF']
    tc = n.new('ShaderNodeTexCoord')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Location'].default_value = (0.5, 0.5, 0)
    mp.inputs['Rotation'].default_value = (0, 0, math.radians(angle))
    off = n.new('ShaderNodeMapping')
    off.inputs['Location'].default_value = (0.5, 0.5, 0)
    sub = n.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'
    sub.inputs[1].default_value = (0.5, 0.5, 0)
    nt.links.new(tc.outputs['Generated'], sub.inputs[0])
    nt.links.new(sub.outputs[0], mp.inputs['Vector'])
    g = n.new('ShaderNodeTexGradient')
    nt.links.new(mp.outputs[0], g.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], srgb(stops[0][1])
    el[1].position, el[1].color = stops[-1][0], srgb(stops[-1][1])
    for p, c in stops[1:-1]:
        e = el.new(p); e.color = srgb(c)
    nt.links.new(g.outputs['Fac'], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    if glow:
        sg = n.new('ShaderNodeTexGradient'); sg.gradient_type = 'SPHERICAL'
        gm = n.new('ShaderNodeMapping')
        gm.inputs['Scale'].default_value = (1.35, 1.35, 1.35)
        gm.inputs['Location'].default_value = (0.0, -0.08, 0)
        nt.links.new(sub.outputs[0], gm.inputs['Vector'])
        nt.links.new(gm.outputs[0], sg.inputs['Vector'])
        mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'SCREEN'
        nt.links.new(sg.outputs['Fac'], mix.inputs['Factor'])
        nt.links.new(col, mix.inputs['A'])
        mix.inputs['B'].default_value = srgb(glow)
        col = mix.outputs['Result']
    nt.links.new(col, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.1
    return m


def poly_object(name, pts, extrude, bevel, mat, res=10, offset=0.0):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '2D'
    cu.fill_mode = 'BOTH'
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = res
    cu.offset = offset
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts):
        p.co = (x, y, 0, 1)
    sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return to_mesh(ob)


def to_mesh(ob):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    for p in ob.data.polygons:
        p.use_smooth = True
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except Exception:
        pass
    return ob


def arc(cx, cy, r, a0, a1, n=24):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cy + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def squircle(a, n=5, k=256):
    pts = []
    for i in range(k):
        t = 2 * math.pi * i / k
        c, s = math.cos(t), math.sin(t)
        pts.append((a * math.copysign(abs(c) ** (2 / n), c), a * math.copysign(abs(s) ** (2 / n), s)))
    return pts


# ---------------------------------------------------------------- Matériaux
M_TILE = gradient_material('tile', [(0.0, '#9cc0ff'), (0.38, '#4f80ff'), (0.75, '#2d4fe0'), (1.0, '#1c3aa8')], angle=-45, glow='#4a6ae8', rough=0.42, coat=0.35)
add_bump(M_TILE, 0.02, 120)
M_BUBBLE = add_bump(material('bubble', '#f3f6fd', rough=0.16, coat=1.0, sss=0.12), 0.015, 80)
M_EAR = material('ear', '#f3f6fd', rough=0.16, coat=1.0, sss=0.12)
M_PINK = material('pink', '#8eb0ff', rough=0.28, coat=0.8)
M_TEXT = gradient_material('text', [(0.0, '#3f74ff'), (0.55, '#2450e0'), (1.0, '#14309e')], angle=-90, rough=0.1, coat=1.0)
M_PILL = add_bump(material('pill', '#ffc21a', rough=0.14, coat=1.0, sss=0.05), 0.01, 90)
M_WHISK = material('whisk', '#1d2f7a', rough=0.15, coat=1.0)
M_GOLD = material('gold', '#ffc23a', rough=0.18, metal=0.9, coat=0.6)
M_SPARK = material('spark', '#ffffff', emit='#ffffff', strength=5.0)

# ---------------------------------------------------------------- Tuile (ou fond plein)
if MODE == 'arrondi':
    tile = poly_object('tile', squircle(2.2), 0.16, 0.09, M_TILE, res=8)
    tile.location.z = -0.1
else:
    bpy.ops.mesh.primitive_plane_add(size=6.2 if MODE == 'carre' else 9.0, location=(0, 0, 0.05))
    tile = bpy.context.active_object
    M_FLAT = M_TILE.copy()
    pb = M_FLAT.node_tree.nodes['Principled BSDF']
    pb.inputs['Roughness'].default_value = 0.85
    pb.inputs['Coat Weight'].default_value = 0.0
    pb.inputs['Specular IOR Level'].default_value = 0.15
    tile.data.materials.append(M_FLAT)

# ---------------------------------------------------------------- Bulle-chat
W, H, R, CY = 3.1, 2.15, 0.9, 0.12
x0, x1, y0, y1 = -W / 2, W / 2, CY - H / 2, CY + H / 2
def quad(p0, c, p1, n=14):
    return [((1-t)**2*p0[0]+2*(1-t)*t*c[0]+t*t*p1[0], (1-t)**2*p0[1]+2*(1-t)*t*c[1]+t*t*p1[1]) for t in (i/n for i in range(n+1))]
TC, TR = (-1.12, y0 - 0.78), 0.1
t0 = (TC[0] + TR * math.cos(math.radians(165)), TC[1] + TR * math.sin(math.radians(165)))
t1 = (TC[0] + TR * math.cos(math.radians(320)), TC[1] + TR * math.sin(math.radians(320)))
pts = [(x0 + R, y0)]
pts += quad((-0.5, y0), (-0.88, y0 - 0.2), t0, 14)
pts += arc(TC[0], TC[1], TR, math.radians(165), math.radians(320), 10)[1:]
pts += quad(t1, (-0.6, y0 - 0.4), (0.05, y0), 14)[1:]
pts += [(x1 - R, y0)] + arc(x1 - R, y0 + R, R, -math.pi / 2, 0)[1:]
pts += [(x1, y1 - R)] + arc(x1 - R, y1 - R, R, 0, math.pi / 2)[1:]
pts += [(x0 + R, y1)] + arc(x0 + R, y1 - R, R, math.pi / 2, math.pi)[1:]
pts += [(x0, y0 + R)] + arc(x0 + R, y0 + R, R, math.pi, 1.5 * math.pi)[1:-1]
bubble = poly_object('bubble', pts, 0.22, 0.13, M_BUBBLE, res=14)

group = bpy.data.objects.new('group', None)
bpy.context.collection.objects.link(group)
bubble.parent = group

# Oreilles de chat sur le dessus de la bulle
for sx in (-1, 1):
    def chaikin(pts, n=4):
        for _ in range(n):
            out = []
            for i in range(len(pts)):
                p, q = pts[i], pts[(i + 1) % len(pts)]
                out += [(0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]), (0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1])]
            pts = out
        return pts

    def ear(w, h, extrude, bevel, mat, loc):
        tri = [(-w / 2, 0), (w / 2, 0), (w * 0.06, h)]
        o = poly_object('ear', chaikin(tri), extrude, bevel, mat, res=10)
        o.location = loc
        o.rotation_euler = (0, 0, math.radians(-sx * 22))
        o.parent = group
        return o

    ear(1.12, 1.16, 0.12, 0.11, M_EAR, (sx * 0.9, y1 - 0.18, 0.0))
    ear(0.6, 0.7, 0.02, 0.04, M_PINK, (sx * 0.93, y1 - 0.02, 0.22))


FRONT = 0.22 + 0.13  # face avant de la bulle

# Lettres EN
cu = bpy.data.curves.new('EN', 'FONT')
cu.body = 'EN'
cu.font = bpy.data.fonts.load(FONT)
cu.size = 1.42
cu.align_x = 'CENTER'
cu.align_y = 'CENTER'
cu.extrude = 0.16
cu.bevel_depth = 0.045
cu.bevel_resolution = 6
cu.space_character = 1.04
txt = bpy.data.objects.new('EN', cu)
bpy.context.collection.objects.link(txt)
txt.data.materials.append(M_TEXT)
txt.location = (0.03, 0.28, FRONT + 0.2)
txt = to_mesh(txt)
txt.parent = group

# Étiquette jaune sous les lettres
PL, PHh = 2.0, 0.42
pp = arc(PL / 2 - PHh / 2, 0, PHh / 2, -math.pi / 2, math.pi / 2, 16) + arc(-PL / 2 + PHh / 2, 0, PHh / 2, math.pi / 2, 1.5 * math.pi, 16)
pill = poly_object('pill', pp, 0.05, 0.07, M_PILL, res=8)
pill.location = (0.06, -0.38, FRONT + 0.07)
pill.rotation_euler = (0, 0, math.radians(3.5))
pill.parent = group

for sx in (-1, 1):
    for k in (-1, 0, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.034, depth=0.78, location=(sx * (W / 2 + 0.24), CY - 0.12 + k * 0.2, 0.08))
        wk = bpy.context.active_object
        wk.rotation_euler = (0, math.radians(90), math.radians(sx * k * 9))
        bv2 = wk.modifiers.new('round', 'BEVEL'); bv2.width = 0.03; bv2.segments = 4
        for p in wk.data.polygons: p.use_smooth = True
        wk.data.materials.append(M_WHISK)
        wk.parent = group

group.location = (0.04, -0.12, 0.42)
group.rotation_euler = (math.radians(-7), math.radians(9), math.radians(-2))
group.scale = (0.95, 0.95, 0.95)

# ---------------------------------------------------------------- Étoile dorée + étincelles
def star_pts(r1, r2, n=5):
    return [((r1 if i % 2 == 0 else r2) * math.cos(math.pi / 2 + i * math.pi / n), (r1 if i % 2 == 0 else r2) * math.sin(math.pi / 2 + i * math.pi / n)) for i in range(2 * n)]

def sparkle(x, y, z, r):
    pts = []
    for i in range(4):
        a = i * math.pi / 2
        pts.append((r * math.cos(a), r * math.sin(a)))
        b = a + math.pi / 4
        pts.append((r * 0.16 * math.cos(b), r * 0.16 * math.sin(b)))
    ob = poly_object('spark', pts, 0.01, 0.015, M_SPARK, res=2)
    ob.location = (x, y, z)
    return ob

sparkle(1.62, 1.55, 0.7, 0.27)
sparkle(1.28, 1.86, 0.6, 0.12)

# ---------------------------------------------------------------- Lumières, caméra, monde
def area(name, loc, power, size, color, target=(0, 0, 0)):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = power; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o

def strip(name, loc, power, sx, sy, color=(1, 1, 1), target=(0, 0, 0)):
    d = bpy.data.lights.new(name, 'AREA'); d.shape = 'RECTANGLE'; d.size = sx; d.size_y = sy; d.energy = power; d.color = color
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o

strip('softbox', (-4.2, 4.6, 9), 1100, 3.2, 3.2, (1.0, 0.97, 0.92))
strip('stripL', (-6.5, -0.5, 4.5), 520, 0.45, 7.5, (1.0, 1.0, 1.0))
strip('stripR', (6.5, 1.0, 5.5), 420, 0.45, 7.5, (0.92, 0.95, 1.0))
strip('topstrip', (0.5, 6.5, 6.5), 260, 7.5, 0.45)
strip('fill', (1.5, -3, 14), 90, 8, 8, (0.95, 0.97, 1.0))

world = bpy.data.worlds.new('w'); scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = srgb('#3a4a9a')
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.3

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 85
cam = bpy.data.objects.new('cam', cam_d); bpy.context.collection.objects.link(cam)
cam.location = (0.75, -1.05, {'arrondi': 12.6, 'carre': 13.4}.get(MODE, 17.5))
cam.rotation_euler = (math.atan((cam.location.y * -1 - 0.04) / (cam.location.z - 0.3)), math.atan(cam.location.x / (cam.location.z - 0.3)), 0)
scene.camera = cam

r = scene.render
r.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
r.resolution_x = r.resolution_y = SIZE
r.film_transparent = MODE == 'arrondi'
scene.cycles.filter_width = 1.2
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA' if MODE == 'arrondi' else 'RGB'
try:
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0
except Exception as e:
    print('look', e)
r.filepath = OUT
bpy.ops.render.render(write_still=True)
print('RENDU', OUT)
