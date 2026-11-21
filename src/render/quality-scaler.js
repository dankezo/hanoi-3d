// Phase 2E: auto quality scaler + FPS readout.
//
// The game used to start at 'high' on every device and never measured FPS.
// This module measures frame time, steps the quality down when the device
// cannot hold the frame rate, and steps back up when it can. It never
// changes what the game draws, only which quality preset the existing
// post.setQuality / renderer.setQuality / lights.setQuality /
// materials.setQuality hooks run with. The tilt-shift DoF chain (gather /
// fill / composite) runs at every level - only its tap counts and the
// pixel ratio change, via the presets in src/core/config/render.js.
//
// Rules (see docs/fps-plan.md):
// - step down when the frame-time EMA stays below 45 FPS for 2 s.
// - step up when it stays above 58 FPS for 3 s (higher bar + longer
//   wait = hysteresis, so the level does not flap between two levels).
// - a 2 s cooldown after every step, during which no new step is taken.
// - an explicit ?quality= level is never overridden by the scaler.
// - phones (coarse pointer / touch) start at med, desktops at high.
// - the chosen level persists per device in localStorage (hanoi:quality).
// - a scaler failure must never break the game: apply() is wrapped in
//   try/catch and a failure leaves the current quality in place.
import { QUALITY, qualitySettings } from '../core/config.js';

export const QUALITY_LEVELS = ['low', 'med', 'high'];
export const QUALITY_KEY = 'hanoi:quality';
export const DOWN_FPS = 45;
export const UP_FPS = 58;
export const DOWN_SUSTAIN_MS = 2000;
export const UP_SUSTAIN_MS = 3000;
export const COOLDOWN_MS = 2000;
/** Frame-time EMA time constant (s): the EMA settles in about 1-2 s. */
export const EMA_TAU_S = 0.5;
/** Touch screens never render above this pixel ratio, even at high. */
export const TOUCH_MAX_DPR = 1.5;
/** Reflection frames: high every frame, med every 2nd, low every 3rd. */
export const REFLECTION_INTERVAL = { high: 1, med: 2, low: 3 };
/** Reflection target scale: high/med 0.5, low 0.33. */
export const REFLECTION_SCALE = { high: 0.5, med: 0.5, low: 0.33 };

export function isLevel(v) { return QUALITY_LEVELS.includes(v); }

/** Device kind labels used by the loading screen (Vietnamese, no diacritics). */
export const DEVICE_KIND_LABEL = { phone: 'Dien thoai', desktop: 'May tinh' };
export const TIER_LABEL = { low: 'Low', med: 'Medium', high: 'High' };

/**
 * Phase 3D-05: starting tier from the real device, borrowed from Ocean City
 * quality.js (deviceMemory + hardwareConcurrency + smallest screen side).
 * No user-agent sniffing: only navigator / screen / pointer facts.
 * - phone (coarse pointer / touch): RAM <= 4 GB, or <= 4 cores, or smallest
 *   screen side <= 360 px -> low; any other phone -> med.
 * - desktop: RAM <= 4 GB -> med; otherwise high.
 * Unknown memory (undefined) is not treated as low; unknown cores count as 4
 * (Ocean City default); an unknown screen side (0) is ignored, not low.
 * `env` is injected for tests; without it the real navigator / screen / window
 * globals are read. Never throws: a probe failure means "desktop high".
 */
export function resolveDeviceTier(env = {}) {
  try {
    const nav = env.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    const scr = env.screen || (typeof screen !== 'undefined' ? screen : null);
    const mem = nav ? nav.deviceMemory : undefined;
    const cores = (nav && nav.hardwareConcurrency) || 4;
    const w = scr ? (scr.width || 0) : 0;
    const h = scr ? (scr.height || 0) : 0;
    const scrMin = (w > 0 && h > 0) ? Math.min(w, h) : 0;
    const phone = isTouchDevice(env);
    if (phone) {
      if ((mem !== undefined && mem <= 4) || cores <= 4 || (scrMin > 0 && scrMin <= 360)) return { kind: 'phone', level: 'low' };
      return { kind: 'phone', level: 'med' };
    }
    if (mem !== undefined && mem <= 4) return { kind: 'desktop', level: 'med' };
    return { kind: 'desktop', level: 'high' };
  } catch (err) { return { kind: 'desktop', level: 'high' }; }
}

/** Loading-screen device line, e.g. "Dien thoai - Medium". */
export function deviceTierLabel(tier) {
  const t = tier || { kind: 'desktop', level: 'high' };
  return (DEVICE_KIND_LABEL[t.kind] || 'May tinh') + ' - ' + (TIER_LABEL[t.level] || 'High');
}

