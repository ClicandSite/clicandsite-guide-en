/* 09/11/2026 (Anthony) : champ date des formulaires de réservation, même taille que les autres cases et année sur 2 chiffres (15/01/27 · 15:00).
   Le vrai champ date reste dans le formulaire (validation, envoi) ; on affiche par-dessus une case qui ouvre le calendrier du téléphone ou de l'ordinateur. */
(function () {
  var CSS = '.csd-w{position:relative;display:block;min-width:0}' +
    '.csd-w>input.csd-in{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-height:0!important;opacity:0!important;margin:0!important;padding:0!important;border:0!important;z-index:2;cursor:pointer;-webkit-appearance:none;appearance:none;font-size:16px}' +
    '.csd-b{display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;-webkit-appearance:none;appearance:none}' +
    '.csd-b .csd-ph{opacity:.55}.csd-b svg{flex:none;margin-left:auto;opacity:.6}';
  var ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/></svg>';
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  function fmt(el) {
    var v = el.value || '', m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (!m) return '';
    return m[3] + '/' + m[2] + '/' + m[1].slice(2) + (m[4] ? ' · ' + m[4] + ':' + m[5] : '');
  }
  function ref(el) {
    // la case de référence : un menu ou un champ texte du même formulaire
    var f = el.form || el.closest('form') || document;
    // 10/11/2026 : on prend d'abord un champ texte (Safari dessine les menus plus petits que les champs)
    var all = f.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="number"], input:not([type]), select');
    for (var i = 0; i < all.length; i++) if (all[i] !== el && all[i].offsetHeight) return all[i];
    return null;
  }
  function copy(from, to, el) {
    var c = getComputedStyle(from), s = to.style;
    ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'backgroundImage', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
     'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
     'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'boxShadow', 'letterSpacing', 'lineHeight', 'boxSizing'].forEach(function (k) { s[k] = c[k]; });
    if (from.tagName === 'SELECT') s.backgroundImage = 'none';
    s.height = from.offsetHeight + 'px';
    if (el) { var ce = getComputedStyle(el); s.color = ce.color; }
  }
  function show(el, b) {
    var t = fmt(el);
    b.innerHTML = (t ? '<span>' + t + '</span>' : '<span class="csd-ph">' + (el.type === 'date' ? 'jj/mm/aa' : 'jj/mm/aa · hh:mm') + '</span>') + ICON;
  }
  function wrap(el) {
    if (el.__csd || el.closest('.cs-ag') || el.closest('.csd-w')) return;
    var r = ref(el); if (!r) return;
    el.__csd = 1;
    var w = document.createElement('span'); w.className = 'csd-w';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'csd-b';
    var lab = el.id && document.querySelector('label[for="' + el.id + '"]');
    if (lab) b.setAttribute('aria-label', lab.textContent.trim());
    el.parentNode.insertBefore(w, el); w.appendChild(b); w.appendChild(el);
    el.classList.add('csd-in'); b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
    copy(r, b, el); show(el, b);
    // le vrai champ (invisible) est posé sur la case : un toucher ouvre le calendrier du téléphone ; sur ordinateur on l'ouvre aussi au clic
    el.addEventListener('click', function () { try { if (el.showPicker) el.showPicker(); } catch (e) { /* ignore */ } });
    el.addEventListener('focus', function () { b.style.outline = '2px solid currentColor'; b.style.outlineOffset = '1px'; });
    el.addEventListener('blur', function () { b.style.outline = ''; });
    ['input', 'change', 'blur'].forEach(function (ev) { el.addEventListener(ev, function () { show(el, b); }); });
    el.addEventListener('invalid', function () { b.style.outline = '2px solid #e5484d'; b.style.outlineOffset = '1px'; setTimeout(function () { b.style.outline = ''; }, 2500); });
    window.addEventListener('resize', function () { copy(r, b, el); });
    // le site client vide la valeur d'exemple au chargement : on suit le changement
    var last = el.value; setInterval(function () { if (el.value !== last) { last = el.value; show(el, b); } }, 700);
  }
  function run() {
    if (!document.getElementById('csd-css')) { var st = document.createElement('style'); st.id = 'csd-css'; st.textContent = CSS; document.head.appendChild(st); }
    document.querySelectorAll('form input[type="datetime-local"], form input[type="date"]').forEach(wrap);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 50); }); else setTimeout(run, 50);
  window.addEventListener('load', function () { setTimeout(run, 300); });
})();

