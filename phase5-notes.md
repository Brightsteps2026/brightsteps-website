# Phase 5 — Images, Performance & Caching

## ⚠️ Important: how to upload this one
This zip has 205 files, but it is **not** a full copy of your site — it's every file that's new or changed this phase. It does **not** include your PDFs, favicons, jersey/polo original photos (now superseded, see below), or any other untouched file.

**Do not delete everything in your GitHub repo before uploading this one.** Just drag these 205 files in on top of the existing repo contents (GitHub's uploader overwrites matching filenames and adds new ones — it won't touch anything not in this zip). Deleting first and uploading only this folder would remove files this phase never touched.

## What changed

**Every photo on the site (27 of them) now has AVIF + WebP + optimized JPEG, at two sizes each (a ~700px "mobile" size and a larger "desktop" size), wired up through `<picture>` elements with `srcset`.** Browsers automatically pick the smallest format and size they support and actually need — so a phone on a slow connection gets a small AVIF file instead of the same full desktop JPEG everyone used to get. Rough numbers: what a typical mobile visitor now downloads for these photos combined is about 83% smaller than before (roughly 4.3 MB → 760 KB across all referenced photos, though of course any single page only loads the handful of photos on that page).

**Every `<img>` tag site-wide now has explicit width and height** — this stops the page jumping around as images load in (layout shift).

**Found a big one while I was in here: your logo file was 4500×4500 pixels and 213 KB, displayed at 38 pixels tall on every single page.** Resized it down to 240×240 (still 6x the resolution it's ever actually shown at) — 213 KB → 13 KB, applied everywhere with correct dimensions.

**Loading priority:** each page's first, above-the-fold photo loads immediately and gets flagged as high-priority for the browser; every other image loads lazily as the visitor scrolls to it. On the homepage, since the hero uses a full-bleed background photo rather than an `<img>`, all the content images below it are lazy — correct either way.

**Hero slideshow — this had no real controls at all before:**
- Added actual prev/next buttons and slide-picker dots (the CSS for these already existed in your stylesheet, they'd just never been connected to any HTML)
- Added a new pause/play button
- Now respects the "reduce motion" setting some visitors have turned on at the OS level — autoplay simply doesn't start for them, but they can still click through manually
- Pauses automatically if the browser tab isn't visible (so it's not silently cycling and wasting battery/data behind another tab)
- Only the first slide's photo loads immediately; the other four load in during idle time rather than all five downloading at once on page load

**Caching:** AVIF files now get the same year-long cache treatment your JPEGs/PNGs already had. Extended that same long caching to `styles.css` and `script.js`, which previously had no real caching at all. Since you don't have a build step that renames files automatically, I added a small `?v=1` on the end of those two references in every page — **whenever you next edit `styles.css` or `script.js` and want visitors' browsers to fetch the new version instead of a year-old cached copy, bump that number to `?v=2`** (I can do this for you automatically whenever I hand you a CSS/JS change from now on).

**Fonts:** found that `<strong>` (bold) text in your body copy — 18 places across the site — was never actually loading a real bold weight for its typeface, so browsers were faking it (algorithmically slanting the regular weight rather than using real bold letterforms). Added the missing weight so bold text now renders properly. Also cleaned up one small mismatched weight declaration on the hero slogan text — no visual difference, just made the CSS say what's actually happening.

## What I did not touch
- No image was cropped, and no faces were reframed — resizes were proportional, same crop as the original.
- The original full-resolution photo files (e.g. `campus-pool.jpg`) are no longer referenced anywhere and can eventually be deleted from your repo if you want to tidy up, but I left that decision to you rather than deleting things myself.
- Didn't touch the calendar image handling — it already had proper `<picture>`/WebP/dimensions/lazy-loading from earlier work, so I just made sure my working copy had the same files you already had live.

## Verified before delivery
Ran a full check across all 38 pages: every referenced image file actually exists, no malformed `<picture>` markup, still exactly one H1 and zero duplicate IDs per page (no regressions from earlier phases), `vercel.json` and `script.js` both parse cleanly.

That closes out Phase 5. Remaining phases from the original audit: Phase 6 (privacy-enhanced YouTube embed), Phase 7 (a dedicated accessibility pass beyond what's been folded in already), Phase 8 (favicon.ico + absolute-path icon references), and Phase 9–10 (security regression check + automated test setup + a preview deploy for your review before any of this goes to production).
