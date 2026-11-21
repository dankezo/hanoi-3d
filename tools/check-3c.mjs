// Phase 3C check: info card redesign (3C-01..3C-10).
// Run: node tools/check-3c.mjs (from the repo root). Exit 1 on any failure.
// Untracked helper for the coordinator to keep or drop; not part of the shipped game.
// No browser, no GPU: word limits are counted from the dataset, the card logic is
// exercised through a fake DOM (same pattern as check-2c), and the tap raycast runs
// against a real THREE.PerspectiveCamera. The 10-second read check (3C-10) is an
// estimate here (240 words per minute); the real read on a 390px phone is the
// user/verifier's job. No long dashes in this file: only short hyphens (-).
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createHanoi } from '../src/world/hanoi.js';
import { createLandmarks, LANDMARKS } from '../src/game/landmarks.js';
import { LANDMARK_INFO } from '../src/game/landmark-history.js';
import { TILE_SIZE } from '../src/core/config.js';

let pass = 0, fail = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (ok) pass++; else fail++;
};
const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
const hasLongDash = (s) => /[\u2013\u2014]/.test(s);
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const lmSrc = src('src/game/landmarks.js');
const htmlSrc = src('index.html');

// ---- 3C-04 / 3C-10: word limits on layer (a), all 11 landmarks x 2 languages ------------
const WPM = 240; // silent reading estimate for the 10-second check
const readSecs = {};
for (const def of LANDMARKS) {
  const info = LANDMARK_INFO[def.id];
  check(!!info, def.id + ': info exists');
  if (!info) continue;
  for (const [lang, sKey, fKey] of [['VI', 'summaryVI', 'funShortVI'], ['EN', 'summaryEN', 'funShortEN']]) {
    const s = info[sKey], f = info[fKey];
    check(typeof s === 'string' && s.length > 0, def.id + ' ' + lang + ': summary present');
    check(typeof f === 'string' && f.length > 0, def.id + ' ' + lang + ': short fun fact present');
    if (typeof s === 'string') check(words(s) <= 20, def.id + ' ' + lang + ': summary ' + words(s) + ' words (<= 20): "' + s + '"');
    if (typeof f === 'string') check(words(f) <= 15, def.id + ' ' + lang + ': fun fact ' + words(f) + ' words (<= 15): "' + f + '"');
  }
  // Layer (a) as shown: title + summary + fun heading + short fun fact + "Doc them".
  // Title words use the DISPLAYED title (the verified name from landmark-history.js,
  // not the shorter checklist name in landmarks.js NAMES).
  for (const [lang, name, sKey, fKey, funH, more] of [
    ['VI', info.nameVI, 'summaryVI', 'funShortVI', 'Dieu thu vi', 'Doc them'],
    ['EN', info.nameEN, 'summaryEN', 'funShortEN', 'Fun fact', 'Read more'],
  ]) {
    const total = words(name) + words(info[sKey]) + words(funH) + words(info[fKey]) + words(more);
    readSecs[def.id + '-' + lang] = +(total / (WPM / 60)).toFixed(1);
    check(readSecs[def.id + '-' + lang] <= 10, def.id + ' ' + lang + ': layer (a) ' + total + ' words, about ' + readSecs[def.id + '-' + lang] + ' s at ' + WPM + ' wpm (<= 10 s)');
  }
}
// History / fun fact / source are untouched (check-2b owns the exact match); here only
// the new fields must not have smuggled in a long dash or a diacritic.
const histSrc = src('src/game/landmark-history.js');
check(!hasLongDash(histSrc), 'landmark-history.js has no long dashes');
check(!/[^\x00-\x7F]/.test(histSrc), 'landmark-history.js is pure ASCII (no diacritics)');
check(!hasLongDash(lmSrc), 'landmarks.js has no long dashes');
check(!/[^\x00-\x7F]/.test(lmSrc), 'landmarks.js is pure ASCII');
check(!hasLongDash(htmlSrc), 'index.html has no long dashes');

