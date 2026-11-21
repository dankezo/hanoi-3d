"""Phase 3F-05: draw the 11 custom paper-silhouette minimap icons.

Each landmark gets one 32x32 icon in ink + terracotta on transparent paper,
in the same palette as the atlas (INK #5a3a28, TERRA #b9603f, PAPER #efe0c2).
Two rows are baked into one sheet so the game can swap glyphs without
changing draw code:
  row 0 (y 0..31): filled icons, for discovered landmarks.
  row 1 (y 32..63): outline-only icons (same shapes, ink stroke, no fill,
  alpha 170), for undiscovered landmarks.
Sheet: 352x64 PNG + minimap_icons.json with one 32x32 rect per icon, keyed
"mm_<landmark id>" and "mm_<id>_outline" (same shape as game_icons.json,
so the loader in src/game/landmarks.js parses it like atlasmap.js does).

Icons are drawn from scratch with PIL geometry only (rects, polygons, arcs),
never cropped from the hero sprites: a 179-432px sprite downscaled to 10px
on the minimap would be unreadable. Every shape is chunky (min feature
about 3px) so it still reads at the 14px draw size on the 168px minimap.
No long dashes in this file.
Run: python3 tools/step5/build-minimap-icons.py (from the repo root).
"""
import json
import math
from PIL import Image, ImageDraw

PNG = 'public/textures/art/minimap_icons.png'
JSON = 'public/textures/art/minimap_icons.json'
CELL = 32
IDS = ['hoankiem', 'ngocson', 'westlake', 'tranquoc', 'oldquarter',
       'mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien']

INK = (90, 58, 40, 255)
INK_DIM = (90, 58, 40, 170)
TERRA = (185, 96, 63, 255)
PAPER = (239, 224, 194, 255)


class Pen:
    """One icon tile. In fill mode shapes are solid ink/terra with paper
    cutouts (doors, windows, arches). In outline mode the same shapes are
    drawn as ink strokes only, so an undiscovered icon reads as a faint
    outline of the same landmark."""

    def __init__(self, draw, fill):
        self.d = draw
        self.fill = fill
        self.ink = INK if fill else None
        self.terra = TERRA if fill else None
        self.line = INK if fill else INK_DIM
        self.w = 1 if fill else 2

    def rect(self, box, kind='ink'):
        if self.fill:
            self.d.rectangle(box, fill=INK if kind == 'ink' else TERRA)
        else:
            self.d.rectangle(box, outline=self.line, width=2)

    def poly(self, pts, kind='ink'):
        if self.fill:
            self.d.polygon(pts, fill=INK if kind == 'ink' else TERRA)
        else:
            self.d.polygon(pts, outline=self.line, width=2)

    def cut(self, box):
        """Paper cutout (door, window, arch). Only visible in fill mode."""
        if self.fill:
            self.d.rectangle(box, fill=PAPER)

    def arc(self, box, a0, a1, kind='ink'):
        self.d.arc(box, a0, a1, fill=self.line if not self.fill else (INK if kind == 'ink' else TERRA), width=2)

    def hline(self, y, x0, x1, kind='ink'):
        self.d.line([(x0, y), (x1, y)], fill=self.line if not self.fill else (INK if kind == 'ink' else TERRA), width=2)

    def vline(self, x, y0, y1, kind='ink'):
        self.d.line([(x, y0), (x, y1)], fill=self.line if not self.fill else (INK if kind == 'ink' else TERRA), width=2)


def icon_hoankiem(p):
    """Turtle Tower: 3 stacked tiers + spire cap, on a water line."""
    p.rect([6, 20, 26, 27])
    p.rect([9, 14, 23, 20])
    p.rect([12, 8, 20, 14])
    p.rect([11, 6, 21, 8], 'terra')
    p.vline(16, 3, 6)
    p.cut([14, 23, 18, 27])
    p.hline(29, 4, 28, 'terra')


def icon_ngocson(p):
    """Ngoc Son Temple: light curved roof band over a pillared hall, with a
    paper gap between roof and hall so the small icon never reads as one
    dark block. Roof is a thin band (not a solid slab); hall is narrow with
    slim terracotta pillars and a paper door."""
    # thin curved roof band: gentle rise, 2-3px thick, upturned tips
    p.poly([(3, 11), (8, 6), (16, 8), (24, 6), (29, 11), (24, 9), (16, 11), (8, 9)])
    # paper gap y 12..15, then the hall
    p.rect([10, 16, 22, 27])
    p.rect([8, 16, 10, 27], 'terra')
    p.rect([22, 16, 24, 27], 'terra')
    p.cut([14, 20, 18, 27])


def icon_westlake(p):
    """West Lake: one BIG lotus (3 wide terracotta petals filling the top
    half) over 3 straight horizontal wave lines. No small arcs: at 14px the
    old petals + arcs collapsed into one unreadable tuft."""
    p.poly([(16, 2), (10, 17), (22, 17)], 'terra')
    p.poly([(11, 5), (4, 17), (12, 16)], 'terra')
    p.poly([(21, 5), (28, 17), (20, 16)], 'terra')
    p.hline(21, 3, 29)
    p.hline(25, 6, 26)
    p.hline(28, 9, 23)


def icon_tranquoc(p):
    """Tran Quoc: tall 11-tier tower - narrow body, 6 eave slabs that widen
    toward the base, spire on top. 6 slabs stand in for 11 tiers at 32px:
    11 one-pixel lines would vanish at the 14px draw size."""
    p.poly([(16, 2), (13, 8), (19, 8)])
    p.rect([13, 8, 19, 28])
    for i, y in enumerate([9, 13, 17, 21, 25, 28]):
        w = 5 + i
        p.rect([16 - w, y, 16 + w, y + 1], 'terra')


