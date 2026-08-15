# Phase 3 — Technical SEO Foundation

## What's in the zip (42 files)
All 38 HTML pages (updated) + `robots.txt` (new) + `sitemap.xml` (new) + `vercel.json` (updated) + `og-image-placeholder.jpg` (new, needs your approval — see below).

## What every page now has
- Self-referencing canonical `<link>`
- Reciprocal `hreflang="en"` / `hreflang="fr"` / `hreflang="x-default"` (programmatically cross-checked — all 38 pages verified reciprocal, no mismatches)
- Open Graph tags (title, description, url, type, image, image dimensions, locale + alternate locale) — all pulled from your existing unique per-page title/description, nothing invented
- Twitter card tags
- `index.html` and `index-fr.html` also get `School` JSON-LD structured data, using only verified facts already public on your site: name, URL, logo, email (`info@bischoolci.org`), phone (`+225 07 10 11 01 33`), city/country (Grand Bassam, CI — no street address, since none exists on the site), and your three social links.

## robots.txt / sitemap.xml
- `robots.txt` allows full crawling and points to the sitemap — nothing blocked.
- `sitemap.xml` lists all 38 pages with absolute canonical URLs. Validated as well-formed XML. No `lastmod` — I don't have a truthful source date for any page, so I left it out entirely rather than guess.

## Redirect
- Added `/index.html` → `/` (permanent) in `vercel.json`. Existing security headers and the image-caching rule are untouched.

## Bonus fix while I was in these files
Found and fixed 5 more French accent bugs in meta descriptions (`fondee`→`fondée`, `Demarrez`→`Démarrez`, `2026 a 2027`→`2026 à 2027`, `assure`→`assuré`, `relatives a`→`relatives à`) — same "waves" pattern as before. All clean now, verified with a fresh grep.

## Needs your input before this goes further

1. **Domain assumption.** Everything above uses `https://www.bischoolci.org` as the canonical domain, per the audit doc's instruction. I still can't confirm from here whether that domain is actually live and pointed at this codebase — worth double-checking before this ships to production, since every canonical/hreflang/sitemap URL depends on it being correct.
2. **OG placeholder image — needs approval.** No approved 1200×630 social image existed, so I built a plain on-brand one (maroon background, marigold accent, your logo, school name — no claims, no invented imagery). It's in the zip as `og-image-placeholder.jpg`. Take a look and let me know if it's good to keep or if you'd rather commission something better later — it's easy to swap out since every page just references the one file.
3. **BreadcrumbList — I'm holding off.** The audit asked for breadcrumb structured data on internal pages, but none of your pages currently show a visible breadcrumb trail. Adding invisible structured data that doesn't match what a visitor actually sees runs against Google's own structured-data guidelines and can read as manipulative. If you want this, it should come with an actual visible breadcrumb UI — I'd fold that into Phase 4 (content/headings) rather than fake it here now.
4. **www vs. non-www redirect.** This one isn't something I can set in `vercel.json` — it's normally handled in Vercel's Domains settings when you add the custom domain (assign `www.bischoolci.org` as primary, Vercel auto-redirects the apex). Flagging so it doesn't get missed when you do the DNS cutover.
5. **Titles/descriptions were already fine.** One audit finding doesn't actually apply — every page already had a unique title and description before I touched anything. No changes needed there.

Once you've had a look, I'll move on to Phase 4 (content/heading fixes — the permanent H1, the blog.html editorial note, duplicate `id="top"`).
