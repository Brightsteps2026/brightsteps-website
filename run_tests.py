import glob, re, json, os
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

results = []
def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append((status, name, detail))

files = sorted(glob.glob("*.html"))

# 1. Exactly one H1 per page
bad = [f for f in files if len(re.findall(r'<h1[\s>]', open(f, encoding="utf-8").read())) != 1]
check("Every page has exactly one H1", not bad, bad)

# 2. No duplicate IDs
class IdCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k == 'id':
                self.ids.append(v)
bad = []
for f in files:
    c = IdCheck()
    c.feed(open(f, encoding="utf-8").read())
    dupes = set(x for x in c.ids if c.ids.count(x) > 1)
    if dupes:
        bad.append((f, dupes))
check("No duplicate IDs on any page", not bad, bad)

# 3. Unique title per page
titles = {}
for f in files:
    html = open(f, encoding="utf-8").read()
    m = re.search(r'<title>([^<]*)</title>', html)
    if m:
        titles.setdefault(m.group(1), []).append(f)
dupe_titles = {t: fs for t, fs in titles.items() if len(fs) > 1}
check("Every page has a unique <title>", not dupe_titles, dupe_titles)

# 4. Unique meta description per page
descs = {}
for f in files:
    html = open(f, encoding="utf-8").read()
    m = re.search(r'name="description" content="([^"]*)"', html)
    if m:
        descs.setdefault(m.group(1), []).append(f)
dupe_descs = {d: fs for d, fs in descs.items() if len(fs) > 1}
check("Every page has a unique meta description", not dupe_descs, dupe_descs)

# 5. Canonical present on every page
bad = [f for f in files if '<link rel="canonical"' not in open(f, encoding="utf-8").read()]
check("Every page has a canonical link", not bad, bad)

# 6. Reciprocal hreflang
DOMAIN = "https://www.bischoolci.org"
def canon_url(fname):
    return DOMAIN + "/" if fname == "index.html" else f"{DOMAIN}/{fname}"
data = {}
for f in files:
    html = open(f, encoding="utf-8").read()
    canon = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    hreflangs = dict(re.findall(r'hreflang="([^"]*)" href="([^"]*)"', html))
    data[f] = {"canonical": canon.group(1) if canon else None, "hreflangs": hreflangs}
bad = []
for f, d in data.items():
    en_url, fr_url = d["hreflangs"].get("en"), d["hreflangs"].get("fr")
    fr_file = next((f2 for f2, d2 in data.items() if d2["canonical"] == fr_url), None)
    en_file = next((f2 for f2, d2 in data.items() if d2["canonical"] == en_url), None)
    if fr_file and data[fr_file]["hreflangs"].get("en") != en_url:
        bad.append(f)
    if not fr_file or not en_file:
        bad.append(f)
check("Reciprocal hreflang across all EN/FR pairs", not bad, bad)

# 7. Internal links resolve to real files
bad = []
for f in files:
    html = open(f, encoding="utf-8").read()
    for href in re.findall(r'href="([a-zA-Z0-9_\-]+\.html)"', html):
        if not os.path.exists(href):
            bad.append((f, href))
check("Every internal .html link resolves to a real file", not bad, bad)

# 8. Referenced images/scripts/styles resolve
bad = []
for f in files:
    html = open(f, encoding="utf-8").read()
    for src in re.findall(r'(?:src|href)="([^"?]+\.(?:jpg|jpeg|png|webp|avif|css|js|pdf|ico))', html):
        path = src.lstrip("/")
        if not os.path.exists(path):
            bad.append((f, src))
check("Every referenced image/script/style/pdf file exists", not bad, bad)

# 9. All informative images have alt text (non-empty unless decorative pattern)
bad = []
for f in files:
    html = open(f, encoding="utf-8").read()
    for m in re.finditer(r'<img\s+([^>]*)/?>', html):
        attrs = m.group(1)
        if 'alt=' not in attrs:
            bad.append((f, attrs[:60]))
