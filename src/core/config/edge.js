// Edge API client (Phase 2D, Hanoi mode only; owner: fixer 2D).
//
// The game fetches the Hanoi map + landmark history from the metered edge API
// ONLY when an edge URL is set. Default is disabled: EDGE_API_URL is '' and
// the game uses the bundled dataset with zero network calls and zero behavior
// change on static Pages. To enable, set EDGE_API_URL below to the deployed
// Worker origin (or pass ?edge=https://<worker-host> for one load). When the
// API is absent, fails, times out, or returns a bad shape, the bundled
// dataset is the fallback: the game never breaks because the edge is down.
//
// The edge data is validated before use: the map must be a 40x40 grid with
// the 10 real landmark ids, and the history must carry all 10 real ids with
// non-empty strings. Canary ids are never valid edge data: validLandmarksData
// rejects any entry whose id starts with "canary-".
//
// Vietnamese UI strings are written WITHOUT diacritics, matching the app
// convention. No long dashes in this file: only short hyphens (-).
import { HANOI_ROWS, HANOI_LEGEND, HANOI_LANDMARKS } from '../../world/hanoi-map.js';
import { LANDMARK_INFO, landmarkInfo } from '../../game/landmark-history.js';

/** Edge API base URL. '' = disabled: use the bundled dataset, make no fetch. */
export const EDGE_API_URL = '';
/** How long to wait for the edge before falling back to the bundled dataset. */
export const EDGE_TIMEOUT_MS = 3000;

/** The 10 real landmark ids, in checklist order. */
export const EDGE_LANDMARK_IDS = Object.freeze(Object.keys(LANDMARK_INFO));

/** True when an edge URL is set (non-empty string). */
export function edgeEnabled(url = EDGE_API_URL) {
  return typeof url === 'string' && url !== '';
}

/**
 * Resolve the edge URL for this load: an ?edge=https://... param wins over
 * the constant (handy for testing a deployment), anything else falls back
 * to EDGE_API_URL. Only https URLs are accepted from the param.
 */
export function resolveEdgeUrl(searchParams) {
  const q = searchParams && typeof searchParams.get === 'function' ? searchParams.get('edge') : null;
  if (typeof q === 'string' && q.startsWith('https://')) return q;
  return EDGE_API_URL;
}

/**
 * One JSON fetch with a timeout. Returns the parsed JSON, or null on any
 * failure: no fetch, timeout, network error, non-OK status, bad JSON.
 * Never throws.
 */
export async function fetchEdgeJson(url, { fetchImpl = null, timeoutMs = EDGE_TIMEOUT_MS } = {}) {
  const run = typeof fetchImpl === 'function'
    ? fetchImpl
    : (typeof fetch === 'function' ? fetch : null);
  if (typeof run !== 'function') return null;
  let timer = 0;
  try {
    let abort = null;
    let signal;
    if (typeof AbortController !== 'undefined') {
      abort = new AbortController();
      signal = abort.signal;
    }
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => { if (abort) abort.abort(); resolve(null); }, timeoutMs);
    });
    const req = (async () => {
      const res = await run(url, signal ? { signal } : undefined);
      if (!res || res.ok === false) return null;
      return res.json();
    })();
    return await Promise.race([req, timeout]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** True when the edge /api/map payload has the shape the game needs. */
export function validMapData(d) {
  if (!d || typeof d !== 'object') return false;
  if (d.size !== 40) return false;
  if (!Array.isArray(d.rows) || d.rows.length !== 40) return false;
  for (const row of d.rows) if (typeof row !== 'string' || row.length !== 40) return false;
  if (!d.legend || typeof d.legend !== 'object') return false;
  if (!d.landmarks || typeof d.landmarks !== 'object') return false;
  for (const id of EDGE_LANDMARK_IDS) {
    const lm = d.landmarks[id];
    if (!lm || !Array.isArray(lm.anchor) || lm.anchor.length !== 2) return false;
    if (!Array.isArray(lm.rects) || !Array.isArray(lm.cells)) return false;
  }
  return true;
}

/** True when the edge /api/landmarks payload has the shape the game needs. */
export function validLandmarksData(d) {
  if (!d || typeof d !== 'object') return false;
  if (!Array.isArray(d.landmarks) || d.landmarks.length !== 10) return false;
  const seen = new Set();
  for (const e of d.landmarks) {
    if (!e || typeof e !== 'object') return false;
    if (typeof e.id !== 'string' || e.id.startsWith('canary-')) return false;
    if (!EDGE_LANDMARK_IDS.includes(e.id)) return false;
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    for (const k of ['nameEN', 'nameVI', 'funEN', 'funVI', 'source']) {
      if (typeof e[k] !== 'string' || e[k].length === 0) return false;
    }
    for (const k of ['histEN', 'histVI']) {
      if (!Array.isArray(e[k]) || e[k].length === 0) return false;
      for (const line of e[k]) if (typeof line !== 'string' || line.length === 0) return false;
    }
  }
  return seen.size === 10;
}

/** The bundled dataset, in edge shape: the fallback, and the default. */
export function bundledHanoiData() {
  return {
    map: { rows: HANOI_ROWS, legend: HANOI_LEGEND, landmarks: HANOI_LANDMARKS },
    historyInfo: (id) => landmarkInfo(id),
  };
}

/**
 * Load the Hanoi dataset: from the edge when an edge URL is set, else the
 * bundled dataset. Any edge failure (absent, timeout, bad shape) falls back
 * to the bundled dataset. Returns { source: 'edge' | 'bundled', map, historyInfo }.
 * historyInfo(id) is a lookup with the same contract as landmarkInfo(id).
 * With the flag off this makes zero network calls: fetchImpl is never touched.
 */
export async function loadHanoiData({ edgeUrl = EDGE_API_URL, fetchImpl = null, timeoutMs = EDGE_TIMEOUT_MS } = {}) {
  if (!edgeEnabled(edgeUrl)) return { source: 'bundled', ...bundledHanoiData() };
  const base = String(edgeUrl).replace(/\/$/, '');
  // Both fetches run in parallel: a dead edge costs one timeout (3s), not two (6s).
  // fetchEdgeJson never throws (null on any failure), so Promise.all is safe here.
  const [map, lm] = await Promise.all([
    fetchEdgeJson(base + '/api/map', { fetchImpl, timeoutMs }),
    fetchEdgeJson(base + '/api/landmarks', { fetchImpl, timeoutMs }),
  ]);
  if (!validMapData(map) || !validLandmarksData(lm)) return { source: 'bundled', ...bundledHanoiData() };
  const byId = new Map(lm.landmarks.map((e) => [e.id, e]));
  return {
    source: 'edge',
    map: { rows: map.rows, legend: map.legend, landmarks: map.landmarks },
    historyInfo: (id) => byId.get(id) || null,
  };
}
