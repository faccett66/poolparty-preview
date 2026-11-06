/* Landing venue <select data-nl-filter>. Cards use data-venue (partner id). */
(function () {
  var form = document.querySelector('[data-nl-filter]');
  var grid = document.querySelector('[data-nl-grid]');
  if (!form || !grid) return;
  var select = form.querySelector('select[name="venue"]');
  var cards = [].slice.call(grid.querySelectorAll('.card'));
  var count = document.querySelector('[data-nl-count]');
  function venueOf(card) {
    return card.getAttribute('data-venue') || card.getAttribute('data-venue-id') || '';
  }
  function apply() {
    var id = select ? select.value : '';
    var shown = 0;
    cards.forEach(function (card) {
      var on = !id || venueOf(card) === id;
      card.hidden = !on;
      if (on) shown++;
    });
    if (count) {
      count.textContent = shown + ' upcoming ' + (shown === 1 ? 'event' : 'events') + ' in this static sample. Not live inventory. No prices are shown here.';
    }
  }
  if (select) select.addEventListener('change', apply);
  form.addEventListener('reset', function () { setTimeout(apply, 0); });
  apply();
})();
