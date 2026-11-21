// Phase 2C checks (node tools/check-2c.mjs). No browser, no network: fetch is mocked.
// Covers: (a) VN -> VI, (b) US -> EN, (c) timeout -> navigator fallback, (d) failure /
// 429 -> VI default, (e) stored hanoi:lang overrides detection, (f) fetch at most once
// per session, (g) i18n dict complete in both languages + all VI strings diacritic-free,
// (h) no banned geo host in src/ + index.html. Plus: boot never awaits the lookup,
// fake-DOM checklist / toast / info-card re-render on toggle + detection, long dashes.
// No long dashes in this file: only short hyphens (-).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LANG_KEY, COUNTRY_KEY, COUNTRY_URL, DETECT_TIMEOUT_MS, STRINGS,
  isLang, langFromCountry, langFromNavigator, resolveLang, format,
  detectCountry, createLanguage,
} from '../src/game/i18n.js';
import { createLandmarks, LANDMARKS } from '../src/game/landmarks.js';
import { LANDMARK_INFO } from '../src/game/landmark-history.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond) {
  if (cond) { pass++; }
  else { fail++; failures.push(name); console.log('FAIL: ' + name); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isAscii = (s) => /^[\x00-\x7F]*$/.test(s);

// ---- fake storage + mock fetch -------------------------------------------------
class Mem {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
}
function mockFetch(kind, code = 'VN') {
  let calls = 0;
  const fn = async (url, opts) => {
    calls++;
    if (kind === 'country') return { ok: true, status: 200, json: async () => ({ country: code, ip: '1.2.3.4' }) };
    if (kind === 'never') return new Promise(() => {});
    if (kind === 'fail') throw new Error('network down');
    if (kind === '429') return { ok: false, status: 429, json: async () => ({}) };
    if (kind === 'nocountry') return { ok: true, status: 200, json: async () => ({ ip: '1.2.3.4' }) };
    throw new Error('unknown mock kind');
  };
  fn.calls = () => calls;
  return fn;
}

// ---- (a) - (f): detection logic ----------------------------------------------
check('country.is URL is HTTPS', COUNTRY_URL === 'https://country.is/');
check('detect timeout is 800 ms', DETECT_TIMEOUT_MS === 800);
check('langFromCountry VN -> vi', langFromCountry('VN') === 'vi');
check('langFromCountry vn lowercase -> vi', langFromCountry('vn') === 'vi');
check('langFromCountry US -> en', langFromCountry('US') === 'en');
check('langFromCountry empty -> null', langFromCountry('') === null);
check('langFromNavigator vi-VN -> vi', langFromNavigator('vi-VN') === 'vi');
check('langFromNavigator en-US -> en', langFromNavigator('en-US') === 'en');
check('langFromNavigator empty -> null', langFromNavigator('') === null);
check('resolveLang stored wins over country', resolveLang({ stored: 'en', country: 'VN' }) === 'en');
check('resolveLang country beats navigator', resolveLang({ country: 'VN', navLang: 'en-US' }) === 'vi');
check('resolveLang navigator beats default', resolveLang({ navLang: 'en-US' }) === 'en');
check('resolveLang empty -> vi default', resolveLang({}) === 'vi');
check('isLang rejects junk', !isLang('fr') && !isLang('') && !isLang(null));
check('format fills placeholders', format('Da kham pha: {name}', { name: 'Ho Tay' }) === 'Da kham pha: Ho Tay');

// (a) country VN -> VI, fetch used once
{
  const store = new Mem();
  const fetch = mockFetch('country', 'VN');
  const lang = createLanguage({ storage: store, navigatorLanguage: 'en-US', fetchImpl: fetch });
  check('(a) initial render is VI fallback before lookup', lang.lang === 'vi');
  await lang.detect();
  check('(a) VN -> VI after lookup', lang.lang === 'vi');
  check('(a) fetch called once', fetch.calls() === 1);
  check('(a) country cached', store.getItem(COUNTRY_KEY) === 'VN');
  check('(a) detected lang cached', store.getItem(LANG_KEY) === 'vi');
}
// (b) country US -> EN, live switch from the VI fallback
{
  const store = new Mem();
  const fetch = mockFetch('country', 'US');
  let switched = null;
  const lang = createLanguage({ storage: store, navigatorLanguage: 'en-US', fetchImpl: fetch, onChange: (l) => { switched = l; } });
  await lang.detect();
  check('(b) US -> EN after lookup', lang.lang === 'en');
  check('(b) onChange fired with en', switched === 'en');
  check('(b) t() returns English strings', lang.t('discovered', { name: 'Ho Tay' }) === 'Discovered: Ho Tay');
}
// (c) fetch timeout -> navigator.language fallback
{
  const fetch = mockFetch('never');
  const storeVi = new Mem();
  const langVi = createLanguage({ storage: storeVi, navigatorLanguage: 'vi-VN', fetchImpl: fetch, timeoutMs: 20 });
  await langVi.detect();
  check('(c) timeout + nav vi -> VI', langVi.lang === 'vi');
  check('(c) timeout fetch still called once', fetch.calls() === 1);
  const fetch2 = mockFetch('never');
  const langEn = createLanguage({ storage: new Mem(), navigatorLanguage: 'en-US', fetchImpl: fetch2, timeoutMs: 20 });
  await langEn.detect();
  check('(c) timeout + nav en -> EN', langEn.lang === 'en');
  check('(c) timeout stores no country', storeVi.getItem(COUNTRY_KEY) === null);
  check('(c) timeout stores no lang', storeVi.getItem(LANG_KEY) === null);
  check('(c) detectCountry timeout -> null', (await detectCountry({ fetchImpl: mockFetch('never'), timeoutMs: 20 })) === null);
}
// (d) fetch failure / 429 -> VI default (no navigator language)
{
  const langFail = createLanguage({ storage: new Mem(), navigatorLanguage: '', fetchImpl: mockFetch('fail') });
  await langFail.detect();
  check('(d) fetch throw + no nav -> VI default', langFail.lang === 'vi');
  const lang429 = createLanguage({ storage: new Mem(), navigatorLanguage: '', fetchImpl: mockFetch('429') });
  await lang429.detect();
  check('(d) 429 + no nav -> VI default', lang429.lang === 'vi');
  check('(d) detectCountry 429 -> null', (await detectCountry({ fetchImpl: mockFetch('429') })) === null);
  check('(d) detectCountry missing country field -> null', (await detectCountry({ fetchImpl: mockFetch('nocountry') })) === null);
  check('(d) detectCountry no fetch -> null', (await detectCountry({ fetchImpl: null })) === null);
  const langNav = createLanguage({ storage: new Mem(), navigatorLanguage: 'en-US', fetchImpl: mockFetch('fail') });
  await langNav.detect();
  check('(d) fetch throw + nav en -> EN (navigator fallback)', langNav.lang === 'en');
}
// (e) stored hanoi:lang overrides detection in both directions, no fetch
{
  const storeEn = new Mem();
  storeEn.setItem(LANG_KEY, 'en');
  const fetchUS = mockFetch('country', 'VN');
  const langEn = createLanguage({ storage: storeEn, navigatorLanguage: 'vi-VN', fetchImpl: fetchUS });
  check('(e) stored en + VN country -> stays en', langEn.lang === 'en');
  await langEn.detect();
  check('(e) stored en: no fetch on detect', fetchUS.calls() === 0);
  const storeVi = new Mem();
  storeVi.setItem(LANG_KEY, 'vi');
  const fetchVN = mockFetch('country', 'US');
  const langVi = createLanguage({ storage: storeVi, navigatorLanguage: 'en-US', fetchImpl: fetchVN });
  check('(e) stored vi + US country -> stays vi', langVi.lang === 'vi');
  await langVi.detect();
  check('(e) stored vi: no fetch on detect', fetchVN.calls() === 0);
  // Cached country also skips the fetch.
  const storeC = new Mem();
  storeC.setItem(COUNTRY_KEY, 'US');
  const fetchC = mockFetch('country', 'VN');
  const langC = createLanguage({ storage: storeC, navigatorLanguage: 'vi-VN', fetchImpl: fetchC });
  check('(e) cached country US -> en with no fetch', langC.lang === 'en');
  await langC.detect();
  check('(e) cached country: no fetch on detect', fetchC.calls() === 0);
}
// (f) fetch called at most once per session
{
  const fetch = mockFetch('country', 'US');
  const lang = createLanguage({ storage: new Mem(), navigatorLanguage: 'en-US', fetchImpl: fetch });
  const p1 = lang.detect();
  const p2 = lang.detect();
  const p3 = lang.detect();
  await Promise.all([p1, p2, p3]);
  check('(f) three detect() calls -> one fetch', fetch.calls() === 1);
  await lang.detect();
  check('(f) later detect() still one fetch', fetch.calls() === 1);
}
// Manual toggle persists and overrides detection
{
  const store = new Mem();
  const lang = createLanguage({ storage: store, navigatorLanguage: 'en-US', fetchImpl: mockFetch('country', 'VN') });
  lang.toggle();
  check('toggle VI -> EN and persists', lang.lang === 'en' && store.getItem(LANG_KEY) === 'en');
  lang.toggle();
  check('toggle EN -> VI and persists', lang.lang === 'vi' && store.getItem(LANG_KEY) === 'vi');
  check('setLang rejects junk', lang.setLang('fr') === false && lang.lang === 'vi');
}

// ---- (g): dict completeness + diacritic-free VI --------------------------------
{
  const viKeys = Object.keys(STRINGS.vi).sort();
  const enKeys = Object.keys(STRINGS.en).sort();
  check('(g) dict keys match vi/en', JSON.stringify(viKeys) === JSON.stringify(enKeys));
  check('(g) dict has all UI keys', ['checklistTitle', 'privacy', 'discovered', 'histHeading', 'funHeading', 'sourceLabel', 'hint', 'toggleLabel', 'closeLabel'].every((k) => viKeys.includes(k)));
  check('(g) every VI dict string is ASCII (diacritic-free)', Object.values(STRINGS.vi).every((s) => isAscii(s)));
  check('(g) every VI dict string is non-empty', Object.values(STRINGS.vi).every((s) => s.length > 0));
  check('(g) every EN dict string is non-empty', Object.values(STRINGS.en).every((s) => s.length > 0));
  check('(g) VI discovered string has {name}', STRINGS.vi.discovered.includes('{name}'));
  check('(g) privacy line mentions IP in both languages', STRINGS.vi.privacy.includes('IP') && STRINGS.en.privacy.includes('IP'));
}
{
  check('(g) all landmark VI names diacritic-free', LANDMARKS.every((d) => isAscii(d.nameVI)));
  const histBad = [];
  for (const [id, info] of Object.entries(LANDMARK_INFO)) {
    if (!isAscii(info.nameVI)) histBad.push(id + ':nameVI');
    for (const line of info.histVI) if (!isAscii(line)) histBad.push(id + ':histVI');
    if (!isAscii(info.funVI)) histBad.push(id + ':funVI');
  }
  check('(g) all history VI strings diacritic-free', histBad.length === 0);
}

// ---- (h): banned geo hosts nowhere in src/ + index.html --------------------------
function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}
{
  const files = [...listFiles(join(ROOT, 'src')), join(ROOT, 'index.html')];
  const banned = ['ip-api.com', 'ipwho.is', 'ipapi.co'];
  const hits = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const b of banned) if (text.includes(b)) hits.push(f + ' contains ' + b);
  }
  check('(h) no banned geo host in src/ + index.html', hits.length === 0);
  const i18n = readFileSync(join(ROOT, 'src/game/i18n.js'), 'utf8');
  check('(h) no API key in i18n module', !/api[_-]?key/i.test(i18n.replace(/No API key anywhere/g, '')));
}

