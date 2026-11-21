// Phase 3D checks (node tools/check-3d.mjs). No browser, no GPU: the loading
// screen, tier, crash flag and pixScale logic are unit-tested with mocked
// frame times and fake storage/DOM, and the loader wiring is checked by
// reading the source. Covers: (a) loading screen markup (% >= 48px, paper
// background, scaleX bar), (b) milestones 5/20/45/70/90/100 tied to real
// jobs, (c) tiles.glb IS fetched in Hanoi mode again (3D-02 rollback) +
// the stock-cell reason (1321 of 1600 cells use stock models),
// (d) real GLB/texture progress, (e) device tier from RAM/cores/screen
// (no user-agent sniffing), (f) crash flag downgrade + B1 persist of the
// lowered level to hanoi:quality, (g) pixScale steps,
// 15% rebuild bar and the 2 s anti-fight rule, (h) ?fps=1 worst frame +
// resolution %, (i) animals deferred after the first frame with a 2.5 s
// fade-in, (j) first-load MB before/after from real on-disk file sizes.
// No long dashes in this file: only short hyphens (-).
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  QUALITY_KEY, createQualityScaler, createFpsReadout, createPixScale,
  resolveInitialQuality, resolveDeviceTier, deviceTierLabel,
  readStoredQuality, CRASH_KEY, CRASH_SURVIVE_MS,
  markBootStart, markBootSurvived, hadCrash, downgradeForCrash,
  persistDowngradedQuality,
  PIXSCALE_MIN, PIXSCALE_MAX, PIXSCALE_STEP, PIXSCALE_REBUILD,
} from '../src/render/quality-scaler.js';
import { HANOI_ROWS, HANOI_LEGEND } from '../src/world/hanoi-map.js';
import { HANOI_MODEL_IDS } from '../src/world/hanoi-models.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; failures.push(name); console.log('FAIL: ' + name); }
}
const src = (p) => readFileSync(join(ROOT, p), 'utf8');
const hasLongDash = (s) => /[\u2013\u2014]/.test(s);

