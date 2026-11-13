/* Statistiques Clic&Site : vues et clics partenaires, sans cookie ; l'IP sert seulement à déduire pays et ville, elle n'est jamais enregistrée.
   Ouvrir le site avec #nostats exclut ce navigateur sur les DEUX domaines (passe par l'autre domaine avec #nostats2) ; #stats le réactive. */
(function(){
  try{
    var hs=location.hash,other=location.hostname.slice(-4)==='.com'?'https://clicandsite.fr/':'https://clicandsite.com/';
    if(hs==='#nostats'||hs==='#nostats2'){localStorage.setItem('cs_nostats','1');
      if(hs==='#nostats'){location.replace(other+'#nostats2');return;}
      var m=document.createElement('div');m.textContent='\u2713 Cet appareil n\u2019est plus compt\u00e9 dans les statistiques (clicandsite.fr et .com).';
      m.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:#13304b;color:#fff;padding:14px 16px;border-radius:10px;font:600 15px/1.4 system-ui,sans-serif;text-align:center';
      document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(m)});if(document.body)document.body.appendChild(m);
      history.replaceState(null,'',location.pathname);return;}
    if(hs==='#stats'){localStorage.removeItem('cs_nostats');if(!/stats2/.test(hs))location.replace(other+'#stats2');}
    if(hs==='#stats2')localStorage.removeItem('cs_nostats');
    if(localStorage.getItem('cs_nostats')==='1')return;}catch(e){}
  var ua=navigator.userAgent||'';
  if(navigator.webdriver||/bot|crawl|spider|slurp|lighthouse|headless|preview|google-|inspectiontool|facebookexternalhit|bytespider|petal|yandex|baidu|semrush|ahrefs|compatible;/i.test(ua))return;
  var U='https://avcynjwcyygygkjuxsdt.supabase.co/functions/v1/collect';
  var site=location.hostname.slice(-4)==='.com'?'en':'fr';
  var dev=/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';
  var ref='';try{if(document.referrer){var h=new URL(document.referrer).hostname;if(h!==location.hostname)ref=h.slice(0,100);}}catch(e){}
  function send(o){
    o.site=site;o.device=dev;o.path=(location.pathname||'/').slice(0,200);
    try{fetch(U,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify(o)}).catch(function(){});}catch(e){}
  }
  send({kind:'view',ref:ref||null});
  document.addEventListener('click',function(ev){
    var a=ev.target.closest&&ev.target.closest('a[href]');if(!a)return;
    var h=a.href,p=null;
    if(/getyourguide\./.test(h))p='gyg';else if(/viator\.com/.test(h))p='viator';else if(/elite-prestige-services/.test(h))p='eps';
    if(p)send({kind:'click',partner:p});
  },true);
})();
