# Phase 2D verification - antiRea (independent verifier)

Date: 2026-11-21. Verifier work only: no source file edited, nothing
committed, nothing pushed, nothing deployed, no Cloudflare/Vercel API
called. All checks below are fresh scripts written for this verification
in /tmp/2d-verify/ (canary.mjs 29 checks, edge.mjs 15 checks, worker.mjs
45 checks, quota-id.mjs targeted probe), plus commands run directly. The
fixer's tools/check-2d.mjs was read for format and run only as a
cross-check at the end; no verdict below rests on it. Two of my own
harness bugs were caught and fixed during the run (canary.mjs first
counted any mention of the word "canary" in src/ as a fail, which
wrongly flagged the rejection guard in edge.js; edge.mjs first sliced
the canary entry out of its own tainted payload before sending it).
Both are recorded here so the counts are honest.

## Verdicts (one line each, detail below)

- 1. antiRea API names vs installed 3.3.1 - PASS
- 2. Canary invisibility - PASS
- 3. Declaration + watermark - PASS
- 4. Worker routes (own mocked harness) - PASS
- 5. Client wiring (flag off, fallback) - PASS
- 6. Build + regressions - PASS
- 7. The two bugs the fixer says it caught - PASS (both re-proven)
- 8. Secrets + long dashes - PASS
- 9. 2A/2B/2C regression scope + GLB sizes - PASS (with one scope caveat)
- 10. Quota identity wording (manifest + README say "per identity") - FAIL (doc/behavior mismatch, see below)
- 11. Impeccable detect - UNVERIFIED (tool hangs, 5th consecutive time)
- 12. Live deploy + live browser - UNVERIFIED

## 1. antiRea API names - PASS

- Installed package found at workers/hanoi-edge/node_modules/@dannyphan190/anti-rea, version 3.3.1. `npm view @dannyphan190/anti-rea version` (read-only) also returns 3.3.1, so 3.3.1 is the latest, as the manifest claims.
- Checked every name the manifest lists against the real installed module (node require of dist/index.js, typeof check):
  - Present, all functions: createRecordBudget, createQuotaGuard, createExportGuard, createSurfaceGuard, createOwnershipProbe, createHerdDetector, applyHerdLadder, createCanaryMaze, createDecoyMirage, createDeclarationLog, createValueWatermark, createVerificationGrace, createStepUp402Responder, createShrinkSlopeSignal, createCusumTripwire, createEvalueTripwire, handleCanaryTrapRequest, createCanaryRoute.
  - `createCanaryTrapRequest`: undefined (no export). Confirmed absent, as claimed.
  - `handleCanaryTrapRequest`: function. Confirmed present and used by the Worker.
- Nuance, not a fail: six of the verified names exist in the package but are NOT imported or used by the Worker: createExportGuard, createOwnershipProbe, createDecoyMirage, createShrinkSlopeSignal, createCusumTripwire, createEvalueTripwire (grep over workers/hanoi-edge/src/index.js: 0 hits). The Worker uses exactly 11 names: createRecordBudget, createQuotaGuard, createSurfaceGuard, createHerdDetector, applyHerdLadder, handleCanaryTrapRequest, createCanaryMaze, createStepUp402Responder, createVerificationGrace, createDeclarationLog, createValueWatermark. The manifest's "verified present" is true as exports; a reader could wrongly infer all 17 are wired in. No slow-harvest tripwire (shrink slope / cusum / evalue) is actually wired into any route, so the plan's step 1 item on slow harvesting is only partly built (herd + budget + quota are wired; per-identity slow-harvest signals are not).

## 2. Canary invisibility - PASS (29/29 in /tmp/2d-verify/canary.mjs)

- 2 canary landmarks + 2 canary histories, ids canary-ho-guom-bac and canary-thap-dong, markers exactly HANOI3D-CANARY-MAP-7F3A9D and HANOI3D-CANARY-HIST-2B8E41. Both carry canary: true; the history marker sits inside both funEN and funVI.
- Anchors outside the grid by the numbers: [99, 99] and [-99, -99]; grid coords are -20..19.
- Real map provider: 0/1600 cells carry a canary landmarkId (createHanoi({seed: 1}), every cell read via h.get(x, z)).
- landmarkInfo('canary-ho-guom-bac') and landmarkInfo('canary-thap-dong') both return null. LANDMARK_INFO, HANOI_LANDMARKS and the game list (EDGE_LANDMARK_IDS) each have exactly the 10 real ids, zero canary.
- No file under src/ imports canary.js (import-pattern grep over all src .js files: 0 hits). The five display/map/boot files (landmarks.js, landmark-history.js, hanoi.js, hanoi-map.js, main.js) never mention the word "canary" (0 hits).
- The only other src mention is src/core/config/edge.js, which mentions the "canary-" prefix solely as a rejection guard in validLandmarksData (id.startsWith('canary-') returns false; no import of canary.js, no display path). Judged safe: it can only reject data, never surface a canary.
- Outside canary.js, the canary ids/marker strings appear only where they belong: docs/antirea-declaration.md, docs/phase-2d-manifest.md, workers/hanoi-edge/src/index.js (DECLARATION_TEXT + provenance payload + trap list), workers/hanoi-edge/README.md (deploy check), data/provenance.json (ids + markers), tools/check-2d.mjs (test). None of those files is imported by the game; the Worker trap list is the only runtime use, and it returns 404, never data.

