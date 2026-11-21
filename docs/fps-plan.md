# Hanoi 3D - FPS plan (Phase 2E)

Prepared 2026-11-21 from reading src/render/post.js, src/render/renderer.js, src/render/water.js, src/core/config/render.js + shared.js, src/main.js. No code changed yet.

## Why it lags now (measured from code, not guessed)

- DEFAULT_QUALITY is 'high' on EVERY device (shared.js:24). No auto-scaler exists. The user can pass ?quality=med|low by hand, but nothing measures FPS.
- High preset: maxDpr 2, MSAA 4x on a half-float HDR target at FULL resolution, shadow map 4096, DoF gather 36 taps, AO 10 taps, bloom + 3-iteration spill, anisotropy 8, grain + chroma + sharpen on.
- On a phone with devicePixelRatio 3, maxDpr 2 still means 4x the pixels of DPR 1, before MSAA 4x. That is the single biggest cost.
- Per-frame passes (post.js render): scene -> HDR MSAA target [full res] -> AO [half res, 10 taps] -> prefilter [half res] -> tile [1/8 res] -> gather bokeh [half res, 36 golden-angle taps] -> fill [half res] -> bloom down + 2 blur [quarter res] + spill 3x2 passes [1/8 res] -> composite [full res, many depth taps for rim, chroma, sharpen, grain]. Plus renderReflection (water.js:434): a SECOND scene render at 0.5x whenever inked water is in view - in Hanoi mode Hoan Kiem + Ho Tay sit near spawn, so it is nearly always on (no MSAA, no shadow re-render, but still a full scene pass).
- Shadows: 4096 map on high + PCSS in materials.js (blocker search + wide PCF).
- Fold sim uses fixed 1/240 s substeps - CPU cost spikes on slow frames.

## Fix order (biggest win first, measure after each)

1. Auto quality scaler (the core fix): frame-time EMA over ~2 s; step down high -> med -> low when avg FPS < 45 sustained, step up when > 58 sustained. Persist per device in localStorage (key hanoi:quality). Start phones at med, not high. Hooks already exist: post.setQuality(level) + renderer.setQuality(level) + qualitySettings(level).
2. Cap maxDpr harder on phones: high maxDpr 2 -> 1.5 on touch/small screens (or start at med 1.25). Pixel count dominates everything else.
3. MSAA 4 -> 2 or 0 on the HDR target: the DoF blur + flat paper style hide aliasing; verify visually at 1440 + phone.
4. Water reflection: update every 2nd frame, or scale 0.5 -> 0.33, or skip when no water in the camera frustum (REFLECT.count already gates it - check it is actually 0 when lakes are off-screen). Measure with lakes in view vs not.
5. DoF gather taps 36 -> 22 (med value): the bokeh gather is the most expensive post pass.
6. AO taps 10 -> 6 or 0: AO is subtle on flat paper cards; A/B it.
7. Shadow map 4096 -> 2048 on phones; reduce PCSS taps.
8. Fold substeps: cap substeps per frame when dt spikes (avoid spiral of death on slow frames).
9. Measure: add a tiny FPS readout (?fps=1, small corner text, dev only) + frame-time log; the user's phone is the decider - he reports the feel after each step.

## Quality presets (current, for reference)

- low: maxDpr 1, msaa 0, aoTaps 0, dofTaps 14, postScale 0.5, bloom off, shadow 1024, chroma off, fill off
- med: maxDpr 1.25, msaa 2, aoTaps 6, dofTaps 22, postScale 0.5, bloom on, shadow 2048
- high: maxDpr 2, msaa 4, aoTaps 10, dofTaps 36, postScale 0.5, bloom on, shadow 4096, anisotropy 8

## What NOT to do

- Do not drop the tilt-shift DoF look entirely - it is the paper identity. Reduce taps/resolution first.
- Do not set maxDpr 1 on desktop - keep 2 where the GPU can carry it (scaler decides).
- Do not claim a fix from code estimates - FPS is verified on his phone, by his feel.
