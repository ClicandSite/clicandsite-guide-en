"""Met la date <lastmod> du sitemap à la date du dernier commit de chaque page.
Usage : python3 _outils/sitemap_dates.py <dossier du dépôt> <domaine>"""
import re, subprocess, sys, os
root, dom = sys.argv[1], sys.argv[2]
p = os.path.join(root, 'sitemap.xml'); s = open(p).read(); n = 0
def fix(m):
    global n
    url, old = m.group(1), m.group(2)
    rel = url.replace(dom, '').strip('/')
    f = os.path.join(rel, 'index.html') if rel else 'index.html'
    d = subprocess.run(['git', '-C', root, 'log', '-1', '--format=%cs', '--', f], capture_output=True, text=True).stdout.strip()
    if d and d != old: n += 1; return f'<loc>{url}</loc><lastmod>{d}</lastmod>'
    return m.group(0)
s = re.sub(r'<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>', fix, s)
open(p, 'w').write(s); print(root, n, 'dates mises à jour')
