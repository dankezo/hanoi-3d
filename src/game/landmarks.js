// Landmarks (Step 4, Hanoi mode only; owner: landmarks agent). Contract: src/game/index.js.
//
// Discovery, a bilingual checklist, a toast and a corner minimap - only when the world is the
// static Hanoi page (?map=hanoi). In the WFC world this module is never created, so none of its
// DOM shows: index.html keeps #lm-list, #lm-toast and #lm-map hidden unless body.hanoi.
//
// Discovery: every tick, when the traveller's cell changes (same cell-change condition as the
// progress.explore hook in game/index.js), the 3x3 neighbourhood of the cell is checked against
// the landmark areas (the wfc cell landmarkId) and every anchor is checked within radius 1
// (Chebyshev). Radius 1 matters: onepillar, cathedral and opera tag only their single blocker
// anchor cell, so standing ON them is impossible - only an adjacent cell can trigger. The
// neighbourhood check also covers walking deep inside a large area (West Lake, Old Quarter)
// far from its anchor.
//
// First entry is recorded in a store of its own, localStorage `hanoi:v1:<seed>` with a `visited`
// section, and emits `game:landmark` { id, nameEN, nameVI, count }. The upstream save
// (`popup-atlas:v1:<seed>`) is never read or written here, and the stale upstream `landmarks`
// section is never reused.
// No long dashes in this file: only short hyphens (-).
import { TILE_SIZE } from '../core/config.js';
import { bus } from '../core/events.js';
import { HANOI_LANDMARKS } from '../world/hanoi-map.js';

const STORE_PREFIX = 'hanoi:v1:';
const RADIUS = 1; // cells (Chebyshev): the traveller's cell plus its 8 neighbours
const TOAST_MS = 3400;
const MAP_REDRAW_S = 0.2;
const MAP_CELLS = 40; // the Hanoi page is 40x40, coords -20..19
const MAP_MIN = -20;
// explored-cell tones, same patchwork as the atlas map (src/game/atlasmap.js BIOME_GROUND)
const GROUND = { heartland: '#c3c084', desert: '#e3c68f', snow: '#e7ecef', blossom: '#cdd596', pinewood: '#8fa07a' };
const PAPER = '#efe0c2';
const INK = '#5a3a28';
const TERRA = '#b9603f';

// Bilingual names, display order = the checklist order. Vietnamese is written without diacritics,
// matching the toast wording ("Da kham pha") and the app's plain serif text.
const NAMES = {
  hoankiem: ['Hoan Kiem Lake', 'Ho Hoan Kiem'],
  ngocson: ['Ngoc Son Temple', 'Den Ngoc Son'],
  westlake: ['West Lake', 'Ho Tay'],
  oldquarter: ['Old Quarter', 'Pho Co'],
  mausoleum: ['Ho Chi Minh Mausoleum', 'Lang Chu Tich'],
  vanmieu: ['Temple of Literature', 'Van Mieu'],
  onepillar: ['One Pillar Pagoda', 'Chua Mot Cot'],
  cathedral: ['St. Joseph Cathedral', 'Nha Tho Lon'],
  opera: ['Hanoi Opera House', 'Nha Hat Lon'],
  longbien: ['Long Bien Bridge', 'Cau Long Bien'],
};
const ORDER = ['hoankiem', 'ngocson', 'westlake', 'oldquarter', 'mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien'];

/** [{ id, nameEN, nameVI, cell: [x, z], radius }] - anchors come from the map, the single source of truth. */
export const LANDMARKS = Object.freeze(ORDER.map((id) => {
  const a = HANOI_LANDMARKS[id].anchor;
  return Object.freeze({ id, nameEN: NAMES[id][0], nameVI: NAMES[id][1], cell: Object.freeze([a[0], a[1]]), radius: RADIUS });
}));
export const LANDMARK_COUNT = LANDMARKS.length;
export const LANDMARK_RADIUS = RADIUS;
export const LANDMARK_STORE_PREFIX = STORE_PREFIX;

const BY_ID = {};
for (const d of LANDMARKS) BY_ID[d.id] = d;

