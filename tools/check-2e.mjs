// Phase 2E checks (node tools/check-2e.mjs). No browser, no GPU: the scaler
// logic is unit-tested with mocked frame times, and the render wiring is
// checked by reading the source (post chain, reflection throttle, FPS readout).
// Covers: (a) sustained FPS < 45 steps high -> med -> low, (b) sustained FPS
// > 58 steps back up, (c) never below low or above high, (d) explicit
// ?quality= is never overridden, (e) phones start at med, desktops at high,
// (f) the level persists in localStorage (hanoi:quality) and is restored,
// (g) the touch maxDpr cap, (h) the reflection throttle skips frames at lower
// levels but keeps a valid texture, (i) the DoF passes still run at every
// level, (j) the ?fps=1 readout is off by default. Plus: boot never awaits
// the scaler, scaler apply failures leave the game at its current quality,
// preset values (MSAA / DoF / AO / shadow), fold substep cap, long dashes.
// No long dashes in this file: only short hyphens (-).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  QUALITY_KEY, DOWN_FPS, UP_FPS, DOWN_SUSTAIN_MS, UP_SUSTAIN_MS,
  COOLDOWN_MS, TOUCH_MAX_DPR, createQualityScaler, createFpsReadout,
  resolveInitialQuality, readStoredQuality, isTouchDevice,
  effectiveMaxDpr, shouldRenderReflection, reflectionScale,
} from '../src/render/quality-scaler.js';
import { QUALITY, qualitySettings } from '../src/core/config.js';

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
}
// Feed a scaler `seconds` of frames at a fixed fps. Returns the levels seen.
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
const touchEnv = { matchMedia: () => ({ matches: true }), navigator: { maxTouchPoints: 5 } };
const desktopEnv = { matchMedia: () => ({ matches: false }), navigator: { maxTouchPoints: 0 } };

// ---- thresholds + hysteresis constants --------------------------------------
check('down threshold is 45 FPS', DOWN_FPS === 45);
check('up threshold is 58 FPS (above down: hysteresis gap)', UP_FPS === 58 && UP_FPS > DOWN_FPS);
check('down sustain is 2000 ms', DOWN_SUSTAIN_MS === 2000);
check('up sustain is 3000 ms (longer than down: no flapping)', UP_SUSTAIN_MS === 3000 && UP_SUSTAIN_MS > DOWN_SUSTAIN_MS);
check('cooldown after a step is 2000 ms', COOLDOWN_MS === 2000);
check('quality key is hanoi:quality', QUALITY_KEY === 'hanoi:quality');

