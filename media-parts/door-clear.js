/* FogTap rebuild door plate assembler */
(function(){
  var parts = window.FOGTAP_DOOR_PARTS || [];
  var URI = parts.join('');
  function apply(){
    document.querySelectorAll('img.door-plate, img.door-blur, img.hero-door-img').forEach(function(img){
      if (URI) { img.src = URI; img.setAttribute('data-embedded','1'); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
  window.FOGTAP_DOOR_CLEAR_URI = URI;
})();
