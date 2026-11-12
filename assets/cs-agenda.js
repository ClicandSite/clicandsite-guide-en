/* MyCreativeSite · espace client · onglet « Mon agenda » — 09/11/2026 (demande d'Anthony).
   Coiffure et beauté, bien-être, restaurant, garage (atelier) : le pro règle ses horaires de réservation, la durée d'un créneau
   et le nombre de places (coiffeurs, praticiens, couverts, postes atelier). Sur son site, le visiteur choisit un créneau libre
   (confirmé tout de suite). Agenda fermé → bouton « Appeler » à la place du formulaire de réservation.
   Le pro voit ses réservations jour par jour, ajoute un rendez-vous pris par téléphone, bloque un créneau ou annule.
   Utilise les fonctions de espace/index.html : site, state, SB, DEMO, toast, escH. Fonctions Supabase : cs_agenda_get / save / add / cancel. */
(function () {
  var TRADES = { beaute: 1, bienetre: 1, veterinaire: 1, autoecole: 1, coach: 1, photographe: 1, toiletteur: 1, nautisme: 1, kine: 1, dentiste: 1, bijouterie: 1, liberal: 1, services: 1, evenementiel: 1, tourisme: 1, location: 1, infirmier: 1, restaurant: 1, garage: 1 };
  var JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], ORDER = [1, 2, 3, 4, 5, 6, 0];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var A = { day: null, data: null, cfg: null, tab: 'jour', demo: null };
  var CSS = '' +
    '.ag-h{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:end}.ag-h h2{margin:0}.ag-h p{margin:4px 0 0;color:var(--muted);max-width:64ch}' +
    '.ag-state{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;background:var(--paper);font-size:.92rem}' +
    '.ag-state>span:not(.ag-dot){flex:1;min-width:200px}.ag-dot{width:10px;height:10px;border-radius:50%;background:var(--muted);flex:none}.ag-dot.on{background:var(--ok)}' +
    '.ag-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ag-nav h3{margin:0;font-size:1.05rem;flex:1;min-width:180px}.ag-nav h3::first-letter{text-transform:uppercase}' +
    '.ag-week{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}.ag-week button{flex:none;display:grid;justify-items:center;gap:1px;min-width:58px;padding:7px 6px;border:1px solid var(--line);border-radius:10px;background:var(--paper);font:inherit;font-size:.78rem;cursor:pointer;color:var(--ink)}' +
    '.ag-week button b{font-size:1.05rem}.ag-week button i{font-style:normal;font-size:.7rem;font-weight:700;color:var(--brand)}.ag-week button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}.ag-week button[aria-pressed="true"] i{color:var(--bg)}.ag-week button.closed{opacity:.55}' +
    '.ag-list{display:grid;gap:8px}.ag-slot{display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;align-items:start;border:1px solid var(--line);border-radius:var(--r);background:var(--paper);padding:10px 12px}' +
    '.ag-top{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.ag-blk{font-size:.78rem!important;padding:3px 9px!important}.ag-slot>b{font-size:1rem;padding-top:2px}.ag-slot.free{padding:6px 12px;align-items:center}.ag-slot.free>b{font-size:.92rem;padding:0;font-weight:600}.ag-slot .fr{font-size:.8rem;color:var(--ok);font-weight:700}.ag-slot .fr.full{color:var(--bad)}' +
    '.ag-bk{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px dashed var(--line);padding-top:7px;margin-top:6px;font-size:.92rem}.ag-bk:first-of-type{border-top:0;margin-top:2px;padding-top:0}' +
    '.ag-bk .n{font-weight:700}.ag-bk a{color:var(--brand);font-weight:700;text-decoration:none}.ag-bk .s{color:var(--muted);font-size:.85rem}.ag-bk .sp{flex:1}' +
    '.ag-tag{font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--soft);color:var(--brand)}.ag-tag.blk{background:#555;color:#fff}.ag-tag.x{background:none;color:var(--muted);border:1px solid var(--line)}' +
    '.ag-bk.cancel .n{text-decoration:line-through;color:var(--muted)}' +
    '.ag-set{display:grid;gap:14px}.ag-box{border:1px solid var(--line);border-radius:var(--r);padding:14px;background:var(--paper);display:grid;gap:12px}.ag-box>h3{margin:0;font-size:1rem}.ag-box .hint{margin:-6px 0 0;color:var(--muted);font-size:.86rem}' +
    '.ag-days{display:grid;gap:8px}.ag-day{display:grid;grid-template-columns:110px auto minmax(0,1fr);gap:10px;align-items:center}.ag-day .rg{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.ag-day input[type=time]{width:auto;min-width:0;padding:7px 8px}' +
    '.ag-day.off .rg{opacity:.35;pointer-events:none}.ag-sw{display:inline-flex;gap:6px;align-items:center;font-weight:600;font-size:.88rem;cursor:pointer}.ag-sw input{width:20px;height:20px}' +
    '.ag-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.ag-grid label{font-size:.85rem}' +
    '.ag-closed{display:flex;gap:6px;flex-wrap:wrap}.ag-closed span{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:4px 6px 4px 11px;font-size:.85rem;background:var(--bg)}.ag-closed button{border:0;background:var(--soft);border-radius:50%;width:22px;height:22px;cursor:pointer;font:700 12px/1 system-ui}' +
    '.ag-foot{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;position:sticky;bottom:0;background:var(--bg);padding:10px 0;border-top:1px solid var(--line)}' +
    '.ag-form{display:grid;gap:10px}.ag-form .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '@media (max-width:640px){.ag-day{grid-template-columns:1fr auto;}.ag-day .rg{grid-column:1/-1}.ag-form .two{grid-template-columns:1fr}}';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function add(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function today() { return iso(new Date()); }
  function hm(t) { return t.replace(':', 'h'); }
  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function tOf(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function long(s) { var d = parse(s); return JOURS[d.getDay()].toLowerCase() + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; }
  function trade() { return site && site.trade; }
  function resto() { return trade() === 'restaurant'; }
  function placesLbl() {
    return { beaute: 'Coiffeurs ou esthéticiennes disponibles en même temps', bienetre: 'Praticiens disponibles en même temps', veterinaire: 'Vétérinaires disponibles en même temps', autoecole: 'Moniteurs disponibles en même temps', coach: 'Places par séance', photographe: 'Séances en même temps', toiletteur: 'Postes de toilettage', nautisme: 'Bateaux disponibles par créneau', kine: 'Praticiens disponibles en même temps', dentiste: 'Praticiens disponibles en même temps', bijouterie: 'Conseillers disponibles en même temps', liberal: 'Conseillers disponibles en même temps', services: 'Intervenants disponibles en même temps', evenementiel: 'Rendez-vous en même temps', tourisme: 'Places par sortie', location: 'Véhicules disponibles par créneau', infirmier: 'Infirmiers disponibles en même temps', restaurant: 'Couverts disponibles par créneau', garage: 'Véhicules pris en charge en même temps (postes atelier)' }[trade()] || 'Places par créneau';
  }
  function unit(n) { return resto() ? n + ' couvert' + (n > 1 ? 's' : '') : n + ' place' + (n > 1 ? 's' : ''); }
  function defaults() {
    var w = {}, R = resto();
    [0, 1, 2, 3, 4, 5, 6].forEach(function (d) {
      w[d] = R ? (d >= 2 && d <= 6 ? [['12:00', '14:00'], ['19:00', '22:30']] : []) :
        trade() === 'garage' ? (d >= 1 && d <= 5 ? [['08:30', '12:00'], ['14:00', '18:00']] : []) :
        (d >= 2 && d <= 6 ? [['09:00', '12:30'], ['14:00', '19:00']] : []);
    });
    return { on: false, step: R ? 30 : trade() === 'garage' ? 60 : 30, duree: R ? 120 : trade() === 'garage' ? 60 : 30, places: R ? 30 : 1, week: w, closed: [], notice: 2, ahead: 30, maxparty: 8 };
  }

  // ---------- Démo : calcul local des créneaux, rien n'est enregistré ----------
  function demoSlots(cfg, from, days, bks) {
    var out = [], now = new Date(), lim = now.getTime() + cfg.notice * 3600e3, last = add(today(), cfg.ahead);
    for (var i = 0; i < days; i++) {
      var d = add(from, i); if (d < today() || d > last || cfg.closed.indexOf(d) >= 0) continue;
      (cfg.week[parse(d).getDay()] || []).forEach(function (r) {
        for (var m = mins(r[0]); m + cfg.duree <= mins(r[1]); m += cfg.step) {
          var st = parse(d); st.setMinutes(m); if (st.getTime() < lim) continue;
          var used = 0; bks.forEach(function (b) { if (b.d !== d || b.status === 'annule') return; var b0 = mins(b.t), b1 = b0 + b.minutes; if (b0 < m + cfg.duree && b1 > m) used += b.places; });
          out.push({ d: d, t: tOf(m), left: Math.max(0, cfg.places - used) });
        }
      });
    }
    return out;
  }
  function demoData(from, to) {
    if (!A.demo) {
      var c = defaults(); c.on = true; var t1 = add(today(), 1), t2 = add(today(), 2);
      A.demo = { cfg: c, bks: [
        { id: 'd1', d: t1, t: resto() ? '20:00' : '10:00', minutes: c.duree, places: resto() ? 4 : 1, status: 'confirme', source: 'site', name: 'Julie Martin', phone: '06 12 34 56 78', service: resto() ? '' : 'Exemple de prestation' },
        { id: 'd2', d: t1, t: resto() ? '12:30' : '14:30', minutes: c.duree, places: resto() ? 2 : 1, status: 'confirme', source: 'pro', name: 'M. Bernard', phone: '06 98 76 54 32', service: '' },
        { id: 'd3', d: t2, t: resto() ? '19:30' : '11:00', minutes: c.duree, places: 1, status: 'bloque', source: 'pro', name: null, phone: null, note: 'Pause' }] };
    }
    var D = A.demo, bks = D.bks.filter(function (b) { return b.d >= from && b.d <= to; });
    return { trade: trade(), eligible: true, cfg: D.cfg, configured: true, bookings: bks, slots: demoSlots(D.cfg, from, Math.round((parse(to) - parse(from)) / 864e5) + 1, D.bks) };
  }

  async function load() {
    var from = A.day, to = add(A.day, 6);
    if (DEMO) { A.data = demoData(from, to); A.cfg = JSON.parse(JSON.stringify(A.data.cfg)); return; }
    var r = await SB.rpc('cs_agenda_get', { p_site: site.id, p_from: from, p_to: to });
    if (r.error) throw r.error;
    A.data = r.data; A.cfg = r.data.configured ? JSON.parse(JSON.stringify(r.data.cfg)) : defaults();
  }

  function root() { return document.getElementById('agendaIn'); }
  async function open() {
    if (!document.getElementById('ag-css')) { var st = el('style'); st.id = 'ag-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!A.day || A.site !== (site && site.id)) { A.day = today(); A.site = site && site.id; A.demo = null; A.tab = 'jour'; }
    var R = root(); R.innerHTML = '<div class="empty">Chargement de votre agenda…</div>';
    try { await load(); } catch (e) { R.innerHTML = '<div class="empty">Impossible de charger votre agenda pour le moment. Réessayez dans un instant.</div>'; return; }
    if (!A.data.configured && !DEMO) A.tab = 'reglages';
    render();
  }

  function render() {
    var R = root(), c = A.data.cfg, on = !!c.on && A.data.configured !== false;
    R.innerHTML = '';
    var h = el('div', 'ag-h', '<div><h2>Mon agenda</h2><p>' + (resto() ? 'Vos réservations de tables' : 'Vos rendez-vous') + ' jour par jour. Sur votre site, vos clients choisissent un créneau libre et c\'est confirmé tout de suite.</p></div>');
    var seg = el('div', 'vseg'); seg.setAttribute('role', 'group');
    [['jour', 'Réservations'], ['reglages', 'Réglages']].forEach(function (x) { var b = el('button', null, x[1]); b.type = 'button'; b.setAttribute('aria-pressed', String(A.tab === x[0])); b.onclick = function () { A.tab = x[0]; render(); }; seg.appendChild(b); });
    h.appendChild(seg); R.appendChild(h);
    var s = el('div', 'ag-state', '<span class="ag-dot' + (on ? ' on' : '') + '"></span><span>' + (on
      ? '<b>Réservation en ligne ouverte.</b> Vos clients réservent eux-mêmes sur votre site, dans les créneaux libres.'
      : '<b>Réservation en ligne fermée.</b> Sur votre site, un bouton « Appeler » remplace le formulaire de réservation.') + '</span>');
    var tg = el('button', 'btn sm' + (on ? '' : ' primary'), on ? 'Fermer la réservation en ligne' : 'Ouvrir la réservation en ligne'); tg.type = 'button';
    tg.onclick = async function () { A.cfg.on = !on; if (!on && A.tab !== 'reglages' && !A.data.configured) { A.tab = 'reglages'; render(); return; } await save(on ? 'Réservation en ligne fermée : le bouton « Appeler » s\'affiche sur votre site' : 'Réservation en ligne ouverte'); };
    s.appendChild(tg); R.appendChild(s);
    if (A.tab === 'reglages') renderSettings(R); else renderDays(R);
  }

  // ---------- Réservations ----------
  function renderDays(R) {
    var D = A.data, nav = el('div', 'ag-nav'), b = function (t, f, cls) { var x = el('button', 'btn sm' + (cls ? ' ' + cls : ''), t); x.type = 'button'; x.onclick = f; return x; };
    nav.appendChild(b('‹', function () { go(add(A.day, -7)); }));
    nav.appendChild(el('h3', null, 'Semaine du ' + long(A.day)));
    nav.appendChild(b('Aujourd\'hui', function () { go(today()); }));
    nav.appendChild(b('›', function () { go(add(A.day, 7)); }));
    R.appendChild(nav);
    if (!A.sel || A.sel < A.day || A.sel > add(A.day, 6)) A.sel = A.day;
    var wk = el('div', 'ag-week');
    for (var i = 0; i < 7; i++) (function (d) {
      var n = D.bookings.filter(function (x) { return x.d === d && x.status === 'confirme'; }).reduce(function (a, x) { return a + (resto() ? x.places : 1); }, 0);
      var open = (D.cfg.week[parse(d).getDay()] || []).length && D.cfg.closed.indexOf(d) < 0;
      var x = el('button', open ? '' : 'closed', '<span>' + JOURS[parse(d).getDay()].slice(0, 3) + '.</span><b>' + parse(d).getDate() + '</b><i>' + (n ? (resto() ? n + ' cv' : n + ' rdv') : (open ? '' : 'fermé')) + '</i>');
      x.type = 'button'; x.setAttribute('aria-pressed', String(d === A.sel)); x.onclick = function () { A.sel = d; render(); }; wk.appendChild(x);
    })(add(A.day, i));
    R.appendChild(wk);
    var d = A.sel, tools = el('div', 'ag-nav');
    tools.appendChild(el('h3', null, long(d)));
    tools.appendChild(b('+ Ajouter un rendez-vous', function () { form(d, 'rdv'); }, 'primary'));
    // 09/11/2026 (Anthony) : bloquer d'un clic la journée ou une heure
    var dayClosed = A.data.cfg.closed.indexOf(d) >= 0;
    tools.appendChild(b(dayClosed ? 'Rouvrir cette journée' : 'Bloquer cette journée', function () { toggleDay(d); }));
    tools.appendChild(b('Bloquer un créneau…', function () { form(d, 'bloque'); }));
    R.appendChild(tools);
    var slots = D.slots.filter(function (x) { return x.d === d; }), bks = D.bookings.filter(function (x) { return x.d === d; });
    var times = {}; slots.forEach(function (x) { times[x.t] = x; }); bks.forEach(function (x) { if (!times[x.t]) times[x.t] = null; });
    var keys = Object.keys(times).sort(), list = el('div', 'ag-list');
    if (!keys.length) {
      var closed = D.cfg.closed.indexOf(d) >= 0 || !(D.cfg.week[parse(d).getDay()] || []).length;
      list.appendChild(el('div', 'empty', closed ? 'Jour fermé à la réservation. Vous pouvez quand même ajouter un rendez-vous pris par téléphone.' : (d < today() ? 'Aucune réservation ce jour-là.' : 'Plus aucun créneau à réserver ce jour-là (délai minimum ou horaires passés). Les rendez-vous ajoutés à la main s\'affichent ici.')));
    }
    keys.forEach(function (t) {
      var sl = times[t], here = bks.filter(function (x) { return x.t === t; }), row = el('div', 'ag-slot' + (here.length ? '' : ' free'));
      row.appendChild(el('b', null, hm(t)));
      var body = el('div');
      if (sl) { var top = el('div', 'ag-top'); top.appendChild(el('div', 'fr' + (sl.left ? '' : ' full'), sl.left ? (resto() ? sl.left + ' couverts libres' : sl.left + ' place' + (sl.left > 1 ? 's' : '') + ' libre' + (sl.left > 1 ? 's' : '')) : 'Complet'));
        if (sl.left) { var bh = el('button', 'btn sm ag-blk', 'Bloquer cette heure'); bh.type = 'button'; bh.onclick = function () { blockHour(d, t, sl.left); }; top.appendChild(bh); }
        body.appendChild(top); }
      here.forEach(function (x) {
        var ln = el('div', 'ag-bk' + (x.status === 'annule' ? ' cancel' : ''));
        ln.innerHTML = (x.status === 'bloque' ? '<span class="ag-tag blk">Bloqué</span><span class="n">' + escH(x.note || 'Créneau bloqué') + '</span>'
          : '<span class="n">' + escH(x.name || 'Client') + '</span>' + (x.phone ? '<a href="tel:' + escH(String(x.phone).replace(/[^0-9+]/g, '')) + '">' + escH(x.phone) + '</a>' : '') +
            (x.email ? '<a href="mailto:' + escH(x.email) + '">' + escH(x.email) + '</a>' : '')) +
          (resto() && x.status !== 'bloque' ? '<span class="s">' + unit(x.places) + '</span>' : '') +
          (x.service ? '<span class="s">' + escH(x.service) + '</span>' : '') + (x.note && x.status !== 'bloque' ? '<span class="s">« ' + escH(x.note) + ' »</span>' : '') +
          '<span class="ag-tag' + (x.status === 'annule' ? ' x' : '') + '">' + (x.status === 'annule' ? 'Annulé' : x.source === 'site' ? 'Réservé sur le site' : x.status === 'bloque' ? 'Par vous' : 'Ajouté par vous') + '</span><span class="sp"></span>';
        if (x.status !== 'annule') { var cb = el('button', 'btn sm', x.status === 'bloque' ? 'Débloquer' : 'Annuler'); cb.type = 'button'; cb.onclick = function () { cancel(x); }; ln.appendChild(cb); }
        body.appendChild(ln);
      });
      row.appendChild(body); list.appendChild(row);
    });
    R.appendChild(list);
    if (!D.cfg.on && D.configured !== false) R.appendChild(el('p', 'hint', 'La réservation en ligne est fermée : les créneaux ci-dessus ne sont pas proposés sur votre site tant que vous ne l\'ouvrez pas.'));
  }
  async function toggleDay(d) {
    var c = A.cfg, i = c.closed.indexOf(d), closed = i >= 0;
    if (!closed && !confirm('Bloquer toute la journée du ' + long(d) + ' ? Plus aucun créneau ne sera proposé sur votre site ce jour-là (les rendez-vous déjà pris restent).')) return;
    if (closed) c.closed.splice(i, 1); else c.closed.push(d);
    var keep = A.sel; await save(closed ? 'Journée rouverte à la réservation' : 'Journée bloquée : plus de réservation en ligne ce jour-là'); A.sel = keep; render();
  }
  async function blockHour(d, t, n) {
    var o = { p_site: site && site.id, p_day: d, p_time: t, p_minutes: A.data.cfg.step, p_places: n, p_kind: 'bloque', p_name: null, p_phone: null, p_service: null, p_note: 'Heure bloquée' };
    if (DEMO) A.demo.bks.push({ id: 'd' + Date.now(), d: d, t: t, minutes: o.p_minutes, places: n, status: 'bloque', source: 'pro', note: o.p_note });
    else { var r = await SB.rpc('cs_agenda_add', o); if (r.error) { toast(r.error.message); return; } }
    toast('Heure bloquée : ' + hm(t) + ' n\'est plus proposée sur votre site'); try { await load(); } catch (e) {} A.sel = d; render();
  }
  async function go(d) { A.day = d; A.sel = d; try { await load(); } catch (e) { toast('Chargement impossible'); return; } render(); }

  async function cancel(x) {
    var q = x.status === 'bloque' ? 'Débloquer ce créneau ?' : 'Annuler le rendez-vous de ' + (x.name || 'ce client') + ' (' + long(x.d) + ' à ' + hm(x.t) + ') ? La place redevient libre sur votre site. Pensez à prévenir le client.';
    if (!confirm(q)) return;
    if (DEMO) { x.status = 'annule'; A.demo.bks.forEach(function (b) { if (b.id === x.id) b.status = 'annule'; }); }
    else { var r = await SB.rpc('cs_agenda_cancel', { p_site: site.id, p_id: x.id }); if (r.error) { toast(r.error.message); return; } }
    toast(x.status === 'bloque' ? 'Créneau débloqué' : 'Rendez-vous annulé'); try { await load(); } catch (e) {} render();
  }

  function form(d, kind) {
    var c = A.data.cfg, sh = el('div', 'sheet'), inn = el('div', 'in');
    var first = (A.data.slots.filter(function (x) { return x.d === d && x.left > 0; })[0] || {}).t || ((c.week[parse(d).getDay()] || [])[0] || ['09:00'])[0];
    inn.innerHTML = '<div class="hd"><h2 style="margin:0">' + (kind === 'bloque' ? 'Bloquer un créneau' : 'Ajouter un rendez-vous') + '</h2><button class="btn sm" type="button" data-x>Fermer</button></div>' +
      '<p class="hint" style="margin:0">' + (kind === 'bloque' ? 'Le créneau n\'est plus proposé sur votre site (pause, absence, client sans rendez-vous…).' : 'Pour un rendez-vous pris par téléphone ou au comptoir : la place n\'est plus proposée sur votre site.') + '</p>' +
      '<div class="ag-form"><div class="two"><div><label for="agf-d">Jour</label><input id="agf-d" type="date" value="' + d + '"></div><div><label for="agf-t">Heure</label><input id="agf-t" type="time" step="300" value="' + first + '"></div></div>' +
      '<div class="two"><div><label for="agf-m">Durée (minutes)</label><input id="agf-m" type="number" min="5" max="720" step="5" value="' + c.duree + '"></div><div><label for="agf-p">' + (resto() ? 'Couverts' : 'Places occupées') + '</label><input id="agf-p" type="number" min="1" max="500" value="' + (kind === 'bloque' ? c.places : (resto() ? 2 : 1)) + '"></div></div>' +
      (kind === 'bloque' ? '<div><label for="agf-n">Motif (vous seul le voyez)</label><input id="agf-n" maxlength="200" placeholder="Pause, formation, absence…"></div>'
        : '<div class="two"><div><label for="agf-c">Nom du client</label><input id="agf-c" maxlength="120" autocomplete="off"></div><div><label for="agf-ph">Téléphone</label><input id="agf-ph" type="tel" maxlength="30" autocomplete="off"></div></div>' +
          '<div><label for="agf-s">' + (resto() ? 'Remarque (allergie, anniversaire…)' : 'Prestation') + '</label><input id="agf-s" maxlength="200"></div>') +
      '<div class="ag-foot"><button class="btn" type="button" data-x>Annuler</button><button class="btn primary" type="button" data-ok>' + (kind === 'bloque' ? 'Bloquer' : 'Ajouter') + '</button></div></div>';
    sh.appendChild(inn); document.body.appendChild(sh);
    var $ = function (id) { return inn.querySelector('#' + id); };
    var close = function () { sh.remove(); };
    sh.addEventListener('click', function (e) { if (e.target === sh || e.target.hasAttribute('data-x')) close(); });
    inn.querySelector('[data-ok]').onclick = async function () {
      var day = $('agf-d').value, t = ($('agf-t').value || '').slice(0, 5);
      if (!day || !/^\d{2}:\d{2}$/.test(t)) { toast('Indiquez le jour et l\'heure'); return; }
      var o = { p_site: site && site.id, p_day: day, p_time: t, p_minutes: +$('agf-m').value || c.duree, p_places: +$('agf-p').value || 1, p_kind: kind,
        p_name: kind === 'bloque' ? null : $('agf-c').value, p_phone: kind === 'bloque' ? null : $('agf-ph').value,
        p_service: kind === 'bloque' ? null : (resto() ? null : $('agf-s').value), p_note: kind === 'bloque' ? $('agf-n').value : (resto() ? $('agf-s').value : null) };
      if (kind !== 'bloque' && !String(o.p_name || '').trim()) { toast('Indiquez le nom du client'); return; }
      if (DEMO) A.demo.bks.push({ id: 'd' + Date.now(), d: day, t: t, minutes: o.p_minutes, places: o.p_places, status: kind === 'bloque' ? 'bloque' : 'confirme', source: 'pro', name: o.p_name, phone: o.p_phone, service: o.p_service, note: o.p_note });
      else { var r = await SB.rpc('cs_agenda_add', o); if (r.error) { toast(r.error.message); return; } }
      close(); toast(kind === 'bloque' ? 'Créneau bloqué' : 'Rendez-vous ajouté'); if (day < A.day || day > add(A.day, 6)) A.day = day; try { await load(); } catch (e) {} A.sel = day; render();
    };
  }

  // ---------- Réglages ----------
  function renderSettings(R) {
    var c = A.cfg, wrap = el('div', 'ag-set');
    if (!A.data.configured && !DEMO) wrap.appendChild(el('div', 'upsell', '<p><b>Première fois ?</b> On a pré-rempli des horaires courants pour votre métier. Ajustez-les, puis enregistrez : la réservation en ligne s\'ouvre sur votre site.</p>'));
    // Horaires
    var bx = el('div', 'ag-box', '<h3>Horaires de réservation</h3><p class="hint">Les heures pendant lesquelles vos clients peuvent réserver. Deux plages par jour possibles (matin et après-midi' + (resto() ? ', ou midi et soir' : '') + ').</p>');
    var days = el('div', 'ag-days');
    ORDER.forEach(function (d) {
      var rg = c.week[d] = (c.week[d] || []).slice(0, 2), row = el('div', 'ag-day' + (rg.length ? '' : ' off'));
      row.appendChild(el('b', null, JOURS[d]));
      var sw = el('label', 'ag-sw'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!rg.length; sw.appendChild(cb); sw.appendChild(document.createTextNode(rg.length ? 'Ouvert' : 'Fermé')); row.appendChild(sw);
      var box = el('div', 'rg'); row.appendChild(box);
      function draw() {
        box.innerHTML = '';
        var r = c.week[d].length ? c.week[d] : [];
        [0, 1].forEach(function (i) {
          if (i === 1 && !r[1]) { var ab = el('button', 'btn sm', '+ 2e plage'); ab.type = 'button'; ab.onclick = function () { var e = r[0] ? r[0][1] : '12:00'; c.week[d].push([e < '14:00' ? '14:00' : e, '19:00']); draw(); }; if (r[0]) box.appendChild(ab); return; }
          if (!r[i]) return;
          var a = el('input'); a.type = 'time'; a.step = 300; a.value = r[i][0]; a.onchange = function () { r[i][0] = a.value; };
          var b = el('input'); b.type = 'time'; b.step = 300; b.value = r[i][1] === '24:00' ? '23:59' : r[i][1]; b.onchange = function () { r[i][1] = b.value; };
          box.appendChild(a); box.appendChild(el('span', null, 'à')); box.appendChild(b);
          if (i === 1) { var x = el('button', 'btn sm', '✕'); x.type = 'button'; x.title = 'Retirer la 2e plage'; x.onclick = function () { c.week[d].splice(1, 1); draw(); }; box.appendChild(x); }
          if (i === 0 && r[1]) box.appendChild(el('span', null, 'et'));
        });
      }
      cb.onchange = function () { c.week[d] = cb.checked ? (resto() ? [['12:00', '14:00'], ['19:00', '22:30']] : [['09:00', '12:30'], ['14:00', '19:00']]) : []; row.classList.toggle('off', !cb.checked); sw.lastChild.textContent = cb.checked ? 'Ouvert' : 'Fermé'; draw(); };
      draw(); days.appendChild(row);
    });
    bx.appendChild(days); wrap.appendChild(bx);
    // Créneaux
    var g = el('div', 'ag-box', '<h3>Créneaux et places</h3>');
    var grid = el('div', 'ag-grid');
    function sel(lbl, key, opts, hint) {
      var w = el('div'), id = 'ag-' + key; w.innerHTML = '<label for="' + id + '">' + lbl + '</label>';
      var s = el('select'); s.id = id; opts.forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; if (+o[0] === +c[key]) op.selected = true; s.appendChild(op); });
      if (!opts.some(function (o) { return +o[0] === +c[key]; })) { var op = el('option', null, c[key]); op.value = c[key]; op.selected = true; s.appendChild(op); }
      s.onchange = function () { c[key] = +s.value; }; w.appendChild(s); if (hint) w.appendChild(el('p', 'hint', hint)); grid.appendChild(w);
    }
    function numIn(lbl, key, min, max, hint) {
      var w = el('div'), id = 'ag-' + key; w.innerHTML = '<label for="' + id + '">' + lbl + '</label>';
      var i = el('input'); i.id = id; i.type = 'number'; i.min = min; i.max = max; i.value = c[key]; i.onchange = function () { c[key] = Math.max(min, Math.min(max, +i.value || min)); i.value = c[key]; };
      w.appendChild(i); if (hint) w.appendChild(el('p', 'hint', hint)); grid.appendChild(w);
    }
    var M = function (a) { return a.map(function (m) { return [m, m < 60 ? m + ' min' : (m % 60 ? Math.floor(m / 60) + ' h ' + (m % 60) : m / 60 + ' h')]; }); };
    sel('Un créneau toutes les', 'step', M([10, 15, 20, 30, 45, 60, 90, 120]), resto() ? 'Heures d\'arrivée proposées (ex. 19h00, 19h30, 20h00…).' : 'Heures de début proposées à vos clients.');
    sel(resto() ? 'Une table est occupée pendant' : 'Durée d\'un rendez-vous', 'duree', M([15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240]), resto() ? 'Temps moyen d\'un repas : la place se libère ensuite.' : 'Temps bloqué pour chaque client.');
    numIn(placesLbl(), 'places', 1, 500, resto() ? 'Le nombre total de couverts que vous pouvez servir en même temps.' : 'Mettez 2 si deux personnes travaillent en même temps : deux clients peuvent réserver la même heure.');
    if (resto()) numIn('Couverts maximum par réservation en ligne', 'maxparty', 1, 100, 'Au-delà, le client vous appelle (groupes).');
    sel('Délai minimum avant un rendez-vous', 'notice', [[0, 'Aucun'], [1, '1 heure'], [2, '2 heures'], [3, '3 heures'], [6, '6 heures'], [12, '12 heures'], [24, '1 jour'], [48, '2 jours']]);
    sel('Réservation possible jusqu\'à', 'ahead', [[7, '1 semaine à l\'avance'], [14, '2 semaines'], [30, '1 mois'], [60, '2 mois'], [90, '3 mois'], [120, '4 mois']]);
    g.appendChild(grid); wrap.appendChild(g);
    // Fermetures
    var f = el('div', 'ag-box', '<h3>Jours de fermeture</h3><p class="hint">Congés, jours fériés : aucun créneau n\'est proposé ces jours-là.</p>');
    var line = el('div', 'ag-nav'), di = el('input'); di.type = 'date'; di.min = today(); di.style.width = 'auto';
    var ab = el('button', 'btn sm', 'Ajouter ce jour'); ab.type = 'button';
    var chips = el('div', 'ag-closed');
    function drawC() { chips.innerHTML = ''; c.closed.filter(function (x) { return x >= today(); }).sort().forEach(function (x) { var s = el('span', null, escH(long(x))); var k = el('button', null, '✕'); k.type = 'button'; k.title = 'Retirer'; k.onclick = function () { c.closed.splice(c.closed.indexOf(x), 1); drawC(); }; s.appendChild(k); chips.appendChild(s); }); }
    ab.onclick = function () { if (di.value && c.closed.indexOf(di.value) < 0) { c.closed.push(di.value); drawC(); } di.value = ''; };
    line.appendChild(di); line.appendChild(ab); f.appendChild(line); f.appendChild(chips); drawC(); wrap.appendChild(f);
    var foot = el('div', 'ag-foot'), sv = el('button', 'btn primary', A.data.configured || DEMO ? 'Enregistrer les réglages' : 'Enregistrer et ouvrir la réservation en ligne'); sv.type = 'button';
    sv.onclick = function () { if (!A.data.configured && !DEMO) c.on = true; save('Réglages enregistrés'); };
    foot.appendChild(sv); wrap.appendChild(foot);
    R.appendChild(wrap);
  }

  async function save(msg) {
    var c = A.cfg;
    for (var d in c.week) { c.week[d] = (c.week[d] || []).filter(function (r) { return r[0] && r[1] && r[0] < r[1]; }); }
    if (c.on && !Object.keys(c.week).some(function (d) { return c.week[d].length; })) { toast('Ouvrez au moins un jour pour la réservation en ligne'); c.on = false; return; }
    if (DEMO) { A.demo.cfg = JSON.parse(JSON.stringify(c)); toast(msg + ' (démo : rien n\'est enregistré)'); }
    else { var r = await SB.rpc('cs_agenda_save', { p_site: site.id, p_cfg: c }); if (r.error) { toast(r.error.message); return; } toast(msg); }
    await load(); render();
  }

  window.CSAgenda = {
    enabled: function () { return !!site && !!TRADES[site.trade] && !(site.trade === 'garage' && typeof state === 'object' && state && state.concession === true); },
    open: open
  };
})();
