/* Clic&Site : le module d'activités GetYourGuide dépose un identifiant de session dans le navigateur.
   Il ne se charge qu'après accord du visiteur (choix gardé dans localStorage "cs_gyg"). Les liens restent toujours actifs. */
(function(){
  var d=document.querySelector(".live__gyg");if(!d)return;
  var en=(document.documentElement.lang||"").slice(0,2)==="en";
  var w=d.querySelector("[data-gyg-widget]");if(!w)return;
  function l(){if(window.__gyg)return;window.__gyg=1;var ti=w.getAttribute("data-gyg-tour-ids");if(innerWidth<700){var n=ti?Math.min(2,ti.split(",").length):2;w.setAttribute("data-gyg-number-of-items",String(n));if(ti)w.setAttribute("data-gyg-tour-ids",ti.split(",").slice(0,2).join(","))}var s=document.createElement("script");s.async=1;s.src="https://widget.getyourguide.com/dist/pa.umd.production.min.js";s.setAttribute("data-gyg-partner-id","XMYSXGR");document.body.appendChild(s)}
  function arm(){if("IntersectionObserver"in window){var o=new IntersectionObserver(function(e){if(e[0].isIntersecting){l();o.disconnect()}},{rootMargin:"600px"});o.observe(d)}else l()}
  var ok=false;try{ok=localStorage.getItem("cs_gyg")==="1"}catch(e){}
  if(ok){arm();return}
  w.style.display="none";
  var b=document.createElement("div");b.className="gyg-ok";
  var im=document.querySelector('.post__img'),src='';
  if(im){src=((im.getAttribute('srcset')||'').split(',')[0]||'').trim().split(' ')[0]||im.getAttribute('src')||''}
  var bg=src?' style="background-image:url(\''+src.replace(/'/g,"%27")+'\')"':'';
  var sk='<div class="gyg-ok__sk'+(src?' gyg-ok__sk--ph':'')+'" aria-hidden="true"><i'+bg+'></i><i'+bg+'></i><i'+bg+'></i></div>';
  b.innerHTML=sk+(en
    ?'<div class="gyg-ok__c"><button type="button" class="gyg-ok__b">See available activities</button><p class="gyg-ok__n">Live prices from GetYourGuide (sets a cookie). <a href="/legal-notice/#cookies">Details</a></p></div>'
    :'<div class="gyg-ok__c"><button type="button" class="gyg-ok__b">Voir les activités disponibles</button><p class="gyg-ok__n">Prix en direct de GetYourGuide (dépose un cookie). <a href="/mentions-legales/#cookies">Détails</a></p></div>');
  d.appendChild(b);
  b.querySelector("button").addEventListener("click",function(){try{localStorage.setItem("cs_gyg","1")}catch(e){}b.remove();w.style.display="";l()});
})();