/**
 * Phase 3D-06: crash flag, borrowed from Ocean City (abyssalLoad).
 * Set when boot starts, cleared after 15 s of healthy frames (and on a clean
 * pagehide). If the flag is still set on the next visit, the previous tab
 * crashed or was killed mid-load, so the next boot starts one level lower.
 * The downgrade is shown on the loading screen, never silent.
 */
export const CRASH_KEY = 'hanoi:crash';
export const CRASH_SURVIVE_MS = 15000;
export function markBootStart(storage) {
  try { if (storage) storage.setItem(CRASH_KEY, '1'); } catch (err) { /* storage may be blocked */ }
}
export function markBootSurvived(storage) {
  try { if (storage) storage.removeItem(CRASH_KEY); } catch (err) { /* storage may be blocked */ }
}
export function hadCrash(storage) {
  try { return !!storage && storage.getItem(CRASH_KEY) === '1'; } catch (err) { return false; }
}
/** One level down after a crash. At low there is nowhere to go: atLow = true. */
export function downgradeForCrash(level) {
  const idx = QUALITY_LEVELS.indexOf(level);
  if (idx <= 0) return { level: 'low', downgraded: false, atLow: true };
  return { level: QUALITY_LEVELS[idx - 1], downgraded: true, atLow: false };
}

/**
 * Phase 3D-06 fix (blocker B1): persist a crash-downgraded level right away,
 * so the next boot starts at the lowered level instead of re-reading the old
 * stored level and crashing at it again. Without this call a stored high
 * would keep downgrading to med on every crash and never reach low. Called
 * only from the crash-downgrade branch in main.js, which never runs when
 * ?quality= forces a level, so a forced choice is never overwritten. Uses
 * the same QUALITY_KEY as the scaler persist(), never throws.
 */
export function persistDowngradedQuality(storage, level) {
  try { if (storage && isLevel(level)) storage.setItem(QUALITY_KEY, level); } catch (err) { /* storage may be full or blocked */ }
}

/** True when the device is a touch / coarse-pointer device. `env` is injected for tests. */
export function isTouchDevice(env = {}) {
  try {
    const mm = env.matchMedia || (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia.bind(window) : null);
    if (mm && mm('(pointer: coarse)').matches) return true;
    const nav = env.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    if (nav && (nav.maxTouchPoints || 0) > 0) return true;
    if (env.ontouchstart === true) return true;
    if (typeof window !== 'undefined' && 'ontouchstart' in window) return true;
  } catch (err) { /* a probe failure means "not touch", never a crash */ }
  return false;
}

/**
 * Effective max pixel ratio for a level on this device. Pixel count is the
 * single biggest cost, so touch screens cap high at 1.5 (med 1.25 and low 1
 * are already below the cap and are unchanged).
 */
export function effectiveMaxDpr(level, env = {}) {
  const base = (qualitySettings(level) || {}).maxDpr || 1;
  if (isTouchDevice(env)) return Math.min(base, TOUCH_MAX_DPR);
  return base;
}

/** Read a stored level from a storage-like object (localStorage shape). Never throws. */
export function readStoredQuality(storage) {
  try {
    const v = storage ? storage.getItem(QUALITY_KEY) : null;
    return isLevel(v) ? v : null;
  } catch (err) { return null; }
}

/**
 * Starting level. Priority: explicit ?quality= param, then the stored
 * per-device level, then the device tier (Phase 3D-05, resolveDeviceTier),
 * then the old touch rule (phones med, desktops high) when no tier is given.
 */
export function resolveInitialQuality({ forced = null, stored = null, touch = false, fallback = null } = {}) {
  if (isLevel(forced)) return forced;
  if (isLevel(stored)) return stored;
  if (isLevel(fallback)) return fallback;
  return touch ? 'med' : 'high';
}

/** True when the reflection pass should run on this frame number (0-based). */
export function shouldRenderReflection(frame, level) {
  const n = REFLECTION_INTERVAL[level] || 1;
  return frame % n === 0;
}

/** Reflection target scale for a level (0.5 at high/med, 0.33 at low). */
export function reflectionScale(level) {
  return REFLECTION_SCALE[level] || 0.5;
}

/**
 * Create the scaler. Options:
 * - level: starting level (already resolved by resolveInitialQuality).
 * - forced: true when the level came from an explicit ?quality= param;
 *   the scaler then only measures and reports, never steps.
 * - storage: storage-like object for persisting the level (may be null).
 * - apply: fn(level) called on every step; the caller wires the four
 *   setQuality hooks there. Wrapped in try/catch inside tick().
 * - onChange: fn(level, prevLevel, reason) called after a step.
 * - onLog: fn(line) for the periodic frame-time log (default console.info).
 * - logEveryMs: how often the periodic log fires (0 = only on change).
 */
