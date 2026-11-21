// Phase 2D checks (node tools/check-2d.mjs). No browser, no deploy, no live edge call.
// Covers: (a) canary records exist with their markers; (b) NO game accessor can
// surface a canary; (c) declaration file + provenance.json; (d) watermark marker
// present in the dataset; (e) Worker routes with mocked Request/Response:
// normal request returns declared fields only, over-budget returns a 402
// step-up (NOT 403/429), a canary request returns the trap response, herd
// flagging tightens budgets, grace suppresses a second step-up; (f) edge flag
// OFF (default) = bundled dataset + zero network calls, flag ON + good edge
// data = edge source, flag ON + bad edge = bundled fallback, plus the
// createHanoi data override and the createLandmarks historyInfo override;
// (g) zero secrets in the new files; plus long dashes.
// No long dashes in this file: only short hyphens (-).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANARY_MARKER_MAP, CANARY_MARKER_HIST, CANARY_LANDMARKS, CANARY_HISTORY,
  CANARY_IDS, CANARY_TRAP_PATHS, isCanaryId,
} from '../src/game/canary.js';
import { LANDMARK_INFO, landmarkInfo, DATASET_PROVENANCE } from '../src/game/landmark-history.js';
import { HANOI_LANDMARKS, HANOI_DATASET_MARKER, HANOI_ROWS, HANOI_LEGEND } from '../src/world/hanoi-map.js';
import { createHanoi } from '../src/world/hanoi.js';
import { createLandmarks, LANDMARKS } from '../src/game/landmarks.js';
import {
  EDGE_API_URL, EDGE_TIMEOUT_MS, EDGE_LANDMARK_IDS, edgeEnabled, resolveEdgeUrl,
  fetchEdgeJson, validMapData, validLandmarksData, bundledHanoiData, loadHanoiData,
} from '../src/core/config/edge.js';
import workerDefault, {
  createHanoiEdgeApp, SURFACE_FIELDS, RECORD_IDS, DECLARATION_TEXT,
} from '../workers/hanoi-edge/src/index.js';
// The game package.json must NOT depend on anti-rea (Worker-only dep), so the
// library is loaded through the Worker's own node_modules via createRequire.
import { createRequire } from 'node:module';
const requireFromWorker = createRequire(join(dirname(fileURLToPath(import.meta.url)), '..', 'workers/hanoi-edge/src/index.js'));
const {
  handleCanaryTrapRequest, createSurfaceGuard, createValueWatermark,
  applyHerdLadder, createRecordBudget,
} = requireFromWorker('@dannyphan190/anti-rea');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WM = 'HANOI3D-DANKEZO-WM-9Q7K2M';
let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; failures.push(name); console.log('FAIL: ' + name); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isAscii = (s) => /^[\x00-\x7F]*$/.test(s);

// ---- (a): canary records exist with their markers --------------------------------
{
  const text = readFileSync(join(ROOT, 'src/game/canary.js'), 'utf8');
  check('(a) canary map marker string is in canary.js', text.includes(CANARY_MARKER_MAP));
  check('(a) canary history marker string is in canary.js', text.includes(CANARY_MARKER_HIST));
  check('(a) markers are distinct strings', CANARY_MARKER_MAP !== CANARY_MARKER_HIST);
  check('(a) exactly 2 canary landmark records', Object.keys(CANARY_LANDMARKS).length === 2);
  check('(a) exactly 2 canary history records', Object.keys(CANARY_HISTORY).length === 2);
  check('(a) CANARY_IDS lists both canary ids', CANARY_IDS.length === 2 && CANARY_IDS.includes('canary-ho-guom-bac') && CANARY_IDS.includes('canary-thap-dong'));
  check('(a) isCanaryId true for canary ids, false for real ones', isCanaryId('canary-ho-guom-bac') && isCanaryId('canary-thap-dong') && !isCanaryId('hoankiem') && !isCanaryId('nope'));
  for (const id of CANARY_IDS) {
    const lm = CANARY_LANDMARKS[id];
    check('(a) canary ' + id + ' flagged canary:true', lm.canary === true);
    check('(a) canary ' + id + ' anchor is outside the 40x40 grid', lm.anchor[0] < -20 || lm.anchor[0] > 19 || lm.anchor[1] < -20 || lm.anchor[1] > 19);
    check('(a) canary ' + id + ' carries the map marker', lm.marker === CANARY_MARKER_MAP);
    const h = CANARY_HISTORY[id];
    check('(a) canary history ' + id + ' flagged canary:true', h.canary === true);
    check('(a) canary history ' + id + ' fun fact carries the history marker', h.funEN.includes(CANARY_MARKER_HIST) && h.funVI.includes(CANARY_MARKER_HIST));
  }
  check('(a) canary trap paths are the two edge landmark paths', CANARY_TRAP_PATHS.length === 2 && CANARY_TRAP_PATHS.every((p) => p.startsWith('/api/landmarks/canary-')));
  check('(a) canary markers are ASCII', isAscii(CANARY_MARKER_MAP) && isAscii(CANARY_MARKER_HIST));
}

