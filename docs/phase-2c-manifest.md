# Hanoi 3D - Phase 2C manifest (IP language detection VI/EN)

Fixer build, 2026-11-21. Hanoi mode only (?map=hanoi). Nothing pushed, nothing committed.
Working tree = remote HEAD 4ec66a3 content + steps 5-7 + 2A + 2B + this 2C work, all uncommitted.
No 2A/2B files touched except src/game/landmarks.js and index.html, where 2C genuinely
needs shared UI code (listed below). No change to wfc.js, tiles.js solver logic, world.js,
post.js, src/main.js or src/game/index.js. No new dependencies. No API key anywhere.

## Decisions (recorded)

- Provider is country.is only: https://country.is/ returns {country, ip}. No key, no
  quotas, HTTPS + CORS, commercial use allowed (verified Nov 2026, docs/i18n-plan.md).
  The banned providers are named here, not in src/: ip-api.com is HTTP-only (403 over
  HTTPS, mixed-content trap), ipwho.is as the only source shares a 1,000/day site quota,
  ipapi.co is trial-only and not for production. Zero occurrences of those three hostnames
  exist anywhere in src/ + index.html (checked by tools/check-2c.mjs, test h).
- Detection caches BOTH keys on success, exactly as the task specified: hanoi:country
  (the country code) and hanoi:lang (the detected language). A stored hanoi:lang is
  treated as the user's choice from then on: detection never runs again while it is set,
  so a detected language is never re-decided on a later visit. The manual toggle writes
  hanoi:lang only (country untouched). Consequence, accepted: a visitor who changes
  country keeps the old language until they tap the toggle or clear storage.
- Initial render ignores navigator.language on purpose. The fallback is VI, the default:
  the UI paints VI first, then switches live when the lookup returns. navigator.language
  is used only inside detection, as the fallback when the lookup fails or times out.
- Info card shows the ACTIVE language first and the other language second (not
  active-only with an in-card toggle). Both languages stay reachable in the card with
  no extra tap; only the section order and the big/italic title swap. Headings keep
  their own language's wording ("Lich su" stays "Lich su"); only their order changes.
- Toast keeps the 2B two-line shape, generalised: title = active language
  ("Da kham pha: X" / "Discovered: X"), sub = the other language's name.
- Checklist keeps both names per item: active language first (plain), other second
  (italic). Counter "n/10" is language-neutral and unchanged.
- Hint bar is re-worded by language too, Hanoi mode only. The WFC world never creates
  the landmarks module, so its hint stays the original English text: WFC behaviour is
  byte-identical (no main.js or index.js change, no new DOM in the WFC path).
- Toggle is a real button, not a link: "VI | EN" with the active side bold + terracotta
  underline. Clicking flips the language, persists it, and re-renders everything at once.
- Privacy line lives in the checklist card footer, one short line, in the active language.

## Detection design

- One fetch per session at most (per-instance started flag; once per session in
  practice because createLandmarks runs once per load; repeat detect() calls are
  no-ops). Order: stored hanoi:lang -> cached hanoi:country -> fetch country.is ->
  navigator.language -> VI default.
- Fetch: GET https://country.is/, 800 ms timeout via AbortController + Promise.race.
  Success + country "VN" -> VI, any other country -> EN; cache country + lang.
  Failure, timeout, non-OK status (including 429), bad JSON, or missing country field
  -> store nothing, fall back to navigator.language (starts with "vi" -> VI), then VI.
- Boot never waits: createLandmarks renders the UI in the fallback language, calls
  lang.detect() fire-and-forget (no await anywhere on the detection path - see the
  verification section), and the onChange callback re-renders every visible string
  when the lookup resolves to a different language.
- Language state lives in src/game/i18n.js (createLanguage), pure and Node-importable:
  resolveLang / langFromCountry / langFromNavigator / detectCountry / format /
  safeStorage (never throws: private mode, blocked cookies, headless all fall back
  to an in-memory map). landmarks.js owns only the DOM re-render (renderAllStrings).

## Toggle design + position

