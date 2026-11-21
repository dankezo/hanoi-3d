# Hanoi 3D - Phase 2E manifest (FPS boost)

Date: 2026-11-21. Fixer: Phase 2E agent. Status: built + verified by code,
scripts and build only. NOT pushed, NOT committed - all changes are in the
working tree of ~/workspace/hanoi-3d/ (repo https://github.com/dankezo/hanoi-3d).

Phases 2A + 2B + 2C + 2D are done and verified in the same working tree
(current bundle before 2E: index-BhY1MTDy.js). No 2A/2B/2C/2D file was
touched except where 2E genuinely needs shared code: none. The only files
2E changes are its own new module plus the five wiring points listed below.

## What the plan measured (from docs/fps-plan.md, not re-derived)

- DEFAULT_QUALITY was 'high' on EVERY device, no auto-scaler existed.
- High preset: maxDpr 2, MSAA 4x on a half-float HDR target at full
  resolution, shadow map 4096, DoF gather 36 taps, AO 10 taps, bloom +
  3-iteration spill, anisotropy 8.
- On a phone with devicePixelRatio 3, maxDpr 2 still means 4x the pixels
  of DPR 1, before MSAA 4x. Pixel count is the single biggest cost.
- Per-frame passes: scene -> HDR MSAA target [full res] -> AO [half res,
  10 taps] -> prefilter [half res] -> tile [1/8 res] -> gather bokeh
  [half res, 36 taps] -> fill [half res] -> bloom down + 2 blur
  [quarter res] + spill 3x2 [1/8 res] -> composite [full res]. Plus
  renderReflection: a SECOND scene render at 0.5x whenever inked water
  is in view - in Hanoi mode Hoan Kiem + Ho Tay sit near spawn, so it is
  nearly always on.
- Fold sim uses fixed 1/240 s substeps.

## Per-lever design (what, where, values before/after, why)

### 1. Auto quality scaler (the core fix) - NEW src/render/quality-scaler.js

- New small module, no THREE import, no DOM import at module level:
  pure logic + an injectable env/storage, so it unit-tests in Node.
- Wired into the main loop in src/main.js: `scaler.tick(dt * 1000)` runs
  inside `render(dt)` every frame, wrapped in try/catch so a scaler
  failure can never stop a frame. Boot never awaits the scaler: it is
  created synchronously after the first render targets exist, before
  `loop.start()`, with its own try/catch that leaves `scaler = null`
  (game keeps its starting quality) on failure.
- On a step, the scaler's `apply(next)` calls the four existing hooks:
  `setRendererQuality`, `lights.setQuality`, `materials.setQuality`,
  `post.setQuality`, then `resize()` (so the new pixel ratio takes
  effect) and `state.quality = next`. Life/animals keep their boot
  level (they read quality once at creation) - recorded, not changed.
- State machine (see below for thresholds + hysteresis).

### 2. Phone start + touch DPR cap

- Start level priority in src/main.js: explicit `?quality=` param, then
  the stored per-device level (`hanoi:quality`), then phones start at
  med, desktops at high. Before: `DEFAULT_QUALITY = 'high'` for all.
- Touch detection: `matchMedia('(pointer: coarse)')` matches, or
  `navigator.maxTouchPoints > 0`, or `ontouchstart` present.
- DPR cap in src/render/renderer.js: `setSize`/`setQuality` now use
  `effectiveMaxDpr(level)` instead of raw `q.maxDpr`. Touch screens
  never render above 1.5, even at high: high 2 -> 1.5 on touch,
  med 1.25 and low 1 unchanged (already below the cap). Desktop high
  stays 2. The cap lives in the renderer path, not in each call site.
- Choice recorded: high-on-touch is 1.5 (not med 1.25), because the
  scaler already starts phones at med (1.25); the 1.5 cap only binds
  when the user forces `?quality=high` on a phone or the scaler steps
  a phone back up to high.

### 3. MSAA / DoF / AO / shadow - via presets, values unchanged

- Finding: the plan's target values are ALREADY the med/low presets
  in src/core/config/render.js, so no preset number was changed:
  - MSAA: high 4, med 2, low 0 (plan: 4 -> 2 or 0 at lower levels).
  - DoF gather taps: high 36, med 22, low 14 (plan: 36 -> 22 med).
  - AO taps: high 10, med 6, low 0 (plan: 10 -> 6 or 0).
  - Shadow map: high 4096, med 2048, low 1024 (plan: 4096 -> 2048
    on phones - phones start at med, so they get 2048).
  - PCSS shadow taps: high [12, 20], med [8, 12], low [6, 8].
- The fix is wiring: before 2E nothing ever called the existing
  `setQuality` hooks after boot, so med/low never engaged on their
  own. Now the scaler steps down into these presets on measured low
  FPS, and `lights.setQuality` / `materials.setQuality` apply the
  shadow size + PCSS taps. `post.js` pass structure was NOT edited.
- DoF is never removed: `dof` is 'full' at med/high and 'cheap' at
  low (a label only - the gather/fill/composite passes are built and
  run at every level, with tap counts from the preset).

### 4. Water reflection throttle

- src/render/post.js: the reflection call is now gated per frame:
  high every frame, med every 2nd frame, low every 3rd frame at
  0.33x target scale (high/med stay 0.5x). Implemented with the pure
  helpers `shouldRenderReflection(frame, level)` /
  `reflectionScale(level)` from the scaler module.
- src/render/water.js: `renderReflection` takes an optional 7th arg
  `opts.scale` that overrides the mirror target scale. No other
  change to the pass.
- Why a skipped frame is safe (verified in code, not assumed):
  `renderReflection` zeroes `U.uRefl.value.x` and only assigns
  `U.uReflTex.value = rt.texture` at the END of a successful draw.
  Skipping the call touches neither, so the lakes keep showing the
  previous frame's mirror texture and strength - they update less
  often, they never go blank. The reflection is NOT removed:
  `minQuality` is still 'med', so low keeps the printed band only,
  exactly as before.
- In Hanoi mode the lakes sit near spawn, so this throttle is nearly
  always active at med/low - that is the point.

### 5. Fold substeps

- src/core/config/fold.js: `maxSubSteps` 30 -> 12. Honest note: the
  loop already caps dt at 1/20 s, so one `fold.update` can need at
  most 12 steps at 1/240 s - 12 binds only if a larger dt ever
  reaches fold.update. The cap discards the remainder (the fold
  just runs slower that frame), so there is no spiral of death.
  No change to src/world/fold.js or wfc.js or world.js streaming.

### 6. FPS readout + frame-time logging

- `?fps=1` (dev only, off by default): src/main.js creates the
  readout only when `params.get('fps') === '1'`. `createFpsReadout`
  returns null otherwise and no element exists. When on, a small
  monospace corner text (bottom-left, the free corner - checklist
  is top-left, lang top-right, minimap bottom-right) shows
  `fps <n> <level>`, updated at most every 250 ms. CSS added to
  index.html (`#fps-readout`); no element is added to the HTML.
- Console logging: the scaler logs `[fps] level=<l> fps=<ema>
  frames=<n>` every 5 s, and `[fps] quality <a> -> <b> (<reason>)`
  on every step. The user / fresh-browser check can report these
  numbers with `?fps=1`.

### 7. What was deliberately NOT changed

- No change to landmark anchors, ids, discovery, storage keys
  (`hanoi:v1:<seed>` untouched), or any game logic.
- No change to default desktop behavior when FPS is fine: desktop
  starts at high and the scaler only steps down on MEASURED low FPS.
- No change to the post.js pass structure, wfc.js, tiles.js solver
  logic, world.js streaming, or the QUALITY preset numbers.
- No new dependencies. No secrets anywhere.

## Scaler state machine

- Levels: low - med - high (one step at a time, never jumps two).
- Measurement: frame-time EMA with time constant 0.5 s
  (`ema += (fps - ema) * (1 - exp(-dt / 0.5))`), so the EMA settles
  in about 1-2 s of frames.
- Step down: EMA FPS < 45 sustained for 2000 ms.
- Step up: EMA FPS > 58 sustained for 3000 ms.
- Hysteresis (so it does not flap): the up bar (58) is 13 FPS above
  the down bar (45); the up wait (3 s) is longer than the down wait
  (2 s); and a 2 s cooldown after every step freezes all stepping.
  A short dip (under 2 s) never steps down - verified in check-2e.
- Forced level: when the starting level came from an explicit
  `?quality=` param, the scaler only measures and logs; it never
  calls apply and never writes storage.
- Persistence: every scaler step writes `hanoi:quality` to
  localStorage; the next load restores it (it beats the phone-start
  rule, because storage is per device). Junk stored values are
  ignored. A throwing storage (blocked/full) is swallowed.
- Failure containment: `apply()` is wrapped in try/catch inside the
  scaler - on failure the level is restored to the previous one and
  the step is retried after the cooldown. A throwing `onChange`
  listener cannot break a step. `tick()` itself never throws
  (zero/negative/NaN frame times are ignored).

## Files changed / added (2E only)

- NEW src/render/quality-scaler.js - scaler, touch/DPR helpers,
  reflection throttle helpers, FPS readout, storage helpers.
- NEW tools/check-2e.mjs - 104-check unit + source test (see below).
- NEW docs/phase-2e-manifest.md - this file.
- EDIT src/main.js - resolve the starting level (forced > stored >
  phone med / desktop high), create the scaler + readout before
  loop.start(), tick it in render(dt), apply via the four setQuality
  hooks + resize + state.quality. Document `?fps=1` in the header.
- EDIT src/render/renderer.js - pixel ratio via effectiveMaxDpr
  (touch cap 1.5), tracked level string for setQuality.
- EDIT src/render/post.js - reflection throttle gate (frame counter
  + shouldRenderReflection + scale override). Pass structure untouched.
- EDIT src/render/water.js - renderReflection `opts.scale` override
  + comment that skipping a frame keeps a valid texture.
- EDIT src/core/config/fold.js - maxSubSteps 30 -> 12.
- EDIT index.html - `#fps-readout` CSS only (no new element).
- NOT touched: src/core/config/render.js (presets already correct),
  src/world/fold.js, src/world/wfc.js, src/world/tiles.js,
  src/world/world.js, src/game/*, src/core/config/shared.js
  (DEFAULT_QUALITY 'high' stays as the fallback inside
  qualitySettings), any 2A/2B/2C/2D file.

## Verification evidence (exact counts / outputs)

- node --check: 7/7 JS files pass (quality-scaler.js, renderer.js,
  post.js, water.js, main.js, config/fold.js, check-2e.mjs).
  (index.html is not JS; node --check on it is meaningless.)
- npm run build: PASS, vite 8.3.8, 65 modules, bundle
  dist/assets/index-BzE90V-W.js (1,106.45 kB, gzip 334.99 kB).
- npm run check:hanoi: ALL CHECKS PASSED, 161 PASS lines, solver
  options 95 <= 96, MODELS 48, all 1600 cells resolve, 0 unresolved.
- node tools/check-2e.mjs: 104 PASS, 0 FAIL. Covers (a) 30 FPS for
  12 s steps high -> med -> low, (b) 70 FPS steps med -> high and
  low -> med -> high, (c) never below low / above high, short dip
  under 2 s does not step down, (d) forced ?quality= never
  overridden (high stays high at 20 FPS, low stays low at 120 FPS,
  no apply, no storage write), (e) phones start med / desktops
  high, forced/stored beat phone start, (f) step persists
  hanoi:quality and is restored, junk/throwing storage ignored,
  (g) touch maxDpr cap (high touch 1.5, desktop 2, med touch 1.25,
  low 1; renderer uses effectiveMaxDpr), (h) reflection throttle
  (high every frame, med every 2nd, low every 3rd; low scale 0.33;
  uRefl zeroed only inside renderReflection, 1 site; uReflTex only
  assigned after a draw; minQuality still med), (i) DoF passes
  still run at every level (gather/fill/composite built + run,
  taps from preset, low dofTaps 14 / med 22 / high 36),
  (j) ?fps=1 readout off by default (null, no element; enabled
  only for ?fps=1; fake-DOM readout shows "fps 60 high"),
  plus preset values, fold cap, boot-never-awaits-scaler,
  throwing apply/onChange containment, EMA convergence, and a
  long-dash sweep. Two test-harness bugs found during the run
  (feed recorded the pre-step level; the no-await regex matched
  the word "awaited" in a comment) were fixed in the test, not
  in the scaler.
- Regression (prior phases still pass, same tree):
  check-2b ALL 2B CHECKS PASSED, check-2c 89 PASS 0 FAIL,
  check-2d 139 PASS 0 FAIL, check-basic ALL BASIC CHECKS PASSED.
- Long dashes: 0 in all 8 changed files (verified by Python
  codepoint count U+2013/U+2014; a grep hit on check-2e.mjs was
  only the `\u2013` escape text inside the test regex itself).
- npx impeccable detect: HUNG - `timeout 180 npx impeccable detect`
  produced zero output in 180 s (killed by timeout; the echo exit=0
  is tail's exit, not a verdict). Tool failure, not a pass - the same
  hang as the 2A/2B/2C/2D agents (5 prior hangs). No findings were
  produced, so nothing new was learned about the code from this run.
- No git commit, no push, nothing touched on the remote (per task).

## What you could NOT verify live

- NO real FPS numbers exist. The sandbox has no browser and no GPU,
  so every gain here is a code-level estimate: pixel count at high
  on a DPR-3 phone drops 4x when the scaler steps to med (maxDpr
  2 -> 1.25) and a further step to low (maxDpr 1, MSAA 0, no AO,
  no bloom, reflection every 3rd frame at 0.33x); the reflection
  pass halves at med and drops to one-third of its frames at low;
  the DoF gather drops from 36 to 22 to 14 taps. How much of that
  turns into smooth play on his phone is unproven until the
  parent's fresh-browser check and the user's device check, where
  the user reports the feel (and can report `?fps=1` numbers).
- The scaler's real-world timing (EMA settle, step-down latency,
  whether med is enough on his phone) is unproven for the same
  reason. The test feeds exact mocked frame times only.
- The reflection skip was verified by code reading only (uRefl /
  uReflTex persistence); no visual check that a 2nd/3rd-frame-old
  mirror looks fine while walking past a lake.
- The fold cap change (30 -> 12) is a no-op under the current loop
  dt cap (max 12 steps anyway); it only binds if a larger dt ever
  reaches fold.update.

## Remaining risks

- Scaler flapping: mitigated by the 45/58 gap + 3 s up wait +
  2 s cooldown, but a device hovering at 45-58 FPS with a noisy
  frame time could still step down, recover, step up, and repeat
  over minutes. The 5 s console log makes this visible; if seen,
  widen the gap or lengthen the cooldown.
- Med may not be enough on his phone: if the phone still lags at
  med, the scaler will step to low (maxDpr 1, no MSAA/AO/bloom).
  If low is still not enough, the remaining levers are outside
  this phase (postScale below 0.5, shadow off, or a static-image
  fallback) - none were taken here.
- Reflection skip artifacts: at med the mirror is one frame old
  half the time; while walking fast past Hoan Kiem the reflection
  may visibly lag the scene by a frame. Low (every 3rd frame) is
  more visible. Acceptable trade, but watch his screenshots.
- Life/animals do not follow scaler steps (boot level only): their
  particle counts stay at the starting level. Small cost, but a
  phone that steps to low still pays high-level life particles.
- The stored level is per device but shared across maps: a stored
  'low' from a bad Hanoi session also starts the WFC world at low
  until the scaler steps it back up (3 s at > 58 FPS).
- Impeccable detect hung again (6th consecutive hang, 180 s, zero
  output) - tool failure, not a pass and not a verdict on the code.

## Coordinator follow-up (verifier FAIL, fixed before push)

- Periodic console log in normal play (verifier check 8, minor FAIL): main.js
  created the scaler without logEveryMs, so the scaler default (5000 ms) made
  console.info fire every 5 s even without ?fps=1 (verifier harness T19a).
  Fix: main.js now passes logEveryMs: showFps ? 5000 : 0 (one line). Re-checked
  by the coordinator with a fresh harness against the real scaler module:
  0 console.info calls over 10 s of frames with logEveryMs 0 (silent in normal
  play), 2 calls with logEveryMs 5000 (dev log still works with ?fps=1).
- Not fixed (verifier optional note): tick() returns the pre-step level on the
  step frame. Zero in-game impact (main.js discards the return), left as is.
- Re-verified after the fix: node --check, build, check:hanoi, check-2e,
  check-2d, check-2c, check-2b, check-basic (counts in the coordinator's 2E report).
