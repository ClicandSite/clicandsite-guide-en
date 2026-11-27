/* Recherche Clic&Site : bouton loupe dans l'en-tête, résultats instantanés (assets/search.json) */
(function(){
  var fr=(document.documentElement.lang||'fr').slice(0,2)!=='en';
  var L=fr?{btn:'Rechercher',ph:'Ville, village, station, idée…',none:'Aucune page trouvée. Essayez un autre nom.',close:'Fermer'}
          :{btn:'Search',ph:'Town, village, ski resort, idea…',none:'No page found. Try another name.',close:'Close'};
  var top=document.querySelector('.top__in'); if(!top||document.querySelector('.sbtn')) return;
  var b=document.createElement('button'); b.type='button'; b.className='sbtn'; b.setAttribute('aria-label',L.btn); b.setAttribute('aria-expanded','false');
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var langs=top.querySelector('.langs'); top.insertBefore(b, langs||null);
  var p=document.createElement('div'); p.className='spanel'; p.hidden=true; p.setAttribute('role','dialog'); p.setAttribute('aria-label',L.btn);
  p.innerHTML='<div class="spanel__in"><input type="search" class="sinput" autocomplete="off" placeholder="'+L.ph+'" aria-label="'+L.btn+'"><button type="button" class="sclose" aria-label="'+L.close+'">×</button></div><ul class="sres" role="listbox"></ul>';
  document.body.appendChild(p);
  var inp=p.querySelector('.sinput'), ul=p.querySelector('.sres'), data=null;
  function fold(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’'\-]/g,' ');}
  function load(){ if(data) return Promise.resolve(data);
    return fetch('/assets/search.json?v='+(window.SV||'1')).then(function(r){return r.json()}).then(function(d){
      d.forEach(function(x){x.ft=fold(x.t);x.fr=fold(x.r);x.fd=fold(x.d);x.fu=fold(x.u)}); return data=d; }); }
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function score(x,q,ws){ var s=0;
    if(x.ft.indexOf(q)===0) s+=100; else if((' '+x.ft).indexOf(' '+q)>=0) s+=70; else if(x.ft.indexOf(q)>=0) s+=40;
    if(x.fu.indexOf(q.replace(/ /g,' '))>=0) s+=15;
    for(var i=0;i<ws.length;i++){ var w=ws[i]; if(!w) continue;
      if(x.ft.indexOf(w)>=0) s+=12; else if(x.fr.indexOf(w)>=0) s+=8; else if(x.fd.indexOf(w)>=0) s+=4; else return 0; }
    return s; }
  function render(){ var q=fold(inp.value).trim().replace(/\s+/g,' ');
    if(q.length<2){ul.innerHTML='';return;}
    load().then(function(d){ var ws=q.split(' ');
      var r=d.map(function(x){return [score(x,q,ws),x]}).filter(function(a){return a[0]>0}).sort(function(a,b){return b[0]-a[0]}).slice(0,8);
      ul.innerHTML=r.length?r.map(function(a,i){var x=a[1];return '<li><a href="'+x.u+'"'+(i===0?' class="on"':'')+'><span class="sres__t">'+esc(x.t)+'</span>'+(x.r?'<span class="sres__r">'+esc(x.r)+'</span>':'')+'</a></li>'}).join('')
        :'<li class="sres__none">'+L.none+'</li>'; }); }
  function open(){p.hidden=false;b.setAttribute('aria-expanded','true');document.documentElement.classList.add('s-open');setTimeout(function(){inp.focus()},30);load();}
  function close(){p.hidden=true;b.setAttribute('aria-expanded','false');document.documentElement.classList.remove('s-open');b.focus();}
  b.addEventListener('click',function(){p.hidden?open():close()});
  p.querySelector('.sclose').addEventListener('click',close);
  p.addEventListener('click',function(e){if(e.target===p)close()});
  inp.addEventListener('input',render);
  inp.addEventListener('keydown',function(e){
    var as=ul.querySelectorAll('a'), i=[].indexOf.call(as,ul.querySelector('a.on'));
    if(e.key==='Escape'){close();}
    else if(e.key==='Enter'&&as.length){e.preventDefault();location.href=as[Math.max(i,0)].getAttribute('href');}
    else if((e.key==='ArrowDown'||e.key==='ArrowUp')&&as.length){e.preventDefault(); if(i>=0)as[i].classList.remove('on');
      i=e.key==='ArrowDown'?Math.min(as.length-1,i+1):Math.max(0,i-1); as[i].classList.add('on'); as[i].scrollIntoView({block:'nearest'});}
  });
  document.addEventListener('keydown',function(e){ if(e.key==='/'&&p.hidden&&!/input|textarea/i.test((e.target.tagName||''))){e.preventDefault();open();} });
})();
