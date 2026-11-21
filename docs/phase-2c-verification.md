# Phase 2C verification - IP language detection VI/EN (independent verifier)

Date: 2026-11-21. Verifier work only: no source file edited, nothing committed, nothing pushed.
Working tree: local git HEAD 4ec66a3, steps 5-7 + 2A + 2B + 2C content all uncommitted on top.
All checks below are fresh scripts written for this verification in /tmp/2c-verify/
(dict.mjs, detect.mjs, dom.mjs), plus commands run directly. The fixer's own
tools/check-2c.mjs was read for format and run only as a cross-check at the end;
no verdict below rests on it. One gap in the fixer's test is closed here: its
"(c) timeout stores no country" check asserts literal `true`, so it can never fail.
My detect.mjs asserts storage is really empty after timeout / throw / 429 / 500 /
missing-field / wrong-field / bad-JSON (57 checks, all pass).

## Verdicts (one line each, detail below)

- 1. Detection logic + priority + timeout + once-per-session - PASS
- 2. Boot never blocks - PASS
- 3. Toggle: element, gating, position, styling, persist, override, full re-render - PASS
- 4. Info card ordering live - PASS
- 5. Privacy line - PASS with nit (wording exact, both languages; wraps to 2-3 visual lines)
- 6. i18n dict: 9 keys, identical, ASCII, no long dashes - PASS
- 7. Build + regression suites + bundle markers - PASS
- 8. CSS incident (2B info-card comment) - PASS (comment intact, build green)
- 9. Collapsed-card re-open on language switch - NIT (real, small, not blocking)
- 10. 2A/2B regression scope + GLB sizes - PASS
- 11. Banned hosts / API keys - PASS
- 12. Impeccable detect - UNVERIFIED (tool hangs, fourth consecutive time)
- 13. Live browser: real country.is call, real tap, 390px layout - UNVERIFIED

## 1. Detection logic - PASS

- Read src/game/i18n.js in full (264 lines). COUNTRY_URL is exactly
  'https://country.is/', DETECT_TIMEOUT_MS is 800, DEFAULT_LANG is 'vi'.
- Priority order is exactly as claimed. Initial language:
  resolveLang({stored, country: cachedCountry, navLang: ''}) gives stored lang >
  cached country > VI, and the extra line forces VI when neither stored nor cached
  country decides it, so navigator.language is never used for the first paint.
  detect(): stored hanoi:lang short-circuit -> cached hanoi:country short-circuit
  -> fetch -> navigator.language -> VI. Verified by code read and by 57 harness
  checks in /tmp/2c-verify/detect.mjs (57 PASS, 0 FAIL).
- Timeout mechanism is real AbortController + Promise.race as claimed: the timer
  aborts the controller and resolves null; my harness proves the signal is
  actually aborted (signal.aborted === true after a never-resolving fetch) and the
  call returns in ~25 ms with a 25 ms test timeout instead of hanging.
- Country field read is data.country (trimmed, upper-cased). A response with only
  country_code, or with no country field, or with bad JSON, returns null and falls
  back. Lowercase 'vn' and ' VN ' with spaces still resolve to VI and cache 'VN'.
- Failure paths store nothing (asserted for real, not with a tautology):
  timeout, fetch throw, HTTP 429, HTTP 500, missing country field, wrong field,
  bad JSON all leave storage with zero keys, and the language falls back to
  navigator.language (vi -> VI, en -> EN) then VI.
- Results: VN -> VI (fetch 1, country 'VN' + lang 'vi' cached), US -> EN
  (onChange fired with 'en'), JP -> EN (non-VN country is EN, as specified).
- Once-per-session guard: `started` is a closure flag inside createLanguage;
  three concurrent detect() calls plus a later call produce exactly one fetch
  (fetchCalls === 1). One wording correction: the manifest calls it a
  "module-level started flag" but it is per-instance, not module-level. In the
  real app this does not matter: createLandmarks is called exactly once per page
  load (src/game/index.js:30, synchronous), and after a successful detection the
  stored hanoi:lang short-circuits any later instance anyway. Only after a
  failed detection would a hypothetical second instance re-fetch, and no code
  path creates a second instance. Recorded here so the manifest wording can be
  fixed; not a code fail.
