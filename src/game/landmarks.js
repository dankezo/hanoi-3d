// Landmarks (Step 4, Hanoi mode only; owner: landmarks agent). Contract: src/game/index.js.
//
// Discovery, a bilingual checklist, a toast and a corner minimap - only when the world is the
// static Hanoi page (?map=hanoi). In the WFC world this module is never created, so none of its
// DOM shows: index.html keeps #lm-list, #lm-toast and #lm-map hidden unless body.hanoi.
//
// Phase 2B adds the proximity info card (#lm-info): when the traveller comes within radius 1
// of a landmark it opens with that landmark's history (docs/landmark-history.md, copied exact
// in src/game/landmark-history.js). Tapping a discovered checklist item re-opens its card.
// The card never blocks walking: keyboard walking works while it is open, and the X button
// closes it. Phase 2C: the active language comes first everywhere; detection (country.is, VI
// default) and the manual VI | EN toggle live in src/game/i18n.js.
//
// Phase 3C redesign (approved Q3/Q4: tap-to-open, one language at a time):
// - 3C-01: the card NEVER opens on its own. Discovery only shows a short toast
//   ("Da den Ho Guom - bam de xem") and a gold "!" marker above the landmark (a DOM
//   element projected from the anchor's 3D position every frame). The card opens only
//   when the user taps the landmark on screen, taps the "!", or taps a checklist item.
//   A screen tap counts only when the pointer moves < 10px and lasts < 400ms (tap vs
//   drag, same rule as the old tap-vs-drag split). A landmark tap never walks.
// - 3C-02: while the traveller is within radius 1 of a landmark, a faint terracotta
//   ring (radius 1 tile) lies on the ground around its anchor. It vanishes on leaving.
// - 3C-03: the card shows ONE language only (the active one, VI by default). The in-card
//   VI | EN toggle switches it at once without closing the card.
// - 3C-04: the card has 3 layers. (a) big name + 1 summary sentence (<= 20 words) +
//   1 short fun fact (<= 15 words), shown by default. (b) "Doc them" reveals the 3
//   history lines + the full fun fact. (c) the source link, last. Summary / short fun
//   fact live in landmark-history.js as new fields; history / fun fact / source are
//   untouched (check-2b still compares them exactly against docs/landmark-history.md).
// - 3C-05: large type - title 20px bold, summary 16px/1.6, buttons 15px, history
//   15px/1.6, section headings 12px. On 390px the card is at most 360px wide, 60vh
//   tall, scrolling inside itself.
// - 3C-06: the card NEVER closes on its own while open. Walking out of radius 1 does
//   NOT close it. It closes only on X, on a tap outside the card (on the canvas), or
//   when another landmark's card opens.
// - 3C-07: the toast moves up (bottom 62vh) while the card is open (body.card-open),
//   back to 11vh when it closes, so the two text layers never stack.
// - 3C-08: on screens <= 500px the card is a bottom sheet (slides up 250ms ease-out,
//   100vw - 16px, rounded top corners, drag handle). It covers the minimap while open
//   (accepted while reading); closing it brings the minimap fully back. The sheet only
//   covers its own rect: taps outside it still walk (and close the card, 3C-06).
// - 3C-09: co-discovery - when 2+ discovered landmarks are near at once, the card
//   shows one tab button per landmark at its top; tapping a tab switches the card.
// - 3C-10: layer (a) is word-counted by tools/check-3c.mjs (summary <= 20, fun fact
//   <= 15, all 11 landmarks x 2 languages). Reading time on a real 390px phone is
//   the user/verifier's job; the manifest records an estimate (about 8 s per card).
// No long dashes in this file: only short hyphens (-).
import * as THREE from 'three';
import { TILE_SIZE } from '../core/config.js';
import { bus } from '../core/events.js';
import { HANOI_LANDMARKS, HANOI_ROWS, HANOI_LEGEND, HANOI_OFFSET } from '../world/hanoi-map.js';
import { landmarkInfo } from './landmark-history.js';
import { createLanguage, STRINGS } from './i18n.js';

