# Hanoi 3D - dataset declaration (antiRea, Phase 2D)

Prepared 2026-11-21. This file is the human-readable declaration log for the
Hanoi dataset. The machine-readable twin is `data/provenance.json`. The edge
API serves the same text (plus a hash-chained log) at `GET /api/provenance`.

## Owner, source, license

- Owner: dankezo (GitHub @dankezo)
- Source repo: https://github.com/dankezo/hanoi-3d
- Live site: https://dankezo.github.io/hanoi-3d/
- License: MIT (repo license; the landmark history text is researched from
  Wikipedia and official Vietnamese tourism / heritage sources, see
  `docs/landmark-history.md` for the per-landmark source links)
- Dataset: the Hanoi map (40x40 grid + landmark positions,
  `src/world/hanoi-map.js`) and the 10 landmark histories
  (`src/game/landmark-history.js`)

## What is protected, and what is not

- Protected (metered when served via the edge API): the map data and the
  landmark history text. On static GitHub Pages the data is public files and
  stays copyable - that is the library's own stated limit, not a failure of
  this plan. The edge API (`workers/hanoi-edge/`) is what meters it.
- NOT protected by antiRea: the static art (`public/textures/art/atlas.webp`,
  `public/models/hanoi-tiles.glb`, `public/models/basic-grand.glb`). Anyone
  can copy those files. Protecting the art needs watermarking, not antiRea.

## Canary / decoy scheme

- Two fake landmark records live in `src/game/canary.js` (never imported by
  the game, never shown in any UI, never reachable by play):
  - `canary-ho-guom-bac` - "North Ho Guom Pavilion", marker
    `HANOI3D-CANARY-MAP-7F3A9D` (map record) and
    `HANOI3D-CANARY-HIST-2B8E41` (history record)
  - `canary-thap-dong` - "Bronze Drum Tower", same two markers
- Both anchors sit outside the 40x40 grid ([99, 99] and [-99, -99]).
- How to check a suspected copy: search it for `HANOI3D-CANARY-MAP-7F3A9D`
  or `HANOI3D-CANARY-HIST-2B8E41`. Either string in a copy proves the copy
  came from this repo, because no real Hanoi landmark carries them.
- On the edge API, asking for a canary record (`GET /api/landmarks/<canary
  id>`) returns the canary trap response (404 `not_found`, via the
  antiRea `handleCanaryTrapRequest` helper) and fires a trap alert. The
  canary records are never served as data.

## Value watermark

- Static marker (embedded in the dataset itself): `HANOI3D-DANKEZO-WM-9Q7K2M`
  - in `src/game/landmark-history.js` as `DATASET_PROVENANCE.watermark`
  - in `src/world/hanoi-map.js` as `HANOI_DATASET_MARKER`
  - in `data/provenance.json` as `watermark`
- Distinctive ordering (part of the watermark): the 10 landmarks always
  appear in this checklist order - hoankiem, ngocson, westlake, oldquarter,
  mausoleum, vanmieu, onepillar, cathedral, opera, longbien.
- How to check a suspected copy: search it for `HANOI3D-DANKEZO-WM-9Q7K2M`.
  A copy that kept the history text or the map file keeps the marker.
- Keyed watermark (edge only): the Worker marks the numeric edition records
  (10 landmark anchors + cell count) with antiRea `createValueWatermark`
  when the `ANTIREA_WATERMARK_KEY` secret is set (via `wrangler secret put`,
  never in the repo). The marked totals are served at `GET /api/provenance`.
  Note, stated plainly: with an 11-record edition the library's statistical
  confirmation threshold is not reached, so the keyed watermark is provenance
  evidence, not a statistical proof. The canary markers + this declaration
  log are the primary copy-proof.

## Metering (edge API only)

- Per-identity record budget: the whole dataset is 11 records (1 map + 10
  histories) per 24 hours. A real player reads it once per session and
  re-reads cost nothing (already-seen records are not double-counted).
- Request quota: 120 requests per hour per identity (lab default).
- Herd detection: identities that partition the dataset between them are
  flagged and their budgets tightened (lab thresholds, rescaled to an
  11-record dataset - see `workers/hanoi-edge/README.md`).
- Step-up, never a hard block: when a budget or quota trips, the API answers
  402 with an x402 manifest (price 0.001 USD as a signal, settlement none).
  The only real action is continue-free; players already inside are never
  kicked, muted, or throttled. A completed step-up grants a 24-hour grace
  window (antiRea `createVerificationGrace`).
- All limits above are lab defaults, not measured traffic. They must be
  re-tuned from real traffic after deployment.

## Declaration log

- The declaration text above is also appended to a hash-chained log
  (antiRea `createDeclarationLog`) when the Worker starts, and served at
  `GET /api/provenance` with its chain verification. The log predates any
  copy made after this declaration was published.
