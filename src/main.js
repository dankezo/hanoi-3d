// Pop-up Atlas composition root.
// URL params: ?seed=N  ?quality=low|med|high  ?mute=1  ?hint=0  ?night=1  ?life=0  ?animals=0  ?map=hanoi  ?fps=1
import * as THREE from 'three';
import { CONFIG, QUALITY, TILE_SIZE } from './core/config.js';
import { createQualityScaler, createFpsReadout, createPixScale, resolveInitialQuality, resolveDeviceTier, deviceTierLabel, TIER_LABEL, readStoredQuality, isTouchDevice, markBootStart, markBootSurvived, hadCrash, downgradeForCrash, persistDowngradedQuality, CRASH_SURVIVE_MS } from './render/quality-scaler.js';
import { bus } from './core/events.js';
import { state } from './core/state.js';
import { createLoop } from './core/loop.js';
import { loadAssets } from './assets/loader.js';
import { createWFC } from './world/wfc.js';
import { createHanoi } from './world/hanoi.js';
import { loadHanoiData, resolveEdgeUrl } from './core/config/edge.js';
import { createWorld } from './world/world.js';
import { createTraveller } from './player/traveller.js';
import { createControls } from './player/controls.js';
import { createFollowCamera } from './camera/follow.js';
import { createRenderer } from './render/renderer.js';
import { createLights } from './render/lights.js';
import { createPost } from './render/post.js';
import { createMaterials } from './render/materials.js';
import { createPaperAudio } from './audio/paper.js';
import { createMusic } from './audio/music.js';
import { createDayNight } from './render/daynight.js';
import { createLife } from './life/life.js';
import { createAnimals } from './life/animals.js';
import { createGame } from './game/index.js';
import { createTrain } from './game/train.js';
import { createViews } from './camera/views.js';
// Allocation-free two-dimensional length.
const hypot2 = (a, b) => Math.sqrt(a * a + b * b);

