# Hanoi 3D - Phase 2D manifest (antiRea: anti-cloning, static part + edge scaffold)

Date: 2026-11-21. Fixer: 2D agent. Status: DONE locally, NOT pushed, NOT
deployed. Phases 2A + 2B + 2C are untouched except two additive 2D wiring
lines (see "Files changed"). No commit, no push, no deploy, no secret anywhere.

## 0. Correction that drives this whole phase

antiRea is NOT a design check. It is a SERVER-SIDE TypeScript library (Node
>= 20, zero runtime deps, npm @dannyphan190/anti-rea) that meters DATASET
access per identity and flags coordinated bot abuse. README thesis: "You
cannot hide code a browser has already received - so antiRea defends the
other side: the data itself." EVERY signal is advisory (enforcement: "none")
- NEVER hard-block; the strongest legitimate reaction is a step-up (extra
verification) for NEW actions only, never consequences for people already
inside. Defaults are lab-frozen; lab numbers are simulation numbers.

Verified against the PUBLISHED package (installed 3.3.1, latest on npm;
the plan cited 3.3.0): every antiRea name used in the Worker was checked
against the installed module. One plan name is WRONG: `createCanaryTrapRequest`
does NOT exist in 3.3.1 (no export, no README mention). The real trap helper
is `handleCanaryTrapRequest` (plus `createCanaryRoute` / `createCanaryMaze`),
and that is what the Worker uses. All other plan names verified present:
createRecordBudget, createQuotaGuard, createExportGuard, createSurfaceGuard,
createOwnershipProbe, createHerdDetector, applyHerdLadder,
createCanaryMaze, createDecoyMirage, createDeclarationLog,
createValueWatermark, createVerificationGrace, createStepUp402Responder,
createShrinkSlopeSignal, createCusumTripwire, createEvalueTripwire.

## 1. Canary design (what, where, marker strings, why invisible)

File: `src/game/canary.js` (new, 5 KB). It is imported by NOTHING under
`src/` - the game never imports it, so no game code path can surface it.
The edge Worker imports it only to know which ids are traps.

Two fake landmarks, same shape as the real records:

- `canary-ho-guom-bac` - "North Ho Guom Pavilion" / "Dinh Bac Ho Guom",
  anchor [99, 99] (outside the 40x40 grid, coords -20..19)
- `canary-thap-dong` - "Bronze Drum Tower" / "Thap Trong Dong",
  anchor [-99, -99]

Each carries `canary: true` plus markers:

- Map marker: `HANOI3D-CANARY-MAP-7F3A9D` (on the landmark record)
- History marker: `HANOI3D-CANARY-HIST-2B8E41` (inside the fun fact text,
  so it survives a copy of the text itself)

Why invisible, by construction (all asserted in tools/check-2d.mjs):

- The ids start with `canary-` and appear NOWHERE in HANOI_LANDMARKS,
  LANDMARKS, LANDMARK_INFO, or any map cell (0 of 1600 cells carries a
  canary landmarkId). Discovery, checklist, toast, minimap, and info card
  all read the real datasets only.
- The anchors sit outside the grid, so even a grid scan can never stand
  on one.
- `landmarkInfo('canary-...')` returns null for both ids.
- No file under src/ imports canary.js; the five display/map/boot files
  (landmarks.js, landmark-history.js, hanoi.js, hanoi-map.js, main.js)
  never even mention the word "canary".
- The edge client rejects canary ids as data (validLandmarksData returns
  false for any id starting with `canary-`).

How to check a suspected copy: search it for `HANOI3D-CANARY-MAP-7F3A9D`
or `HANOI3D-CANARY-HIST-2B8E41`. Either string in a copy proves the copy
came from this repo. The facts themselves are invented (no such pavilion
or tower exists). Do NOT add a canary id to the visible checklist, map,
or discovery - that would turn a trap into a real landmark.

## 2. Declaration + watermark (exact marker + how to check)

Declaration files:

- Human: `docs/antirea-declaration.md` (owner, source, license, canary
  scheme, watermark, metering, what stays copyable)
- Machine: `data/provenance.json` (same facts as JSON; the Worker serves
  the same text at GET /api/provenance)

Value watermark - static marker embedded in the dataset itself:

