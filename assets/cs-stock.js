/* MyCreativeSite · espace client · onglet « Mes véhicules » (garages) / « Mes biens » (agences immobilières) — 08/11/2026 (demande d'Anthony).
   Un vrai espace pour mettre le stock en ligne : liste avec photos et statut, fiche complète par annonce
   (véhicule : marque, modèle, année, km, énergie, boîte, puissance… ; bien : surface, pièces, DPE / GES, charges, honoraires…).
   Tout est rangé dans state.items (mêmes annonces que le site) : le site et la diffusion Abracadeal suivent.
   Les caractéristiques détaillées sont dans item.sp ; on en déduit les infos courtes (meta), la fiche technique (specs),
   la ville, la marque, l'énergie, l'étiquette (Vendu, Réservé, Sous compromis…) et le texte des dépenses d'énergie.
   Utilise les fonctions de espace/index.html : site, state, uploadPhoto, toast, markDirty, refresh, buildForms, escH, SB, DEMO. */
(function () {
  var ST = { v: 'list', i: -1, draft: null, abra: null };
  // Annonces d'exemple du modèle (site jamais enregistré) : repérées ici, jamais enregistrées comme marqueur
  var SAMPLE = new WeakSet();
  var CSS = '' +
    '.stk-h{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:end}.stk-h h2{margin:0}.stk-h p{margin:4px 0 0;color:var(--muted)}' +
    '.stk-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.stk-bar input,.stk-bar select{width:auto;min-width:0}' +
    '.stk-ab{border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;background:var(--paper);display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:.92rem}' +
    '.stk-ab>span:not(.stk-dot){flex:1;min-width:200px}.stk-ab b{font-weight:700}.stk-dot{width:10px;height:10px;border-radius:50%;background:var(--muted);flex:none}.stk-dot.ok{background:var(--ok)}.stk-dot.wait{background:var(--warn)}.stk-dot.bad{background:var(--bad)}' +
    '.stk-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}' +
    '.stk-c{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:var(--bg);display:flex;flex-direction:column;cursor:pointer;text-align:left;padding:0;font:inherit;color:inherit}' +
    '.stk-c:hover{border-color:var(--brand)}.stk-im{aspect-ratio:4/3;background:var(--soft) center/cover no-repeat;position:relative}' +
    '.stk-st{position:absolute;top:8px;left:8px;font-size:.74rem;font-weight:700;padding:4px 9px;border-radius:999px;background:var(--ok);color:#fff}.stk-st.r{background:var(--warn)}.stk-st.v{background:#555}' +
    '.stk-n{position:absolute;bottom:8px;right:8px;font-size:.74rem;font-weight:700;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.65);color:#fff}' +
    '.stk-b{padding:11px 12px;display:grid;gap:4px}.stk-b b{font-size:1rem}.stk-b .px{font-weight:800;color:var(--brand)}.stk-b .m{color:var(--muted);font-size:.85rem}' +
    '.stk-w{color:var(--warn);font-size:.8rem;font-weight:600}' +
    '.stk-e{display:grid;gap:14px}.stk-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;position:sticky;top:0;z-index:5;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line)}.stk-top h2{margin:0;font-size:1.15rem;flex:1;min-width:180px}' +
    '.stk-s{border:1px solid var(--line);border-radius:var(--r);padding:14px;background:var(--paper);display:grid;gap:12px}.stk-s>h3{margin:0;font-size:1rem}.stk-s>p.hint{margin:-6px 0 0}' +
    '.stk-r{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.stk-r label{font-size:.85rem}' +
    '.stk-seg{display:inline-flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;flex-wrap:wrap}.stk-seg button{border:0;background:var(--bg);padding:8px 14px;font:inherit;font-weight:600;cursor:pointer;color:var(--ink)}.stk-seg button[aria-pressed="true"]{background:var(--brand);color:#fff}' +
    '.stk-req{color:var(--bad)}.stk-miss{border:1px solid var(--warn);background:color-mix(in srgb,var(--warn) 12%,transparent);border-radius:10px;padding:10px 12px;font-size:.88rem}' +
    '.stk-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}.stk-ph .ph{aspect-ratio:4/3;border-radius:9px;background:var(--soft) center/cover no-repeat;border:1px solid var(--line);position:relative}' +
    '.stk-ph .ph .x{position:absolute;top:5px;right:5px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(0,0,0,.7);color:#fff;font:700 13px/1 system-ui;cursor:pointer}' +
    '.stk-ph .ph .l{position:absolute;bottom:5px;left:5px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#111;font:700 14px/1 system-ui;cursor:pointer}' +
    '.stk-ph .ph .m1{position:absolute;bottom:5px;right:5px;font-size:.7rem;font-weight:700;padding:3px 7px;border-radius:999px;background:var(--brand);color:#fff}' +
    '.stk-ph .add{aspect-ratio:4/3;border:1.5px dashed var(--line);border-radius:9px;background:var(--bg);font-weight:700;font-size:.85rem;color:var(--brand);cursor:pointer}' +
    '.stk-ph.drag{outline:2px dashed var(--brand);outline-offset:4px}' +
    '.stk-foot{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between}' +
    '.stk-empty{border:1.5px dashed var(--line);border-radius:var(--r);padding:30px;text-align:center;color:var(--muted)}' +
    '@media (max-width:640px){.stk-r{grid-template-columns:1fr 1fr}.stk-g{grid-template-columns:1fr}}';

  function isCar() { return site && site.trade === 'garage'; }
  function isImmo() { return site && site.trade === 'immobilier'; }
  window.CSStock = { enabled: function () { return !!site && (isCar() || isImmo()); }, label: function () { return isImmo() ? 'Mes biens' : 'Mes véhicules'; }, open: open };

  var FUEL = ['Essence', 'Diesel', 'Hybride', 'Hybride rechargeable', 'Électrique', 'GPL', 'Éthanol (E85)'];
  var GEAR = ['Manuelle', 'Automatique'];
  var BODY = ['', 'Citadine', 'Berline', 'Break', 'SUV / 4x4', 'Coupé', 'Cabriolet', 'Monospace', 'Utilitaire', 'Pick-up', 'Moto', 'Scooter', 'Camping-car', 'Autre'];
  var CRIT = ['', '0 (électrique)', '1', '2', '3', '4', '5', 'Non classé'];
  var TYPES = [['appartement', 'Appartement'], ['maison', 'Maison, villa'], ['terrain', 'Terrain'], ['local', 'Local, bureau'], ['parking', 'Parking, box'], ['autre', 'Autre']];
  var LET = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var HEAT = ['', 'Individuel gaz', 'Individuel électrique', 'Pompe à chaleur', 'Collectif', 'Fioul', 'Bois / granulés', 'Climatisation réversible', 'Aucun'];
  var EXPO = ['', 'Nord', 'Sud', 'Est', 'Ouest', 'Sud-Est', 'Sud-Ouest', 'Nord-Est', 'Nord-Ouest', 'Traversant'];

  function nf(v) { var n = parseInt(String(v || '').replace(/\D/g, ''), 10); return isNaN(n) ? '' : n.toLocaleString('fr-FR').replace(/ | /g, ' '); }
  function num(v) { var n = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? '' : n; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sp(o) { if (!o.sp || typeof o.sp !== 'object') o.sp = {}; return o.sp; }
  function imgOf(o) { var a = [o.img].concat(Array.isArray(o.photos) ? o.photos : []).filter(function (u) { return typeof u === 'string' && /^(https:|blob:)/.test(u); }); return a; }

  // Fiche → infos dérivées (meta, specs, étiquette, titre par défaut…)
  function derive(o) {
    var s = sp(o), L = [], add = function (k, v, unit) { if (v !== '' && v != null && String(v).trim()) L.push(k + ' : ' + String(v).trim() + (unit || '')); };
    if (isCar()) {
      o.mk = (s.mk || '').trim(); o.fuel = s.fu || 'Essence';
      var auto = [o.mk, s.mo, s.ve].map(function (x) { return (x || '').trim(); }).filter(Boolean).join(' ');
      if (!o.t || o.t === o._auto || o.t === 'Nouveau véhicule') { o.t = auto || o.t; o._auto = o.t; }
      o.meta = [s.an, s.km !== '' && s.km != null && String(s.km).trim() ? nf(s.km) + ' km' : '', o.fuel, s.bo].filter(Boolean).join(' · ');
      add('Marque', o.mk); add('Modèle', s.mo); add('Version', s.ve); add('Année', s.an); add('Mise en circulation', s.mec);
      if (String(s.km || '').trim()) add('Kilométrage', nf(s.km), ' km');
      add('Énergie', o.fuel); add('Boîte de vitesses', s.bo); add('Carrosserie', s.ty);
      if (String(s.cv || '').trim()) add('Puissance fiscale', s.cv, ' CV'); if (String(s.ch || '').trim()) add('Puissance', s.ch, ' ch');
      add('Couleur', s.co); add('Portes', s.po); add('Places', s.pl); if (s.ca) add('Crit\'Air', s.ca); if (String(s.co2 || '').trim()) add('Émissions de CO₂', s.co2, ' g/km');
      add('Contrôle technique', s.ct); if (String(s.ga || '').trim()) add('Garantie', s.ga, /^\d+$/.test(String(s.ga).trim()) ? ' mois' : '');
      var stT = { reserve: 'Réservé', vendu: 'Vendu' }[s.st];
      if (stT) o.tag = stT; else if (/^(réservé|vendu)$/i.test(o.tag || '')) o.tag = '';
    } else {
      o.tr = o.tr === 'location' ? 'location' : 'vente'; o.type = o.type || 'appartement';
      o.city = (s.vi || '').trim(); o.rooms = String(s.pi || '').replace(/\D/g, '');
      var tl = (TYPES.filter(function (t) { return t[0] === o.type; })[0] || ['', 'Bien'])[1].split(',')[0];
      var autoT = [tl, o.rooms ? o.rooms + ' pièce' + (o.rooms > 1 ? 's' : '') : '', String(s.su || '').trim() ? num(s.su) + ' m²' : '', o.city].filter(Boolean).join(' · ');
      if (!o.t || o.t === o._auto || o.t === 'Nouveau bien') { o.t = autoT || o.t; o._auto = o.t; }
      o.meta = [o.city, o.rooms ? o.rooms + ' pièces' : '', String(s.su || '').trim() ? num(s.su) + ' m²' : '', String(s.te || '').trim() ? 'Terrain ' + nf(s.te) + ' m²' : '', s.et !== '' && s.et != null && String(s.et).trim() ? (String(s.et).trim() === '0' ? 'Rez-de-chaussée' : 'Étage ' + s.et) : ''].filter(Boolean).join(' · ');
      add('Type', tl); if (String(s.su || '').trim()) add('Surface habitable', num(s.su), ' m²'); if (String(s.te || '').trim()) add('Terrain', nf(s.te), ' m²');
      add('Pièces', o.rooms); add('Chambres', s.cb); add('Salles de bain / d\'eau', s.sb);
      if (String(s.et || '').trim()) add('Étage', String(s.et).trim() === '0' ? 'Rez-de-chaussée' : s.et + (String(s.ne || '').trim() ? ' sur ' + s.ne : ''));
      if (s.asc) add('Ascenseur', 'oui'); if (s.meu) add('Meublé', 'oui'); add('Année de construction', s.an); add('Chauffage', s.hc); add('Exposition', s.ex);
      if (o.tr === 'vente') { if (String(s.lots || '').trim()) add('Copropriété', nf(s.lots) + ' lots'); if (String(s.chg || '').trim()) add('Charges de copropriété', nf(s.chg), ' € / an'); if (String(s.tf || '').trim()) add('Taxe foncière', nf(s.tf), ' € / an'); }
      else { if (String(s.chm || '').trim()) add('Charges', nf(s.chm), ' € / mois'); if (String(s.dg || '').trim()) add('Dépôt de garantie', nf(s.dg), ' €'); }
      if (String(s.emin || '').trim() && String(s.emax || '').trim()) o.energy = 'entre ' + nf(s.emin) + ' € et ' + nf(s.emax) + ' € par an' + (s.ey ? ' (prix de l\'énergie indexés sur l\'année ' + s.ey + ')' : '') + '.';
      // Mentions légales : honoraires, copropriété, procédure (si le pro ne les a pas écrites lui-même)
      var lg = [];
      if (o.tr === 'vente') {
        if (String(s.hon || '').trim()) lg.push('Honoraires : ' + s.hon + '.');
        if (String(s.lots || '').trim()) lg.push('Bien en copropriété de ' + nf(s.lots) + ' lots' + (String(s.chg || '').trim() ? ', charges annuelles ' + nf(s.chg) + ' €' : '') + '.' + (s.proc ? ' Procédure en cours sur le syndicat des copropriétaires.' : ' Pas de procédure en cours.'));
      } else {
        if (String(o.p || '').trim()) lg.push('Loyer ' + o.p + (String(s.chm || '').trim() ? ', dont ' + nf(s.chm) + ' € de provision sur charges' : '') + '.');
        if (String(s.dg || '').trim()) lg.push('Dépôt de garantie : ' + nf(s.dg) + ' €.');
        if (String(s.hon || '').trim()) lg.push('Honoraires locataire : ' + s.hon + '.');
      }
      if (lg.length && (!o.legal || o.legal === o._legal)) { o.legal = lg.join(' '); o._legal = o.legal; }
      var stI = { compromis: 'Sous compromis', vendu: o.tr === 'location' ? 'Loué' : 'Vendu' }[s.st];
      if (stI) o.tag = stI; else if (/^(sous compromis|vendu|loué)$/i.test(o.tag || '')) o.tag = '';
    }
    o.specs = L.join('\n');
    var ph = Array.isArray(o.photos) ? o.photos : []; o.photos = ph;
    return o;
  }
  // Champs manquants pour une annonce complète (site + Abracadeal)
  function missing(o) {
    var s = sp(o), m = [];
    if (!imgOf(o).length) m.push('au moins une photo');
    if (!String(o.p || '').replace(/\D/g, '')) m.push('le prix');
    if (isCar()) { if (!s.mk) m.push('la marque'); if (!s.mo) m.push('le modèle'); if (!s.an) m.push('l\'année'); if (!String(s.km || '').trim()) m.push('le kilométrage'); }
    else { if (!s.vi) m.push('la ville'); if (!String(s.su || '').trim() && o.type !== 'terrain' && o.type !== 'parking') m.push('la surface'); if (o.type !== 'terrain' && o.type !== 'parking' && !o.dpe) m.push('le DPE (ou « DPE vierge / en cours » dans la fiche)'); }
    return m;
  }

  function open() {
    if (!document.getElementById('stkCss')) { var st = document.createElement('style'); st.id = 'stkCss'; st.textContent = CSS; document.head.appendChild(st); }
    if (!(site.content && Array.isArray(site.content.items))) items().forEach(function (o) { if (!o.sp) SAMPLE.add(o); });
    ST.v = 'list'; ST.i = -1; ST.draft = null; draw(); loadAbra();
  }
  function box() { return document.getElementById('stockIn'); }
  function items() { if (!Array.isArray(state.items)) state.items = []; return state.items; }
  // Les annonces d'exemple du modèle (jamais enregistrées) ne sont pas proposées comme stock réel
  function real(o) { return !!o; }
  function samples() { return items().filter(function (o) { return SAMPLE.has(o); }); }

  async function loadAbra() {
    if (DEMO || !site || String(site.plan || '').toLowerCase() !== 'autoimmo') { ST.abra = null; return; }
    try { var r = await SB.rpc('cs_abra_status', { p_site: site.id }); ST.abra = r.data || null; if (ST.v === 'list') draw(); } catch (e) { ST.abra = null; }
  }
  function abraBox() {
    var pack = String(site.plan || '').toLowerCase() === 'autoimmo';
    var b = el('div', 'stk-ab');
    if (DEMO) { b.innerHTML = '<span class="stk-dot ok"></span><span>Avec le <b>Pack Auto, Moto &amp; Immo</b>, chaque annonce enregistrée ici part aussi sur <b>Abracadeal</b>, sans rien faire de plus.</span>'; return b; }
    if (!pack) { b.innerHTML = '<span class="stk-dot"></span><span>Publiez aussi ces annonces sur <b>Abracadeal</b>, en illimité, avec le Pack Auto, Moto &amp; Immo.</span><a class="btn sm" href="mailto:contact@mycreativesite.fr?subject=Pack%20Auto%20%26%20Immo">Je suis intéressé</a>'; return b; }
    var a = ST.abra || {}, s = a.agency_status, r = a.last_result || {};
    var cls = s === 'active' ? 'ok' : (s === 'pending' || !s) ? 'wait' : 'bad';
    var txt = s === 'active' ? '<b>Diffusion Abracadeal active</b>' + (a.online != null ? ' · ' + a.online + ' annonce' + (a.online > 1 ? 's' : '') + ' en ligne' : '') + (a.synced_at ? ' · dernière mise à jour ' + new Date(a.synced_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '') + '. Vos changements y passent dans les 10 minutes après l\'enregistrement.'
      : s === 'missing_siret' ? '<b>Diffusion Abracadeal en attente</b> : renseignez votre SIRET dans « Devis › Mon entreprise ».'
      : s === 'pending' ? '<b>Compte Abracadeal en cours de validation.</b> Vos annonces partiront dès qu\'il est validé.'
      : !s ? '<b>Diffusion Abracadeal</b> : elle démarre dans les 10 minutes après votre premier enregistrement.'
      : '<b>Diffusion Abracadeal à vérifier</b>' + (a.last_error ? ' : ' + escH(String(a.last_error).slice(0, 160)) : '') + '. Écrivez-nous si ça persiste.';
    if (r.skipped_without_price_or_photo) txt += ' <span class="stk-w">' + r.skipped_without_price_or_photo + ' annonce(s) sans prix ou sans photo ne partent pas.</span>';
    b.innerHTML = '<span class="stk-dot ' + cls + '"></span><span>' + txt + '</span>'; return b;
  }

  function draw() {
    var B = box(); if (!B) return; B.textContent = '';
    if (ST.v === 'edit') return drawEdit(B);
    var arr = items(), car = isCar();
    var h = el('div', 'stk-h', '<div><h2>' + (car ? 'Mes véhicules' : 'Mes biens') + '</h2><p>' + (car ? 'Votre stock : chaque véhicule a sa fiche complète, sur votre site' : 'Vos biens à vendre et à louer : chaque bien a sa fiche complète, DPE et GES compris, sur votre site') + (String(site.plan || '').toLowerCase() === 'autoimmo' || DEMO ? ' et sur Abracadeal.' : '.') + '</p></div>');
    var nb = el('button', 'btn primary', car ? '+ Ajouter un véhicule' : '+ Ajouter un bien'); nb.type = 'button'; nb.onclick = function () { edit(-1); }; h.appendChild(nb); B.appendChild(h);
    B.appendChild(abraBox());
    if (samples().length) { var sx = el('div', 'stk-miss', 'Les annonces marquées « Exemple » viennent du modèle. Elles disparaissent dès que vous ajoutez votre première annonce. '); var rb = el('button', 'btn sm', 'Retirer les exemples maintenant'); rb.type = 'button'; rb.onclick = async function () { var a = items(); for (var k = a.length - 1; k >= 0; k--) if (SAMPLE.has(a[k])) a.splice(k, 1); await persist('Exemples retirés'); draw(); }; sx.appendChild(rb); B.appendChild(sx); }
    // Filtres
    var bar = el('div', 'stk-bar');
    var q = el('input'); q.type = 'search'; q.placeholder = car ? 'Chercher (marque, modèle, réf.)' : 'Chercher (ville, réf., titre)'; q.value = ST.q || ''; q.style.flex = '1'; q.style.minWidth = '180px';
    var fs = el('select'); [['', 'Tous les statuts'], ['dispo', car ? 'En vente' : 'Disponibles'], [car ? 'reserve' : 'compromis', car ? 'Réservés' : 'Sous compromis'], ['vendu', car ? 'Vendus' : 'Vendus / loués']].forEach(function (x) { var op = el('option'); op.value = x[0]; op.textContent = x[1]; fs.appendChild(op); }); fs.value = ST.f || '';
    bar.append(q, fs); B.appendChild(bar);
    var g = el('div', 'stk-g'); B.appendChild(g);
    var list = function () {
      g.textContent = ''; ST.q = q.value; ST.f = fs.value; var n = 0, qq = q.value.toLowerCase().trim();
      arr.forEach(function (o, i) {
        if (!real(o)) return; var s = sp(o), stv = s.st || 'dispo';
        if (ST.f && stv !== ST.f) return;
        if (qq && [o.t, o.ref, s.mk, s.mo, s.vi, o.meta].join(' ').toLowerCase().indexOf(qq) < 0) return;
        n++;
        var c = el('button', 'stk-c'); c.type = 'button'; c.onclick = function () { edit(i); };
        var ims = imgOf(o), im = el('div', 'stk-im'); if (ims[0]) im.style.backgroundImage = 'url("' + ims[0].replace(/"/g, '%22') + '")';
        var stl = { dispo: car ? 'En vente' : (o.tr === 'location' ? 'À louer' : 'À vendre'), reserve: 'Réservé', compromis: 'Sous compromis', vendu: car ? 'Vendu' : (o.tr === 'location' ? 'Loué' : 'Vendu') }[stv] || '';
        im.appendChild(el('span', 'stk-st' + (SAMPLE.has(o) ? ' v' : stv === 'vendu' ? ' v' : stv !== 'dispo' ? ' r' : ''), SAMPLE.has(o) ? 'Exemple' : escH(stl)));
        if (ims.length) im.appendChild(el('span', 'stk-n', ims.length + ' photo' + (ims.length > 1 ? 's' : '')));
        var m = missing(o);
        c.append(im, el('div', 'stk-b', '<b>' + escH(o.t || 'Sans titre') + '</b><span class="px">' + escH(o.p || 'Prix à indiquer') + '</span><span class="m">' + escH(o.meta || '') + (o.ref ? ' · Réf. ' + escH(o.ref) : '') + '</span>' + (m.length && stv !== 'vendu' && !SAMPLE.has(o) ? '<span class="stk-w">À compléter : ' + escH(m.join(', ')) + '</span>' : '')));
        g.appendChild(c);
      });
      if (!n) g.appendChild(el('div', 'stk-empty', arr.some(real) ? 'Aucune annonce ne correspond à ce filtre.' : (car ? 'Aucun véhicule pour le moment. Cliquez sur « Ajouter un véhicule ».' : 'Aucun bien pour le moment. Cliquez sur « Ajouter un bien ».')));
    };
    q.oninput = list; fs.onchange = list; list();
  }

  function blank() {
    if (isCar()) return { t: 'Nouveau véhicule', p: '', tag: '', meta: '', img: null, photos: [], desc: '', feats: '', ref: '', legal: '', mk: '', fuel: 'Essence', sp: { st: 'dispo', fu: 'Essence', bo: 'Manuelle' } };
    return { t: 'Nouveau bien', tr: 'vente', type: 'appartement', city: '', rooms: '', p: '', tag: '', meta: '', img: null, photos: [], desc: '', feats: '', ref: '', dpe: '', dpe_v: '', ges: '', ges_v: '', energy: '', legal: '', sp: { st: 'dispo' } };
  }
  function edit(i) {
    ST.i = i; ST.v = 'edit';
    var src = i >= 0 ? items()[i] : blank();
    ST.draft = JSON.parse(JSON.stringify(src)); if (!Array.isArray(ST.draft.photos)) ST.draft.photos = [];
    // Photo principale + autres photos → une seule galerie ordonnée
    ST.photos = imgOf(ST.draft);
    // Fiche ancienne (sans sp) : on reprend ce qu'on peut des infos courtes
    var s = sp(ST.draft);
    if (isCar()) { if (!s.mk && ST.draft.mk) s.mk = ST.draft.mk; if (!s.fu) s.fu = ST.draft.fuel || 'Essence'; if (!s.st) s.st = /vendu/i.test(ST.draft.tag || '') ? 'vendu' : /réserv/i.test(ST.draft.tag || '') ? 'reserve' : 'dispo';
      var mt = String(ST.draft.meta || ''); if (!s.an) { var y = mt.match(/\b(19[5-9]\d|20[0-4]\d)\b/); if (y) s.an = y[1]; } if (!s.km) { var k = mt.match(/([\d\s.]+)\s*km/i); if (k) s.km = k[1].replace(/\D/g, ''); }
      if (!s.bo) s.bo = /auto/i.test(mt) ? 'Automatique' : /manuel/i.test(mt) ? 'Manuelle' : '';
      if (!s.mo && ST.draft.t && s.mk && ST.draft.t.toLowerCase().indexOf(s.mk.toLowerCase()) === 0) s.mo = ST.draft.t.slice(s.mk.length).trim(); }
    else { if (!s.vi && ST.draft.city) s.vi = ST.draft.city; if (!s.pi && ST.draft.rooms) s.pi = ST.draft.rooms; if (!s.st) s.st = /compromis/i.test(ST.draft.tag || '') ? 'compromis' : /vendu|loué/i.test(ST.draft.tag || '') ? 'vendu' : 'dispo';
      var mi = String(ST.draft.meta || '').match(/([\d,.]+)\s*m²/); if (!s.su && mi) s.su = mi[1]; }
    ST.dirty = false; draw(); var B = box(); if (B && B.parentNode) B.parentNode.scrollTop = 0;
  }

  // ---- Champs du formulaire
  function F(label, get, set, opt) {
    opt = opt || {}; var w = el('div'), id = 'sk' + Math.random().toString(36).slice(2, 8);
    var l = el('label'); l.htmlFor = id; l.innerHTML = escH(label) + (opt.req ? ' <span class="stk-req">*</span>' : '');
    var i;
    if (opt.list) { i = el('select'); opt.list.forEach(function (x) { var v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : (x || '—'); var op = el('option'); op.value = v; op.textContent = t; i.appendChild(op); }); var cur = get(); if (cur && !opt.list.some(function (x) { return (Array.isArray(x) ? x[0] : x) === cur; })) { var op2 = el('option'); op2.value = cur; op2.textContent = cur; i.appendChild(op2); } i.value = cur || ''; i.onchange = function () { set(i.value); changed(); }; }
    else if (opt.check) { i = el('input'); i.type = 'checkbox'; i.checked = !!get(); i.style.cssText = 'width:20px;height:20px;min-height:0'; i.onchange = function () { set(i.checked); changed(); }; w.style.cssText = 'display:flex;gap:8px;align-items:center;align-self:end;padding-bottom:10px'; w.append(i, l); l.style.margin = '0'; return w; }
    else { i = el(opt.multi ? 'textarea' : 'input'); if (opt.multi) i.rows = opt.rows || 4; i.value = get() == null ? '' : get(); if (opt.num) i.inputMode = 'numeric'; if (opt.ph) i.placeholder = opt.ph; i.oninput = function () { set(i.value); changed(true); }; }
    i.id = id; w.append(l, i); return w;
  }
  function seg(items2, get, set) {
    var w = el('div', 'stk-seg'); items2.forEach(function (x) { var b = el('button', '', escH(x[1])); b.type = 'button'; b.setAttribute('aria-pressed', String(get() === x[0])); b.onclick = function () { set(x[0]); qa(w, 'button').forEach(function (y, k) { y.setAttribute('aria-pressed', String(items2[k][0] === x[0])); }); changed(); }; w.appendChild(b); }); return w;
  }
  function qa(r, s) { return [].slice.call(r.querySelectorAll(s)); }
  function sec(parent, title, hint) { var s = el('section', 'stk-s'); s.appendChild(el('h3', '', escH(title))); if (hint) s.appendChild(el('p', 'hint', escH(hint))); parent.appendChild(s); return s; }
  function row(parent) { var r = el('div', 'stk-r'); parent.appendChild(r); return r; }
  var chT;
  function changed(soft) { ST.dirty = true; derive(ST.draft); clearTimeout(chT); chT = setTimeout(function () { var t = document.getElementById('stkTitle'); if (t) t.textContent = ST.draft.t || ''; var m = document.getElementById('stkMiss'); if (m) fillMiss(m); }, soft ? 250 : 0); }
  function fillMiss(m) { var x = missing(Object.assign({}, ST.draft, { img: ST.photos[0] || null })); m.hidden = !x.length; m.innerHTML = 'Pour une annonce complète, ajoutez : <b>' + escH(x.join(', ')) + '</b>.'; }

  function photosBox(parent) {
    var s = sec(parent, 'Photos', 'Jusqu\'à 30 photos. La première est la photo principale : déplacez-les avec ‹. Glissez-déposez vos fichiers ici, ou utilisez le bouton.');
    var g = el('div', 'stk-ph'); s.appendChild(g);
    var inp = el('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp'; inp.multiple = true; inp.hidden = true; s.appendChild(inp);
    var dr = function () {
      g.textContent = '';
      ST.photos.forEach(function (u, i) {
        var t = el('div', 'ph'); t.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")';
        var x = el('button', 'x', '✕'); x.type = 'button'; x.title = 'Retirer'; x.onclick = function () { ST.photos.splice(i, 1); dr(); changed(); }; t.appendChild(x);
        if (i > 0) { var l = el('button', 'l', '‹'); l.type = 'button'; l.title = 'Avancer'; l.onclick = function () { var a = ST.photos; var tmp = a[i - 1]; a[i - 1] = a[i]; a[i] = tmp; dr(); changed(); }; t.appendChild(l); } else t.appendChild(el('span', 'm1', 'Principale'));
        g.appendChild(t);
      });
      if (ST.photos.length < 30) { var a = el('button', 'add', '+ Ajouter des photos'); a.type = 'button'; a.onclick = function () { inp.click(); }; g.appendChild(a); }
    };
    var up = async function (files) {
      files = [].slice.call(files).filter(function (f) { return /^image\//.test(f.type); }).slice(0, 30 - ST.photos.length); if (!files.length) return;
      var n = 0; toast('Envoi de ' + files.length + ' photo' + (files.length > 1 ? 's' : '') + '…');
      for (var k = 0; k < files.length; k++) { var f = files[k]; if (f.size > 15e6) { toast('Photo trop lourde (15 Mo maximum) : ' + f.name); continue; } try { ST.photos.push(await uploadPhoto(f)); n++; dr(); } catch (e) { toast('Envoi impossible : ' + (e.message || e)); } }
      if (n) { changed(); toast(n + ' photo' + (n > 1 ? 's ajoutées' : ' ajoutée')); }
    };
    inp.onchange = function () { var f = inp.files; up(f).then(function () { inp.value = ''; }); };
    s.addEventListener('dragover', function (e) { e.preventDefault(); g.classList.add('drag'); });
    s.addEventListener('dragleave', function () { g.classList.remove('drag'); });
    s.addEventListener('drop', function (e) { e.preventDefault(); g.classList.remove('drag'); up(e.dataTransfer.files); });
    dr();
  }

  function drawEdit(B) {
    var o = ST.draft, s = sp(o), car = isCar();
    var e = el('div', 'stk-e'); B.appendChild(e);
    var top = el('div', 'stk-top');
    var back = el('button', 'btn', '‹ Retour'); back.type = 'button'; back.onclick = function () { if (ST.dirty && !confirm('Quitter sans enregistrer cette annonce ?')) return; ST.v = 'list'; draw(); };
    var h = el('h2'); h.id = 'stkTitle'; h.textContent = o.t || '';
    var sv = el('button', 'btn primary', DEMO ? 'Enregistrer (démo)' : 'Enregistrer'); sv.type = 'button'; sv.onclick = save;
    top.append(back, h, sv); e.appendChild(top);
    var miss = el('div', 'stk-miss'); miss.id = 'stkMiss'; e.appendChild(miss); fillMiss(miss);

    // Statut et prix
    var s1 = sec(e, car ? 'Statut et prix' : 'Transaction, statut et prix');
    if (!car) s1.appendChild(seg([['vente', 'À vendre'], ['location', 'À louer']], function () { return o.tr || 'vente'; }, function (v) { o.tr = v; draw(); }));
    s1.appendChild(seg(car ? [['dispo', 'En vente'], ['reserve', 'Réservé'], ['vendu', 'Vendu']] : [['dispo', 'Disponible'], ['compromis', o.tr === 'location' ? 'Dossier en cours' : 'Sous compromis'], ['vendu', o.tr === 'location' ? 'Loué' : 'Vendu']], function () { return s.st || 'dispo'; }, function (v) { s.st = v; }));
    var r = row(s1);
    r.append(F(car ? 'Prix' : (o.tr === 'location' ? 'Loyer charges comprises' : 'Prix'), function () { return o.p; }, function (v) { o.p = v; }, { req: 1, ph: car ? '18 990 €' : (o.tr === 'location' ? '1 250 € / mois CC' : '450 000 € FAI') }),
      F('Référence (facultatif)', function () { return o.ref; }, function (v) { o.ref = v; }, { ph: car ? 'VO-2041' : 'V-1287' }),
      F('Étiquette sur la photo (facultatif)', function () { return /^(réservé|vendu|sous compromis|loué)$/i.test(o.tag || '') ? '' : o.tag; }, function (v) { o.tag = v; }, { ph: car ? 'Garantie 12 mois, Première main…' : 'Exclusivité, Coup de cœur…' }));
    if (!car) { var rr = row(s1); rr.append(F('Honoraires', function () { return s.hon; }, function (v) { s.hon = v; }, { ph: o.tr === 'location' ? '890 € dont 210 € d\'état des lieux' : '5 % TTC à la charge de l\'acquéreur' })); if (o.tr === 'location') rr.append(F('Dont charges (€ / mois)', function () { return s.chm; }, function (v) { s.chm = v; }, { num: 1 }), F('Dépôt de garantie (€)', function () { return s.dg; }, function (v) { s.dg = v; }, { num: 1 })); }

    photosBox(e);

    if (car) {
      var s2 = sec(e, 'Le véhicule');
      var r2 = row(s2);
      r2.append(F('Marque', function () { return s.mk; }, function (v) { s.mk = v; }, { req: 1, ph: 'Peugeot' }), F('Modèle', function () { return s.mo; }, function (v) { s.mo = v; }, { req: 1, ph: '308' }), F('Version / finition', function () { return s.ve; }, function (v) { s.ve = v; }, { ph: '1.2 PureTech 130 Allure' }),
        F('Année', function () { return s.an; }, function (v) { s.an = v.replace(/\D/g, '').slice(0, 4); }, { req: 1, num: 1, ph: '2021' }), F('Mise en circulation', function () { return s.mec; }, function (v) { s.mec = v; }, { ph: '03/2021' }),
        F('Kilométrage', function () { return s.km; }, function (v) { s.km = v.replace(/\D/g, ''); }, { req: 1, num: 1, ph: '42000' }),
        F('Énergie', function () { return s.fu; }, function (v) { s.fu = v; }, { list: FUEL }), F('Boîte de vitesses', function () { return s.bo; }, function (v) { s.bo = v; }, { list: GEAR }),
        F('Carrosserie', function () { return s.ty; }, function (v) { s.ty = v; }, { list: BODY }), F('Couleur', function () { return s.co; }, function (v) { s.co = v; }, { ph: 'Gris Platinium' }),
        F('Puissance fiscale (CV)', function () { return s.cv; }, function (v) { s.cv = v; }, { num: 1 }), F('Puissance (ch)', function () { return s.ch; }, function (v) { s.ch = v; }, { num: 1 }),
        F('Portes', function () { return s.po; }, function (v) { s.po = v; }, { num: 1 }), F('Places', function () { return s.pl; }, function (v) { s.pl = v; }, { num: 1 }),
        F('Crit\'Air', function () { return s.ca; }, function (v) { s.ca = v; }, { list: CRIT }), F('CO₂ (g/km)', function () { return s.co2; }, function (v) { s.co2 = v; }, { num: 1 }),
        F('Contrôle technique', function () { return s.ct; }, function (v) { s.ct = v; }, { ph: 'OK, de moins de 6 mois' }), F('Garantie (mois)', function () { return s.ga; }, function (v) { s.ga = v; }, { ph: '12' }));
      var s3 = sec(e, 'Présentation');
      s3.append(F('Titre de l\'annonce (rempli tout seul, modifiable)', function () { return o.t; }, function (v) { o.t = v; o._auto = ''; }), F('Description', function () { return o.desc; }, function (v) { o.desc = v; }, { multi: 1, rows: 7, ph: 'Historique, entretien, état, première main… Un retour à la ligne crée un paragraphe.' }),
        F('Équipements (un par ligne)', function () { return o.feats; }, function (v) { o.feats = v; }, { multi: 1, rows: 6, ph: 'GPS\nCaméra de recul\nApple CarPlay\nRégulateur adaptatif' }),
        F('Bon à savoir (garantie, reprise, financement…)', function () { return o.legal; }, function (v) { o.legal = v; }, { multi: 1, rows: 3 }));
    } else {
      var s4 = sec(e, 'Le bien');
      var r4 = row(s4);
      r4.append(F('Type de bien', function () { return o.type; }, function (v) { o.type = v; }, { list: TYPES }), F('Ville', function () { return s.vi; }, function (v) { s.vi = v; }, { req: 1, ph: 'Cannes' }), F('Code postal', function () { return s.cp; }, function (v) { s.cp = v.replace(/\D/g, '').slice(0, 5); }, { num: 1, ph: '06400' }), F('Quartier / secteur', function () { return s.qu; }, function (v) { s.qu = v; }, { ph: 'Croisette' }),
        F('Surface habitable (m²)', function () { return s.su; }, function (v) { s.su = v; }, { req: o.type !== 'terrain' && o.type !== 'parking', num: 1 }), F('Terrain (m²)', function () { return s.te; }, function (v) { s.te = v; }, { num: 1 }),
        F('Pièces', function () { return s.pi; }, function (v) { s.pi = v; }, { num: 1 }), F('Chambres', function () { return s.cb; }, function (v) { s.cb = v; }, { num: 1 }), F('Salles de bain / d\'eau', function () { return s.sb; }, function (v) { s.sb = v; }, { num: 1 }),
        F('Étage (0 = RDC)', function () { return s.et; }, function (v) { s.et = v; }, { num: 1 }), F('Nombre d\'étages', function () { return s.ne; }, function (v) { s.ne = v; }, { num: 1 }),
        F('Année de construction', function () { return s.an; }, function (v) { s.an = v; }, { num: 1 }), F('Chauffage', function () { return s.hc; }, function (v) { s.hc = v; }, { list: HEAT }), F('Exposition', function () { return s.ex; }, function (v) { s.ex = v; }, { list: EXPO }),
        F('Ascenseur', function () { return s.asc; }, function (v) { s.asc = v; }, { check: 1 }), F('Meublé', function () { return s.meu; }, function (v) { s.meu = v; }, { check: 1 }));
      var s5 = sec(e, 'Diagnostic énergétique', 'Obligatoire dans toute annonce de vente ou de location (sauf terrain et parking).');
      var r5 = row(s5);
      r5.append(F('Classe DPE', function () { return o.dpe; }, function (v) { o.dpe = v; }, { list: LET.map(function (x) { return [x, x || 'Non renseigné']; }), req: o.type !== 'terrain' && o.type !== 'parking' }), F('Consommation (kWh/m²/an)', function () { return o.dpe_v; }, function (v) { o.dpe_v = v; }, { num: 1 }),
        F('Classe GES', function () { return o.ges; }, function (v) { o.ges = v; }, { list: LET.map(function (x) { return [x, x || 'Non renseigné']; }) }), F('Émissions (kg CO₂/m²/an)', function () { return o.ges_v; }, function (v) { o.ges_v = v; }, { num: 1 }),
        F('Date du DPE', function () { return s.ddpe; }, function (v) { s.ddpe = v; }, { ph: '15/03/2026' }),
        F('Dépenses d\'énergie min (€ / an)', function () { return s.emin; }, function (v) { s.emin = v; }, { num: 1 }), F('Dépenses d\'énergie max (€ / an)', function () { return s.emax; }, function (v) { s.emax = v; }, { num: 1 }), F('Année de référence des prix', function () { return s.ey; }, function (v) { s.ey = v; }, { num: 1, ph: '2023' }));
      if (o.tr !== 'location') {
        var s6 = sec(e, 'Copropriété et charges');
        var r6 = row(s6);
        r6.append(F('Nombre de lots', function () { return s.lots; }, function (v) { s.lots = v; }, { num: 1 }), F('Charges annuelles (€)', function () { return s.chg; }, function (v) { s.chg = v; }, { num: 1 }), F('Taxe foncière (€ / an)', function () { return s.tf; }, function (v) { s.tf = v; }, { num: 1 }),
          F('Procédure en cours sur la copropriété', function () { return s.proc; }, function (v) { s.proc = v; }, { check: 1 }));
      }
      var s7 = sec(e, 'Présentation');
      s7.append(F('Titre de l\'annonce (rempli tout seul, modifiable)', function () { return o.t; }, function (v) { o.t = v; o._auto = ''; }), F('Description', function () { return o.desc; }, function (v) { o.desc = v; }, { multi: 1, rows: 8, ph: 'Situation, pièces, état, atouts… Un retour à la ligne crée un paragraphe.' }),
        F('Prestations (une par ligne)', function () { return o.feats; }, function (v) { o.feats = v; }, { multi: 1, rows: 6, ph: 'Terrasse de 15 m²\nCave\nParking en sous-sol\nDouble vitrage' }),
        F('Informations légales (remplies d\'après les champs ci-dessus, modifiables)', function () { return o.legal; }, function (v) { o.legal = v; o._legal = ''; }, { multi: 1, rows: 4 }));
    }
    var foot = el('div', 'stk-foot');
    if (ST.i >= 0) { var del = el('button', 'btn', 'Supprimer l\'annonce'); del.type = 'button'; del.style.color = 'var(--bad)'; del.onclick = remove; foot.appendChild(del); }
    else foot.appendChild(el('span'));
    var sv2 = el('button', 'btn primary', 'Enregistrer'); sv2.type = 'button'; sv2.onclick = save; foot.appendChild(sv2);
    e.appendChild(foot);
  }

  async function persist(msg) {
    // Les annonces d'exemple du modèle sont retirées dès que le pro a ses propres annonces
    try { buildForms(); } catch (e) {} refresh(); markDirty();
    if (DEMO) { toast('Démo : ' + msg + ' (rien n\'est enregistré)'); return true; }
    var sb = document.getElementById('save'); sb.disabled = false; sb.click();
    await new Promise(function (r) { var n = 0, t = setInterval(function () { if (!dirty || ++n > 60) { clearInterval(t); r(); } }, 250); });
    if (dirty) { toast('Enregistrement impossible, réessayez.'); return false; }
    toast(msg); setTimeout(loadAbra, 1500); return true;
  }
  async function save() {
    var o = ST.draft; o.img = ST.photos[0] || null; o.photos = ST.photos.slice(1); derive(o);
    var arr = items();
    if (ST.i >= 0) arr[ST.i] = o; else arr.unshift(o);
    // Première vraie annonce : les exemples du modèle sont retirés
    for (var k = arr.length - 1; k >= 0; k--) if (SAMPLE.has(arr[k])) arr.splice(k, 1);
    if (await persist('Annonce enregistrée')) { ST.dirty = false; ST.v = 'list'; draw(); }
  }
  async function remove() {
    if (!confirm('Supprimer cette annonce ? Elle disparaît de votre site' + (String(site.plan || '').toLowerCase() === 'autoimmo' ? ' et d\'Abracadeal.' : '.'))) return;
    items().splice(ST.i, 1); if (await persist('Annonce supprimée')) { ST.v = 'list'; draw(); }
  }
})();
