#!/usr/bin/env python3
"""Contrôle qualité et SEO de Clic&Site (clicandsite.fr et clicandsite.com).

Lancement : python3 _outils/controle.py [dossier_du_site]
Le même fichier sert aux deux dépôts (la langue est détectée toute seule).
Code de sortie 1 s'il y a au moins une ERREUR (le workflow GitHub échoue et GitHub prévient par e-mail).
Les AVERTISSEMENTS sont listés mais ne bloquent pas.

Contrôles :
  1. Pages qui se font concurrence (titres trop proches)
  2. Données déclarées à Google : JSON-LD valide, fil d'Ariane, FAQ = FAQ visible, fiche éditeur (Organization)
  3. FAQ : questions ou réponses répétées, réponses copiées sur plusieurs pages, questions hors sujet
  4. Titres et descriptions : présents, longueur, uniques ; un seul h1
  5. Pages À propos, mentions légales (éditeur, hébergeur, RGPD, cookies) ; CGV non exigées (le site ne vend rien)
  6. Liens partenaires : pas de recherche Viator, pas de recherche GetYourGuide, identifiants partenaire présents
  7. Consentement : le module GetYourGuide passe par /assets/gyg.js, jamais chargé directement
  8. Liens internes cassés, sitemap, hreflang, pages peu liées, contenu trop court, mentions interdites
"""
import collections, glob, html, json, os, re, subprocess, sys
from html.parser import HTMLParser

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
FR = os.path.isdir(os.path.join(ROOT, 'mentions-legales'))
LANG = 'fr' if FR else 'en'
DOMAIN = 'https://clicandsite.fr' if FR else 'https://clicandsite.com'
LEGAL = 'mentions-legales' if FR else 'legal-notice'
ABOUT = 'a-propos' if FR else 'about'
SKIP = {'admin'}
TITLE_MAX, DESC_MAX, DESC_MIN, WORDS_MIN = 70, 165, 70, 450
STOP = set('''le la les de des du un une et en au aux à a pour par sur dans avec sans the of and in to for on at with from
visiter visiting visit things do what voir que quoi faire guide clic site 2026 2027 paris france its son sa ses their your
your vos nos notre our how comment where où when quand d l'''.split())

errors, warnings = collections.defaultdict(list), collections.defaultdict(list)
def err(cat, msg): errors[cat].append(msg)
def warn(cat, msg): warnings[cat].append(msg)

