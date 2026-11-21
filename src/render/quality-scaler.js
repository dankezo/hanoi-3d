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
 * per-device level, then phones start at med, desktops at high.
 */
export function resolveInitialQuality({ forced = null, stored = null, touch = false } = {}) {
  if (isLevel(forced)) return forced;
  if (isLevel(stored)) return stored;
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
    /** Feed one frame time (ms). Returns { level, changed }. Never throws. */
    tick(dtMs) {
      try {
        frames++;
        if (!(dtMs > 0) || !Number.isFinite(dtMs)) return { level: current, changed: false };
        const fps = 1000 / dtMs;
        const dtS = dtMs / 1000;
        if (emaFps === null) emaFps = fps;
        else emaFps += (fps - emaFps) * (1 - Math.exp(-dtS / EMA_TAU_S));
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
 * Tiny dev-only FPS readout (?fps=1). Off by default: with enabled=false
 * no element is created at all. With enabled=true a small corner text
 * shows live FPS + level, updated at most every 250 ms.
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
    update(fps, level, nowMs) {
      try {
        if (!el) return;
        if (nowMs - lastMs < 250) return;
        lastMs = nowMs;
        el.textContent = 'fps ' + Math.round(fps) + ' ' + level;
      } catch (err) { /* readout failure is not a game failure */ }
    },
    dispose() { try { if (el && el.remove) el.remove(); } catch (err) { /* ignore */ } },
  };
}

// Re-exported for tests and for main.js, so the preset table is read from one place.
export { QUALITY };
