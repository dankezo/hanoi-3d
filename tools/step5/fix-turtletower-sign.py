"""Phase 3B fix round (F1): put the "Quy Son Thap" name on tier 3 of the
Turtle Tower hero sprite.

Option (a) from the fix task: draw into the existing hanoi_turtletower sprite
(rect [16, 2600, 179, 302] in public/textures/art/atlas.webp). No new flap:
a flap board would sit behind the hero art card in the GLB and never show,
and the flat-colour recipe placeholder cannot render letters at all, so the
sprite is the only place the name can be seen in-game.

Why a small paper board behind the letters: the tier-3 wall is only a thin
grey strip (y 84..92) above the three arch tops, and bare 10-11 px letters
there overflow the wall and cross the roof eave line (tried on a copy first,
rejected). A paper board (x 44..135, y 84..98) hangs under the eave like a
carved name tablet and the 9 px serif letters read clearly inside it.

Only pixels inside the turtletower rect change. atlas.json is untouched (the
rect, outline and tone stay valid). The atlas is re-saved at the same
WEBP quality 90 / method 6 as tools/step5/build-atlas.py, so the file size
moves only a little; update TEXTURE_BYTES_FALLBACK in src/assets/loader.js
to the new real size after running this.
No long dashes in this file.
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

ATLAS = 'public/textures/art/atlas.webp'
JSON = 'public/textures/art/atlas.json'
SERIF_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

RECT = [16, 2600, 179, 302]
BOARD = (44, 84, 135, 98)
PAPER = (239, 224, 194, 255)
INK = (90, 58, 40, 255)


def main():
    atlas = Image.open(ATLAS).convert('RGBA')
    assert atlas.size == (4096, 4096), atlas.size
    data = json.load(open(JSON))
    assert data['sprites']['hanoi_turtletower']['rect'] == RECT, \
        data['sprites']['hanoi_turtletower']['rect']
    old_bytes = os.path.getsize(ATLAS)

    x0, y0, w, h = RECT
    crop = atlas.crop((x0, y0, x0 + w, y0 + h))
    # Keep a before crop in /tmp for the eye check in the manifest.
    crop.save('/tmp/turtletower-before.png')
    d = ImageDraw.Draw(crop)
    d.rectangle(BOARD, fill=PAPER, outline=INK, width=1)
    font = ImageFont.truetype(SERIF_BOLD, 9)
    bb = d.textbbox((0, 0), 'QUY SON THAP', font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    assert tw <= BOARD[2] - BOARD[0] - 8, tw
    assert th <= BOARD[3] - BOARD[1] - 2, th
    d.text(((BOARD[0] + BOARD[2] - tw) / 2 - bb[0],
            BOARD[1] + (BOARD[3] - BOARD[1] - th) / 2 - bb[1]),
           'QUY SON THAP', font=font, fill=INK)
    atlas.paste(crop, (x0, y0))
    atlas.save(ATLAS, 'WEBP', quality=90, method=6)
    new_bytes = os.path.getsize(ATLAS)
    crop.save('/tmp/turtletower-after.png')
    print('turtletower sign drawn on tier 3, rect', RECT)
    print('atlas.webp bytes:', old_bytes, '->', new_bytes,
          '(delta %+d)' % (new_bytes - old_bytes))
    print('before/after crops: /tmp/turtletower-before.png, /tmp/turtletower-after.png')


if __name__ == '__main__':
    main()