// ---- long dashes in the changed files -------------------------------------------
{
  const changed = ['src/game/i18n.js', 'src/game/landmarks.js', 'index.html', 'tools/check-2c.mjs'];
  const manifest = join(ROOT, 'docs/phase-2c-manifest.md');
  try { statSync(manifest); changed.push('docs/phase-2c-manifest.md'); } catch { /* manifest written after the first run */ }
  const bad = [];
  for (const rel of changed) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    if (/[\u2013\u2014]/.test(text)) bad.push(rel);
  }
  check('zero long dashes in changed files', bad.length === 0);
}

// ---- boot never awaits the lookup ------------------------------------------------
{
  const main = readFileSync(join(ROOT, 'src/main.js'), 'utf8');
  check('boot: main.js never mentions detection', !/detect|country\.is|i18n|hanoi:lang/.test(main));
  const lm = readFileSync(join(ROOT, 'src/game/landmarks.js'), 'utf8');
  check('boot: landmarks.js has no await at all', !/\bawait\b/.test(lm));
  const detectLine = lm.split('\n').find((l) => l.includes('.detect()'));
  check('boot: detect() call is fire-and-forget (no await on its line)', !!detectLine && !detectLine.includes('await'));
  const gameIndex = readFileSync(join(ROOT, 'src/game/index.js'), 'utf8');
  check('boot: game/index.js has no await', !/\bawait\b/.test(gameIndex));
}