- Manual toggle persists both ways (vi -> en writes hanoi:lang 'en', back writes
  'vi'); setLang('fr') and setLang('') return false and change nothing.

## 2. Boot never blocks - PASS

- Grep: src/main.js contains zero matches for detect / country.is / i18n /
  hanoi:lang. src/game/index.js contains zero matches for those terms and zero
  `await` at all (createLandmarks is called synchronously at index.js:30).
- src/game/landmarks.js contains zero `await` (the only match is a comment).
  The detect() call line has no await: `lang.detect();` fire-and-forget after
  the first paint. The awaits in main.js (loadAssets, animals.ready) are
  pre-existing and unrelated to detection.
- First paint is VI: renderList() + drawMinimap() + renderAllStrings() run
  before lang.detect(), and createLanguage initialises to the stored choice,
  else the cached country, else VI. My fake-DOM harness (dom.mjs) confirms the
  instance starts in VI even with navigatorLanguage 'en-US' and a pending
  fetch, and the checklist / privacy / hint render in VI before any lookup
  returns. A US lookup then switches the live UI to EN (see check 3 / section D).

## 3. Toggle - PASS

- Element: index.html:136 is a real button #lm-lang, type button, with spans
  #lm-lang-vi (VI), .lm-sep (|), #lm-lang-en (EN). Wiring in landmarks.js:
  click -> lang.toggle().
- Gating: CSS `#lm-lang, #lm-privacy { display: none; }` and
  `body.hanoi #lm-lang { display: block; ... }`, exactly like #lm-list /
  #lm-toast / #lm-map. body.hanoi is added only by createLandmarks, which the
  WFC path never creates, so the toggle cannot show in the WFC world.
