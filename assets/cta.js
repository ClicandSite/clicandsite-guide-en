/* Barre « Mes billets » sur mobile : visible après l'en-tête, masquée quand le bloc de réservation est à l'écran. */
(function(){
  var bar=document.getElementById('cta-bar');if(!bar)return;
  var hero=document.querySelector('header.post')||document.querySelector('main > :first-child');
  var book=document.getElementById('reserver');
  var past=false,inBook=false;
  bar.hidden=false;document.body.classList.add('has-bar');
  function upd(){bar.classList.toggle('on',past&&!inBook)}
  if(!('IntersectionObserver' in window)){window.addEventListener('scroll',function(){past=scrollY>500;upd()},{passive:true});return}
  if(hero)new IntersectionObserver(function(e){past=!e[0].isIntersecting;upd()}).observe(hero);else{past=true}
  if(book)new IntersectionObserver(function(e){inBook=e[0].isIntersecting;upd()},{rootMargin:'0px 0px -20% 0px'}).observe(book);
  upd();
})();