// ---- fake-DOM: checklist / toast / info card re-render ---------------------------
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
  'lm-info-title-vi', 'lm-info-title-en', 'lm-info-hist-vi', 'lm-info-hist-en', 'lm-info-fun-vi', 'lm-info-fun-en',
  'lm-info-src', 'lm-info-body', 'lm-info-hist-h-vi', 'lm-info-hist-h-en', 'lm-info-fun-h-vi', 'lm-info-fun-h-en',
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
function gameCtx({ store, fetch, nav }) {
  return {
    traveller: { position: { x: 0, y: 0, z: 0 }, moveDir: { x: 0, z: -1 } },
    progress: { eachCell() {} },
    wfc: { get: () => null },
    seed: 1, persist: false, game: { armed: true },
    storage: store, fetchImpl: fetch, navigatorLanguage: nav,
  };
}
function firstItem(ids) {
  const li = ids['lm-items'].children[0];
  const tx = li.children[1];
  return { main: tx.children[0].textContent, other: tx.children[1].textContent };
}
{
  // Toggle path: pending fetch (never resolves) so detection cannot interfere.
  const ids = freshDom();
  const store = new Mem();
  const lm = createLandmarks(gameCtx({ store, fetch: mockFetch('never'), nav: 'en-US' }));
  check('dom: initial render is VI fallback', lm.lang() === 'vi');
  check('dom: checklist first item VI first', firstItem(ids).main === 'Ho Hoan Kiem ' && firstItem(ids).other === 'Hoan Kiem Lake');
  check('dom: privacy line is VI', ids['lm-privacy'].textContent.startsWith('Ngon ngu doan theo IP'));
  check('dom: hint is VI', ids.hint.textContent.startsWith('WASD / bam de di'));
  check('dom: toggle VI marked on', ids['lm-lang-vi'].classList.contains('on') && !ids['lm-lang-en'].classList.contains('on'));
  ids['lm-lang'].click();
  check('dom: toggle click switches to EN + persists', lm.lang() === 'en' && store.getItem(LANG_KEY) === 'en');
  check('dom: checklist first item EN first after toggle', firstItem(ids).main === 'Hoan Kiem Lake ' && firstItem(ids).other === 'Ho Hoan Kiem');
  check('dom: privacy line is EN after toggle', ids['lm-privacy'].textContent.startsWith('Language guessed'));
  check('dom: toggle EN marked on after toggle', ids['lm-lang-en'].classList.contains('on') && !ids['lm-lang-vi'].classList.contains('on'));
  lm.debugDiscover('hoankiem');
  check('dom: toast is EN after discovery', ids['lm-toast'].children[0].textContent === 'Discovered: Hoan Kiem Lake');
  check('dom: toast sub is the VI name', ids['lm-toast'].children[1].textContent === 'Ho Hoan Kiem');
  check('dom: info card opens on discovery', ids['lm-info'].classList.contains('show'));
  check('dom: info title EN first', ids['lm-info-title-vi'].textContent === 'Hoan Kiem Lake' && ids['lm-info-title-en'].textContent === 'Ho Hoan Kiem');
  check('dom: info first section is EN History', ids['lm-info-body'].children[0].textContent === 'History');
  check('dom: info source label is EN', ids['lm-info-src'].textContent.startsWith('Source: '));
  ids['lm-lang'].click();
  check('dom: toggle back to VI re-words the open toast', ids['lm-toast'].children[0].textContent === 'Da kham pha: Ho Hoan Kiem');
  check('dom: toggle back to VI re-orders the open info card', ids['lm-info-body'].children[0].textContent === 'Lich su');
  check('dom: info title VI first after toggle back', ids['lm-info-title-vi'].textContent === 'Ho Hoan Kiem');
  check('dom: info source label is VI after toggle back', ids['lm-info-src'].textContent.startsWith('Nguon: '));
  lm.settle();
  lm.dispose();
}
{
  // Detection path: US lookup switches the live UI from the VI fallback.
  const ids = freshDom();
  const store = new Mem();
  const fetch = mockFetch('country', 'US');
  const lm = createLandmarks(gameCtx({ store, fetch, nav: 'vi-VN' }));
  check('dom: detection instance starts VI', lm.lang() === 'vi');
  await sleep(30);
  check('dom: US lookup switches UI to EN', lm.lang() === 'en');
  check('dom: detection re-rendered checklist to EN first', firstItem(ids).main === 'Hoan Kiem Lake ');
  check('dom: detection stored country + lang', store.getItem(COUNTRY_KEY) === 'US' && store.getItem(LANG_KEY) === 'en');
  check('dom: detection fetch ran once', fetch.calls() === 1);
  lm.dispose();
}
{
  // Stored manual choice beats detection, with zero fetch.
  const ids = freshDom();
  const store = new Mem();
  store.setItem(LANG_KEY, 'vi');
  const fetch = mockFetch('country', 'US');
  const lm = createLandmarks(gameCtx({ store, fetch, nav: 'en-US' }));
  await sleep(30);
  check('dom: stored vi beats US lookup', lm.lang() === 'vi');
  check('dom: stored choice means zero fetch', fetch.calls() === 0);
  check('dom: stored vi keeps checklist VI first', firstItem(ids).main === 'Ho Hoan Kiem ');
  lm.dispose();
}

// ---- summary ---------------------------------------------------------------------
console.log('check-2c: ' + pass + ' PASS, ' + fail + ' FAIL');
if (fail > 0) {
  console.log('failures: ' + failures.join(' | '));
  process.exit(1);
} else {
  console.log('ALL 2C CHECKS PASSED');
}