// ---- (b): no game accessor can surface a canary -----------------------------------
{
  check('(b) LANDMARKS has 11 real ids, zero canary', LANDMARKS.length === 11 && LANDMARKS.every((d) => !d.id.startsWith('canary-')));
  check('(b) landmarkInfo(canary) is null for both ids', CANARY_IDS.every((id) => landmarkInfo(id) === null));
  check('(b) LANDMARK_INFO has no canary key', !Object.keys(LANDMARK_INFO).some((k) => k.startsWith('canary-')));
  check('(b) HANOI_LANDMARKS has no canary key', !Object.keys(HANOI_LANDMARKS).some((k) => k.startsWith('canary-')));
  const wfc = createHanoi({ seed: 1 });
  let badCells = 0;
  for (let z = -20; z <= 19; z++) {
    for (let x = -20; x <= 19; x++) {
      const c = wfc.get(x, z);
      if (c.landmarkId && c.landmarkId.startsWith('canary-')) badCells++;
    }
  }
  check('(b) 0 of 1600 map cells carries a canary landmarkId', badCells === 0);
  // No src file imports canary.js (the Worker does, from workers/, not src/).
  function listFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) out.push(...listFiles(p));
      else if (p.endsWith('.js')) out.push(p);
    }
    return out;
  }
  const srcFiles = listFiles(join(ROOT, 'src'));
  const importers = srcFiles.filter((f) => /canary\.js|from ['"]\.\.?\/.*canary['"]/.test(readFileSync(f, 'utf8')));
  check('(b) no src file imports canary.js', importers.length === 0);
  const canaryFree = ['src/game/landmarks.js', 'src/game/landmark-history.js', 'src/world/hanoi.js', 'src/world/hanoi-map.js', 'src/main.js'];
  const mentions = canaryFree.filter((rel) => /canary/i.test(readFileSync(join(ROOT, rel), 'utf8')));
  check('(b) game display/map/boot files never mention canary', mentions.length === 0);
  check('(b) edge client rejects canary ids as data (validLandmarksData)', !validLandmarksData({ landmarks: [{ id: 'canary-ho-guom-bac', nameEN: 'x', nameVI: 'x', histEN: ['x'], histVI: ['x'], funEN: 'x', funVI: 'x', source: 'https://example.com/' }] }));
}

// ---- (c): declaration file + provenance.json ---------------------------------------
{
  const decl = readFileSync(join(ROOT, 'docs/antirea-declaration.md'), 'utf8');
  check('(c) declaration names owner dankezo', decl.includes('dankezo'));
  check('(c) declaration names the source repo', decl.includes('https://github.com/dankezo/hanoi-3d'));
  check('(c) declaration names the MIT license', decl.includes('MIT'));
  check('(c) declaration states the canary scheme + markers', decl.includes('HANOI3D-CANARY-MAP-7F3A9D') && decl.includes('HANOI3D-CANARY-HIST-2B8E41'));
  check('(c) declaration states the watermark marker', decl.includes(WM));
  check('(c) declaration states static art stays copyable', decl.includes('atlas.webp') && decl.includes('hanoi-tiles.glb'));
  const prov = JSON.parse(readFileSync(join(ROOT, 'data/provenance.json'), 'utf8'));
  check('(c) provenance.json owner is dankezo', prov.owner === 'dankezo');
  check('(c) provenance.json source is the repo', prov.source === 'https://github.com/dankezo/hanoi-3d');
  check('(c) provenance.json license is MIT', prov.license === 'MIT');
  check('(c) provenance.json watermark matches', prov.watermark === WM);
  check('(c) provenance.json lists both canary ids + markers', prov.canary.ids.length === 2 && prov.canary.markers.includes('HANOI3D-CANARY-MAP-7F3A9D') && prov.canary.markers.includes('HANOI3D-CANARY-HIST-2B8E41'));
  check('(c) provenance.json checklist order has 11 ids', prov.checklistOrder.length === 11);
  check('(c) worker DECLARATION_TEXT matches provenance.json declaration', DECLARATION_TEXT === prov.declaration);
}

// ---- (d): watermark marker in the dataset -------------------------------------------
{
  check('(d) DATASET_PROVENANCE.watermark is the marker', DATASET_PROVENANCE.watermark === WM);
  check('(d) DATASET_PROVENANCE owner is dankezo', DATASET_PROVENANCE.owner === 'dankezo');
  check('(d) DATASET_PROVENANCE order is the 11-id checklist order', JSON.stringify(DATASET_PROVENANCE.order) === JSON.stringify(['hoankiem', 'ngocson', 'westlake', 'tranquoc', 'oldquarter', 'mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien']));
  check('(d) HANOI_DATASET_MARKER is the marker', HANOI_DATASET_MARKER === WM);
  const histText = readFileSync(join(ROOT, 'src/game/landmark-history.js'), 'utf8');
  const mapText = readFileSync(join(ROOT, 'src/world/hanoi-map.js'), 'utf8');
  const provText = readFileSync(join(ROOT, 'data/provenance.json'), 'utf8');
  const declText = readFileSync(join(ROOT, 'docs/antirea-declaration.md'), 'utf8');
  check('(d) marker present in landmark-history.js', histText.includes(WM));
  check('(d) marker present in hanoi-map.js', mapText.includes(WM));
  check('(d) marker present in provenance.json', provText.includes(WM));
  check('(d) marker present in the declaration doc', declText.includes(WM));
}

// ---- (e): Worker routes ---------------------------------------------------------------
function mockReq(path, { ip = '203.0.113.1', cid = null, origin = 'https://dankezo.github.io' } = {}) {
  const headers = { 'cf-connecting-ip': ip, origin };
  if (cid) headers.cookie = 'hanoi_cid=' + cid;
  return new Request('https://edge.test' + path, { method: 'GET', headers });
}
async function bodyJson(res) {
  try { return JSON.parse(await res.text()); } catch { return null; }
}
{
  // Normal requests: declared fields only, CORS, no-store, client-id cookie.
  const app = createHanoiEdgeApp();
  const mapRes = await app.fetch(mockReq('/api/map'), {});
  const mapBody = await bodyJson(mapRes);
  check('(e) GET /api/map is 200', mapRes.status === 200);
  check('(e) /api/map size is 40', mapBody.size === 40);
  check('(e) /api/map rows are 40 strings of 40 chars', Array.isArray(mapBody.rows) && mapBody.rows.length === 40 && mapBody.rows.every((r) => r.length === 40));
  check('(e) /api/map rows match the bundled grid', JSON.stringify(mapBody.rows) === JSON.stringify(HANOI_ROWS));
  check('(e) /api/map landmarks are the 11 real ids', Object.keys(mapBody.landmarks).sort().join(',') === EDGE_LANDMARK_IDS.slice().sort().join(','));
  check('(e) /api/map body has no canary string anywhere', !JSON.stringify(mapBody).includes('canary'));
  check('(e) /api/map body has no undeclared top-level field', Object.keys(mapBody).sort().join(',') === 'landmarks,legend,rows,size');
  check('(e) /api/map sets CORS for the Pages origin', mapRes.headers.get('access-control-allow-origin') === 'https://dankezo.github.io');
  check('(e) /api/map is no-store', (mapRes.headers.get('cache-control') || '').includes('no-store'));
  check('(e) /api/map sets the hanoi_cid cookie', (mapRes.headers.get('set-cookie') || '').startsWith('hanoi_cid='));
  // Same identity re-reads: map (1) + landmarks (11) = the whole 12-record budget, then re-reads cost 0.
  const lmRes = await app.fetch(mockReq('/api/landmarks'), {});
  const lmBody = await bodyJson(lmRes);
  check('(e) GET /api/landmarks is 200', lmRes.status === 200);
  check('(e) /api/landmarks returns 11 entries', Array.isArray(lmBody.landmarks) && lmBody.landmarks.length === 11);
  check('(e) /api/landmarks entries carry declared fields only', lmBody.landmarks.every((e) => Object.keys(e).sort().join(',') === 'funEN,funVI,histEN,histVI,id,nameEN,nameVI,source'));
  check('(e) /api/landmarks has no canary id', lmBody.landmarks.every((e) => !e.id.startsWith('canary-')));
  check('(e) /api/landmarks history matches the bundled text', lmBody.landmarks.find((e) => e.id === 'hoankiem').funEN === LANDMARK_INFO.hoankiem.funEN);
  const oneRes = await app.fetch(mockReq('/api/landmarks/hoankiem'), {});
  check('(e) re-reading a seen record still serves 200 (cost 0)', oneRes.status === 200);
  const rootRes = await app.fetch(mockReq('/'), {});
  check('(e) GET / lists the routes', rootRes.status === 200 && (await bodyJson(rootRes)).service === 'hanoi-3d-edge');
  const missRes = await app.fetch(mockReq('/nope'), {});
  check('(e) unknown route is 404', missRes.status === 404);
  const missLmRes = await app.fetch(mockReq('/api/landmarks/nope'), {});
  check('(e) unknown landmark id is 404 not_found', missLmRes.status === 404 && (await bodyJson(missLmRes)).error === 'not_found');
}
{
  // Over-budget (test-only small budget): 402 step-up, NOT 403/429, then grace.
  const app = createHanoiEdgeApp({ recordBudgetMax: 2 });
  const ip = '203.0.113.2';
  const first = await app.fetch(mockReq('/api/map', { ip }), {});
  check('(e) over-budget setup: first request serves 200', first.status === 200);
  const over = await app.fetch(mockReq('/api/landmarks', { ip }), {});
  const overBody = await bodyJson(over);
  check('(e) over-budget request returns 402 (step-up)', over.status === 402);
  check('(e) over-budget is NOT a 403/429 block', over.status !== 403 && over.status !== 429);
  check('(e) 402 body is payment_required with the 0.001 signal price', overBody && overBody.error === 'payment_required' && overBody.price_usd === 0.001 && typeof overBody.session === 'string');
  check('(e) 402 body carries a continue-free URL with a session', overBody && typeof overBody.next_steps.continue_free === 'string' && overBody.next_steps.continue_free.includes('/api/step-up/continue?session='));
  check('(e) 402 carries the x402 headers', over.headers.get('x-payment-required') !== null && over.headers.get('x-x402-manifest') !== null);
  check('(e) 402 marks the reason header', over.headers.get('x-hanoi-step-up') === 'record_budget');
  // Complete the step-up (continue-free) with the session + token from the 402 body.
  const cont = await app.fetch(mockReq('/api/step-up/continue?session=' + encodeURIComponent(overBody.session) + '&token=' + encodeURIComponent(overBody.pay_token_hint), { ip }), {});
  const contText = await cont.text();
  check('(e) step-up continue returns 200', cont.status === 200);
  check('(e) continue page has the one-line VI text (diacritic-free)', contText.includes('Cam on ban. Ban co the tiep tuc choi.'));
  check('(e) continue page has the one-line EN text', contText.includes('Thank you. You can keep playing.'));
  // Grace: the same identity is served again instead of stepped up again.
  const after = await app.fetch(mockReq('/api/landmarks', { ip }), {});
  check('(e) after step-up, grace serves the data (200, not 402)', after.status === 200);
  const badCont = await app.fetch(mockReq('/api/step-up/continue?session=nope&token=nope', { ip }), {});
  check('(e) bad step-up session is 400', badCont.status === 400);
  const man = await app.fetch(mockReq('/api/step-up/manifest', { ip }), {});
  const manBody = await bodyJson(man);
  check('(e) step-up manifest serves with settlement none', man.status === 200 && manBody.settlement === 'none' && manBody.error === 'payment_required');
}
{
  // Quota trip also becomes a 402 step-up, never a 429.
  const app = createHanoiEdgeApp({ quotaMaxRequests: 2 });
  const ip = '203.0.113.3';
  await app.fetch(mockReq('/api/map', { ip }), {});
  await app.fetch(mockReq('/api/map', { ip }), {});
  const third = await app.fetch(mockReq('/api/map', { ip }), {});
  check('(e) quota trip returns 402, not 429', third.status === 402);
  check('(e) quota trip reason header is quota', third.headers.get('x-hanoi-step-up') === 'quota');
}
{
  // Canary trap: the trap response, plus the library-level check.
  const alerts = [];
  const app = createHanoiEdgeApp({ onTrapAlert: (a) => { alerts.push(a); } });
  const trap1 = await app.fetch(mockReq('/api/landmarks/canary-ho-guom-bac', { ip: '203.0.113.4' }), {});
  const trap1Body = await bodyJson(trap1);
  check('(e) canary record request returns the trap 404', trap1.status === 404 && trap1Body && trap1Body.error === 'not_found');
  const trap2 = await app.fetch(mockReq('/api/landmarks/canary-thap-dong', { ip: '203.0.113.4' }), {});
  check('(e) second canary record also traps 404', trap2.status === 404);
  check('(e) trap alert fired for a canary path', alerts.length >= 1 && alerts.some((a) => a.path.includes('canary-ho-guom-bac')));
  const directTrap = await handleCanaryTrapRequest(new Request('https://edge.test/api/landmarks/canary-ho-guom-bac'), { paths: [...CANARY_TRAP_PATHS] });
  check('(e) handleCanaryTrapRequest traps the canary path (isTrapped)', directTrap.isTrapped === true && directTrap.status === 404);
  const directReal = await handleCanaryTrapRequest(new Request('https://edge.test/api/landmarks/hoankiem'), { paths: [...CANARY_TRAP_PATHS] });
  check('(e) handleCanaryTrapRequest does NOT trap a real path', directReal.isTrapped === false);
  // Surface guard, direct: a tampered payload loses its undeclared fields.
  const sg = createSurfaceGuard({ mode: 'strip', routes: { map: { responseFields: SURFACE_FIELDS.map } } });
  const insp = sg.inspectResponse('map', { size: 40, rows: [], legend: {}, landmarks: {}, canary: true, seed: 1 });
  check('(e) surface guard strips canary/seed fields from a tampered payload', insp.sanitized && !('canary' in insp.sanitized) && !('seed' in insp.sanitized) && insp.sanitized.size === 40);
  // Maze: a decoy page, not data.
  const mazeRes = await app.fetch(mockReq('/_canary/abc', { ip: '203.0.113.4' }), {});
  const mazeText = await mazeRes.text();
  check('(e) canary maze serves a page (200, html)', mazeRes.status === 200 && mazeText.includes('<'));
}
{
  // Herd: three identities partitioning the 12 records flag, then the ladder cuts them.
  const flags = [];
  const app = createHanoiEdgeApp({ onHerdFlag: (s) => { flags.push(s); } });
  const take = async (cid, id) => {
    const path = id === 'map:grid' ? '/api/map' : '/api/landmarks/' + id;
    const res = await app.fetch(mockReq(path, { cid }), {});
    return res.status;
  };
  const plan = { A: ['map:grid', 'hoankiem', 'ngocson', 'westlake'], B: ['oldquarter', 'mausoleum', 'vanmieu', 'onepillar'], C: ['cathedral', 'opera', 'longbien', 'tranquoc'] };
  let all200 = true;
  for (const [cid, ids] of Object.entries(plan)) {
    for (const id of ids) { const st = await take(cid, id); if (st !== 200) all200 = false; }
  }
  check('(e) herd members each read their slice (all 200)', all200);
  check('(e) partitioned herd flags (onFlag fired)', flags.length === 1);
  check('(e) herd flag band supports a budget cut', flags.length === 1 && flags[0].band === 'budget_cut_supported');
  check('(e) herd flag covers all 12 records', flags.length === 1 && flags[0].combinedCoverage === 12);
  // Ladder: member A now has a 2-record cap and has already seen 4, so a NEW record trips step-up.
  const laddered = await app.fetch(mockReq('/api/landmarks/oldquarter', { cid: 'A' }), {});
  check('(e) laddered herd member gets 402 on a new record, not data', laddered.status === 402);
}
{
  // Provenance + keyed watermark (env key present vs absent).
  const app = createHanoiEdgeApp();
  const noKey = await app.fetch(mockReq('/api/provenance', { ip: '203.0.113.5' }), {});
  const noKeyBody = await bodyJson(noKey);
  check('(e) /api/provenance is 200', noKey.status === 200);
  check('(e) provenance owner/source/license match the declaration', noKeyBody.owner === 'dankezo' && noKeyBody.source === 'https://github.com/dankezo/hanoi-3d' && noKeyBody.license === 'MIT');
  check('(e) provenance carries the watermark marker', noKeyBody.watermark === WM);
  check('(e) provenance declaration log verifies (hash chain ok)', noKeyBody.verify && noKeyBody.verify.ok === true && noKeyBody.entries.length === 2);
  check('(e) provenance without a secret reports static-marker-only', noKeyBody.status === 'static-marker-only' && noKeyBody.watermarkTotals === null);
  const withKey = await app.fetch(mockReq('/api/provenance', { ip: '203.0.113.5' }), { ANTIREA_WATERMARK_KEY: 'test-key-2d-only' });
  const withKeyBody = await bodyJson(withKey);
  check('(e) provenance with a secret reports keyed + 12 totals', withKeyBody.status === 'keyed' && Array.isArray(withKeyBody.watermarkTotals) && withKeyBody.watermarkTotals.length === 12);
  // Direct library check: marking is deterministic-shaped, verification is advisory (enforcement none).
  const wm = createValueWatermark({ key: 'test-key-2d-only' });
  const marked = wm.markEdition('hanoi-map-v1', [{ id: 'cells', q: 1600, p: 10 }, { id: 'landmarks', q: 11, p: 1600 }]);
  check('(e) value watermark marks records with published totals', marked.length === 2 && marked.every((r) => typeof r.publishedTotal === 'number'));
  const ver = wm.verifyEdition('hanoi-map-v1', marked.map((r) => ({ id: r.id, q: r.q, p: r.p, publishedTotal: r.publishedTotal })));
  check('(e) value watermark verification reports enforcement none', ver && ver.enforcement === 'none');
  // Direct ladder check: a synthetic budget_cut_supported snapshot applies overrides.
  const b = createRecordBudget({ maxDistinctPerWindow: 11, windowMs: 86400000 });
  const applied = applyHerdLadder(b, { band: 'budget_cut_supported', members: ['cid:X', 'cid:Y'] }, { memberLimit: 2 });
  check('(e) applyHerdLadder applies to a budget_cut_supported snapshot', applied.applied === true && applied.identities.length === 2);
  check('(e) default export is a working app (fetch /api/map 200)', (await workerDefault.fetch(mockReq('/api/map', { ip: '203.0.113.6' }), {})).status === 200);
  check('(e) RECORD_IDS is the 12 served records', RECORD_IDS.length === 12 && RECORD_IDS[0] === 'map:grid');
}

// ---- (f): edge flag OFF = bundled + zero network calls; ON = fetch with fallback --------------
class Mem {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
}
{
  check('(f) EDGE_API_URL default is empty (disabled)', EDGE_API_URL === '');
  check('(f) edgeEnabled() is false by default', edgeEnabled() === false);
  check('(f) resolveEdgeUrl with no param returns empty', resolveEdgeUrl(new URLSearchParams('')) === '');
  check('(f) resolveEdgeUrl accepts an https ?edge param', resolveEdgeUrl(new URLSearchParams('edge=https://edge.test')) === 'https://edge.test');
  check('(f) resolveEdgeUrl rejects a non-https ?edge param', resolveEdgeUrl(new URLSearchParams('edge=http://edge.test')) === '');
  let fetchCalls = 0;
  const throwingFetch = async () => { fetchCalls++; throw new Error('must not be called'); };
  const off = await loadHanoiData({ fetchImpl: throwingFetch });
  check('(f) flag OFF loads the bundled dataset', off.source === 'bundled');
  check('(f) flag OFF makes zero network calls', fetchCalls === 0);
  check('(f) flag OFF map rows are the bundled rows', off.map.rows === HANOI_ROWS);
  check('(f) flag OFF historyInfo reads the bundled history', off.historyInfo('hoankiem').nameEN === 'Hoan Kiem Lake');
  check('(f) flag OFF historyInfo returns null for a canary id', off.historyInfo('canary-ho-guom-bac') === null);
  // Flag ON with a good mock edge.
  const edgeMap = { size: 40, rows: [...HANOI_ROWS], legend: { ...HANOI_LEGEND }, landmarks: JSON.parse(JSON.stringify(HANOI_LANDMARKS)) };
  const edgeLm = { landmarks: EDGE_LANDMARK_IDS.map((id) => ({ id, ...LANDMARK_INFO[id] })) };
  let edgeCalls = 0;
  const goodFetch = async (url) => {
    edgeCalls++;
    const body = String(url).endsWith('/api/map') ? edgeMap : edgeLm;
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
  };
  const on = await loadHanoiData({ edgeUrl: 'https://edge.test', fetchImpl: goodFetch });
  check('(f) flag ON + good edge loads the edge dataset', on.source === 'edge');
  check('(f) flag ON fetched both routes', edgeCalls === 2);
  check('(f) flag ON edge rows match the grid', JSON.stringify(on.map.rows) === JSON.stringify(HANOI_ROWS));
  check('(f) flag ON edge historyInfo reads the edge history', on.historyInfo('westlake').nameEN === 'West Lake');
  // Flag ON + failing fetch -> bundled fallback.
  const failingFetch = async () => { throw new Error('edge down'); };
  const down = await loadHanoiData({ edgeUrl: 'https://edge.test', fetchImpl: failingFetch });
  check('(f) flag ON + failing edge falls back to bundled', down.source === 'bundled' && down.map.rows === HANOI_ROWS);
  // Flag ON + bad shape -> bundled fallback.
  const badFetch = async () => ({ ok: true, status: 200, json: async () => ({ size: 40, rows: ['xx'], legend: {}, landmarks: {} }) });
  const bad = await loadHanoiData({ edgeUrl: 'https://edge.test', fetchImpl: badFetch });
  check('(f) flag ON + bad edge shape falls back to bundled', bad.source === 'bundled');
  // Flag ON + timeout -> bundled fallback.
  const neverFetch = async () => new Promise(() => {});
  const timed = await loadHanoiData({ edgeUrl: 'https://edge.test', fetchImpl: neverFetch, timeoutMs: 20 });
  check('(f) flag ON + edge timeout falls back to bundled', timed.source === 'bundled');
  check('(f) fetchEdgeJson timeout returns null', (await fetchEdgeJson('https://edge.test/api/map', { fetchImpl: neverFetch, timeoutMs: 20 })) === null);
  check('(f) fetchEdgeJson non-OK returns null', (await fetchEdgeJson('https://edge.test/api/map', { fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) })) === null);
  // createHanoi data override: identical cells with bundled data, and with a JSON copy.
  const base = createHanoi({ seed: 1 });
  const over1 = createHanoi({ seed: 1, data: { rows: HANOI_ROWS, legend: HANOI_LEGEND, landmarks: HANOI_LANDMARKS } });
  const over2 = createHanoi({ seed: 1, data: JSON.parse(JSON.stringify({ rows: HANOI_ROWS, legend: HANOI_LEGEND, landmarks: HANOI_LANDMARKS })) });
  let same1 = true; let same2 = true;
  for (let z = -20; z <= 19; z++) {
    for (let x = -20; x <= 19; x++) {
      const a = base.get(x, z); const b = over1.get(x, z); const c = over2.get(x, z);
      if (a.tileId !== b.tileId || a.landmarkId !== b.landmarkId) same1 = false;
      if (a.tileId !== c.tileId || a.landmarkId !== c.landmarkId) same2 = false;
    }
  }
  check('(f) createHanoi override with bundled data = default cells (1600)', same1);
  check('(f) createHanoi override with a JSON edge copy = default cells (1600)', same2);
  // main.js wires the flag without hardcoding a worker host.
  const main = readFileSync(join(ROOT, 'src/main.js'), 'utf8');
  check('(f) main.js loads edge data behind resolveEdgeUrl', main.includes('loadHanoiData({ edgeUrl: resolveEdgeUrl(params) })'));
  check('(f) main.js passes the map override + historyInfo into the game', main.includes('createHanoi({ seed, data: hanoiData ? hanoiData.map : null })') && main.includes('historyInfo: hanoiData ? hanoiData.historyInfo : null'));
  check('(f) main.js hardcodes no worker host', !/workers\.dev|hanoi-edge|hanoi-api/.test(main));
}

