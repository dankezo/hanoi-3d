// Language detection + strings (Phase 2C, Hanoi mode only; owner: landmarks agent).
//
// VI is the default language. Detection: one client-side fetch to https://country.is/
// (no key, no quotas, HTTPS + CORS, commercial use allowed) with an 800 ms timeout.
// Country VN -> VI, any other country -> EN. The lookup never blocks boot: the UI renders
// in the fallback language first (VI, or a stored choice / cached country) and switches live
// when the lookup returns. A manual toggle choice in localStorage (hanoi:lang) always wins
// over detection, and detection never runs again while it is set.
//
// Storage keys (language only, never the visited store):
//   hanoi:lang    - the chosen language ('vi' | 'en'). Written by the manual toggle, and by
//                   a successful detection so later visits skip the fetch. A stored value is
//                   treated as the user's choice: detection does not run while it is set.
//   hanoi:country - the cached country code ('VN', 'US', ...) from a successful lookup.
//                   A cached country resolves the language with no fetch at all.
// A failed / timed-out / 429 lookup stores nothing and falls back to navigator.language,
// then to VI. Fetch runs at most once per session (per-instance started flag; once
// per session in practice because createLandmarks runs once per load).
//
// Do NOT use the HTTP-only trap provider (403 over HTTPS), the shared-quota provider
// as the only source (1,000/day per site), or the trial provider (not for production).
// No API key anywhere. The banned hostnames are named in docs/phase-2c-manifest.md.
// Vietnamese UI strings are written WITHOUT diacritics, matching the app convention.
// No long dashes in this file: only short hyphens (-).

export const LANG_KEY = 'hanoi:lang';
export const COUNTRY_KEY = 'hanoi:country';
export const COUNTRY_URL = 'https://country.is/';
export const DETECT_TIMEOUT_MS = 800;
export const DEFAULT_LANG = 'vi';
export const LANGS = Object.freeze(['vi', 'en']);

// All user-facing UI strings for the Hanoi-mode UI. Landmark names live in the landmarks
// data (src/game/landmarks.js NAMES) and history text in src/game/landmark-history.js;
// only the chrome around them is here. {name} / {host} are filled by format().
export const STRINGS = Object.freeze({
  vi: Object.freeze({
    checklistTitle: 'HANOI',
    privacy: 'Ngon ngu doan theo IP, chi ma quoc gia.',
    discovered: 'Da kham pha: {name}',
    histHeading: 'Lich su',
    funHeading: 'Dieu thu vi',
    sourceLabel: 'Nguon: {host}',
    hint: 'WASD / bam de di - Shift chay - Ctrl cham - Tab ban do - N dem - M nhac - V goc nhin',
    toggleLabel: 'Doi ngon ngu: tieng Viet / tieng Anh',
    closeLabel: 'Dong',
  }),
  en: Object.freeze({
    checklistTitle: 'HANOI',
    privacy: 'Language guessed from IP, country code only.',
    discovered: 'Discovered: {name}',
    histHeading: 'History',
    funHeading: 'Fun fact',
    sourceLabel: 'Source: {host}',
    hint: 'WASD / click to walk - Shift run - Ctrl slow - Tab map - N night - M music - V view',
    toggleLabel: 'Switch language: Vietnamese / English',
    closeLabel: 'Close',
  }),
});

/** True for a valid language code. */
export function isLang(v) {
  return v === 'vi' || v === 'en';
}

/** Country code -> language, or null when the country is missing / not a string. */
export function langFromCountry(country) {
  if (typeof country !== 'string') return null;
  const c = country.trim().toUpperCase();
  if (!c) return null;
  return c === 'VN' ? 'vi' : 'en';
}

/** navigator.language -> language, or null when it is missing / empty. */
export function langFromNavigator(navLang) {
  if (typeof navLang !== 'string') return null;
  const n = navLang.trim().toLowerCase();
  if (!n) return null;
  return n.startsWith('vi') ? 'vi' : 'en';
}

/**
 * Pure priority chain: stored manual choice first, then country, then navigator
 * language, then the VI default. No fetch, no storage access here.
 */
export function resolveLang({ stored = null, country = null, navLang = '' } = {}) {
  if (isLang(stored)) return stored;
  const byCountry = langFromCountry(country);
  if (byCountry) return byCountry;
  const byNav = langFromNavigator(navLang);
  if (byNav) return byNav;
  return DEFAULT_LANG;
}