// ---- (a) sustained FPS < 45 steps high -> med -> low -------------------------
{
  const store = new Mem();
  const applied = [];
  const s = createQualityScaler({ level: 'high', storage: store, apply: (l) => applied.push(l), logEveryMs: 0 });
  const seen = feed(s, 30, 12);
  check('(a) 30 FPS for 12 s steps high -> med -> low', JSON.stringify(seen) === JSON.stringify(['med', 'low']));
  check('(a) ends at low', s.level === 'low');
  check('(a) apply called for both steps', JSON.stringify(applied) === JSON.stringify(['med', 'low']));
  check('(a) stored level is low', store.getItem(QUALITY_KEY) === 'low');
}
// ---- (b) sustained FPS > 58 steps back up ------------------------------------
{
  const s = createQualityScaler({ level: 'med', storage: new Mem(), logEveryMs: 0 });
  const seen = feed(s, 70, 8);
  check('(b) 70 FPS for 8 s steps med -> high', JSON.stringify(seen) === JSON.stringify(['high']));
  check('(b) ends at high', s.level === 'high');
}
{
  const s = createQualityScaler({ level: 'low', storage: new Mem(), logEveryMs: 0 });
  const seen = feed(s, 70, 12);
  check('(b) 70 FPS for 12 s steps low -> med -> high', JSON.stringify(seen) === JSON.stringify(['med', 'high']));
}
// ---- (c) never below low or above high ---------------------------------------
{
  const sLow = createQualityScaler({ level: 'low', storage: new Mem(), logEveryMs: 0 });
  feed(sLow, 10, 15);
  check('(c) 10 FPS never steps below low', sLow.level === 'low');
  const sHigh = createQualityScaler({ level: 'high', storage: new Mem(), logEveryMs: 0 });
  feed(sHigh, 120, 15);
  check('(c) 120 FPS never steps above high', sHigh.level === 'high');
}
// ---- (c2) a short dip does not step down (sustain required) -------------------
{
  const s = createQualityScaler({ level: 'high', storage: new Mem(), logEveryMs: 0 });
  feed(s, 30, 1);
  check('(c2) 30 FPS for only 1 s does not step down', s.level === 'high');
  feed(s, 60, 5);
  check('(c2) back to 60 FPS stays high', s.level === 'high');
}
// ---- (d) explicit ?quality= is never overridden ------------------------------
{
  const store = new Mem();
  const applied = [];
  const s = createQualityScaler({ level: 'high', forced: true, storage: store, apply: (l) => applied.push(l), logEveryMs: 0 });
  feed(s, 20, 15);
  check('(d) forced high + 20 FPS for 15 s stays high', s.level === 'high');
  check('(d) forced scaler never calls apply', applied.length === 0);
  check('(d) forced scaler writes nothing to storage', store.getItem(QUALITY_KEY) === null);
  const sLow = createQualityScaler({ level: 'low', forced: true, storage: new Mem(), logEveryMs: 0 });
  feed(sLow, 120, 15);
  check('(d) forced low + 120 FPS stays low', sLow.level === 'low');
}
// ---- (e) phones start at med, desktops at high -------------------------------
check('(e) coarse pointer is touch', isTouchDevice(touchEnv) === true);
check('(e) desktop pointer is not touch', isTouchDevice(desktopEnv) === false);
check('(e) phone starts at med', resolveInitialQuality({ touch: true }) === 'med');
check('(e) desktop starts at high', resolveInitialQuality({ touch: false }) === 'high');
check('(e) forced level beats phone start', resolveInitialQuality({ forced: 'high', touch: true }) === 'high');
check('(e) stored level beats phone start', resolveInitialQuality({ stored: 'low', touch: true }) === 'low');
check('(e) forced beats stored', resolveInitialQuality({ forced: 'med', stored: 'low', touch: false }) === 'med');
// ---- (f) persistence + restore -----------------------------------------------
{
  const store = new Mem();
  const s = createQualityScaler({ level: 'high', storage: store, logEveryMs: 0 });
  feed(s, 30, 6);
  check('(f) step down persists med', store.getItem(QUALITY_KEY) === 'med');
  const restored = resolveInitialQuality({ stored: readStoredQuality(store), touch: false });
  check('(f) stored med is restored on next load', restored === 'med');
  const bad = new Mem();
  bad.setItem(QUALITY_KEY, 'ultra');
  check('(f) junk stored value is ignored', readStoredQuality(bad) === null);
  check('(f) empty storage reads null', readStoredQuality(new Mem()) === null);
  check('(f) throwing storage reads null', readStoredQuality({ getItem() { throw new Error('blocked'); } }) === null);
}
// ---- (g) touch maxDpr cap -----------------------------------------------------
check('(g) touch maxDpr is 1.5', TOUCH_MAX_DPR === 1.5);
check('(g) high on touch caps at 1.5', effectiveMaxDpr('high', touchEnv) === 1.5);
check('(g) high on desktop stays 2', effectiveMaxDpr('high', desktopEnv) === 2);
check('(g) med on touch stays 1.25 (below cap)', effectiveMaxDpr('med', touchEnv) === 1.25);
check('(g) low on touch stays 1', effectiveMaxDpr('low', touchEnv) === 1);
check('(g) preset high maxDpr is still 2 (desktop untouched)', qualitySettings('high').maxDpr === 2);
{
  const r = src('src/render/renderer.js');
  check('(g) renderer uses effectiveMaxDpr (not raw q.maxDpr)', r.includes('effectiveMaxDpr(qLevel)') && !r.includes('q.maxDpr)'));
}
// ---- (h) reflection throttle --------------------------------------------------
check('(h) high runs reflection every frame', [0, 1, 2, 3].every((f) => shouldRenderReflection(f, 'high')));
check('(h) med runs reflection every 2nd frame', shouldRenderReflection(0, 'med') && !shouldRenderReflection(1, 'med') && shouldRenderReflection(2, 'med') && !shouldRenderReflection(3, 'med'));
check('(h) low runs reflection every 3rd frame', shouldRenderReflection(0, 'low') && !shouldRenderReflection(1, 'low') && !shouldRenderReflection(2, 'low') && shouldRenderReflection(3, 'low'));
check('(h) high reflection scale is 0.5', reflectionScale('high') === 0.5);
check('(h) med reflection scale is 0.5', reflectionScale('med') === 0.5);
check('(h) low reflection scale is 0.33', reflectionScale('low') === 0.33);
{
  const post = src('src/render/post.js');
  check('(h) post.js gates the reflection call on shouldRenderReflection', post.includes('shouldRenderReflection(frameNo, qLevel)') && post.includes('reflectionScale(qLevel)'));
  check('(h) post.js passes the scale override to renderReflection', post.includes("{ scale: reflectionScale(qLevel) }"));
  const water = src('src/render/water.js');
  check('(h) renderReflection accepts a scale override', water.includes('opts = {}') && water.includes('opts.scale'));
  // The texture stays valid across a skipped frame: uRefl.x is only zeroed
  // at the top of renderReflection itself, and uReflTex is only replaced
  // after a successful draw - skipping the call touches neither.
  const zeroSites = (water.match(/U\.uRefl\.value\.x = 0/g) || []).length;
  check('(h) uRefl strength is zeroed only inside renderReflection (1 site)', zeroSites === 1);
  check('(h) uReflTex is only assigned after the draw', water.includes('U.uReflTex.value = rt.texture'));
  check('(h) reflection is never removed: minQuality is still med', water.includes("minQuality: 'med'"));
}
// ---- (i) DoF still runs at every level ----------------------------------------
{
  check('(i) low keeps dofTaps > 0', qualitySettings('low').dofTaps > 0);
  check('(i) med keeps dofTaps 22', qualitySettings('med').dofTaps === 22);
  check('(i) high keeps dofTaps 36', qualitySettings('high').dofTaps === 36);
  check('(i) low dof mode is cheap, not off', qualitySettings('low').dof === 'cheap');
  check('(i) med/high dof mode is full', qualitySettings('med').dof === 'full' && qualitySettings('high').dof === 'full');
  const post = src('src/render/post.js');
  check('(i) post still builds the gather material', post.includes('M.gather = mat(GATHER_FRAG'));
  check('(i) post still builds the fill material', post.includes('M.fill = mat(FILL_FRAG'));
  check('(i) post still builds the composite material', post.includes('M.composite = mat(COMPOSITE_FRAG'));
  check('(i) render still runs the gather pass', post.includes('pass(M.gather, T.gather)'));
  check('(i) render still runs the fill pass', post.includes('pass(M.fill, T.fill)'));
  check('(i) render still runs the composite pass', post.includes('pass(M.composite, null)'));
  check('(i) gather taps come from the preset (no hardcoded 36)', post.includes('vogelTaps(q.dofTaps)') && !post.includes('DOF_TAPS: 36'));
}
// ---- preset values: MSAA / AO / shadow (plan steps 3, 5, 7) -------------------
check('preset low msaa is 0', qualitySettings('low').msaa === 0);
check('preset med msaa is 2', qualitySettings('med').msaa === 2);
check('preset high msaa is 4 (desktop untouched)', qualitySettings('high').msaa === 4);
check('preset low aoTaps is 0', qualitySettings('low').aoTaps === 0);
check('preset med aoTaps is 6', qualitySettings('med').aoTaps === 6);
check('preset high aoTaps is 10', qualitySettings('high').aoTaps === 10);
check('preset low shadow is 1024', qualitySettings('low').shadowMapSize === 1024);
check('preset med shadow is 2048 (phone start level)', qualitySettings('med').shadowMapSize === 2048);
check('preset high shadow is 4096', qualitySettings('high').shadowMapSize === 4096);
check('QUALITY table still has exactly low/med/high', JSON.stringify(Object.keys(QUALITY).sort()) === JSON.stringify(['high', 'low', 'med']));
// ---- fold substep cap ----------------------------------------------------------
{
  const fold = src('src/core/config/fold.js');
  check('fold maxSubSteps is 12 (was 30)', fold.includes('maxSubSteps: 12'));
  const foldJs = src('src/world/fold.js');
  check('fold update still caps steps at maxSubSteps', foldJs.includes('if (k > S.maxSubSteps)'));
}
// ---- (j) ?fps=1 readout off by default -----------------------------------------
{
  check('(j) readout disabled returns null (no element)', createFpsReadout({ enabled: false }) === null);
  const main = src('src/main.js');
  check('(j) main enables the readout only for ?fps=1', main.includes("params.get('fps') === '1'"));
  check('(j) main never enables it unconditionally', !main.includes('createFpsReadout({ enabled: true })'));
  const html = src('index.html');
  check('(j) readout CSS exists but creates no element on its own', html.includes('#fps-readout') && !html.includes('id="fps-readout"'));
  // Enabled readout with a fake DOM: creates the element and updates text.
  const els = [];
  const fakeDoc = {
    createElement: () => ({ textContent: '', remove() { /* noop */ } }),
    body: { appendChild(el) { els.push(el); } },
  };
  const ro = createFpsReadout({ enabled: true, doc: fakeDoc });
  check('(j) enabled readout creates one element', ro !== null && els.length === 1);
  ro.update(60, 'high', 1000);
  check('(j) enabled readout shows fps + level', els[0].textContent === 'fps 60 high');
}
// ---- boot never awaits the scaler + scaler failure is contained ----------------
{
  const main = src('src/main.js');
  check('boot never awaits the scaler', !/await\s+\w*[Ss]caler/.test(main) && !main.includes('await scaler'));
  check('scaler creation is wrapped in try/catch', main.includes('} catch (err) { scaler = null; fpsReadout = null; }'));
  check('scaler tick in render is wrapped in try/catch', main.includes('try { if (scaler) scaler.tick(dt * 1000); }'));
  check('scaler apply wires all four setQuality hooks', main.includes('setRendererQuality(next)') && main.includes('lights.setQuality(next)') && main.includes('materials.setQuality(next)') && main.includes('post.setQuality(next)'));
  check('scaler apply re-runs resize (new DPR takes effect)', main.includes('resize();') && /apply: \(next\) => \{[^}]*resize\(\);/s.test(main));
  check('scaler apply updates state.quality', main.includes('state.quality = next;'));
  check('main imports the scaler module', main.includes("from './render/quality-scaler.js'"));
  check('main documents the ?fps=1 param', main.includes('?fps=1'));
}
{
  // A throwing apply() leaves the game at its current quality and retries later.
  let calls = 0;
  const s = createQualityScaler({
    level: 'high', storage: new Mem(), logEveryMs: 0,
    apply: () => { calls++; throw new Error('hook broke'); },
  });
  feed(s, 30, 6);
  check('throwing apply keeps the level at high', s.level === 'high');
  check('throwing apply was still attempted', calls >= 1);
  // A throwing onChange does not break the step either.
  const s2 = createQualityScaler({
    level: 'high', storage: new Mem(), logEveryMs: 0,
    apply: () => {}, onChange: () => { throw new Error('listener broke'); },
  });
  feed(s2, 30, 6);
  check('throwing onChange still steps down', s2.level === 'med');
}
// ---- EMA + logging --------------------------------------------------------------
{
  const lines = [];
  const s = createQualityScaler({ level: 'high', storage: new Mem(), onLog: (l) => lines.push(l), logEveryMs: 1000 });
  feed(s, 60, 3);
  check('scaler logs a periodic fps line', lines.some((l) => l.startsWith('[fps] level=high fps=')));
  check('scaler EMA converges near the fed FPS', s.emaFps !== null && Math.abs(s.emaFps - 60) < 1);
  const s2 = createQualityScaler({ level: 'high', storage: new Mem(), logEveryMs: 0 });
  s2.tick(0);
  s2.tick(-5);
  s2.tick(NaN);
  check('tick ignores zero/negative/NaN frame times', s2.emaFps === null && s2.level === 'high');
}
// ---- no long dashes in changed files -------------------------------------------
for (const p of ['src/render/quality-scaler.js', 'src/render/renderer.js', 'src/render/post.js', 'src/render/water.js', 'src/main.js', 'src/core/config/fold.js', 'index.html', 'tools/check-2e.mjs']) {
  check('no long dash in ' + p, !hasLongDash(src(p)));
}

console.log('check-2e: ' + pass + ' PASS, ' + fail + ' FAIL');
if (fail) { console.log('failures: ' + failures.join('; ')); process.exit(1); }