// ---- (f) continued: createLandmarks historyInfo override (compact fake DOM) ------------
function makeEl(tag = 'div') {
  const e = {
    tag, children: [], dataset: {}, style: {}, _cls: new Set(), _handlers: {}, _attrs: {},
    textContent: '',
    classList: {
      add: (...cs) => { cs.forEach((c) => e._cls.add(c)); },
      remove: (...cs) => { cs.forEach((c) => e._cls.delete(c)); },
      toggle: (c, force) => { const on = force === undefined ? !e._cls.has(c) : !!force; if (on) e._cls.add(c); else e._cls.delete(c); return on; },
      contains: (c) => e._cls.has(c),
    },
    appendChild(c) { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); e.children.push(c); return c; },
    append(...cs) { cs.forEach((c) => e.appendChild(c)); return e; },
    removeChild(c) { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); return c; },
    addEventListener(n, fn) { (e._handlers[n] = e._handlers[n] || []).push(fn); },
    removeEventListener() {},
    setAttribute(k, v) { e._attrs[k] = v; },
    getAttribute(k) { return e._attrs[k]; },
    getContext() { return new Proxy({}, { get: (t, k) => (...a) => {}, set: () => true }); },
    click() { (e._handlers.click || []).forEach((f) => f({ stopPropagation() {} })); },
  };
  Object.defineProperty(e, 'firstChild', { get() { return e.children[0] || null; } });
  e.width = 160; e.height = 160;
  return e;
}
const DOM_IDS = ['lm-list', 'lm-items', 'lm-count', 'lm-toast', 'lm-map', 'lm-info', 'lm-info-head', 'lm-info-x',
  'lm-info-title', 'lm-info-summary', 'lm-info-fun-h', 'lm-info-fun-short', 'lm-info-more', 'lm-info-details',
  'lm-info-hist-h', 'lm-info-hist', 'lm-info-fun-full-h', 'lm-info-fun-full', 'lm-info-tabs',
  'lm-info-lang', 'lm-info-lang-vi', 'lm-info-lang-en', 'lm-bang', 'atlas',
  'lm-info-src', 'lm-info-body',
  'lm-title', 'lm-privacy', 'hint', 'lm-lang', 'lm-lang-vi', 'lm-lang-en', 'lm-head', 'lm-caret'];
