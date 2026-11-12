/* MyCreativeSite · modification directe sur le site (10/11/2026, demande d'Anthony).
   Dans l'espace client, l'aperçu du site devient modifiable :
   - un clic sur un texte (titre, prix, horaire, coordonnées…) et on tape directement dessus ;
   - un clic sur une photo ouvre une fenêtre pour la changer, la recadrer ou la retirer (la bannière ouvre sa propre fenêtre) ;
   - sur un élément de liste (prestation, véhicule, bien, tarif, horaire), une petite barre : monter, descendre, supprimer, ajouter, fiche.
   Tout passe par les mêmes données que le menu de gauche (state), qui est remis à jour après chaque changement.
   Ce fichier utilise les fonctions de l'espace (state, refresh, markDirty, photoField, bannerManager, buildForms, sheet, toast…). */
(function () {
  'use strict';
  var ON_KEY = 'cs-ie';
  var ieOn = true; try { ieOn = localStorage.getItem(ON_KEY) !== '0'; } catch (e) {}
  var editing = null, editOld = '', curItem = null, firstHint = true;
  var LIST_KEYS = ['stats', 'contacts', 'cards', 'items', 'hours', 'fleet'];
  var ADDABLE = { cards: 1, items: 1, hours: 1, fleet: 1, prices: 1, stats: 0, contacts: 0 };

  function qa(r, s) { try { return [].slice.call(r.querySelectorAll(s)); } catch (e) { return []; } }
  function D() { try { return doc(); } catch (e) { return null; } }
  function mobile() { return window.innerWidth <= 860; }
  function admin() { return window.CS_ADMIN === true; }

  /* ---------- Lire / écrire une donnée d'après son chemin ---------- */
  // « text|title », « cards|2|t », « prices|0|3|p »
  function getV(path) {
    if (path.indexOf('tx|') === 0) { var k0 = path.slice(3), t0 = (state && state.tx) || {}; return typeof t0[k0] === 'string' ? t0[k0] : k0; }
    var a = path.split('|'), c = state; if (!c) return '';
    if (a[0] === 'text') return (c.text || {})[a[1]] || '';
    if (a[0] === 'prices') { var g = (c.prices || [])[+a[1]], o = g && g[+a[2]]; return o ? o[a[3]] || '' : ''; }
    var arr = c[a[0]], it = arr && arr[+a[1]]; return it ? it[a[2]] || '' : '';
  }
  function setV(path, v) {
    if (path.indexOf('tx|') === 0) { if (!state) return; var k1 = path.slice(3); state.tx = state.tx && typeof state.tx === 'object' ? state.tx : {};
      if (!v || v === k1) delete state.tx[k1]; else state.tx[k1] = v; return; }
    var a = path.split('|'), c = state; if (!c) return;
    if (a[0] === 'text') { c.text = c.text || {}; c.text[a[1]] = v; return; }
    if (a[0] === 'prices') { var g = (c.prices || [])[+a[1]], o = g && g[+a[2]]; if (o) o[a[3]] = v; return; }
    var arr = c[a[0]], it = arr && arr[+a[1]]; if (it) it[a[2]] = v;
  }

  /* ---------- Repérer sur la page ce qui se modifie ---------- */
  var CSS = 'html.cs-ie [data-cse]{outline:1.5px dashed transparent;outline-offset:3px;cursor:text;border-radius:2px;transition:outline-color .15s,background-color .15s;-webkit-user-select:text;user-select:text}' +
    'html.cs-ie [data-cse]:hover{outline-color:rgba(37,99,235,.75)}' +
    'html.cs-ie [data-cse]:focus{outline:2px solid #2563EB;outline-offset:3px;background-color:rgba(37,99,235,.08)}' +
    'html.cs-ie [data-cse]:empty::before{content:"Écrire ici";opacity:.45}' +
    'html.cs-ie [data-csp]{cursor:pointer}' +
    'html.cs-ie .cs-ie-cur{outline:2px solid rgba(37,99,235,.55);outline-offset:4px;border-radius:4px}' +
    'html.cs-ie [data-csp]:hover{box-shadow:inset 0 0 0 3px rgba(37,99,235,.8)}' +
    '.cs-ie-ui{position:fixed;z-index:2147483000;display:none;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:0;text-transform:none}' +
    '.cs-ie-ui.on{display:flex}' +
    '.cs-ie-pb{gap:6px;align-items:center;background:#2563EB;color:#fff;border-radius:999px;padding:8px 12px;box-shadow:0 6px 18px rgba(0,0,0,.25);pointer-events:none;white-space:nowrap}' +
    '.cs-ie-bar{gap:2px;background:#12162B;border-radius:10px;padding:3px;box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
    '.cs-ie-bar button{all:unset;cursor:pointer;color:#fff;padding:8px 10px;border-radius:7px;white-space:nowrap;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.cs-ie-bar button:hover{background:rgba(255,255,255,.16)}.cs-ie-bar button[hidden]{display:none}' +
    '.cs-ie-bar .del:hover{background:#DC2626}' +
    '@media (hover:none){.cs-ie-bar button{padding:11px 12px;font-size:14px}}';

  function plain(el) { try { el.contentEditable = 'plaintext-only'; if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'; } catch (e) { el.contentEditable = 'true'; } }

  function ui(d) {
    if (!d.getElementById('cs-ie-css')) { var st = d.createElement('style'); st.id = 'cs-ie-css'; st.textContent = CSS; d.head.appendChild(st); }
    var pb = d.getElementById('cs-ie-pb');
    if (!pb) { pb = d.createElement('div'); pb.id = 'cs-ie-pb'; pb.className = 'cs-ie-ui cs-ie-pb cs-notr'; d.body.appendChild(pb); }
    var bar = d.getElementById('cs-ie-bar');
    if (!bar) { bar = d.createElement('div'); bar.id = 'cs-ie-bar'; bar.className = 'cs-ie-ui cs-ie-bar cs-notr';
      bar.innerHTML = '<button type="button" data-a="up" title="Monter">↑</button><button type="button" data-a="down" title="Descendre">↓</button>' +
        '<button type="button" data-a="fiche">Fiche détaillée</button><button type="button" data-a="add">+ Ajouter</button><button type="button" data-a="del" class="del" title="Supprimer cette ligne">🗑 Supprimer</button>';
      d.body.appendChild(bar); }
    return { pb: pb, bar: bar };
  }

  function tag(d) {
    if (!d || !d.body || !state) return;
    qa(d, '[data-cse]').forEach(function (e) { if (e === editing) return; e.removeAttribute('data-cse'); e.removeAttribute('contenteditable'); e.removeAttribute('spellcheck'); });
    qa(d, '[data-csp]').forEach(function (e) { e.removeAttribute('data-csp'); });
    qa(d, '[data-csi]').forEach(function (e) { e.removeAttribute('data-csi'); });
    var off = !ieOn || (typeof pvEN !== 'undefined' && pvEN);
    d.documentElement.classList.toggle('cs-ie', !off);
    ui(d); hideUi(d);
    if (off) return;
    var T = CSEdit.TEXT, L = CSEdit.LISTS, c = state;
    var txt = function (el, path) { if (!el || el.closest('[data-cs-empty],[hidden]')) return; var a = el.querySelector('a[data-cs-page]'); el = a || el; el.setAttribute('data-cse', path); if (el !== editing) { plain(el); el.spellcheck = false; } };
    Object.keys(T).forEach(function (k) {
      if (!c.text || c.text[k] === undefined) return;
      if ((k === 'avis_t' || k === 'avis_d') && !admin()) return;
      txt(d.querySelector(T[k]), 'text|' + k);
    });
    LIST_KEYS.forEach(function (k) {
      var def = L[k], arr = c[k]; if (!def || !Array.isArray(arr)) return;
      qa(d, def.items).forEach(function (el, i) {
        if (el.hasAttribute('data-cs-empty') || i >= arr.length) return;
        el.setAttribute('data-csi', k + '|' + i);
        Object.keys(def.f).forEach(function (f) { txt(el.querySelector(def.f[f]), k + '|' + i + '|' + f); });
        if (def.img) { var pe = el.querySelector(def.img) || (el.classList.contains('photo') ? el : null); if (pe) pe.setAttribute('data-csp', k + '|' + i); }
      });
    });
    if (Array.isArray(c.prices)) qa(d, '.prices').forEach(function (box, g) {
      var arr = c.prices[g]; if (!Array.isArray(arr)) return;
      qa(box, ':scope > .row').forEach(function (r, i) {
        if (r.hasAttribute('data-cs-empty') || i >= arr.length) return;
        r.setAttribute('data-csi', 'prices.' + g + '|' + i);
        ['t', 'd', 'p'].forEach(function (f) { txt(r.querySelector('.' + f), 'prices|' + g + '|' + i + '|' + f); });
      });
    });
    // tous les autres petits textes (titres de rubriques, encadrés, libellés, boutons, menu…)
    if (CSEdit.freeLeaves) CSEdit.freeLeaves(d).forEach(function (el) { if (el.hasAttribute('data-cse') || el.closest('[data-cse]')) return;
      txt(el, 'tx|' + (el.getAttribute('data-cso') || CSEdit.norm(el.textContent))); });
    var c2 = c.photos || {};
    var he = d.querySelector('.photo.hero'); if (he) he.setAttribute('data-csp', 'hero');
    var te = d.querySelector('.team .photo'); if (te && 'team' in c2) te.setAttribute('data-csp', 'team|0');
    if (Array.isArray(c2.gallery)) qa(d, '.gallery > .photo').forEach(function (e, i) { e.setAttribute('data-csp', 'gallery|' + i); });
  }

  function hideUi(d) { d = d || D(); if (!d) return; qa(d, '.cs-ie-ui').forEach(function (e) { e.classList.remove('on'); }); qa(d, '.cs-ie-cur').forEach(function (e) { e.classList.remove('cs-ie-cur'); }); curItem = null; }

  /* ---------- Textes ---------- */
  function commit(el, keep) {
    if (!el) return;
    var path = el.getAttribute('data-cse'); if (!path) return;
    var v = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 2000);
    if (!keep) { el.textContent = v; }
    if (v !== getV(path)) { setV(path, v); markDirty(); }
  }
  function startEdit(el) {
    if (editing === el) return;
    editing = el; editOld = getV(el.getAttribute('data-cse'));
    var pth = el.getAttribute('data-cse'); if (pth.indexOf('tx|') === 0) el.setAttribute('data-cso', pth.slice(3)); // garde le texte d'origine pour la suite
    el.spellcheck = true;
  }
  function endEdit(el, cancel) {
    if (!el || editing !== el) return;
    if (cancel) { el.textContent = editOld; setV(el.getAttribute('data-cse'), editOld); }
    else commit(el);
    el.spellcheck = false; editing = null;
    refresh(); resync();
  }

  /* ---------- Menu de gauche remis à jour ---------- */
  var rsT = null;
  function resync() { clearTimeout(rsT); rsT = setTimeout(rebuildPanel, 150); }
  function rebuildPanel() {
    var P = $('panel'); if (!P || !state || !site) return;
    var open = qa(P, ':scope > details.sec').filter(function (x) { return x.open; }).map(function (x) { var s = x.querySelector('summary'); return s ? s.textContent : ''; });
    var fopen = qa(P, 'details.fiche').map(function (x) { return x.open; });
    var st = P.scrollTop, ws = window.scrollY;
    buildForms();
    qa(P, ':scope > details.sec').forEach(function (x) { var s = x.querySelector('summary'); x.open = open.indexOf(s ? s.textContent : '') >= 0; });
    qa(P, 'details.fiche').forEach(function (x, i) { if (fopen[i]) x.open = true; });
    P.scrollTop = st; window.scrollTo(0, ws);
  }
  // Menu de gauche : rubrique « Autres textes modifiés » (petits textes changés directement sur le site), avec retour au texte d'origine
  function freeSection() {
    var tx = state && state.tx; if (!tx || typeof tx !== 'object') return;
    var keys = Object.keys(tx).filter(function (k) { return typeof tx[k] === 'string'; }); if (!keys.length) return;
    var b = section('Autres textes modifiés', false, 'Les petits textes que vous avez changés en cliquant sur le site. Videz un texte ou touchez « Texte d\'origine » pour le remettre.');
    keys.forEach(function (k) {
      var f = field('À la place de « ' + (k.length > 60 ? k.slice(0, 60) + '…' : k) + ' »', tx[k], function (v) { if (v.trim()) tx[k] = v; else delete tx[k]; });
      var r = document.createElement('button'); r.type = 'button'; r.className = 'btn sm'; r.style.marginTop = '6px'; r.textContent = 'Texte d\'origine';
      r.addEventListener('click', function () { delete tx[k]; refresh(); markDirty(); rebuildPanel(); toast('Texte d\'origine remis'); });
      f.appendChild(r); b.appendChild(f);
    });
    var P = $('panel'), sec = b.parentNode, help = P.querySelector(':scope > p.hint:last-child'); if (help && sec) P.insertBefore(sec, help);
  }
  if (typeof window.buildForms === 'function') { var _bf = window.buildForms; window.buildForms = function () { var r = _bf.apply(this, arguments); try { freeSection(); } catch (e) {} try { drawSty(); } catch (e) {} return r; }; }
  window.CSInline = { rebuildPanel: rebuildPanel, tag: function () { tag(D()); } };

  /* ---------- Listes : on passe par les boutons du menu de gauche (mêmes règles, mêmes maximums) ---------- */
  function panelBox(list) { return document.querySelector('#panel [data-list="' + list + '"]'); }
  function panelItems(box) { return [].slice.call(box.children).filter(function (x) { return x.classList.contains('item'); }); }
  function clickTool(it, re) { var b = it && qa(it, ':scope > .tools button').filter(function (x) { return re.test(x.textContent.trim()); })[0]; if (b) { b.click(); return true; } return false; }
  function showPanelItem(list, i) {
    var box = panelBox(list); if (!box) return null;
    var sec = box.closest('details'); if (sec) sec.open = true;
    var it = panelItems(box)[i];
    if (mobile() && $('tEdit')) $('tEdit').click();
    setTimeout(function () { (it || box).scrollIntoView({ behavior: 'smooth', block: 'start' }); }, mobile() ? 120 : 0);
    return it;
  }
  function listAct(a, csi) {
    var p = csi.split('|'), list = p[0], i = +p[1], box = panelBox(list);
    if (!box) { toast('Modifiez cette partie dans le menu « Modifier ».'); return; }
    var its = panelItems(box), it = its[i];
    hideUi();
    if (a === 'up') clickTool(it, /Monter/);
    else if (a === 'down') clickTool(it, /Descendre/);
    else if (a === 'del') { if (confirm('Supprimer cette ligne du site ?')) { if (clickTool(it, /^Supprimer/)) toast('Élément supprimé'); } }
    else if (a === 'fiche') { var x = showPanelItem(list, i); var f = x && x.querySelector('details.fiche'); if (f) f.open = true; }
    else if (a === 'add') {
      var b = [].slice.call(box.children).filter(function (x) { return x.tagName === 'BUTTON' && /^\+ /.test(x.textContent.trim()); })[0];
      if (!b) { toast('On ne peut pas ajouter d\'élément ici.'); return; }
      var n = panelItems(box).length; b.click();
      if (panelItems(box).length <= n) return; // maximum atteint (message déjà affiché)
      setTimeout(function () { var d = D(); if (!d) return; var el = d.querySelector('[data-csi="' + list + '|' + n + '"]'); if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var t = el.querySelector('[data-cse]'); if (t) setTimeout(function () { t.focus(); try { var r = d.createRange(); r.selectNodeContents(t); var s = d.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {} }, 350);
        toast('Ajouté : tapez directement le titre, puis la photo'); }, 350);
    }
  }

  /* ---------- Photos ---------- */
  function photoEdit(path) {
    var d = D(), c = state; if (!d || !c) return;
    if (path === 'hero') { bannerManager(c, d, function () { tag(D()); resync(); }); return; }
    c.photos = c.photos || {};
    var P = function (k) { return [function () { return (c.photos.pos || {})[k]; }, function (v) { c.photos.pos = c.photos.pos && typeof c.photos.pos === 'object' ? c.photos.pos : {}; if (v) c.photos.pos[k] = v; else delete c.photos.pos[k]; }]; };
    var p = path.split('|'), k = p[0], i = +p[1], f = null, title = 'Modifier la photo';
    if (k === 'team') f = photoField('Photo de la présentation', function () { return d.querySelector('.team .photo'); }, function () { return c.photos.team; }, function (u) { c.photos.team = u; }, { pos: P('team'), remove: 'hide' });
    else if (k === 'gallery') { c.photos.gallery = c.photos.gallery || []; title = 'Photo ' + (i + 1) + ' de la galerie';
      f = photoField('Photo ' + (i + 1), function () { return d.querySelectorAll('.gallery > .photo')[i]; }, function () { return c.photos.gallery[i]; }, function (u) { c.photos.gallery[i] = u; }, { pos: P('g' + i), remove: 'hide' }); }
    else if (c[k] && c[k][i]) { var o = c[k][i], def = CSEdit.LISTS[k];
      f = photoField(o.t ? 'Photo : ' + o.t : 'Photo', function () { var el = d.querySelectorAll(def.items)[i]; return el && (el.querySelector(def.img) || el); }, function () { return o.img; }, function (u) { o.img = u; },
        { pos: [function () { return o.pos; }, function (v) { if (v) o.pos = v; else delete o.pos; }], remove: k === 'cards' ? 'hide' : 'reset' }); }
    if (!f) return;
    var r = sheet(title, '<div class="card" style="gap:12px"><p class="hint" style="margin:0">Changez la photo, puis touchez sur la vignette ce qui doit rester visible. Le site se met à jour tout de suite à côté.</p><div class="iebox"></div><div><button class="btn primary" type="button" data-x>Terminé</button></div></div>');
    r[0].querySelector('.iebox').appendChild(f);
    var mo = new MutationObserver(function () { if (!document.body.contains(r[0])) { mo.disconnect(); resync(); } });
    mo.observe(document.body, { childList: true });
  }

  /* ---------- Barre de liste et pastille photo ---------- */
  function place(el, box, d, pos) {
    var w = d.defaultView, r = box.getBoundingClientRect(), vw = w.innerWidth, vh = w.innerHeight;
    el.classList.add('on');
    // l'aperçu ordinateur est réduit dans l'espace : la barre garde sa taille normale à l'écran
    var m = /scale\(([\d.]+)\)/.exec(pv.style.transform || ''), k = m && +m[1] > 0 ? Math.min(2.2, 1 / +m[1]) : 1;
    el.style.transformOrigin = '0 0'; el.style.transform = k !== 1 ? 'scale(' + k + ')' : '';
    var ew = el.offsetWidth * k, eh = el.offsetHeight * k;
    // pastille photo : en bas à gauche de la photo ; barre de liste : juste au-dessus de l'élément, à droite (ne cache ni le titre ni le prix)
    var x, y;
    if (pos === 'bl') { x = r.left + 10; y = Math.min(r.bottom, vh) - eh - 10; }
    else { x = r.right - ew; y = r.top - eh - 4; if (y < 6) y = Math.max(6, r.top + 6); }
    x = Math.max(6, Math.min(vw - ew - 6, x)); y = Math.max(6, Math.min(vh - eh - 6, y));
    el.style.left = x + 'px'; el.style.top = y + 'px';
  }
  function showBar(item, d) {
    var u = ui(d), csi = item.getAttribute('data-csi'), list = csi.split('|')[0], i = +csi.split('|')[1];
    var arr = list.indexOf('prices.') === 0 ? (state.prices || [])[+list.split('.')[1]] : state[list];
    var n = arr ? arr.length : 0, box = panelBox(list);
    var addBtn = box && [].slice.call(box.children).some(function (x) { return x.tagName === 'BUTTON' && /^\+ /.test(x.textContent.trim()); });
    var hasDel = box && panelItems(box)[i] && qa(panelItems(box)[i], ':scope > .tools button').some(function (x) { return /^Supprimer/.test(x.textContent.trim()); });
    u.bar.querySelector('[data-a="up"]').hidden = i <= 0;
    u.bar.querySelector('[data-a="down"]').hidden = i >= n - 1;
    u.bar.querySelector('[data-a="add"]').hidden = !addBtn || !ADDABLE[list.split('.')[0]];
    u.bar.querySelector('[data-a="del"]').hidden = !hasDel;
    u.bar.querySelector('[data-a="fiche"]').hidden = !(list === 'items' && item.hasAttribute('data-fiche') && typeof ITEM_CFG !== 'undefined' && ITEM_CFG[site.trade]);
    if (!box) { u.bar.classList.remove('on'); return; }
    u.bar.setAttribute('data-for', csi); qa(d, '.cs-ie-cur').forEach(function (e) { e.classList.remove('cs-ie-cur'); }); curItem = item; item.classList.add('cs-ie-cur');
    place(u.bar, item, d, 'tr');
  }
  function showPb(pe, d) {
    var u = ui(d), path = pe.getAttribute('data-csp');
    u.pb.textContent = path === 'hero' ? '📷 Changer ou recadrer la bannière' : (pe.style.display === 'none' ? '📷 Remettre une photo' : '📷 Changer la photo');
    place(u.pb, pe, d, 'bl');
  }

  /* ---------- Branchement sur l'aperçu ---------- */
  function hook() {
    var d = D(); if (!d || !d.defaultView || d.__csIe) return; d.__csIe = 1;
    var w = d.defaultView;
    d.addEventListener('cs:applied', function () { tag(d); });
    var touch = function () { return !!(w.matchMedia && w.matchMedia('(hover:none)').matches); };
    var swT = null;
    var onUi = function (t) { return t && t.closest && t.closest('.cs-ie-ui'); };
    w.addEventListener('click', function (e) {
      if (!ieOn || !d.documentElement.classList.contains('cs-ie')) return;
      var t = e.target; if (!t || !t.closest) return;
      var b = onUi(t);
      if (b) { e.preventDefault(); e.stopPropagation(); var bt = t.closest('button[data-a]'), bar = d.getElementById('cs-ie-bar'); if (bt && bar) listAct(bt.getAttribute('data-a'), bar.getAttribute('data-for') || ''); return; }
      if (touch()) { var it = t.closest('[data-csi]'); if (it) showBar(it, d); else hideUi(d); }
      var te = t.closest('[data-cse]');
      if (te) { e.preventDefault(); e.stopPropagation(); if (d.activeElement !== te) te.focus(); return; }
      var pe = t.closest('[data-csp]');
      if (pe) { e.preventDefault(); e.stopPropagation(); photoEdit(pe.getAttribute('data-csp')); return; }
      if (t.closest('[data-fiche]')) { e.preventDefault(); e.stopPropagation(); return; }
      var a = t.closest('a[href]');
      if (a && !/^#/.test(a.getAttribute('href') || '')) { e.preventDefault(); e.stopPropagation(); toast('Liens désactivés pendant la modification. Touchez « Voir en visiteur » pour les essayer.'); }
    }, true);
    w.addEventListener('submit', function (e) { if (!ieOn) return; e.preventDefault(); e.stopPropagation(); toast('Formulaire désactivé pendant la modification.'); }, true);
    d.addEventListener('focusin', function (e) { var t = e.target; if (!t || !t.hasAttribute || !t.hasAttribute('data-cse')) return;
      if (typeof pvEN !== 'undefined' && pvEN) { t.blur(); toast('Repassez l\'aperçu en français pour modifier vos textes (la traduction se fait dans « Version anglaise »).'); return; }
      startEdit(t); });
    d.addEventListener('focusout', function (e) { var t = e.target; if (t && t === editing) endEdit(t); });
    d.addEventListener('input', function (e) { var t = e.target; if (t && t === editing) commit(t, true); });
    d.addEventListener('keydown', function (e) {
      var t = e.target; if (!t || t !== editing) return;
      if (e.key === 'Enter') { e.preventDefault(); t.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); endEdit(t, true); t.blur(); }
    });
    d.addEventListener('paste', function (e) { var t = e.target; if (!t || !t.closest || !t.closest('[data-cse]')) return;
      e.preventDefault(); var s = ((e.clipboardData || w.clipboardData).getData('text/plain') || '').replace(/\s+/g, ' ');
      try { d.execCommand('insertText', false, s); } catch (x) {} });
    d.addEventListener('mouseover', function (e) {
      if (!ieOn || touch()) return; var t = e.target; if (!t || !t.closest) return;
      // 10/11/2026 (Anthony) : la barre ne saute plus sur la ligne voisine quand on monte la souris vers elle :
      // elle attend que la souris reste un instant sur une autre ligne avant de changer.
      if (onUi(t)) { clearTimeout(swT); return; }
      var u = ui(d), pe = t.closest('[data-csp]');
      if (pe && !t.closest('[data-cse]') && !(pe.classList.contains('hero') && t !== pe && t.closest('a,button'))) showPb(pe, d); else u.pb.classList.remove('on');
      var it = t.closest('[data-csi]');
      if (it === curItem && u.bar.classList.contains('on')) { clearTimeout(swT); return; }
      clearTimeout(swT);
      if (it && !u.bar.classList.contains('on')) showBar(it, d);
      else swT = setTimeout(function () { if (it) showBar(it, d); else hideUi(d); }, 450);
    });
    d.addEventListener('mouseleave', function () { clearTimeout(swT); swT = setTimeout(function () { hideUi(d); }, 450); });
    d.addEventListener('scroll', function () { var u = ui(d); u.pb.classList.remove('on'); if (curItem) place(u.bar, curItem, d, 'tr'); }, { passive: true, capture: true });
    tag(d);
  }

  /* ---------- Bouton « Modifier en cliquant / Voir comme un visiteur » ---------- */
  function drawToggle() {
    var b = $('ieTg'); if (!b) return;
    b.setAttribute('aria-pressed', ieOn ? 'true' : 'false');
    b.innerHTML = ieOn ? '<span aria-hidden="true">👁</span><span class="lg"> Voir en visiteur</span>' : '<span aria-hidden="true">✏️</span><span class="lg"> Modifier en cliquant</span>';
    b.setAttribute('aria-label', ieOn ? 'Voir en visiteur' : 'Modifier en cliquant');
    b.title = ieOn ? 'Voir le site comme vos visiteurs (liens, formulaires et fiches actifs)' : 'Cliquez ensuite sur un texte ou une photo du site pour le modifier';
    var s = document.querySelector('.pv-bar .status');
    if (s) s.textContent = ieOn ? 'Cliquez sur un texte ou une photo pour le modifier' : 'Le site comme le voient vos visiteurs';
  }
  function setOn(v) {
    ieOn = v; try { localStorage.setItem(ON_KEY, v ? '1' : '0'); } catch (e) {}
    var d = D(); if (editing) { try { editing.blur(); } catch (e) {} }
    if (d) { if (!v) { qa(d, '[data-cse]').forEach(function (e) { e.removeAttribute('contenteditable'); }); d.documentElement.classList.remove('cs-ie'); hideUi(d); } else tag(d); }
    drawToggle();
  }
  /* 10/11/2026 (Anthony) : choisir le style sans que tout défile. Chaque changement de style ramène l'aperçu en haut
     du site (même écran pour comparer), et des flèches « ‹ Style › » dans la barre de l'aperçu font passer d'un style à l'autre. */
  function styleBtns() { return qa(document, '#panel .styles button'); }
  function styleTop() { var d = D(); if (!d || !d.defaultView) return; var go = function () { try { d.defaultView.scrollTo(0, 0); } catch (e) {} }; go(); setTimeout(go, 60); setTimeout(go, 250); setTimeout(go, 600); }
  function drawSty() {
    var lab = $('ieStyN'); if (!lab) return;
    var cur = styleBtns().filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
    lab.textContent = cur ? cur.textContent.replace(/\s*★\s*$/, '') : 'Style';
  }
  function stepStyle(dir) {
    var all = styleBtns(); if (!all.length) return;
    var ok = all.filter(function (b) { return !/Réservé/.test(b.title || ''); });
    var i = all.findIndex(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    var j = ok.indexOf(all[i]); j = j < 0 ? 0 : (j + dir + ok.length) % ok.length;
    ok[j].click(); drawSty();
  }
  function init() {
    var bar = document.querySelector('.pv-bar'); if (!bar || $('ieTg')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'ieTg'; b.className = 'ie-tg';
    var st = bar.querySelector('.status'); bar.insertBefore(b, st ? st.nextSibling : null);
    b.addEventListener('click', function () { setOn(!ieOn); });
    var sty = document.createElement('div'); sty.className = 'ie-sty'; sty.setAttribute('role', 'group'); sty.setAttribute('aria-label', 'Style du site');
    sty.innerHTML = '<button type="button" data-d="-1" aria-label="Style précédent">‹</button><span id="ieStyN" title="Style du site">Style</span><button type="button" data-d="1" aria-label="Style suivant">›</button>';
    sty.addEventListener('click', function (e) { var x = e.target.closest('button[data-d]'); if (x) stepStyle(+x.getAttribute('data-d')); });
    var seg = bar.querySelector('.seg'); bar.insertBefore(sty, seg ? seg.nextSibling : bar.firstChild);
    $('panel').addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.styles button')) { styleTop(); setTimeout(drawSty, 0); } });
    var css = document.createElement('style');
    css.textContent = '.ie-tg{margin-left:auto;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--paper);color:var(--ink);font:600 .85rem inherit;font-family:inherit;border-radius:999px;padding:7px 12px;cursor:pointer;white-space:nowrap}' +
      '.ie-tg[aria-pressed="false"]{background:#2563EB;border-color:#2563EB;color:#fff}' +
      '.pv-bar .status{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.ie-tg+.pv-x{margin-left:0}' +
      '.ie-sty{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:10px;background:var(--paper);overflow:hidden;flex:none}' +
      '.ie-sty button{border:0;background:none;font:700 1.15rem/1 inherit;font-family:inherit;padding:6px 11px;cursor:pointer;color:var(--ink)}.ie-sty button:hover{background:var(--soft)}' +
      '.ie-sty span{font-weight:600;font-size:.85rem;min-width:96px;max-width:150px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}' +
      '.preview{grid-template-columns:minmax(0,1fr)}.pv-bar{min-width:0}.pv-bar .seg,.ie-tg{flex:none}' +
      '@media (max-width:1180px){.ie-tg .lg{display:none}.ie-tg{padding:7px 11px}}' +
      '@media (max-width:860px){.ie-sty span{min-width:0;max-width:120px}.pv-bar{flex-wrap:wrap}.pv-bar .status{order:3;flex:1 1 100%;font-size:.8rem}.ie-tg{margin-left:0}.ie-tg+.pv-x{margin-left:auto}}';
    document.head.appendChild(css);
    drawToggle();
    pv.addEventListener('load', function () { setTimeout(hook, 0); });
    hook();
    // venu du bouton « Modifier mon site » affiché sur le vrai site : directement sur le site, en mode modification
    if (params.get('vue') === 'modifier') {
      if (!ieOn) setOn(true);
      var go = function () { if (!site || !state) return setTimeout(go, 200);
        params.delete('vue'); var u = new URL(location.href); u.searchParams.delete('vue'); history.replaceState(null, '', u.pathname + u.search); if (typeof setMode === 'function' && mode !== 'edit') setMode('edit'); if (mobile() && $('tView')) $('tView').click(); toast('Cliquez sur un texte ou une photo de votre site pour le modifier'); };
      setTimeout(go, 300);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