export function createLandmarks(ctx) {
  const { traveller, progress, wfc, seed = 0, persist = true } = ctx;
  const KEY = STORE_PREFIX + seed;
  const headless = typeof document === 'undefined';

  // ---- visited store (own key, own section; never the upstream save) --------------------------------
  let seen = {};
  if (persist && !headless) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d.visited === 'object' && d.visited) seen = d.visited;
      }
    } catch { seen = {}; }
  }
  let dirty = false;
  let timer = 0;
  function save() {
    timer = 0;
    if (!persist || !dirty) return;
    dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify({ visited: seen })); } catch { /* quota / private mode */ }
  }
  function touch() { dirty = true; if (persist && !timer) timer = setTimeout(save, 1500); }
  function flush() { if (dirty) save(); }
  const onVis = () => { if (document.hidden) save(); };
  if (persist && !headless) {
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onVis);
  }

  // ---- DOM (elements live in index.html; hidden unless body.hanoi) ------------------------------------
  let listEl = null; let itemsEl = null; let countEl = null; let toastEl = null;
  let toastTitle = null; let toastSub = null; let toastTimer = 0;
  let mapEl = null; let mapCtx = null;
  const itemEls = {};
  if (!headless) {
    document.body.classList.add('hanoi');
    listEl = document.getElementById('lm-list');
    itemsEl = document.getElementById('lm-items');
    countEl = document.getElementById('lm-count');
    toastEl = document.getElementById('lm-toast');
    mapEl = document.getElementById('lm-map');
    if (toastEl) {
      toastTitle = document.createElement('b');
      toastSub = document.createElement('span');
      toastEl.append(toastTitle, toastSub);
    }
    if (mapEl) mapCtx = mapEl.getContext('2d');
    if (itemsEl) {
      for (const def of LANDMARKS) {
        const li = document.createElement('li');
        li.dataset.id = def.id;
        const mk = document.createElement('span');
        mk.className = 'mk';
        mk.textContent = '\u00b7';
        const tx = document.createElement('span');
        tx.className = 'tx';
        tx.textContent = def.nameEN + ' ';
        const vi = document.createElement('i');
        vi.textContent = def.nameVI;
        tx.appendChild(vi);
        li.append(mk, tx);
        itemsEl.appendChild(li);
        itemEls[def.id] = { li, mk };
      }
    }
    const head = document.getElementById('lm-head');
    if (head && listEl) head.addEventListener('click', () => {
      listEl.classList.toggle('closed');
      const caret = document.getElementById('lm-caret');
      if (caret) caret.textContent = listEl.classList.contains('closed') ? '+' : '-';
    });
  }

  function count() { let n = 0; for (const d of LANDMARKS) if (seen[d.id]) n++; return n; }
  function renderList() {
    if (countEl) countEl.textContent = count() + '/' + LANDMARKS.length;
    for (const d of LANDMARKS) {
      const e = itemEls[d.id];
      if (!e) continue;
      const done = !!seen[d.id];
      e.li.classList.toggle('done', done);
      e.mk.textContent = done ? '\u2713' : '\u00b7';
    }
  }
  function showToast(def) {
    if (!toastEl) return;
    toastTitle.textContent = 'Discovered: ' + def.nameEN;
    toastSub.textContent = 'Da kham pha: ' + def.nameVI;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), TOAST_MS);
  }

  // ---- minimap: explored patchwork + landmark dots + traveller pin --------------------------------------
  function drawMinimap() {
    if (!mapCtx) return;
    const W = mapEl.width; const H = mapEl.height;
    const s = W / MAP_CELLS;
    const X = (cx) => (cx - MAP_MIN) * s;
    const Y = (cz) => (cz - MAP_MIN) * s;
    mapCtx.clearRect(0, 0, W, H);
    mapCtx.fillStyle = PAPER;
    mapCtx.fillRect(0, 0, W, H);
    if (progress && progress.eachCell) {
      progress.eachCell((cx, cz, biome) => {
        if (cx < MAP_MIN || cx > MAP_MIN + MAP_CELLS - 1 || cz < MAP_MIN || cz > MAP_MIN + MAP_CELLS - 1) return;
        mapCtx.fillStyle = GROUND[biome] || GROUND.heartland;
        mapCtx.fillRect(X(cx), Y(cz), s + 0.5, s + 0.5);
      });
    }
    for (const def of LANDMARKS) {
      const x = X(def.cell[0]) + s / 2; const y = Y(def.cell[1]) + s / 2;
      mapCtx.beginPath();
      mapCtx.arc(x, y, 3, 0, Math.PI * 2);
      if (seen[def.id]) { mapCtx.fillStyle = TERRA; mapCtx.fill(); }
      else { mapCtx.strokeStyle = TERRA; mapCtx.lineWidth = 1.5; mapCtx.stroke(); }
    }
    const px = (traveller.position.x / TILE_SIZE - MAP_MIN + 0.5) * s;
    const py = (traveller.position.z / TILE_SIZE - MAP_MIN + 0.5) * s;
    const md = traveller.moveDir || { x: 0, z: -1 };
    const l = Math.hypot(md.x, md.z) || 1;
    mapCtx.strokeStyle = INK;
    mapCtx.lineWidth = 1.5;
    mapCtx.beginPath();
    mapCtx.moveTo(px, py);
    mapCtx.lineTo(px + (md.x / l) * 5, py + (md.z / l) * 5);
    mapCtx.stroke();
    mapCtx.beginPath();
    mapCtx.arc(px, py, 2.6, 0, Math.PI * 2);
    mapCtx.fillStyle = INK;
    mapCtx.fill();
    mapCtx.strokeStyle = PAPER;
    mapCtx.lineWidth = 1;
    mapCtx.stroke();
  }

  // ---- discovery ----------------------------------------------------------------------------------------
  function discover(def) {
    if (seen[def.id]) return false;
    seen[def.id] = 1;
    touch();
    renderList();
    drawMinimap();
    showToast(def);
    bus.emit('game:landmark', { id: def.id, nameEN: def.nameEN, nameVI: def.nameVI, count: count() });
    return true;
  }
  function checkCell(cx, cz) {
    if (!wfc || typeof wfc.get !== 'function') return;
    for (const def of LANDMARKS) {
      if (seen[def.id]) continue;
      // (a) anchor within radius 1 (Chebyshev) of the traveller's cell
      if (Math.abs(def.cell[0] - cx) <= def.radius && Math.abs(def.cell[1] - cz) <= def.radius) { discover(def); continue; }
      // (b) any cell of the 3x3 neighbourhood carries this landmark's id (covers large areas)
      for (let oz = -1; oz <= 1; oz++) {
        for (let ox = -1; ox <= 1; ox++) {
          let c = null;
          try { c = wfc.get(cx + ox, cz + oz); } catch { c = null; }
          if (c && c.landmarkId === def.id) { discover(def); break; }
        }
        if (seen[def.id]) break;
      }
    }
  }

  const offExplore = bus.on('game:explore', () => drawMinimap());
  const offReset = bus.on('game:reset', () => {
    seen = {};
    dirty = true;
    save();
    renderList();
    drawMinimap();
  });

  let lastCx = NaN; let lastCz = NaN;
  let acc = MAP_REDRAW_S; // draw the pin on the first tick

  renderList();
  drawMinimap();

  return {
    update(dt) {
      const p = traveller.position;
      const cx = Math.round(p.x / TILE_SIZE);
      const cz = Math.round(p.z / TILE_SIZE);
      if (cx !== lastCx || cz !== lastCz) {
        lastCx = cx; lastCz = cz;
        // armed: no discovery before his first steps (same guard as the lanterns)
        if (ctx.game && ctx.game.armed !== false) checkCell(cx, cz);
      }
      acc += dt;
      if (acc >= MAP_REDRAW_S) { acc = 0; drawMinimap(); }
    },
    /** Finish the toast at once and refresh the list + map (captures). */
    settle() {
      if (toastTimer) { clearTimeout(toastTimer); toastTimer = 0; }
      if (toastEl) toastEl.classList.remove('show');
      renderList();
      drawMinimap();
    },
    dispose() {
      offExplore();
      offReset();
      if (toastTimer) { clearTimeout(toastTimer); toastTimer = 0; }
      if (persist && !headless) {
        window.removeEventListener('pagehide', save);
        document.removeEventListener('visibilitychange', onVis);
      }
      flush();
      if (!headless) document.body.classList.remove('hanoi');
    },
    /** True when this landmark was already discovered. */
    visited(id) { return !!seen[id]; },
    /** Landmarks discovered so far. */
    count,
    /** All definitions with their visited flag. */
    list() { return LANDMARKS.map((d) => ({ ...d, visited: !!seen[d.id] })); },
    /** Debug: force-discover one landmark by id. @returns true if it was new */
    debugDiscover(id) { const def = BY_ID[id]; return def ? discover(def) : false; },
    /** The localStorage key this store uses. */
    storeKey: KEY,
    defs: LANDMARKS,
  };
}
