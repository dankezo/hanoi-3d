# Hanoi 3D edge API (Cloudflare Worker)

Metered API for the Hanoi dataset (40x40 map + 10 landmark histories) using
@dannyphan190/anti-rea v3.3.1. Static GitHub Pages cannot meter anything, so
this Worker is the layer that makes antiRea real. The game uses it ONLY when
the edge flag is set (see `src/core/config/edge.js`, default off).

## What it does, in one paragraph

- `GET /api/map` serves the 40x40 grid + landmark positions.
- `GET /api/landmarks` serves the 10 histories; `GET /api/landmarks/:id`
  serves one.
- Every identity gets a record budget (whole dataset = 11 records per 24h),
  a request quota (120/hour), herd detection across identities, and a surface
  guard that only lets declared fields leave the API.
- When a budget or quota trips, the answer is 402 + an x402 manifest (price
  0.001 USD as a signal, settlement none). The only real action is
  continue-free; nobody already playing is kicked, muted, or throttled.
  A completed step-up grants 24-hour grace.
- A request for a canary record (`/api/landmarks/canary-ho-guom-bac`,
  `/api/landmarks/canary-thap-dong`) returns the canary trap response
  (404 `not_found`) and fires a trap alert. Canary records are never data.
- `GET /api/provenance` serves the declaration, the hash-chained declaration
  log with its chain verification, and the watermark totals.
- `GET /api/step-up/manifest` serves the x402 manifest;
  `GET /api/step-up/continue?session=...&token=...` completes a step-up
  (one short line in VI + one in EN, diacritic-free VI) and records grace.
- `GET /_canary/*` serves the antiRea canary maze (decoy pages for crawlers).

## Identity

- `hanoi_cid` cookie (random, HttpOnly, SameSite=Lax, 1 year, set on first
  response) wins when present; else the `cf-connecting-ip` header.
- Identity key: `cid:<value>` or `ip:<address>`.
- Alternative (not used): IP-only. Simpler, but shared IPs collide (one
  school / office / CGNAT exit counts as one identity) and a harvester can
  rotate IPs. The cookie survives IP rotation and splits shared IPs, but a
  determined cloner can clear cookies, so it is a speed bump, not a wall.
  Say so plainly to anyone who asks.

## Limits (lab defaults, not measured traffic)

| Control | Value | Why |
|---|---|---|
| Record budget | 11 distinct records / 24h per identity | The whole dataset is 11 records (1 map + 10 histories). A real player reads it once per session; re-reads cost 0 (already-seen records are not double-counted), so a real player never trips on this. |
| Request quota | 120 requests / hour per IP | A real player loads map + histories once per session. 120/hour leaves room for reloads and still trips a hammering client. Two browsers behind one IP share the bucket (the quota guard resolves identity by IP only). |
| Herd detection | combined floor 11, threshold 60, min 3 members | Library defaults assume a 10,000-record dataset and could never flag here, so they are rescaled to 11 records. A partitioned herd (members tiling the dataset between them) flags at score 68.3 in the local test. |
| Herd ladder | flagged members cut to 2 distinct records | Tightens the budget only; over-budget members get a 402 step-up on their next data request, never a block. |
| Step-up | 402, price 0.001 USD signal, settlement none | The x402 manifest is a signal format. No payment is processed, no facilitator is contacted. |
| Grace after step-up | 24 hours | `createVerificationGrace` default. A verified identity is served, not stepped up again, until grace ends. Grace covers record-budget step-ups only: the per-IP quota is checked first and always steps up when tripped. |
| Surface guard | strip mode, declared fields only | Field lists are in `src/index.js` (`SURFACE_FIELDS`). The guard checks every field name at every depth, so nested names (legend chars, landmark ids, anchor/rects/cells, history fields) are all listed. Anything unlisted is stripped. |

## What stays copyable (plain statement)