def text(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
def norm(s):
    return re.sub(r'[\s  ]+', ' ', html.unescape(s)).strip().lower()
GENERIC = set('''ouverture horaires horaire tarifs tarif prix acces access forfait dates date musee museum ski station resort plage beach
marche market noel christmas billets tickets ticket conseils tips visite tour tours opening hours prices lift pass village jardin garden
chateau castle sentier path randonnee hike vue view itineraire route plages beaches sommet summit domaine portes soleil saison season
reserver book booking gratuit free jour jours day days nuit night ville town quartier vieux old
times events winter hiver agenda idees ideas'''.split())
import unicodedata
def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', norm(s)) if unicodedata.category(c) != 'Mn')
def words(s):
    return {w for w in re.findall(r"[a-z0-9]+", fold(s)) if w not in STOP and len(w) > 2}
def names(s):
    return words(s) - GENERIC

class H1(HTMLParser):
    def __init__(self): super().__init__(); self.n = 0
    def handle_starttag(self, t, a):
        if t == 'h1': self.n += 1

# ---------- lecture des pages
pages = {}
for f in sorted(glob.glob(os.path.join(ROOT, '**', 'index.html'), recursive=True)):
    rel = os.path.relpath(os.path.dirname(f), ROOT).replace(os.sep, '/')
    rel = '' if rel == '.' else rel
    if rel.split('/')[0] in SKIP or rel.startswith(('.', '_')): continue
    pages[rel] = open(f, encoding='utf-8').read()
if len(pages) < 50: err('Pages', f'seulement {len(pages)} pages trouvées dans {ROOT}')

# Nombre de pages : ne doit jamais baisser d'un commit à l'autre
try:
    prev = subprocess.run(['git', '-C', ROOT, 'ls-tree', '-r', '--name-only', 'HEAD~1'], capture_output=True, text=True)
    if prev.returncode == 0:
        n_prev = sum(1 for l in prev.stdout.splitlines() if l.endswith('index.html') and not l.startswith(('admin/', '_')))
        if len(pages) < n_prev: err('Pages', f'{n_prev - len(pages)} page(s) supprimée(s) depuis le commit précédent ({n_prev} → {len(pages)})')
except Exception: pass

titles, descs, faq_answers, inlinks = {}, {}, collections.defaultdict(set), collections.Counter()
faq_items, placename = [], {}
for rel, s in pages.items():
    where = rel or '(accueil)'
    is_guide = rel.count('/') == 1 and rel not in (LEGAL, ABOUT)
    # --- titre / description / h1
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    t = html.unescape(m.group(1)).strip() if m else ''
    if not t: err('Titres', f'{where} : pas de <title>')
    elif len(t) > TITLE_MAX: err('Titres', f'{where} : titre de {len(t)} caractères (max {TITLE_MAX}) « {t} »')
    titles[rel] = t
    m = re.search(r'<meta name="description" content="([^"]*)"', s)
    d = html.unescape(m.group(1)).strip() if m else ''
    if not d: err('Descriptions', f'{where} : pas de meta description')
    elif len(d) > DESC_MAX: err('Descriptions', f'{where} : description de {len(d)} caractères (max {DESC_MAX})')
    elif len(d) < DESC_MIN: warn('Descriptions', f'{where} : description courte ({len(d)} caractères)')
    descs[rel] = d
    p = H1(); p.feed(s)
    if p.n != 1: err('Structure', f'{where} : {p.n} balises h1 (il en faut une)')
    if not re.search(r'<link rel="canonical" href="' + re.escape(DOMAIN), s): err('Structure', f'{where} : canonical absent ou mauvais domaine')
    if 'hreflang=' not in s: warn('Structure', f'{where} : pas de hreflang')

    # --- JSON-LD
    lds = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            j = json.loads(block)
            lds.extend(j if isinstance(j, list) else j.get('@graph', [j]))
        except Exception as e:
            err('Données Google', f'{where} : JSON-LD invalide ({e})')
    types = {x.get('@type') for x in lds if isinstance(x, dict)}
    if rel and 'BreadcrumbList' not in types: err('Données Google', f'{where} : pas de fil d\'Ariane (BreadcrumbList)')
    for x in lds:
        if isinstance(x, dict) and x.get('@type') == 'BreadcrumbList':
            for it in x.get('itemListElement', []):
                u = it.get('item', '')
                if isinstance(u, dict): u = u.get('@id', '')
                if u and not u.startswith(DOMAIN): err('Données Google', f'{where} : fil d\'Ariane vers un autre domaine ({u})')
    for x in lds:
        if isinstance(x, dict) and x.get('@type') in ('TouristAttraction', 'TouristDestination') and rel.count('/') == 1:
            placename[rel] = x.get('name', '')
    if rel == '' and 'Organization' not in types: err('Données Google', 'accueil : fiche éditeur (Organization) absente')
    if is_guide and not types & {'TouristAttraction', 'TouristDestination', 'Article', 'Event'}:
        warn('Données Google', f'{where} : pas de type de lieu (TouristAttraction…)')

    # --- FAQ visible vs FAQ déclarée
    vis = [(norm(text(q)), norm(text(a))) for q, a in re.findall(r'<details[^>]*>\s*<summary[^>]*>(.*?)</summary>(.*?)</details>', s, re.S)]
    ld_faq = []
    for x in lds:
        if isinstance(x, dict) and x.get('@type') == 'FAQPage':
            for q in x.get('mainEntity', []):
                ld_faq.append((norm(text(q.get('name', ''))), norm(text(q.get('acceptedAnswer', {}).get('text', '')))))
    if ld_faq or vis:
        if not ld_faq: warn('FAQ', f'{where} : FAQ visible non déclarée à Google (FAQPage absent)')
        elif not vis: err('FAQ', f'{where} : FAQPage déclaré sans FAQ visible sur la page')
        else:
            vq = {q for q, _ in vis}
            for q, a in ld_faq:
                if q not in vq: err('FAQ', f'{where} : question déclarée absente de la page « {q[:70]} »')
                elif dict(vis)[q] != a: err('FAQ', f'{where} : réponse déclarée différente de la réponse visible « {q[:60]} »')
        qs = [q for q, _ in vis]; ans = [a for _, a in vis]
        for q, c in collections.Counter(qs).items():
            if c > 1: err('FAQ', f'{where} : question en double « {q[:70]} »')
        for a, c in collections.Counter(ans).items():
            if c > 1: err('FAQ', f'{where} : même réponse à {c} questions « {a[:60]} »')
        for q, a in vis:
            if len(a) > 40: faq_items.append((where, q, a))
    # --- liens partenaires
    for h in re.findall(r'href="([^"]+)"', s):
        hu = html.unescape(h)
        if 'viator.com' in hu:
            if 'searchResults' in hu: err('Liens partenaires', f'{where} : lien Viator vers une recherche ({hu[:90]})')
            if '/tours/' in hu or '-ttd' in hu:
                if 'pid=P00331213' not in hu or 'mcid=42383' not in hu: err('Liens partenaires', f'{where} : lien Viator sans pid/mcid ({hu[:90]})')
        if 'getyourguide.' in hu and 'widget.getyourguide' not in hu:
            if '/s/' in hu or '/s?' in hu: err('Liens partenaires', f'{where} : lien GetYourGuide vers une recherche ({hu[:90]})')
            if 'partner_id=XMYSXGR' not in hu: err('Liens partenaires', f'{where} : lien GetYourGuide sans partner_id ({hu[:90]})')
    # --- consentement GetYourGuide
    if 'pa.umd.production' in s: err('Consentement', f'{where} : module GetYourGuide chargé sans accord (pa.umd directement dans la page)')
    if 'data-gyg-widget' in s and '/assets/gyg.js' not in s: err('Consentement', f'{where} : encadré GetYourGuide sans /assets/gyg.js')
    # --- mentions interdites hors pages légales
    if rel != LEGAL and re.search(r'sans (aucun )?surcoût|no extra cost|at no (extra )?cost to you', s, re.I):
        err('Mentions', f'{where} : mention « sans surcoût » interdite (seulement « Liens partenaires. »)')
    # --- contenu
    main = re.search(r'<main.*?</main>', s, re.S)
    nw = len(text(main.group(0)).split()) if main else 0
    if is_guide and nw < WORDS_MIN and '/index' not in rel: warn('Contenu court', f'{where} : {nw} mots')
    # --- liens internes
    targets = set()
    for h in re.findall(r'href="([^"#?]*)(?:[#?][^"]*)?"', s):
        if not h or h.startswith(('http', 'mailto:', 'tel:', 'javascript:', 'data:')): continue
        path = os.path.normpath(os.path.join('/' + rel, h) if not h.startswith('/') else h)
        p2 = path.strip('/')
        full = os.path.join(ROOT, p2)
        if os.path.isfile(full): continue
        if os.path.isfile(os.path.join(full, 'index.html')):
            if p2 != rel: targets.add(p2)
            continue
        err('Liens internes', f'{where} : lien cassé « {h} »')
    for x in targets: inlinks[x] += 1

# ---------- contrôles sur l'ensemble du site
# Titres et descriptions en double
for label, dic in (('Titres', titles), ('Descriptions', descs)):
    rev = collections.defaultdict(list)
    for r, v in dic.items():
        if v: rev[v].append(r or '(accueil)')
    for v, rs in rev.items():
        if len(rs) > 1: err(label, f'identique sur {len(rs)} pages : {", ".join(rs[:5])} « {v[:60]} »')
# Pages qui se font concurrence :
#  (a) le titre d'une page contient le nom d'une autre page (ex. « Montmartre et le Sacré-Cœur » contre la page Sacré-Cœur)
#  (b) deux titres partagent l'essentiel de leurs noms propres
keys = [r for r in titles if r.count('/') == 1]
tn = {r: names(titles[r].split('|')[0]) for r in keys}
slugw = {r: names(r.split('/')[1].replace('-', ' ')) for r in keys}
# un « pôle » (ville, région) est cité dans le titre de plusieurs pages : être cité par ses sous-pages est normal
pop = collections.Counter()
for b in keys:
    for a in keys:
        if a != b and slugw[b] and slugw[b] <= names(titles[a].split('|')[0]): pop[b] += 1
seen = set()
for a in keys:
    full = titles[a].split('|')[0]
    head = names(re.split(r'\s*[:\u2013\u2014]\s*', full)[0]); alln = names(full)
    cited = []
    for b in keys:
        if a == b or a.split('/')[0] != b.split('/')[0]: continue
        sb = slugw[b]
        if not sb or sb <= slugw[a] or len(' '.join(sb)) < 6 or pop[b] >= 2: continue
        if sb <= head: cited.append((b, 'tête'))
        elif sb <= alln: cited.append((b, 'liste'))
    # cannibalisation : le sujet d'une autre page dans la partie principale du titre,
    # ou au moins 3 autres pages citées dans le même titre
    for b, where_ in cited:
        if where_ == 'tête':
            warn('Pages concurrentes', f'{a} : son titre vise aussi le sujet de {b} « {full.strip()} »'); seen.add((a, b))
    if sum(1 for _, w in cited if w == 'liste') >= 3:
        warn('Pages concurrentes', f'{a} : son titre cite {len(cited)} sujets qui ont leur propre page ({", ".join(b for b, _ in cited)}) « {full.strip()} »')
for i, a in enumerate(keys):
    for b in keys[i + 1:]:
        A, B = tn[a], tn[b]
        if len(A) < 2 or len(B) < 2 or (a, b) in seen or (b, a) in seen: continue
        if len(A & B) >= 2 and len(A & B) / len(A | B) >= 0.5:
            warn('Pages concurrentes', f'{a} ↔ {b} : titres proches « {" ".join(sorted(A & B))} »')
# Réponses de FAQ copiées sur plusieurs pages ; FAQ hors sujet (parle d'un autre lieu du guide, pas du sien)
for where, q, a in faq_items: faq_answers[a].add(where)
for a, ws in faq_answers.items():
    if len(ws) >= 3: warn('FAQ répétées', f'même réponse sur {len(ws)} pages ({", ".join(sorted(ws)[:4])}…) « {a[:60]} »')
pn = {r: names(n) for r, n in placename.items() if len(names(n)) >= 1}
for where, q, a in faq_items:
    if where.split('/')[0] in ('idees', 'ideas'): continue  # pages d'idées : elles renvoient vers d'autres lieux par nature
    own = pn.get(where, set()) | names(titles.get(where, '').split('|')[0]) | slugw.get(where, set())
    qa = names(q + ' ' + a)
    if own & qa: continue
    others = [r for r, n in pn.items() if r != where and len(' '.join(n)) >= 6 and n <= qa and not n <= own]
    if others: warn('FAQ hors sujet ?', f'{where} : « {q[:60]} » parle de {", ".join(others[:2])} sans citer son propre sujet')
# Pages peu liées
for r in pages:
    if r.count('/') == 1 and inlinks[r] < 2 and r not in (LEGAL, ABOUT):
        warn('Pages peu liées', f'{r} : {inlinks[r]} lien(s) entrant(s)')
# Sitemap
sm = os.path.join(ROOT, 'sitemap.xml')
if not os.path.isfile(sm): err('Sitemap', 'sitemap.xml absent')
else:
    locs = re.findall(r'<loc>([^<]+)</loc>', open(sm, encoding='utf-8').read())
    paths = {l.replace(DOMAIN, '').strip('/') for l in locs}
    for l in locs:
        if not l.startswith(DOMAIN): err('Sitemap', f'URL d\'un autre domaine : {l}')
    for p in paths - set(pages): err('Sitemap', f'URL du sitemap sans page : {p or "(accueil)"}')
    for p in set(pages) - paths:
        if not re.search(r'name="robots" content="[^"]*noindex', pages[p]): err('Sitemap', f'page absente du sitemap : {p or "(accueil)"}')
rb = os.path.join(ROOT, 'robots.txt')
if not os.path.isfile(rb) or 'Sitemap:' not in open(rb).read(): err('Sitemap', 'robots.txt absent ou sans ligne Sitemap')

# Pages À propos et mentions légales
def need(rel, items, cat):
    s = pages.get(rel)
    if s is None: err(cat, f'page {rel} absente'); return
    t = norm(text(s))
    for label, pat in items:
        if not re.search(pat, t): err(cat, f'{rel} : il manque {label}')
if FR:
    need(LEGAL, [('l\'éditeur', r'éditeur'), ('le numéro RCS', r'rcs'), ('le siège social', r'siège'), ('le directeur de la publication', r'directeur de la publication'),
                 ('l\'hébergeur', r'hébergé par'), ('l\'adresse de contact', r'@clicandsite\.fr'), ('les liens affiliés', r'liens affiliés'),
                 ('le responsable du traitement', r'responsable du traitement'), ('vos droits', r'droit d.accès'), ('la cnil', r'cnil'), ('les cookies', r'cookie'), ('les crédits photos', r'crédits photos')], 'Mentions légales')
    need(ABOUT, [('la méthode', r'méthode'), ('l\'indépendance', r'indépendance'), ('le contact', r'@clicandsite\.fr'), ('les liens partenaires', r'liens partenaires')], 'À propos')
else:
    need(LEGAL, [('the publisher', r'publisher'), ('the RCS number', r'rcs'), ('the registered office', r'registered office'), ('the publication director', r'publication director'),
                 ('the host', r'hosted by'), ('the contact address', r'@clicandsite\.fr'), ('affiliate links', r'affiliate links'),
                 ('the data controller', r'data controller'), ('your rights', r'right to access'), ('the cnil', r'cnil'), ('cookies', r'cookie'), ('photo credits', r'photo')], 'Mentions légales')
    need(ABOUT, [('the method', r'method'), ('independence', r'independence'), ('contact', r'@clicandsite\.fr'), ('partner links', r'partner links')], 'À propos')
if LEGAL in pages and 'id="cookies"' not in pages[LEGAL]: err('Mentions légales', f'{LEGAL} : ancre #cookies absente (lien depuis l\'encadré GetYourGuide)')
if LEGAL in pages and 'cs-revoke' not in pages[LEGAL]: err('Mentions légales', f'{LEGAL} : bouton de retrait de l\'accord GetYourGuide absent')
if not os.path.isfile(os.path.join(ROOT, 'assets', 'gyg.js')): err('Consentement', 'assets/gyg.js absent')
# CGV : le site ne vend rien (réservations chez GetYourGuide / Viator) -> pas de CGV exigées.


# ---------- recherche (assets/search.js + assets/search.json à jour)
try:
    _idx = {x['u'] for x in json.load(open(os.path.join(ROOT, 'assets', 'search.json'), encoding='utf-8'))}
except Exception as e:
    _idx = None; err('Recherche', f'assets/search.json illisible ou absent ({e}) : lancer _outils/search_index.py')
for rel, s in pages.items():
    if 'assets/stats.js' in s and 'assets/search.js' not in s: err('Recherche', f'{rel or "(accueil)"} : script de recherche absent (ajouter <script src="/assets/search.js?v=1" defer></script> avant stats.js)')
    if _idx is not None and rel and '/' + rel + '/' not in _idx and 'noindex' not in s[:3000]: err('Recherche', f'{rel} : page absente de assets/search.json — relancer _outils/search_index.py')
for rel, s in pages.items():
    _m = re.search(r'<main.*?</main>', s, re.S)
    if _m:
        _h = collections.Counter(html.unescape(h) for h in re.findall(r'<a\b[^>]*href="(https://www\.(?:viator|getyourguide)[^"]*)"', _m.group(0)))
        _d = [h for h, c in _h.items() if c > 1]
        if _d: err('Liens partenaires', f'{rel or "(accueil)"} : {len(_d)} lien(s) partenaire(s) en double (lancer python3 _outils/dedup.py . -w)')
# ---------- rapport
print(f'Contrôle Clic&Site ({LANG}) : {len(pages)} pages\n')
ne = sum(len(v) for v in errors.values()); nw = sum(len(v) for v in warnings.values())
for title, dic in (('ERREURS', errors), ('AVERTISSEMENTS', warnings)):
    print(f'===== {title} : {sum(len(v) for v in dic.values())}')
    for cat in sorted(dic):
        print(f'-- {cat} ({len(dic[cat])})')
        for m in dic[cat][:40]: print('   ' + m)
        if len(dic[cat]) > 40: print(f'   … et {len(dic[cat]) - 40} autres')
print(f'\nRésultat : {ne} erreur(s), {nw} avertissement(s)')
gs = os.environ.get('GITHUB_STEP_SUMMARY')
if gs:
    with open(gs, 'a') as fh:
        fh.write(f'## Contrôle Clic&Site ({LANG})\n\n{len(pages)} pages · **{ne} erreur(s)** · {nw} avertissement(s)\n\n')
        for title, dic in (('Erreurs', errors), ('Avertissements', warnings)):
            for cat in sorted(dic):
                fh.write(f'### {title} · {cat} ({len(dic[cat])})\n' + ''.join(f'- {m}\n' for m in dic[cat][:40]) + '\n')
sys.exit(1 if ne else 0)
