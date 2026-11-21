// Hanoi 3D edge API (Phase 2D; owner: fixer 2D).
// Cloudflare Worker: serves the Hanoi map + landmark history behind antiRea
// metering. NOT deployed by this repo: deploy it from your own Cloudflare
// account (see README.md in this folder for the exact steps).
//
// Library: @dannyphan190/anti-rea v3.3.1 (verified from the installed
// package - every import below was checked against the published module).
// Correction to docs/antirea-plan.md: `createCanaryTrapRequest` does NOT
// exist in 3.3.1. The real trap helper is `handleCanaryTrapRequest`
// (plus `createCanaryRoute` / `createCanaryMaze`). Only verified names are
// used here.
//
// Rules the Worker enforces:
//   - Advisory only. NOTHING here hard-blocks a real player: the strongest
//     reaction is a 402 step-up for NEW data, and a completed step-up grants
//     a 24-hour grace window. Players already inside are never kicked,
//     muted, or throttled.
//   - All limits are LAB defaults, not measured traffic. Re-tune them from
//     real traffic after deployment.
//   - No secret lives in this file. The only secret the Worker reads is
//     env.ANTIREA_WATERMARK_KEY (set with `wrangler secret put`, never in
//     the repo); without it the keyed watermark is skipped and the static
//     marker still applies.
//   - Static art stays copyable: this Worker protects the DATA (map +
//     history), not atlas.webp / hanoi-tiles.glb / basic-grand.glb.
// No long dashes in this file: only short hyphens (-).
import {
  createRecordBudget,
  createQuotaGuard,
  createSurfaceGuard,
  createHerdDetector,
  applyHerdLadder,
  handleCanaryTrapRequest,
  createCanaryMaze,
  createStepUp402Responder,
  createVerificationGrace,
  createDeclarationLog,
  createValueWatermark,
} from '@dannyphan190/anti-rea';
import { HANOI_ROWS, HANOI_LEGEND, HANOI_LANDMARKS } from '../../../src/world/hanoi-map.js';
import { LANDMARK_INFO } from '../../../src/game/landmark-history.js';
import { CANARY_IDS, CANARY_TRAP_PATHS } from '../../../src/game/canary.js';

// ---- public constants ------------------------------------------------------------
export const GAME_URL = 'https://dankezo.github.io/hanoi-3d/?map=hanoi';
export const REPO_URL = 'https://github.com/dankezo/hanoi-3d';
export const ALLOWED_ORIGIN = 'https://dankezo.github.io';
/** One-line declaration, same text as data/provenance.json `declaration`. */
export const DECLARATION_TEXT = 'Hanoi 3D dataset by dankezo (MIT): the 40x40 Hanoi map and the 10 landmark histories in github.com/dankezo/hanoi-3d are the author\'s data, metered per identity when served via the edge API, with canary records HANOI3D-CANARY-MAP-7F3A9D / HANOI3D-CANARY-HIST-2B8E41 and watermark HANOI3D-DANKEZO-WM-9Q7K2M. Static art stays copyable.';
/** Step-up price, USD. A signal only: settlement is always "none". */
export const STEP_UP_PRICE_USD = 0.001;

/** Record ids the API can serve: 1 map record + 10 landmark records. */
export const RECORD_IDS = Object.freeze(['map:grid', ...Object.keys(LANDMARK_INFO)]);
export const LANDMARK_IDS = Object.freeze(Object.keys(LANDMARK_INFO));
/** Herd record index: map 0, landmarks 1-10 in checklist order. */
const RECORD_INDEX = new Map(RECORD_IDS.map((id, i) => [id, i]));

/**
 * Surface-guard field lists. The guard checks EVERY field name at every
 * depth, so the lists must name nested fields too: legend chars, landmark
 * ids, and the per-landmark / per-history field names. Any field NOT listed
 * (a canary flag, an internal id, build metadata) is stripped from the
 * payload in strip mode and reported as a violation.
 */
export const SURFACE_FIELDS = Object.freeze({
  map: Object.freeze(['size', 'rows', 'legend', 'landmarks', ...Object.keys(HANOI_LEGEND), ...LANDMARK_IDS, 'anchor', 'rects', 'cells', 'tileId', 'rot']),
  landmarks: Object.freeze(['landmarks', 'id', 'nameEN', 'nameVI', 'histEN', 'histVI', 'funEN', 'funVI', 'source']),
  landmark: Object.freeze(['id', 'nameEN', 'nameVI', 'histEN', 'histVI', 'funEN', 'funVI', 'source']),
  provenance: Object.freeze(['owner', 'source', 'license', 'live', 'dataset', 'watermark', 'canary', 'declaration', 'entries', 'verify', 'watermarkTotals', 'status', 'note', 'ids', 'markers', 'index', 'timestamp', 'form', 'prevHash', 'hash', 'ok', 'checked', 'firstBadIndex', 'id', 'publishedTotal']),
});