function freshDom() {
  const ids = {};
  for (const id of DOM_IDS) ids[id] = makeEl();
  globalThis.document = {
    getElementById: (id) => ids[id] || null,
    createElement: (tag) => makeEl(tag),
    createTextNode: (t) => ({ textContent: t, nodeType: 3 }),
    body: makeEl('body'),
    hidden: false,
    addEventListener() {}, removeEventListener() {},
  };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  return ids;
}
{
  const ids = freshDom();
  const edgeHistory = (id) => {
    if (id === 'hoankiem') {
      return { nameEN: 'EDGE NAME', nameVI: 'EDGE TEN', histEN: ['edge line'], histVI: ['edge dong'], funEN: 'edge fun', funVI: 'edge vui', source: 'https://example.com/edge' };
    }
    return landmarkInfo(id);
  };
  const lm = createLandmarks({
    traveller: { position: { x: 0, y: 0, z: 0 }, moveDir: { x: 0, z: -1 } },
    progress: { eachCell() {} },
    wfc: { get: () => null },
    seed: 1, persist: false, game: { armed: true },
    storage: new Mem(), fetchImpl: null, navigatorLanguage: '',
    historyInfo: edgeHistory,
  });
  check('(f) historyInfo override: list still has 11 real ids, zero canary', lm.list().length === 11 && lm.list().every((d) => !d.id.startsWith('canary-')));
  lm.debugDiscover('hoankiem');
  check('(f) historyInfo override: discovery does NOT open the card', !ids['lm-info'].classList.contains('show') && lm.infoOpen() === null);
  lm.openInfo('hoankiem');
  check('(f) historyInfo override: info card shows the EDGE name, not bundled', ids['lm-info-title'].textContent === 'EDGE TEN');
  check('(f) historyInfo override: info card opens', ids['lm-info'].classList.contains('show'));
  check('(f) historyInfo override: summary falls back to the first EDGE history line', ids['lm-info-summary'].textContent === 'edge dong');
  check('(f) historyInfo override: short fun fact falls back to the full EDGE fun fact', ids['lm-info-fun-short'].textContent === 'edge vui');
  ids['lm-info-more'].click();
  check('(f) historyInfo override: info card shows the EDGE history line', ids['lm-info-hist'].children[0].textContent === 'edge dong');
  check('(f) historyInfo override: source label uses the EDGE host', ids['lm-info-src'].textContent === 'Nguon: example.com');
  lm.settle();
  lm.dispose();
  // Without the override the bundled name shows (regression guard for the default path).
  const ids2 = freshDom();
  const lm2 = createLandmarks({
    traveller: { position: { x: 0, y: 0, z: 0 }, moveDir: { x: 0, z: -1 } },
    progress: { eachCell() {} },
    wfc: { get: () => null },
    seed: 1, persist: false, game: { armed: true },
    storage: new Mem(), fetchImpl: null, navigatorLanguage: '',
  });
  lm2.debugDiscover('hoankiem');
  check('(f) no override: discovery does NOT open the card', !ids2['lm-info'].classList.contains('show') && lm2.infoOpen() === null);
  lm2.openInfo('hoankiem');
  check('(f) no override: info card shows the bundled name', ids2['lm-info-title'].textContent === 'Ho Hoan Kiem');
  lm2.settle();
  lm2.dispose();
}

