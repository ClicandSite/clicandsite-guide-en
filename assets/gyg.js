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
  b.innerHTML=en
    ?'<p>This live list of activities is provided by GetYourGuide, which stores a session identifier in your browser. It only loads with your consent. <a href="/legal-notice/#cookies">Learn more</a></p><button type="button" class="gyg-ok__b">Accept and show activities</button>'
    :'<p>Cette liste d’activités en direct est fournie par GetYourGuide, qui enregistre un identifiant de session dans votre navigateur. Elle ne se charge qu’avec votre accord. <a href="/mentions-legales/#cookies">En savoir plus</a></p><button type="button" class="gyg-ok__b">Accepter et afficher les activités</button>';
  d.appendChild(b);
  b.querySelector("button").addEventListener("click",function(){try{localStorage.setItem("cs_gyg","1")}catch(e){}b.remove();w.style.display="";l()});
})();
