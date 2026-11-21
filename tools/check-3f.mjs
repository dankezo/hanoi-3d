// Phase 3F-05 check: custom paper-silhouette minimap icons (3F-05..3F-10).
// Run: node tools/check-3f.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
// Covers: sheet PNG + JSON rects (11 filled + 11 outline, 32x32 each), real
// pixel counts per icon (decoded from the PNG with node:zlib, no dependency),
// loader + fallback discs + traveller pin + north arrow + tap-to-locate in
// src/game/landmarks.js, pointer + highlight CSS in index.html, solver 95/96,
// and no off-the-shelf icon library as the main source.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { OPTIONS } from '../src/world/tiles.js';
import { LANDMARKS } from '../src/game/landmarks.js';

let fail = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (!ok) fail++;
};
const has = (src, re, msg) => check(re.test(src), msg);
const noLongDash = (src, name) => check(!/[\u2013\u2014]/.test(src), 'no long dash in ' + name);

// ---- 1. PNG decode (8-bit RGBA only; that is what build-minimap-icons.py writes) ----
function decodePNG(buf) {
  check(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'minimap_icons.png has a PNG signature');
  let off = 8; let w = 0; let h = 0; let bitDepth = 0; let colorType = 0; const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  check(bitDepth === 8 && colorType === 6, 'minimap_icons.png is 8-bit RGBA (bitDepth ' + bitDepth + ', colorType ' + colorType + ')');
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4; const stride = w * bpp;
  const px = Buffer.alloc(w * h * bpp);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    const row = raw.subarray(p, p + stride); p += stride;
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    const out = px.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = i >= bpp && prev ? prev[i - bpp] : 0;
      let v = row[i];
      if (f === 1) v = (v + a) & 255;
      else if (f === 2) v = (v + b) & 255;
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) { const pp = a + b - c; const pa = Math.abs(pp - a); const pb = Math.abs(pp - b); const pc = Math.abs(pp - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
      out[i] = v;
    }
  }
  return { w, h, px, bpp };
}
const near = (r, g, b, c, tol) => Math.abs(r - c[0]) <= tol && Math.abs(g - c[1]) <= tol && Math.abs(b - c[2]) <= tol;
const INK = [90, 58, 40]; const TERRA = [185, 96, 63];

// ---- 2. Sheet files ----
const pngPath = new URL('../public/textures/art/minimap_icons.png', import.meta.url);
const jsonPath = new URL('../public/textures/art/minimap_icons.json', import.meta.url);
check(existsSync(pngPath), 'public/textures/art/minimap_icons.png exists');
check(existsSync(jsonPath), 'public/textures/art/minimap_icons.json exists');
const pngBytes = statSync(pngPath).size;
console.log('minimap_icons.png bytes:', pngBytes);
check(pngBytes > 0, 'minimap_icons.png is not empty');
const sheet = decodePNG(readFileSync(pngPath));
const icons = JSON.parse(readFileSync(jsonPath, 'utf8'));
check(sheet.w === 352 && sheet.h === 64, 'sheet is 352x64, got ' + sheet.w + 'x' + sheet.h);
check(JSON.stringify(icons.size) === JSON.stringify([352, 64]), 'minimap_icons.json size is [352, 64], got ' + JSON.stringify(icons.size));

// ---- 3. JSON rects: 11 filled + 11 outline, 32x32, inside, no overlap ----
check(LANDMARKS.length === 11, 'LANDMARKS is 11 (Tran Quoc is the 11th), got ' + LANDMARKS.length);
const IDS = LANDMARKS.map((d) => d.id);
const rects = icons.icons || {};
const overlap = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
const seen = [];
for (const id of IDS) {
  for (const suf of ['', '_outline']) {
    const r = rects['mm_' + id + suf];
    check(!!r, 'minimap_icons.json has mm_' + id + suf);
    if (!r) continue;
    check(r.w === 32 && r.h === 32, 'mm_' + id + suf + ' is 32x32, got ' + r.w + 'x' + r.h);
    check(r.x >= 0 && r.y >= 0 && r.x + r.w <= 352 && r.y + r.h <= 64, 'mm_' + id + suf + ' is inside the sheet');
    let hits = 0;
    for (const o of seen) if (overlap(r, o)) hits++;
    check(hits === 0, 'mm_' + id + suf + ' overlaps 0 other icon rects');
    seen.push(r);
  }
}
check(Object.keys(rects).length === 22, '22 icon rects total (11 filled + 11 outline), got ' + Object.keys(rects).length);

// ---- 4. Real pixels per icon: filled has ink + terra, outline has ink only ----
for (const id of IDS) {
  for (const suf of ['', '_outline']) {
    const r = rects['mm_' + id + suf];
    if (!r) continue;
    let ink = 0; let terra = 0; let opaque = 0;
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const o = (y * sheet.w + x) * 4;
        const a = sheet.px[o + 3];
        if (a < 30) continue;
        opaque++;
        if (near(sheet.px[o], sheet.px[o + 1], sheet.px[o + 2], INK, 40)) ink++;
        else if (near(sheet.px[o], sheet.px[o + 1], sheet.px[o + 2], TERRA, 40)) terra++;
      }
    }
    if (suf === '') {
      check(ink >= 50 && terra >= 20 && opaque >= 100, 'mm_' + id + ' filled: ink ' + ink + ' + terra ' + terra + ' (opaque ' + opaque + ')');
    } else {
      check(ink >= 50 && terra === 0 && opaque >= 50, 'mm_' + id + '_outline: ink ' + ink + ', terra ' + terra + ' (outline only, opaque ' + opaque + ')');
    }
  }
}