const params = new URLSearchParams(location.search);
const seedParam = parseInt(params.get('seed') ?? '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : CONFIG.DEFAULT_SEED;
// Phase 2E: the starting level is resolved, not just defaulted to high.
// Phase 3D-05: the last fallback is the real device tier (RAM / cores /
// screen side, resolveDeviceTier), not touch alone. Priority: explicit
// ?quality= param, then the stored per-device level (hanoi:quality),
// then the device tier. The scaler never overrides an explicit ?quality=.
// Phase 3D-06: the crash flag is read BEFORE it is set below; a leftover
// flag means the last tab crashed mid-load, so the start drops one level
// (never below low, never over an explicit ?quality=). The downgrade - or
// a crash already at low - is shown on the loading screen, never silent.
const forcedQuality = QUALITY[params.get('quality')] ? params.get('quality') : null;
const storedQuality = readStoredQuality(typeof localStorage !== 'undefined' ? localStorage : null);
const deviceTier = resolveDeviceTier();
const storage = typeof localStorage !== 'undefined' ? localStorage : null;
const crashedLastTime = hadCrash(storage);
let quality = resolveInitialQuality({ forced: forcedQuality, stored: storedQuality, touch: isTouchDevice(), fallback: deviceTier.level });
let crashNote = '';
if (crashedLastTime && forcedQuality === null) {
  const down = downgradeForCrash(quality);
  if (down.downgraded) {
    quality = down.level;
    crashNote = 'Lan truoc game bi sap nen giam xuong muc ' + TIER_LABEL[down.level] + '.';
    // B1 fix: persist the lowered level NOW, into hanoi:quality. Without
    // this the stored level stays high, so the next boot would start at
    // high again and the crash would repeat forever, never reaching low.
    // Not called when ?quality= forces a level (this branch never runs then).
    persistDowngradedQuality(storage, down.level);
  }
  else crashNote = 'Lan truoc game bi sap o muc Low, thu dong bot tab khac roi tai lai.';
}
if (storage) markBootStart(storage);
const showFps = params.get('fps') === '1';
const muted = params.get('mute') === '1';
const showHint = params.get('hint') !== '0';

state.seed = seed;
state.quality = quality;

async function boot() {
  const canvas = document.getElementById('atlas');
  const hint = document.getElementById('hint');
  // ---- Phase 3D loading screen (3D-01, 3D-04, 3D-08) --------------------------------------
  // setLoad() is borrowed from Ocean City main.js say(): one call sets the
  // status line, the big % number AND the bar from the same value, so they
  // can never disagree. The bar moves with a CSS scaleX transition on the
  // compositor, so it keeps moving while the main thread builds the world.
  const loadEl = document.getElementById('load');
  const loadPctEl = document.getElementById('load-pct');
  const loadFillEl = document.getElementById('load-fill');
  const loadStatusEl = document.getElementById('load-status');
  const loadDeviceEl = document.getElementById('load-device');
  const loadNoteEl = document.getElementById('load-note');
  const loadSlowEl = document.getElementById('load-slow');
  let loadDone = false;
  let lastLoadFile = '';
  function setLoad(pct, status) {
    try {
      const p = Math.max(0, Math.min(100, Math.round(pct)));
      if (loadPctEl) loadPctEl.textContent = p + '%';
      if (loadFillEl) loadFillEl.style.transform = 'scaleX(' + (p / 100) + ')';
      if (status !== undefined && loadStatusEl) loadStatusEl.textContent = status;
    } catch (err) { /* the loading screen never breaks the boot */ }
  }
  function hideLoad() {
    if (loadDone) return;
    loadDone = true;
    try { if (loadEl) loadEl.classList.add('done'); } catch (err) { /* ignore */ }
    // Phase 3D-06: the boot counts as survived after 15 s of frames; the
    // flag is also cleared on a clean pagehide, so closing the tab early
    // does not count as a crash.
    setTimeout(() => markBootSurvived(storage), CRASH_SURVIVE_MS);
  }
  if (loadDeviceEl) loadDeviceEl.textContent = deviceTierLabel(deviceTier);
  if (crashNote && loadNoteEl) { loadNoteEl.textContent = crashNote; loadNoteEl.hidden = false; }
  setLoad(5, 'Chuan bi...');
  // Phase 3D-08: still loading after 8 s - say so, and name the file waited on.
  setTimeout(() => {
    if (loadDone || !loadSlowEl) return;
    loadSlowEl.textContent = 'Dang tai cham, vui long doi...' + (lastLoadFile ? ' (' + lastLoadFile + ')' : '');
    loadSlowEl.hidden = false;
  }, 8000);
  window.addEventListener('pagehide', () => markBootSurvived(storage), { once: true });

  const scene = new THREE.Scene();
  const { renderer, setSize: setRendererSize, setQuality: setRendererQuality, setPixScale: setRendererPixScale } = createRenderer({ canvas, quality });
  const materials = createMaterials({ quality });
  const hanoi = params.get('map') === 'hanoi';
  // Phase 2D: edge dataset when an edge URL is set, else the bundled dataset.
  // Flag off (the default) = zero network calls, same data objects as before.
  const hanoiData = hanoi ? await loadHanoiData({ edgeUrl: resolveEdgeUrl(params) }) : null;
  // Milestones are real jobs, not a fake timer (3D-01, 3D-04): 20-45% =
  // GLB bytes, 45-65% = texture bytes (real onProgress from the loader),
  // 65-70% = world build, 70-90% = scene setup, 90-100% = first frame.
  // The meta fetch has no progress events, so its step is a MOC GIA
  // (fake) milestone: the % jumps when it lands, marked in loader.js.
  setLoad(20, 'Tai ban do...');
  const assets = await loadAssets({
    materials, renderer, quality, hanoi,
    onProgress: (r) => {
      lastLoadFile = r.fileLabel || r.file || '';
      if (r.stage === 'glb') setLoad(20 + r.stageFraction * 25, 'Tai ban do...');
      else if (r.stage === 'textures') setLoad(45 + r.stageFraction * 20, 'Dung nha ong...');
    },
  });
  materials.setTextures(assets.textures);
  const lights = createLights({ scene, quality });
  const wfc = hanoi ? createHanoi({ seed, data: hanoiData ? hanoiData.map : null }) : createWFC({ seed });
  const world = createWorld({ scene, assets, wfc, materials, quality });
  setLoad(70, 'Ve ho...');
  const traveller = createTraveller({ scene, assets, world, materials, hanoi });
  const follow = createFollowCamera({ aspect: window.innerWidth / Math.max(1, window.innerHeight) });
  const controls = createControls({ domElement: canvas, camera: follow.camera, traveller });
  const views = createViews({ follow }); // V cycles camera views
  const post = createPost({ renderer, scene, camera: follow.camera, quality });
  const audio = createPaperAudio({ muted });
  const music = createMusic({ audio });
  const daynight = createDayNight({ scene, night: params.get('night') === '1' });
  // ambient life + weather (leaves, snow, rain, birds, chimney smoke, fireflies ...): 2 draw calls; ?life=0 disables it
  const life = params.get('life') === '0' || CONFIG.life.enabled === false ? null : createLife({ scene, assets, wfc, world, daynight, camera: follow.camera, quality, seed });
  // living animals (cats, sheep, hens, ducks ...): cut-paper cards on risen tiles, 2 draw calls; ?animals=0 disables them
  const animals = params.get('animals') === '0' || CONFIG.animals.enabled === false ? null : createAnimals({ scene, renderer, world, wfc, traveller, daynight, assets, seed, quality });
  // Phase 3E: Hanoi train (3 cars on a closed loop, Hanoi mode only). Created
  // after the traveller (it pushes the traveller off the rails) and before the
  // shadow depth pass below, so its meshes get the plain depth material.
  const train = hanoi ? createTrain({ scene, world, traveller, quality }) : null;
  // Gameplay progress is saved independently for each world seed.
  const game = createGame({ scene, renderer, world, wfc, traveller, follow, controls, lights, post, daynight, music, audio, life, assets, materials, seed, quality, hanoi, historyInfo: hanoiData ? hanoiData.historyInfo : null });
  follow.setAssistGate(game.modal);
  // N: day / night, M: music on / off (keys only - no on-screen UI)
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyN') daynight.toggle();
    else if (e.code === 'KeyV' && !game.modal()) views.next();
    else if (e.code === 'KeyM') music.toggle();
  });

  // The tiles cast shadows through BatchedMeshes, everything else through plain meshes.
  // three uses ONE internal depth material for all shadow casters and re-derives its whole program-parameter
  // set whenever the object class flips (batched <-> plain) - twice per frame, ~6 kB of garbage each frame.
  // A second, identical depth material for the plain meshes removes the flip.
  const plainDepth = new THREE.MeshDepthMaterial();
  scene.traverse((o) => { if (o.isMesh && !o.isBatchedMesh && !o.isInstancedMesh && o.castShadow && !o.customDepthMaterial) o.customDepthMaterial = plainDepth; });

  // ---- one simulation tick (order is part of the contract) ------------------------------------
  const idle = { x: 0, z: 0 };
  const _right = new THREE.Vector3();

  function update(dt) {
    state.time = loop.time;
    state.frame = loop.frame;
    const input = controls.getInput(dt) || idle;
    traveller.update(dt, game.modal() ? idle : input); // No walking while the atlas page is open.
    if (train) train.update(dt); // Phase 3E: advance the train, push the traveller off the rails.
    const p = traveller.position;
    const t = state.traveller;
    t.x = p.x; t.y = p.y; t.z = p.z;
    t.dirX = traveller.moveDir.x; t.dirZ = traveller.moveDir.z; t.speed = traveller.speed;
    _right.setFromMatrixColumn(follow.camera.matrixWorld, 0);
    const rl = hypot2(_right.x, _right.z) || 1;
    state.listener.x = p.x; state.listener.z = p.z;
    state.listener.rightX = _right.x / rl; state.listener.rightZ = _right.z / rl;
    world.update(dt, p, traveller.moveDir);
    views.update(dt);
    follow.update(dt, traveller);
    daynight.update(dt);
    if (life) life.update(dt, p, follow.camera);
    if (animals) animals.update(dt);
    game.update(dt);
    lights.update(dt, traveller, follow.camera);
    materials.update(dt);
  }

  // Phase 3D-09: worst frame time of the last second (ms), for ?fps=1.
  let worstMs = 0;
  let worstWindowStart = 0;
  function render(dt) {
    // Phase 2E: measure this frame and let the scaler step the quality
    // down/up. Wrapped defensively: a scaler failure must never stop a frame.
    try { if (scaler) scaler.tick(dt * 1000); } catch (err) { /* keep rendering at the current quality */ }
    // Phase 3D-07: the inner pixScale loop reads the scaler EMA and the
    // time since its last preset step (the anti-fight rule lives in the loop).
    try { if (pixScale && scaler) pixScale.tick(dt * 1000, scaler.emaFps, scaler.msSinceStep); } catch (err) { /* keep rendering at the current resolution */ }
    try {
      const nowMs = performance.now();
      const frameMs = dt * 1000;
      if (nowMs - worstWindowStart >= 1000) { worstWindowStart = nowMs; worstMs = frameMs; }
      else if (frameMs > worstMs) worstMs = frameMs;
      if (fpsReadout && scaler && scaler.emaFps) fpsReadout.update(scaler.emaFps, scaler.level, nowMs, { worstMs, pixPct: pixScale ? pixScale.percent : 100 });
    } catch (err) { /* readout is dev-only */ }
    post.setFocus(follow.focusPoint);
    post.render(dt);
    game.atlasmap.render(); // Drawn over the finished frame; no-op while closed.
  }

  const loop = createLoop({ update, render });

  // ---- resize -----------------------------------------------------------------------------------
  function resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    setRendererSize(w, h);
    follow.setAspect(w / h);
    post.setSize(w, h);
    bus.emit('resize', { width: w, height: h, dpr: renderer.getPixelRatio() });
  }
  window.addEventListener('resize', resize);

  // ---- hint (the only on-screen text) -----------------------------------------------------------
  if (showHint) {
    hint.classList.add('on');
    bus.once('input:first', () => hint.classList.remove('on'));
  } else hint.remove();

  // Find a safe initial position without skipping the opening fold animation.
  // Phase 3B: Hanoi spawns on the promenade south of Hoan Kiem Lake (wfc.spawn =
  // [0, 5] cells); the default WFC world has no spawn and keeps (0, 0). Spawn cells
  // are converted to world units (TILE_SIZE per cell); the spiral below is the
  // fallback when the spawn cell itself is not walkable.
  function initialPosition() {
    const [sx, sz] = wfc.spawn || [0, 0];
    const x = sx * TILE_SIZE; const z = sz * TILE_SIZE;
    if (world.isWalkable(x, z)) return [x, z];
    for (let r = 0.25; r <= TILE_SIZE * 3; r += 0.25) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const nx = x + Math.cos(a) * r;
        const nz = z + Math.sin(a) * r;
        if (world.isWalkable(nx, nz)) return [nx, nz];
      }
    }
    return [x, z];
  }

  // ---- Phase 2E: auto quality scaler + dev FPS readout --------------------------------------
  // Created here, after resize() exists and after the first render targets
  // are built, and never awaited: boot does not wait for the scaler, and
  // the scaler never blocks the first frame. Life/animals keep their boot
  // level (they read quality once at creation); the four render hooks below
  // carry every step change.
  let scaler = null;
  let pixScale = null;
  let fpsReadout = null;
  try {
    fpsReadout = createFpsReadout({ enabled: showFps });
    scaler = createQualityScaler({
      level: quality,
      forced: forcedQuality !== null,
      storage: typeof localStorage !== 'undefined' ? localStorage : null,
      // Dev-only periodic log: silent in normal play, 5 s log only with ?fps=1.
      logEveryMs: showFps ? 5000 : 0,
      apply: (next) => {
        setRendererQuality(next);
        lights.setQuality(next);
        materials.setQuality(next);
        post.setQuality(next);
        if (train) train.setQuality(next); // Phase 3E: the train hides at low, first thing to drop.
        state.quality = next;
        resize();
      },
      onChange: (next, prev, reason) => { state.quality = next; },
    });
    // Phase 3D-07: inner dynamic-resolution loop. onApply rebuilds the
    // targets through the same resize() the scaler uses. Its log stays
    // silent in normal play (only ?fps=1 logs, like the scaler).
    pixScale = createPixScale({
      onApply: (v) => { setRendererPixScale(v); resize(); },
      onLog: showFps ? null : () => {},
    });
  } catch (err) { scaler = null; fpsReadout = null; }

  // ---- start ------------------------------------------------------------------------------------------
  // Phase 3D-03: the animals sheet is NOT awaited any more: the loop starts
  // first and the animals load in the background, fading in over 2.5 s
  // once their sheet lands (see animals.js fadeK). Nothing else waits on it.
  resize();
  const [x, z] = initialPosition();
  traveller.teleport(x, z);
  controls.clearTarget();
  update(0);
  follow.snap(traveller);
  _right.setFromMatrixColumn(follow.camera.matrixWorld, 0);
  const rl = hypot2(_right.x, _right.z) || 1;
  state.listener.rightX = _right.x / rl; state.listener.rightZ = _right.z / rl;
  if (world.faceCamera) world.faceCamera();
  if (life) life.update(0, traveller.position, follow.camera);
  lights.update(0, traveller, follow.camera);
  setLoad(90, 'Dang gap giay...');
  render(0);
  loop.start();
  setLoad(100, 'Xong!');
  hideLoad();
}

boot().catch((err) => {
  console.error('[atlas] boot failed', err);
  try { const s = document.getElementById('load-status'); if (s) s.textContent = 'Khong mo duoc game, thu tai lai trang.'; } catch (e) { /* ignore */ }
  throw err;
});
