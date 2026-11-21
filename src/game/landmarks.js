// Landmarks (Step 4, Hanoi mode only; owner: landmarks agent). Contract: src/game/index.js.
//
// Discovery, a bilingual checklist, a toast and a corner minimap - only when the world is the
// static Hanoi page (?map=hanoi). In the WFC world this module is never created, so none of its
// DOM shows: index.html keeps #lm-list, #lm-toast and #lm-map hidden unless body.hanoi.
//
// Phase 2B adds the proximity info card (#lm-info): when the traveller comes within radius 1
// of a landmark it opens with that landmark's history (docs/landmark-history.md, copied exact
// in src/game/landmark-history.js). Tapping a discovered checklist item re-opens its card.
// The card never blocks walking: keyboard walking works while it is open, it closes itself
// when the traveller walks away (same radius-1 test as discovery), and the X button closes it.
// Phase 2C: the active language comes first everywhere; detection (country.is, VI
// default) and the manual VI | EN toggle live in src/game/i18n.js.
// No long dashes in this file: only short hyphens (-).
import { TILE_SIZE } from '../core/config.js';
import { bus } from '../core/events.js';
import { HANOI_LANDMARKS } from '../world/hanoi-map.js';
import { landmarkInfo } from './landmark-history.js';
import { createLanguage, STRINGS } from './i18n.js';

