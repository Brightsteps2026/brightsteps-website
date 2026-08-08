# BrightSteps website

A plain HTML, CSS, and JavaScript site. No build step, no framework, so
you can edit and upload it the same way you already do for BrightSteps
Hub.

## Files

- `index.html` — the homepage
- `styles.css` — all styling
- `script.js` — mobile menu, scroll animations, and the enrollment form
- `assets/bis-logo.png` — the school logo
- `enrollment_inquiries_setup.sql` — run once in Supabase to create the
  form's database table

## Connect the enrollment form to Supabase

1. Open your Supabase project dashboard, the same one used by
   BrightSteps Hub.
2. Go to SQL Editor, paste the contents of
   `enrollment_inquiries_setup.sql`, and run it. This creates a
   dedicated table just for website inquiries. It does not touch your
   student or parent data.
3. Go to Project Settings then API. Copy the Project URL and the
   anon public key.
4. Open `script.js` and replace `YOUR_SUPABASE_PROJECT_URL` and
   `YOUR_SUPABASE_ANON_KEY` near the top with those two values.

## Publishing to GitHub

1. Create a new repository, for example `brightsteps-website`, in your
   Brightsteps2026 GitHub organization.
2. Upload these files using GitHub's Add file then Upload files, the
   same way you already update the Hub.
3. Connect the repository to Vercel, or turn on GitHub Pages in the
   repository's Settings under Pages, to get a live link.
4. In Hostinger, point your domain bischoolci.org at that new link
   following the host's instructions for a custom domain.

## Pages included

- `index.html` — Home
- `about-us.html` — About Us
- `admissions.html` — Admissions
- `academic-approach.html` — Academic Approach
- `academic-program.html` — Academic Program
- `contact-us.html` — Contact Us

## What is not built yet

- A French translation, to match the current site's language toggle
- Blog, School Calendar, After School Activities, Canteen, Uniform,
  and Careers pages, which existed on the old site
- A way for staff to view submitted enrollment inquiries inside
  BrightSteps Hub itself