- Button #lm-lang, fixed top-right (top 12px, right 12px): the empty corner, checklist
  is top-left, minimap bottom-right. Paper-styled like the checklist (cream #efe0c2,
  ink #5a3a28, 1px border, radius 3px, Georgia serif, same shadow). Hidden unless
  body.hanoi, exactly like #lm-list / #lm-toast / #lm-map. z-index 5.
- Click -> lang.toggle(): flips VI <-> EN, writes hanoi:lang, re-renders checklist
  header + counter + names, toast (re-worded if showing), info card (re-ordered if
  open), hint bar, privacy line, toggle itself (active side + aria-label).
- On a 390px phone the checklist (200px) and the toggle (~70px) share the top row;
  fit is by arithmetic only (200 + 70 + 24px margins < 390) - live layout unverified,
  see "could NOT verify".

## i18n module design

- src/game/i18n.js exports LANG_KEY / COUNTRY_KEY / COUNTRY_URL / DETECT_TIMEOUT_MS
  (800) / DEFAULT_LANG ('vi') / LANGS, the STRINGS dict, and the functions above.
- STRINGS has 9 keys, identical in vi and en: checklistTitle, privacy, discovered
  ("Da kham pha: {name}" / "Discovered: {name}"), histHeading, funHeading,
  sourceLabel ("Nguon: {host}" / "Source: {host}"), hint, toggleLabel, closeLabel.
  Landmark names come from the existing NAMES data; history/fun-fact text stays in
  landmark-history.js (unchanged). All VI strings are diacritic-free (pure ASCII).
- Privacy line wording: VI "Ngon ngu doan theo IP, chi ma quoc gia." EN "Language
  guessed from IP, country code only." (Shortened in the coordinator follow-up so the
  line fits the 200px card; the plan only requires the country-only note.)

## Files changed / added (2C only)

- src/game/i18n.js (new) - detection + strings + language state, as above.
- src/game/landmarks.js - imports i18n.js; creates the language controller; checklist
  items gain two name slots (active plain + other italic); showToast / showInfo use the
  active language (info sections re-ordered active-first); renderAllStrings() re-renders
  every visible string; toggle click wiring; lang.detect() fire-and-forget after the
  first paint; new API lang() / setLang() / detectLang(). Anchors, ids, discovery
  radius 1, storage key hanoi:v1:<seed> all untouched.
- index.html - #lm-lang toggle button + CSS (Hanoi-gated); #lm-privacy footer line in
  the checklist card; id="lm-title" on the checklist title span; ids on the four info
  card headings (lm-info-hist-h-vi/en, lm-info-fun-h-vi/en) so showInfo can re-order
  them. No other change; the hint div text is set by JS in Hanoi mode only.
- tools/check-2c.mjs (new) - the 2C node test, 88 checks (see verification).
- docs/phase-2c-manifest.md (this file).

## Verification evidence (all run, exact counts)

- node --check: 3/3 pass (src/game/i18n.js, src/game/landmarks.js, tools/check-2c.mjs).
- npm run build: PASS. Bundle dist/assets/index-DuIsU17G.js, 1,100.85 kB (gzip 332.82 kB).
  Baseline before 2C was index-DjTv2yFV.js, 1,095.99 kB. Bundle contains the 2C markers
  (country.is x1, hanoi:lang x2, hanoi:country x2).
- npm run check:hanoi: 161 PASS, ALL CHECKS PASSED. Solver options 95 (cap 96), MODELS 48,
  0 socket mismatches, all 1600 cells resolve.
- node tools/check-2b.mjs (2B regression): ALL 2B CHECKS PASSED (334 checks).
- node tools/check-basic.mjs (2A regression): ALL BASIC CHECKS PASSED.
- node tools/check-2c.mjs: 88 PASS, 0 FAIL, ALL 2C CHECKS PASSED. Covers: (a) VN -> VI
  with fetch called once and country + lang cached; (b) US -> EN with a live switch
  from the VI fallback and onChange firing; (c) never-resolving fetch -> navigator
  fallback (vi -> VI, en -> EN) and detectCountry timeout -> null; (d) fetch throw /
  429 / missing country field / no fetch -> VI default (and nav en -> EN); (e) stored
  hanoi:lang overrides detection both ways with zero fetch, cached country also skips
  the fetch; (f) three detect() calls -> exactly one fetch; manual toggle persists
  both ways and setLang rejects junk; (g) dict keys match vi/en, all 9 keys present,
  every VI dict string pure ASCII, all 10 landmark VI names + all history VI strings
  ASCII; (h) no banned geo host in src/ + index.html, no API key in the i18n module;
  zero long dashes in the changed files; boot never awaits (main.js never mentions
  detection, no await in landmarks.js or game/index.js, detect() call line has no
  await); fake-DOM re-render: initial VI fallback, toggle click flips checklist /
  privacy / hint / toggle state and persists, discovery toast in the active language,
  info card opens with the active language first (History first in EN, Lich su first
  in VI), toggle back re-words the open toast and re-orders the open card, US lookup
  switches the live UI to EN and stores country + lang, stored vi beats a US lookup
  with zero fetch.