- Position + styling: fixed, top 12px, right 12px, z-index 5, cream
  rgba(239, 224, 194, 0.94), ink #5a3a28, 1px border, radius 3px, Georgia
  serif 600 12px, same shadow as the checklist. Active side gets class `on`
  (terracotta #b9603f + underline). Matches the manifest claim exactly.
- Persist + override: toggle() calls setLang(next, {manual: true}), which
  writes hanoi:lang. On next load a stored lang short-circuits detect() with
  zero fetch (harness cases E and 9: stored vi beats a US lookup, stored en
  beats a VN lookup, 0 fetch calls in both directions).
- Full re-render: renderAllStrings() updates, traced in code and proven by the
  fake-DOM harness (dom.mjs, 46 PASS): checklist title (HANOI), counter
  (language-neutral, unchanged), all 10 checklist names (active plain first,
  other italic second), privacy line, hint bar, toggle aria-label + on classes,
  info-card X aria-label, the open toast (re-worded, timer kept), and the open
  info card (re-ordered, source label re-worded). No visible string was found
  that it misses. The minimap has no strings; the toast when not showing keeps
  lastToastDef and is worded in the current language when next shown.

## 4. Info card ordering - PASS

- showInfo() fills both languages, sets headings from the STRINGS dict in each
  language's own wording ("Lich su" stays "Lich su", "History" stays
  "History"), then appends the sections active-first (hist, fun, then the other
  language's hist, fun, then the source link last). Harness proves: in VI the
  body starts with "Lich su", in EN it starts with "History"; both languages
  stay present after every switch; titles swap big/italic with the active
  language first.
- Already-open card: renderAllStrings() calls showInfo(infoOpen) on every
  language change, so an open card re-orders live with no extra tap. Harness
  section B proves the re-order and the source-label re-wording on an open
  card in both directions.

## 5. Privacy line - PASS with nit

- Exists in the checklist footer (index.html:134, #lm-privacy inside #lm-list),
  Hanoi-gated by CSS, and renderAllStrings() re-words it from lang.t('privacy').
- Wording matches the manifest exactly in both languages (dict.mjs + DOM
  harness): VI "Ngon ngu doan theo IP (chi ma quoc gia, khong luu gi tren may
  chu)." and EN "Language guessed from your IP (country code only, nothing
  stored on a server)."
- Nit, "one line": the string is one text node in one div, but it cannot be one
  visual line in this card. The checklist is 200px wide with 10px padding each
  side (178px content) at 10px font, and there is no white-space:nowrap rule
  anywhere in index.html. VI is 67 chars (~335px at ~5px/char), EN is 78 chars
  (~390px), so it wraps to 2 lines in VI and 2-3 lines in EN even at a
  generous 4.5px/char estimate (302px / 351px, still over 178px). The content
  is a single short statement as the plan intended, so this is cosmetic, but
  the manifest's "one line" does not hold visually. Shortening the sentence or
  widening the card would be needed for a literal single line.

## 6. i18n dict - PASS

- My own dict.mjs imports the real STRINGS: 9 keys per language, identical
  sets (checklistTitle, closeLabel, discovered, funHeading, hint, histHeading,
  privacy, sourceLabel, toggleLabel). Every VI string is pure ASCII (zero
  diacritics), every EN string is pure ASCII and non-empty, zero long dashes
  in any dict string. No new dependencies (package.json is not modified at
  all), no API key (grep for api key / Authorization / Bearer in i18n.js and
  landmarks.js: 0 hits).

## 7. Build + regressions - PASS

- Ran myself: node --check 3/3 (i18n.js, landmarks.js, check-2c.mjs).
- npm run build: PASS, dist/assets/index-DuIsU17G.js, 1,100.85 kB (gzip
  332.82 kB), built in 808 ms. Bundle hash and size match the fixer claim
  exactly. Bundle markers counted in the built file: country.is x1,
  hanoi:lang x2, hanoi:country x2, exactly as claimed.
- npm run check:hanoi: ALL CHECKS PASSED, 161 PASS lines counted (matches claim).
- node tools/check-2b.mjs: ALL 2B CHECKS PASSED, 334 PASS lines counted.
- node tools/check-basic.mjs: ALL BASIC CHECKS PASSED, 64 PASS lines counted.
- Cross-check only: node tools/check-2c.mjs: 88 PASS, 0 FAIL (matches claim).
  Note the one vacuous check inside it (section above); my own 57 + 46 + 17
  checks cover the same ground with real assertions.

## 8. CSS incident - PASS

- The Phase 2B info-card comment block is intact in index.html:92
  ("/* Landmark info card (Phase 2B, Hanoi mode only): ... */" with its full
  body), and the 2C toggle comment at index.html:76 is intact too. The build
  passes through vite's CSS minifier, which is the failure the incident
  caused, so no trace of the incident remains in the working tree.

## 9. Collapsed-card re-open - NIT (real, small, not blocking)

- Confirmed real by the fake-DOM harness (section C): open the card, collapse
  it with a header click (collapsed class present), then click the language
  toggle. After the toggle the collapsed class is gone: the card body is open
  again. Cause: renderAllStrings() calls showInfo(infoOpen) on every language
  change, and showInfo() unconditionally runs
  infoEl.classList.remove('collapsed'). The same re-open also happens when a
  pending detection resolves to a different language while the card is
  collapsed. Exact user-visible symptom: a user who collapsed the info card
  to a header, then taps VI | EN (or whose IP lookup lands a moment later),
  sees the card body expand again without tapping it. Content stays correct;
  one header tap re-collapses it. Judged a nit, not a FAIL: nothing breaks,
  no string is wrong, and the fix is one line (skip the remove('collapsed')
  when re-rendering for a language change, or preserve the class across
  showInfo). Pre-existing shape: 2B's showInfo always removed 'collapsed' on
  open; 2C added a new path that calls it.

## 10. 2A/2B regression scope - PASS

- 2C markers (createLanguage, hanoi:lang, from './i18n') appear only in
  src/game/landmarks.js, src/game/i18n.js and tools/check-2c.mjs. No 2A/2B
  file carries a 2C change: main.js and index.js contain zero mentions of
  detection / i18n / country / hanoi:lang, and the full check suites pass
  (check:hanoi 161, check-2b 334, check-basic 64). Git status shows the same
  working tree the 2B verification recorded plus the 2C additions (i18n.js,
  check-2c.mjs, phase-2c-manifest.md); no unexpected file appears.
- GLB byte sizes unchanged vs the 2B record: basic-grand.glb 704,872 bytes,
  hanoi-tiles.glb 2,496,552 bytes. Atlas still 200 sprites (check-basic).

## 11. Banned hosts / API keys - PASS

- My own grep over src/ + index.html for ip-api.com, ipwho.is, ipapi.co,
  ip-api, freeipapi, ipinfo: 0 hits. The only other fetch() calls in src/
  are local asset JSON files (atlas.json, game_icons.json, animals.json,
  textures/manifest.json). The banned hostnames appear only in docs/ and in
  the fixer's test data, by design. The only external host fetched by the app
  code is https://country.is/.

## 12. Impeccable detect - UNVERIFIED (tool failure, not a code verdict)

- My run: `timeout 180 npx impeccable detect` in ~/workspace/hanoi-3d,
  2026-11-21. Result: killed by timeout at 180 s, exit 124, zero stdout/stderr
  (/tmp/2c-verify/impeccable.log is 0 bytes). Same outcome as the fixer (180 s,
  no output) and both 2A runs and the 2B run. No findings were produced by any
  run, so there is nothing to pass or fail here. Whether the new #lm-lang
  block in index.html introduces a new finding cannot be known until
  Impeccable produces output somewhere.
- Hallmark sloplint: not runnable (no such package on npm, 404) - known, per
  WORKFLOW doc.

## 13. Live browser - UNVERIFIED (no browser in this sandbox)

- Not exercised: the real country.is call from the Pages origin (HTTPS + CORS
  in a real browser), the real toggle tap, the 390px top-row fit (checklist
  200px + toggle ~70px + 24px margins = ~294px < 390px by arithmetic only),
  the privacy-line wrap on a real phone, and whether country.is stays fast
  enough that the 800 ms timeout rarely fires for real visitors. The parent's
  fresh-browser check and the user device check remain the decider, as with
  every phase.
- What the fake DOM cannot prove: real tap targets, real paint order, real
  font metrics (the wrap counts in section 5 are arithmetic, not measured).

## Minor notes for the parent (not fails, no fixer round needed)

- The fixer's tools/check-2c.mjs contains one vacuous check, "(c) timeout
  stores no country", which asserts literal `true`. My harness closes that
  gap with real storage-empty assertions, so nothing is unverified, but the
  test should be fixed to assert the storage keys are absent if it is kept.
- Manifest wording: the once-per-session guard is a per-instance closure flag,
  not a "module-level" flag (section 1). Behaviour in the real app is
  once-per-session because createLandmarks runs once per load; only the
  wording needs correcting.
- The privacy line wraps (section 5) and the collapsed card re-opens on a
  language switch (section 9). Both are one-line-class fixes if the parent
  wants them; neither blocks the feature.

## Top 3 risks

1. Never seen on screen (check 13). Everything structural passes, but the real
   country.is call, the real toggle tap and the 390px top-row fit have no live
   evidence yet. The 800 ms timeout means a slow lookup silently stays VI
   (or falls back to navigator.language), which is usually right for locals
   but wrong for a Vietnamese visitor on an English-locale browser abroad.
2. Impeccable has now hung four times with zero output (check 12). If it ever
   runs, the new #lm-lang block in index.html is the one untested surface;
   until then the quality gate has a known hole no fixer round can close
   from here.
3. A stored hanoi:lang (detected or manual) freezes the language until the
   user taps the toggle or clears storage, even if they travel to another
   country. By design and documented in the manifest, but the user may expect
   travel to re-detect. The 2D edge route (Cloudflare cf-ipcountry,
   docs/i18n-plan.md) would remove the third-party call entirely.

## Recommendation

Proceed to the parent for push - no fixer round first. Every claim I could
check without a browser recomputes clean with fresh scripts: detection
priority / timeout / once-per-session / stores-nothing-on-failure (57 checks),
fake-DOM toggle + toast + info-card re-render (46 checks), dict 9 keys ASCII
(17 checks), build bundle hash identical to the claim, check:hanoi 161,
check-2b 334, check-basic 64, 0 long dashes / 0 diacritics, 0 banned hosts,
GLB sizes unchanged, CSS incident gone. The only UNVERIFIED items are the live
browser behaviour and Impeccable output, which belong to the parent's browser
check and the user device check, not to another fixer round. Optional
one-line follow-ups after push: preserve the collapsed class across a
language-change re-render, shorten the privacy line (or accept the wrap), fix
the vacuous timeout check in check-2c.mjs, and correct "module-level" to
"per-instance" in the manifest.
