"""Phase 3A fix round: draw the 6 sign-text sprites (flat cut-paper style, PIL)
and composite them into public/textures/art/atlas.webp + atlas.json.

The 3A signs were flat-colour flaps with no lettering, so "BIA PHO CO" and the
other board texts existed only in code comments. Each sprite here is the face
of one board, drawn at exactly its atlas rect size (288 px per world unit,
same as tools/step5/build-atlas.py), so the hero art card in
tools/step5/build-hanoi-glb.mjs shows the text on the board flap.

Layout: free strip at y=2990, x from 2104 (16 px past the longbien sprite,
which ends at x=2088; the basic row starts at y=3395). 16 px gutters.
Existing sprite rects are never touched; the script asserts no overlap.
atlas.json is a single compact line; the rewrite preserves that format.
No long dashes in this file.
"""
import json
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ATLAS = 'public/textures/art/atlas.webp'
JSON = 'public/textures/art/atlas.json'
SANS_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
SERIF_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

# sprite key -> rect [x, y, w, h] (keep in sync with tools/step5/build-hanoi-glb.mjs SPRITES)
PLAN = {
    'sign_biaphoco': [2104, 2990, 173, 274],
    'sign_biahoi': [2293, 2990, 173, 274],
    'sign_trucbach': [2482, 2990, 173, 274],
    'sign_paramount': [2671, 2990, 173, 274],
    'sign_banner304': [2860, 2990, 72, 202],
    'sign_pho': [2948, 2990, 98, 52],
}

MUSTARD = (220, 168, 72, 255)
TERRA = (185, 96, 63, 255)
PAPER = (239, 224, 194, 255)
ROSE = (201, 131, 116, 255)
INK = (90, 58, 40, 255)
RUST = (178, 90, 59, 255)
GOLD = (255, 196, 90, 255)
CREAM = (251, 246, 234, 255)


def fit_size(draw, lines, font_path, max_w, start):
    """Largest bold size (down to 12) at which every line fits max_w."""
    for size in range(start, 11, -1):
        font = ImageFont.truetype(font_path, size)
        if all(draw.textlength(line, font=font) <= max_w for line in lines):
            return size
    return 12


def draw_board(w, h, bg, lines, fg, font_path=SANS_BOLD):
    """Lamp-board face: only the head box (top 18% of the flap) is painted;
    the rest stays transparent so the flat board flap behind shows through.
    The hero card maps this sprite over the whole lamp shape, so the head box
    must sit in the top 18% of the sprite, matching the lamp head (y0 = 0.82h)."""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    band = int(round(h * 0.18))
    d.rectangle([0, 0, w - 1, band - 1], fill=bg)
    size = fit_size(d, lines, font_path, w - 8, 30)
    # shrink further until all lines fit INSIDE the band: text spilling past
    # the band would float over the board post instead of sitting on the sign.
    lh = size + 3
    while size > 12 and lh * len(lines) - 3 > band - 4:
        size -= 1
        lh = size + 3
    font = ImageFont.truetype(font_path, size)
    total = lh * len(lines) - 3
    y = max(0, (band - total) // 2)
    for line in lines:
        tw = d.textlength(line, font=font)
        d.text(((w - tw) / 2, y), line, font=font, fill=fg)
        y += lh
    return im


def star_points(cx, cy, r_out, r_in):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def draw_banner(w, h):
    """Vertical red banner face: full red ground, small yellow star at the top
    (the mustard dormer emblem the hero card covers), '30-4' in yellow
    running bottom-to-top down the banner."""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], fill=TERRA)
    d.polygon(star_points(w / 2, 26, 13, 5), fill=GOLD)
    tmp = Image.new('RGBA', (200, 60), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    font = ImageFont.truetype(SANS_BOLD, 40)
    td.text((10, 8), '30-4', font=font, fill=GOLD)
    tmp = tmp.rotate(90, expand=True)
    # crop to the glyphs: the rotated blank canvas is taller than the text,
    # and pasting it whole would clip the bottom of the text off the banner.
    bbox = tmp.getbbox()
    if bbox:
        tmp = tmp.crop(bbox)
    top = 44  # clear of the star (ends at y 39)
    avail = h - top
    im.paste(tmp, ((w - tmp.width) // 2, top + (avail - tmp.height) // 2), tmp)
    return im


def draw_pho(w, h):
    """Pho stall sign face: full mustard ground, 'PHO' in rust red."""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], fill=MUSTARD)
    size = fit_size(d, ['PHO'], SANS_BOLD, w - 8, 36)
    font = ImageFont.truetype(SANS_BOLD, size)
    tw = d.textlength('PHO', font=font)
    d.text(((w - tw) / 2, (h - size) // 2 - 2), 'PHO', font=font, fill=RUST)
    return im


DRAW = {
    'sign_biaphoco': lambda w, h: draw_board(w, h, MUSTARD, ['BIA PHO CO'], INK),
    'sign_biahoi': lambda w, h: draw_board(w, h, TERRA, ['BIA HOI', 'HA NOI'], PAPER),
    'sign_trucbach': lambda w, h: draw_board(w, h, PAPER, ['Truc Bach'], INK, SERIF_BOLD),
    'sign_paramount': lambda w, h: draw_board(w, h, ROSE, ['PARAMOUNT', 'BEER'], CREAM),
    'sign_banner304': draw_banner,
    'sign_pho': draw_pho,
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
        sprites['hanoi_' + name] = {
            'rect': [x, y, w, h],
            'outline': outline(fitted),
            'aspect': round(w / h, 4),
            'kind': 'sign',
            'tone': tone(fitted),
        }
        print('placed', name, rect, 'aspect', round(w / h, 3), 'tone', sprites['hanoi_' + name]['tone'])

    atlas.save(ATLAS, 'WEBP', quality=90, method=6)
    # atlas.json is one compact line; keep it that way
    with open(JSON, 'w') as f:
        f.write(json.dumps(data, separators=(',', ':')))
    print('atlas.webp + atlas.json written,', len(sprites), 'sprites total')


if __name__ == '__main__':
    main()