// ---- (g): zero secrets in the new / changed files --------------------------------------
{
  const files = [
    'src/game/canary.js', 'src/core/config/edge.js',
    'src/game/landmark-history.js', 'src/world/hanoi-map.js', 'src/world/hanoi.js',
    'src/game/landmarks.js', 'src/main.js',
    'workers/hanoi-edge/src/index.js', 'workers/hanoi-edge/wrangler.toml',
    'workers/hanoi-edge/README.md', 'workers/hanoi-edge/package.json',
    'data/provenance.json', 'docs/antirea-declaration.md', 'tools/check-2d.mjs',
  ];
  // (g1) Hard-secret shapes: an assigned API key / password / auth-header
  // value / a literal watermark key. Step-up tokens are NOT in this
  // list: they are random per-session values made by randomHex at runtime,
  // never stored, never a credential.
  // Built from parts so the pattern text itself never contains a literal
  // token shape (the scan would otherwise flag its own source).
  const hardPat = new RegExp("api[_-]?key\\s*[:=]\\s*['\"][^'\"]+['\"]|password\\s*[:=]\\s*['\"]|bearer\\s+[A-Za-z0-9]|" + "sk-" + "[A-Za-z0-9]{8,}|ANTIREA_WATERMARK_KEY\\s*=\\s*['\"]");
  const hardHits = [];
  for (const rel of files) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    for (const line of text.split('\n')) {
      if (hardPat.test(line)) hardHits.push(rel + ': ' + line.trim().slice(0, 80));
    }
  }
  if (hardHits.length > 0) console.log('hard-secret hits: ' + hardHits.join(' | '));
  check('(g) zero assigned keys / passwords / auth-header values', hardHits.length === 0);
  // (g2) The word "secret" may only appear as an env-var NAME, the `wrangler
  // secret put` CLI command, or a comment saying never to put secrets in the
  // repo. (The test file itself is excluded: it talks about secrets in order
  // to scan for them.)
  const allowed = (line) => /ANTIREA_WATERMARK_KEY/.test(line)
    || /wrangler secret put/.test(line)
    || /never (in|put|commit)|no secret|do not.*secret/i.test(line)
    || /secret is set|secret \(via|the secret|watermark secret/i.test(line);
  const wordHits = [];
  for (const rel of files) {
    if (rel === 'tools/check-2d.mjs') continue;
    const text = readFileSync(join(ROOT, rel), 'utf8');
    for (const line of text.split('\n')) {
      if (/secret/i.test(line) && !allowed(line)) wordHits.push(rel + ': ' + line.trim().slice(0, 80));
    }
  }
  if (wordHits.length > 0) console.log('secret-word hits: ' + wordHits.join(' | '));
  check('(g) the word secret appears only as an env name / CLI command / never-put note', wordHits.length === 0);
  const workerText = readFileSync(join(ROOT, 'workers/hanoi-edge/src/index.js'), 'utf8');
  check('(g) worker reads the watermark key from env only, never a literal', workerText.includes('env.ANTIREA_WATERMARK_KEY') && !/ANTIREA_WATERMARK_KEY\s*=\s*['"]/.test(workerText));
  check('(g) no token-shaped / auth-header literal in the worker', !(new RegExp('sk-' + '[A-Za-z0-9]{8,}|Bearer [A-Za-z0-9]')).test(workerText));
}

// ---- long dashes in all changed / added files ------------------------------------------
{
  const changed = [
    'src/game/canary.js', 'src/core/config/edge.js',
    'src/game/landmark-history.js', 'src/world/hanoi-map.js', 'src/world/hanoi.js',
    'src/game/landmarks.js', 'src/main.js',
    'workers/hanoi-edge/src/index.js', 'workers/hanoi-edge/wrangler.toml',
    'workers/hanoi-edge/README.md', 'workers/hanoi-edge/package.json',
    'data/provenance.json', 'docs/antirea-declaration.md', 'tools/check-2d.mjs',
  ];
  try { statSync(join(ROOT, 'docs/phase-2d-manifest.md')); changed.push('docs/phase-2d-manifest.md'); } catch { /* manifest written after the first run */ }
  const bad = [];
  for (const rel of changed) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    if (/[\u2013\u2014]/.test(text)) bad.push(rel);
  }
  check('zero long dashes in changed files', bad.length === 0);
}

// ---- summary ---------------------------------------------------------------------
console.log('check-2d: ' + pass + ' PASS, ' + fail + ' FAIL');
if (fail > 0) {
  console.log('failures: ' + failures.join(' | '));
  process.exit(1);
} else {
  console.log('ALL 2D CHECKS PASSED');
}