const STORE_PREFIX = 'hanoi:v1:';
const RADIUS = 1; // cells (Chebyshev): the traveller's cell plus its 8 neighbours
const TOAST_MS = 3400;
const MAP_REDRAW_S = 0.2;
const MAP_CELLS = 40; // the Hanoi page is 40x40, coords -20..19
const MAP_MIN = -20;
// explored-cell tones, same patchwork as the atlas map (src/game/atlasmap.js BIOME_GROUND)
const GROUND = { heartland: '#c3c084', desert: '#e3c68f', snow: '#e7ecef', blossom: '#cdd596', pinewood: '#8fa07a', hanoi: '#d3b078' };
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
  let lastToastDef = null; // landmark of the toast now showing, so a language switch can re-word it
  let mapEl = null; let mapCtx = null;
  let infoEl = null; let infoHead = null; let infoX = null;
  let infoTitleVI = null; let infoTitleEN = null;
  let infoHistVI = null; let infoHistEN = null;
  let infoFunVI = null; let infoFunEN = null; let infoSrc = null;
  let infoBody = null;
  let infoHistHVI = null; let infoHistHEN = null;
  let infoFunHVI = null; let infoFunHEN = null;
  let infoOpen = null; // id of the landmark whose info card is open, or null
  let titleEl = null; let privacyEl = null; let hintEl = null;
  let toggleEl = null; let toggleVI = null; let toggleEN = null;
  const itemEls = {};
  // Language state (Phase 2C). Initial language is the stored choice, else the cached
  // country, else VI. onChange re-renders every visible string. detect() below is
  // fire-and-forget: boot never awaits it, and the UI is already rendered in VI.
  // Test / embed hooks: ctx may carry storage, fetchImpl and navigatorLanguage
  // (createGame never passes them; the browser path always uses the globals).
  const lang = createLanguage({
    storage: ctx.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null),
    navigatorLanguage: ctx.navigatorLanguage ?? (typeof navigator !== 'undefined' ? navigator.language : ''),
    fetchImpl: ctx.fetchImpl ?? (typeof fetch === 'function' ? fetch : null),
    onChange: () => renderAllStrings(),
  });
  if (!headless) {
    document.body.classList.add('hanoi');
    listEl = document.getElementById('lm-list');
    itemsEl = document.getElementById('lm-items');
    countEl = document.getElementById('lm-count');
    toastEl = document.getElementById('lm-toast');
    mapEl = document.getElementById('lm-map');
    infoEl = document.getElementById('lm-info');
    infoHead = document.getElementById('lm-info-head');
    infoX = document.getElementById('lm-info-x');
    infoTitleVI = document.getElementById('lm-info-title-vi');
    infoTitleEN = document.getElementById('lm-info-title-en');
    infoHistVI = document.getElementById('lm-info-hist-vi');
    infoHistEN = document.getElementById('lm-info-hist-en');
    infoFunVI = document.getElementById('lm-info-fun-vi');
    infoFunEN = document.getElementById('lm-info-fun-en');
    infoSrc = document.getElementById('lm-info-src');
    infoBody = document.getElementById('lm-info-body');
    infoHistHVI = document.getElementById('lm-info-hist-h-vi');
    infoHistHEN = document.getElementById('lm-info-hist-h-en');
    infoFunHVI = document.getElementById('lm-info-fun-h-vi');
    infoFunHEN = document.getElementById('lm-info-fun-h-en');
    titleEl = document.getElementById('lm-title');
    privacyEl = document.getElementById('lm-privacy');
    hintEl = document.getElementById('hint');
    toggleEl = document.getElementById('lm-lang');
    toggleVI = document.getElementById('lm-lang-vi');
    toggleEN = document.getElementById('lm-lang-en');
    if (toggleEl) {
      toggleEl.addEventListener('click', () => lang.toggle());
    }
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
        // Two name slots: the active language first (plain), the other second (italic).
        // renderNames() below fills them on every language switch.
        const main = document.createTextNode('');
        const other = document.createElement('i');
        tx.append(main, other);
        li.append(mk, tx);
        // Phase 2B: tap a discovered item to re-open its info card (undiscovered: nothing).
        li.addEventListener('click', () => { if (seen[def.id]) showInfo(def.id); });
        li.style.cursor = 'pointer';
        itemsEl.appendChild(li);
        itemEls[def.id] = { li, mk, main, other };
      }
    }
    if (infoHead && infoEl) {
      infoHead.addEventListener('click', () => infoEl.classList.toggle('collapsed'));
    }
    if (infoX) {
      infoX.addEventListener('click', (ev) => { ev.stopPropagation(); hideInfo(); });
    }
    const head = document.getElementById('lm-head');
    if (head && listEl) head.addEventListener('click', () => {
      listEl.classList.toggle('closed');
      const caret = document.getElementById('lm-caret');
      if (caret) caret.textContent = listEl.classList.contains('closed') ? '+' : '-';
    });
  }

  // ---- info card (Phase 2B) ---------------------------------------------------------------------------
  // Phase 2D: the history lookup may come from the edge API (ctx.historyInfo)
  // instead of the bundled dataset. Same contract as landmarkInfo(id).
  const infoFor = ctx.historyInfo || landmarkInfo;
  function fillList(ul, lines) {
    if (!ul) return;
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    for (const line of lines) {
      const li = document.createElement('li');
      li.textContent = line;
      ul.appendChild(li);
    }
  }
  function showInfo(id, expand = true) {
    const info = infoFor(id);
    if (!info || !infoEl) return;
    infoOpen = id;
    // Active language first (big title + first sections), the other language second.
    // Both languages stay reachable in the card; nothing is hidden by the switch.
    const activeVI = lang.lang === 'vi';
    const nameMain = activeVI ? info.nameVI : info.nameEN;
    const nameOther = activeVI ? info.nameEN : info.nameVI;
    if (infoTitleVI) infoTitleVI.textContent = nameMain;
    if (infoTitleEN) infoTitleEN.textContent = nameOther;
    fillList(infoHistVI, info.histVI);
    fillList(infoHistEN, info.histEN);
    if (infoFunVI) infoFunVI.textContent = info.funVI;
    if (infoFunEN) infoFunEN.textContent = info.funEN;
    // Headings keep their own language's wording; only the section order swaps.
    if (infoHistHVI) infoHistHVI.textContent = STRINGS.vi.histHeading;
    if (infoHistHEN) infoHistHEN.textContent = STRINGS.en.histHeading;
    if (infoFunHVI) infoFunHVI.textContent = STRINGS.vi.funHeading;
    if (infoFunHEN) infoFunHEN.textContent = STRINGS.en.funHeading;
    // Reorder the sections so the active language reads first. appendChild moves a
    // node that is already in the body; the source link stays last.
    if (infoBody) {
      const histH = activeVI ? infoHistHVI : infoHistHEN;
      const histUl = activeVI ? infoHistVI : infoHistEN;
      const funH = activeVI ? infoFunHVI : infoFunHEN;
      const funP = activeVI ? infoFunVI : infoFunEN;
      const histH2 = activeVI ? infoHistHEN : infoHistHVI;
      const histUl2 = activeVI ? infoHistEN : infoHistVI;
      const funH2 = activeVI ? infoFunHEN : infoFunHVI;
      const funP2 = activeVI ? infoFunEN : infoFunVI;
      for (const n of [histH, histUl, funH, funP, histH2, histUl2, funH2, funP2]) {
        if (n) infoBody.appendChild(n);
      }
      if (infoSrc) infoBody.appendChild(infoSrc);
    }
    if (infoSrc) {
      infoSrc.href = info.source;
      let host = info.source;
      try { host = new URL(info.source).hostname; } catch { /* keep the raw URL */ }
      infoSrc.textContent = lang.t('sourceLabel', { host });
    }
    // A language re-render (expand false) must keep the collapsed state: only a
    // fresh open (discovery, checklist tap) expands the card body.
    if (expand) infoEl.classList.remove('collapsed');
    infoEl.classList.add('show');
  }
  function hideInfo() {
    infoOpen = null;
    if (infoEl) infoEl.classList.remove('show');
  }
  /** True when the traveller's cell is within radius 1 of this landmark (same test as discovery). */
  function nearLandmark(id, cx, cz) {
    const def = BY_ID[id];
    if (!def) return false;
    if (Math.abs(def.cell[0] - cx) <= def.radius && Math.abs(def.cell[1] - cz) <= def.radius) return true;
    if (!wfc || typeof wfc.get !== 'function') return false;
    for (let oz = -1; oz <= 1; oz++) {
      for (let ox = -1; ox <= 1; ox++) {
        let c = null;
        try { c = wfc.get(cx + ox, cz + oz); } catch { c = null; }
        if (c && c.landmarkId === id) return true;
      }
    }
    return false;
  }

  function count() { let n = 0; for (const d of LANDMARKS) if (seen[d.id]) n++; return n; }
  /** Checklist names in the active language first, the other language second. */
  function renderNames() {
    const activeVI = lang.lang === 'vi';
    for (const d of LANDMARKS) {
      const e = itemEls[d.id];
      if (!e) continue;
      if (e.main) e.main.textContent = (activeVI ? d.nameVI : d.nameEN) + ' ';
      if (e.other) e.other.textContent = activeVI ? d.nameEN : d.nameVI;
    }
  }
  function renderList() {
    if (countEl) countEl.textContent = count() + '/' + LANDMARKS.length;
    for (const d of LANDMARKS) {
      const e = itemEls[d.id];
      if (!e) continue;
      const done = !!seen[d.id];
      e.li.classList.toggle('done', done);
      e.mk.textContent = done ? '\u2713' : '\u00b7';
    }
    renderNames();
  }
  /** Re-render every visible UI string in the active language (toggle + detection). */
  function renderAllStrings() {
    if (titleEl) titleEl.textContent = lang.t('checklistTitle');
    if (privacyEl) privacyEl.textContent = lang.t('privacy');
    if (hintEl) hintEl.textContent = lang.t('hint');
    if (toggleEl) toggleEl.setAttribute('aria-label', lang.t('toggleLabel'));
    if (toggleVI) toggleVI.classList.toggle('on', lang.lang === 'vi');
    if (toggleEN) toggleEN.classList.toggle('on', lang.lang === 'en');
    if (infoX) infoX.setAttribute('aria-label', lang.t('closeLabel'));
    renderList();
    if (lastToastDef && toastEl && toastEl.classList.contains('show')) showToast(lastToastDef, true);
    if (infoOpen) showInfo(infoOpen, false); // re-render only, keep collapsed state
  }
  function showToast(def, keepTimer = false) {
    if (!toastEl) return;
    const activeVI = lang.lang === 'vi';
    const nameMain = activeVI ? def.nameVI : def.nameEN;
    const nameOther = activeVI ? def.nameEN : def.nameVI;
    toastTitle.textContent = lang.t('discovered', { name: nameMain });
    toastSub.textContent = nameOther;
    lastToastDef = def;
    toastEl.classList.add('show');
    if (keepTimer) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove('show'); lastToastDef = null; }, TOAST_MS);
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
    showInfo(def.id);
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
  renderAllStrings(); // first paint of toggle / privacy / hint in the fallback language

  // Phase 2C: start the IP lookup WITHOUT waiting for it. The UI above is already
  // rendered in the fallback language; when the lookup returns, onChange re-renders
  // every string. Boot never waits for this: nothing on the detection path blocks.
  lang.detect();

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
      // Phase 2B: the info card closes itself when the traveller walks out of radius 1.
      if (infoOpen && !nearLandmark(infoOpen, cx, cz)) hideInfo();
      acc += dt;
      if (acc >= MAP_REDRAW_S) { acc = 0; drawMinimap(); }
    },
    /** Finish the toast at once and refresh the list + map (captures). */
    settle() {
      if (toastTimer) { clearTimeout(toastTimer); toastTimer = 0; }
      lastToastDef = null;
      if (toastEl) toastEl.classList.remove('show');
      hideInfo();
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
    /** Open the info card for a discovered landmark (checklist tap). No-op when not visited. */
    openInfo(id) { if (seen[id]) showInfo(id); },
    /** Close the info card, if open. */
    closeInfo() { hideInfo(); },
    /** Id of the landmark whose info card is open, or null. */
    infoOpen() { return infoOpen; },
    /** Active language ('vi' | 'en'). */
    lang() { return lang.lang; },
    /** Manual language switch (persists, overrides detection). */
    setLang(next) { return lang.setLang(next, { manual: true }); },
    /** Re-run the IP lookup (no-op after the first run in this session). */
    detectLang() { return lang.detect(); },
    /** True when the traveller's cell is within radius 1 of this landmark. */
    nearLandmark,
    /** The localStorage key this store uses. */
    storeKey: KEY,
    defs: LANDMARKS,
  };
}
