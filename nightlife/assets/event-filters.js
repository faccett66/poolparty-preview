(function(){
  var buttons=document.querySelectorAll('[data-ev-filter]');
  var cards=[].slice.call(document.querySelectorAll('.card-grid .card'));
  var count=document.querySelector('[data-ev-count]');
  function apply(id){
    var shown=0;
    cards.forEach(function(card){
      var on=!id||card.getAttribute('data-venue-id')===id;
      card.hidden=!on;
      if(on) shown++;
    });
    if(count) count.textContent=shown+' upcoming '+ (shown===1?'event':'events')+' in this static sample';
    buttons.forEach(function(btn){ btn.setAttribute('aria-pressed', btn.getAttribute('data-ev-filter')===(id||'') ? 'true' : 'false'); });
  }
  buttons.forEach(function(btn){
    btn.addEventListener('click',function(){ apply(btn.getAttribute('data-ev-filter')); });
  });
  document.querySelectorAll('.card-media img').forEach(function(img){
    img.addEventListener('error',function(){
      var media=img.closest('.card-media');
      if(!media||media.classList.contains('is-fallback')) return;
      media.classList.add('is-fallback');
      media.textContent='Partner artwork unavailable';
    });
  });
  apply('');
})();