- Long dashes (python re-check, independent of the test): 0 in src/game/i18n.js,
  src/game/landmarks.js, index.html, tools/check-2c.mjs. Only non-ASCII char in those
  files is the pre-existing middle dot in the upstream hint div (index.html), which
  2C did not touch and which is not a Vietnamese diacritic.
- Banned hosts (grep): zero matches for ip-api.com / ipwho.is / ipapi.co in src/ +
  index.html. (The hostnames appear only in docs/ here, by design.)
- npx impeccable detect: HUNG. Zero output within the 180 s timeout, killed by
  timeout. This is a tool failure, not a pass - the same hang 2A and 2B reported.
  Not re-run. Hallmark sloplint: not runnable (no such package on npm, 404) - known,
  per WORKFLOW doc.
- One build failure caught and fixed during this task: my first CSS insert swallowed
  the opening /* of the Phase 2B info-card comment, and vite build failed in
  lightningcss ("Invalid dangling combinator"). Restored the comment opener; build
  passes since. No other file was touched by the fix.

## What I could NOT verify live (no headless browser in this sandbox)

- The real country.is call from a browser (HTTPS + CORS from the Pages origin),
  the live toggle tap, and the 390px layout (toggle vs checklist top row, privacy
  line wrapping, info card + toggle spacing). Logic is unit-tested with mocked fetch
  and a fake DOM, but the network call and the real tap need a live check. Parent
  does fresh-browser checks; the user device is the decider.
- Whether country.is stays reachable and fast for real visitors (800 ms timeout
  means a slow lookup silently stays VI, or falls back to navigator.language).
- FPS / load impact: one extra fetch at most, no new dependency, bundle +4.86 kB
  over the 2B bundle.

## Remaining risks

- A stored hanoi:lang (detected or manual) freezes the language until the user taps
  the toggle or clears storage, even if they travel to another country. By design
  (see Decisions), but the user may expect travel to re-detect.
- Toggling the language while the info card is collapsed re-opens its body
  (showInfo removes the collapsed class). Small quirk, one line to fix if it annoys.
- If country.is ever goes down or rate-limits, every visitor falls back to
  navigator.language, which is usually right for locals but wrong for a Vietnamese
  visitor on an English-locale browser abroad. The 2D edge route (Cloudflare
  cf-ipcountry, docs/i18n-plan.md) removes the third-party call entirely.
- Radius-1 co-discovery is unchanged: standing at (6,-1) discovers Ngoc Son +
  Cathedral at once and the info card shows the last discovered one. Same behaviour
  as step 4 / 2B.

## Coordinator follow-up (verifier nits, fixed before push)

- Collapsed-card re-open (verifier check 9, real): showInfo() removed 'collapsed'
  unconditionally, so a language toggle / resolving lookup while the info card was
  collapsed re-opened its body. Fix: showInfo(id, expand = true); the
  renderAllStrings re-render path calls showInfo(infoOpen, false) so the collapsed
  state survives a language change; discovery + checklist tap still expand.
- Privacy line wrap (verifier check 5, nit): shortened both strings so the line fits
  the 200px card - VI "Ngon ngu doan theo IP, chi ma quoc gia." EN "Language guessed
  from IP, country code only." (index.html fallback text updated to match.)
- Vacuous test (verifier note): check-2c.mjs "(c) timeout stores no country" asserted
  literal true. Fixed to assert on a named store: COUNTRY_KEY and LANG_KEY are both
  null after a timeout (check count 88 -> 89).
- Wording correction: "module-level started flag" -> "per-instance started flag"
  (i18n.js header comment + this manifest); behaviour unchanged.
- Re-verified after the fixes: node --check, build, check:hanoi, check-2c, check-2b,
  check-basic (counts in the coordinator's 2C report).
