# Phase 9–10 — Security Regression Check & Automated Tests

## What's in the zip (2 files)
- `index-fr.html` — one real bug fixed (see below)
- `run_tests.py` — the test suite itself, so you (or I, next time) can re-run it after future changes. Runs entirely against the local files, no live site needed.

## Security regression check — all clear
Went through the current `vercel.json` headers and the full codebase looking for anything that would weaken security:

- **CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy** — all present, all reasonably strict. Nothing weakened by any of this session's work.
- **No `unsafe-eval`** anywhere in the CSP.
- **No inline event handler attributes** (`onclick=` etc.) anywhere in the codebase — good, because the current CSP would silently block them if they existed, which could have caused confusing broken-feature bugs.
- **No mixed content** — every resource reference uses HTTPS or a relative path, nothing pulls from plain `http://`.
- **No exposed secrets** — checked for API keys, tokens, passwords in both the HTML and `script.js`. The only "credentials" in the code are your two public Formspree form IDs, which aren't secrets — that's how Formspree's public API is designed to work.
- **No source maps** committed.
- **Only redirect is `/index.html` → `/`** — not user-controlled, no open-redirect risk.

**One deliberate decision, not a gap:** the CSP still allows `'unsafe-inline'` for styles. There are 200 inline `style="..."` attributes across the site, and with no build step to generate CSP nonces per-request, the only alternative would be hand-maintaining a list of CSS hashes — which would silently break styling on any future edit to an inline style unless someone remembered to regenerate the hash. That's a worse outcome than leaving this as-is, and it matches the audit's own instruction not to break the design chasing this. Flagging it so it's a documented choice, not an oversight.

## Automated tests — 21 checks, all passing
Built a real, re-runnable test script (`run_tests.py`) rather than just eyeballing things. It covers everything from the audit's Phase 10 list that can be verified without a live browser: heading structure, duplicate IDs, unique titles/descriptions, canonical URLs, reciprocal hreflang, broken internal links, missing asset files, alt text, form labels, `robots.txt`/`sitemap.xml` validity, favicon presence, security headers, and — new since our caching saga — a check that every single page references the *same* version of `styles.css` and `script.js`, so we never again end up with pages silently drifting out of sync.

**Three real findings caught and fixed:**
1. **The French homepage title was never translated** — it was word-for-word identical to the English one ("BrightSteps International School | Grand-Bassam"), while every other French page correctly follows a "[French page name] | BrightSteps International School" pattern. Fixed to "Accueil | BrightSteps International School" (title, `og:title`, and `twitter:title` all updated).
2. **`script.js` had the exact same stale-cache bug `styles.css` had.** It's been sitting on `?v=1` this entire time despite being edited many times since Phase 5 (hero controls, form validation, nav accessibility, video click-to-load...). Anyone whose browser cached the early version has been missing every JS fix since. Bumped to `?v=2` — already included in the last few zips I've sent, so this should already be resolved, but flagging it explicitly since it was a real, previously-undiagnosed gap.
3. Two things the test flagged that turned out to be false positives on investigation, not real bugs: `calendar.pdf` (exists fine on the live repo, I just hadn't pulled it into my own working copy) and two hidden anti-spam timestamp fields that don't need labels since no user ever sees or interacts with them.

## What's still outside what I can test from here
I can't verify actual HTTP response codes, real Lighthouse performance/accessibility scores, or genuine cross-browser rendering without a live, reachable deployment — that's still bounded by the bischoolci.org / Vercel domain situation we sorted through earlier. Once that's settled, running Lighthouse against the real production URL would be the natural next step to get hard performance numbers rather than my code-level reasoning about what should happen.

That's Phases 1 through 10 of the original audit complete. The remaining open item from earlier in the project is the domain question itself — whether and when to point bischoolci.org at this codebase.
