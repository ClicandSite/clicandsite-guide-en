#!/usr/bin/env python3
"""Bloc « Mis à jour récemment » de l'accueil (8 pages les plus récentes du sitemap).
À lancer après sitemap_dates.py : python3 _outils/maj_accueil.py [dossier]"""
import html, json, os, re, sys
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
idx = {x['u']: x for x in json.load(open(os.path.join(ROOT, 'assets', 'search.json'), encoding='utf-8'))}
sm = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
f = os.path.join(ROOT, 'index.html'); s = open(f, encoding='utf-8').read()
en = '<html lang="en' in s
rows = []
for loc, lm in re.findall(r'<loc>https://[^/]+(/[^<]*)</loc><lastmod>([^<]+)</lastmod>', sm):
    if loc.count('/') < 3 or loc not in idx: continue      # ni accueil ni pages régions
    rows.append((lm, loc))
rows.sort(key=lambda r: (r[0], r[1]), reverse=True)
M = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
ME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
def d(lm):
    y, m, j = lm.split('-'); return f'{int(j)} {ME[int(m)-1]}' if en else f'{int(j)} {M[int(m)-1]}'
li = ''.join(f'<li><a href="{loc[1:]}">{html.escape(idx[loc]["t"])}</a> <span class="maj__d">{d(lm)}</span></li>' for lm, loc in rows[:8])
t = 'Recently updated' if en else 'Mis à jour récemment'
blk = f'<!-- maj:debut --><section class="wrap maj" aria-labelledby="maj-t"><h2 id="maj-t" class="sec-title">{t}</h2><ul class="maj__l">{li}</ul></section><!-- maj:fin -->'
if '<!-- maj:debut -->' in s: s = re.sub(r'<!-- maj:debut -->.*?<!-- maj:fin -->', blk, s, flags=re.S)
else: s = s.replace('\n</main>', '\n' + blk + '\n</main>', 1)
open(f, 'w', encoding='utf-8').write(s); print('accueil : %d pages récentes' % min(8, len(rows)))