check("Every <img> has an alt attribute", not bad, bad)

# 10. Form fields have labels (check for/id pairing on enroll & contact forms, excluding hidden inputs)
bad = []
for f in ["enroll.html", "enroll-fr.html", "contact-us.html", "contact-us-fr.html"]:
    html = open(f, encoding="utf-8").read()
    visible_fields = re.findall(r'<(input|select|textarea)([^>]*)\bid="([^"]+)"', html)
    ids = {fid for tag, attrs, fid in visible_fields if 'type="hidden"' not in attrs}
    labelfors = set(re.findall(r'<label[^>]*\bfor="([^"]+)"', html))
    missing = ids - labelfors
    if missing:
        bad.append((f, missing))
check("Every visible form field has a matching <label for>", not bad, bad)

# 11. robots.txt valid
robots = open("robots.txt", encoding="utf-8").read()
check("robots.txt exists and references sitemap", "Sitemap:" in robots and "Allow: /" in robots)

# 12. sitemap.xml valid XML
try:
    tree = ET.parse("sitemap.xml")
    urls = tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
    check("sitemap.xml is valid XML with URLs", len(urls) == len(files), f"{len(urls)} URLs vs {len(files)} pages")
except Exception as e:
    check("sitemap.xml is valid XML with URLs", False, str(e))

# 13. favicon.ico exists
check("favicon.ico exists", os.path.exists("favicon.ico"))

# 14. Security headers present
vercel = json.load(open("vercel.json"))
main_headers = {}
for h in vercel["headers"]:
    if h["source"] == "/(.*)":
        main_headers = {hdr["key"]: hdr["value"] for hdr in h["headers"]}
required = ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"]
missing = [r for r in required if r not in main_headers]
check("All required security headers present", not missing, missing)
check("X-Frame-Options or frame-ancestors present", "X-Frame-Options" in main_headers or "frame-ancestors" in main_headers.get("Content-Security-Policy", ""))

# 15. No unsafe-eval in CSP
check("CSP contains no unsafe-eval", "unsafe-eval" not in main_headers.get("Content-Security-Policy", ""))

# 16. /index.html redirect configured
check("/index.html -> / redirect configured", any(r["source"] == "/index.html" for r in vercel.get("redirects", [])))

# 17. No mixed content (http://)
bad = []
for f in files:
    html = open(f, encoding="utf-8").read()
    if re.search(r'(?:src|href)="http://', html):
        bad.append(f)
check("No mixed content (http://) references", not bad, bad)

# 18. No inline event handler attributes (would silently fail under current CSP)
bad = []
for f in files:
    html = open(f, encoding="utf-8").read()
    if re.search(r'\son(click|load|error|change|submit)=', html):
        bad.append(f)
check("No inline event handler attributes", not bad, bad)

# 19. CSS/JS version query strings match (cache-busting sanity check)
css_versions = set()
js_versions = set()
for f in files:
    html = open(f, encoding="utf-8").read()
    m1 = re.search(r'styles\.css\?v=(\d+)', html)
    m2 = re.search(r'script\.js\?v=(\d+)', html)
    if m1: css_versions.add(m1.group(1))
    if m2: js_versions.add(m2.group(1))
check("All pages reference the same styles.css version", len(css_versions) == 1, css_versions)
check("All pages reference the same script.js version", len(js_versions) == 1, js_versions)

# ---- Report ----
passed = sum(1 for r in results if r[0] == "PASS")
failed = sum(1 for r in results if r[0] == "FAIL")
print(f"\n{'='*60}\nRESULTS: {passed} passed, {failed} failed\n{'='*60}\n")
for status, name, detail in results:
    marker = "✓" if status == "PASS" else "✗"
    print(f"[{marker}] {name}")
    if status == "FAIL":
        print(f"      -> {detail}")
