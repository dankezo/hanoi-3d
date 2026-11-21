"""Step 2A: draw the 6 Basic grand-building hero sprites (flat cut-paper style, PIL)
and composite them into public/textures/art/atlas.webp + atlas.json.

No AI art is available in the sandbox, so the sprites are drawn procedurally with PIL
polygons in the same flat palette as the GLB flaps (tools/step5/build-basic-glb.mjs).
Each sprite is drawn at exactly its rect size on a transparent background, so the hero
art card's alpha does the die-cut, same as step 5.

Layout: free zone below y=3379 (max extent of the 194 existing sprites). Two rows,
16 px gutters, 256 px per world unit (rect size = hero flap world size x 256).
Existing sprite rects are never touched; the script asserts no overlap.
atlas.json is a single compact line; the rewrite preserves that format.
No long dashes in this file.
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ATLAS = 'public/textures/art/atlas.webp'
JSON = 'public/textures/art/atlas.json'

# sprite key -> rect [x, y, w, h] (keep in sync with tools/step5/build-basic-glb.mjs SPRITES)
PLAN = {
    'basic_townhouse': [16, 3395, 294, 333],
    'basic_grandmanor': [326, 3395, 384, 358],
    'basic_greatbarn': [726, 3395, 384, 358],
    'basic_marketstreet': [16, 3769, 410, 282],
    'basic_gardencottage': [442, 3769, 358, 256],
    'basic_townsquare': [816, 3769, 410, 282],
}

PAPER = (239, 224, 194, 255)
CREAM = (242, 232, 208, 255)
SHADE = (232, 211, 172, 255)
KRAFT = (232, 211, 172, 255)
OCHRE = (217, 164, 65, 255)
MUSTARD = (220, 168, 72, 255)
TERRA = (185, 96, 63, 255)
RUST = (178, 90, 59, 255)
ROSE = (201, 131, 116, 255)
SAGE = (142, 154, 91, 255)
OLIVE = (135, 147, 86, 255)
PINE = (79, 107, 74, 255)
MOSS = (79, 107, 74, 255)
TEAL = (94, 156, 154, 255)
TEALDEEP = (63, 127, 132, 255)
BROWN = (90, 58, 40, 255)
INK = (90, 58, 40, 255)
GOLD = (255, 196, 90, 255)
SMOKE = (220, 215, 200, 160)


def draw_townhouse(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # smoke wisp above the chimney
    for cx, cy, r in [(238, 26, 9), (246, 12, 7), (230, 40, 11)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SMOKE)
    # steep gabled roof + chimney
    d.polygon([(8, 150), (147, 18), (286, 150)], fill=TERRA)
    d.rectangle([220, 30, 242, 150], fill=RUST)
    d.rectangle([216, 24, 246, 34], fill=INK)
    # 3-storey cream body
    d.rectangle([42, 150, 252, 320], fill=CREAM)
    # dormer on the roof face
    d.rectangle([128, 80, 166, 130], fill=SHADE)
    d.polygon([(124, 80), (166, 80), (147, 58)], fill=TERRA)
    d.rectangle([138, 92, 156, 122], fill=INK)
    # windows with sage shutters, three floors
    for y in (165, 220, 272):
        for x in (62, 202):
            d.rectangle([x - 12, y, x - 2, y + 32], fill=SAGE)
            d.rectangle([x + 32, y, x + 42, y + 32], fill=SAGE)
            d.rectangle([x, y, x + 30, y + 32], fill=INK)
            d.rectangle([x + 14, y, x + 16, y + 32], fill=CREAM)
    # flower box under the middle floor + door
    d.rectangle([58, 258, 120, 272], fill=TERRA)
    for cx in (66, 80, 94, 108):
        d.ellipse([cx - 4, 250, cx + 4, 258], fill=MUSTARD)
        d.ellipse([cx - 4, 258, cx + 4, 266], fill=ROSE)
    d.rectangle([132, 278, 162, 320], fill=INK)
    d.ellipse([156, 298, 160, 302], fill=GOLD)
    return im


def draw_grandmanor(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # cypress trees at the sides
    d.polygon([(8, 330), (26, 190), (44, 330)], fill=PINE)
    d.polygon([(340, 330), (358, 200), (376, 330)], fill=PINE)
    # side tower + conical roof
    d.rectangle([288, 60, 352, 330], fill=OCHRE)
    d.polygon([(280, 70), (320, 10), (360, 70)], fill=ROSE)
    d.rectangle([308, 90, 332, 130], fill=INK)
    # main roof + ochre body
    d.polygon([(20, 170), (190, 40), (360, 170)], fill=ROSE)
    d.rectangle([60, 170, 320, 330], fill=OCHRE)
    # arched windows: rect + round top
    for x in (90, 150, 210):
        d.rectangle([x, 200, x + 26, 250], fill=INK)
        d.ellipse([x, 187, x + 26, 213], fill=INK)
        d.rectangle([x + 12, 200, x + 14, 250], fill=CREAM)
    # garden wall + gate
    d.rectangle([10, 300, 374, 330], fill=SHADE)
    d.rectangle([170, 280, 214, 330], fill=INK)
    d.ellipse([206, 302, 210, 306], fill=GOLD)
    return im


def draw_greatbarn(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # round silo + cone cap
    d.rectangle([300, 90, 350, 330], fill=SHADE)
    d.polygon([(292, 95), (325, 30), (358, 95)], fill=RUST)
    for y in (130, 180, 230, 280):
        d.rectangle([300, y, 350, y + 4], fill=BROWN)
    # great barn: rust roof, kraft timber body, plank lines, big door
    d.polygon([(30, 170), (190, 50), (350, 170)], fill=RUST)
    d.rectangle([70, 170, 310, 330], fill=KRAFT)
    for x in (110, 150, 190, 230, 270):
        d.rectangle([x, 170, x + 3, 330], fill=BROWN)
    d.rectangle([160, 250, 220, 330], fill=BROWN)
    d.rectangle([172, 262, 208, 298], fill=INK)
    # haystacks + cart + fence run
    d.polygon([(10, 330), (60, 250), (110, 330)], fill=MUSTARD)
    d.polygon([(250, 330), (282, 275), (314, 330)], fill=MUSTARD)
    d.rectangle([120, 300, 190, 320], fill=BROWN)
    d.ellipse([128, 316, 144, 332], fill=INK)
    d.ellipse([168, 316, 184, 332], fill=INK)
    d.rectangle([10, 336, 374, 344], fill=BROWN)
    return im


def draw_marketstreet(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # bunting across the lane
    d.line([(10, 60), (400, 60)], fill=INK, width=2)
    for i, cx in enumerate(range(30, 390, 36)):
        c = [ROSE, TEAL, MUSTARD][i % 3]
        d.polygon([(cx, 60), (cx + 24, 60), (cx + 12, 82)], fill=c)
    # left house + terracotta roof
    d.polygon([(10, 95), (85, 20), (160, 95)], fill=TERRA)
    d.rectangle([20, 95, 150, 270], fill=CREAM)
    # right house + rust roof
    d.polygon([(250, 85), (325, 15), (400, 85)], fill=RUST)
    d.rectangle([260, 85, 390, 270], fill=SHADE)
    # striped awnings: teal left, terracotta right
    for i, x in enumerate(range(25, 145, 20)):
        d.rectangle([x, 150, x + 20, 175], fill=TEAL if i % 2 == 0 else CREAM)
    for i, x in enumerate(range(265, 385, 20)):
        d.rectangle([x, 145, x + 20, 170], fill=TERRA if i % 2 == 0 else CREAM)
    # windows + doors
    d.rectangle([50, 185, 80, 225], fill=INK)
    d.rectangle([110, 185, 140, 225], fill=INK)
    d.rectangle([290, 180, 320, 220], fill=INK)
    d.rectangle([350, 180, 380, 220], fill=INK)
    # market stalls with fruit
    d.rectangle([175, 205, 235, 270], fill=KRAFT)
    d.rectangle([175, 205, 235, 215], fill=BROWN)
    for cx, c in [(185, MUSTARD), (200, ROSE), (215, TEAL), (228, MUSTARD)]:
        d.ellipse([cx - 6, 192, cx + 6, 204], fill=c)
    d.rectangle([300, 215, 355, 270], fill=KRAFT)
    for cx, c in [(312, ROSE), (328, MUSTARD), (344, ROSE)]:
        d.ellipse([cx - 6, 202, cx + 6, 214], fill=c)
    # hanging lanterns
    for cx, cy in [(200, 95), (120, 105), (300, 100)]:
        d.line([(cx, 82), (cx, cy - 8)], fill=INK, width=2)
        d.ellipse([cx - 9, cy - 8, cx + 9, cy + 8], fill=GOLD)
        d.rectangle([cx - 4, cy - 12, cx + 4, cy - 8], fill=INK)
    return im


def draw_gardencottage(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # blossom-pink roof + cream cottage
    d.polygon([(40, 120), (180, 30), (320, 120)], fill=ROSE)
    d.rectangle([70, 120, 290, 240], fill=CREAM)
    d.rectangle([165, 180, 195, 240], fill=INK)
    d.ellipse([189, 208, 193, 212], fill=GOLD)
    for x in (95, 245):
        d.rectangle([x, 150, x + 30, 185], fill=INK)
        d.rectangle([x - 10, 150, x, 185], fill=SAGE)
        d.rectangle([x + 30, 150, x + 40, 185], fill=SAGE)
    # walled flower garden
    d.rectangle([10, 215, 348, 245], fill=SHADE)
    for cx, c in [(30, MUSTARD), (55, ROSE), (250, ROSE), (275, MUSTARD), (300, ROSE)]:
        d.ellipse([cx - 5, 205, cx + 5, 215], fill=c)
    # pond with reeds
    d.ellipse([15, 225, 120, 252], fill=TEAL)
    d.ellipse([25, 230, 110, 248], fill=TEALDEEP)
    for x in (20, 32, 108):
        d.rectangle([x, 205, x + 4, 232], fill=MOSS)
    # stone lantern
    d.rectangle([316, 190, 324, 245], fill=INK)
    d.rectangle([306, 180, 334, 190], fill=SHADE)
    d.rectangle([310, 172, 330, 180], fill=GOLD)
    return im


def draw_townsquare(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # two large trees
    d.rectangle([42, 180, 52, 250], fill=BROWN)
    d.ellipse([10, 40, 90, 190], fill=MOSS)
    d.rectangle([352, 190, 362, 250], fill=BROWN)
    d.ellipse([320, 50, 400, 200], fill=OLIVE)
    # central fountain: basin, column, top dish, water arcs
    d.ellipse([150, 220, 260, 262], fill=TEALDEEP)
    d.ellipse([162, 226, 248, 256], fill=TEAL)
    d.rectangle([195, 140, 215, 225], fill=PAPER)
    d.ellipse([180, 130, 230, 150], fill=TEAL)
    d.ellipse([192, 118, 218, 134], fill=TEALDEEP)
    for r in (30, 44, 58):
        d.arc([205 - r, 150 - r, 205 + r, 150 + r], 200, 340, fill=TEAL, width=3)
    # four lamp posts (two drawn fully, two behind the trees read as posts)
    for cx in (100, 310):
        d.rectangle([cx - 2, 120, cx + 2, 250], fill=INK)
        d.rectangle([cx - 10, 108, cx + 10, 122], fill=GOLD)
        d.ellipse([cx - 14, 104, cx + 14, 126], outline=GOLD, width=2)
    # benches + pigeons
    for x in (110, 240):
        d.rectangle([x, 235, x + 60, 245], fill=BROWN)
        d.rectangle([x + 6, 245, x + 10, 255], fill=INK)
        d.rectangle([x + 50, 245, x + 54, 255], fill=INK)
    for cx, cy in [(185, 258), (200, 262), (225, 258)]:
        d.ellipse([cx - 5, cy - 4, cx + 5, cy + 4], fill=INK)
    return im


DRAW = {
    'basic_townhouse': draw_townhouse,
    'basic_grandmanor': draw_grandmanor,
    'basic_greatbarn': draw_greatbarn,
    'basic_marketstreet': draw_marketstreet,
    'basic_gardencottage': draw_gardencottage,
    'basic_townsquare': draw_townsquare,
}


def bleed(im, iters=40):
    """Dilate opaque RGB colours into transparent pixels (mipmap fringe guard)."""
    arr = np.array(im)
    rgb, a = arr[:, :, :3], arr[:, :, 3]
    solid = a > 0
    cur = rgb.copy()
    base = rgb.copy()
    for _ in range(iters):
        m = np.array(Image.fromarray(cur).filter(ImageFilter.MaxFilter(3)))
        nxt = np.where(solid[:, :, None], base, m)
        if np.array_equal(nxt, cur):
            break
        cur = nxt
    arr[:, :, :3] = cur
    return Image.fromarray(arr, 'RGBA')


def outline(im, rays=24):
    """Star-shaped silhouette polygon from the alpha mask (atlas.json outline format:
    points as [x, y] fractions of the rect, origin top-left)."""
    a = np.array(im)[:, :, 3] > 0
    ys, xs = np.where(a)
    if not len(xs):
        return [[0, 0], [1, 0], [1, 1], [0, 1]]
    h, w = a.shape
    cx, cy = xs.mean(), ys.mean()
    pts = []
    for i in range(rays):
        ang = 2 * np.pi * i / rays
        dx, dy = np.cos(ang), np.sin(ang)
        r = 0.0
        step = 1.0
        while True:
            nx, ny = int(round(cx + dx * (r + step))), int(round(cy + dy * (r + step)))
            if nx < 0 or ny < 0 or nx >= w or ny >= h or not a[ny, nx]:
                break
            r += step
        px, py = cx + dx * r, cy + dy * r
        pts.append([round(px / w, 4), round(py / h, 4)])
    return pts


def tone(im):
    """Representative tone: median RGB of opaque pixels."""
    arr = np.array(im)
    m = arr[:, :, 3] > 128
    med = np.median(arr[:, :, :3][m], axis=0)
    return '#%02X%02X%02X' % tuple(int(v) for v in med)


def main():
    atlas = Image.open(ATLAS).convert('RGBA')
    assert atlas.size == (4096, 4096), atlas.size
    data = json.load(open(JSON))
    assert data['size'] == [4096, 4096]
    sprites = data['sprites']

    # assert the planned rects do not overlap any existing sprite rect
    for name, rect in PLAN.items():
        x, y, w, h = rect
        assert 0 <= x and 0 <= y and x + w <= 4096 and y + h <= 4096, name
        for k, v in sprites.items():
            rx, ry, rw, rh = v['rect']
            if not (x + w <= rx or rx + rw <= x or y + h <= ry or ry + rh <= y):
                raise SystemExit(f'overlap: {name} {rect} hits {k} {v["rect"]}')
    for a_name, a_rect in PLAN.items():
        for b_name, b_rect in PLAN.items():
            if a_name >= b_name:
                continue
            ax, ay, aw, ah = a_rect
            bx, by, bw, bh = b_rect
            assert ax + aw <= bx or bx + bw <= ax or ay + ah <= by or by + bh <= ay, (a_name, b_name)

    for name, rect in PLAN.items():
        x, y, w, h = rect
        fitted = bleed(DRAW[name](w, h))
        atlas.paste(fitted, (x, y), fitted)
        sprites[name] = {
            'rect': [x, y, w, h],
            'outline': outline(fitted),
            'aspect': round(w / h, 4),
            'kind': 'building',
            'tone': tone(fitted),
        }
        print('placed', name, rect, 'aspect', round(w / h, 3), 'tone', sprites[name]['tone'])

    atlas.save(ATLAS, 'WEBP', quality=90, method=6)
    # atlas.json is one compact line; keep it that way
    with open(JSON, 'w') as f:
        f.write(json.dumps(data, separators=(',', ':')))
    print('atlas.webp + atlas.json written,', len(sprites), 'sprites total')


if __name__ == '__main__':
    main()