- Marker string: `HANOI3D-DANKEZO-WM-9Q7K2M`
- Where it lives:
  - `src/game/landmark-history.js` as `DATASET_PROVENANCE.watermark`
    (new frozen export; LANDMARK_INFO text untouched)
  - `src/world/hanoi-map.js` as `HANOI_DATASET_MARKER` (new export)
  - `data/provenance.json` as `watermark`
  - `docs/antirea-declaration.md`
- Distinctive ordering (part of the watermark): the 10 landmarks always
  appear in checklist order - hoankiem, ngocson, westlake, oldquarter,
  mausoleum, vanmieu, onepillar, cathedral, opera, longbien.
  (`DATASET_PROVENANCE.order`.)
- How to check a suspected copy: search it for `HANOI3D-DANKEZO-WM-9Q7K2M`.
  A copy that kept the history text or the map file keeps the marker.

Keyed watermark (edge only): the Worker marks the numeric edition records
(10 landmark anchors + the 1600 cell count) with antiRea
`createValueWatermark` when the `ANTIREA_WATERMARK_KEY` secret is set via
`wrangler secret put` (never in the repo). Marked totals are served at
GET /api/provenance. Plain statement: with an 11-record edition the
library's statistical confirmation threshold is NOT reached, so the keyed
watermark is provenance evidence, not a statistical proof. The canary
markers + declaration log are the primary copy-proof.

Declaration log: the Worker appends the declaration text to a hash-chained
log (antiRea `createDeclarationLog`, 2 entries) at startup and serves it
with its chain verification at GET /api/provenance. The log predates any
copy made after this declaration was published.

## 3. Worker design (routes, identity, budgets, herd ladder, step-up, surface guard)

Project: `workers/hanoi-edge/` (src/index.js, wrangler.toml, package.json,
README.md, .gitignore). NOT deployed. Library @dannyphan190/anti-rea
^3.3.1, wrangler ^4 (installed 4.166.0). The game datasets are imported
from `../../src/world/hanoi-map.js`, `../../src/game/landmark-history.js`,
and `../../src/game/canary.js` (canary ids only, to know the trap paths -
canary records are NEVER served).

Routes (all GET unless noted):

- `/` - service info + route list.
- `/api/map` - {size: 40, rows: [40 strings], legend, landmarks: {10 ids}}.
- `/api/landmarks` - {landmarks: [10 entries with id, nameEN/VI, histEN/VI,
  funEN/VI, source]}.
- `/api/landmarks/:id` - one entry; a canary id returns the trap response
  (404 `{"error":"not_found"}` via handleCanaryTrapRequest + trap alert);
  an unknown id returns a plain 404.
- `/api/provenance` - owner/source/license, watermark, canary list,
  declaration text, declaration-log entries + chain verification, keyed
  watermark totals (or `status: static-marker-only` without the secret).