export function createQualityScaler({
  level = 'high', forced = false, storage = null, apply = null, onChange = null,
  onLog = null, logEveryMs = 5000,
} = {}) {
  let current = isLevel(level) ? level : 'high';
  let emaFps = null;
  let belowMs = 0;
  let aboveMs = 0;
  let cooldownMs = 0;
  let sinceLogMs = 0;
  let frames = 0;
  /** ms since the last preset step (Infinity = never stepped: pixScale may move). */
  let msSinceStep = Infinity;

  function persist(next) {
    try { if (storage) storage.setItem(QUALITY_KEY, next); } catch (err) { /* storage may be full or blocked */ }
  }
  function log(line) {
    try { if (onLog) onLog(line); else if (typeof console !== 'undefined') console.info(line); } catch (err) { /* logging never breaks the game */ }
  }
  function step(next, reason) {
    const prev = current;
    current = next;
    belowMs = 0;
    aboveMs = 0;
    cooldownMs = COOLDOWN_MS;
    msSinceStep = 0;
    try { if (apply) apply(next); } catch (err) { current = prev; return false; }
    persist(next);
    log('[fps] quality ' + prev + ' -> ' + next + ' (' + reason + ')');
    try { if (onChange) onChange(next, prev, reason); } catch (err) { /* listener failure is not a scaler failure */ }
    return true;
  }

  return {
    get level() { return current; },
    get forced() { return !!forced; },
    get emaFps() { return emaFps; },
    get frames() { return frames; },
    /** ms since the last preset step; the pixScale loop reads this (3D-07). */
    get msSinceStep() { return msSinceStep; },
    /** Feed one frame time (ms). Returns { level, changed }. Never throws. */
    tick(dtMs) {
      try {
        frames++;
        if (!(dtMs > 0) || !Number.isFinite(dtMs)) return { level: current, changed: false };
        const fps = 1000 / dtMs;
        const dtS = dtMs / 1000;
        if (emaFps === null) emaFps = fps;
        else emaFps += (fps - emaFps) * (1 - Math.exp(-dtS / EMA_TAU_S));
        if (msSinceStep !== Infinity) msSinceStep += dtMs;
        if (logEveryMs > 0) {
          sinceLogMs += dtMs;
          if (sinceLogMs >= logEveryMs) {
            sinceLogMs = 0;
            log('[fps] level=' + current + ' fps=' + emaFps.toFixed(1) + ' frames=' + frames);
          }
        }
        if (forced) return { level: current, changed: false };
        if (cooldownMs > 0) { cooldownMs -= dtMs; return { level: current, changed: false }; }
        if (emaFps < DOWN_FPS) { belowMs += dtMs; aboveMs = 0; } else { belowMs = 0; }
        if (emaFps > UP_FPS) { aboveMs += dtMs; belowMs = 0; } else { aboveMs = 0; }
        if (belowMs >= DOWN_SUSTAIN_MS) {
          const idx = QUALITY_LEVELS.indexOf(current);
          if (idx > 0) return { level: current, changed: step(QUALITY_LEVELS[idx - 1], 'fps ' + emaFps.toFixed(1) + ' < ' + DOWN_FPS) };
          belowMs = 0;
        }
        if (aboveMs >= UP_SUSTAIN_MS) {
          const idx = QUALITY_LEVELS.indexOf(current);
          if (idx < QUALITY_LEVELS.length - 1) return { level: current, changed: step(QUALITY_LEVELS[idx + 1], 'fps ' + emaFps.toFixed(1) + ' > ' + UP_FPS) };
          aboveMs = 0;
        }
        return { level: current, changed: false };
      } catch (err) {
        return { level: current, changed: false };
      }
    },
  };
}

/**
 * Phase 3D-07: continuous dynamic resolution, borrowed from Ocean City
 * (pix / det, simple version: pixels only, no draw-distance scale).
 * The scaler (2E) stays the outer loop (discrete preset steps); pixScale is
 * the smoother inner loop: it moves first, in 0.1 steps, on the same
 * frame-time EMA the scaler already keeps.
 * - slow (EMA < 45 FPS): target down 0.1, floor 0.5.
 * - fast (EMA > 58 FPS): target up 0.1, ceiling 1.0.
 * - evaluated once a second; a rebuild (renderer.setPixelRatio + post
 *   targets) only happens when the move from the last applied value is
 *   over 15%, so a single 0.1 step never hitches a frame by itself.
 *   Exception: the extremes (1.0 and 0.5) always rebuild, so a fast device
 *   really returns to full resolution instead of sitting at 0.9 forever.
 * - anti-fight rule: the target never moves while the scaler changed preset
 *   less than 2 s ago (the caller passes scaler.msSinceStep).
 * - onApply(value) is called only on a real rebuild, with the new pixScale.
 * Never throws; tick returns { changed, value, pending }.
 */
