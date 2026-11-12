/* MyCreativeSite · moteur de contenu des sites clients (06/11/2026).
   - CSEdit.extract(doc)        : lit le contenu modifiable d'une page (textes, chiffres, prix, horaires, coordonnées, photos)
   - CSEdit.apply(doc, content) : applique un contenu enregistré à la page
   - Sur un site client, ce script se charge avec data-site="identifiant" : il récupère le contenu publié
     depuis l'espace client et met la page à jour. Aucune donnée personnelle n'est lue ni envoyée. */
(function () {
  var API = 'https://avcynjwcyygygkjuxsdt.supabase.co';
  var KEY = 'sb_publishable_fdSM-pnUtZRKX7K6nOf5Ag_i1TQgqLO';

  function q(root, sel) { try { return root.querySelector(sel); } catch (e) { return null; } }
  function qa(root, sel) { try { return [].slice.call(root.querySelectorAll(sel)); } catch (e) { return []; } }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function setTxt(el, v) { if (el && typeof v === 'string') el.textContent = v.slice(0, 2000); }
  function safeUrl(u) { return typeof u === 'string' && /^(https:\/\/|blob:|data:image\/(jpeg|png|webp);base64,)/.test(u) ? u : null; }
  function setImg(el, u) {
    if (!el) return;
    // 09/11/2026 (Anthony) : photo retirée par le pro (sauf la photo d'accueil, qui revient à celle du modèle)
    if (u === 'none') { if (!el.classList.contains('hero')) el.style.display = 'none'; return; }
    el.style.display = '';
    u = safeUrl(u); if (u) el.style.setProperty('--img', 'url("' + u.replace(/"/g, '%22') + '")');
  }
  // 09/11/2026 (Anthony) : cadrage choisi par le pro (point central de la photo, en %), un réglage ordinateur et un réglage téléphone.
  // Marche quel que soit le style : photo sur le bloc, sur ::before / ::after, ou en bandeau sur téléphone (sans déformer l'image).
  // « x y » ou « x y z » : point visible en % et taille z (0 = photo entière, 100 = remplit tout le bloc)
  function okPos(v) { var m = typeof v === 'string' && v.match(/^(\d{1,3}) (\d{1,3})(?: (\d{1,3}))?$/); return m ? [Math.min(100, +m[1]), Math.min(100, +m[2]), m[3] === undefined ? 100 : Math.min(200, +m[3])] : null; }
  function layers(bi) { var out = [], d = 0, cur = ''; for (var i = 0; i < bi.length; i++) { var ch = bi[i]; if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; }
  function natSize(w, url, cb) { var c = w.__csNat || (w.__csNat = {}); if (c[url]) return cb(c[url]); var im = new w.Image(); im.onload = function () { c[url] = [im.naturalWidth, im.naturalHeight]; cb(c[url]); }; im.src = url; }
  function setPos(el, pos, posM) {
    if (!el) return;
    var w = el.ownerDocument.defaultView; if (!w) return;
    el.__csPos = [okPos(pos), okPos(posM)];
    if (!w.__csPosEls) { w.__csPosEls = []; var t = null; w.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { w.__csPosEls.forEach(posFix); }, 80); }); }
    if (w.__csPosEls.indexOf(el) < 0) w.__csPosEls.push(el);
    posFix(el);
  }
  function posFix(el) {
    var doc = el.ownerDocument, w = doc.defaultView;
    if (!doc.getElementById('cs-pos-css')) { var st = doc.createElement('style'); st.id = 'cs-pos-css'; st.textContent = '.cs-pb::before{background-position:var(--cs-pos)!important}.cs-pa::after{background-position:var(--cs-pos)!important}.cs-pz.cs-pb::before,.cs-pz.cs-pa::after{background-size:var(--cs-size)!important;background-repeat:no-repeat!important}'; (doc.head || doc.documentElement).appendChild(st); }
    el.style.backgroundPosition = ''; el.style.backgroundSize = ''; el.style.backgroundRepeat = ''; el.classList.remove('cs-pb', 'cs-pa', 'cs-pz');
    var P = el.__csPos || [], mob = !!(w.matchMedia && w.matchMedia('(max-width:860px)').matches), p = (mob && P[1]) || P[0];
    var cs = w.getComputedStyle(el), sz = cs.backgroundSize.split(',').pop().trim(), band = /^100% (\d+)px$/.exec(sz);
    if (!p && !band) return;
    p = p || [50, 50, 100];
    var urlm = /url\(["']?(.*?)["']?\)\s*$/.exec(cs.getPropertyValue('--img') || '') || /url\(["']?(.*?)["']?\)/.exec(cs.backgroundImage), url = urlm && urlm[1];
    var sizeFor = function (W, H, nat) { var cov = Math.max(W / nat[0], H / nat[1]), fit = Math.min(W / nat[0], H / nat[1]), k = p[2] <= 100 ? fit + (cov - fit) * p[2] / 100 : cov * (1 + (p[2] - 100) / 100); return Math.round(nat[0] * k) + 'px ' + Math.round(nat[1] * k) + 'px'; };
    var val = p[0] + '% ' + p[1] + '%'; el.style.setProperty('--cs-pos', val);
    var n = (cs.backgroundImage.match(/(?:url|gradient)\(/g) || [1]).length;
    if (/url\(/.test(cs.backgroundImage)) {
      if (/cover/.test(sz)) {
        el.style.backgroundPosition = new Array(n).fill(val).join(', ');
        if (p[2] !== 100 && url) natSize(w, url, function (nat) { var px = sizeFor(el.clientWidth, el.clientHeight, nat); el.style.backgroundSize = layers(cs.backgroundImage).map(function (l) { return /^url/.test(l) ? px : '100% 100%'; }).join(', '); el.style.backgroundRepeat = 'no-repeat'; });
      }
      else if (band) {
        // bandeau en haut (téléphone) : l'image garde ses proportions et couvre le bandeau
        var m = /url\(["']?(.*?)["']?\)\s*$/.exec(cs.getPropertyValue('--img') || '') || /url\(["']?(.*?)["']?\)/.exec(cs.backgroundImage);
        if (m) { var im = new w.Image(); im.onload = function () {
          var H = +band[1], W = el.clientWidth || w.innerWidth, k = Math.max(W / im.naturalWidth, H / im.naturalHeight), bw = Math.round(im.naturalWidth * k), bh = Math.round(im.naturalHeight * k);
          el.style.backgroundSize = new Array(n).fill(bw + 'px ' + bh + 'px').join(', ');
          el.style.backgroundPosition = new Array(n).fill(p[0] + '% ' + Math.round(-(bh - H) * p[1] / 100) + 'px').join(', ');
        }; im.src = m[1]; }
      }
    }
    ['before', 'after'].forEach(function (ps) { var c = w.getComputedStyle(el, '::' + ps); if (/url\(/.test(c.backgroundImage) && /cover/.test(c.backgroundSize)) {
      el.classList.add(ps === 'before' ? 'cs-pb' : 'cs-pa');
      if (p[2] !== 100 && url) natSize(w, url, function (nat) { el.style.setProperty('--cs-size', sizeFor(parseFloat(c.width) || el.clientWidth, parseFloat(c.height) || el.clientHeight, nat)); el.classList.add('cs-pz'); });
    } });
  }

  // Champs simples : clé → sélecteur
  var TEXT = {
    logo: 'header.top .logo',
    kicker: '.photo.hero .kicker',
    title: '.photo.hero h1',
    subtitle: '.photo.hero p',
    team_t: '.team h2',
    team_d: '.team p',
    cta_t: '.cta h2',
    cta_d: '.cta p',
    address: '.addr .v',
    footer: 'footer .wrap > span:first-child',
    avis_t: '#avis .head h2',
    avis_d: '#avis .head p'
  };
  // Listes : conteneur d'éléments + champs de chaque élément
  var LISTS = {
    stats: { items: '.stats > .stat', f: { v: 'b', l: 'span' } },
    contacts: { items: '.cinfo > div', f: { l: '.l', v: '.v' } },
    cards: { items: '.cards > .card', f: { t: 'h3', d: 'p', p: '.price' }, img: '.photo', add: true },
    items: { items: '.vgrid > .car, .props > .prop', f: { t: 'h3', p: '.prx' }, meta: '.meta', img: '.photo', add: true },
    hours: { items: '.hrow', f: { l: 'span:nth-child(1)', v: 'span:nth-child(2)' }, add: true },
    reviews: { items: '#avis .reviews > .rev', f: { s: '.s', d: 'p', who: '.who' }, add: true },
    // 10/11/2026 (Anthony) : VTC, plusieurs véhicules (photo, nom, caractéristiques), jusqu'à 6
    fleet: { items: '#vehicule .veh', f: { t: 'h2' }, img: '.photo', rows: '.list > div', add: true, max: 6 }
  };
  // Avis Google (07/11/2026, comme sur le site EPS) : avis recopiés par le pro + note et liens vers sa fiche Google
  var DEF_AVIS = 'Ce que disent nos clients sur Google.';
  function gUrl(u) { return typeof u === 'string' && /^https:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl|g\.page)\//i.test(u.trim()) ? u.trim() : null; }
  function stars(n) { n = Math.max(1, Math.min(5, Math.round(n || 5))); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function google(doc, g) {
    var head = q(doc, '#avis .head'); if (!head) return;
    var old = q(head, '.cs-gg'); if (old) old.remove();
    g = g || {}; var url = gUrl(g.url), rv = gUrl(g.review), score = parseFloat(String(g.score || '').replace(',', '.'));
    if (!url && !rv) return;
    var box = doc.createElement('div'); box.className = 'cs-gg';
    box.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px';
    if (url) {
      var a = doc.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.style.cssText = 'display:inline-flex;align-items:baseline;gap:8px;color:inherit;text-decoration:none;font-weight:700';
      if (score > 0 && score <= 5) {
        var n = doc.createElement('span'); n.textContent = score.toFixed(1).replace('.', ','); n.style.fontSize = '1.7em';
        var st = doc.createElement('span'); st.textContent = stars(score); st.style.cssText = 'color:var(--accent);letter-spacing:2px'; st.setAttribute('aria-label', score + L(' sur 5', ' out of 5'));
        a.append(n, st);
      }
      var c = doc.createElement('span'); var cnt = parseInt(g.count, 10);
      c.textContent = EN ? (cnt > 0 ? cnt + ' reviews' : 'See our reviews') + ' on Google' : (cnt > 0 ? cnt + ' avis' : 'Voir nos avis') + ' sur Google'; c.style.cssText = 'font-weight:500;text-decoration:underline;opacity:.85';
      a.appendChild(c); box.appendChild(a);
    }
    if (rv) { var b = doc.createElement('a'); b.className = 'btn'; b.href = rv; b.target = '_blank'; b.rel = 'noopener'; b.textContent = L('Laisser un avis', 'Leave a review'); box.appendChild(b); }
    head.appendChild(box);
  }

  // 08/11/2026 : fiche détaillée des annonces et réalisations (tous les métiers à liste : immobilier, garage, bâtiment, beauté, bien-être, boulangerie, boutique, dépannage), lue et écrite dans data-fiche (voir cs-fiche.js)
  var FICHE = ['desc', 'feats', 'specs', 'dpe', 'dpe_v', 'ges', 'ges_v', 'energy', 'legal', 'ref']; // 08/11/2026 : specs = fiche technique (« Libellé : valeur » par ligne), remplie par l'onglet Mes véhicules / Mes biens
  function okPh(u) { return !!safeUrl(u) || (typeof u === 'string' && /^cls:[a-z]{1,2}\d{1,2}$/.test(u)); }
  function readFiche(el) { try { return JSON.parse(el.getAttribute('data-fiche') || '{}') || {}; } catch (e) { return {}; } }
  function readItem(el, def) {
    var o = {};
    Object.keys(def.f).forEach(function (k) { o[k] = txt(q(el, def.f[k])); });
    if (def.meta) o.meta = qa(el, def.meta + ' > span').map(txt).join(' · ');
    if (def.img) o.img = null;
    if (def.rows) o.rows = qa(el, def.rows).map(function (r) { var sp = qa(r, 'span'); return txt(sp[0]) + ' : ' + txt(sp[1]); }).join('\n');
    var immo = el.classList.contains('prop'), car = el.classList.contains('car');
    if (immo || car) {
      var f = readFiche(el);
      FICHE.forEach(function (k) { o[k] = typeof f[k] === 'string' ? f[k] : ''; });
      o.photos = (Array.isArray(f.photos) ? f.photos : []).filter(okPh);
      if (immo) { o.tr = el.dataset.tr || 'vente'; o.type = el.dataset.type || ''; o.city = el.dataset.city || ''; o.rooms = el.dataset.rooms || ''; o.tag = txt(q(el, '.tags .tag')); }
      else {
        if (el.hasAttribute('data-mk')) { o.mk = el.dataset.mk || ''; o.fuel = el.dataset.fuel || ''; }
        if (el.hasAttribute('data-type')) o.type = el.dataset.type || '';
        if (el.hasAttribute('data-city')) o.city = el.dataset.city || '';
        o.tag = txt(q(el, '.chip'));
      }
    }
    return o;
  }
  function writeFiche(el, o) {
    var immo = el.classList.contains('prop'), d = el.ownerDocument;
    if (immo) {
      if (typeof o.tr === 'string') el.dataset.tr = o.tr === 'location' ? 'location' : 'vente';
      if (typeof o.type === 'string') el.dataset.type = o.type.replace(/[^a-z]/g, '');
      if (typeof o.city === 'string') el.dataset.city = o.city.trim().slice(0, 60);
      if (o.rooms !== undefined) el.dataset.rooms = String(parseInt(o.rooms, 10) || 0);
      if (typeof o.tag === 'string') {
        var ph = q(el, '.photo'), tg = q(el, '.tags');
        if (!tg && ph && o.tag.trim()) { tg = d.createElement('div'); tg.className = 'tags'; ph.appendChild(tg); }
        if (tg) { var t = q(tg, '.tag'); if (!t) { t = d.createElement('span'); t.className = 'tag'; tg.appendChild(t); } qa(tg, '.tag').slice(1).forEach(function (x) { x.remove(); }); t.textContent = o.tag.trim().slice(0, 30); tg.hidden = !o.tag.trim(); }
      }
      if (typeof o.dpe === 'string') {
        var de = q(el, '.dpe'), b = de && q(de, 'b'), L = /^[A-G]$/.test(o.dpe) ? o.dpe : '';
        if (de) { de.hidden = !L; if (b && L) { b.className = 'dpe-' + L; b.textContent = L; } }
      }
    } else {
      if (typeof o.mk === 'string') el.dataset.mk = o.mk.trim().slice(0, 40);
      if (typeof o.fuel === 'string') el.dataset.fuel = o.fuel.trim().slice(0, 30);
      if (typeof o.type === 'string') el.dataset.type = o.type.trim().slice(0, 40);
      if (typeof o.city === 'string') el.dataset.city = o.city.trim().slice(0, 60);
      if (typeof o.p === 'string') el.dataset.pr = String(parseInt(o.p.replace(/[^\d,.]/g, '').replace(/[.,]\d{1,2}$/, '').replace(/\D/g, ''), 10) || 0);
      if (typeof o.tag === 'string') { var c = q(el, '.chip'); if (c) { c.textContent = o.tag.trim().slice(0, 30); c.hidden = !o.tag.trim(); } }
    }
    if (FICHE.some(function (k) { return o[k] !== undefined; }) || Array.isArray(o.photos)) {
      var f = readFiche(el), n = {};
      FICHE.forEach(function (k) { var v = o[k] !== undefined ? o[k] : f[k]; if (typeof v === 'string' && v.trim()) n[k] = v.slice(0, 6000); });
      var ph2 = Array.isArray(o.photos) ? o.photos : f.photos; n.photos = (Array.isArray(ph2) ? ph2 : []).filter(okPh).slice(0, 30);
      el.setAttribute('data-fiche', JSON.stringify(n));
    }
  }
  function writeItem(el, def, o) {
    if (def.rows && typeof o.rows === 'string') {
      var lb = q(el, '.list');
      if (lb) { lb.textContent = ''; o.rows.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 10).forEach(function (line) {
        var i = line.indexOf(':'), a = i > 0 ? line.slice(0, i).trim() : line, b = i > 0 ? line.slice(i + 1).trim() : '';
        var row = el.ownerDocument.createElement('div'), s1 = el.ownerDocument.createElement('span'), s2 = el.ownerDocument.createElement('span');
        s1.textContent = a.slice(0, 40); s2.textContent = b.slice(0, 80); row.append(s1, s2); lb.appendChild(row); }); }
    }
    Object.keys(def.f).forEach(function (k) { if (o[k] !== undefined) { var tg = q(el, def.f[k]); setTxt((tg && q(tg, 'a[data-cs-page]')) || tg, String(o[k])); } }); // 09/11/2026 : le lien vers la page de l'annonce (site généré) est gardé
    if (def.meta && typeof o.meta === 'string') {
      var box = q(el, def.meta);
      if (box) { box.textContent = ''; o.meta.split('·').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6).forEach(function (s) { var sp = el.ownerDocument.createElement('span'); sp.textContent = s; box.appendChild(sp); }); }
    }
    if (def.img) { var pe = q(el, def.img) || (el.classList.contains('photo') ? el : null); if (o.img) setImg(pe, o.img); else if (pe) { pe.style.display = ''; pe.style.removeProperty('--img'); } setPos(pe, o.pos); }
    if (el.classList.contains('prop') || el.classList.contains('car')) writeFiche(el, o);
  }
  /* 10/11/2026 (Anthony) : tous les autres petits textes du site sont modifiables (titres de rubriques, encadrés,
     libellés, boutons, menu…). content.tx = { "texte d'origine": "nouveau texte" }. On ne touche qu'aux éléments
     qui ne contiennent que du texte, hors des zones déjà gérées (textes principaux, listes, tarifs, avis). */
  var FREE_SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, OPTION: 1, SELECT: 1, TEXTAREA: 1, INPUT: 1, IFRAME: 1, svg: 1, SVG: 1, TITLE: 1 };
  function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function freeLeaves(doc) {
    if (!doc || !doc.body) return [];
    var ex = Object.keys(LISTS).map(function (k) { return LISTS[k].items; }).concat(['.prices', '#avis .reviews', '.cs-gg', '.cs-lang', '.cs-notr', '.cs-ie-ui', '#cs-pro', '[data-cs-empty]', '.mcs', '.picker', '#count', '#vcount', '[aria-live]', '[role=status]']).join(',');
    var tsel = Object.keys(TEXT).map(function (k) { return TEXT[k]; }).join(',');
    return qa(doc.body, '*').filter(function (el) {
      if (FREE_SKIP[el.tagName] || el.closest('svg')) return false;
      for (var i = 0; i < el.children.length; i++) if (el.children[i].tagName !== 'BR') return false;
      var t = el.getAttribute('data-cso') || norm(el.textContent);
      if (!t || t.length > 300 || /MyCreativeSite/i.test(t) || !/[A-Za-zÀ-ÿ]/.test(t)) return false;
      try { if (el.matches(tsel) || el.closest(ex)) return false; } catch (e) { return false; }
      return true;
    });
  }
  function freeApply(doc, tx) {
    tx = tx && typeof tx === 'object' ? tx : {};
    freeLeaves(doc).forEach(function (el) {
      var o = el.getAttribute('data-cso') || norm(el.textContent), v = tx[o];
      if (typeof v === 'string' && v !== o) { if (norm(el.textContent) !== v) el.textContent = v.slice(0, 600); el.setAttribute('data-cso', o); }
      else if (el.hasAttribute('data-cso')) { el.textContent = o; el.removeAttribute('data-cso'); }
    });
  }

  // Ajuste le nombre d'éléments d'une liste (copie du dernier / suppression)
  function fit(nodes, n, max) {
    n = Math.max(0, Math.min(n, max || 40));
    if (!nodes.length) return nodes;
    var parent = nodes[0].parentNode, last = nodes[nodes.length - 1];
    while (nodes.length < n) { var c = last.cloneNode(true); parent.insertBefore(c, last.nextSibling); last = c; nodes.push(c); }
    while (nodes.length > Math.max(n, 1)) nodes.pop().remove();
    nodes.forEach(function (e) { e.hidden = false; e.removeAttribute('data-cs-empty'); });
    if (n === 0) { nodes[0].hidden = true; nodes[0].setAttribute('data-cs-empty', ''); } // garde un modèle caché pour pouvoir en rajouter
    return n === 0 ? [] : nodes;
  }

  function extract(doc) {
    var c = { v: 1, text: {}, prices: [], photos: {} };
    Object.keys(TEXT).forEach(function (k) { var el = q(doc, TEXT[k]); if (el) c.text[k] = txt(el); });
    if (c.text.avis_d && /^Exemples/.test(c.text.avis_d)) c.text.avis_d = DEF_AVIS;
    if (q(doc, '#avis')) c.google = { url: '', review: '', score: '', count: '' };
    Object.keys(LISTS).forEach(function (k) { var d = LISTS[k]; var els = qa(doc, d.items); if (els.length) c[k] = els.map(function (e) { return readItem(e, d); }); });
    qa(doc, '.prices').forEach(function (box) {
      c.prices.push(qa(box, ':scope > .row').map(function (r) { return { t: txt(q(r, '.t')), d: txt(q(r, '.d')), p: txt(q(r, '.p')) }; }));
    });
    if (q(doc, '.photo.hero')) c.photos.hero = null;
    if (q(doc, '.team .photo')) c.photos.team = null;
    var g = qa(doc, '.gallery > .photo'); if (g.length) c.photos.gallery = g.map(function () { return null; });
    return c;
  }

  // 08/11/2026 : logo MyCreativeSite à côté de la mention « Site réalisé par MyCreativeSite » en bas de chaque site
  var MCS_LOGO = 'https://mycreativesite.fr/img/m-badge.webp';
  function credit(doc) {
    var f = q(doc, 'footer'); if (!f || q(f, '.mcs-logo')) return;
    var el = qa(f, 'a, span, p, small, div').filter(function (e) { return /MyCreativeSite/i.test(e.textContent) && !qa(e, 'a, span, p, small, div').some(function (k) { return /MyCreativeSite/i.test(k.textContent); }); })[0];
    if (!el) return;
    var img = doc.createElement('img'); img.className = 'mcs-logo'; img.src = MCS_LOGO; img.alt = ''; img.width = 18; img.height = 18; img.loading = 'lazy';
    img.style.cssText = 'width:18px;height:18px;vertical-align:-4px;margin-right:6px;display:inline-block';
    if (el.tagName === 'A') { el.insertBefore(img, el.firstChild); return; }
    var a = doc.createElement('a'); a.className = 'mcs'; a.href = 'https://mycreativesite.fr/'; a.target = '_blank'; a.rel = 'noopener';
    a.style.cssText = 'color:inherit;text-decoration:none;display:inline-flex;align-items:center';
    while (el.firstChild) a.appendChild(el.firstChild);
    a.insertBefore(img, a.firstChild); el.appendChild(a);
  }
  // 08/11/2026 (Anthony) : format « concession » des sites garage — vente de véhicules uniquement, sans atelier
  // (pas de vidange, pas de rendez-vous atelier) : on masque l'atelier et les boutons « Prendre RDV » mènent aux véhicules.
  function concession(doc, on) {
    ['#prestations', '#atelier', '#rdv'].forEach(function (sel) { var e = q(doc, sel); if (!e) return;
      if (on) { if (!e.hasAttribute('data-cs-conc')) { e.setAttribute('data-cs-conc', e.hidden ? '1' : '0'); } e.hidden = true; }
      else if (e.hasAttribute('data-cs-conc')) { e.hidden = e.getAttribute('data-cs-conc') === '1'; e.removeAttribute('data-cs-conc'); } });
    qa(doc, 'a[href="#prestations"]').forEach(function (a) { a.hidden = !!on; });
    qa(doc, 'a[href="#rdv"], a[data-cs-rdv]').forEach(function (a) {
      if (on) { if (!a.hasAttribute('data-cs-rdv')) a.setAttribute('data-cs-rdv', a.textContent); a.textContent = /prendre rendez-vous/i.test(a.getAttribute('data-cs-rdv')) ? 'Voir nos véhicules' : 'Nos véhicules'; a.setAttribute('href', '#vehicules'); }
      else if (a.hasAttribute('data-cs-rdv')) { a.textContent = a.getAttribute('data-cs-rdv'); a.removeAttribute('data-cs-rdv'); a.setAttribute('href', '#rdv'); } });
    // 09/11/2026 : encadré de contact du bas, texte atelier d'origine → texte concession (et inversement)
    var ch = q(doc, '#contact h2'), cp = ch && ch.nextElementSibling;
    var G = ['Un bruit, un voyant, une révision ?', 'Devis gratuit sous 24 h.'], C = ['Un véhicule vous intéresse ?', 'Essai, reprise, financement : réponse sous 24 h.'];
    if (ch) { var from = on ? G : C, to = on ? C : G; if (txt(ch) === from[0]) ch.textContent = to[0]; if (cp && txt(cp) === from[1]) cp.textContent = to[1]; }
  }
  // 09/11/2026 (Anthony) : version « atelier » des sites garage (formules Essentiel, Pro, Premium) : entretien seulement, sans véhicules à vendre
  function atelier(doc, on) {
    ['#vehicules', '#reprise'].forEach(function (sel) { var e = q(doc, sel); if (!e) return;
      if (on) { if (!e.hasAttribute('data-cs-at')) e.setAttribute('data-cs-at', e.hidden ? '1' : '0'); e.hidden = true; }
      else if (e.hasAttribute('data-cs-at')) { e.hidden = e.getAttribute('data-cs-at') === '1'; e.removeAttribute('data-cs-at'); } });
    qa(doc, 'a[href="#vehicules"], a[href="#reprise"]').forEach(function (a) { a.hidden = !!on; });
  }
  function apply(doc, c) {
    if (!c || typeof c !== 'object') return;
    if (!Array.isArray(c.reviews)) c = Object.assign({}, c, { reviews: [] }); // pas d'avis d'exemple sur un vrai site
    var t = c.text || {};
    Object.keys(TEXT).forEach(function (k) { if (typeof t[k] === 'string') setTxt(q(doc, TEXT[k]), t[k]); });
    Object.keys(LISTS).forEach(function (k) {
      var d = LISTS[k], arr = c[k]; if (!Array.isArray(arr)) return;
      var els = qa(doc, d.items); if (!els.length) return;
      if (d.add) els = fit(els, arr.length, d.max || 40); else arr = arr.slice(0, els.length);
      arr.forEach(function (o, i) { if (els[i] && o) writeItem(els[i], d, o); });
      if (k === 'hours') els.forEach(function (e, i) { var v = (arr[i] && arr[i].v || '').toLowerCase(); e.classList.toggle('closed', /ferm/.test(v)); });
    });
    if (Array.isArray(c.prices)) qa(doc, '.prices').forEach(function (box, gi) {
      var arr = c.prices[gi]; if (!Array.isArray(arr)) return;
      var rows = fit(qa(box, ':scope > .row'), arr.length, 60);
      arr.forEach(function (o, i) { var r = rows[i]; if (!r || !o) return; setTxt(q(r, '.t'), o.t || ''); setTxt(q(r, '.d'), o.d || ''); setTxt(q(r, '.p'), o.p || ''); });
    });
    var ad = q(doc, '#avis .head p'); if (ad && typeof t.avis_d !== 'string' && /^Exemples/.test(txt(ad))) ad.textContent = DEF_AVIS;
    google(doc, c.google);
    var av = q(doc, '#avis'); if (av) av.hidden = !c.reviews.length && !(c.google && (gUrl(c.google.url) || gUrl(c.google.review)));
    var p = c.photos || {};
    var pos = p.pos && typeof p.pos === 'object' ? p.pos : {};
    var he = q(doc, '.photo.hero'); if (p.hero) setImg(he, p.hero); else if (he) he.style.removeProperty('--img');
    setPos(q(doc, '.photo.hero'), pos.hero, pos.hero_m);
    var te = q(doc, '.team .photo'); if (p.team) setImg(te, p.team); else if (te) { te.style.removeProperty('--img'); te.style.display = ''; }
    setPos(q(doc, '.team .photo'), pos.team);
    if (Array.isArray(p.gallery)) qa(doc, '.gallery > .photo').forEach(function (e, i) { if (p.gallery[i]) setImg(e, p.gallery[i]); else { e.style.display = ''; e.style.removeProperty('--img'); } setPos(e, pos['g' + i]); });
    if (c.style && doc.documentElement) doc.documentElement.setAttribute('data-style', String(c.style).replace(/[^a-z]/g, ''));
    concession(doc, c.concession === true);
    atelier(doc, c.atelier === true && c.concession !== true);
    freeApply(doc, c.tx);
    credit(doc);
    var ev; try { ev = new Event('cs:applied'); doc.dispatchEvent(ev); } catch (e) {}
  }

  // 07/11/2026 : icône automatique du site client (onglet, favoris, écran d'accueil du téléphone).
  // Logo carré envoyé par le pro (photos.icon) ; sinon monogramme : 1re lettre du nom, sur la couleur du style.
  function siteIcon(doc, c) {
    try {
      var name = ((c.text && c.text.logo) || txt(q(doc, TEXT.logo)) || '').trim();
      var cs = getComputedStyle(doc.documentElement), acc = (cs.getPropertyValue('--accent') || '').trim() || '#12162B';
      var put = function (url) {
        qa(doc, 'link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(function (l) { l.remove(); });
        [['icon', '32x32'], ['icon', '180x180'], ['apple-touch-icon', '180x180']].forEach(function (r) {
          var l = doc.createElement('link'); l.rel = r[0]; l.sizes = r[1]; l.type = 'image/png'; l.href = url; doc.head.appendChild(l); });
        var m = q(doc, 'meta[name="apple-mobile-web-app-title"]'); if (!m) { m = doc.createElement('meta'); m.name = 'apple-mobile-web-app-title'; doc.head.appendChild(m); }
        m.content = name.slice(0, 30) || 'Mon site';
      };
      var cv = doc.createElement('canvas'); cv.width = cv.height = 180; var g = cv.getContext('2d');
      var src = c.photos && safeUrl(c.photos.icon);
      if (src) {
        var im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = function () { try { g.fillStyle = '#fff'; g.fillRect(0, 0, 180, 180); var k = Math.min(156 / im.width, 156 / im.height), w = im.width * k, h = im.height * k; g.drawImage(im, (180 - w) / 2, (180 - h) / 2, w, h); put(cv.toDataURL('image/png')); } catch (e) { put(src); } };
        im.onerror = function () { put(src); }; im.src = src; return;
      }
      var tmp = doc.createElement('span'); tmp.style.color = acc; doc.body.appendChild(tmp); var rgb = (getComputedStyle(tmp).color.match(/\d+/g) || [18, 22, 43]).map(Number); tmp.remove();
      var lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
      g.fillStyle = 'rgb(' + rgb.slice(0, 3).join(',') + ')'; g.fillRect(0, 0, 180, 180);
      g.fillStyle = lum > 0.6 ? '#12162B' : '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 112px ' + (cs.fontFamily || 'system-ui, sans-serif');
      var L = (name.replace(/^(le|la|les|l'|chez|maison|garage|atelier|studio)\s+/i, '').match(/[A-Za-zÀ-ÿ0-9]/) || ['M'])[0].toUpperCase();
      g.fillText(L, 90, 98); put(cv.toDataURL('image/png'));
    } catch (e) { /* pas d'icône, tant pis */ }
  }


  /* 07/11/2026 (Claude, demande d'Anthony) : site bilingue français / anglais (Premium, Boutique, option +10 €/mois).
     content.en = { on: true, dict: { "texte français": "English text" } }. La page est écrite en français ;
     en anglais, chaque texte (et placeholder, title, alt, aria-label) est remplacé par sa traduction, y compris
     les textes ajoutés ensuite par les scripts (panier, filtres, fenêtres de réservation). Les noms, adresses,
     téléphones, e-mails et avis clients ne sont jamais traduits. */
  var EN = false;
  function L(fr, en) { return EN ? en : fr; }
  var NOTR = 'script,style,noscript,textarea,.logo,.addr .v,.cinfo .v,#avis .rev,.picker,.cs-lang,.cs-notr';
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var RX = [
    [/^Ex\. : (.+)$/, function (m, tr) { return 'e.g. ' + tr(m[1]); }],
    [/^(\d+) réalisations?$/, function (m) { return m[1] + (m[1] > 1 ? ' projects' : ' project'); }],
    [/^(\d+) produits?$/, function (m) { return m[1] + (m[1] > 1 ? ' products' : ' product'); }],
    [/^(\d+) véhicules? disponibles?$/, function (m) { return m[1] + (m[1] > 1 ? ' vehicles available' : ' vehicle available'); }],
    [/^(\d+) biens? à (vendre|louer)$/, function (m) { return m[1] + (m[1] > 1 ? ' properties' : ' property') + (m[2] === 'vendre' ? ' for sale' : ' to rent'); }],
    [/^(.+) l'unité$/, function (m) { return m[1] + ' each'; }],
    [/^(.+), offerte dès (.+)$/, function (m, tr) { return tr(m[1]) + ', free over ' + m[2]; }],
    [/^Dès (.+)$/, function (m) { return 'From ' + m[1]; }]
  ];
  // Textes écrits par les scripts des modèles après un clic (absents de la page au moment de la traduction)
  var BUILTIN = { 'Dans le panier': 'In basket', 'Ajouter': 'Add', 'Gratuit': 'Free', 'Gratuite': 'Free', 'Offerte': 'Free', 'Sur demande': 'On request', 'Fermé': 'Closed', 'Fermer': 'Close' };
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function worth(s) { return /[A-Za-zÀ-ÿ]{2}/.test(s) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && !/^(https?:\/\/|www\.)/i.test(s) && !/^\+?[\d\s.()\/-]{6,}$/.test(s); }
  function skip(el) { return !el || (el.closest && el.closest(NOTR)); }
  function frOf(n) { return n.__csfr != null && n.nodeValue === n.__csen ? n.__csfr : n.nodeValue; }
  // Texte d'origine (français) d'un élément, même quand la page est affichée en anglais
  function frTxt(el) {
    if (!el) return '';
    var out = '', w = el.ownerDocument.createTreeWalker(el, 4), n;
    while ((n = w.nextNode())) out += frOf(n);
    return norm(out);
  }
  function texts(doc) {
    var seen = {}, out = [];
    var add = function (s) { s = norm(s || ''); if (s && !seen[s] && worth(s)) { seen[s] = 1; out.push(s); } };
    if (!doc || !doc.body) return out;
    var w = doc.createTreeWalker(doc.body, 4), n;
    while ((n = w.nextNode())) if (!skip(n.parentElement)) add(frOf(n));
    ATTRS.forEach(function (a) { qa(doc, '[' + a + ']').forEach(function (el) { if (!skip(el)) add(el.__csfrA && el.__csfrA[a] != null ? el.__csfrA[a] : el.getAttribute(a)); }); });
    qa(doc, '[data-fiche]').forEach(function (el) { if (el.hasAttribute('data-cs-empty')) return; var f = readFiche(el);
      String(f.desc || '').split(/\n+/).forEach(add); String(f.feats || '').split(/\n|·/).forEach(add); add(f.legal); add(f.energy); });
    add(doc.__csTitle || doc.title);
    var md = q(doc, 'meta[name="description"]'); if (md) add(md.__csfr || md.content);
    return out;
  }
  function makeTr(dict) {
    var tr = function (s) {
      var k = norm(s); if (!k) return null;
      if (Object.prototype.hasOwnProperty.call(dict, k) && dict[k]) return dict[k];
      if (BUILTIN[k]) return BUILTIN[k];
      for (var i = 0; i < RX.length; i++) { var m = RX[i][0].exec(k); if (m) return RX[i][1](m, function (x) { return tr(x) || x; }); }
      return null;
    };
    return tr;
  }
  function trText(n, tr) {
    var fr = frOf(n), en = tr(fr);
    if (!en) { if (n.__csfr != null) { n.__csfr = null; n.__csen = null; } return; }
    var v = (fr.match(/^\s*/)[0]) + en + (fr.match(/\s*$/)[0]);
    n.__csfr = fr; n.__csen = v; if (n.nodeValue !== v) n.nodeValue = v;
  }
  function trAttrs(el, tr) {
    if (skip(el)) return;
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      var cur = el.getAttribute(a), o = el.__csfrA || (el.__csfrA = {}), oe = el.__csenA || (el.__csenA = {});
      var fr = o[a] != null && cur === oe[a] ? o[a] : cur, en = tr(fr);
      if (en && en !== cur) { o[a] = fr; oe[a] = en; el.setAttribute(a, en); }
    });
  }
  function trTree(root, tr) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skip(root.parentElement)) trText(root, tr); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    var doc = root.ownerDocument, w = doc.createTreeWalker(root, 4), n;
    while ((n = w.nextNode())) if (!skip(n.parentElement)) trText(n, tr);
    trAttrs(root, tr); qa(root, '*').forEach(function (el) { trAttrs(el, tr); });
  }
  // Traduit la page (et ce que les scripts y ajoutent ensuite). dict = null : remet le français.
  function translate(doc, dict) {
    if (doc.__csObs) { doc.__csObs.disconnect(); doc.__csObs = null; }
    var md = q(doc, 'meta[name="description"]');
    if (!dict) { // retour au français
      var w = doc.createTreeWalker(doc.body, 4), n;
      while ((n = w.nextNode())) if (n.__csfr != null && n.nodeValue === n.__csen) { n.nodeValue = n.__csfr; n.__csfr = n.__csen = null; }
      qa(doc, '*').forEach(function (el) { if (el.__csfrA) Object.keys(el.__csfrA).forEach(function (a) { if (el.getAttribute(a) === el.__csenA[a]) el.setAttribute(a, el.__csfrA[a]); }); el.__csfrA = el.__csenA = null; });
      if (doc.__csTitle) { doc.title = doc.__csTitle; doc.__csTitle = null; }
      if (md && md.__csfr) { md.content = md.__csfr; md.__csfr = null; }
      doc.documentElement.lang = 'fr'; return;
    }
    var tr = makeTr(dict);
    trTree(doc.body, tr);
    var t = tr(doc.__csTitle || doc.title); if (t) { doc.__csTitle = doc.__csTitle || doc.title; doc.title = t; }
    if (md) { var d = tr(md.__csfr || md.content); if (d) { md.__csfr = md.__csfr || md.content; md.content = d; } }
    doc.documentElement.lang = 'en';
    var MO = (doc.defaultView && doc.defaultView.MutationObserver) || window.MutationObserver;
    var obs = new MO(function (list) {
      list.forEach(function (m) {
        if (m.type === 'characterData') { if (m.target.nodeValue !== m.target.__csen && !skip(m.target.parentElement)) { m.target.__csfr = null; trText(m.target, tr); } }
        else if (m.type === 'attributes') { var el = m.target, v = el.getAttribute(m.attributeName); if (el.__csenA && v === el.__csenA[m.attributeName]) return; if (el.__csfrA) el.__csfrA[m.attributeName] = null; trAttrs(el, tr); }
        else m.addedNodes.forEach(function (x) { trTree(x, tr); });
      });
    });
    obs.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    doc.__csObs = obs;
  }
  function wantLang() {
    var p = null; try { p = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (p === 'en' || p === 'fr') { try { localStorage.setItem('cs_lang', p); } catch (e) {} return p; }
    try { return localStorage.getItem('cs_lang') === 'en' ? 'en' : 'fr'; } catch (e) { return 'fr'; }
  }
  // Bouton FR / EN dans le bandeau du site + liens hreflang pour Google
  function langSwitch(doc, cur) {
    var base = location.origin + location.pathname;
    [['fr', base], ['en', base + '?lang=en'], ['x-default', base]].forEach(function (h) {
      var l = doc.createElement('link'); l.rel = 'alternate'; l.hreflang = h[0]; l.href = h[1]; doc.head.appendChild(l); });
    var a = doc.createElement('a'); a.className = 'cs-lang'; var other = cur === 'en' ? 'fr' : 'en';
    a.href = '?lang=' + other; a.hreflang = other; a.lang = other; a.textContent = other === 'en' ? 'EN' : 'FR';
    a.setAttribute('aria-label', other === 'en' ? 'English version' : 'Version française');
    a.style.cssText = 'display:inline-flex!important;align-items:center;justify-content:center;min-width:38px;height:30px;padding:0 9px;border:1.5px solid currentColor;border-radius:999px;font:700 12px/1 system-ui,sans-serif;letter-spacing:.06em;text-decoration:none;color:inherit;opacity:.85;flex:none';
    a.addEventListener('click', function (e) { e.preventDefault(); try { localStorage.setItem('cs_lang', other); } catch (x) {}
      var u = new URL(location.href); if (other === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang'); location.href = u.toString(); });
    var nav = q(doc, 'header.top .nav'), wrap = q(doc, 'header.top .wrap');
    if (nav) nav.insertBefore(a, nav.firstChild);
    else if (wrap) wrap.appendChild(a);
    else { a.style.cssText += ';position:fixed;top:12px;right:12px;z-index:2147482000;background:#fff;color:#16181f'; doc.body.appendChild(a); }
  }

  window.CSEdit = { freeLeaves: freeLeaves, norm: norm, extract: extract, apply: apply, credit: credit, TEXT: TEXT, LISTS: LISTS, gUrl: gUrl, siteIcon: siteIcon, texts: texts, translate: translate, frTxt: frTxt };

  // Site client : charge le contenu publié
  var me = document.currentScript;
  var slug = me && me.getAttribute('data-site');
  if (slug) {
    fetch(API + '/rest/v1/rpc/cs_site_content', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY },
      body: JSON.stringify({ p_slug: slug })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (!c) return;
      var bi = c.en && c.en.on && c.en.dict && typeof c.en.dict === 'object';
      EN = bi && wantLang() === 'en';
      var go = function () { if (!window.CSFiche && q(document, '.props > .prop, .vgrid > .car')) { var sf = document.createElement('script'); sf.src = 'https://mycreativesite.fr/assets/cs-fiche.js?v=3'; document.head.appendChild(sf); }
        apply(document, c); siteIcon(document, c); if (bi) { langSwitch(document, EN ? 'en' : 'fr'); if (EN) translate(document, c.en.dict); }
        if (c.shop) initShop(slug, c.shop); if (c.pay) { window.CS_PAY = c.pay; if (window.CS_PAY_INIT) window.CS_PAY_INIT(); }
        if (window.CS_AGENDA_INIT) window.CS_AGENDA_INIT(document.documentElement.getAttribute('data-trade')); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    }).catch(function () { /* le site garde son contenu d'origine */ });
    initLeads(slug);
    proButton(slug);
    // 10/11/2026 : sur iPhone, les champs date et heure (réservation, fiches) ne dépassent plus de leur cadre
    try { if (!document.getElementById('cs-date-css')) { var sd = document.createElement('style'); sd.id = 'cs-date-css'; sd.textContent = 'input[type=date],input[type=datetime-local],input[type=time],input[type=month]{min-width:0;max-width:100%;box-sizing:border-box}@supports (-webkit-touch-callout:none){input[type=date],input[type=datetime-local],input[type=time],input[type=month]{-webkit-appearance:none;appearance:none;display:block;width:100%;min-height:2.6em}input::-webkit-date-and-time-value{text-align:left;margin:0}}.stats>.stat{min-width:0}.stats .stat b,.stats .stat span{overflow-wrap:break-word;-webkit-hyphens:auto;hyphens:auto}@media (max-width:600px){.stats .stat b{font-size:clamp(1.15rem,6.4vw,1.9rem)!important}}'; document.head.appendChild(sd); } } catch (e) {}
  }

  /* 10/11/2026 (Anthony) : bouton « Modifier mon site » sur le vrai site, seulement pour le pro.
     Il apparaît sur le navigateur où le pro a ouvert son site depuis son espace (lien « Voir mon site », qui ajoute #cs-pro) ;
     les visiteurs ne le voient jamais. Il ouvre l'espace directement sur le site, en mode modification. */
  function proButton(slug) {
    var key = 'cs-pro-' + slug, ls; try { ls = window.localStorage; } catch (e) { return; }
    try { if (location.hash === '#cs-pro') { ls.setItem(key, '1'); history.replaceState(null, '', location.pathname + location.search); } } catch (e) {}
    var on; try { on = ls.getItem(key) === '1'; } catch (e) { on = false; }
    if (!on) return;
    var go = function () {
      if (document.getElementById('cs-pro')) return;
      var w = document.createElement('div'); w.id = 'cs-pro'; w.className = 'cs-notr';
      w.style.cssText = 'position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;align-items:center;gap:2px;background:#12162B;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.3);font:600 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;padding:3px';
      var a = document.createElement('a'); a.href = 'https://mycreativesite.fr/espace/?site=' + encodeURIComponent(slug) + '&vue=modifier';
      a.textContent = '✏️ Modifier mon site'; a.style.cssText = 'color:#fff;text-decoration:none;padding:11px 14px;border-radius:999px;background:#2563EB';
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Masquer ce bouton sur cet appareil');
      x.title = 'Masquer ce bouton sur cet appareil (il revient quand vous ouvrez votre site depuis votre espace)';
      x.style.cssText = 'all:unset;cursor:pointer;color:#fff;opacity:.75;font-size:20px;padding:6px 12px 8px';
      x.addEventListener('click', function () { try { ls.removeItem(key); } catch (e) {} w.remove(); });
      w.append(a, x); document.body.appendChild(w);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }

  /* 07/11/2026 (Claude) : boutique en ligne. Le panier est géré par la page (window.CSShop) ;
     ici on envoie la commande à MyCreativeSite, qui recalcule les prix et ouvre le paiement par carte
     sur le compte Stripe du commerçant (ou l'enregistre « à régler sur place » si la carte n'est pas activée). */
  var SHOP_FN = API + '/functions/v1/cs-shop';
  function initShop(slug, cfg) {
    var S = window.CSShop, f = document.getElementById('cartform');
    if (!S || !f) return;
    S.config({ ship: cfg.ship, free: cfg.free, pickup: cfg.pickup, delivery: cfg.delivery });
    var pay = document.getElementById('payBtn'), legal = q(f, '.legal'), okc = document.getElementById('okc');
    if (!cfg.card) {
      if (pay) pay.textContent = L('Envoyer ma commande', 'Send my order');
      if (legal) legal.textContent = L('Vous réglez au retrait ou à la livraison. La boutique vous confirme la commande par e-mail.', 'You pay on collection or delivery. The shop will confirm your order by email.');
    }
    var u = new URL(location.href), st = u.searchParams.get('commande'), sess = u.searchParams.get('cs_session');
    function msg(t) { if (okc) { okc.textContent = t; okc.hidden = false; } }
    if (st) {
      u.searchParams.delete('commande'); u.searchParams.delete('cs_session'); history.replaceState(null, '', u.pathname + u.search + u.hash);
      if (st === 'ok') {
        S.clear(); S.open();
        var body = document.getElementById('cartBody'); if (body) body.hidden = false;
        msg(L('Merci ! Votre paiement est accepté et votre commande est transmise à la boutique. Vous recevez une confirmation par e-mail.', 'Thank you! Your payment has been accepted and your order has been sent to the shop. You will receive a confirmation by email.'));
        if (sess) fetch(SHOP_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ action: 'confirm', slug: slug, session: sess }) }).catch(function () {});
      } else { S.open(); msg(L('Paiement annulé : votre panier est toujours là.', 'Payment cancelled: your basket is still here.')); }
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!f.reportValidity()) return;
      var p = S.payload(); if (!p.items.length) return;
      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      pay.disabled = true; var old = pay.textContent; pay.textContent = 'Un instant…'; if (okc) okc.hidden = true;
      fetch(SHOP_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY },
        body: JSON.stringify({ action: 'checkout', slug: slug, items: p.items, mode: p.mode, name: v('o-name'), email: v('o-mail'), phone: v('o-tel'), address: v('o-addr'), note: v('o-note'), back: location.origin + location.pathname })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (r) {
        if (!r.ok) throw new Error(r.j && r.j.message || L('Commande impossible', 'Order failed'));
        if (r.j.url) { location.href = r.j.url; return; }
        pay.disabled = false; pay.textContent = old; S.clear();
        var body = document.getElementById('cartBody'); if (body) body.hidden = false;
        msg(EN ? 'Thank you! Your order has been sent to the shop, which will confirm by email. You will pay on ' + (p.mode === 'livraison' ? 'delivery.' : 'collection.') : 'Merci ! Votre commande est transmise à la boutique, qui vous confirme par e-mail. Vous réglerez au ' + (p.mode === 'livraison' ? 'moment de la livraison.' : 'retrait.'));
      }).catch(function (x) { pay.disabled = false; pay.textContent = old; msg((x && x.message && !/fetch/i.test(x.message)) ? x.message : L('La commande n\'est pas partie. Vérifiez votre connexion et réessayez.', 'Your order was not sent. Check your connection and try again.')); });
    }, true);
  }

  /* 07/11/2026 (Claude, demande d'Anthony) : demandes des visiteurs (réservation, devis, rendez-vous…).
     Sur un site client, chaque formulaire demande les coordonnées du visiteur puis envoie la demande
     dans l'espace client du pro (liste « Mes clients », suivi complet en formule Premium).
     Sur les modèles de démonstration (sans data-site), rien ne change et rien n'est envoyé. */
  function initLeads(slug) {
    var SKIP = { search: 1, cartform: 1 };
    function kindOf(form) {
      var b = q(form, '[type="submit"]'), t = (frTxt(b) + ' ' + form.id).toLowerCase();
      if (/devis/.test(t)) return 'devis';
      if (/rappel/.test(t)) return 'rappel';
      if (/estimation|estform/.test(t)) return 'estimation';
      if (/reprise/.test(t)) return 'reprise';
      if (/rendez-vous/.test(t)) return 'rendez-vous';
      if (/table|prix|trajet/.test(t)) return 'reservation';
      if (/côté|command/.test(t)) return 'commande';
      if (/réserv/.test(t)) return 'rendez-vous';
      return 'contact';
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function niceDate(v, withTime) {
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v || '');
      if (!m) return v;
      return m[3] + '/' + m[2] + '/' + m[1] + (withTime && m[4] ? ' à ' + m[4] + 'h' + m[5] : '');
    }
    function labelFor(form, el) {
      var l = el.id && q(form, 'label[for="' + el.id + '"]');
      return frTxt(l) || (el.__csfrA && el.__csfrA['aria-label']) || el.getAttribute('aria-label') || el.name || '';
    }
    function collect(form) {
      var out = [], tel = '';
      qa(form, 'input,select,textarea').forEach(function (el) {
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.closest('.cs-lead') || el.closest('[data-cs-off]')) return;
        var v = el.tagName === 'SELECT' ? frTxt(el.options[el.selectedIndex]) : String(el.value || '').trim();
        if (el.type === 'date') v = niceDate(v, false);
        if (el.type === 'datetime-local') v = niceDate(v, true);
        if (el.type === 'tel' && !tel) tel = v;
        if (v) out.push({ l: labelFor(form, el), v: v });
      });
      return { fields: out, tel: tel };
    }
    // Les champs des modèles sont pré-remplis avec des exemples : sur le vrai site ils deviennent des indications.
    function prepare(form) {
      var today = new Date(), iso = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
      qa(form, 'input').forEach(function (el) {
        if (el.type === 'date' || el.type === 'datetime-local') {
          el.min = el.type === 'date' ? iso : iso + 'T00:00';
          el.value = ''; el.required = true; return;
        }
        if (el.readOnly) return; // 09/11/2026 : champ « Véhicule / Bien concerné » des pages d'annonces, gardé tel quel
        if (!el.type || el.type === 'text' || el.type === 'tel') {
          if (el.value && !el.placeholder) el.placeholder = 'Ex. : ' + el.value;
          el.value = '';
        }
      });
      qa(form, '.ok').forEach(function (o) { o.hidden = true; });
    }
    var css = '.cs-lead{position:fixed;inset:0;z-index:2147483000;background:rgba(10,12,20,.55);display:flex;align-items:center;justify-content:center;padding:16px max(16px,env(safe-area-inset-right,0px)) 16px max(16px,env(safe-area-inset-left,0px))}' +
      '.cs-lead .cs-box{background:#fff;color:#16181f;width:100%;max-width:420px;max-height:calc(100dvh - 32px);overflow:auto;border-radius:18px;padding:22px 20px;box-shadow:0 24px 60px rgba(0,0,0,.3);font:15px/1.45 inherit;font-family:inherit;text-align:left}' +
      '.cs-lead h3{margin:0 0 4px;font-size:1.2rem;color:#16181f}.cs-lead p{margin:0 0 14px;color:#5a5f6e;font-size:.9rem}' +
      '.cs-lead label{display:block;font-size:.8rem;font-weight:600;color:#5a5f6e;margin:10px 0 4px}' +
      '.cs-lead input,.cs-lead textarea{display:block;width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d6d9e3;border-radius:10px;font:inherit;color:#16181f;background:#fff}' +
      '.cs-lead textarea{min-height:70px;resize:vertical}.cs-lead .cs-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
      '.cs-lead .cs-act{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}.cs-lead .cs-act .btn{flex:1;justify-content:center}' +
      '.cs-lead .cs-cancel{background:none;border:0;color:#5a5f6e;font:inherit;font-weight:600;cursor:pointer;padding:10px}' +
      '.cs-lead .cs-err{color:#b42318;font-size:.86rem;margin-top:10px}.cs-lead .cs-small{font-size:.76rem;color:#7a7f8e;margin:12px 0 0}' +
      '.cs-lead .cs-pay{display:grid;gap:2px;background:#f2f7f3;border:1px solid #cfe5d5;border-radius:12px;padding:10px 12px;margin:0 0 4px}.cs-lead .cs-pay b{font-size:1.05rem;color:#14532d}.cs-lead .cs-pay span{font-size:.82rem;color:#3f5e48}' +
      '.cs-bk{font-size:.85rem!important;padding:8px 14px!important;min-height:0!important;margin-top:6px}' +
      '.cs-banner{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483001;width:min(560px,calc(100% - 32px));background:#16181f;color:#fff;border-radius:14px;padding:14px 44px 14px 16px;font:15px/1.45 inherit;font-family:inherit;box-shadow:0 18px 40px rgba(0,0,0,.3)}.cs-banner.ok{background:#14532d}.cs-banner button{position:absolute;top:8px;right:8px;background:none;border:0;color:inherit;font-size:18px;cursor:pointer;padding:6px}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    function bizName() { return txt(q(document, 'header.top .logo')) || document.title.split(/[·|–-]/)[0].trim(); }
    function cents(p) { var m = /^(\d{1,6})(?:[,.](\d{1,2}))?€?$/.exec(String(p || '').replace(/\s/g, '')); return m ? (+m[1]) * 100 + (m[2] ? +(m[2] + '0').slice(0, 2) : 0) : 0; }
    function eur(c) { return (c / 100).toFixed(2).replace('.', ',').replace(',00', '') + ' €'; }
    // 07/11/2026 : formule Pro — combien payer en ligne (null = simple demande)
    function payFor(item, kind) {
      var P = window.CS_PAY; if (!P) return null;
      if (item) { if (P.forfait === 'off' || !item.price) return null;
        var dep = P.forfait === 'deposit' && P.pct < 100, a = dep ? Math.round(item.price * P.pct / 100) : item.price;
        return { amount: a, note: dep ? L('Acompte de ' + P.pct + ' % sur ' + eur(item.price) + ', le reste est réglé le jour de la prestation.', P.pct + '% deposit on ' + eur(item.price) + ', the balance is paid on the day.') : L('Prix total de la prestation.', 'Full price of the service.') }; }
      if (P.deposit >= 100 && (kind === 'reservation' || kind === 'rendez-vous')) return { amount: P.deposit, note: L('Acompte pour confirmer votre réservation, déduit du prix final.', 'Deposit to confirm your booking, deducted from the final price.') };
      return null;
    }
    function open(form, item) {
      var data = form ? collect(form) : { fields: [], tel: '' }, kind = form ? kindOf(form) : 'reservation', pay = payFor(item, kind);
      var wrap = document.createElement('div'); wrap.className = 'cs-lead'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
      var slot0 = form && form.__ag ? form.__slot : null;
      wrap.innerHTML = '<form class="cs-box" novalidate><h3>' + (item ? L('Réserver : ', 'Book: ') + esc(item.label || item.t) : slot0 ? L('Réserver le ', 'Book on ') + esc(slotTxt(slot0)) : (pay ? L('Réserver et payer', 'Book and pay') : L('Vos coordonnées', 'Your details'))) + '</h3><p>' + (pay ? L('Paiement sécurisé par carte, directement à ', 'Secure card payment, made directly to ') + esc(bizName()) + '.' : L('Pour que ' + esc(bizName()) + ' vous réponde.', 'So that ' + esc(bizName()) + ' can get back to you.')) + '</p>' +
        (pay ? '<div class="cs-pay"><b>' + L('À payer maintenant : ', 'To pay now: ') + eur(pay.amount) + '</b><span>' + esc(pay.note) + '</span></div>' : '') +
        (item && AG && AG.on ? '<div class="cs-ag cs-agp"></div>' : item ? '<label for="cs-d">' + L('Date et heure souhaitées', 'Preferred date and time') + '</label><input id="cs-d" type="datetime-local" required>' : '') +
        '<label for="cs-n">' + L('Nom', 'Name') + '</label><input id="cs-n" autocomplete="name" required maxlength="120">' +
        '<label for="cs-t">' + L('Téléphone', 'Phone') + '</label><input id="cs-t" type="tel" autocomplete="tel" inputmode="tel" maxlength="30">' +
        '<label for="cs-e">' + L('E-mail', 'Email') + (pay ? L(' (pour votre reçu)', ' (for your receipt)') : '') + '</label><input id="cs-e" type="email" autocomplete="email" maxlength="160">' +
        '<label for="cs-m">' + L('Message (facultatif)', 'Message (optional)') + '</label><textarea id="cs-m" maxlength="2000"></textarea>' +
        '<input class="cs-hp" id="cs-w" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div class="cs-err" role="alert" hidden></div>' +
        '<div class="cs-act"><button type="button" class="cs-cancel">' + L('Annuler', 'Cancel') + '</button><button class="btn" type="submit">' + (pay ? L('Payer ' + eur(pay.amount) + ' et réserver', 'Pay ' + eur(pay.amount) + ' and book') : L('Envoyer ma demande', 'Send my request')) + '</button></div>' +
        '<p class="cs-small">' + L('Vos coordonnées sont transmises uniquement à ' + esc(bizName()) + ' pour répondre à votre demande.', 'Your details are only shared with ' + esc(bizName()) + ' to answer your request.') + (pay ? L(' Le paiement est traité par Stripe.', ' Payment is processed by Stripe.') : '') + '</p></form>';
      document.body.appendChild(wrap);
      var f = q(wrap, 'form'), err = q(wrap, '.cs-err'), agp = q(wrap, '.cs-agp');
      if (agp) picker(agp, wrap, 1);
      if (q(wrap, '#cs-d')) { var t0 = new Date(Date.now() + 864e5); q(wrap, '#cs-d').min = t0.getFullYear() + '-' + pad(t0.getMonth() + 1) + '-' + pad(t0.getDate()) + 'T00:00'; }
      if (data.tel) q(wrap, '#cs-t').value = data.tel;
      setTimeout(function () { var fo = q(wrap, item && !agp ? '#cs-d' : '#cs-n'); if (fo) fo.focus(); }, 30);
      function close() { wrap.remove(); document.removeEventListener('keydown', onKey); }
      function onKey(e) { if (e.key === 'Escape') close(); }
      document.addEventListener('keydown', onKey);
      q(wrap, '.cs-cancel').onclick = close;
      wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var n = q(wrap, '#cs-n').value.trim(), t = q(wrap, '#cs-t').value.trim(), m = q(wrap, '#cs-e').value.trim(), d = q(wrap, '#cs-d');
        err.hidden = true;
        if (d && !d.value) { err.textContent = L('Choisissez la date et l\'heure.', 'Choose the date and time.'); err.hidden = false; return; }
        var slot = agp ? wrap.__slot : slot0;
        if (agp && !slot) { err.textContent = L('Choisissez un créneau.', 'Choose a time slot.'); err.hidden = false; return; }
        if (!n) { err.textContent = L('Indiquez votre nom.', 'Please enter your name.'); err.hidden = false; return; }
        if (pay && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { err.textContent = L('Indiquez votre e-mail pour recevoir le reçu de paiement.', 'Please enter your email to receive the payment receipt.'); err.hidden = false; return; }
        if (!t && !m) { err.textContent = L('Indiquez un téléphone ou un e-mail pour être recontacté.', 'Please enter a phone number or an email so we can get back to you.'); err.hidden = false; return; }
        var fields = data.fields.slice(); if (d) fields.unshift({ l: 'Date et heure', v: niceDate(d.value, true) });
        var b = q(f, '[type="submit"]'), lbl = b.textContent; b.disabled = true; b.textContent = pay ? L('Ouverture du paiement…', 'Opening payment…') : L('Envoi…', 'Sending…');
        // 09/11/2026 : agenda — le créneau est réservé (et confirmé) avant le paiement éventuel
        var hold = slot ? fetch(API + '/rest/v1/rpc/cs_booking_submit', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY },
            body: JSON.stringify({ p_slug: slug, p_day: slot.d, p_time: slot.t, p_party: partyOf(form), p_service: item ? item.t : serviceOf(form), p_name: n, p_phone: t, p_email: m, p_message: q(wrap, '#cs-m').value, p_fields: fields, p_page: location.pathname, p_hp: q(wrap, '#cs-w').value, p_lead: !pay }) })
            .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var x = new Error((j && j.message) || L('Réservation impossible', 'Booking failed')); x.slot = 1; throw x; } return j; }); }) : Promise.resolve(null);
        var req = slot && !pay ? hold.then(function (j) { return { ok: true, json: function () { return Promise.resolve(j); } }; }) : pay ? hold.then(function (j) { if (j && j.label) fields.unshift({ l: 'Créneau réservé (confirmé)', v: j.label }); return
          fetch(SHOP_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ action: 'book', slug: slug, item: item ? { src: item.src, g: item.g, i: item.i, t: item.t } : null, kind: kind, name: n, phone: t, email: m, message: q(wrap, '#cs-m').value, fields: fields, back: location.origin + location.pathname }) }); })
          : fetch(API + '/rest/v1/rpc/cs_lead_submit', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY },
              body: JSON.stringify({ p_slug: slug, p_kind: kind, p_name: n, p_phone: t, p_email: m, p_message: q(wrap, '#cs-m').value, p_fields: fields, p_page: location.pathname, p_hp: q(wrap, '#cs-w').value }) });
        req.then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (r) {
          if (!r.ok) throw new Error((r.j && r.j.message) || L('Envoi impossible', 'Sending failed'));
          if (pay) { if (!r.j.url) throw new Error(L('Paiement indisponible', 'Payment unavailable')); location.href = r.j.url; return; }
          close();
          var ok = form && q(form, '.ok');
          if (form && !ok) { ok = document.createElement('div'); ok.className = 'ok'; form.appendChild(ok); }
          if (ok) { ok.textContent = slot ? L('C\'est confirmé, ' + n + ' : ' + bizName() + ' vous attend le ' + slotTxt(slot) + '. En cas d\'empêchement, merci de prévenir par téléphone.', 'Confirmed, ' + n + ': ' + bizName() + ' expects you on ' + slotTxt(slot) + '. If you cannot make it, please call to cancel.') : L('Merci ' + n + ', votre demande est bien envoyée. ' + bizName() + ' vous recontacte rapidement.', 'Thank you ' + n + ', your request has been sent. ' + bizName() + ' will get back to you shortly.'); ok.hidden = false; }
          if (slot) { if (form) form.__slot = null; if (!item) refreshAg(); }
        }).catch(function (x) {
          b.disabled = false; b.textContent = lbl;
          if (x && x.slot && slot) { if (agp) { wrap.__slot = null; picker(agp, wrap, 1); } else { close(); refreshAg(); var fo = form && q(form, '.ok'); if (fo) { fo.textContent = x.message; fo.hidden = false; } return; } }
          err.textContent = (x && x.message && !/fetch/i.test(x.message)) ? x.message : L('La demande n\'est pas partie. Vérifiez votre connexion et réessayez.', 'Your request was not sent. Check your connection and try again.');
          err.hidden = false;
        });
      });
    }
    // Boutons « Réserver » sur les tarifs et prestations à prix fixe, et retour du paiement
    function banner(t, good) { var d = document.createElement('div'); d.className = 'cs-banner' + (good ? ' ok' : ''); d.setAttribute('role', 'status'); d.textContent = t;
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', L('Fermer', 'Close')); x.textContent = '✕'; x.onclick = function () { d.remove(); }; d.appendChild(x); document.body.appendChild(d); }
    window.CS_PAY_INIT = function () {
      var P = window.CS_PAY; if (!P) return;
      var u = new URL(location.href), st = u.searchParams.get('paiement'), sess = u.searchParams.get('cs_session');
      if (st) {
        u.searchParams.delete('paiement'); u.searchParams.delete('cs_session'); history.replaceState(null, '', u.pathname + u.search + u.hash);
        if (st === 'ok') { banner(L('Merci ! Votre paiement est accepté et votre réservation est transmise à ' + bizName() + '. Vous recevez le reçu par e-mail.', 'Thank you! Your payment has been accepted and your booking has been sent to ' + bizName() + '. You will receive the receipt by email.'), true);
          if (sess) fetch(SHOP_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ action: 'confirm', slug: slug, session: sess }) }).catch(function () {}); }
        else banner(L('Paiement annulé : rien n\'a été débité. Votre demande a tout de même été transmise, ' + bizName() + ' peut vous recontacter.', 'Payment cancelled: nothing has been charged. Your request was still sent, ' + bizName() + ' may get back to you.'), false);
      }
      if (P.forfait === 'off' || q(document, '.dish')) return;
      var add = function (el, item, place) { if (!item.price || q(el, '.cs-bk')) return; var b = document.createElement('button'); b.type = 'button'; b.className = 'btn cs-bk cs-notr'; b.textContent = L('Réserver', 'Book');
        b.addEventListener('click', function () { open(null, item); }); place(b); };
      qa(document, '.prices').forEach(function (box, g) { qa(box, ':scope > .row').forEach(function (r, i) { if (r.hidden) return;
        add(r, { src: 'price', g: g, i: i, t: frTxt(q(r, '.t')), label: txt(q(r, '.t')), price: cents(frTxt(q(r, '.p'))) }, function (b) { b.style.gridColumn = '1/-1'; b.style.justifySelf = 'start'; r.appendChild(b); }); }); });
      qa(document, '.cards > .card').forEach(function (c, i) { if (c.hidden) return; var pe = q(c, '.price');
        add(c, { src: 'card', i: i, t: frTxt(q(c, 'h3')), label: txt(q(c, 'h3')), price: cents(frTxt(pe)) }, function (b) { (pe || c).insertAdjacentElement('afterend', b); }); });
    };

    /* 09/11/2026 (Claude, demande d'Anthony) : agenda des rendez-vous (coiffure, bien-être, restaurant, garage).
       Agenda ouvert dans l'espace du pro → le visiteur choisit un créneau libre, confirmé tout de suite.
       Agenda pas encore ouvert, ou plus aucun créneau → bouton « Appeler » à la place du formulaire. */
    var AG = null, AGF = null;
    var JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    function slotTxt(o) { var p = o.d.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]); return (EN ? DAYS : JOURS)[dt.getDay()] + ' ' + p[2] + '/' + p[1] + L(' à ', ' at ') + o.t.replace(':', EN ? ':' : 'h'); }
    function partyOf(form) { var sel = form && qa(form, 'select').filter(function (x) { return /couvert|personne|guest/i.test(labelFor(form, x)); })[0]; return sel ? Math.max(1, parseInt(frTxt(sel.options[sel.selectedIndex]), 10) || 1) : 1; }
    function serviceOf(form) { var sel = form && qa(form, 'select').filter(function (x) { return !x.closest('[data-cs-off]') && !/couvert|personne|avec|praticien/i.test(labelFor(form, x)); })[0]; return sel ? frTxt(sel.options[sel.selectedIndex]) : ''; }
    function phoneNum() {
      var a = q(document, 'a[href^="tel:"]'); if (a) return a.getAttribute('href').slice(4);
      var r = qa(document, '.cinfo > div').filter(function (e) { return /t[ée]l|phone|portable|appel/i.test(frTxt(q(e, '.l'))) && /\d{2}.*\d{2}.*\d{2}/.test(txt(q(e, '.v'))); })[0];
      return r ? txt(q(r, '.v')) : '';
    }
    function agCss() {
      if (q(document, '#cs-ag-css')) return; var st = document.createElement('style'); st.id = 'cs-ag-css';
      st.textContent = '.cs-ag{grid-column:1/-1;display:grid;gap:10px;min-width:0}.cs-ag .cs-agl{font-size:.75rem;font-weight:600;color:var(--muted,#5a5f6e)}' +
        '.cs-ag .cs-days{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}.cs-ag .cs-times{display:flex;flex-wrap:wrap;gap:8px}' +
        '.cs-ag button{font:inherit;cursor:pointer;border:1px solid var(--line,#d6d9e3);background:var(--soft,#f4f4f5);color:var(--ink,#16181f);border-radius:10px}' +
        '.cs-ag .cs-days button{flex:none;display:grid;justify-items:center;gap:1px;min-width:62px;padding:8px 6px;font-size:.78rem;line-height:1.15}.cs-ag .cs-days button b{font-size:1.05rem}' +
        '.cs-ag .cs-times button{padding:9px 13px;font-size:.9rem;font-weight:600}.cs-ag button[aria-pressed="true"]{background:var(--btn,#16181f);color:var(--btn-fg,#fff);border-color:var(--btn,#16181f)}' +
        '.cs-ag button:disabled{opacity:.4;cursor:not-allowed;text-decoration:line-through}.cs-ag .cs-none{font-size:.88rem;color:var(--muted,#5a5f6e)}' +
        '.cs-lead .cs-ag{margin:4px 0 6px}.cs-lead .cs-ag{--line:#d6d9e3;--soft:#f4f5f8;--ink:#16181f;--muted:#5a5f6e;--btn:#16181f;--btn-fg:#fff}' +
        '.cs-call{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}.cs-call div{display:grid;gap:2px}.cs-call b{font-size:1.05rem}.cs-call span{color:var(--muted,#5a5f6e);font-size:.9rem}';
      document.head.appendChild(st);
    }
    // Sélecteur jours + heures. host = élément qui garde le choix (__slot) ; inPop = dans la fenêtre de réservation
    function picker(box, host, inPop) {
      var form = inPop ? null : host, party = partyOf(form), byDay = {}, order = [];
      (AG.slots || []).forEach(function (x) { if (!byDay[x.d]) { byDay[x.d] = []; order.push(x.d); } byDay[x.d].push(x); });
      var free = function (x) { return x.left >= party; };
      var cur = host.__slot && byDay[host.__slot.d] ? host.__slot.d : (order.filter(function (d) { return byDay[d].some(free); })[0] || order[0]);
      box.textContent = '';
      var l1 = document.createElement('div'); l1.className = 'cs-agl'; l1.textContent = L('Choisissez le jour', 'Choose the day'); box.appendChild(l1);
      var days = document.createElement('div'); days.className = 'cs-days cs-notr'; box.appendChild(days);
      var l2 = document.createElement('div'); l2.className = 'cs-agl'; l2.textContent = L('Puis l\'heure', 'Then the time'); box.appendChild(l2);
      var times = document.createElement('div'); times.className = 'cs-times cs-notr'; box.appendChild(times);
      function drawTimes() {
        times.textContent = '';
        var list = byDay[cur] || [];
        if (!list.some(free)) { var n = document.createElement('div'); n.className = 'cs-none'; n.textContent = L('Complet ce jour-là. Choisissez un autre jour', 'Fully booked that day. Choose another day') + (phoneNum() ? L(' ou appelez-nous.', ' or call us.') : '.'); times.appendChild(n); return; }
        list.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = x.t.replace(':', EN ? ':' : 'h'); b.disabled = !free(x);
          b.setAttribute('aria-pressed', host.__slot && host.__slot.d === x.d && host.__slot.t === x.t ? 'true' : 'false');
          b.onclick = function () { host.__slot = { d: x.d, t: x.t }; qa(times, 'button').forEach(function (k) { k.setAttribute('aria-pressed', k === b ? 'true' : 'false'); }); var ok = form && q(form, '.ok'); if (ok) ok.hidden = true; };
          times.appendChild(b); });
      }
      order.forEach(function (d) { var p = d.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]), b = document.createElement('button'); b.type = 'button';
        b.innerHTML = '<span>' + (EN ? DAYS : JOURS)[dt.getDay()] + '</span><b>' + (+p[2]) + '</b><span>' + (EN ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] : ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'])[dt.getMonth()] + '</span>';
        b.disabled = !byDay[d].some(free); b.setAttribute('aria-pressed', d === cur ? 'true' : 'false');
        b.onclick = function () { cur = d; if (host.__slot && host.__slot.d !== d) host.__slot = null; qa(days, 'button').forEach(function (k) { k.setAttribute('aria-pressed', k === b ? 'true' : 'false'); }); drawTimes(); };
        days.appendChild(b); });
      drawTimes();
    }
    function callBlock(form, why) {
      var tel = phoneNum(); if (!tel) return false;
      qa(form, ':scope > *').forEach(function (e) { if (!e.classList.contains('cs-call')) { e.setAttribute('data-cs-off', ''); e.hidden = true; } });
      qa(form, 'input,select,textarea').forEach(function (e) { e.required = false; });
      var c = q(form, '.cs-call'); if (!c) { c = document.createElement('div'); c.className = 'cs-call'; form.appendChild(c); }
      c.innerHTML = '<div><b>' + esc(why || L('Réservation par téléphone', 'Book by phone')) + '</b><span>' + L('Appelez-nous, on vous donne un créneau tout de suite.', 'Call us and we will give you a time slot right away.') + '</span></div>' +
        '<a class="btn" href="tel:' + esc(tel.replace(/[^0-9+]/g, '')) + '">' + L('Appeler le ', 'Call ') + esc(tel) + '</a>';
      form.__ag = false; return true;
    }
    function agForm(form) {
      if (!AG || !AG.on) { callBlock(form); return; }
      if (!(AG.slots || []).some(function (x) { return x.left > 0; })) { if (callBlock(form, L('Plus de créneau en ligne ces prochains jours', 'No online slots left in the coming days'))) return; }
      var c = q(form, '.cs-call'); if (c) { c.remove(); qa(form, '[data-cs-off]').forEach(function (e) { e.hidden = false; e.removeAttribute('data-cs-off'); }); }
      qa(form, 'input[type="date"],input[type="datetime-local"],input[type="time"],select').forEach(function (el) {
        if (el.tagName === 'SELECT' && !qa(el, 'option').some(function (o) { return /^\d{1,2}[:h]\d{2}$/.test(o.textContent.trim()); })) return;
        var w = el.closest('.f') || el; w.hidden = true; w.setAttribute('data-cs-off', ''); el.required = false;
      });
      var pax = qa(form, 'select').filter(function (x) { return /couvert|personne/i.test(labelFor(form, x)); })[0];
      if (pax && AG.maxparty) { qa(pax, 'option').forEach(function (o) { if ((parseInt(o.textContent, 10) || 0) > AG.maxparty) o.remove(); }); if (!pax.__csag) { pax.__csag = 1; pax.addEventListener('change', function () { form.__slot = null; picker(q(form, '.cs-ag'), form); }); } }
      var box = q(form, '.cs-ag'); if (!box) { box = document.createElement('div'); box.className = 'cs-ag'; var sb = q(form, '[type="submit"]'); form.insertBefore(box, sb || null); }
      form.__ag = true; picker(box, form);
    }
    function loadAg() {
      return fetch(API + '/rest/v1/rpc/cs_agenda_public', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ p_slug: slug, p_days: 21 }) })
        .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { AG = j || { on: false }; return AG; });
    }
    function refreshAg() { loadAg().then(function () { if (AGF) agForm(AGF); }).catch(function () {}); }
    window.CS_AGENDA_INIT = function (trade) {
      if (!/^(beaute|bienetre|veterinaire|autoecole|coach|photographe|toiletteur|nautisme|kine|dentiste|bijouterie|liberal|services|evenementiel|tourisme|location|infirmier|restaurant|garage)$/.test(trade || '')) return;
      var form = q(document, 'form#bookform'); if (!form || form.closest('[hidden]')) return;
      agCss(); AGF = form;
      loadAg().then(function () { agForm(form); }).catch(function () { /* le formulaire de demande reste en place */ });
    };
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function ready() {
      qa(document, 'form').forEach(function (f) { if (!SKIP[f.id]) prepare(f); });
      document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.tagName !== 'FORM' || SKIP[form.id] || form.closest('.cs-lead')) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
        if (form.__ag && !form.__slot) { var ok = q(form, '.ok'); if (!ok) { ok = document.createElement('div'); ok.className = 'ok'; form.appendChild(ok); } ok.textContent = L('Choisissez d\'abord un jour et une heure.', 'First choose a day and a time.'); ok.hidden = false; var pk = q(form, '.cs-ag'); if (pk) pk.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
        open(form);
      }, true);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  }
})();