/* 09/11/2026 (Anthony) : la bannière d'accueil s'agrandit toute seule si le titre ou le texte dépasse (ordinateur et téléphone, tous les styles) */
(function () {
  var busy = false;
  function fit() {
    if (busy) return; busy = true;
    document.querySelectorAll('.photo.hero, .hero').forEach(function (h) {
      if (h.__csfit && h.style.height === 'auto') { h.style.height = ''; h.style.minHeight = ''; }
      var need = h.scrollHeight, have = h.clientHeight;
      if (have && need > have + 2) { h.__csfit = 1; h.style.minHeight = have + 'px'; h.style.height = 'auto'; }
    });
    busy = false;
  }
  var t = null; function later() { clearTimeout(t); t = setTimeout(fit, 120); }
  function start() {
    fit();
    window.addEventListener('resize', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    try { new MutationObserver(later).observe(document.documentElement, { attributes: true, attributeFilter: ['data-style', 'data-l', 'data-p'] }); } catch (e) {}
    document.querySelectorAll('.photo.hero, .hero').forEach(function (h) { try { new MutationObserver(later).observe(h, { childList: true, characterData: true, subtree: true }); } catch (e) {} });
    document.addEventListener('cs:applied', later);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', later);
})();

/* 10/11/2026 (Anthony) : dans un même formulaire, les menus déroulants ont exactement la hauteur des champs texte
   (sous Safari le menu était plus petit et le code postal paraissait « difforme »). */
(function () {
  var CHEV = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";
  function eq() {
    document.querySelectorAll('form').forEach(function (f) {
      var t = f.querySelector('input[type="text"], input[type="tel"], input[type="email"], input[type="number"], input:not([type])');
      if (!t || !t.offsetHeight) return;
      f.querySelectorAll('select').forEach(function (s) {
        if (!s.offsetHeight) return;
        var c = getComputedStyle(s);
        if ((c.webkitAppearance || c.appearance) !== 'none' && c.appearance !== 'none') {
          s.style.webkitAppearance = 'none'; s.style.appearance = 'none';
          if (!c.backgroundImage || c.backgroundImage === 'none') { s.style.backgroundImage = CHEV; s.style.backgroundRepeat = 'no-repeat'; s.style.backgroundPosition = 'right 12px center'; s.style.backgroundSize = '12px'; }
          s.style.paddingRight = Math.max(parseFloat(c.paddingRight) || 0, 32) + 'px';
        }
        s.style.boxSizing = 'border-box'; s.style.height = t.offsetHeight + 'px';
        var tc = getComputedStyle(t); s.style.paddingTop = '0'; s.style.paddingBottom = '0'; s.style.lineHeight = 'normal';
        if (!s.style.fontSize) s.style.fontSize = tc.fontSize;
      });
      f.querySelectorAll('.csd-b').forEach(function (b) { b.style.boxSizing = 'border-box'; b.style.height = t.offsetHeight + 'px'; });
    });
  }
  var k = null; function later() { clearTimeout(k); k = setTimeout(eq, 150); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', later); else later();
  window.addEventListener('load', function () { later(); setTimeout(eq, 900); }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(later); window.addEventListener('resize', later); document.addEventListener('cs:applied', later);
  try { new MutationObserver(later).observe(document.documentElement, { attributes: true, attributeFilter: ['data-style', 'data-l', 'data-p'] }); } catch (e) {}
})();
