/* Statistiques Clic&Site : vues et clics partenaires, sans cookie ni stockage, sans IP. */
(function(){
  var ua=navigator.userAgent||'';
  if(navigator.webdriver||/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(ua))return;
  var U='https://avcynjwcyygygkjuxsdt.supabase.co/rest/v1/guide_events',K='sb_publishable_fdSM-pnUtZRKX7K6nOf5Ag_i1TQgqLO';
  var site=location.hostname.slice(-4)==='.com'?'en':'fr';
  var dev=/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';
  var ref='';try{if(document.referrer){var h=new URL(document.referrer).hostname;if(h!==location.hostname)ref=h.slice(0,100);}}catch(e){}
  function send(o){
    o.site=site;o.device=dev;o.path=(location.pathname||'/').slice(0,200);
    try{fetch(U,{method:'POST',keepalive:true,headers:{'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(o)}).catch(function(){});}catch(e){}
  }
  send({kind:'view',ref:ref||null});
  document.addEventListener('click',function(ev){
    var a=ev.target.closest&&ev.target.closest('a[href]');if(!a)return;
    var h=a.href,p=null;
    if(/getyourguide\./.test(h))p='gyg';else if(/viator\.com/.test(h))p='viator';else if(/elite-prestige-services/.test(h))p='eps';
    if(p)send({kind:'click',partner:p});
  },true);
})();