def icon_oldquarter(p):
    """Tube house: tall narrow house, pitched roof, 3 windows, shop door."""
    p.poly([(9, 10), (16, 5), (23, 10)], 'terra')
    p.rect([10, 10, 22, 28])
    p.cut([12, 13, 15, 16])
    p.cut([17, 13, 20, 16])
    p.cut([12, 19, 15, 22])
    p.cut([17, 19, 20, 27])


def icon_mausoleum(p):
    """Mausoleum: stepped granite block + flag pole with red flag."""
    p.rect([10, 10, 22, 22])
    p.rect([7, 22, 25, 25], 'terra')
    p.rect([4, 25, 28, 28])
    p.vline(25, 4, 22)
    p.poly([(25, 4), (31, 7), (25, 10)], 'terra')


def icon_vanmieu(p):
    """Temple of Literature: gate with 2 pillars, beam and curved roof."""
    p.poly([(5, 10), (10, 4), (16, 7), (22, 4), (27, 10)], 'terra')
    p.rect([6, 10, 26, 13])
    p.rect([7, 13, 10, 28])
    p.rect([22, 13, 25, 28])
    p.cut([13, 17, 19, 28])


def icon_onepillar(p):
    """One Pillar Pagoda: small temple on one central pillar, stone base."""
    p.poly([(8, 10), (16, 4), (24, 10)], 'terra')
    p.rect([10, 10, 22, 15])
    p.cut([14, 11, 18, 15])
    p.rect([15, 15, 17, 26])
    p.rect([10, 26, 22, 28], 'terra')


def icon_cathedral(p):
    """St Joseph Cathedral: 2 spired towers + centre gable + arched door."""
    p.rect([5, 9, 11, 26])
    p.poly([(5, 9), (8, 2), (11, 9)], 'terra')
    p.rect([21, 9, 27, 26])
    p.poly([(21, 9), (24, 2), (27, 9)], 'terra')
    p.rect([11, 14, 21, 26])
    p.poly([(11, 14), (16, 9), (21, 14)])
    p.cut([14, 19, 18, 26])


def icon_opera(p):
    """Opera House: wide facade with a TALL centre arch (reads as the grand
    entrance) flanked by 2 shorter arches, standing ink columns between
    them, and a terracotta pediment on top. No edge detail: the old even
    arches read as any wide house."""
    p.rect([4, 12, 28, 28])
    p.poly([(10, 12), (16, 4), (22, 12)], 'terra')
    p.rect([4, 11, 28, 13], 'terra')
    p.cut([14, 14, 18, 28])
    p.cut([7, 19, 11, 28])
    p.cut([21, 19, 25, 28])
    if not p.fill:
        # cutouts are invisible in outline mode: draw the 3 arches as strokes
        p.d.rectangle([14, 14, 18, 28], outline=p.line, width=1)
        for x0 in (7, 21):
            p.d.rectangle([x0, 19, x0 + 4, 28], outline=p.line, width=1)


def icon_longbien(p):
    """Long Bien Bridge: steel truss over the deck, 2 piers, water line."""
    p.hline(12, 2, 30)
    p.hline(20, 2, 30)
    for x0 in (2, 10, 18, 26):
        p.d.line([(x0, 20), (x0 + 4, 12)], fill=p.line, width=2)
        p.d.line([(x0 + 4, 12), (x0 + 8, 20)], fill=p.line, width=2)
    p.rect([8, 20, 10, 27])
    p.rect([22, 20, 24, 27])
    p.arc([4, 26, 14, 32], 180, 360, 'terra')
    p.arc([18, 26, 28, 32], 180, 360, 'terra')


DRAW = {
    'hoankiem': icon_hoankiem,
    'ngocson': icon_ngocson,
    'westlake': icon_westlake,
    'tranquoc': icon_tranquoc,
    'oldquarter': icon_oldquarter,
    'mausoleum': icon_mausoleum,
    'vanmieu': icon_vanmieu,
    'onepillar': icon_onepillar,
    'cathedral': icon_cathedral,
    'opera': icon_opera,
    'longbien': icon_longbien,
}


def main():
    sheet = Image.new('RGBA', (CELL * len(IDS), CELL * 2), (0, 0, 0, 0))
    rects = {}
    for col, lid in enumerate(IDS):
        for row, fill in enumerate((True, False)):
            tile = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            DRAW[lid](Pen(ImageDraw.Draw(tile), fill))
            # N1 fix: paste WITHOUT the tile as its own mask. Pasting with
            # the tile as mask applies its alpha twice, so an outline drawn
            # at alpha 170 landed on the sheet at alpha 113. Without the
            # mask the tile RGBA copies verbatim (the sheet starts fully
            # transparent, so nothing underneath needs preserving).
            sheet.paste(tile, (col * CELL, row * CELL))
            key = 'mm_' + lid + ('' if fill else '_outline')
            rects[key] = {'x': col * CELL, 'y': row * CELL, 'w': CELL, 'h': CELL}
    sheet.save(PNG, 'PNG', optimize=True)
    with open(JSON, 'w') as f:
        json.dump({'size': [CELL * len(IDS), CELL * 2], 'icons': rects}, f, indent=1)
        f.write('\n')
    print('wrote', PNG, sheet.size, 'icons:', len(rects))


if __name__ == '__main__':
    main()
