# BrightSteps website

A plain HTML, CSS, and JavaScript site. No build step, no framework, so
you can edit and upload it the same way you already do for BrightSteps
Hub. All files, including every image, sit flat in one folder, there
are no subfolders anywhere, to keep GitHub uploads simple.

## Files

- `index.html` — the homepage
- `about-us.html`, `admissions.html`, `academic-approach.html`,
  `academic-program.html`, `contact-us.html`, `blog.html`,
  `school-calendar.html`, `asa.html`, `canteen.html`, `uniform.html`,
  `careers.html` — the rest of the site
- `styles.css` — all styling
- `script.js` — the nav menu, hero photo slideshow, scroll animations,
  and both forms
- `bis-logo.png` and every `.jpg` file — the school logo and photos

## Forms

Both the enrollment form and the contact form send directly to
Formspree, a free service that emails submissions straight to your
inbox. No dashboard or database needed. The two Formspree endpoint
links are already set inside `script.js`, near the top of the
enrollment and contact form sections. If you ever need to change
which email receives them, log into formspree.io and update the
form's settings there, nothing on the website itself needs to change.

## Publishing to GitHub

1. Go to your `brightsteps-website` repository in the Brightsteps2026
   GitHub organization.
2. Delete all existing files first, so nothing old is left behind.
3. Click Add file, then Upload files, and drag in every file from
   this folder at once.
4. Commit the changes. Vercel will redeploy automatically within a
   minute or two.

## Going live on your domain

When you're ready to replace the current bischoolci.org site with
this one, go to your Vercel project's Settings, then Domains, and add
bischoolci.org. Vercel will show you which DNS records to add in
Hostinger. This will take the old site offline once it takes effect,
so only do this once you're fully happy with everything here.

## What is not built yet

- A French translation, to match the current site's language toggle
- Additional real photography throughout the remaining pages