// ---- 5. landmarks.js: loader, glyph draw, fallback, pin, north arrow, tap ----
const lmSrc = readFileSync(new URL('../src/game/landmarks.js', import.meta.url), 'utf8');
has(lmSrc, /MM_ICON_URL = 'textures\/art\/minimap_icons'/, 'landmarks.js points the loader at minimap_icons');
has(lmSrc, /fetch\(base \+ MM_ICON_URL \+ '\.json'\)/, 'landmarks.js fetches minimap_icons.json');
has(lmSrc, /img\.onload = \(\) => \{ iconTable = table; iconImg = img; drawMinimap\(\); \}/, 'landmarks.js sets the icon sheet on image load and redraws');
has(lmSrc, /img\.onerror = \(\) => \{ iconImg = null; iconTable = null; \}/, 'landmarks.js clears the sheet on image error (fallback stays)');
has(lmSrc, /drawIconGlyph\('mm_' \+ def\.id \+ \(done \? '' : '_outline'\), x, y\)/, 'drawMinimap draws filled icon when discovered, outline row when not');
has(lmSrc, /mapCtx\.drawImage\(iconImg, r\[0\], r\[1\], r\[2\], r\[3\]/, 'drawIconGlyph draws the sheet rect with drawImage');
has(lmSrc, /mapCtx\.arc\(x, y, 6, 0, Math\.PI \* 2\)/, '3F-08 numbered-disc fallback is still drawn when the sheet is missing');
has(lmSrc, /fillText\(String\(i \+ 1\), x, y \+ 0\.5\)/, 'fallback disc still numbers landmarks 1-11 in checklist order');
has(lmSrc, /mapCtx\.arc\(px, py, 3\.5, 0, Math\.PI \* 2\)/, 'traveller pin is r=3.5 (was 2.6)');
has(lmSrc, /fillText\('N', nx, 17\)/, 'north arrow N is drawn on the minimap');
has(lmSrc, /mapEl\.addEventListener\('pointerup', onMapUp\)/, 'minimap has its own pointerup tap handler');
has(lmSrc, /e\.stopPropagation\(\);/, 'minimap tap stops propagation (never reaches the canvas walk handler)');
has(lmSrc, /e\.target\.closest\('#lm-map'\)/, 'canvas tap handler ignores #lm-map targets');
has(lmSrc, /if \(seen\[best\.id\]\) showInfo\(best\.id\);/, 'minimap tap opens the info card for a discovered landmark');
has(lmSrc, /else showLocateToast\(best\)/, 'minimap tap toasts for an undiscovered landmark');
has(lmSrc, /'Chua kham pha - di toi do'/, 'undiscovered toast says "Chua kham pha - di toi do"');
has(lmSrc, /highlightChecklist\(best\.id\)/, 'minimap tap highlights the checklist item');
has(lmSrc, /li\.classList\.add\('locate'\)/, 'highlight adds the locate class');
check(!/maki|font-?awesome|material.symbols|material-symbols/i.test(lmSrc), 'landmarks.js uses no off-the-shelf icon library');
has(lmSrc, /STORE_PREFIX = 'hanoi:v1:'/, 'store key is still hanoi:v1:');
has(lmSrc, /const RADIUS = 1;/, 'discovery radius is still 1');
noLongDash(lmSrc, 'landmarks.js');

// ---- 6. index.html: minimap is tappable, highlight style, no keyframes ----
const htmlSrc = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
has(htmlSrc, /#lm-map \{[^}]*pointer-events: auto; cursor: pointer;/, '#lm-map has pointer-events auto + cursor pointer');
has(htmlSrc, /#lm-items li\.locate \{ outline: 2px solid #b9603f;/, '#lm-items li.locate highlight style exists');
check(!/@keyframes/.test(htmlSrc), 'no @keyframes in index.html');
noLongDash(htmlSrc, 'index.html');

// ---- 7. Solver untouched ----
check(OPTIONS.length === 95, 'solver options ' + OPTIONS.length + ' (expected 95, cap 96)');
check(OPTIONS.length <= 96, 'solver options ' + OPTIONS.length + ' <= 96 (cap)');

// ---- 8. Builder script is re-runnable and matches the sheet ----
const buildSrc = readFileSync(new URL('../tools/step5/build-minimap-icons.py', import.meta.url), 'utf8');
has(buildSrc, /IDS = \['hoankiem', 'ngocson', 'westlake', 'tranquoc', 'oldquarter',/, 'build-minimap-icons.py draws the same 11 ids in checklist order');
check(JSON.stringify(IDS) === JSON.stringify(['hoankiem', 'ngocson', 'westlake', 'tranquoc', 'oldquarter', 'mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien']), 'icon ids match the checklist order exactly');
noLongDash(buildSrc, 'build-minimap-icons.py');

console.log(fail === 0 ? 'ALL 3F CHECKS PASSED' : fail + ' CHECK(S) FAILED');
process.exit(fail === 0 ? 0 : 1);
