"""Split the two generated sprite sheets into cells, key out the card background, save RGBA sprites."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import json, os

OUT = 'tools/step5/sprites'
os.makedirs(OUT, exist_ok=True)

CELLS = {
 'sheet-a': ['turtletower', 'ngocson', 'thehuc', 'tranquoc', 'tubehouse', None],
 'sheet-b': ['mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien'],
}
FILES = {
 'sheet-a': 'tools/step5/raw/media-generation-hanoi-sprites-sheet-a-0-b191b471-79cd-4527-98cf-06b26a9a3f7e.png',
 'sheet-b': 'tools/step5/raw/media-generation-hanoi-sprites-sheet-b-0-ef1aa705-2491-4868-b1a0-73a498bcdfa1.png',
}

def bleed(rgb, alpha):
    """Dilate opaque RGB colours into transparent pixels (for mipmap fringing)."""
    a = alpha > 0
    base = rgb.copy()
    cur = rgb.copy()
    for _ in range(10):
        m = Image.fromarray(cur).filter(ImageFilter.MaxFilter(3))
        m = np.array(m)
        nxt = np.where(a[:, :, None], base, m)
        if np.array_equal(nxt, cur):
            break
        cur = nxt
    return cur

report = {}
for sheet, names in CELLS.items():
    im = np.array(Image.open(FILES[sheet]).convert('RGB')).astype(np.float32)
    for idx, name in enumerate(names):
        if not name:
            continue
        cx, cy = idx % 3, idx // 3
        cell = im[cy*640:(cy+1)*640, cx*640:(cx+1)*640]
        # 1. find the card rectangle: cream pixels (B clearly below white, R/G high)
        cream = (cell[:, :, 2] < 250) & (cell[:, :, 0] > 240) & (cell[:, :, 1] > 240)
        lab, n = ndimage.label(cream)
        sizes = ndimage.sum_labels(np.ones_like(lab), lab, range(1, n+1))
        big = int(np.argmax(sizes)) + 1
        ys, xs = np.where(lab == big)
        cy0, cy1, cx0, cx1 = ys.min()+3, ys.max()-3, xs.min()+3, xs.max()-3
        crop = cell[cy0:cy1+1, cx0:cx1+1]
        # 2. key: bg = modal colour of the crop
        q = (crop // 8).astype(np.int32)
        keys = (q[:, :, 0]*65536 + q[:, :, 1]*256 + q[:, :, 2]).ravel()
        vals, counts = np.unique(keys, return_counts=True)
        k = vals[np.argmax(counts)]
        bg = np.array([(k>>16)&255, (k>>8)&255, k&255], dtype=np.float32)*8+4
        dist = np.sqrt(((crop-bg)**2).sum(2))
        alpha = np.clip((dist-12.0)/30.0, 0, 1)
        # drop the card's own border line: a near-full-height/width straight run hugging the mask bbox edge
        m0 = alpha > 0.05
        ys0, xs0 = np.where(m0)
        if len(ys0):
            y0b, y1b, x0b, x1b = ys0.min(), ys0.max(), xs0.min(), xs0.max()
            def longest_run(v):
                best = cur = 0
                for t in v:
                    cur = cur + 1 if t else 0
                    best = max(best, cur)
                return best
            for x in list(range(x0b, min(x0b+12, m0.shape[1]))) + list(range(max(x1b-11, 0), x1b+1)):
                if longest_run(m0[:, x]) > 300:
                    alpha[:, x] = 0
            for y in list(range(y0b, min(y0b+12, m0.shape[0]))) + list(range(max(y1b-11, 0), y1b+1)):
                if longest_run(m0[y, :]) > 300:
                    alpha[y, :] = 0
        # 3. keep illustration components (drop specks)
        lab2, n2 = ndimage.label(alpha > 0.5)
        sizes2 = ndimage.sum_labels(np.ones_like(lab2), lab2, range(1, n2+1)) if n2 else []
        keep = np.zeros_like(alpha, dtype=bool)
        for i, s in enumerate(sizes2):
            if s > 300:
                keep |= lab2 == (i+1)
        # dilate the keep mask by 2 px so AA edges survive
        keep = ndimage.binary_dilation(keep, iterations=2)
        alpha = np.where(keep, alpha, 0)
        # 4. trim + bleed + save
        ys, xs = np.where(alpha > 0.05)
        y0, y1, x0, x1 = max(0, ys.min()-4), min(alpha.shape[0], ys.max()+5), max(0, xs.min()-4), min(alpha.shape[1], xs.max()+5)
        rgb = crop[y0:y1, x0:x1].astype(np.uint8)
        al = (alpha[y0:y1, x0:x1]*255).astype(np.uint8)
        # strip isolated uniform border lines (card edge) hugging the outer 12 px, then re-trim
        for _ in range(4):
            h, w = al.shape
            hit = False
            for y in list(range(min(12, h))) + list(range(max(0, h-12), h)):
                row = al[y] > 128
                if row.mean() > 0.9 and rgb[y][row][:, :3].astype(np.float32).std() < 8:
                    al[y] = 0; hit = True
            for x in list(range(min(12, w))) + list(range(max(0, w-12), w)):
                col = al[:, x] > 128
                if col.mean() > 0.9 and rgb[:, x][col][:, :3].astype(np.float32).std() < 8:
                    al[:, x] = 0; hit = True
            if not hit:
                break
        ys, xs = np.where(al > 12)
        y0, y1, x0, x1 = max(0, ys.min()-4), min(al.shape[0], ys.max()+5), max(0, xs.min()-4), min(al.shape[1], xs.max()+5)
        rgb, al = rgb[y0:y1, x0:x1], al[y0:y1, x0:x1]
        rgb = bleed(rgb, al)
        Image.fromarray(np.dstack([rgb, al]), 'RGBA').save(f'{OUT}/{name}.png')
        report[name] = {'card': [int(cx0), int(cy0), int(cx1-cx0+1), int(cy1-cy0+1)],
                        'bg': [round(float(v), 1) for v in bg],
                        'size': [int(x1-x0), int(y1-y0)],
                        'opaque_frac': round(float((al > 242).mean()), 3)}
        print(name, report[name])
json.dump(report, open(f'{OUT}/report.json', 'w'), indent=1)

# contact sheet on cream, for visual check
tiles = []
for name in ['turtletower','ngocson','thehuc','tranquoc','tubehouse','mausoleum','vanmieu','onepillar','cathedral','opera','longbien']:
    im = Image.open(f'{OUT}/{name}.png')
    im.thumbnail((300, 300))
    tiles.append((name, im))
W = 300*4
H = 320*3
sheet = Image.new('RGB', (W, H), (251, 246, 234))
from PIL import ImageDraw
d = ImageDraw.Draw(sheet)
for i, (name, im) in enumerate(tiles):
    x, y = (i % 4)*300, (i // 4)*320
    sheet.paste(im, (x + (300-im.width)//2, y + 10), im)
    d.text((x+8, y+292), name, fill=(40, 30, 20))
sheet.save(f'{OUT}/contact.png')
print('contact sheet saved')