const STORE_PREFIX = 'hanoi:v1:';
const RADIUS = 1; // cells (Chebyshev): the traveller's cell plus its 8 neighbours
const TOAST_MS = 3400;
const MAP_REDRAW_S = 0.2;
const MAP_CELLS = 40; // the Hanoi page is 40x40, coords -20..19
const MAP_MIN = -20;
// Tap vs drag (3C-01): a tap moves < 10px and lasts < 400ms. Anything longer or
// further is a walk-drag and never opens a card.
const TAP_MAX_PX = 10;
const TAP_MAX_MS = 400;
// The "!" floats this high above the anchor (tallest landmark flap is 1.49).
const BANG_HEIGHT = 1.7;
// explored-cell tones, same patchwork as the atlas map (src/game/atlasmap.js BIOME_GROUND)
const GROUND = { heartland: '#c3c084', desert: '#e3c68f', snow: '#e7ecef', blossom: '#cdd596', pinewood: '#8fa07a', hanoi: '#d3b078' };
// Phase 3B: water tones on the minimap, same hexes as the lake base prints (loader.js):
// Ho Guom dark green, Ho Tay deep blue (lotus pond included), other water teal.
const WATER = { hanoi_pond_guom: '#2f6b5e', hanoi_pond_tay: '#2456a8', hanoi_lotus: '#2456a8', pond: '#5e9c9a', river_straight: '#5e9c9a', river_corner: '#5e9c9a', river_source: '#5e9c9a' };
const PAPER = '#efe0c2';
const INK = '#5a3a28';
const TERRA = '#b9603f';
// Phase 3F-05: custom paper-silhouette minimap icons (tools/step5/build-minimap-icons.py).
// Sheet: public/textures/art/minimap_icons.png + .json, 11 icons 32x32 in two
// rows: filled (discovered) + outline-only (undiscovered). Same tolerant JSON
// parse as atlasmap.js loadIcons. Until the sheet loads (or if it fails),
// drawMinimap falls back to the 3F-08 numbered discs (3F-08, kept mandatory).
const MM_ICON_SIZE = 14; // px on the 200px minimap buffer
const MM_ICON_URL = 'textures/art/minimap_icons';
const MM_TAP_R = 8; // px on the minimap buffer: tap tolerance around an icon centre.
// N2 fix (3F-05 verify): the Ngoc Son / cathedral centres are only 11.18px
// apart, so r=11 made their tap discs overlap almost fully. r=8 shrinks the
// overlap lens, and the loop below still picks the NEAREST centre (strict <,
// so an exact tie goes to the first in checklist order), never the first hit.
// Phase 3C chrome strings (not in i18n.js: this card owns them, one language at a time).
const CARD_STRINGS = {
  vi: { arrived: 'Da den {name}', tapHint: 'Bam de xem', readMore: 'Doc them', readLess: 'Thu gon' },
  en: { arrived: 'Arrived at {name}', tapHint: 'Tap to view', readMore: 'Read more', readLess: 'Show less' },
};

// Bilingual names, display order = the checklist order. Vietnamese is written without diacritics,
// matching the toast wording ("Da kham pha") and the app's plain serif text.
const NAMES = {
  hoankiem: ['Hoan Kiem Lake', 'Ho Hoan Kiem'],
  ngocson: ['Ngoc Son Temple', 'Den Ngoc Son'],
  westlake: ['West Lake', 'Ho Tay'],
  tranquoc: ['Tran Quoc Pagoda', 'Chua Tran Quoc'],
  oldquarter: ['Old Quarter', 'Pho Co'],
  mausoleum: ['Ho Chi Minh Mausoleum', 'Lang Chu Tich'],
  vanmieu: ['Temple of Literature', 'Van Mieu'],
  onepillar: ['One Pillar Pagoda', 'Chua Mot Cot'],
  cathedral: ['St. Joseph Cathedral', 'Nha Tho Lon'],
  opera: ['Hanoi Opera House', 'Nha Hat Lon'],
  longbien: ['Long Bien Bridge', 'Cau Long Bien'],
};
const ORDER = ['hoankiem', 'ngocson', 'westlake', 'tranquoc', 'oldquarter', 'mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien'];

