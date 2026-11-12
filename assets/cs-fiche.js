/* MyCreativeSite · fiche détaillée des biens (immobilier) et des véhicules (garage) — 08/11/2026.
   Chaque carte (.props > .prop ou .vgrid > .car) porte ses infos dans data-fiche (JSON) :
   { desc, feats, photos[], dpe, dpe_v, ges, ges_v, energy, legal, ref }.
   Un clic sur la carte ouvre la fiche : galerie de photos, description, caractéristiques, DPE et GES,
   mentions, et un formulaire « Demander une visite » / « Je suis intéressé » (transformé en demande
   « Mes clients » par cs-edit.js sur les vrais sites).
   Met aussi à jour les listes de recherche (villes, types, marques, énergies) d'après les cartes. */
(function () {
  if (window.CSFiche) return;
  var SEL = '.props > .prop, .vgrid > .car';
  var EN = function () { return (document.documentElement.lang || '').slice(0, 2) === 'en'; };
  var L = function (fr, en) { return EN() ? en : fr; };
  var DPE = { A: '#009C6D', B: '#52B153', C: '#A5CC74', D: '#F4E70F', E: '#F2A541', F: '#EB6B2C', G: '#D7221F' };
  var GES = { A: '#F6EDFD', B: '#E4C7F6', C: '#D4A9F0', D: '#C68BEA', E: '#B46DE2', F: '#9D4FD8', G: '#7E2FC4' };
  // Libellés par métier ([français, anglais]) ; le métier est indiqué par <html data-trade="…">
  var CFG = {
    garage: { lbl: ['Véhicule concerné', 'Vehicle'], cta: ['Je suis intéressé', 'I\'m interested'], d: ['Description', 'Description'], f: ['Équipements et caractéristiques', 'Equipment and features'], ph: ['Ex. : je souhaite l\'essayer, reprise de mon véhicule possible ?', 'e.g. I would like a test drive, can you take my car in part-exchange?'] },
    batiment: { lbl: ['Réalisation', 'Project'], cta: ['Un projet similaire ? Demander un devis', 'A similar project? Request a quote'], d: ['Le chantier', 'The project'], f: ['Travaux réalisés', 'Work carried out'], ph: ['Ex. : je voudrais le même type de travaux, ma surface est d\'environ…', 'e.g. I would like similar work, my surface area is about…'] },
    beaute: { lbl: ['Prestation', 'Service'], cta: ['Je veux la même : prendre rendez-vous', 'I want the same: book an appointment'], d: ['La prestation', 'The service'], f: ['Le détail', 'Details'], ph: ['Ex. : je suis disponible le samedi matin.', 'e.g. I am available on Saturday mornings.'] },
    bienetre: { lbl: ['Soin', 'Treatment'], cta: ['Réserver ce soin', 'Book this treatment'], d: ['Le soin', 'The treatment'], f: ['Déroulé et bienfaits', 'How it works and benefits'], ph: ['Ex. : je préfère en fin de journée.', 'e.g. I prefer late afternoon.'] },
    boulangerie: { lbl: ['Produit', 'Product'], cta: ['Commander', 'Order'], d: ['Le produit', 'The product'], f: ['Ingrédients et allergènes', 'Ingredients and allergens'], ph: ['Ex. : 4 pièces pour samedi 9 h.', 'e.g. 4 pieces for Saturday 9 am.'] },
    depannage: { lbl: ['Intervention', 'Job'], cta: ['Même souci ? Être rappelé', 'Same problem? Get a call back'], d: ['L\'intervention', 'The job'], f: ['Ce qui a été fait', 'What was done'], ph: ['Ex. : fuite sous l\'évier depuis ce matin.', 'e.g. leak under the sink since this morning.'] },
    boutique: { lbl: ['Produit', 'Product'], cta: ['Demander ce produit', 'Ask about this product'], d: ['Le produit', 'The product'], f: ['Caractéristiques', 'Features'], ph: ['Ex. : est-il disponible en deux exemplaires ?', 'e.g. do you have two of them?'], shop: true },
    veterinaire: { lbl: ['Acte', 'Treatment'], cta: ['Prendre rendez-vous', 'Book an appointment'], d: ['Description', 'Description'], f: ['Déroulé', 'How it works'], ph: ['Ex. : mon chat a 3 ans, je préfère le matin.', 'e.g. my cat is 3, I prefer mornings.'] },
    autoecole: { lbl: ['Formule', 'Package'], cta: ['Je m\'inscris', 'Sign up'], d: ['La formule', 'The package'], f: ['Contenu', 'Included'], ph: ['Ex. : disponible le mercredi après-midi.', 'e.g. available on Wednesday afternoons.'] },
    coach: { lbl: ['Formule', 'Package'], cta: ['Réserver', 'Book'], d: ['La séance', 'The session'], f: ['Déroulé', 'How it works'], ph: ['Ex. : je reprends le sport après une pause.', 'e.g. I am getting back into sport.'] },
    photographe: { lbl: ['Séance', 'Session'], cta: ['Demander cette séance', 'Ask for this session'], d: ['La séance', 'The session'], f: ['Inclus', 'Included'], ph: ['Ex. : mariage le 12 juin à Nice, 80 invités.', 'e.g. wedding on June 12 in Nice, 80 guests.'] },
    toiletteur: { lbl: ['Prestation', 'Service'], cta: ['Prendre rendez-vous', 'Book an appointment'], d: ['La prestation', 'The service'], f: ['Déroulé', 'How it works'], ph: ['Ex. : bichon de 6 kg, pelage un peu emmêlé.', 'e.g. 6 kg bichon, slightly matted coat.'] },
    fleuriste: { lbl: ['Création', 'Item'], cta: ['Commander', 'Order'], d: ['La création', 'The item'], f: ['Composition', 'Composition'], ph: ['Ex. : livraison vendredi à 11 h, carte « Joyeux anniversaire ».', 'e.g. delivery on Friday at 11 am, card "Happy birthday".'] },
    traiteur: { lbl: ['Produit', 'Product'], cta: ['Demander un devis', 'Request a quote'], d: ['Le produit', 'The product'], f: ['Composition', 'Composition'], ph: ['Ex. : 60 invités le 12 juin à Fréjus.', 'e.g. 60 guests on June 12 in Fréjus.'] },
    nautisme: { lbl: ['Bateau', 'Boat'], cta: ['Réserver', 'Book'], d: ['Le bateau', 'The boat'], f: ['Équipements', 'Equipment'], ph: ['Ex. : 4 adultes, samedi à la journée.', 'e.g. 4 adults, Saturday, full day.'] },
    kine: { lbl: ['Prise en charge', 'Care'], cta: ['Prendre rendez-vous', 'Book an appointment'], d: ['Description', 'Description'], f: ['Déroulé', 'How it works'], ph: ['Ex. : ordonnance de 10 séances, disponible en fin de journée.', 'e.g. prescription for 10 sessions, available late afternoon.'] },
    dentiste: { lbl: ['Acte', 'Treatment'], cta: ['Prendre rendez-vous', 'Book an appointment'], d: ['Description', 'Description'], f: ['Déroulé', 'How it works'], ph: ['Ex. : nouveau patient, disponible le matin.', 'e.g. new patient, available in the morning.'] },
    bijouterie: { lbl: ['Pièce', 'Item'], cta: ['Prendre rendez-vous', 'Book an appointment'], d: ['La pièce', 'The item'], f: ['Détails', 'Details'], ph: ['Ex. : taille de doigt 52, budget autour de 1 000 €.', 'e.g. ring size 52, budget around €1,000.'] },
    liberal: { lbl: ['Mission', 'Service'], cta: ['Demander un rendez-vous', 'Book a meeting'], d: ['La mission', 'The service'], f: ['Contenu', 'Included'], ph: ['Ex. : création d\'une SASU, disponible le matin.', 'e.g. company creation, available in the morning.'] },
    services: { lbl: ['Formule', 'Package'], cta: ['Demander un devis', 'Request a quote'], d: ['La formule', 'The package'], f: ['Contenu', 'Included'], ph: ['Ex. : appartement de 70 m², mardi matin.', 'e.g. 70 m² flat, Tuesday morning.'] },
    evenementiel: { lbl: ['Prestation', 'Service'], cta: ['Demander un devis', 'Request a quote'], d: ['La prestation', 'The service'], f: ['Inclus', 'Included'], ph: ['Ex. : mariage de 120 invités le 12 juin à Hyères.', 'e.g. wedding for 120 guests on June 12.'] },
    hebergement: { lbl: ['Logement', 'Room'], cta: ['Vérifier les disponibilités', 'Check availability'], d: ['Le logement', 'The room'], f: ['Équipements', 'Amenities'], ph: ['Ex. : 2 adultes du 12 au 15 juillet.', 'e.g. 2 adults from July 12 to 15.'] },
    tourisme: { lbl: ['Sortie', 'Tour'], cta: ['Réserver', 'Book'], d: ['La sortie', 'The tour'], f: ['Programme', 'Itinerary'], ph: ['Ex. : 2 adultes et 1 enfant, samedi.', 'e.g. 2 adults and 1 child, Saturday.'] },
    location: { lbl: ['Véhicule', 'Vehicle'], cta: ['Réserver', 'Book'], d: ['Le véhicule', 'The vehicle'], f: ['Inclus', 'Included'], ph: ['Ex. : départ samedi 8 h, retour dimanche soir.', 'e.g. pick-up Saturday 8 am, return Sunday evening.'] },
    infirmier: { lbl: ['Soin', 'Care'], cta: ['Demander un passage', 'Request a visit'], d: ['Description', 'Description'], f: ['Déroulé', 'How it works'], ph: ['Ex. : prise de sang à domicile, ordonnance du Dr Martin.', 'e.g. home blood test, prescription available.'] },
    autre: { lbl: ['Concerné', 'About'], cta: ['Je suis intéressé', 'I\'m interested'], d: ['Description', 'Description'], f: ['Détails', 'Details'], ph: ['Votre message', 'Your message'] }
  };
  function trade(card) { if (card && card.classList.contains('prop')) return 'immobilier'; var t = document.documentElement.getAttribute('data-trade'); if (t && CFG[t]) return t; return document.getElementById('v-mk') ? 'garage' : 'autre'; }
  var TYPES = { appartement: ['Appartement', 'Apartment'], maison: ['Maison, villa', 'House, villa'], terrain: ['Terrain', 'Land'], local: ['Local, bureau', 'Commercial premises'], parking: ['Parking, box', 'Parking'], autre: ['Autre', 'Other'] };

  function qa(r, s) { return [].slice.call(r.querySelectorAll(s)); }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function data(el) { try { return JSON.parse(el.getAttribute('data-fiche') || '{}') || {}; } catch (e) { return {}; } }
  function okUrl(u) { return typeof u === 'string' && /^(https:\/\/|blob:|data:image\/(jpeg|png|webp);base64,)/.test(u); }
  function okCls(u) { return typeof u === 'string' && /^cls:[a-z]{1,2}\d{1,2}$/.test(u); }
  function bgOf(el) { if (!el) return ''; var v = getComputedStyle(el).getPropertyValue('--img') || ''; return v.trim(); }
  // Une photo : div.pimg avec --img (URL envoyée par le pro) ou classe de photo d'exemple du modèle
  function photoEl(u, cls) {
    var d = document.createElement('div'); d.className = 'pimg ' + (cls || '');
    if (okUrl(u)) d.style.setProperty('--img', 'url("' + u.replace(/"/g, '%22') + '")');
    else if (okCls(u)) d.className += ' ' + u.slice(4);
    else if (u && u.indexOf('url(') === 0) d.style.setProperty('--img', u);
    return d;
  }
  function photosOf(card) {
    var f = data(card), ph = card.querySelector('.photo'), main = ph ? bgOf(ph) : '';
    var list = (Array.isArray(f.photos) ? f.photos : []).filter(function (u) { return okUrl(u) || okCls(u); });
    if (main) list.unshift(main); // la photo de la carte en premier
    var seen = {}; return list.filter(function (u) { if (seen[u]) return false; seen[u] = 1; return true; }).slice(0, 30);
  }

  var css = '' +
    '.cs-card{cursor:pointer}.cs-card:focus-visible{outline:3px solid var(--accent,#7C3AED);outline-offset:4px;border-radius:12px}' +
    '.cs-card .photo{position:relative;transition:transform .25s}.cs-card:hover .photo{transform:translateY(-2px)}' +
    '.cs-cnt{position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,.66);color:#fff;font:600 .72rem/1 system-ui,sans-serif;padding:6px 9px;border-radius:999px;display:inline-flex;gap:5px;align-items:center;pointer-events:none}' +
    '.cs-more{font-weight:600;font-size:.86rem;color:var(--accent,#7C3AED);text-decoration:underline;text-underline-offset:3px}' +
    'html.cs-fopen,html.cs-fopen body{overflow:hidden}' +
    '.cs-fiche{position:fixed;inset:0;z-index:2147482000;background:rgba(8,10,18,.62);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:min(4vh,32px) 16px;-webkit-overflow-scrolling:touch}' +
    '.cs-fiche .fb{position:relative;width:100%;max-width:1040px;background:var(--bg,#fff);color:var(--ink,#16181f);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35);font-family:var(--body,inherit)}' +
    '.cs-fiche .fx{position:absolute;top:12px;right:12px;z-index:3;display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;background:rgba(255,255,255,.94);color:#111;font:700 .9rem system-ui,sans-serif;padding:10px 14px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2)}' +
    '.cs-fiche .gal{position:relative;background:#111}' +
    '.cs-fiche .gm{aspect-ratio:16/9;background-size:cover;background-position:center;background-image:var(--img);max-height:62vh;width:100%}' +
    '.cs-fiche .ga{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#111;font:700 1.3rem/1 system-ui;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.25)}' +
    '.cs-fiche .ga.p{left:12px}.cs-fiche .ga.n{right:12px}' +
    '.cs-fiche .gc{position:absolute;left:12px;bottom:12px;background:rgba(0,0,0,.66);color:#fff;font:600 .8rem system-ui;padding:6px 10px;border-radius:999px}' +
    '.cs-fiche .gt{display:flex;gap:6px;overflow-x:auto;padding:8px;background:#111;scrollbar-width:thin}' +
    '.cs-fiche .gt button{flex:0 0 92px;height:62px;border:2px solid transparent;border-radius:8px;padding:0;cursor:pointer;background-size:cover;background-position:center;background-image:var(--img);opacity:.65}' +
    '.cs-fiche .gt button[aria-current="true"]{border-color:#fff;opacity:1}' +
    '.cs-fiche .fc{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:32px;padding:26px 28px 30px}' +
    '.cs-fiche h2{font-family:var(--display,inherit);font-weight:var(--hw,700);font-size:clamp(1.4rem,2.6vw,2rem);line-height:1.15;margin:0}' +
    '.cs-fiche .fm{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}.cs-fiche .fm span{font-size:.85rem;padding:6px 10px;border-radius:999px;background:var(--soft,#f2f3f7);color:var(--ink,#16181f)}' +
    '.cs-fiche h3{font-size:1rem;margin:26px 0 10px;font-family:var(--body,inherit);font-weight:700}' +
    '.cs-fiche .fd p{margin:0 0 10px;color:var(--ink,#16181f);line-height:1.6;font-size:.98rem}' +
    '.cs-fiche .fs{display:grid;grid-template-columns:auto 1fr;margin:0;border:1px solid rgba(127,127,127,.25);border-radius:10px;overflow:hidden;font-size:.93rem}.cs-fiche .fs dt,.cs-fiche .fs dd{margin:0;padding:8px 12px;border-top:1px solid rgba(127,127,127,.18)}.cs-fiche .fs dt{opacity:.7}.cs-fiche .fs dd{font-weight:600}.cs-fiche .fs dt:nth-of-type(1),.cs-fiche .fs dd:nth-of-type(1){border-top:0}@media (max-width:560px){.cs-fiche .fs{grid-template-columns:1fr 1fr}}' +
    '.cs-fiche .ff{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}' +
    '.cs-fiche .ff li{display:flex;gap:8px;font-size:.93rem;align-items:baseline}.cs-fiche .ff li:before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:var(--accent,#7C3AED);transform:translateY(-1px)}' +
    '.cs-fiche .en{display:grid;grid-template-columns:1fr 1fr;gap:22px}' +
    '.cs-fiche .sc{display:grid;gap:3px}.cs-fiche .sc .t{font-size:.8rem;font-weight:700;color:var(--muted,#5a5f6e);margin-bottom:4px}' +
    '.cs-fiche .sc .b{display:flex;align-items:center;gap:8px;height:20px}' +
    '.cs-fiche .sc .b i{display:flex;align-items:center;height:100%;border-radius:0 4px 4px 0;font:700 .72rem system-ui;color:#fff;padding-left:6px;font-style:normal;opacity:.5}' +
    '.cs-fiche .sc .b.on i{opacity:1;height:28px;font-size:.9rem;box-shadow:0 0 0 2px var(--ink,#16181f)}' +
    '.cs-fiche .sc .b em{font-style:normal;font-size:.78rem;font-weight:700;white-space:nowrap}' +
    '.cs-fiche .sm{font-size:.82rem;color:var(--muted,#5a5f6e);line-height:1.5;margin:10px 0 0;white-space:pre-line}' +
    '.cs-fiche aside{align-self:start;position:sticky;top:16px;border:1px solid var(--line,rgba(0,0,0,.12));border-radius:16px;padding:18px;display:grid;gap:10px;background:var(--bg,#fff)}' +
    '.cs-fiche .px{font-family:var(--display,inherit);font-weight:var(--hw,700);font-size:1.7rem;color:var(--accent,#16181f);line-height:1.1}' +
    '.cs-fiche .pm{display:none;margin-top:8px}.cs-fiche .rf{font-size:.78rem;color:var(--muted,#5a5f6e)}' +
    '.cs-fiche aside label{font-size:.78rem;font-weight:600;color:var(--muted,#5a5f6e);margin:2px 0 -6px}' +
    '.cs-fiche aside input,.cs-fiche aside textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--line,#d6d9e3);border-radius:10px;font:inherit;font-size:.92rem;background:var(--bg,#fff);color:var(--ink,#16181f)}' +
    '.cs-fiche aside .btn{width:100%;justify-content:center;text-align:center}' +
    '.cs-fiche aside .okf{font-size:.88rem;background:#ecfdf3;color:#14532d;border-radius:10px;padding:10px 12px}' +
    '@media (max-width:820px){.cs-fiche .pm{display:block}.cs-fiche aside .px{display:none}.cs-fiche{padding:0}.cs-fiche .fb{border-radius:0;min-height:100%}.cs-fiche .fc{grid-template-columns:1fr;gap:6px;padding:20px 16px 28px}.cs-fiche aside{position:static;margin-top:18px}.cs-fiche .gm{aspect-ratio:4/3;max-height:none}.cs-fiche .ff,.cs-fiche .en{grid-template-columns:1fr}.cs-fiche .ga{width:38px;height:38px}.cs-fiche .gt button{flex-basis:72px;height:50px}}';

  function scale(title, letter, val, unit, COL) {
    var w = document.createElement('div'); w.className = 'sc';
    w.innerHTML = '<span class="t"></span>'; w.firstChild.textContent = title;
    'ABCDEFG'.split('').forEach(function (k, i) {
      var b = document.createElement('div'); b.className = 'b' + (k === letter ? ' on' : '');
      var c = document.createElement('i'); c.textContent = k; c.style.width = (28 + i * 11) + '%'; c.style.background = COL[k]; if (COL === GES && i < 3) c.style.color = '#4a2a6a'; if (COL === DPE && k === 'D') c.style.color = '#111';
      b.appendChild(c);
      if (k === letter && val) { var e = document.createElement('em'); e.textContent = val + ' ' + unit; b.appendChild(e); }
      w.appendChild(b);
    });
    return w;
  }

  var box = null, lastFocus = null;
  function close() {
    if (!box) return; box.remove(); box = null; document.documentElement.classList.remove('cs-fopen');
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  function onKey(e) { if (!box) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft' && box.__go) box.__go(-1); if (e.key === 'ArrowRight' && box.__go) box.__go(1); }

  function open(card) {
    close(); lastFocus = document.activeElement;
    var immo = card.classList.contains('prop'), f = data(card);
    var title = txt(card.querySelector('h3')), price = txt(card.querySelector('.prx'));
    var meta = qa(card, '.meta > span').map(txt).filter(Boolean);
    var photos = photosOf(card);

    box = document.createElement('div'); box.className = 'cs-fiche'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', title);
    var fb = document.createElement('div'); fb.className = 'fb'; box.appendChild(fb);
    var x = document.createElement('button'); x.type = 'button'; x.className = 'fx'; x.innerHTML = '<span aria-hidden="true">✕</span> '; x.appendChild(document.createTextNode(L('Fermer', 'Close'))); x.onclick = close; fb.appendChild(x);

    // Galerie
    if (photos.length) {
      var gal = document.createElement('div'); gal.className = 'gal';
      var main = photoEl(photos[0]); main.className += ' gm'; main.setAttribute('role', 'img'); main.setAttribute('aria-label', title); gal.appendChild(main);
      var cnt = document.createElement('span'); cnt.className = 'gc'; gal.appendChild(cnt);
      var thumbs = document.createElement('div'); thumbs.className = 'gt';
      var cur = 0;
      var show = function (i) {
        cur = (i + photos.length) % photos.length;
        var p = photoEl(photos[cur]); main.className = p.className + ' gm'; main.style.cssText = p.style.cssText;
        cnt.textContent = (cur + 1) + ' / ' + photos.length;
        qa(thumbs, 'button').forEach(function (b, k) { b.setAttribute('aria-current', k === cur ? 'true' : 'false'); if (k === cur) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
      };
      box.__go = function (d) { show(cur + d); };
      if (photos.length > 1) {
        ['p', 'n'].forEach(function (s) { var a = document.createElement('button'); a.type = 'button'; a.className = 'ga ' + s; a.textContent = s === 'p' ? '‹' : '›'; a.setAttribute('aria-label', s === 'p' ? L('Photo précédente', 'Previous photo') : L('Photo suivante', 'Next photo')); a.onclick = function () { box.__go(s === 'p' ? -1 : 1); }; gal.appendChild(a); });
        photos.forEach(function (u, k) { var t = photoEl(u), b = document.createElement('button'); b.type = 'button'; b.className = t.className; b.style.cssText = t.style.cssText; b.setAttribute('aria-label', L('Photo ', 'Photo ') + (k + 1)); b.onclick = function () { show(k); }; thumbs.appendChild(b); });
        var sx = null; main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
        main.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) box.__go(dx < 0 ? 1 : -1); sx = null; });
      } else cnt.hidden = true;
      fb.appendChild(gal); if (photos.length > 1) fb.appendChild(thumbs);
      show(0);
    }

    var fc = document.createElement('div'); fc.className = 'fc'; fb.appendChild(fc);
    var col = document.createElement('div'); fc.appendChild(col);
    var h = document.createElement('h2'); h.textContent = title; col.appendChild(h);
    if (price) { var pm = document.createElement('div'); pm.className = 'px pm'; pm.textContent = price; col.appendChild(pm); }
    var chips = meta.slice(); if (immo && card.dataset.type && TYPES[card.dataset.type]) chips.unshift(TYPES[card.dataset.type][0]);
    if (chips.length) { var fm = document.createElement('div'); fm.className = 'fm'; chips.forEach(function (s) { var sp = document.createElement('span'); sp.textContent = s; fm.appendChild(sp); }); col.appendChild(fm); }
    var H = function (t) { var e = document.createElement('h3'); e.textContent = t; col.appendChild(e); };
    var desc = String(f.desc || '').trim();
    var C = immo ? null : CFG[trade(card)];
    if (desc) { H(immo ? L('Description du bien', 'Description') : L(C.d[0], C.d[1])); var fd = document.createElement('div'); fd.className = 'fd';
      desc.split(/\n+/).forEach(function (l) { l = l.trim(); if (!l) return; var p = document.createElement('p'); p.textContent = l; fd.appendChild(p); }); col.appendChild(fd); }
    // 08/11/2026 : fiche technique (année, km, boîte… / surface, chambres, charges…) en tableau
    var specs = String(f.specs || '').split(/\n/).map(function (l) { var k = l.indexOf(' : '); return k > 0 ? [l.slice(0, k).trim(), l.slice(k + 3).trim()] : null; }).filter(function (x) { return x && x[0] && x[1]; });
    if (specs.length) { H(immo ? L('Le bien en détail', 'Property details') : L('Fiche technique', 'Specifications')); var tb = document.createElement('dl'); tb.className = 'fs';
      specs.slice(0, 40).forEach(function (x) { var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = x[0]; dd.textContent = x[1]; tb.append(dt, dd); }); col.appendChild(tb); }
    var feats = String(f.feats || '').split(/\n|·/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (feats.length) { H(immo ? L('Caractéristiques', 'Features') : L(C.f[0], C.f[1])); var ul = document.createElement('ul'); ul.className = 'ff';
      feats.slice(0, 40).forEach(function (s) { var li = document.createElement('li'); li.textContent = s; ul.appendChild(li); }); col.appendChild(ul); }
    if (immo) {
      var d = /^[A-G]$/.test(f.dpe || '') ? f.dpe : '', g = /^[A-G]$/.test(f.ges || '') ? f.ges : '';
      H(L('Performance énergétique', 'Energy performance'));
      if (d || g) {
        var en = document.createElement('div'); en.className = 'en';
        if (d) en.appendChild(scale(L('Diagnostic de performance énergétique (DPE)', 'Energy rating (DPE)'), d, f.dpe_v, 'kWh/m²/' + L('an', 'yr'), DPE));
        if (g) en.appendChild(scale(L('Émissions de gaz à effet de serre (GES)', 'Greenhouse gas emissions (GES)'), g, f.ges_v, 'kg CO₂/m²/' + L('an', 'yr'), GES));
        col.appendChild(en);
      } else { var nd = document.createElement('p'); nd.className = 'sm'; nd.textContent = L('DPE en cours de réalisation.', 'Energy rating in progress.'); col.appendChild(nd); }
      if (f.energy) { var ee = document.createElement('p'); ee.className = 'sm'; ee.textContent = L('Montant estimé des dépenses annuelles d\'énergie pour un usage standard : ', 'Estimated annual energy costs for standard use: ') + f.energy; col.appendChild(ee); }
    }
    if (f.legal) { H(immo ? L('Informations légales', 'Legal information') : L('Bon à savoir', 'Good to know')); var lg = document.createElement('p'); lg.className = 'sm'; lg.style.marginTop = '0'; lg.textContent = f.legal; col.appendChild(lg); }

    // Encadré prix + demande
    var as = document.createElement('aside'); fc.appendChild(as);
    var px = document.createElement('div'); px.className = 'px'; px.textContent = price; as.appendChild(px);
    if (f.ref) { var rf = document.createElement('div'); rf.className = 'rf'; rf.textContent = L('Réf. ', 'Ref. ') + f.ref; as.appendChild(rf); }
    var loc = immo && card.dataset.tr === 'location';
    var form = document.createElement('form'); form.id = 'csfiche-form'; form.style.cssText = 'display:grid;gap:10px;margin:0';
    var bid = 'csf-' + Math.random().toString(36).slice(2, 7);
    form.innerHTML = '<label for="' + bid + '"></label><input id="' + bid + '" readonly>' +
      '<label for="' + bid + 'm"></label><textarea id="' + bid + 'm" rows="3"></textarea>' +
      '<button class="btn" type="submit"></button><div class="okf" hidden></div>';
    form.querySelector('label').textContent = immo ? L('Bien concerné', 'Property') : L(C.lbl[0], C.lbl[1]);
    form.querySelector('input').value = title + (f.ref ? ' (réf. ' + f.ref + ')' : '') + (price ? ' · ' + price : '');
    form.querySelectorAll('label')[1].textContent = L('Votre message (facultatif)', 'Your message (optional)');
    form.querySelector('textarea').placeholder = immo ? (loc ? L('Ex. : je souhaite visiter, je suis disponible le samedi.', 'e.g. I would like to visit, I am available on Saturdays.') : L('Ex. : je souhaite visiter ce bien, financement validé.', 'e.g. I would like to visit, financing approved.')) : L(C.ph[0], C.ph[1]);
    var sb = form.querySelector('button'); sb.textContent = immo ? L('Demander une visite', 'Request a visit') : L(C.cta[0], C.cta[1]);
    // Sur un vrai site, cs-edit.js intercepte l'envoi (demande dans « Mes clients ») ; sur le modèle, simple confirmation.
    form.addEventListener('submit', function (e) { e.preventDefault(); var ok = form.querySelector('.okf'); ok.textContent = L('Merci, votre demande est envoyée. Nous vous recontactons rapidement.', 'Thank you, your request has been sent. We will get back to you shortly.'); ok.hidden = false; });
    var add = C && C.shop ? card.querySelector('.add') : null;
    if (add && !add.disabled) {
      var ab = document.createElement('button'); ab.type = 'button'; ab.className = 'btn'; ab.textContent = L('Ajouter au panier', 'Add to basket');
      ab.onclick = function () { close(); add.click(); }; as.appendChild(ab);
    } else as.appendChild(form);
    var tel = qa(document, 'a[href^="tel:"]')[0];
    if (tel) { var tb = document.createElement('a'); tb.className = 'btn ghost'; tb.href = tel.getAttribute('href'); tb.textContent = L('Appeler', 'Call'); as.appendChild(tb); }

    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.body.appendChild(box); document.documentElement.classList.add('cs-fopen');
    document.addEventListener('keydown', onKey);
    setTimeout(function () { x.focus({ preventScroll: true }); }, 30);
  }

  // Cartes cliquables + nombre de photos
  function cards() {
    qa(document, SEL).forEach(function (c) {
      if (!c.__csf) {
        c.__csf = 1; c.classList.add('cs-card'); c.tabIndex = 0; c.setAttribute('role', 'button');
        c.addEventListener('click', function (e) { if (e.target.closest('a,button,input,select,textarea')) return; open(c); });
        c.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); open(c); } });
      }
      c.setAttribute('aria-label', L('Voir la fiche : ', 'View details: ') + txt(c.querySelector('h3')));
      var ph = c.querySelector('.photo'), n = photosOf(c).length, b = ph && ph.querySelector('.cs-cnt');
      if (ph) { if (n > 1) { if (!b) { b = document.createElement('span'); b.className = 'cs-cnt'; ph.appendChild(b); } b.textContent = '📷 ' + n; } else if (b) b.remove(); }
    });
  }
  // Listes de recherche d'après les cartes (villes, types, marques, énergies)
  function opts(id, values, label) {
    var s = document.getElementById(id); if (!s) return false;
    var cur = s.value, first = s.options[0], keep = first && first.value === '' ? first : null;
    var want = values.slice().sort(function (a, b) { return a.localeCompare(b, 'fr'); }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    var now = [].slice.call(s.options).filter(function (o) { return o !== keep; }).map(function (o) { return o.value; });
    if (now.join('|') === want.join('|')) return false;
    s.textContent = ''; if (keep) s.appendChild(keep);
    want.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = label ? label(v) : v; s.appendChild(o); });
    s.value = want.indexOf(cur) >= 0 ? cur : ''; return true;
  }
  function filters() {
    var live = function (c) { return !c.hasAttribute('data-cs-empty'); }, props = qa(document, '.props > .prop').filter(live), cars = document.getElementById('v-mk') ? qa(document, '.vgrid > .car').filter(live) : [], ch = false;
    if (props.length) {
      ch = opts('s-city', props.map(function (p) { return p.dataset.city || ''; })) || ch;
      ch = opts('s-type', props.map(function (p) { return p.dataset.type || ''; }), function (v) { return TYPES[v] ? TYPES[v][0] : v; }) || ch;
      var t = document.getElementById('s-type'); if (t) t.dispatchEvent(new Event('change'));
    }
    if (cars.length) {
      ch = opts('v-mk', cars.map(function (c) { return c.dataset.mk || ''; })) || ch;
      ch = opts('v-fuel', cars.map(function (c) { return c.dataset.fuel || ''; })) || ch;
      var m = document.getElementById('v-mk'); if (m) m.dispatchEvent(new Event('change'));
    }
  }
  function filters2() {
    var cars = qa(document, '.vgrid > .car').filter(function (c) { return !c.hasAttribute('data-cs-empty'); }), ev = null;
    if (!cars.length || document.getElementById('v-mk')) return;
    if (document.getElementById('r-type')) { opts('r-type', cars.map(function (c) { return c.dataset.type || ''; })); ev = 'r-type'; }
    if (document.getElementById('r-city')) opts('r-city', cars.map(function (c) { return c.dataset.city || ''; }));
    if (document.getElementById('q-cat')) { opts('q-cat', cars.map(function (c) { return txt(c.querySelector('.meta > span')); })); ev = 'q-cat'; }
    if (ev) document.getElementById(ev).dispatchEvent(new Event('change'));
  }
  function init() {
    if (!document.getElementById('cs-fiche-css')) { var st = document.createElement('style'); st.id = 'cs-fiche-css'; st.textContent = css; document.head.appendChild(st); }
    cards(); filters(); filters2();
  }
  window.CSFiche = { open: open, refresh: init };
  document.addEventListener('cs:applied', function () { setTimeout(init, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