Static art stays copyable: `public/textures/art/atlas.webp`,
`public/models/hanoi-tiles.glb`, `public/models/basic-grand.glb`. This Worker
protects the DATA (map + history), not the pixels. Protecting the art needs
watermarking, not antiRea. The dataset files on static Pages also stay
copyable as files; the Worker only meters the API-served copies.

## State and scaling limits (read before deploying)

- All meter state (budgets, quotas, herd detector, grace, step-up tokens,
  declaration log) is in-memory per Worker isolate. That is the library's
  default store and is fine for one small site, but state does not survive
  an isolate recycle and is not shared across isolates. A busy site needs a
  shared store (Durable Objects / KV) wired into the guards; that is a
  follow-up, not part of this scaffold.
- The keyed value watermark needs the `ANTIREA_WATERMARK_KEY` secret. Without
  it the Worker runs fine and reports `status: static-marker-only` at
  `/api/provenance`. With an 11-record edition the library's statistical
  confirmation threshold is not reached, so the keyed watermark is provenance
  evidence, not a statistical proof. The canary markers + declaration log
  are the primary copy-proof.
- `createCanaryTrapRequest` does NOT exist in anti-rea 3.3.1 (the plan named
  it; the installed package has no such export). The real helper is
  `handleCanaryTrapRequest`, which is what this Worker uses.

## Exact deploy steps (your own Cloudflare account)

Muse cannot deploy this for you: it needs your Cloudflare login. Do this:

1. Install the Worker dependencies (one time, in this folder):
   `cd workers/hanoi-edge && npm install`
2. Log in to Cloudflare in the terminal:
   `npx wrangler login`
   (opens a browser page on your Cloudflare account; approve it there)
3. Optional but recommended - set the watermark secret (any long random
   string; never commit it, never paste it in chat):
   `npx wrangler secret put ANTIREA_WATERMARK_KEY`
   Paste the secret when asked. Skip this step to run with the static
   marker only.
4. Deploy:
   `npx wrangler deploy`
   Note the URL it prints, e.g. `https://hanoi-edge.<your-subdomain>.workers.dev`.
5. Point the game at it. Two ways, pick one:
   - Custom domain (recommended): in the Cloudflare dashboard, Workers &
     Pages > hanoi-edge > Settings > Domains > Add a custom domain, e.g.
     `hanoi-api.dannyphan.me`. Then set the game flag to that origin.
   - Or use the `workers.dev` URL straight from step 4.
6. Flip the client flag: in `src/core/config/edge.js` set
   `EDGE_API_URL = 'https://<your-worker-host>'` (no trailing slash).
   Or test one load first with `?edge=https://<your-worker-host>` on the
   game URL. Default is `''` (disabled): the game keeps using the bundled
   dataset until you flip it.
7. Push the game change and check live:
   - `curl https://<your-worker-host>/api/map` returns 200 with `size: 40`.
   - `curl https://<your-worker-host>/api/provenance` returns the declaration.
   - Load `https://dankezo.github.io/hanoi-3d/?map=hanoi` and confirm the
     checklist still shows 10 landmarks and discovery still works.
   - `curl https://<your-worker-host>/api/landmarks/canary-ho-guom-bac`
     returns 404 `{"error":"not_found"}` (the trap response).
8. Local test before deploying (no login needed):
   `npx wrangler dev`
   then `curl http://localhost:8787/api/map`.

## Files

- `src/index.js` - the Worker (factory `createHanoiEdgeApp` + default export)
- `wrangler.toml` - Worker name `hanoi-edge`, no KV/D1/R2 bindings
- `package.json` - `@dannyphan190/anti-rea ^3.3.1`, `wrangler ^4` (dev)
- `README.md` - this file
- The game datasets are imported from `../../src/world/hanoi-map.js`,
  `../../src/game/landmark-history.js`, and `../../src/game/canary.js`
  (canary ids only, to know the trap paths - canary records are never served).
