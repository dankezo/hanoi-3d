# Hanoi 3D - Phase 2E verification (INDEPENDENT)

Date: 2026-11-21. Verifier: independent agent (verify only - no source file
edited, nothing committed, nothing pushed). Working tree:
~/workspace/hanoi-3d/. Fixer manifest read first:
docs/phase-2e-manifest.md, plus docs/fps-plan.md and
~/workspace/3d-lab/WORKFLOW-hanoi-3d.md.

Method: every claim recomputed with my own fresh scripts under
/tmp/2e-verify/ (harness.mjs, 60 checks, imports the REAL scaler module
and drives it with scripted frame times). The fixer's tools/check-2e.mjs
was NOT used as evidence, only re-run once at the end as a cross-check
(it agreed: 104 PASS, 0 FAIL). Code was read directly for every wiring
claim. Short hyphens only in this report.

## Verdicts (one line each)

1. Scaler state machine - PASS. Own harness 60/60: step down high -> med
   at 2.03 s, med -> low at 6.10 s at 30 FPS; step up med -> high at 3.01 s,
   low -> med -> high at 3.01 s / 8.04 s at 70 FPS; cooldown blocks a second
   step before 6.0 s; 50/46/57 FPS step nowhere (dead band); low/high bounds
   hold; mean-50 FPS alternating frames: 0 steps in 30 s (no flap); EMA
   63.2% convergence measured 0.500 s both directions (claimed tau 0.5 s).
2. Start priority - PASS. forced > stored > phone med / desktop high, all 8
   matrix cases pass; junk forced/stored ignored; throwing storage ignored.
   Phone detection is exactly: matchMedia('(pointer: coarse)'), or
   navigator.maxTouchPoints > 0, or ontouchstart present. No screen-size check.
3. DPR cap - PASS. effectiveMaxDpr: touch high 1.5, desktop high 2, med 1.25,
   low 1 (both devices). renderer.js setSize and setQuality both use
   cappedDpr(), so the cap applies on every resize/setQuality path, not boot only.
4. Presets unchanged + step-down changes rendered cost - PASS.
   src/core/config/render.js is byte-identical to git HEAD (cmp clean, empty
   diff): MSAA 4/2/0, DoF 36/22/14, AO 10/6/0, shadow 4096/2048/1024,
   PCSS [12,20]/[8,12]/[6,8]. Per-level cost change traced: post.setQuality
   rebuilds materials (dofTaps, aoTaps, bloom/chroma/sharpen defines) and
   targets (MSAA samples); renderer.setQuality sets pixel ratio via the cap;
   lights.setQuality resizes the shadow map and disposes the old one;
   materials.setQuality updates PCSS tap defines and anisotropy.
5. Reflection throttle - PASS. Gate in post.js render() uses the CURRENT
   qLevel (setQuality updates it synchronously), so a mid-game scaler step
   changes the throttle at once. Helpers measured: high 30/30 frames,
   med 15/30, low 10/30, scales 0.5/0.5/0.33. Skipped-frame safety traced:
   U.uRefl.value.x is zeroed only inside renderReflection (water.js:444),
   U.uReflTex.value is assigned only after a draw (water.js:550), and no
   other file in src/ writes either. Precision notes: (a) at low the mirror
   is off entirely, but that is PRE-EXISTING minQuality 'med' behavior,
   verified in git HEAD (water.js:52, post.js pre-2E called it every frame),
   not a 2E removal; 2E only thins med/high. (b) On a gated call that
   early-returns (water out of frustum, camera below clip) uRefl.x IS zeroed
   - also pre-existing, unchanged by 2E.
6. Fold substeps - PASS. maxSubSteps 30 -> 12 confirmed (HEAD had 30).
   Arithmetic: loop caps dt at 1/20 s (loop.js:14, maxDt = 1/20), fold step
   is 1/240 s (fold.js maxStep), so (1/20)/(1/240) = 12 steps max; the
   accumulator leftover is under 1 step, so k = floor((leftover + dt)/h)
   is at most 12 always. The cap can never bind under the current loop,
   so the change is a no-op as the fixer honestly noted. Only call site is
   world.js:1124, fed the loop-capped dt; boot update(0) early-returns.
7. DoF at all levels - PASS. post.js buildMaterials builds gather/fill/
   composite unconditionally (lines 488-489, 498-507) and render() runs
   pre/tile/gather/fill unconditionally when full. Low uses dofTaps 14.
   The 'cheap'/'full' dof label in the presets is read nowhere (only
   CONFIG.dof is used, post.js:561) - a label only, as claimed.
8. ?fps=1 readout - FAIL (minor, one line to fix). Element/throttle/
   position all pass: no element exists without ?fps=1 (0 matches for
   id="fps-readout" in index.html, only CSS at line 39, bottom-left
   12px/12px); enabled only when params.get('fps') === '1' (main.js:41);
   fake-DOM harness shows text 'fps 60 high', 250 ms throttle blocks a
   +100 ms update and passes a +300 ms one. BUT the 5 s console [fps] log
   fires in NORMAL play with no ?fps=1: main.js creates the scaler with no
   onLog and no logEveryMs, so the scaler default (logEveryMs 5000,
   onLog console.info) logs one line every 5 s forever. My harness T19a
   proves it fires with no readout enabled. That breaks the "no console
   spam unless enabled" criterion. Fix: pass logEveryMs: showFps ? 5000 : 0
   in the createQualityScaler call in main.js. The step-change log is fine
   (rare, diagnostic, only when quality actually changes).