/** Fill {name} / {host} placeholders in a string. Unknown keys stay as-is. */
export function format(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Storage access that never throws (private mode, blocked cookies, headless). */
export function safeStorage(storage) {
  const mem = new Map();
  const real = storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' ? storage : null;
  return {
    get(key) {
      if (real) { try { return real.getItem(key); } catch { return mem.get(key) ?? null; } }
      return mem.get(key) ?? null;
    },
    set(key, value) {
      if (real) { try { real.setItem(key, value); return; } catch { /* fall through to memory */ } }
      mem.set(key, value);
    },
  };
}

/**
 * One country lookup against country.is, with a timeout. Returns the upper-case
 * country code ('VN', 'US', ...) or null on any failure: timeout, network error,
 * non-OK status (including 429), bad JSON, or a missing country field.
 */
export async function detectCountry({ fetchImpl = null, timeoutMs = DETECT_TIMEOUT_MS } = {}) {
  if (typeof fetchImpl !== 'function') return null;
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
      const res = await fetchImpl(COUNTRY_URL, signal ? { signal } : undefined);
      if (!res || res.ok === false) return null;
      const data = await res.json();
      if (!data || typeof data.country !== 'string') return null;
      return data.country.trim().toUpperCase() || null;
    })();
    const country = await Promise.race([req, timeout]);
    return country || null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Language state for one page load. Initial language: stored choice, else cached
 * country, else the VI default (never navigator.language - the lookup owns that
 * fallback, and the UI must render before it returns). detect() is fire-and-forget:
 * it never throws and never blocks the caller; onChange fires only when the
 * language actually changes, so the caller can re-render all visible strings.
 *
 * opts: { storage, navigatorLanguage, fetchImpl, timeoutMs, onChange }
 * Returns { lang, t, setLang, toggle, detect, fetchCalls }.
 */
export function createLanguage(opts = {}) {
  const {
    storage = null,
    navigatorLanguage = '',
    fetchImpl = null,
    timeoutMs = DETECT_TIMEOUT_MS,
    onChange = null,
  } = opts;
  const store = safeStorage(storage);
  const storedLang = store.get(LANG_KEY);
  const cachedCountry = store.get(COUNTRY_KEY);
  let current = resolveLang({ stored: storedLang, country: cachedCountry, navLang: '' });
  // Initial render ignores navigator.language on purpose: the fallback is VI, and
  // the lookup (fetch, then navigator) decides any switch afterwards.
  if (!isLang(storedLang) && !langFromCountry(cachedCountry)) current = DEFAULT_LANG;
  let started = false;
  let fetchCalls = 0;

  function emit(next) {
    if (next === current) return;
    current = next;
    if (typeof onChange === 'function') {
      try { onChange(next); } catch { /* a re-render must never break detection */ }
    }
  }

  const api = {
    get lang() { return current; },
    get fetchCalls() { return fetchCalls; },
    /** Localised string for the current language, with {name} / {host} filled. */
    t(key, vars = {}) {
      const dict = STRINGS[current] || STRINGS[DEFAULT_LANG];
      return format(dict[key] ?? STRINGS[DEFAULT_LANG][key] ?? key, vars);
    },
    /**
     * Set the language. Manual sets (the toggle) persist in hanoi:lang and win over
     * every later detection; detection sets do not persist by themselves.
     */
    setLang(next, { manual = false } = {}) {
      if (!isLang(next)) return false;
      if (manual) store.set(LANG_KEY, next);
      emit(next);
      return true;
    },
    /** Flip VI <-> EN as a manual choice (persists, overrides detection). */
    toggle() {
      return api.setLang(current === 'vi' ? 'en' : 'vi', { manual: true });
    },
    /**
     * Run the lookup once per session, fire-and-forget. No-op when a stored language
     * or a cached country already decided the language (no fetch in that case).
     * Returns a promise of the resolved language; never rejects.
     */
    detect() {
      if (started) return Promise.resolve(current);
      started = true;
      if (isLang(store.get(LANG_KEY))) return Promise.resolve(current);
      if (langFromCountry(store.get(COUNTRY_KEY))) return Promise.resolve(current);
      fetchCalls++;
      return detectCountry({ fetchImpl, timeoutMs })
        .then((country) => {
          if (country) {
            store.set(COUNTRY_KEY, country);
            const lang = langFromCountry(country);
            store.set(LANG_KEY, lang);
            emit(lang);
          } else {
            // Lookup failed: navigator.language, then the VI default.
            emit(resolveLang({ navLang: navigatorLanguage }));
          }
          return current;
        })
        .catch(() => {
          emit(resolveLang({ navLang: navigatorLanguage }));
          return current;
        });
    },
  };
  return api;
}