class Mem {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
function feed(scaler, fps, seconds) {
  const dt = 1000 / fps;
  const seen = [];
  const n = Math.round(seconds * fps);
  for (let i = 0; i < n; i++) {
    const r = scaler.tick(dt);
    if (r.changed) seen.push(scaler.level);
  }
  return seen;
}
// Fake minimal DOM for the FPS readout: only createElement + body.appendChild.
function fakeDoc() {
  const els = [];
  return {
    els,
    createElement() { const el = { textContent: '', remove() { } }; els.push(el); return el; },
    body: { appendChild() { } },
  };
}

const html = src('index.html');
const main = src('src/main.js');
const loader = src('src/assets/loader.js');
const animals = src('src/life/animals.js');
const scalerSrc = src('src/render/quality-scaler.js');
const rendererSrc = src('src/render/renderer.js');
// Phase 3B: the living manifest is now the 3B one (3D numbers superseded).
const manifest = src('docs/phase-3b-manifest.md');

// ---- (a) loading screen markup ------------------------------------------------
check('(a) loading overlay #load exists in index.html', html.includes('id="load"'));
check('(a) overlay background is paper cream #efe0c2', /#load \{[^}]*background: #efe0c2/s.test(html));
check('(a) overlay text is brown #5a3a28', /#load \{[^}]*color: #5a3a28/s.test(html));
{
  const m = html.match(/#load-pct \{[^}]*font-size: (\d+)px/s);
  check('(a) big % is at least 48px (found ' + (m ? m[1] : '?') + 'px)', !!m && Number(m[1]) >= 48);
}
check('(a) bar fill uses scaleX from the left', /#load-fill \{[^}]*transform: scaleX\(0\)[^}]*transform-origin: left center/s.test(html));
check('(a) bar moves on a transform transition (compositor)', /#load-fill \{[^}]*transition: transform [^;}]+/s.test(html));
check('(a) status + device + slow lines exist', html.includes('id="load-status"') && html.includes('id="load-device"') && html.includes('id="load-slow"'));
check('(a) no book-open animation (Q12: plain % bar)', !/@keyframes/i.test(html) && !/#load[^{]*\{[^}]*animation:/s.test(html));
check('(a) main.js sets the device line from the device tier', main.includes("deviceTierLabel(deviceTier)"));
check('(a) main.js hides the overlay only after the first frame', main.includes("setLoad(100, 'Xong!')") && main.includes('hideLoad()'));

// ---- (b) milestones tied to real jobs ------------------------------------------
check('(b) milestone 5% "Chuan bi..." exists in main.js', main.includes("setLoad(5, 'Chuan bi...')"));
check('(b) milestone 20% "Tai ban do..." exists in main.js', main.includes("setLoad(20, 'Tai ban do...')"));
check('(b) texture progress runs 45-65% as "Dung nha ong..."', main.includes("45 + r.stageFraction * 20, 'Dung nha ong...'"));
check('(b) milestone 70% "Ve ho..." exists in main.js', main.includes("setLoad(70, 'Ve ho...')"));
check('(b) milestone 90% "Dang gap giay..." exists in main.js', main.includes("setLoad(90, 'Dang gap giay...')"));
check('(b) milestone 100% "Xong!" exists in main.js', main.includes("setLoad(100, 'Xong!')"));
check('(b) GLB progress maps to 20-45%', main.includes('20 + r.stageFraction * 25'));
check('(b) slow-load timer is 8 s', main.includes('}, 8000);'));
check('(b) slow line names the file waited on', main.includes('lastLoadFile'));

// ---- (c) tiles.glb IS fetched in Hanoi mode (3D-02 rollback) ----------------
// Rollback 2026-11-21: the Phase 3D gate that skipped tiles.glb in Hanoi
// mode was wrong - 1321 of 1600 Hanoi cells use stock models from
// tiles.glb, so skipping it turned 83% of the map into flat placeholders.
// Only basic-grand.glb stays gated on NOT Hanoi (Hanoi uses none of its
// 6 grand buildings). Counts updated by Phase 3B (was 1504 stock / 96 Hanoi in 3A, 1543 / 57 before that).
check('(c) tiles.glb load is NOT gated on Hanoi (fetched in both modes)', !/if \(!hanoi\) glbJobs\.push\(\{ key: 'tiles'/.test(loader) && /glbJobs\.push\(\{ key: 'tiles', url: A\.tilesUrl/.test(loader));
check('(c) basic-grand.glb load is gated on NOT Hanoi', /if \(!hanoi\) glbJobs\.push\(\{ key: 'basicGrand'/.test(loader));
check('(c) hanoi-tiles.glb load is gated on Hanoi', /if \(hanoi\) glbJobs\.push\(\{ key: 'hanoiTiles'/.test(loader));
check('(c) no unconditional loadGLTF(A.tilesUrl) remains', !/loadGLTF\(A\.tilesUrl\)/.test(loader));
check('(c) loader still loads tiles.glb off Hanoi (WFC path unchanged)', loader.includes("url: A.tilesUrl"));
{
  // Why tiles.glb must be fetched in Hanoi mode: how many Hanoi cells
  // use stock models from it (1321) vs Hanoi-only models (279).
  const hanoiSet = new Set(HANOI_MODEL_IDS);
  let stock = 0; let hanoiCells = 0; const stockIds = new Set();
  for (const row of HANOI_ROWS) for (const ch of row) {
    const e = HANOI_LEGEND[ch];
    if (!e) continue;
    if (hanoiSet.has(e.tileId)) hanoiCells++;
    else { stock++; stockIds.add(e.tileId); }
  }
  check('(c) Hanoi map counted: 1600 cells total', HANOI_ROWS.length === 40 && HANOI_ROWS[0].length === 40);
  check('(c) stock-model cells need tiles.glb GLB art (found ' + stock + ')', stock === 1321);
  check('(c) Hanoi-only cells keep GLB art (found ' + hanoiCells + ')', hanoiCells === 279);
  check('(c) manifest records the 1321 stock cells', manifest.includes('1321'));
  check('(c) manifest records the 3D-02 rollback', manifest.includes('ROLLBACK'));
  check('(c) stock ids used in Hanoi are listed in the manifest', [...stockIds].every((id) => manifest.includes(id)));
}

// ---- (d) real progress ----------------------------------------------------------
check('(d) loadAssets accepts onProgress', loader.includes('onProgress = null'));
check('(d) GLTFLoader gets the progress callback', loader.includes('loadAsync(url, onProgress)'));
check('(d) TextureLoader gets the progress callback', loader.includes('loadAsync(url, onProgress)'));
check('(d) stage tracker weights jobs by expected bytes', loader.includes('stageTracker') && loader.includes('GLB_BYTES'));
check('(d) meta fetch is marked as a fake milestone (MOC GIA)', loader.includes('MOC GIA'));
check('(d) main.js maps loader stages to % ranges', main.includes("r.stage === 'glb'") && main.includes("r.stage === 'textures'"));

// ---- (e) device tier (3D-05) -----------------------------------------------------
check('(e) no user-agent sniffing in the scaler', !/userAgent/i.test(scalerSrc));
{
  const phone = (mem, cores, w, h) => ({ matchMedia: () => ({ matches: true }), navigator: { deviceMemory: mem, hardwareConcurrency: cores, maxTouchPoints: 5 }, screen: { width: w, height: h } });
  const desktop = (mem, cores) => ({ matchMedia: () => ({ matches: false }), navigator: { deviceMemory: mem, hardwareConcurrency: cores, maxTouchPoints: 0 }, screen: { width: 1920, height: 1080 } });
  check('(e) weak phone (4 GB RAM) starts low', resolveDeviceTier(phone(4, 8, 390, 844)).level === 'low');
  check('(e) weak phone (4 cores) starts low', resolveDeviceTier(phone(8, 4, 390, 844)).level === 'low');
  check('(e) narrow phone (360px side) starts low', resolveDeviceTier(phone(8, 8, 360, 800)).level === 'low');
  check('(e) other phone starts med', resolveDeviceTier(phone(8, 8, 390, 844)).level === 'med');
  check('(e) weak desktop (4 GB RAM) starts med', resolveDeviceTier(desktop(4, 8)).level === 'med');
  check('(e) strong desktop starts high', resolveDeviceTier(desktop(8, 8)).level === 'high');
  check('(e) unknown memory is not treated as low', resolveDeviceTier({ matchMedia: () => ({ matches: false }), navigator: { hardwareConcurrency: 8, maxTouchPoints: 0 }, screen: { width: 1920, height: 1080 } }).level === 'high');
  check('(e) device line reads "Dien thoai - Medium"', deviceTierLabel({ kind: 'phone', level: 'med' }) === 'Dien thoai - Medium');
  check('(e) device line reads "May tinh - High"', deviceTierLabel({ kind: 'desktop', level: 'high' }) === 'May tinh - High');
}
{
  check('(e) forced ?quality= beats stored and tier', resolveInitialQuality({ forced: 'high', stored: 'low', fallback: 'low' }) === 'high');
  check('(e) stored level beats the device tier', resolveInitialQuality({ stored: 'low', fallback: 'high' }) === 'low');
  check('(e) device tier is the fallback when nothing else is set', resolveInitialQuality({ fallback: 'low' }) === 'low');
  check('(e) old touch rule still works without a tier', resolveInitialQuality({ touch: true }) === 'med' && resolveInitialQuality({ touch: false }) === 'high');
}

// ---- (f) crash flag (3D-06) -------------------------------------------------------
check('(f) crash key is hanoi:crash', CRASH_KEY === 'hanoi:crash');
check('(f) survive window is 15000 ms', CRASH_SURVIVE_MS === 15000);
{
  const store = new Mem();
  check('(f) no flag on a fresh device', hadCrash(store) === false);
  markBootStart(store);
  check('(f) boot sets the flag', hadCrash(store) === true);
  markBootSurvived(store);
  check('(f) surviving 15 s clears the flag', hadCrash(store) === false);
  markBootStart(store);
  check('(f) flag survives a reload (crash) until cleared', hadCrash(store) === true);
  check('(f) crash drops high -> med', JSON.stringify(downgradeForCrash('high')) === JSON.stringify({ level: 'med', downgraded: true, atLow: false }));
  check('(f) crash drops med -> low', downgradeForCrash('med').level === 'low' && downgradeForCrash('med').downgraded === true);
  check('(f) crash at low reports atLow (no level below low)', downgradeForCrash('low').atLow === true && downgradeForCrash('low').downgraded === false);
  check('(f) main.js shows the downgrade on the loading screen', main.includes('crashNote') && main.includes('load-note'));
  check('(f) main.js sets the flag at boot start', main.includes('markBootStart(storage)'));
  check('(f) main.js clears the flag after 15 s', main.includes('markBootSurvived(storage), CRASH_SURVIVE_MS'));
  check('(f) main.js also clears the flag on a clean pagehide', main.includes("addEventListener('pagehide'"));
}
{
  // B1 (verifier blocker): the crash-downgraded level must be PERSISTED to
  // hanoi:quality right away, or the next boot re-reads the old stored level
  // and crashes at it again forever (stored high -> med -> high -> med...,
  // never reaching low). The old section (f) above only tested the pure
  // downgradeForCrash function, so it could not catch this. These checks
  // test the real boot sequence end to end with fake storage, plus a static
  // check that main.js actually calls the persist inside its downgrade branch.
  const store = new Mem();
  store.setItem(QUALITY_KEY, 'high');
  markBootStart(store); // boot 1 at high, crashes before 15 s: flag stays set
  const boot2 = downgradeForCrash(readStoredQuality(store));
  persistDowngradedQuality(store, boot2.level);
  check('(f/B1) crash at stored high persists med to storage', readStoredQuality(store) === 'med');
  check('(f/B1) boot 2 starts at the persisted med, not the old high', resolveInitialQuality({ stored: readStoredQuality(store) }) === 'med');
  markBootStart(store); // boot 2 at med, crashes again: flag stays set
  const boot3 = downgradeForCrash(readStoredQuality(store));
  persistDowngradedQuality(store, boot3.level);
  check('(f/B1) a second crash persists low to storage (no med loop)', readStoredQuality(store) === 'low');
  check('(f/B1) boot 3 starts at the persisted low', resolveInitialQuality({ stored: readStoredQuality(store) }) === 'low');
  check('(f/B1) persist ignores a bad level and a null storage (never throws)', (() => {
    const s = new Mem();
    persistDowngradedQuality(s, 'ultra');
    persistDowngradedQuality(null, 'med');
    return readStoredQuality(s) === null;
  })());
  check('(f/B1) persist writes the same hanoi:quality key the scaler uses', (() => {
    const s = new Mem();
    persistDowngradedQuality(s, 'med');
    return s.getItem(QUALITY_KEY) === 'med' && s.getItem('hanoi:quality') === 'med';
  })());
  // Static: the save must sit INSIDE the crash-downgrade branch of main.js,
  // between the downgrade call and markBootStart. On the old code this slice
  // held no save at all, so this check FAILS on the old code by design.
  const branch = main.slice(main.indexOf('downgradeForCrash(quality)'), main.indexOf('markBootStart(storage)'));
  check('(f/B1) main.js saves the lowered level inside the crash-downgrade branch', branch.includes('persistDowngradedQuality(storage, down.level)'));
  check('(f/B1) the save branch only runs when no ?quality= is forced', main.includes('if (crashedLastTime && forcedQuality === null)'));
}

// ---- (g) pixScale (3D-07) ----------------------------------------------------------
check('(g) pixScale floor is 0.5, ceiling 1.0, step 0.1', PIXSCALE_MIN === 0.5 && PIXSCALE_MAX === 1.0 && PIXSCALE_STEP === 0.1);
check('(g) rebuild bar is 15%', PIXSCALE_REBUILD === 0.15);
{
  const applied = [];
  const px = createPixScale({ onApply: (v) => applied.push(v), onLog: () => { } });
  check('(g) starts at full resolution (1.0)', px.value === 1 && px.percent === 100);
  let r = px.tick(1000, 20, Infinity);
  check('(g) slow 1 s: target drops to 0.9 but no rebuild under 15%', px.target === 0.9 && r.changed === false && px.value === 1);
  r = px.tick(1000, 20, Infinity);
  check('(g) slow 2 s: target 0.8 rebuilds (20% move)', r.changed === true && px.value === 0.8 && applied[0] === 0.8);
  r = px.tick(1000, 20, Infinity);
  check('(g) slow 3 s: target 0.7, no rebuild (12.5% move)', px.target === 0.7 && r.changed === false && px.value === 0.8);
  r = px.tick(1000, 20, Infinity);
  check('(g) slow 4 s: target 0.6 rebuilds (25% move)', r.changed === true && px.value === 0.6);
  for (let i = 0; i < 10; i++) px.tick(1000, 20, Infinity);
  check('(g) floor clamps at 0.5', px.target === 0.5 && px.value === 0.5);
  for (let i = 0; i < 12; i++) px.tick(1000, 70, Infinity);
  check('(g) fast frames climb back to 1.0', px.target === 1 && px.value === 1);
  check('(g) onApply saw every rebuild in order', JSON.stringify(applied) === JSON.stringify([0.8, 0.6, 0.5, 0.6, 0.7, 0.9, 1]));
}
{
  // Anti-fight: no pixScale move within 2 s of a scaler preset step.
  const px = createPixScale({ onLog: () => { } });
  const r1 = px.tick(1000, 20, 500);
  check('(g) blocked 0.5 s after a preset step', px.target === 1 && r1.changed === false);
  const r2 = px.tick(1000, 20, 1999);
  check('(g) still blocked 1.999 s after a preset step', px.target === 1 && r2.changed === false);
  px.tick(1000, 20, 2000);
  check('(g) allowed exactly 2 s after a preset step', px.target === 0.9);
  const px2 = createPixScale({ onLog: () => { } });
  check('(g) null EMA never moves pixScale', px2.tick(1000, null, Infinity).changed === false && px2.target === 1);
  check('(g) renderer multiplies the pixel ratio by pixScale', rendererSrc.includes('effectiveMaxDpr(qLevel)) * pixScale') && rendererSrc.includes('setPixScale'));
  check('(g) main.js ticks pixScale with the scaler EMA + msSinceStep', main.includes('pixScale.tick(dt * 1000, scaler.emaFps, scaler.msSinceStep)'));
  check('(g) pixScale apply rebuilds through resize()', main.includes('setRendererPixScale(v); resize()'));
}
{
  // The scaler still steps (regression guard for the msSinceStep addition).
  const s = createQualityScaler({ level: 'high', storage: new Mem(), logEveryMs: 0 });
  const seen = feed(s, 30, 12);
  check('(g) scaler still steps high -> med -> low at 30 FPS', JSON.stringify(seen) === JSON.stringify(['med', 'low']));
  check('(g) scaler exposes msSinceStep (Infinity before any step)', (() => {
    const s2 = createQualityScaler({ level: 'high', storage: new Mem(), logEveryMs: 0 });
    return s2.msSinceStep === Infinity;
  })());
  check('(g) msSinceStep resets to ~0 right after a step', (() => {
    const s3 = createQualityScaler({ level: 'high', storage: new Mem(), logEveryMs: 0 });
    for (let i = 0; i < 30 * 12; i++) { const r = s3.tick(1000 / 30); if (r.changed) return s3.msSinceStep < 100; }
    return false;
  })());
}

// ---- (h) ?fps=1 worst frame + resolution % (3D-09) ---------------------------------
{
  const doc = fakeDoc();
  const ro = createFpsReadout({ enabled: true, doc });
  check('(h) readout is off by default (null, no element)', createFpsReadout({ enabled: false }) === null);
  ro.update(60, 'high', 1000);
  check('(h) plain update still reads "fps 60 high"', doc.els[0].textContent === 'fps 60 high');
  ro.update(60, 'high', 2000, { worstMs: 34, pixPct: 80 });
  check('(h) extra update adds worst frame + resolution %', doc.els[0].textContent === 'fps 60 high worst 34ms res 80%');
  check('(h) main.js tracks the worst frame of the last second', main.includes('worstMs') && main.includes('worstWindowStart'));
  check('(h) main.js passes worst + pixPct to the readout', main.includes('{ worstMs, pixPct:'));
}

// ---- (i) animals deferred + fade-in (3D-03) -----------------------------------------
check('(i) main.js no longer awaits animals.ready before the loop', !main.includes('await animals.ready'));
check('(i) animals fade-in constant is 2.5 s', /const FADE_IN_S = 2\.5;/.test(animals));
check('(i) fade ramps in update()', animals.includes('fadeK = Math.min(1, fadeK + dt / FADE_IN_S)'));
check('(i) fade scales every card in write()', animals.includes('* fadeK; // pop:'));
check('(i) spawn table untouched (no change to specsFor / spawns)', animals.includes('function specsFor(cx, cz)'));

// ---- (j) first-load MB before/after, from real on-disk sizes -------------------------
function mb(n) { return n / 1000000; }
const texManifest = JSON.parse(readFileSync(join(ROOT, 'public/textures/manifest.json'), 'utf8'));
const texFiles = new Map(); // distinct file -> bytes
for (const key of Object.keys(texManifest)) {
  const e = texManifest[key];
  if (!e || !e.file) continue;
  if (!texFiles.has(e.file)) texFiles.set(e.file, e.bytes || statSync(join(ROOT, 'public/textures', e.file)).size);
}
let texBytes = 0;
for (const v of texFiles.values()) texBytes += v;
const sizeOf = (p) => statSync(join(ROOT, p)).size;
const before = sizeOf('public/models/tiles.glb') + sizeOf('public/models/hanoi-tiles.glb') + sizeOf('public/models/traveller.glb')
  + texBytes + sizeOf('public/textures/manifest.json') + sizeOf('public/models/assets_meta.json')
  + sizeOf('public/textures/art/atlas.json') + sizeOf('public/textures/art/animals.png') + sizeOf('public/textures/art/animals.json');
// 3D-02 ROLLBACK: tiles.glb is fetched again in Hanoi mode, so "after" is
// the same as "before" except the deferred animals (3D-03). First-load
// saving before the first frame is only the animals sheet now.
const after = sizeOf('public/models/tiles.glb') + sizeOf('public/models/hanoi-tiles.glb') + sizeOf('public/models/traveller.glb')
  + texBytes + sizeOf('public/textures/manifest.json') + sizeOf('public/models/assets_meta.json')
  + sizeOf('public/textures/art/atlas.json');
const deferred = sizeOf('public/textures/art/animals.png') + sizeOf('public/textures/art/animals.json');
console.log('first-load Hanoi before: ' + mb(before).toFixed(2) + ' MB (' + before + ' bytes)');
console.log('first-load Hanoi after:  ' + mb(after).toFixed(2) + ' MB (' + after + ' bytes)');
console.log('deferred after first frame: ' + mb(deferred).toFixed(2) + ' MB (' + deferred + ' bytes)');
console.log('textures (distinct files): ' + mb(texBytes).toFixed(2) + ' MB');
check('(j) before total is 21.61 MB', mb(before).toFixed(2) === '21.61');
check('(j) after total is 16.98 MB', mb(after).toFixed(2) === '16.98');
check('(j) deferred animals total is 4.63 MB', mb(deferred).toFixed(2) === '4.63');
check('(j) saving before the first frame is exactly the deferred animals', before - after === deferred && mb(before - after).toFixed(2) === '4.63');
check('(j) manifest records the before total 21.61 MB', manifest.includes('21.61'));
check('(j) manifest records the after total 16.98 MB', manifest.includes('16.98'));

// ---- long dashes ----------------------------------------------------------------------
for (const f of ['index.html', 'src/main.js', 'src/assets/loader.js', 'src/life/animals.js', 'src/render/quality-scaler.js', 'src/render/renderer.js', 'tools/check-3d.mjs', 'docs/phase-3d-manifest.md']) {
  check('(dash) no long dash in ' + f, !hasLongDash(src(f)));
}

console.log(pass + ' PASS, ' + fail + ' FAIL');
if (fail) { console.log('failures: ' + failures.join(' | ')); process.exit(1); }
console.log('ALL 3D CHECKS PASSED');