/** Numeric edition records for the keyed value watermark (anchors + cell count). */
export function watermarkRecords() {
  const recs = LANDMARK_IDS.map((id) => {
    const a = HANOI_LANDMARKS[id].anchor;
    return { id, q: a[0] + 20, p: a[1] + 20 };
  });
  recs.push({ id: 'cells', q: 1600, p: 10 });
  return recs;
}

function randomHex(n) {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

/**
 * Build one edge app (guards + state). The default export is a single
 * app for the Worker; tests build fresh apps via this factory so state
 * never leaks between cases.
 *
 * opts: { recordBudgetMax (default 11 = the whole dataset per 24h),
 *   quotaMaxRequests (default 120 per hour), onTrapAlert, onHerdFlag }
 */
export function createHanoiEdgeApp(opts = {}) {
  const recordBudgetMax = opts.recordBudgetMax ?? 11;
  const quotaMaxRequests = opts.quotaMaxRequests ?? 120;
  const onTrapAlert = opts.onTrapAlert || null;
  const onHerdFlag = opts.onHerdFlag || null;

  const budget = createRecordBudget({ maxDistinctPerWindow: recordBudgetMax, windowMs: 86400000 });
  const quota = createQuotaGuard({
    tiers: { anonymous: { maxRequests: quotaMaxRequests, windowMs: 3600000, maxPageSize: 50, maxPage: 1 } },
    trustedIpHeader: 'cf-connecting-ip',
    resolveIdentity: (req) => ({ ip: req.headers.get('cf-connecting-ip') || undefined }),
  });
  const surface = createSurfaceGuard({
    mode: 'strip',
    routes: {
      map: { responseFields: SURFACE_FIELDS.map },
      landmarks: { responseFields: SURFACE_FIELDS.landmarks },
      landmark: { responseFields: SURFACE_FIELDS.landmark },
      provenance: { responseFields: SURFACE_FIELDS.provenance },
    },
  });
  const herd = createHerdDetector({
    // Lab numbers, RESCALED to an 11-record dataset (the library defaults
    // assume 10,000 records and could never flag here). Still lab numbers,
    // not measured traffic: re-tune from real traffic after deployment.
    combinedCoverageFloor: 11,
    coverageRampDenominator: 11,
    flagThreshold: 60,
    flagMinMembers: 3,
    minOwnRecords: 2,
    unionFloor: 6,
    recheckGrowth: 1,
    defaultRecordCap: recordBudgetMax,
    recordIndex: (id) => RECORD_INDEX.get(id),
    onFlag: (snapshot) => {
      // Tighten the flagged herd's budgets only. Over-budget members get a
      // 402 step-up on their NEXT data request, never a block.
      applyHerdLadder(budget, snapshot, { memberLimit: 2 });
      if (onHerdFlag) { try { onHerdFlag(snapshot); } catch { /* logging must never break a request */ } }
    },
  });
  const grace = createVerificationGrace({});
  const declLog = createDeclarationLog();
  declLog.append({ form: 'rsl-license', declaration: DECLARATION_TEXT, timestamp: Date.now() });
  declLog.append({ form: 'robots-content-signal', declaration: 'watermark HANOI3D-DANKEZO-WM-9Q7K2M; canary HANOI3D-CANARY-MAP-7F3A9D / HANOI3D-CANARY-HIST-2B8E41', timestamp: Date.now() });
  const maze = createCanaryMaze({ enabled: true, prefix: '/_canary/' });
  const issuedStepUp = new Map(); // sessionId -> { token, expiresAt }
  // Record ids each identity has already been served (re-reads cost 0, the
  // same rule the record budget uses internally). Bounded: at most 11 ids
  // per identity, and the map itself is capped below.
  const seenByIdentity = new Map(); // identity -> Set(recordId)
  let watermarkCache = { key: null, marked: null };

  function watermarkFor(env) {
    const key = env && typeof env.ANTIREA_WATERMARK_KEY === 'string' ? env.ANTIREA_WATERMARK_KEY : '';
    if (!key) return { status: 'static-marker-only', marked: null };
    if (watermarkCache.key !== key) {
      const wm = createValueWatermark({ key });
      watermarkCache = { key, marked: wm.markEdition('hanoi-map-v1', watermarkRecords()) };
    }
    return { status: 'keyed', marked: watermarkCache.marked };
  }

  function identityOf(request) {
    const ip = request.headers.get('cf-connecting-ip') || '';
    const cookies = parseCookies(request.headers.get('cookie'));
    // Client id cookie wins over IP: one browser keeps one identity even
    // behind a shared IP. Alternative (IP-only) is documented in README.md.
    if (cookies.hanoi_cid) return 'cid:' + cookies.hanoi_cid;
    if (ip) return 'ip:' + ip;
    return 'ip:unknown';
  }

  function corsHeaders(request) {
    const origin = request.headers.get('origin') || '';
    const allowed = origin === ALLOWED_ORIGIN || origin.startsWith('http://localhost:');
    return allowed ? { 'access-control-allow-origin': origin, 'vary': 'Origin' } : {};
  }

  function json(request, status, body, extra = {}) {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, no-store',
        ...corsHeaders(request),
        ...extra,
      },
    });
  }

  function maybeSetClientId(request, response) {
    const cookies = parseCookies(request.headers.get('cookie'));
    if (cookies.hanoi_cid) return response;
    const next = new Response(response.body, response);
    next.headers.set('set-cookie', 'hanoi_cid=' + randomHex(16) + '; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure');
    return next;
  }

  function stepUp(request, identity, reason) {
    const origin = new URL(request.url).origin;
    const responder = createStepUp402Responder({
      priceUsd: STEP_UP_PRICE_USD,
      manifestUrl: origin + '/api/step-up/manifest',
      facilitator: 'hanoi-3d-edge (label only, never contacted)',
      payUrl: GAME_URL,
      appealUrl: REPO_URL + '/issues',
      continueFreeUrl: origin + '/api/step-up/continue',
    });
    const sessionId = identity + ':' + randomHex(8);
    const token = randomHex(16);
    issuedStepUp.set(sessionId, { token, expiresAt: Date.now() + 600000 });
    if (issuedStepUp.size > 1000) {
      const now = Date.now();
      for (const [k, v] of issuedStepUp) if (v.expiresAt <= now) issuedStepUp.delete(k);
    }
    const r = responder.respond(sessionId, token);
    return new Response(r.body, {
      status: 402,
      headers: { ...r.headers, 'cache-control': 'private, no-store', 'x-hanoi-step-up': reason, ...corsHeaders(request) },
    });
  }

  /** Quota + budget gate for a data route. Returns a 402 Response when the identity must step up, else null. */
  async function gate(request, identity, recordIds) {
    const q = await quota.checkRequest(request);
    if (!q.allowed) return stepUp(request, identity, 'quota');
    // Re-reads cost 0 (the library's own rule): only ids this identity has
    // never been served count against the budget. Without this, a player who
    // already read the whole dataset could never re-read a single record.
    const seen = seenByIdentity.get(identity);
    const fresh = seen ? recordIds.filter((id) => !seen.has(id)) : recordIds;
    if (fresh.length === 0) return null;
    const b = budget.check(identity, fresh.length);
    if (!b.allowed) {
      // Grace: an identity that already completed a step-up is served, not
      // stepped up again, until its grace window ends.
      const verdict = grace.guardStepUp(identity, 1);
      if (verdict.action === 'observe') return null;
      return stepUp(request, identity, 'record_budget');
    }
    return null;
  }

  function serve(request, identity, route, payload, recordIds) {
    const inspection = surface.inspectResponse(route, payload);
    const body = inspection.sanitized !== undefined ? inspection.sanitized : payload;
    budget.consume(identity, recordIds);
    let seen = seenByIdentity.get(identity);
    if (!seen) {
      seen = new Set();
      if (seenByIdentity.size >= 10000) seenByIdentity.delete(seenByIdentity.keys().next().value);
      seenByIdentity.set(identity, seen);
    }
    for (const id of recordIds) seen.add(id);
    herd.observe({ type: 'detail', identity, ip: request.headers.get('cf-connecting-ip') || undefined, recordIds, status: 200, budgetLimit: recordBudgetMax });
    return maybeSetClientId(request, json(request, 200, body));
  }

  function mapPayload() {
    return { size: 40, rows: [...HANOI_ROWS], legend: { ...HANOI_LEGEND }, landmarks: JSON.parse(JSON.stringify(HANOI_LANDMARKS)) };
  }
  function landmarksPayload() {
    return { landmarks: LANDMARK_IDS.map((id) => ({ id, ...LANDMARK_INFO[id] })) };
  }

  async function fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const identity = identityOf(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...corsHeaders(request), 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
    }
    if (request.method !== 'GET') return json(request, 405, { error: 'method_not_allowed' });

    if (path === '/') {
      return json(request, 200, { service: 'hanoi-3d-edge', routes: ['/api/map', '/api/landmarks', '/api/landmarks/:id', '/api/provenance', '/api/step-up/manifest', '/api/step-up/continue', '/_canary/*'] });
    }

    if (path === '/api/map') {
      const blocked = await gate(request, identity, ['map:grid']);
      if (blocked) return blocked;
      return serve(request, identity, 'map', mapPayload(), ['map:grid']);
    }

    if (path === '/api/landmarks') {
      const blocked = await gate(request, identity, LANDMARK_IDS);
      if (blocked) return blocked;
      return serve(request, identity, 'landmarks', landmarksPayload(), [...LANDMARK_IDS]);
    }

    if (path.startsWith('/api/landmarks/')) {
      const id = decodeURIComponent(path.slice('/api/landmarks/'.length));
      if (CANARY_IDS.includes(id)) {
        // Canary record requested: the trap response, never data. The
        // library answers 404 not_found for trap hits by design.
        const trap = await handleCanaryTrapRequest(request, {
          paths: [...CANARY_TRAP_PATHS],
          trustedIpHeader: 'cf-connecting-ip',
          onAlert: onTrapAlert || undefined,
        });
        return json(request, trap.status, trap.body);
      }
      const info = LANDMARK_INFO[id];
      if (!info) return json(request, 404, { error: 'not_found' });
      const blocked = await gate(request, identity, [id]);
      if (blocked) return blocked;
      return serve(request, identity, 'landmark', { id, ...info }, [id]);
    }

    if (path === '/api/provenance') {
      const wm = watermarkFor(env);
      const payload = {
        owner: 'dankezo',
        source: REPO_URL,
        license: 'MIT',
        live: GAME_URL,
        dataset: 'Hanoi map (40x40 grid + landmark positions) + 10 landmark histories',
        watermark: 'HANOI3D-DANKEZO-WM-9Q7K2M',
        canary: { ids: [...CANARY_IDS], markers: ['HANOI3D-CANARY-MAP-7F3A9D', 'HANOI3D-CANARY-HIST-2B8E41'] },
        declaration: DECLARATION_TEXT,
        entries: declLog.entries(),
        verify: declLog.verify(),
        watermarkTotals: wm.marked ? wm.marked.map((r) => ({ id: r.id, publishedTotal: r.publishedTotal })) : null,
        status: wm.status,
        note: 'Limits are lab defaults, not measured traffic. Static art stays copyable.',
      };
      const inspection = surface.inspectResponse('provenance', payload);
      return json(request, 200, inspection.sanitized !== undefined ? inspection.sanitized : payload);
    }

    if (path === '/api/step-up/manifest') {
      const origin = url.origin;
      const responder = createStepUp402Responder({
        priceUsd: STEP_UP_PRICE_USD,
        manifestUrl: origin + '/api/step-up/manifest',
        facilitator: 'hanoi-3d-edge (label only, never contacted)',
        payUrl: GAME_URL,
        appealUrl: REPO_URL + '/issues',
        continueFreeUrl: origin + '/api/step-up/continue',
      });
      return json(request, 200, responder.manifestDocument());
    }

    if (path === '/api/step-up/continue') {
      const session = url.searchParams.get('session') || '';
      const token = url.searchParams.get('token') || '';
      const issued = issuedStepUp.get(session);
      const origin = url.origin;
      const responder = createStepUp402Responder({
        priceUsd: STEP_UP_PRICE_USD,
        manifestUrl: origin + '/api/step-up/manifest',
        facilitator: 'hanoi-3d-edge (label only, never contacted)',
        payUrl: GAME_URL,
        appealUrl: REPO_URL + '/issues',
        continueFreeUrl: origin + '/api/step-up/continue',
      });
      if (!issued || issued.expiresAt <= Date.now() || !responder.checkAssertion(token, issued.token)) {
        return json(request, 400, { error: 'bad_step_up' });
      }
      issuedStepUp.delete(session);
      grace.recordVerified(identity, { reason: 'step-up continue-free' });
      const html = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hanoi 3D</title></head>'
        + '<body style="font-family:serif;text-align:center;padding:48px 16px;color:#5a3a28;background:#efe0c2">'
        + '<p>Cam on ban. Ban co the tiep tuc choi.</p>'
        + '<p>Thank you. You can keep playing.</p>'
        + '<p><a href="' + GAME_URL + '">Quay lai game / Back to the game</a></p>'
        + '</body></html>';
      return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', ...corsHeaders(request) } });
    }

    if (path.startsWith('/_canary/')) {
      const m = await maze.handle(request);
      return new Response(m.html || JSON.stringify(m.body || { error: 'not_found' }), {
        status: m.status,
        headers: { 'content-type': m.contentType || 'text/html; charset=utf-8', 'cache-control': 'private, no-store', ...corsHeaders(request) },
      });
    }

    return json(request, 404, { error: 'not_found' });
  }

  return { fetch };
}

export default createHanoiEdgeApp();