// ---- 3C-01 / 3C-06: no auto-open in discover(), no walk-away close in update() ----------
{
  const disc = lmSrc.match(/function discover\(def\) \{[\s\S]*?\n  \}/);
  check(!!disc, 'discover() found in source');
  if (disc) check(!/showInfo/.test(disc[0]), '3C-01: discover() never calls showInfo (no auto-open)');
  const upd = lmSrc.match(/update\(dt\) \{[\s\S]*?\n    \},/);
  check(!!upd, 'update() found in source');
  if (upd) check(!/hideInfo/.test(upd[0]), '3C-06: update() never calls hideInfo (no walk-away close)');
  check(/TAP_MAX_PX = 10/.test(lmSrc) && /TAP_MAX_MS = 400/.test(lmSrc), '3C-01: tap rule is <10px and <400ms in source');
  check(/RingGeometry\(1\.85, 2\.0, 48\)/.test(lmSrc), '3C-02: ground ring is a THREE RingGeometry radius 1 tile (2.0 world units)');
  check(/card-open/.test(lmSrc) && /bottom: 62vh/.test(htmlSrc), '3C-07: toast lifts to 62vh while the card is open (body.card-open)');
}

// ---- 3C-03 / 3C-05 / 3C-08: card CSS + markup in index.html ------------------------------
check(/#lm-info-title \{ font-size: 20px;/.test(htmlSrc), '3C-05: card title is 20px bold');
check(/#lm-info-summary \{[^}]*font-size: 16px; line-height: 1\.6;/.test(htmlSrc), '3C-05: summary is 16px/1.6');
check(/#lm-info-body ul \{[^}]*font-size: 15px; line-height: 1\.6;/.test(htmlSrc), '3C-05: history text is 15px/1.6');
check(/#lm-info-body h3 \{[^}]*font-size: 12px;/.test(htmlSrc), '3C-05: section headings are 12px');
check(/max-height: 60vh/.test(htmlSrc), '3C-05: card max-height is 60vh');
check(/max-width: 360px/.test(htmlSrc), '3C-05: card max-width stays 360px');
check(/@media \(max-width: 500px\)/.test(htmlSrc), '3C-08: bottom-sheet media query at <= 500px');
check(/transition: transform 0\.25s ease-out, opacity 0\.25s ease-out/.test(htmlSrc), '3C-08: bottom sheet slides up in 250ms ease-out (transition, staged .in class)');
check(/#lm-info\.show\.in \{ transform: none; opacity: 1; \}/.test(htmlSrc), '3C-08: bottom sheet ends at its resting position (.in class)');
check(!/@keyframes/i.test(htmlSrc), '3C-08: index.html has no @keyframes at all (check-3d (a), Q12 plain % bar)');
check(/classList\.add\('in'\)/.test(lmSrc), '3C-08: landmarks.js stages the .in class for the sheet slide');
check(/id="lm-info-grip"/.test(htmlSrc), '3C-08: bottom sheet has a drag handle (#lm-info-grip)');
check(/id="lm-bang"/.test(htmlSrc), '3C-01: gold "!" marker element (#lm-bang) exists');
check(/id="lm-info-tabs"/.test(htmlSrc), '3C-09: co-discovery tab row (#lm-info-tabs) exists');
check(/id="lm-info-more"/.test(htmlSrc), '3C-04: "Doc them" button (#lm-info-more) exists');
check(/id="lm-info-lang"/.test(htmlSrc), '3C-03: in-card language toggle (#lm-info-lang) exists');
check(!/lm-info-title-vi/.test(htmlSrc) && !/lm-info-hist-vi/.test(htmlSrc), '3C-03: old stacked VI+EN card markup is gone from index.html');

// ---- fake DOM (same pattern as check-2c) -------------------------------------------------
function makeEl(tag = 'div') {
  const e = {
    tag, children: [], dataset: {}, style: {}, _cls: new Set(), _handlers: {}, _attrs: {},
    textContent: '', hidden: false,
    classList: {
      add: (...cs) => { cs.forEach((c) => e._cls.add(c)); },
      remove: (...cs) => { cs.forEach((c) => e._cls.delete(c)); },
      toggle: (c, force) => { const on = force === undefined ? !e._cls.has(c) : !!force; if (on) e._cls.add(c); else e._cls.delete(c); return on; },
      contains: (c) => e._cls.has(c),
    },
    appendChild(c) { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); e.children.push(c); return c; },
    append(...cs) { cs.forEach((c) => e.appendChild(c)); return e; },
    removeChild(c) { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); return c; },
    addEventListener(n, fn) { (e._handlers[n] = e._handlers[n] || []).push(fn); },
    removeEventListener(n, fn) { if (e._handlers[n]) e._handlers[n] = e._handlers[n].filter((f) => f !== fn); },
    setAttribute(k, v) { e._attrs[k] = v; },
    getAttribute(k) { return e._attrs[k]; },
    getContext() { return new Proxy({}, { get: (t, k) => (...a) => {}, set: () => true }); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 390, height: 844, right: 390, bottom: 844 }; },
    click(ev) { (e._handlers.click || []).forEach((f) => f(ev || { stopPropagation() {} })); },
    fire(n, ev) { (e._handlers[n] || []).forEach((f) => f(ev || {})); },
  };
  Object.defineProperty(e, 'firstChild', { get() { return e.children[0] || null; } });
  e.width = 200; e.height = 200;
  return e;
}
const DOM_IDS = ['lm-list', 'lm-items', 'lm-count', 'lm-toast', 'lm-map', 'lm-info', 'lm-info-head', 'lm-info-x',
  'lm-info-title', 'lm-info-summary', 'lm-info-fun-h', 'lm-info-fun-short', 'lm-info-more', 'lm-info-details',
  'lm-info-hist-h', 'lm-info-hist', 'lm-info-fun-full-h', 'lm-info-fun-full', 'lm-info-src', 'lm-info-body',
  'lm-info-tabs', 'lm-info-lang', 'lm-info-lang-vi', 'lm-info-lang-en', 'lm-bang', 'atlas',
  'lm-title', 'lm-privacy', 'hint', 'lm-lang', 'lm-lang-vi', 'lm-lang-en', 'lm-head', 'lm-caret'];
class Mem {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
}
let ids;
function freshDom() {
  ids = {};
  for (const id of DOM_IDS) ids[id] = makeEl();
  const winHandlers = {};
  globalThis.document = {
    getElementById: (id) => ids[id] || null,
    createElement: (tag) => makeEl(tag),
    createTextNode: (t) => ({ textContent: t, nodeType: 3 }),
    body: makeEl('body'),
    hidden: false,
    addEventListener() {}, removeEventListener() {},
  };
  globalThis.window = {
    innerWidth: 390, innerHeight: 844,
    addEventListener(n, fn) { (winHandlers[n] = winHandlers[n] || []).push(fn); },
    removeEventListener(n, fn) { if (winHandlers[n]) winHandlers[n] = winHandlers[n].filter((f) => f !== fn); },
    fire(n, ev) { (winHandlers[n] || []).forEach((f) => f(ev || {})); },
  };
  return ids;
}

freshDom();
const hanoi = createHanoi({ seed: 1 });
// Real camera looking at the map centre from the south-east, so the tap raycast is real.
const camera = new THREE.PerspectiveCamera(50, 390 / 844, 0.1, 100);
camera.position.set(0, 10, 14);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld(true);
const scene = { added: null, add(m) { this.added = m; }, remove() { this.added = null; } };
const traveller = { position: { x: 0, z: 0 }, moveDir: { x: 0, z: -1 } };
let clearCalls = 0;
const lm = createLandmarks({
  traveller, progress: { eachCell() {} }, wfc: hanoi, seed: 1, persist: false, game: { armed: true },
  storage: new Mem(), fetchImpl: null, navigatorLanguage: '',
  scene, follow: { camera }, controls: { clearTarget() { clearCalls++; } },
});
const at = (cx, cz) => { traveller.position.x = cx * TILE_SIZE; traveller.position.z = cz * TILE_SIZE; };
// Screen point of a ground cell (project the ground anchor, so the raycast lands back on it).
const screenOf = (cx, cz) => {
  const v = new THREE.Vector3(cx * TILE_SIZE, 0, cz * TILE_SIZE).project(camera);
  return { x: (v.x * 0.5 + 0.5) * 390, y: (-v.y * 0.5 + 0.5) * 844 };
};
const tapAt = (cx, cz) => {
  const p = screenOf(cx, cz);
  ids.atlas.fire('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 1 });
  globalThis.window.fire('pointerup', { clientX: p.x, clientY: p.y, pointerId: 1 });
};
const tapScreen = (x, y) => {
  ids.atlas.fire('pointerdown', { clientX: x, clientY: y, pointerId: 1 });
  globalThis.window.fire('pointerup', { clientX: x, clientY: y, pointerId: 1 });
};

// ---- 3C-01: discovery toasts but never opens the card; "!" + ring appear ---------------
at(0, 0); // within radius 1 of Hoan Kiem anchor (-1,-1)
lm.update(0.016);
check(lm.visited('hoankiem'), '3C-01: Hoan Kiem discovered from (0,0)');
check(lm.infoOpen() === null, '3C-01: discovery does NOT open the card (infoOpen null)');
check(!ids['lm-info'].classList.contains('show'), '3C-01: card has no show class after discovery');
check(ids['lm-toast'].classList.contains('show'), '3C-01: short toast shows on discovery');
check(ids['lm-toast'].children[0].textContent === 'Da den Ho Hoan Kiem', '3C-01: toast title is "Da den Ho Hoan Kiem", got "' + ids['lm-toast'].children[0].textContent + '"');
check(ids['lm-toast'].children[1].textContent === 'Bam de xem', '3C-01: toast sub is "Bam de xem"');
check(lm.bangTarget() === 'hoankiem', '3C-01: "!" points at hoankiem in radius 1');
check(ids['lm-bang'].classList.contains('show'), '3C-01: "!" marker is shown');
check(ids['lm-bang'].style.left !== undefined && ids['lm-bang'].style.left !== '', '3C-01: "!" marker is positioned on screen (' + ids['lm-bang'].style.left + ', ' + ids['lm-bang'].style.top + ')');
check(lm.ringVisible(), '3C-02: ground ring is visible in radius 1');
check(scene.added !== null, '3C-02: ring mesh was added to the scene');
at(15, 15);
lm.update(0.016);
check(lm.bangTarget() === null, '3C-01: "!" hides far from every landmark');
check(!ids['lm-bang'].classList.contains('show'), '3C-01: "!" marker has no show class far away');
check(!lm.ringVisible(), '3C-02: ground ring vanishes outside radius 1');

// ---- 3C-01: tap on the landmark opens the card (and cancels the walk) ------------------
at(0, 0);
lm.update(0.016);
clearCalls = 0;
tapAt(-1, -1); // tap the Hoan Kiem anchor cell
check(lm.infoOpen() === 'hoankiem', '3C-01: tap on the landmark opens its card');
check(ids['lm-info'].classList.contains('show'), '3C-01: card has show class after tap');
check(clearCalls === 1, '3C-01: landmark tap cancels the walk (controls.clearTarget called once)');
check(ids['lm-info-title'].textContent === 'Ho Hoan Kiem', '3C-03: card shows the VI name only, got "' + ids['lm-info-title'].textContent + '"');
check(ids['lm-info-summary'].textContent === LANDMARK_INFO.hoankiem.summaryVI, '3C-04: layer (a) shows the VI summary');
check(ids['lm-info-fun-short'].textContent === LANDMARK_INFO.hoankiem.funShortVI, '3C-04: layer (a) shows the short VI fun fact');
check(ids['lm-info-details'].hidden === true, '3C-04: layer (b) is hidden by default');
check(ids['lm-info-more'].textContent === 'Doc them', '3C-04: "Doc them" button shows by default');
check(ids['lm-info-tabs'].hidden === true, '3C-09: no tabs when only 1 landmark is near');
check(globalThis.document.body.classList.contains('card-open'), '3C-07: body has card-open while the card is open (toast lifts)');

// ---- 3C-04: "Doc them" reveals history + full fun fact + source -------------------------
ids['lm-info-more'].click();
check(lm.infoExpanded(), '3C-04: "Doc them" expands layer (b)');
check(ids['lm-info-details'].hidden === false, '3C-04: details are visible after "Doc them"');
check(ids['lm-info-hist'].children.length === 3, '3C-04: layer (b) shows 3 history lines, got ' + ids['lm-info-hist'].children.length);
check(ids['lm-info-hist'].children[0].textContent === LANDMARK_INFO.hoankiem.histVI[0], '3C-04: first history line is the verified VI line');
check(ids['lm-info-fun-full'].textContent === LANDMARK_INFO.hoankiem.funVI, '3C-04: layer (b) shows the full VI fun fact');
check(ids['lm-info-src'].textContent.startsWith('Nguon: '), '3C-04: source link is last, labelled "Nguon: ..."');
check(ids['lm-info-more'].textContent === 'Thu gon', '3C-04: button becomes "Thu gon" when expanded');
ids['lm-info-more'].click();
check(!lm.infoExpanded() && ids['lm-info-details'].hidden === true, '3C-04: "Thu gon" collapses back to layer (a)');

// ---- 3C-03: in-card toggle switches language at once, card stays open ------------------
ids['lm-info-more'].click(); // expand again, so the re-render must keep the state
ids['lm-info-lang'].click();
check(lm.lang() === 'en', '3C-03: in-card toggle switches to EN');
check(ids['lm-info-title'].textContent === 'Hoan Kiem Lake', '3C-03: title is EN after toggle, card still open');
check(ids['lm-info-summary'].textContent === LANDMARK_INFO.hoankiem.summaryEN, '3C-03: summary is EN after toggle');
check(ids['lm-info'].classList.contains('show'), '3C-03: card stays open across the toggle');
check(lm.infoExpanded(), '3C-03: expanded state survives the language toggle');
ids['lm-info-lang'].click();
check(lm.lang() === 'vi' && ids['lm-info-title'].textContent === 'Ho Hoan Kiem', '3C-03: toggle back to VI re-words the card');

// ---- 3C-06: walking away does NOT close the card ---------------------------------------
at(15, 15);
lm.update(0.016);
check(lm.infoOpen() === 'hoankiem', '3C-06: card stays open after walking far away');
check(ids['lm-info'].classList.contains('show'), '3C-06: card still has show class far away');

// ---- 3C-06: tap outside the card (on the canvas) closes it -----------------------------
tapScreen(20, 20); // empty screen corner, no landmark there
check(lm.infoOpen() === null, '3C-06: tap outside the card closes it');
check(!globalThis.document.body.classList.contains('card-open'), '3C-07: body card-open is removed when the card closes');

// ---- 3C-01: a drag does NOT open a card -------------------------------------------------
at(0, 0);
lm.update(0.016);
{
  const p = screenOf(-1, -1);
  ids.atlas.fire('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 1 });
  globalThis.window.fire('pointerup', { clientX: p.x + 50, clientY: p.y, pointerId: 1 });
}
check(lm.infoOpen() === null, '3C-01: a 50px drag does not open the card');

// ---- 3C-09: co-discovery - two landmarks near (6,-1) show two tabs --------------------
at(6, -1);
lm.update(0.016);
check(lm.visited('ngocson') && lm.visited('cathedral'), '3C-09: both Ngoc Son and Cathedral discovered from (6,-1)');
check(JSON.stringify(lm.nearby()) === JSON.stringify(['ngocson', 'cathedral']), '3C-09: nearby() is [ngocson, cathedral], got ' + JSON.stringify(lm.nearby()));
tapAt(5, -2); // tap the Ngoc Son anchor cell
check(lm.infoOpen() === 'ngocson', '3C-09: tap opens Ngoc Son');
check(ids['lm-info-tabs'].hidden === false, '3C-09: tab row shows when 2 landmarks are near');
check(ids['lm-info-tabs'].children.length === 2, '3C-09: tab row has 2 buttons, got ' + ids['lm-info-tabs'].children.length);
check(ids['lm-info-tabs'].children[0].textContent === 'Den Ngoc Son', '3C-09: first tab is Den Ngoc Son');
check(ids['lm-info-tabs'].children[1].textContent === 'Nha Tho Lon', '3C-09: second tab is Nha Tho Lon');
ids['lm-info-tabs'].children[1].click();
check(lm.infoOpen() === 'cathedral', '3C-09: tapping the second tab switches the card to Cathedral');
check(ids['lm-info-title'].textContent === 'Nha Tho Lon Ha Noi', '3C-09: card title is Nha Tho Lon Ha Noi after the tab switch');
check(ids['lm-info-tabs'].children[1].classList.contains('on'), '3C-09: the active tab is marked on');

// ---- X closes; checklist tap re-opens ---------------------------------------------------
ids['lm-info-x'].click({ stopPropagation() {} });
check(lm.infoOpen() === null, '3C-06: X closes the card');
{
  const li = ids['lm-items'].children[0]; // hoankiem, discovered
  li.click();
}
check(lm.infoOpen() === 'hoankiem', '3C-01: checklist tap re-opens the card');
lm.settle();
check(lm.infoOpen() === null, 'settle() still closes the card');
lm.dispose();

console.log('--- 3C-10 read-time estimates (layer (a), ' + WPM + ' wpm) ---');
for (const [k, v] of Object.entries(readSecs)) console.log(k + ': about ' + v + ' s');
console.log(fail === 0 ? 'ALL 3C CHECKS PASSED (' + pass + ' PASS)' : fail + ' CHECK(S) FAILED (' + pass + ' PASS, ' + fail + ' FAIL)');
process.exit(fail === 0 ? 0 : 1);
