# Hanoi 3D - Language plan (Phase 2C)

Prepared 2026-11-21. Verified via web search (Nov 2026 sources: cors.dev, ipapi.gr, ipwhois.io docs, ipapi.is docs).

## Requirement

- Detect the visitor's country from IP -> VI if Vietnam, else EN. VI is the default/basic language.
- Manual VI/EN toggle on screen, persists, overrides detection.
- Existing app convention: Vietnamese WITHOUT diacritics in UI strings (toast, checklist). The landmark-history content file follows the same convention.

## Verified free IP geolocation options (country code only is enough)

- country.is - BEST for this use: https://country.is/ returns {country, ip}. No key, no quotas, 10 req/s per IP, HTTPS + CORS, commercial use allowed. Country by default; ?fields= for more.
- ipinfo.io Lite - unlimited requests, country + continent only, attribution required for commercial use. Free token for Lite; legacy /json no key at 50k/month.
- ipwho.is - free, no key, HTTPS + CORS, BUT 1,000 requests/day counted PER SITE (Origin) for browser calls, shared by all visitors; over limit -> 429. Risky once traffic grows. Do not use as the only source.
- ipapi.co - trial only (1,000/day, 30k/month), "not meant for production". Avoid.
- ip-api.com - 45 req/min per IP, non-commercial, HTTP ONLY (HTTPS gives 403). UNUSABLE from an HTTPS page (mixed content). Trap - do not use.
- freeipapi.com - 60 req/min, HTTPS + CORS, no key. Usable as a fallback.
- ipapi.is - keyless 30/day per IP (minimal response); free key 1,000/day. Key must never live in browser JS.

## Design (standalone, no server)

1. On first load: fetch country.is with a short timeout (~800 ms). Success + country == "VN" -> VI, else EN.
2. On failure/timeout/429: fall back to navigator.language (starts with "vi" -> VI), final fallback VI.
3. Fetch once per session at most; cache country + chosen lang in localStorage (hanoi:lang, hanoi:country). Never block the game boot on the lookup - render in the fallback language first, switch when the lookup returns.
4. Manual toggle (VI | EN) on screen (top-right, next to the checklist card), persists in localStorage, overrides detection until changed.
5. Privacy: the lookup sends the visitor's IP to the geo service; only the country code is used and nothing is stored server-side. State that in one small line (footer/about).

## Better route if the 2D edge layer exists

If the Cloudflare Worker / Vercel Edge from the antiRea plan (docs/antirea-plan.md) is built, read the country server-side from the request (Cloudflare cf-ipcountry header): zero client latency, no third-party call, no shared quota, no privacy leak to a geo vendor. Prefer this once 2D lands; keep the client-side fetch as the fallback.

## What NOT to do

- Do not use ip-api.com (HTTP-only trap) or rely on ipwho.is alone (shared 1,000/day site quota).
- Do not put any API key in browser JS or the public repo.
- Do not block boot on the lookup; do not re-fetch on every page load.
- Do not auto-switch language on every visit after the user picked manually.