export const PIXSCALE_MIN = 0.5;
export const PIXSCALE_MAX = 1.0;
export const PIXSCALE_STEP = 0.1;
export const PIXSCALE_REBUILD = 0.15;
export const PIXSCALE_EVAL_MS = 1000;
export function createPixScale({ onApply = null, onLog = null } = {}) {
  let target = PIXSCALE_MAX;
  let applied = PIXSCALE_MAX;
  let sinceEvalMs = 0;
  function log(line) {
    try { if (onLog) onLog(line); else if (typeof console !== 'undefined') console.info(line); } catch (err) { /* logging never breaks the game */ }
  }
  return {
    /** Last applied (really rendering) scale. */
    get value() { return applied; },
    /** Target scale (may be pending, under the 15% rebuild bar). */
    get target() { return target; },
    /** Applied scale as a percent, for the ?fps=1 readout (3D-09). */
    get percent() { return Math.round(applied * 100); },
    tick(dtMs, emaFps, msSinceStep) {
      try {
        if (!(dtMs > 0) || !Number.isFinite(dtMs)) return { changed: false, value: applied, pending: target };
        sinceEvalMs += dtMs;
        if (sinceEvalMs < PIXSCALE_EVAL_MS) return { changed: false, value: applied, pending: target };
        sinceEvalMs = 0;
        // Anti-fight: the scaler owns the 2 s after a preset step.
        if (msSinceStep !== Infinity && msSinceStep < COOLDOWN_MS) return { changed: false, value: applied, pending: target };
        if (emaFps === null || !Number.isFinite(emaFps)) return { changed: false, value: applied, pending: target };
        if (emaFps < DOWN_FPS && target > PIXSCALE_MIN) target = Math.max(PIXSCALE_MIN, Math.round((target - PIXSCALE_STEP) * 10) / 10);
        else if (emaFps > UP_FPS && target < PIXSCALE_MAX) target = Math.min(PIXSCALE_MAX, Math.round((target + PIXSCALE_STEP) * 10) / 10);
        else return { changed: false, value: applied, pending: target };
        // Rebuild only on a move over 15% from what is actually rendering.
        // Exception: the extremes (1.0 full, 0.5 floor) always rebuild, so a
        // fast device really gets back to full resolution instead of sitting
        // at 0.9 forever (the last 0.1 step up is only an 11% move).
        const atExtreme = target === PIXSCALE_MIN || target === PIXSCALE_MAX;
        if (!atExtreme && Math.abs(target - applied) / applied <= PIXSCALE_REBUILD) return { changed: false, value: applied, pending: target };
        const next = target;
        try { if (onApply) onApply(next); } catch (err) { return { changed: false, value: applied, pending: target }; }
        applied = next;
        log('[fps] pixScale -> ' + applied.toFixed(1) + ' (ema ' + emaFps.toFixed(1) + ' fps)');
        return { changed: true, value: applied, pending: target };
      } catch (err) {
        return { changed: false, value: applied, pending: target };
      }
    },
  };
}

/**
 * Tiny dev-only FPS readout (?fps=1). Off by default: with enabled=false
 * no element is created at all. With enabled=true a small corner text
 * shows live FPS + level, updated at most every 250 ms.
 * Phase 3D-09: with `extra` ({ worstMs, pixPct }) it also shows the worst
 * frame of the last second and the current render resolution percent.
 */
export function createFpsReadout({ enabled = false, doc = null } = {}) {
  if (!enabled) return null;
  let el = null;
  try {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) return null;
    el = d.createElement('div');
    el.id = 'fps-readout';
    el.textContent = 'fps --';
    d.body.appendChild(el);
  } catch (err) { return null; }
  let lastMs = 0;
  return {
    get element() { return el; },
    update(fps, level, nowMs, extra) {
      try {
        if (!el) return;
        if (nowMs - lastMs < 250) return;
        lastMs = nowMs;
        let text = 'fps ' + Math.round(fps) + ' ' + level;
        if (extra && Number.isFinite(extra.worstMs)) text += ' worst ' + Math.round(extra.worstMs) + 'ms';
        if (extra && Number.isFinite(extra.pixPct)) text += ' res ' + Math.round(extra.pixPct) + '%';
        el.textContent = text;
      } catch (err) { /* readout failure is not a game failure */ }
    },
    dispose() { try { if (el && el.remove) el.remove(); } catch (err) { /* ignore */ } },
  };
}

// Re-exported for tests and for main.js, so the preset table is read from one place.
export { QUALITY };