/** [{ id, nameEN, nameVI, cell: [x, z], radius }] - anchors come from the map, the single source of truth. */
export const LANDMARKS = Object.freeze(ORDER.map((id) => {
  const a = HANOI_LANDMARKS[id].anchor;
  return Object.freeze({ id, nameEN: NAMES[id][0], nameVI: NAMES[id][1], cell: Object.freeze([a[0], a[1]]), radius: RADIUS });
}));
export const LANDMARK_COUNT = LANDMARKS.length;
export const LANDMARK_RADIUS = RADIUS;
export const LANDMARK_STORE_PREFIX = STORE_PREFIX;
export const TAP_MAX_PX_EXPORT = TAP_MAX_PX;
export const TAP_MAX_MS_EXPORT = TAP_MAX_MS;

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
  let locateTimer = 0; // clears the checklist highlight (3F-07)
  let lastToastDef = null; // landmark of the toast now showing, so a language switch can re-word it
  let mapEl = null; let mapCtx = null;
  let iconImg = null; let iconTable = null; // Phase 3F-05 minimap icon sheet (null = fallback discs)
  let infoEl = null; let infoX = null;
  let infoTitle = null; let infoSummary = null;
  let infoFunH = null; let infoFunShort = null;
  let infoMore = null; let infoDetails = null;
  let infoHistH = null; let infoHist = null;
  let infoFunFullH = null; let infoFunFull = null; let infoSrc = null;
  let infoBody = null; let infoTabs = null;
  let infoLang = null; let infoLangVI = null; let infoLangEN = null;
  let bangEl = null; let canvasEl = null;
  let infoOpen = null; // id of the landmark whose info card is open, or null
  let infoExpanded = false; // true when layer (b) "Doc them" is open
  let bangDef = null; // id of the landmark the "!" marker points at, or null
  let nearDef = null; // id of the nearest landmark within radius 1, or null
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
  // Phase 3C helpers (defined before the DOM block uses them in listeners).
  const cardText = (key) => {
    const dict = CARD_STRINGS[lang.lang] || CARD_STRINGS.vi;
    return dict[key] || CARD_STRINGS.vi[key] || key;
  };
  const fillText = (str, vars) => String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  // Reused THREE scratch objects for the "!" projection and the tap raycast.
  const projV = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const rayNdc = new THREE.Vector2();
  const rayPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const rayHit = new THREE.Vector3();
  // Phase 3C-02: one faint terracotta ring on the ground around the anchor in reach.
  // Created only when a scene is present (never headless); one mesh, repositioned.
  let ringMesh = null;
  if (!headless && ctx.scene && typeof ctx.scene.add === 'function') {
    try {
      const geo = new THREE.RingGeometry(1.85, 2.0, 48);
      geo.rotateX(-Math.PI / 2);
      ringMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0xb9603f, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide,
      }));
      ringMesh.visible = false;
      ringMesh.renderOrder = 4;
      ctx.scene.add(ringMesh);
    } catch { ringMesh = null; }
  }
  if (!headless) {
    document.body.classList.add('hanoi');
    listEl = document.getElementById('lm-list');
    itemsEl = document.getElementById('lm-items');
    countEl = document.getElementById('lm-count');
    toastEl = document.getElementById('lm-toast');
    mapEl = document.getElementById('lm-map');
    infoEl = document.getElementById('lm-info');
    infoX = document.getElementById('lm-info-x');
    infoTitle = document.getElementById('lm-info-title');
    infoSummary = document.getElementById('lm-info-summary');
    infoFunH = document.getElementById('lm-info-fun-h');
    infoFunShort = document.getElementById('lm-info-fun-short');
    infoMore = document.getElementById('lm-info-more');
    infoDetails = document.getElementById('lm-info-details');
    infoHistH = document.getElementById('lm-info-hist-h');
    infoHist = document.getElementById('lm-info-hist');
    infoFunFullH = document.getElementById('lm-info-fun-full-h');
    infoFunFull = document.getElementById('lm-info-fun-full');
    infoSrc = document.getElementById('lm-info-src');
    infoBody = document.getElementById('lm-info-body');
    infoTabs = document.getElementById('lm-info-tabs');
    infoLang = document.getElementById('lm-info-lang');
    infoLangVI = document.getElementById('lm-info-lang-vi');
    infoLangEN = document.getElementById('lm-info-lang-en');
    bangEl = document.getElementById('lm-bang');
    canvasEl = document.getElementById('atlas');
    titleEl = document.getElementById('lm-title');
    privacyEl = document.getElementById('lm-privacy');
    hintEl = document.getElementById('hint');
    toggleEl = document.getElementById('lm-lang');
    toggleVI = document.getElementById('lm-lang-vi');
    toggleEN = document.getElementById('lm-lang-en');
    if (toggleEl) {
      toggleEl.addEventListener('click', () => lang.toggle());
    }
    if (infoLang) {
      infoLang.addEventListener('click', () => lang.toggle());
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
        // Phase 3C: the checklist is one of the three ways to open the card.
        li.addEventListener('click', () => { if (seen[def.id]) showInfo(def.id); });
        li.style.cursor = 'pointer';
        itemsEl.appendChild(li);
        itemEls[def.id] = { li, mk, main, other };
      }
    }
    if (infoX) {
      infoX.addEventListener('click', (ev) => { ev.stopPropagation(); hideInfo(); });
    }
    if (infoMore) {
      infoMore.addEventListener('click', () => {
        infoExpanded = !infoExpanded;
        if (infoOpen) showInfo(infoOpen, false);
      });
    }
    if (bangEl) {
      bangEl.addEventListener('click', () => { if (bangDef && seen[bangDef]) showInfo(bangDef); });
    }
    // Phase 3F-07: tap an icon on the minimap to locate it. The minimap is
    // its own canvas (index.html #lm-map, pointer-events auto): a tap here
    // never walks and never reaches the canvas tap handler below (this
    // pointerup stops propagation, and onPointerUp also ignores #lm-map
    // targets). Discovered: highlight the checklist item + open its card at
    // layer (a). Not yet discovered: highlight the item + toast
    // "Chua kham pha - di toi do".
    let mapDownRec = null;
    const onMapDown = (e) => {
      mapDownRec = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
    };
    const onMapUp = (e) => {
      e.stopPropagation();
      if (!mapDownRec || e.pointerId !== mapDownRec.id) { mapDownRec = null; return; }
      const dx = e.clientX - mapDownRec.x;
      const dy = e.clientY - mapDownRec.y;
      const dt = Date.now() - mapDownRec.t;
      mapDownRec = null;
      if (Math.hypot(dx, dy) >= TAP_MAX_PX || dt >= TAP_MAX_MS) return; // drag, not a tap
      const r = mapEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const mx = ((e.clientX - r.left) / r.width) * mapEl.width;
      const my = ((e.clientY - r.top) / r.height) * mapEl.height;
      const s = mapEl.width / MAP_CELLS;
      let best = null; let bestD = MM_TAP_R;
      for (const def of LANDMARKS) {
        const x = (def.cell[0] - MAP_MIN) * s + s / 2;
        const y = (def.cell[1] - MAP_MIN) * s + s / 2;
        const d = Math.hypot(mx - x, my - y);
        if (d < bestD) { bestD = d; best = def; }
      }
      if (!best) return;
      highlightChecklist(best.id);
      if (seen[best.id]) showInfo(best.id);
      else showLocateToast(best);
    };
    if (mapEl) {
      mapEl.addEventListener('pointerdown', onMapDown);
      mapEl.addEventListener('pointerup', onMapUp);
    }
    // Kept on the instance so dispose() can remove the exact handlers.
    var disposeMapTap = () => {
      if (mapEl) {
        mapEl.removeEventListener('pointerdown', onMapDown);
        mapEl.removeEventListener('pointerup', onMapUp);
      }
    };
    // Phase 3C-01 + 3C-06: tap handling on the canvas. A pointerdown only records
    // where the gesture started; nothing closes yet, so starting a walk-drag
    // never closes the card. The matching pointerup decides: a real tap
    // (< 10px and < 400ms) outside any landmark closes an open card, a tap on
    // a landmark opens its card and cancels the walk, and a drag just walks
    // (the card stays open). Listeners are added after controls' own listeners,
    // so controls has already set its target by the time we cancel it here
    // with clearTarget().
    let downRec = null;
    const onCanvasDown = (e) => {
      downRec = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
    };
    const onPointerUp = (e) => {
      if (e.target && e.target.closest && e.target.closest('#lm-map')) return; // minimap taps have their own handler (3F-07)
      if (!downRec || e.pointerId !== downRec.id) { downRec = null; return; }
      const dx = e.clientX - downRec.x;
      const dy = e.clientY - downRec.y;
      const dt = Date.now() - downRec.t;
      downRec = null;
      if (Math.hypot(dx, dy) >= TAP_MAX_PX || dt >= TAP_MAX_MS) return; // drag, not a tap: walk on, card stays open
      const hitId = pickLandmark(e.clientX, e.clientY);
      if (!hitId) { if (infoOpen) hideInfo(); return; } // tap outside the card closes it
      if (ctx.controls && typeof ctx.controls.clearTarget === 'function') ctx.controls.clearTarget();
      if (seen[hitId]) showInfo(hitId);
    };
    const onPointerCancel = () => { downRec = null; };
    if (canvasEl) canvasEl.addEventListener('pointerdown', onCanvasDown);
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    }
    const head = document.getElementById('lm-head');
    if (head && listEl) head.addEventListener('click', () => {
      listEl.classList.toggle('closed');
      const caret = document.getElementById('lm-caret');
      if (caret) caret.textContent = listEl.classList.contains('closed') ? '+' : '-';
    });
    // Kept on the instance so dispose() can remove the exact handlers.
    var disposeTap = () => {
      if (canvasEl) canvasEl.removeEventListener('pointerdown', onCanvasDown);
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
      }
    };
  }

  // ---- info card (Phase 2B, redesigned Phase 3C) -------------------------------------------------------
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
  /** Landmarks within radius 1 of the traveller's cell that are already discovered, in checklist order. */
  function nearDiscoveredIds() {
    if (!traveller || !traveller.position) return [];
    const cx = Math.round(traveller.position.x / TILE_SIZE);
    const cz = Math.round(traveller.position.z / TILE_SIZE);
    const out = [];
    for (const def of LANDMARKS) {
      if (seen[def.id] && nearLandmark(def.id, cx, cz)) out.push(def.id);
    }
    return out;
  }
  function renderTabs(ids, activeId) {
    if (!infoTabs) return;
    while (infoTabs.firstChild) infoTabs.removeChild(infoTabs.firstChild);
    if (ids.length < 2) { infoTabs.hidden = true; return; }
    infoTabs.hidden = false;
    const activeVI = lang.lang === 'vi';
    for (const id of ids) {
      const def = BY_ID[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = activeVI ? def.nameVI : def.nameEN;
      if (id === activeId) b.classList.add('on');
      b.addEventListener('click', () => showInfo(id));
      infoTabs.appendChild(b);
    }
  }
  function showInfo(id, expand = true) {
    const info = infoFor(id);
    if (!info || !infoEl) return;
    infoOpen = id;
    // A fresh open always starts at layer (a); a re-render (language switch,
    // "Doc them" toggle) keeps the expanded state.
    if (expand) infoExpanded = false;
    const activeVI = lang.lang === 'vi';
    const name = activeVI ? info.nameVI : info.nameEN;
    const hist = activeVI ? info.histVI : info.histEN;
    const fun = activeVI ? info.funVI : info.funEN;
    // Layer (a): name + 1 summary sentence + 1 short fun fact. The edge override
    // (2D) has no summary fields: fall back to the first history line / full fun fact.
    const summary = activeVI ? (info.summaryVI || hist[0] || '') : (info.summaryEN || hist[0] || '');
    const funShort = activeVI ? (info.funShortVI || fun) : (info.funShortEN || fun);
    if (infoTitle) infoTitle.textContent = name;
    if (infoSummary) infoSummary.textContent = summary;
    if (infoFunH) infoFunH.textContent = STRINGS[lang.lang].funHeading;
    if (infoFunShort) infoFunShort.textContent = funShort;
    if (infoMore) infoMore.textContent = infoExpanded ? cardText('readLess') : cardText('readMore');
    if (infoDetails) infoDetails.hidden = !infoExpanded;
    if (infoHistH) infoHistH.textContent = STRINGS[lang.lang].histHeading;
    fillList(infoHist, hist);
    if (infoFunFullH) infoFunFullH.textContent = STRINGS[lang.lang].funHeading;
    if (infoFunFull) infoFunFull.textContent = fun;
    if (infoSrc) {
      infoSrc.href = info.source;
      let host = info.source;
      try { host = new URL(info.source).hostname; } catch { /* keep the raw URL */ }
      infoSrc.textContent = lang.t('sourceLabel', { host });
    }
    renderTabs(nearDiscoveredIds(), id);
    if (infoLangVI) infoLangVI.classList.toggle('on', lang.lang === 'vi');
    if (infoLangEN) infoLangEN.classList.toggle('on', lang.lang === 'en');
    infoEl.classList.add('show');
    // Phase 3C-08: the bottom-sheet slide runs as a transition, not a keyframe
    // (check-3d (a) forbids any CSS keyframes in index.html - Q12 plain % bar).
    // Staging .in on the next frame lets the transition run from its start state.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => { if (infoEl) infoEl.classList.add('in'); });
    } else {
      infoEl.classList.add('in');
    }
    if (typeof document !== 'undefined' && document.body) document.body.classList.add('card-open');
  }
  function hideInfo() {
    infoOpen = null;
    infoExpanded = false;
    if (infoEl) infoEl.classList.remove('show');
    if (infoEl) infoEl.classList.remove('in');
    if (typeof document !== 'undefined' && document.body) document.body.classList.remove('card-open');
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
  /** Raycast a screen point onto the page plane; return the landmark id whose anchor
   * is within radius 1 of the tapped cell, or null. Needs the follow camera. */
  function pickLandmark(clientX, clientY) {
    const camera = ctx.follow && ctx.follow.camera;
    if (!camera || !canvasEl || typeof canvasEl.getBoundingClientRect !== 'function') return null;
    const r = canvasEl.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    rayNdc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(rayNdc, camera);
    if (!raycaster.ray.intersectPlane(rayPlane, rayHit)) return null;
    const cx = Math.round(rayHit.x / TILE_SIZE);
    const cz = Math.round(rayHit.z / TILE_SIZE);
    for (const def of LANDMARKS) {
      if (nearLandmark(def.id, cx, cz)) return def.id;
    }
    return null;
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
    if (infoLang) infoLang.setAttribute('aria-label', lang.t('toggleLabel'));
    if (infoLangVI) infoLangVI.classList.toggle('on', lang.lang === 'vi');
    if (infoLangEN) infoLangEN.classList.toggle('on', lang.lang === 'en');
    renderList();
    if (lastToastDef && toastEl && toastEl.classList.contains('show')) showToast(lastToastDef, true);
    if (infoOpen) showInfo(infoOpen, false); // re-render only, keep expanded state
  }
  function showToast(def, keepTimer = false) {
    if (!toastEl) return;
    const activeVI = lang.lang === 'vi';
    const nameMain = activeVI ? def.nameVI : def.nameEN;
    // Phase 3C-01: short toast only - arrival + "tap to view". No long line, no
    // second language stacked underneath.
    toastTitle.textContent = fillText(cardText('arrived'), { name: nameMain });
    toastSub.textContent = cardText('tapHint');
    lastToastDef = def;
    toastEl.classList.add('show');
    if (keepTimer) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove('show'); lastToastDef = null; }, TOAST_MS);
  }
  /** Phase 3F-07: outline the checklist item for 2.5 s so the eye finds it. */
  function highlightChecklist(id) {
    const e = itemEls[id];
    if (!e) return;
    for (const k in itemEls) itemEls[k].li.classList.remove('locate');
    e.li.classList.add('locate');
    if (locateTimer) clearTimeout(locateTimer);
    locateTimer = setTimeout(() => { e.li.classList.remove('locate'); }, 2500);
  }
  /** Phase 3F-07: toast for a minimap tap on an undiscovered landmark. */
  function showLocateToast(def) {
    if (!toastEl) return;
    const activeVI = lang.lang === 'vi';
    const nameMain = activeVI ? def.nameVI : def.nameEN;
    toastTitle.textContent = nameMain;
    toastSub.textContent = activeVI ? 'Chua kham pha - di toi do' : 'Not discovered yet - go there';
    lastToastDef = null; // not an arrival toast: a language switch must not re-word it
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove('show'); }, TOAST_MS);
  }

  // ---- minimap icons (Phase 3F-05) ---------------------------------------------------------------
  // Same tolerant fetch + Image pattern as atlasmap.js loadIcons: the JSON may
  // carry rects under icons / sprites / cells / frames, or as bare [x, y, w, h]
  // arrays. Any failure leaves iconImg null, so drawMinimap keeps the discs.
  // N3 fix (3F-05 verify): the icon fetch gets a 5 s timeout via
  // AbortController, so a hung network never leaves the numbered-disc
  // fallback on screen forever. On timeout the fetch rejects, the catch
  // below keeps iconImg null, and the discs stay as the working fallback.
  // Boot never waits for this: createLandmarks returns at once.
  function loadMinimapIcons() {
    if (headless || typeof fetch !== 'function') return;
    const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
    let ctrl = null;
    let timer = 0;
    try {
      if (typeof AbortController !== 'undefined') {
        ctrl = new AbortController();
        timer = setTimeout(() => { try { ctrl.abort(); } catch { /* already settled */ } }, 5000);
      }
    } catch { ctrl = null; }
    const fetchP = ctrl
      ? fetch(base + MM_ICON_URL + '.json', { signal: ctrl.signal })
      : fetch(base + MM_ICON_URL + '.json');
    fetchP.then((r) => (r.ok ? r.json() : null)).then((json) => {
      if (!json) return;
      const src = json.sprites || json.cells || json.icons || json.frames || json;
      const table = {};
      for (const name in src) {
        const v = src[name];
        const r = Array.isArray(v) ? v : v && (v.rect || v.frame || v);
        if (!r) continue;
        const rect = Array.isArray(r) ? r : [r.x, r.y, r.w ?? r.width, r.h ?? r.height];
        if (rect.length >= 4 && rect.every((n) => Number.isFinite(n))) table[name] = rect;
      }
      const img = new Image();
      img.onload = () => { iconTable = table; iconImg = img; drawMinimap(); };
      img.onerror = () => { iconImg = null; iconTable = null; };
      img.src = base + MM_ICON_URL + '.png';
    }).catch(() => { /* no sheet: the numbered-disc fallback stays */ })
      .then(() => { if (timer) { clearTimeout(timer); timer = 0; } }); // fetch settled: drop the 5 s timer
  }
  /** Draw a named icon glyph centred at (x, y). Returns false when the sheet has no such cell. */
  function drawIconGlyph(name, x, y) {
    const r = iconTable && iconTable[name];
    if (!r || !iconImg) return false;
    const k = MM_ICON_SIZE / Math.max(r[2], r[3]);
    mapCtx.drawImage(iconImg, r[0], r[1], r[2], r[3], x - (r[2] * k) / 2, y - (r[3] * k) / 2, r[2] * k, r[3] * k);
    return true;
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
        // Phase 3B: water cells read by tile, not by biome, so the two lakes show
        // in their own colours (Ho Guom green, Ho Tay blue) on the minimap.
        const spec = HANOI_LEGEND[HANOI_ROWS[cz + HANOI_OFFSET][cx + HANOI_OFFSET]];
        const water = spec ? WATER[spec.tileId] : null;
        mapCtx.fillStyle = water || GROUND[biome] || GROUND.heartland;
        mapCtx.fillRect(X(cx), Y(cz), s + 0.5, s + 0.5);
      });
    }
    // 3F-05 + 3F-06 + 3F-08: custom silhouette icons when the sheet has loaded,
    // numbered paper discs (3F-08) as the fallback while it loads or on error.
    // Discovered: filled icon (ink + terracotta). Not yet discovered: the
    // outline-only row of the same icon, no fill. Same function, only the
    // glyph source changes.
    for (let i = 0; i < LANDMARKS.length; i++) {
      const def = LANDMARKS[i];
      const x = X(def.cell[0]) + s / 2; const y = Y(def.cell[1]) + s / 2;
      const done = !!seen[def.id];
      if (drawIconGlyph('mm_' + def.id + (done ? '' : '_outline'), x, y)) continue;
      // Fallback disc (3F-08): solid terracotta + paper number when discovered,
      // paper disc + terracotta outline + terracotta number when not.
      mapCtx.beginPath();
      mapCtx.arc(x, y, 6, 0, Math.PI * 2);
      if (done) { mapCtx.fillStyle = TERRA; mapCtx.fill(); }
      else { mapCtx.fillStyle = PAPER; mapCtx.fill(); mapCtx.strokeStyle = TERRA; mapCtx.lineWidth = 1.5; mapCtx.stroke(); }
      mapCtx.fillStyle = done ? PAPER : TERRA;
      mapCtx.font = '700 8px Georgia, serif';
      mapCtx.textAlign = 'center';
      mapCtx.textBaseline = 'middle';
      mapCtx.fillText(String(i + 1), x, y + 0.5);
    }
    // 3F-07: north arrow (N) at the top-right corner of the minimap.
    const nx = W - 11;
    mapCtx.fillStyle = TERRA;
    mapCtx.beginPath();
    mapCtx.moveTo(nx, 4); mapCtx.lineTo(nx - 4, 12); mapCtx.lineTo(nx + 4, 12);
    mapCtx.closePath(); mapCtx.fill();
    mapCtx.fillStyle = INK;
    mapCtx.font = '700 9px Georgia, serif';
    mapCtx.textAlign = 'center';
    mapCtx.textBaseline = 'middle';
    mapCtx.fillText('N', nx, 17);
    const px = (traveller.position.x / TILE_SIZE - MAP_MIN + 0.5) * s;
    const py = (traveller.position.z / TILE_SIZE - MAP_MIN + 0.5) * s;
    const md = traveller.moveDir || { x: 0, z: -1 };
    const l = Math.hypot(md.x, md.z) || 1;
    mapCtx.strokeStyle = INK;
    mapCtx.lineWidth = 1.5;
    mapCtx.beginPath();
    mapCtx.moveTo(px, py);
    mapCtx.lineTo(px + (md.x / l) * 7, py + (md.z / l) * 7);
    mapCtx.stroke();
    mapCtx.beginPath();
    mapCtx.arc(px, py, 3.5, 0, Math.PI * 2);
    mapCtx.fillStyle = INK;
    mapCtx.fill();
    mapCtx.strokeStyle = PAPER;
    mapCtx.lineWidth = 1;
    mapCtx.stroke();
  }

  // ---- "!" marker + ground ring (Phase 3C-01/3C-02) ------------------------------------------------------
  // The nearest landmark within radius 1 of the traveller's cell (checklist order
  // breaks ties). Recomputed when the cell changes; the "!" is re-projected every
  // frame because the camera moves.
  function refreshNear(cx, cz) {
    nearDef = null;
    for (const def of LANDMARKS) {
      if (nearLandmark(def.id, cx, cz)) { nearDef = def.id; break; }
    }
    bangDef = nearDef;
    if (ringMesh) {
      if (nearDef) {
        const def = BY_ID[nearDef];
        ringMesh.position.set(def.cell[0] * TILE_SIZE, 0.03, def.cell[1] * TILE_SIZE);
        ringMesh.visible = true;
      } else {
        ringMesh.visible = false;
      }
    }
  }
  function projectBang() {
    if (!bangEl) return;
    const camera = ctx.follow && ctx.follow.camera;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
    if (!camera || !bangDef || !vw || !vh) {
      bangEl.classList.remove('show');
      stopBangBlink();
      return;
    }
    const def = BY_ID[bangDef];
    projV.set(def.cell[0] * TILE_SIZE, BANG_HEIGHT, def.cell[1] * TILE_SIZE);
    projV.project(camera);
    if (projV.z >= 1) { bangEl.classList.remove('show'); stopBangBlink(); return; }
    bangEl.style.left = ((projV.x * 0.5 + 0.5) * vw) + 'px';
    bangEl.style.top = ((-projV.y * 0.5 + 0.5) * vh) + 'px';
    bangEl.classList.add('show');
    startBangBlink();
  }
  // Phase 3C-01: the "!" blinks by a JS interval toggling opacity (no CSS keyframes
  // in index.html, per check-3d (a)). One timer while the marker shows, stopped
  // the moment it hides; cleared again in dispose().
  let bangTimer = 0;
  let bangDim = false;
  function startBangBlink() {
    if (bangTimer || !bangEl) return;
    bangTimer = setInterval(() => {
      if (!bangEl) return;
      bangDim = !bangDim;
      bangEl.style.opacity = bangDim ? '0.45' : '1';
    }, 600);
  }
  function stopBangBlink() {
    if (bangTimer) { clearInterval(bangTimer); bangTimer = 0; }
    bangDim = false;
    if (bangEl) bangEl.style.opacity = '';
  }

  // ---- discovery ----------------------------------------------------------------------------------------
  // Phase 3C-01: discovery only marks the landmark visited, toasts the short arrival
  // line and lets the "!" + ring appear. It NEVER opens the info card.
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
  loadMinimapIcons(); // Phase 3F-05: fetch the icon sheet; discs stay until it loads
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
        if (!headless) refreshNear(cx, cz);
      }
      // Phase 3C-06: NO walk-away close any more. An open card stays open until X,
      // a tap outside it, or another landmark's card opens.
      if (!headless) projectBang();
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
      if (typeof disposeTap === 'function') disposeTap();
      if (typeof disposeMapTap === 'function') disposeMapTap();
      if (locateTimer) { clearTimeout(locateTimer); locateTimer = 0; }
      stopBangBlink();
      if (ringMesh) {
        if (ctx.scene && typeof ctx.scene.remove === 'function') ctx.scene.remove(ringMesh);
        if (ringMesh.geometry) ringMesh.geometry.dispose();
        if (ringMesh.material) ringMesh.material.dispose();
        ringMesh = null;
      }
      if (bangEl) bangEl.classList.remove('show');
      if (typeof document !== 'undefined' && document.body) document.body.classList.remove('card-open');
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
    /** True when layer (b) "Doc them" is expanded on the open card. */
    infoExpanded() { return infoExpanded; },
    /** Ids of the discovered landmarks within radius 1 right now (co-discovery tabs). */
    nearby() { return nearDiscoveredIds(); },
    /** Id of the landmark the "!" marker points at, or null. */
    bangTarget() { return bangDef; },
    /** True when the ground ring is showing. */
    ringVisible() { return !!ringMesh && ringMesh.visible; },
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