## 3. Declaration + watermark - PASS

- Read docs/antirea-declaration.md and data/provenance.json in full. Both state owner dankezo, source https://github.com/dankezo/hanoi-3d, license MIT, the canary scheme with both ids and both markers, the watermark marker, metering (11 records / 24h, 120/hour, 402 step-up, 24h grace), and that static art stays copyable.
- Marker HANOI3D-DANKEZO-WM-9Q7K2M present at the exact claimed spots: src/game/landmark-history.js line 196-200 (DATASET_PROVENANCE.watermark), src/world/hanoi-map.js line 30 (HANOI_DATASET_MARKER), data/provenance.json (watermark), docs/antirea-declaration.md, and the Worker DECLARATION_TEXT.
- Checklist order as found in the game code (DATASET_PROVENANCE.order): hoankiem, ngocson, westlake, oldquarter, mausoleum, vanmieu, onepillar, cathedral, opera, longbien. It matches Object.keys(LANDMARK_INFO) exactly, and matches provenance.json checklistOrder exactly.
- Marker uniqueness: grep for partial fragments (HANOI3D-DANKEZO, HANOI3D-CANARY) across the repo hits only the files listed in section 2 plus the two marker definitions; no real landmark name, history line, or map row contains a fragment, so no collision with real content. The game never reads DATASET_PROVENANCE or HANOI_DATASET_MARKER (grep: only their definitions + the Worker/provenance references), so the watermark changes no displayed text.

## 4. Worker routes - PASS (45/45 in /tmp/2d-verify/worker.mjs)

Own harness, mocked Request/Response, different IPs and a different herd partition than the fixer's test. All against the real Worker source via createHanoiEdgeApp.

- (a) GET /api/map: 200, size 40, 40 rows of 40 chars, rows identical to the bundled HANOI_ROWS, landmarks exactly the 10 real ids, top-level fields exactly size,rows,legend,landmarks (no extra field), no "canary" string anywhere in the body, CORS access-control-allow-origin https://dankezo.github.io, cache-control private, no-store, set-cookie hanoi_cid= on first response.
- (b) GET /api/landmarks: 200, 10 entries, each entry exactly the 8 declared fields (funEN,funVI,histEN,histVI,id,nameEN,nameVI,source), ids in checklist order, history text matches the bundled LANDMARK_INFO (hoankiem funEN). GET /api/landmarks/opera: 200, same 8 fields. Unknown id: 404 {"error":"not_found"}.
- (c) Over-budget (test-only budget 2): first two distinct records serve 200; re-reading the map serves 200; re-reading hoankiem serves 200; a NEW record then returns 402, not 403/429, with x-hanoi-step-up: record_budget. The 402 body is {"error":"payment_required","price_usd":0.001,"manifest":...,"facilitator":"hanoi-3d-edge (label only, never contacted)","session":"...","pay_token_hint":"...","next_steps":{"continue_free":...,"pay":...}} and carries NO settlement field (confirmed: keys are error,price_usd,manifest,facilitator,session,pay_token_hint,next_steps). GET /api/step-up/manifest: 200, settlement "none", error payment_required.
- (g) Grace: completing the step-up with the session + pay_token_hint from the 402 body returns 200 with the one-line VI text "Cam on ban. Ban co the tiep tuc choi." and EN "Thank you. You can keep playing."; the same identity then reads the new record with 200, not 402. A bad session/token returns 400.
- Quota trip (test-only quota 2): third request returns 402, not 429, reason header quota.
- (d) Canary trap: GET /api/landmarks/canary-ho-guom-bac returns 404 {"error":"not_found"}; canary-thap-dong also 404; the onTrapAlert callback fired twice, with the canary path in the alert payload. The trap does not poison the identity: the same IP then gets /api/map 200.
- (f) Herd: a different partition than the fixer's (X: cathedral, opera, longbien, map; Y: mausoleum, vanmieu, onepillar, oldquarter; Z: hoankiem, ngocson, westlake) flags exactly once, score 68.75 (fixer reported 68.3 on its partition; same magnitude), band budget_cut_supported, combinedCoverage 11, members [cid:Y, cid:X, cid:Z]. A laddered member requesting a NEW record gets 402 (step-up, never a block); re-reading its own record still serves 200.
- (h) GET /api/provenance: 200, owner/source/license/watermark match the declaration, entries length 2, verify {ok:true, checked:2, firstBadIndex:null}, status static-marker-only with watermarkTotals null when no secret; with env ANTIREA_WATERMARK_KEY set, status keyed with 11 watermark totals. Top-level fields are all in SURFACE_FIELDS.provenance.
- (i) Surface guard strip mode: a tampered map payload loses canary/seed/secret fields and keeps size 40; a tampered landmarks payload loses a nested canary field on the entry. GET /_canary/abc serves a 200 HTML page. GET / lists the routes with service hanoi-3d-edge. The default export app serves /api/map 200. RECORD_IDS is 11 (map:grid + 10).
- Note on the 402 continue flow: the token lives in the body field pay_token_hint, not in the continue_free URL (the URL carries only the session). My harness used session + pay_token_hint and the continue succeeded; the fixer's test did the same.

