/* MyCreativeSite · aperçu des modèles par formule (08/11/2026).
   Chargé seulement quand l'adresse du modèle contient ?f=essentiel|pro|premium|boutique|pack (explorateur de l'accueil).
   N'agit jamais sur un vrai site client : c'est une démonstration, rien n'est envoyé. */
(function () {
  var F = (new URLSearchParams(location.search).get('f') || '').toLowerCase();
  var RANK = { essentiel: 1, pro: 2, premium: 3, boutique: 4, pack: 2 }; // 09/11 : Pack Auto, Moto & Immo = fonctions Pro (+ CRM et Abracadeal côté espace)
  var R = RANK[F]; if (!R) return;
  var d = document, H = d.documentElement;
  var trade = H.getAttribute('data-trade') || '';
  if (trade === 'boutique') { R = 4; F = 'boutique'; }
  H.setAttribute('data-formule', F);
  function q(s, r) { return (r || d).querySelector(s); }
  function qa(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function el(t, cls, txt) { var e = d.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var css = el('style');
  css.textContent =
    '.cf-gg{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}' +
    '.cf-gg a{color:inherit;text-decoration:none;display:inline-flex;align-items:baseline;gap:8px;font-weight:700}.cf-gg a.btn{color:var(--btn-fg);align-items:center}' +
    '.cf-gg .n{font-size:1.7em}.cf-gg .st{color:var(--accent);letter-spacing:2px}.cf-gg .c{font-weight:500;text-decoration:underline;opacity:.85}' +
    '.cf-bk{margin-top:4px;justify-self:start;padding:9px 16px;font-size:.85rem}' +
    '.prices .row .cf-bk{grid-column:1/-1}' +
    '.cf-lang{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:30px;padding:0 9px;border:1.5px solid currentColor;border-radius:999px;font:700 12px/1 system-ui,sans-serif;letter-spacing:.06em;text-decoration:none;color:inherit;cursor:pointer;background:none}' +
    '.cf-cart{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;border:1.5px solid currentColor;font:700 12px/1 system-ui,sans-serif;color:inherit;background:none;cursor:pointer}' +
    '.cf-cart b{min-width:18px;height:18px;border-radius:9px;background:var(--accent);color:var(--btn-fg);display:inline-grid;place-items:center;font-size:11px}' +
    '.cf-pop{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:20px}' +
    '.cf-pop>div{background:var(--bg);color:var(--ink);border-radius:16px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.3);font:15px/1.5 var(--body)}' +
    '.cf-pop h3{margin:0 0 8px;font-family:var(--display)}.cf-pop p{margin:0 0 16px;color:var(--muted)}' +
    '.cf-tag{position:fixed;left:12px;bottom:12px;z-index:2147482000;background:#16181f;color:#fff;font:700 12px/1 system-ui,sans-serif;padding:8px 12px;border-radius:999px;opacity:.9}' +
    '.embed .cf-tag{display:none}' +
    '@media (min-width:861px){.stats:has(.stat[hidden]){grid-template-columns:repeat(3,1fr)}}' +
    '@media (max-width:860px){.cf-tag{bottom:84px}}';
  d.head.appendChild(css);

  var name = (function () { var l = q('header.top .logo'); return l ? l.textContent.trim() : 'le professionnel'; })();
  function pop(title, text) {
    var o = el('div', 'cf-pop'), b = el('div'), h = el('h3', null, title), p = el('p', null, text), x = el('button', 'btn', 'Fermer');
    x.type = 'button'; x.onclick = function () { o.remove(); }; o.onclick = function (e) { if (e.target === o) o.remove(); };
    b.append(h, p, x); o.appendChild(b); d.body.appendChild(o);
  }
  var LABEL = { essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium', boutique: 'Boutique', pack: 'Pack Auto, Moto & Immo' };
  d.body.appendChild(el('div', 'cf-tag', 'Aperçu formule ' + LABEL[F]));

  // Avis Google : à partir de Pro
  var av = q('#avis');
  if (av) {
    if (R < 2) av.hidden = true;
    else {
      var head = q('.head', av);
      var hp = q('p', head); if (hp && /^Exemples/.test(hp.textContent.trim())) hp.textContent = 'Ce que disent nos clients sur Google.';
      var box = el('div', 'cf-gg'), a = el('a'); a.href = '#avis';
      a.append(el('span', 'n', '4,9'), el('span', 'st', '★★★★★'), el('span', 'c', '128 avis sur Google'));
      var lv = el('a', 'btn', 'Laisser un avis'); lv.href = '#avis';
      lv.style.cssText = 'font-weight:600;text-decoration:none';
      lv.addEventListener('click', function (e) { e.preventDefault(); pop('Laisser un avis Google', 'Sur le site final, ce bouton ouvre directement la fiche Google de ' + name + ' pour laisser un avis.'); });
      a.addEventListener('click', function (e) { e.preventDefault(); });
      box.append(a, lv); if (head) head.appendChild(box);
    }
  }

  // 09/11/2026 (Anthony) : en Essentiel, pas de note Google nulle part (y compris le bandeau de chiffres du haut)
  if (R < 2) qa('.stat').forEach(function (st) { if (/\d[,.]\d\s*\/\s*5|avis|google|note/i.test(st.textContent)) st.hidden = true; });

  // Boutons Réserver (paiement en ligne, Pro et plus) ou Ajouter au panier (Boutique)
  var cart = 0, cartB = null;
  function price(t) { t = (t || '').trim(); return /\d/.test(t) && !/devis|dès|à partir|\/\s*h|sur demande|offert|gratuit/i.test(t) ? t : null; }
  if (R >= 2 && trade !== 'boutique' && !q('.dish')) {
    var add = function (host, label, pr, place) {
      var b = el('button', 'btn cf-bk', R >= 4 ? 'Ajouter au panier' : 'Réserver'); b.type = 'button';
      b.addEventListener('click', function () {
        if (R >= 4) { cart++; if (cartB) q('b', cartB).textContent = cart; pop('Ajouté au panier', label + ' (' + pr + '). Sur le site final, le client paie tout son panier par carte et l\'argent arrive directement sur le compte de ' + name + '.'); }
        else pop('Réserver et payer', label + ' : ' + pr + '. Sur le site final, le client choisit la date, paie par carte (ou un acompte) et la réservation arrive dans l\'espace de ' + name + '. Démonstration : rien n\'est débité.');
      });
      place(b);
    };
    qa('.prices > .row').forEach(function (r) { var pr = price(q('.p', r) && q('.p', r).textContent); if (pr) add(r, (q('.t', r) || r).textContent.trim(), pr, function (b) { r.appendChild(b); }); });
    qa('.cards > .card').forEach(function (c) { var pe = q('.price', c), pr = price(pe && pe.textContent); if (pr) add(c, (q('h3', c) || c).textContent.trim(), pr, function (b) { pe.insertAdjacentElement('afterend', b); }); });
  }
  var nav = q('header.top .nav');
  if (R >= 4 && trade !== 'boutique' && nav) {
    cartB = el('button', 'cf-cart'); cartB.type = 'button'; cartB.append(d.createTextNode('Panier'), el('b', null, '0'));
    cartB.addEventListener('click', function () { pop('Votre panier', cart ? cart + ' article(s). Sur le site final : paiement par carte, retrait sur place ou livraison.' : 'Le panier est vide. Ajoutez une prestation ou un produit.'); });
    nav.insertBefore(cartB, nav.firstChild);
  }

  // Version anglaise : Premium et Boutique
  if (R >= 3 && nav) {
    var EN = false, dict = null, nodes = null;
    var lb = el('button', 'cf-lang', 'EN'); lb.type = 'button'; lb.setAttribute('aria-label', 'English version');
    nav.insertBefore(lb, nav.firstChild);
    var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };
    var walk = function () {
      var out = [], w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
        var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName) || p.closest('.picker,.cf-pop,.cf-tag,.cf-lang')) return NodeFilter.FILTER_REJECT;
        return norm(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
      while (w.nextNode()) out.push(w.currentNode); return out;
    };
    var swap = function () {
      if (!nodes) { nodes = walk().map(function (n) { return { n: n, fr: n.nodeValue }; });
        qa('input[placeholder],textarea[placeholder]').forEach(function (i) { nodes.push({ ph: i, fr: i.placeholder }); }); }
      nodes.forEach(function (o) {
        var fr = o.fr, k = norm(fr), en = dict[k];
        if (o.ph) { o.ph.placeholder = EN && en ? en : fr; return; }
        o.n.nodeValue = EN && en ? fr.replace(k, en) : fr;
      });
      lb.textContent = EN ? 'FR' : 'EN'; H.lang = EN ? 'en' : 'fr';
    };
    lb.addEventListener('click', function () {
      EN = !EN;
      if (dict) return swap();
      lb.textContent = '…';
      fetch((location.hostname === 'mycreativesite.fr' || location.hostname === 'www.mycreativesite.fr' ? '' : 'https://mycreativesite.fr') + '/assets/cs-en.json')
        .then(function (r) { return r.json(); }).then(function (j) { dict = j; swap(); })
        .catch(function () { EN = false; lb.textContent = 'EN'; });
    });
  }
})();
