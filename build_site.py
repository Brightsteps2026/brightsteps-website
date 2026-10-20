#!/usr/bin/env python3
"""
BrightSteps site build: applies the shared header, footer and stylesheets
to every inner page.

The homepage files (index.html, index-fr.html) are the source of truth for
the header and footer. Edit those, then run:

    python3 build_site.py

It is safe to run repeatedly. It rewrites, on every other *.html page:
  - the Google Fonts link and stylesheet links (site.css + pages.css, with
    the version numbers below for cache busting)
  - the skip link, <header> and <footer>
  - the opening page-hero band markup
Page content between the header and footer is never touched, except that the
page-hero section is wrapped so it can span the full width.
"""
import re
import sys
from pathlib import Path

SITE_CSS_V = 5
PAGES_CSS_V = 3

ROOT = Path(__file__).resolve().parent
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com" />\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
         '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500'
         '&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />\n')


def block(html, start_pat, end_tag):
    m = re.search(start_pat, html)
    if not m:
        return None
    end = html.index(end_tag, m.start()) + len(end_tag)
    return m.start(), end


def extract(src, start_pat, end_tag):
    a, b = block(src, start_pat, end_tag)
    return src[a:b]


def load_templates():
    t = {}
    for lang, fn in (('en', 'index.html'), ('fr', 'index-fr.html')):
        src = (ROOT / fn).read_text(encoding='utf-8')
        t[lang] = {
            'skip': extract(src, r'<a class="skip-link"', '</a>'),
            'header': extract(src, r'<header class="site-header"', '</header>'),
            'footer': extract(src, r'<footer class="site-footer"', '</footer>'),
        }
    return t


def lang_of(html):
    return 'fr' if re.search(r'<html lang="fr"', html) else 'en'


def build_page(path, tpl):
    html = path.read_text(encoding='utf-8')
    original = html
    lang = lang_of(html)
    t = tpl[lang]

    # The page's own language switch target (its translated counterpart)
    m = re.search(r'<a href="([^"]+)" class="nav-lang-link"', html)
    if not m:
        raise SystemExit(f'{path.name}: no language switch link found')
    counterpart = m.group(1)

    header = t['header']
    header = re.sub(r'(<a href=")[^"]+(" class="nav-lang-link")', r'\g<1>' + counterpart + r'\2', header)

    # Fonts and stylesheets
    html = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com" />\n'
                  r'(?:<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin />\n)?'
                  r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet" />\n',
                  FONTS, html, count=1)
    css = (f'<link rel="stylesheet" href="site.css?v={SITE_CSS_V}" />\n'
           f'<link rel="stylesheet" href="pages.css?v={PAGES_CSS_V}" />')
    html, n = re.subn(r'<link rel="stylesheet" href="styles\.css\?v=\d+" />'
                      r'|<link rel="stylesheet" href="site\.css\?v=\d+" />\n<link rel="stylesheet" href="pages\.css\?v=\d+" />',
                      css, html, count=1)
    if n != 1:
        raise SystemExit(f'{path.name}: stylesheet link not found')

    # Skip link, header, footer
    for key, pat, end in (('skip', r'<a class="skip-link"', '</a>'),
                          ('header', r'<header class="site-header"', '</header>'),
                          ('footer', r'<footer class="site-footer"', '</footer>')):
        span = block(html, pat, end)
        if not span:
            raise SystemExit(f'{path.name}: no {key} found')
        repl = header if key == 'header' else t[key]
        html = html[:span[0]] + repl + html[span[1]:]

    # Full width page hero band
    old_open = '<section class="page-hero container reveal">'
    if old_open in html:
        a = html.index(old_open)
        b = html.index('</section>', a)
        inner = html[a + len(old_open):b]
        html = (html[:a] + '<section class="page-hero">\n  <div class="wrap">' + inner +
                '  </div>\n</section>' + html[b + len('</section>'):])

    if html != original:
        path.write_text(html, encoding='utf-8')
        return True
    return False


def main():
    tpl = load_templates()
    pages = sorted(p for p in ROOT.glob('*.html') if p.name not in ('index.html', 'index-fr.html'))
    changed = [p.name for p in pages if build_page(p, tpl)]
    # Keep the homepages on the same site.css version
    for fn in ('index.html', 'index-fr.html'):
        p = ROOT / fn
        h = p.read_text(encoding='utf-8')
        h2 = re.sub(r'site\.css\?v=\d+', f'site.css?v={SITE_CSS_V}', h)
        if h2 != h:
            p.write_text(h2, encoding='utf-8')
            changed.append(fn)
    print(f'{len(changed)} page(s) updated')
    for c in changed:
        print('  ' + c)


if __name__ == '__main__':
    sys.exit(main())