- `/api/step-up/manifest` - the x402 manifest document.
- `/api/step-up/continue?session=...&token=...` - completes a step-up
  (continue-free), records 24h grace, returns a small HTML page with one
  short line per language (VI diacritic-free: "Cam on ban. Ban co the tiep
  tuc choi." / EN: "Thank you. You can keep playing.").
- `/_canary/*` - the antiRea canary maze (decoy pages for crawlers).

Identity: `hanoi_cid` cookie (random, HttpOnly, SameSite=Lax, 1 year, set
on first response) wins when present; else the `cf-connecting-ip` header.
Key: `cid:<value>` or `ip:<address>`. Alternative (not used): IP-only.
Simpler, but shared IPs collide and a harvester can rotate IPs; the cookie
survives IP rotation and splits shared IPs, but a determined cloner can
clear cookies, so it is a speed bump, not a wall.

Budgets (LAB defaults, not measured traffic - re-tune from real traffic):

- Record budget: 11 distinct records / 24h per identity (the whole dataset
  is 11 records: 1 map + 10 histories). A real player reads it once per
  session; re-reads cost 0 (already-seen records are not double-counted),
  so a real player never trips on this. The Worker tracks served ids per
  identity so the gate itself charges 0 for re-reads (a real bug found by
  the test: the library's check() counts the requested number, not
  already-seen ids - fixed in the Worker, see section 6).
- Request quota: 120 requests / hour per IP (the quota guard resolves identity by
  IP only - cf-connecting-ip - so two browsers behind one IP share the bucket).
  Tier `anonymous`, maxPageSize 50, maxPage 1.
- Herd detection: library defaults assume a 10,000-record dataset and
  could never flag here, so they are rescaled to 11 records
  (combinedCoverageFloor 11, coverageRampDenominator 11, flagThreshold 60,
  flagMinMembers 3, minOwnRecords 2, unionFloor 6, recheckGrowth 1).
  A partitioned herd (3 identities tiling the 11 records between them)
  flags at score 68.3 in the local test.
- Herd ladder: flagged members are cut to 2 distinct records
  (applyHerdLadder). That tightens the budget only; over-budget members
  get a 402 step-up on their NEXT data request, never a block.

Step-up semantics: when a budget or quota trips, the answer is 402 + an
x402 manifest (price 0.001 USD as a signal, settlement "none"). The quota
guard's own 429 is intentionally NEVER surfaced: a quota trip is translated
into the same 402 step-up. No payment is processed, no facilitator is
contacted (pay URL is the game itself, appeal URL is the repo issues page).
The only real action is continue-free. A completed step-up records
verification grace (createVerificationGrace, 24h default): a verified
identity is served, not stepped up again, until grace ends. Grace covers
record-budget step-ups only: the per-IP quota is checked first in gate()
and always steps up when tripped, grace or not. Players
already inside are never kicked, muted, or throttled.

Surface guard: strip mode, per-route field lists in `SURFACE_FIELDS`.
The guard checks EVERY field name at EVERY depth, so the lists name nested
fields too (legend chars, landmark ids, anchor/rects/cells, tileId/rot,
history fields, declaration-log fields). Anything unlisted (a canary flag,
an internal id, build metadata) is stripped from the payload. The payloads
are also built by picking declared fields in code, so the guard is a
second layer, not the only one.

CORS: only `https://dankezo.github.io` (plus `http://localhost:*` for
local dev). Metered responses carry `Cache-Control: private, no-store`.

State limits (read before deploying): all meter state (budgets, quotas,
herd detector, grace, step-up tokens, declaration log) is in-memory per
Worker isolate - the library's default store. It does not survive an
isolate recycle and is not shared across isolates. A busy site needs a
shared store (Durable Objects / KV) wired into the guards; that is a
follow-up, not part of this scaffold.

## 4. Client flag design (default off, fallback)

File: `src/core/config/edge.js` (new). `EDGE_API_URL = ''` by default =
disabled. `resolveEdgeUrl(params)` lets `?edge=https://<host>` override
the constant for one load (https only). `loadHanoiData()` returns
`{source: 'edge' | 'bundled', map, historyInfo}`:

- Flag off: returns the bundled dataset immediately, zero network calls
  (fetch is never touched - asserted with a throwing fetch in the test).
- Flag on: fetches `/api/map` + `/api/landmarks` with a 3000 ms timeout,
  validates the shape (40x40 grid, 10 real landmark ids, non-empty history
  strings, canary ids rejected), and uses the edge data only when both
  responses validate. Absent / failing / timed-out / bad-shape edge =
  bundled fallback. The game never breaks because the edge is down.

Wiring (additive only, behavior identical when the flag is off):

- `src/main.js`: boot awaits `loadHanoiData({edgeUrl: resolveEdgeUrl(params)})`
  in Hanoi mode, passes `data` to `createHanoi` and `historyInfo` to
  `createGame` (which flows into `createLandmarks` via ctx).
- `src/world/hanoi.js`: `createHanoi({seed, data = null})` - null means the
  bundled modules, the exact path as before. Anchors, ids, discovery
  radius, storage key, solver logic untouched.
- `src/game/landmarks.js`: `const infoFor = ctx.historyInfo || landmarkInfo`
  and `showInfo` uses `infoFor(id)`. Two lines. Default path unchanged.

No new user-facing UI strings except the step-up continue page (one short
line per language, diacritic-free VI, served by the Worker, not the game).

## 5. Exact deploy steps for the user (copy from workers/hanoi-edge/README.md)

Muse cannot deploy this: it needs your Cloudflare login.

1. `cd workers/hanoi-edge && npm install`
2. `npx wrangler login` (opens a browser page on your Cloudflare account)
3. Optional: `npx wrangler secret put ANTIREA_WATERMARK_KEY` (paste a long
   random string; never commit it, never paste it in chat). Skip to run
   with the static marker only.
4. `npx wrangler deploy` - note the URL, e.g.
   `https://hanoi-edge.<your-subdomain>.workers.dev`
5. Custom domain (recommended): Cloudflare dashboard, Workers & Pages >
   hanoi-edge > Settings > Domains > Add a custom domain, e.g.
   `hanoi-api.dannyphan.me`. Or use the workers.dev URL from step 4.
6. Flip the client flag: in `src/core/config/edge.js` set
   `EDGE_API_URL = 'https://<your-worker-host>'` (no trailing slash).
   Or test one load first with `?edge=https://<your-worker-host>`.
7. Push the game change and check live: `curl <host>/api/map` returns 200
   with `size: 40`; `curl <host>/api/provenance` returns the declaration;
   load `?map=hanoi` and confirm the checklist still shows 10 landmarks;
   `curl <host>/api/landmarks/canary-ho-guom-bac` returns 404
   `{"error":"not_found"}` (the trap response).
8. Local test before deploying (no login needed): `npx wrangler dev`,
   then `curl http://localhost:8787/api/map`.

## 6. Files changed / added (one-line why each)

New:

- `src/game/canary.js` - canary/decoy records + markers, never imported
  by the game.
- `src/core/config/edge.js` - edge flag (default off), fetch-with-fallback,
  edge payload validation.
- `data/provenance.json` - machine-readable declaration (owner, source,
  license, canary, watermark, metering).
- `docs/antirea-declaration.md` - human-readable declaration log.
- `workers/hanoi-edge/src/index.js` - the Worker (factory
  `createHanoiEdgeApp` + default export).
- `workers/hanoi-edge/wrangler.toml` - Worker name `hanoi-edge`, no bindings.
- `workers/hanoi-edge/package.json` - anti-rea ^3.3.1, wrangler ^4 dev.
- `workers/hanoi-edge/package-lock.json` - reproducible install (generated).
- `workers/hanoi-edge/README.md` - design + exact deploy steps.
- `workers/hanoi-edge/.gitignore` - ignores `.wrangler/` + `.dev.vars`.
- `tools/check-2d.mjs` - 139-check verification suite (see section 7).
- `docs/phase-2d-manifest.md` - this file.

Changed (additive only):

- `src/game/landmark-history.js` - added `DATASET_PROVENANCE` export
  (owner, watermark, checklist order). LANDMARK_INFO text untouched.
- `src/world/hanoi-map.js` - added `HANOI_DATASET_MARKER` export.
  Grid, legend, landmark areas untouched.
- `src/world/hanoi.js` - `createHanoi` accepts an optional `data`
  override (default null = bundled). No other change.
- `src/game/landmarks.js` - `showInfo` uses `ctx.historyInfo` when
  provided, else `landmarkInfo`. Two lines.
- `src/main.js` - boot loads edge data (flag off = bundled, zero fetch)
  and passes the overrides. No other change.

Not changed: 2A/2B/2C files (except the two additive lines in
landmarks.js, which 2B/2C own, listed above), wfc.js, tiles.js, world.js,
post.js, landmark anchors, ids, discovery radius, storage key `hanoi:v1:`,
game package.json (no new dependency - anti-rea lives only in the
Worker's package.json). `workers/hanoi-edge/node_modules/` exists locally
from the install (81 packages, gitignored by the root `.gitignore`) and is
not part of the deliverable.

## 7. Verification evidence (exact counts / outputs)

Run 2026-11-21, Node v24.22.1, npm 10.9.4. All counts from the runs:

- `node --check` on all 9 changed/added game + worker .js files: 9/9 OK
  (canary.js, edge.js, landmark-history.js, hanoi-map.js, hanoi.js,
  landmarks.js, main.js, workers/hanoi-edge/src/index.js, check-2d.mjs).
- `node tools/check-2d.mjs`: **139 PASS, 0 FAIL** - ALL 2D CHECKS PASSED.
  Sections: (a) canary exists with markers; (b) no game accessor surfaces
  a canary (0/1600 cells, landmarkInfo null, no src import, display files
  canary-free); (c) declaration + provenance.json; (d) watermark marker in
  4 files; (e) Worker routes with mocked Request/Response (normal 200 with
  declared fields only + CORS + no-store + hanoi_cid cookie; over-budget
  402 with payment_required / settlement none / continue-free URL, then
  grace serves 200; quota trip 402 not 429; canary request trap 404 +
  alert fired + handleCanaryTrapRequest isTrapped true for canary paths,
  false for real paths; surface guard strips tampered fields; maze serves
  a page; partitioned herd flags once, band budget_cut_supported,
  combinedCoverage 11, then the laddered member gets 402 on a new record;
  provenance verifies the hash chain, static-marker-only without a secret,
  keyed + 11 totals with a secret; applyHerdLadder applies to a synthetic
  snapshot); (f) flag OFF = bundled + 0 network calls, flag ON + good edge
  = edge source, flag ON + failing/timeout/bad-shape edge = bundled
  fallback, createHanoi override identical on all 1600 cells (bundled and
  JSON copy), historyInfo override shows the EDGE name in the info card
  while the default path shows the bundled name; (g) zero secrets
  (hard-secret grep + secret-word grep with allowlist) and zero long dashes.
- `npm run build`: PASS. Bundle `dist/assets/index-B6xJfj-9.js`
  (1,103.50 kB, gzip 333.78 kB, 64 modules). Previous bundle was
  `index-BvZXRkQn.js`: the hash changed ONLY because the new edge.js
  module is now imported by main.js plus the three tiny wiring edits.
  No behavior change when the flag is off.
- `npm run check:hanoi`: ALL CHECKS PASSED (solver 95 <= 96, MODELS 48,
  1600 cells resolve, 0 unresolved, all 10 landmarks discoverable).
- Regression suites (unchanged code still passes): check-2b ALL PASSED,
  check-2c 89 PASS 0 FAIL, check-basic ALL PASSED.
- Long dashes: 0 in all 14 changed/added files + this manifest
  (python scan for U+2013/U+2014).
- `npx wrangler deploy --dry-run` (no login needed): bundles the Worker
  fine - Total Upload 1289.04 KiB / gzip 268.63 KiB, no bindings. This
  proves the CJS anti-rea dep and the relative imports from `../../src/`
  bundle correctly.
- `npx impeccable detect`: PENDING - see below (section 8).

Bugs found by the test and fixed in this phase (not papered over):

1. Re-reads tripped the budget gate: the library's `budget.check(id, n)`
   counts the requested number, not already-seen ids, so a player who had
   read the whole dataset (11/11) got a 402 on re-reading one record even
   though `consume` would have charged 0. Fixed in the Worker: it tracks
   served ids per identity and the gate only counts never-served ids.
2. The 402 `respond()` body carries NO `settlement` field (settlement
   "none" lives in the manifest document only). The test first asserted it
   on the 402 body and failed; corrected to assert it on the manifest.
3. `createCanaryTrapRequest` (named in the plan) does not exist in
   anti-rea 3.3.1. The Worker uses `handleCanaryTrapRequest`.

## 8. What you could NOT verify live

- No Cloudflare account, no deploy, no live edge call. The Worker was
  verified only by `wrangler deploy --dry-run` (bundles) and by the mocked
  Request/Response harness in check-2d.mjs. Parent/user must deploy +
  test live (steps in section 5): real `curl` to /api/map, /api/provenance,
  the canary trap, and a live game load with `?edge=<host>`.
- No live browser check. The game with the flag OFF needs the parent's
  fresh-browser check (checklist 10/10, discovery, toast, minimap,
  persistence, plain URL clean) - the flag-off path is code-identical to
  before, but his device is still the decider per the quality gate.
- Impeccable detect: HUNG - `timeout 180 npx impeccable detect` produced
  zero output in 180 s and was killed by timeout (exit 0 is the timeout
  wrapper's, not a verdict). 5th consecutive hang (2A, 2B, 2C, and now 2D).
  That is a tool failure, not a pass and not a verdict on the code.
  Recorded plainly here.
- Hallmark sloplint: not runnable (no such package on npm, 404) - same as
  every previous phase, recorded, not re-attempted.
- The keyed value watermark's statistical confirmation: with an 11-record
  edition the library's confirmation threshold is not reached (verified
  in the probe: verifyEdition returns confirmed false at unit/tens scales
  with 2 records). Stated plainly in the declaration + README: it is
  provenance evidence, not a statistical proof.
- Real traffic tuning: every limit is a lab default. The record budget
  (11/24h) can never trip a normal player by construction; the live
  tripwires are the quota (120/hour) and herd detection. Re-tune from
  real traffic after deployment.

## 9. Remaining risks

- In-memory Worker state does not survive isolate recycle and is not
  shared across isolates. Under real load, budgets/quotas/herd state can
  reset or split. Needs a shared store (Durable Objects / KV) as a
  follow-up if traffic grows.
- Identity is cookie + IP. A determined cloner clears cookies and rotates
  IPs; the budget then dilutes to a per-identity speed bump. Herd
  detection is the backstop for coordinated copying, and canaries +
  declaration are the proof after the fact. Nothing here stops a
  determined single copier - that is the library's own stated limit.
- The `?edge=` URL param lets anyone point a load at any https Worker.
  That only changes where one load reads public data from; it cannot leak
  anything (the API serves the same public dataset). Not a secret, but
  worth knowing.
- Step-up tokens live in an in-memory map per isolate (10 min expiry,
  capped at 1000 entries with lazy pruning). An isolate recycle loses
  issued tokens; the client just gets a fresh 402, never a block.
- Static art stays copyable (atlas.webp, hanoi-tiles.glb,
  basic-grand.glb). Protecting the art needs watermarking, not antiRea.
  The dataset files on static Pages also stay copyable as files; only the
  API-served copies are metered. The edge flag is OFF by default, so until
  the user flips it, nothing is metered at all.

## 10. Plain statements (for the user)

- Static art stays copyable. antiRea protects the live DATA (map +
  history) behind the edge API, not the pixels.
- Nothing is deployed. The Worker scaffold is ready in
  `workers/hanoi-edge/` with exact deploy steps in its README; deploying
  needs your own Cloudflare login.
- Nothing is enabled. The game behaves exactly as before until
  `EDGE_API_URL` is set in `src/core/config/edge.js` (or `?edge=` is used
  for one load). The bundled dataset is the fallback whenever the edge is
  absent, slow, or wrong.
- Nothing is blocked. The strongest reaction anywhere in this design is a
  402 step-up with a free continue; real players are never kicked, muted,
  or throttled.

## Coordinator follow-up (verifier FAIL + follow-ups, fixed before push)

- Quota wording FAIL (verifier check 10): the manifest + Worker README said the
  request quota was "120/hour per identity", but the quota guard resolves identity
  by IP only (cf-connecting-ip; probe: quota 2, one IP, two hanoi_cid cookies ->
  200, 200, then 402). Fixed to "120 requests / hour per IP" in this manifest and
  in workers/hanoi-edge/README.md, with the shared-bucket note in both places.
  The record budget stays per identity (cookie-first identityOf) - that wording
  was correct and is unchanged.
- Grace scope (verifier note): grace covers record-budget step-ups only. The gate
  checks the quota first and always steps up on a quota trip, grace or not
  (gate() in workers/hanoi-edge/src/index.js). Noted in this manifest and in the
  Worker README grace row.
- Dead-edge boot delay (verifier follow-up): loadHanoiData fetched /api/map and
  /api/landmarks sequentially (main.js awaits it in Hanoi mode), so a dead edge
  cost 3s + 3s = 6s before the bundled fallback. Fixed: both fetches now run in
  parallel via Promise.all (worst case one 3s timeout). fetchEdgeJson never throws,
  so Promise.all is safe. Re-verified: build + check:hanoi + check-2d + check-2c
  + check-2b + check-basic (counts in the coordinator's 2D report).
- Not wired (verifier note, left as follow-up): six verified antiRea names exist
  in the package but are not used by the Worker (createExportGuard,
  createOwnershipProbe, createDecoyMirage, createShrinkSlopeSignal,
  createCusumTripwire, createEvalueTripwire), so per-identity slow-harvest
  tripwires are not yet built.
