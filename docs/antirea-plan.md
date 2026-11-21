# Hanoi 3D - antiRea plan (Phase 2D)

Prepared 2026-11-21. Sources: dankezo/antiRea README (main, SHA 2641e42) + skills/anti-rea/SKILL.md (v3.3.0).

## Correction: antiRea is NOT the anti-slop design skill

- antiRea = server-side TypeScript library (Node >= 20, zero runtime deps, npm @dannyphan190/anti-rea, v3.3.0) that meters DATASET access per identity and flags coordinated bot abuse: bulk extraction, slow harvesting, enumeration walks, scheduler-driven herds, seat squatting. Advisory only (enforcement: "none") - the host decides the response; strongest legitimate reaction is step-up (extra verification) for NEW actions only.
- "Chong dao nhai" = anti-cloning of the DATA. README: "You cannot hide code a browser has already received - so antiRea defends the other side: the data itself."
- The anti-AI-slop DESIGN rules live in the local skill ~/workspace/custom-skills/anti-ai-slop-design/SKILL.md. Different thing. Do not confuse them in the spec.

## What is valuable and copyable in Hanoi 3D

- Hanoi map data: 40x40 grid + landmark positions (src/world/hanoi-map.js, hanoi.js)
- Landmark history content: docs/landmark-history.md (10 landmarks, EN+VI, fun facts)
- Art: atlas.webp + atlas.json (194 sprites), public/models/hanoi-tiles.glb (14 nodes)
- All of it is currently static on GitHub Pages: anyone can download it whole. antiRea cannot run on Pages (no server) and cannot run in the browser.

## How to apply it maximally (honest version)

The data must move behind a metered server layer for antiRea to matter. Static files served straight from Pages stay copyable - that is the README's own limit, not a failure of the plan.

1. Thin edge layer in front of the data (Cloudflare Worker or Vercel Edge Function, Node 20+):
   - Serve the Hanoi map + landmark history as a small API (/api/map, /api/landmarks) instead of static JS files.
   - Meter per identity (IP + lightweight client id) with createRecordBudget (cap distinct records per window) + createQuotaGuard (request quotas).
   - Feed serves to createHerdDetector (coordination across identities) + createShrinkSlopeSignal / createCusumTripwire (slow per-identity harvesting).
2. Canary + provenance:
   - Plant canary/decoy records in the data (createCanaryMaze / handleCanaryTrapRequest); a scraper that republishes them proves the copy.
   - createDeclarationLog (hash-chained, predates any copy) + createValueWatermark for the landmark-history dataset, so a republished copy is provably ours.
3. Surface guard:
   - createSurfaceGuard on API responses: only declared fields leave the server (no internal ids, no build metadata).
4. Step-up, never hard-block:
   - When a signal fires, step up NEW actions only (createVerificationGrace + createStepUp402Responder, 402 + manifest, no settlement). Real users already playing are never kicked, muted or throttled. Defaults stay lab-frozen until the site has its own traffic measurements; lab numbers are simulation numbers, present them that way.
5. What stays static (and honestly copyable):
   - The game shell, three.js, atlas.webp, hanoi-tiles.glb served from Pages. Anyone can copy the art files; antiRea protects the live DATA (map + history), not the pixels. If he wants the art protected too, that needs a different mechanism (watermarking, not antiRea).

## Open decisions for the user (ask with the spec approval)

- Edge host: Cloudflare Worker (free tier, sits in front of Pages) vs Vercel Edge Function vs leave static for now and do only canary + declaration log (no metering).
- Identity: IP-only (simple, shared IPs collide) vs IP + client id cookie (better, still bypassable by a determined cloner - say so plainly).
- Step-up UX: what the challenge looks like when a budget trips (simple interstitial page, not a ban).

## Checklist item 5 (corrected)

Was: "chay bo check anti-slop len toan bo UI". Correct: "ap antiRea (chong clone du lieu) toi da: dua map + lich su landmark ra sau mot lop edge API co meter per-identity + herd detection + canary/provenance, step-up chu khong block; art tinh van copy duoc, noi ro gioi han."
