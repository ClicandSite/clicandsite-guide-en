#!/usr/bin/env python3
"""Index de la recherche (assets/search.json) — à relancer après chaque ajout/renommage de page.
Lancement : python3 _outils/search_index.py [dossier_du_site]"""
import glob, html, json, os, re, sys
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
def txt(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
out = []
for f in sorted(glob.glob(os.path.join(ROOT, '**', 'index.html'), recursive=True)):
    rel = os.path.relpath(os.path.dirname(f), ROOT).replace(os.sep, '/')
    if rel == '.' or rel.split('/')[0] in ('admin',) or rel.startswith(('.', '_')): continue
    s = open(f, encoding='utf-8').read()
    if 'noindex' in (re.search(r'<meta name="robots"[^>]*>', s) or [''])[0]: continue
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    t = txt(h1.group(1)) if h1 else txt(re.search(r'<title>(.*?)</title>', s, re.S).group(1)).split(' | ')[0]
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    d = html.unescape(d.group(1)) if d else ''
    r = ''
    for m in re.finditer(r'"@type":\s*"BreadcrumbList".*?"itemListElement":\s*(\[.*?\])\s*}', s, re.S):
        try:
            it = json.loads(m.group(1))
            if len(it) > 2: r = it[1].get('name', '')
        except Exception: pass
    out.append({'t': t, 'u': '/' + rel + '/', 'r': r, 'd': d[:120]})
json.dump(out, open(os.path.join(ROOT, 'assets', 'search.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'pages indexées')