## 5. Client wiring - PASS (15/15 in /tmp/2d-verify/edge.mjs)

- Read src/core/config/edge.js, src/main.js (boot), src/world/hanoi.js, src/game/landmarks.js in full.
- EDGE_API_URL is '' by default; edgeEnabled() false; resolveEdgeUrl accepts only https ?edge params and rejects http.
- Flag off: loadHanoiData with a throwing fetch returns {source:'bundled'} with 0 fetch calls; map rows are the bundled rows by reference; historyInfo is the bundled lookup and returns null for a canary id.
- Flag on, good edge: source 'edge', edge historyInfo reads the edge name.
- Flag on, failing edge / bad-shape edge / never-resolving edge (25 ms test timeout): all fall back to {source:'bundled'}. A canary-tainted edge payload (one entry replaced by a canary id, still 10 entries) is rejected to bundled; validLandmarksData rejects a canary id directly.
- createHanoi override: bundled vs JSON-copy data produce identical cells on all 1600 (tileId, landmarkId, rot diff 0).
- Boot path: grep for fetch( in src/main.js, src/world/hanoi.js, src/game/landmarks.js returns 0 hits; the only fetch lives in edge.js fetchEdgeJson, reached only when edgeEnabled(url) is true. main.js boot awaits loadHanoiData only in Hanoi mode (hanoiData null otherwise) and passes hanoiData.map to createHanoi and historyInfo to createGame. landmarks.js wiring is exactly the two claimed lines: `const infoFor = ctx.historyInfo || landmarkInfo` (line 196) and showInfo uses infoFor(id) (line 207).
- Bundle evidence: dist/assets/index-B6xJfj-9.js contains exactly one "canary-" string, and it is the startsWith('canary-') guard in edge.js (verified by context grep). edge.js is imported only by main.js.
- Nit, not a fail: the two edge fetches run sequentially in loadHanoiData, each with its own 3000 ms timeout, so a dead edge with the flag on delays boot by up to ~6 s before the bundled fallback loads (assets load after). With the flag off (the default) there is no delay at all. Parallelising the two fetches would halve the worst case; not required for this phase.

## 6. Build + regressions - PASS

Ran myself, Node v24.22.1 (same major as the fixer):

- node --check: 9/9 OK (canary.js, edge.js, landmark-history.js, hanoi-map.js, hanoi.js, landmarks.js, main.js, workers/hanoi-edge/src/index.js, tools/check-2d.mjs).
- npm run build: PASS. Bundle dist/assets/index-B6xJfj-9.js, 1,103.50 kB, gzip 333.78 kB, 64 modules, built in 769 ms. Hash and size match the fixer claim exactly. Size delta vs the 2C bundle (1,100.85 kB) is +2.65 kB, consistent with the new edge.js module plus the wiring edits.
- npm run check:hanoi: ALL CHECKS PASSED, 161 PASS lines counted.
- node tools/check-2b.mjs: ALL 2B CHECKS PASSED, 334 PASS lines counted.
- node tools/check-2c.mjs: 89 PASS, 0 FAIL, ALL 2C CHECKS PASSED.
- node tools/check-basic.mjs: ALL BASIC CHECKS PASSED, 64 PASS lines counted.
- Cross-check only: node tools/check-2d.mjs: 139 PASS, 0 FAIL, ALL 2D CHECKS PASSED (matches the claim; no verdict rests on it).
- wrangler: `npx wrangler deploy --dry-run` in workers/hanoi-edge (wrangler 4.166.0): Total Upload 1289.04 KiB / gzip 268.63 KiB, No bindings found, exit 0. Matches the claim exactly. No login was needed and none was used.

## 7. The two bugs the fixer says it caught - PASS (both re-proven)

- (a) Re-reads tripping the budget gate: re-proven in my own harness (section 4c) with a test-only budget of 2: after serving map + hoankiem, re-reading both serves 200, and only a NEW record 402s. The Worker's seenByIdentity tracking is the fix, and it behaves as claimed. I also traced the code: gate() filters recordIds to never-served ids before budget.check(), and serve() records them.
- (b) The 402 respond() body carries no settlement field: re-proven (section 4c) - the 402 body keys are error,price_usd,manifest,facilitator,session,pay_token_hint,next_steps, with no settlement; settlement "none" lives in the manifest document only.
- (3) createCanaryTrapRequest does not exist: re-proven in section 1 (undefined in the installed 3.3.1); the Worker uses handleCanaryTrapRequest.

## 8. Secrets + long dashes - PASS

- Grep over all new/changed 2D files (canary.js, edge.js, provenance.json, antirea-declaration.md, Worker index.js, wrangler.toml, package.json, Worker README) for api key / secret / password / bearer / credential / private key: the only hit is the Worker README line "Paste the secret when asked" (step 3, an instruction to set ANTIREA_WATERMARK_KEY via `wrangler secret put`). No secret value exists anywhere in the repo; ANTIREA_WATERMARK_KEY appears only as an env name. The .gitignore covers .wrangler/ and .dev.vars.
- Long dashes (U+2013/U+2014): 0 in all 16 checked 2D files (canary.js, edge.js, landmark-history.js, hanoi-map.js, hanoi.js, landmarks.js, main.js, provenance.json, antirea-declaration.md, phase-2d-manifest.md, Worker index.js, wrangler.toml, package.json, README.md, .gitignore, check-2d.mjs).

## 9. 2A/2B/2C regression scope + GLB sizes - PASS (with one scope caveat)

- The 2D files are exactly the manifest's list: new canary.js, edge.js, provenance.json, antirea-declaration.md, workers/hanoi-edge/ (index.js, wrangler.toml, package.json, package-lock.json, README.md, .gitignore), tools/check-2d.mjs, docs/phase-2d-manifest.md; changed landmark-history.js (DATASET_PROVENANCE only), hanoi-map.js (HANOI_DATASET_MARKER only, as the 2D addition), hanoi.js (optional data override), landmarks.js (2-line infoFor wiring), main.js (edge boot wiring). A grep for 2D markers (edge.js, loadHanoiData, DATASET_PROVENANCE, HANOI_DATASET_MARKER, anti-rea/antirea) across src/ + index.html + the 2A/2B/2C check tools hits only those files.
- GLB byte sizes unchanged vs the 2C record: basic-grand.glb 704,872 bytes, hanoi-tiles.glb 2,496,552 bytes. Atlas still 200 sprites (check-basic).
- Caveat (honest limit): the whole working tree (steps 5-7 + 2A + 2B + 2C + 2D) is uncommitted on top of HEAD 4ec66a3, so git diff cannot isolate 2D's edits to tracked files from earlier phases' edits in the same files (e.g. hanoi-map.js also carries the 2B street elements, hanoi.js also carries the step-6 biome change, main.js also carries earlier hanoi params). Scope was therefore verified by content grep + reading the 2D hunks, not by a clean per-phase diff. Nothing outside the manifest's list carries 2D content.
- The Worker README has exactly 8 numbered deploy steps, matching the manifest's section 5.

## 10. Quota identity wording - FAIL (doc/behavior mismatch)

- Location: docs/phase-2d-manifest.md section 3 ("Request quota: 120 requests / hour per identity") and workers/hanoi-edge/README.md ("Request quota | 120 requests / hour per identity"), plus the manifest's identity section ("hanoi_cid cookie wins").
- What is wrong: the quota guard is NOT keyed by the cookie identity. In workers/hanoi-edge/src/index.js the quota guard is built with resolveIdentity returning only the IP ({ ip: req.headers.get('cf-connecting-ip') }), while the record budget uses the cookie-first identityOf(). My targeted probe (/tmp/2d-verify/quota-id.mjs, quotaMaxRequests 2, one IP, two different hanoi_cid cookies) proves it: cid A request 1 = 200, cid B request 1 = 200, cid B request 2 = 402. Two different cookie identities sharing one IP share one 120/hour bucket.
- Impact: modest. The quota value itself is sane and IP-based quotas are standard; the failure is that the docs promise per-identity metering the code does not deliver for quota. A shared IP (school, office, CGNAT exit) burns one bucket for all its cookie identities (60 page loads/hour at 2 requests per load). The record budget, herd detection, and step-up/grace ARE cookie-identity based, so the core metering story holds.
- Related, smaller: grace is consulted only on the record-budget path (gate() checks grace.guardStepUp only when the budget trips). A quota trip after a completed step-up still returns 402; grace does not suppress it. That may be intended (rate limiting vs budget), but the manifest's "a verified identity is served, not stepped up again, until grace ends" reads as if it covers both paths. Worth one clarifying line in the docs.
- Fix required (docs only, no behavior change needed unless the parent wants the quota keyed by cookie): change the quota lines in the manifest and the Worker README to "120 requests / hour per IP" and note that grace suppresses budget step-ups only. If the parent prefers the code to match the docs instead, the fix is to make the quota guard resolve the same cookie-first identity as the budget - one small change in the Worker, plus a re-run of the quota tests.

## 11. Impeccable detect - UNVERIFIED (tool failure, not a code verdict)

- My run: `timeout 180 npx impeccable detect` in ~/workspace/hanoi-3d. Result: killed by timeout at 180 s, exit 124, zero stdout/stderr (/tmp/2d-verify/impeccable.log is 0 bytes). Same outcome as the fixer and the 2A/2B/2C runs: 5th consecutive hang. No findings were produced by any run, so there is nothing to pass or fail here. Whether the new edge.js / canary.js / Worker files introduce a finding cannot be known until Impeccable produces output somewhere.
- Hallmark sloplint: not runnable (no such package on npm, 404) - known, per WORKFLOW doc, not re-attempted.

## 12. Live deploy + live browser - UNVERIFIED

- No Cloudflare account, no deploy, no live edge call (by task rule). The Worker was verified only by wrangler --dry-run (bundles) and the mocked harness. The parent/user must deploy + test live per the README's 8 steps: real curl to /api/map, /api/provenance, the canary trap, and a live game load with ?edge=<host>.
- No live browser check. The game with the flag off is code-identical in behavior to before (verified: bundled rows by reference, zero fetch calls, override identical on 1600 cells), but the parent's fresh-browser check and the user device check remain the decider, as with every phase.

## Top 3 risks

1. Never seen live (check 12). Everything structural recomputes clean, but no real deploy, no real edge call, and no browser load with the flag on or off has happened yet. The in-memory Worker state (budgets, quotas, herd, grace, step-up tokens, declaration log) does not survive an isolate recycle and is not shared across isolates - the manifest states this, but it means the first real traffic is also the first test of whether the metering holds across isolates.
2. The quota wording gap (check 10) will mislead tuning. Anyone re-tuning limits from the docs will think the 120/hour quota is per cookie identity; it is per IP, so a shared-IP site will trip sooner than the docs imply, and a harvester rotating IPs evades the quota while the cookie budget is the only per-identity control. The docs must be corrected before the user deploys and tunes from them.
3. Impeccable has now hung five times with zero output (check 11). The quality gate has a known hole no fixer round can close from here; the new Worker + edge.js + canary.js surface is entirely unexamined by it.

## Recommendation

Proceed to the parent for push - no fixer round first. Every claim I could check without a deploy or a browser recomputes clean with fresh scripts: canary 29/29, edge 15/15, Worker 45/45, antiRea names all verified against installed 3.3.1 (createCanaryTrapRequest absent, handleCanaryTrapRequest present), build bundle hash identical to the claim, check:hanoi 161, check-2b 334, check-2c 89, check-basic 64, check-2d 139 as cross-check, node --check 9/9, wrangler dry-run 1289.04 KiB, 0 secrets, 0 long dashes, GLB sizes unchanged. The one FAIL (check 10, quota wording) is documentation-only and needs a one-line correction in the manifest + Worker README before the user deploys and tunes limits from them; it does not change game behavior and does not block the push. Optional follow-ups after push: parallelise the two edge fetches (worst-case boot delay 6 s to 3 s when the edge is down), and note in the docs that the six unused antiRea names (createExportGuard, createOwnershipProbe, createDecoyMirage, createShrinkSlopeSignal, createCusumTripwire, createEvalueTripwire) are verified present but not wired in - per-identity slow-harvest tripwires are not yet built.