9. Failure containment + boot - PASS. Boot never awaits the scaler: it is
   created synchronously (main.js:176-189) after the first render targets,
   before loop.start(), inside its own try/catch that leaves scaler = null.
   render(dt) wraps scaler.tick in try/catch (main.js:125); tick() itself
   never throws (inner try/catch, NaN/0/negative/Inf frame times ignored -
   harness T10); apply() failures restore the previous level and retry
   after cooldown (harness T16: throw on 1st apply keeps high, 2nd apply
   lands med); a throwing onChange cannot break a step (harness T17).
   A scaler throw cannot break the render loop: the tick call is wrapped
   and post.render runs after it unconditionally.
10. Build + regressions - PASS. npm run build: 65 modules, bundle
    dist/assets/index-BzE90V-W.js 1,106.45 kB, gzip 334.99 kB (exact match
    to fixer claim). npm run check:hanoi: ALL CHECKS PASSED, 161 PASS lines
    counted by me, solver 95, MODELS 48, 1600 cells, 0 unresolved.
    check-2b ALL 2B CHECKS PASSED; check-2c 89 PASS 0 FAIL; check-2d
    139 PASS 0 FAIL; check-basic ALL BASIC CHECKS PASSED. node --check 7/7
    on the changed JS files. Long dashes: 0 codepoints (U+2013/U+2014) in
    all 9 2E files (Python codepoint count, not grep).
11. 2A/2B/2C/2D regression scope - PASS. File mtimes: the 8 newest files in
    the tree are exactly the 2E files (quality-scaler.js, renderer.js,
    post.js, water.js, main.js, fold.js, index.html, check-2e.mjs,
    03:38-03:40); the next newest is edge.js 03:35 (2D). No 2A/2B/2C/2D file
    was touched in the 2E window. GLB sizes unchanged: basic-grand.glb
    704,872 bytes (2A manifest value), hanoi-tiles.glb 2,496,552 bytes
    (2B manifest value). Edge flag default still '' (edge.js:22). Worker
    scaffold untouched (workers/hanoi-edge/src/index.js mtime 03:23).
12. Impeccable - FAIL (tool failure, not a code verdict). timeout 180 npx
    impeccable detect: zero output in 180 s, killed by timeout (the
    exit=0 is the echo's exit, not a verdict). 6th consecutive hang.
    No findings produced, nothing learned about the code.

## FPS gains - UNVERIFIED (no device, no GPU in sandbox)

No FPS numbers can be proven without a live browser/GPU. The code-level
savings are real (pixel count at high on a DPR-3 phone drops when the
scaler steps to med: maxDpr 2 -> 1.25; low adds maxDpr 1, MSAA 0, no AO,
no bloom, reflection every 3rd frame at 0.33x; DoF gather 36 -> 22 -> 14
taps), but how much of that becomes smooth play on his phone is unproven
until the parent's fresh-browser check and the user's device check with
?fps=1. Same for the scaler's real-world timing and whether med is enough
on his phone. The reflection-skip visual (1-2 frame old mirror while
walking fast past a lake) was verified by code reading only.

## Observations (not fails)

- tick() returns a stale level on the step frame: `return { level: current,
  changed: step(...) }` reads `level` before step() runs, so the return says
  level=high changed=true while scaler.level is already med (probe:
  "step frame: returned level=high changed=true but scaler.level=med").
  Zero in-game impact (main.js discards the return value), but any future
  caller reading the return would be misled. Optional one-line fix:
  capture the step result first, then return the new level. The fixer's own
  check-2e hit the same quirk and fixed its test instead of the scaler.
- First-frame EMA seeding: emaFps is set to the first frame's FPS instantly,
  so one slow first frame starts below-threshold accumulation at once; the
  2 s sustain requirement makes this benign (a 1.5 s dip to 25 FPS at 60 FPS
  baseline does not step down - harness T18).
- Alternating 30/70 FPS frames average a TRUE 42 FPS (mean frame time
  23.8 ms), so the scaler correctly steps down twice there - that is not
  flapping. The fair flap test (alternating 10/30 ms frames, true mean
  50 FPS in the dead band) gives 0 steps in 30 s.
- Life/animals keep their boot level (they read quality once at creation),
  as the manifest records: a phone that steps to low still pays
  high-level life particles. Small cost, unchanged by this phase.

## Top 3 risks

1. No real FPS numbers exist. If med is not enough on his phone, the scaler
   will step to low; if low is still not enough, the remaining levers are
   outside this phase (postScale below 0.5, shadow off, static-image
   fallback). His device check is the decider.
2. Slow oscillation over minutes on a device hovering near the 45/58
   boundary (manifest's own risk): step down, recover, step up, repeat.
   The 5 s console log is the visibility for this - which is also why the
   unconditional log in item 8 should be gated, not removed: keep it
   behind ?fps=1 so the fresh-browser check can still read it.
3. Reflection staleness at med/low while walking fast past Hoan Kiem / Ho Tay:
   the mirror is 1-2 frames old half to two-thirds of the time. Probably
   invisible on flat paper water, but never seen live.

## Recommendation

Small fixer round first, then proceed to push. The round is two tiny items:
(1) REQUIRED: gate the 5 s periodic [fps] console log behind ?fps=1 -
pass logEveryMs: showFps ? 5000 : 0 in the createQualityScaler call in
src/main.js (step-change logs stay as-is). Re-run my harness T19a shape
(log count 0 without ?fps=1) plus the build. (2) OPTIONAL: fix the tick()
stale-level return (return the post-step level). Everything else in the
phase passes with fresh evidence, and no 2A/2B/2C/2D regression was found.
