"""Step 5 (a): composite the 11 Hanoi hero sprites into public/textures/art/atlas.webp
and add their entries to public/textures/art/atlas.json.

Layout: free zone below y=2578 (max extent of the 183 existing sprites). Two rows,
16 px gutters, rect sizes = hero flap world size x 288 px/unit (see build-hanoi-glb.mjs).
Each sprite is fitted into its rect: cover-fit crop around a focus point (the building),
except tubehouse which is contain-fit (tall narrow house) with colour-bled padding.
Existing sprite rects are never touched; the script asserts no overlap.
atlas.json is a single compact line; the rewrite preserves that format.
No long dashes in this file.
"""
import json
import numpy as np
from PIL import Image, ImageFilter

ATLAS = 'public/textures/art/atlas.webp'
JSON = 'public/textures/art/atlas.json'
SPRITES_DIR = 'tools/step5/sprites'

# name -> (rect [x, y, w, h], fit, focus (fx, fy) for cover-fit)
PLAN = {
    'turtletower': ([16, 2600, 179, 302], 'cover', (0.5, 0.42)),
    'ngocson': ([211, 2600, 331, 274], 'cover', (0.5, 0.5)),
    'thehuc': ([558, 2600, 432, 158], 'cover', (0.5, 0.32)),
    'tranquoc': ([1006, 2600, 202, 374], 'cover', (0.5, 0.5)),
    'tubehouse': ([1224, 2600, 173, 288], 'contain', (0.5, 0.5)),
    'mausoleum': ([16, 2990, 302, 288], 'cover', (0.5, 0.5)),
    'vanmieu': ([334, 2990, 331, 302], 'cover', (0.5, 0.5)),
    'onepillar': ([681, 2990, 207, 331], 'cover', (0.5, 0.45)),
    'cathedral': ([904, 2990, 360, 389], 'cover', (0.5, 0.5)),
    'opera': ([1280, 2990, 360, 259], 'cover', (0.5, 0.45)),
    'longbien': ([1656, 2990, 432, 202], 'cover', (0.5, 0.5)),
}


def fit_sprite(im, w, h, mode, focus):
    """Fit an RGBA sprite into a w x h rect. Returns an RGBA image of exactly w x h."""
    sw, sh = im.size
    if mode == 'cover':
        scale = max(w / sw, h / sh)
        nw, nh = round(sw * scale), round(sh * scale)
        im2 = im.resize((nw, nh), Image.LANCZOS)
        fx, fy = focus
        cx = min(max(int(fx * nw - w / 2), 0), nw - w)
        cy = min(max(int(fy * nh - h / 2), 0), nh - h)
        return im2.crop((cx, cy, cx + w, cy + h))
    # contain: scale to fit, centre, transparent padding
    scale = min(w / sw, h / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    im2 = im.resize((nw, nh), Image.LANCZOS)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(im2, ((w - nw) // 2, (h - nh) // 2), im2)
    return out


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
        # march outward until leaving the silhouette
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
    for name, (rect, _mode, _f) in PLAN.items():
        x, y, w, h = rect
        assert 0 <= x and 0 <= y and x + w <= 4096 and y + h <= 4096, name
        for k, v in sprites.items():
            rx, ry, rw, rh = v['rect']
            if not (x + w <= rx or rx + rw <= x or y + h <= ry or ry + rh <= y):
                raise SystemExit(f'overlap: {name} {rect} hits {k} {v["rect"]}')
    for a_name, (a_rect, _m, _f) in PLAN.items():
        for b_name, (b_rect, _m2, _f2) in PLAN.items():
            if a_name >= b_name:
                continue
            ax, ay, aw, ah = a_rect
            bx, by, bw, bh = b_rect
            assert ax + aw <= bx or bx + bw <= ax or ay + ah <= by or by + bh <= ay, (a_name, b_name)

    for name, (rect, mode, focus) in PLAN.items():
        x, y, w, h = rect
        im = Image.open(f'{SPRITES_DIR}/{name}.png').convert('RGBA')
        fitted = fit_sprite(im, w, h, mode, focus)
        fitted = bleed(fitted)
        atlas.paste(fitted, (x, y), fitted)
        sprites['hanoi_' + name] = {
            'rect': [x, y, w, h],
            'outline': outline(fitted),
            'aspect': round(w / h, 4),
            'kind': 'landmark',
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
