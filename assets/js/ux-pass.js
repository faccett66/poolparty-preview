/* UX pass: sticky "Find a party" bar (phones) + compact music dock on phones */
(function () {
  var CITIES = [['las-vegas','Las Vegas'],['miami','Miami'],['dubai','Dubai'],['los-angeles','Los Angeles'],['new-york','New York'],['spain','Spain / Ibiza'],['bali','Bali'],['california','California'],['florida','Florida'],['phuket','Phuket'],['sydney','Sydney']];
  function findBar() {
    if (document.querySelector('.find-bar')) return;
    var path = (location.pathname.split('/').pop() || 'index.html');
    if (/^(cart|checkout|account)\.html$/.test(path)) return;
    var f = document.createElement('form');
    f.className = 'find-bar'; f.action = 'events.html'; f.setAttribute('aria-label', 'Find a party');
    f.innerHTML = '<label class="sr">City</label><select name="city" aria-label="City"><option value="">Any city</option>' +
      CITIES.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('') +
      '</select><select name="past" aria-label="When"><option value="">This week</option><option value="1">Any time</option></select>' +
      '<button type="submit">Find a party</button>';
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = f.city.value, p = f.past.value, q = [];
      if (c) q.push('city=' + encodeURIComponent(c));
      if (p) q.push('past=1');
      location.href = 'events.html' + (q.length ? '?' + q.join('&') : '');
    });
    document.body.appendChild(f);
    document.body.classList.add('has-find-bar');
  }
  function dockToggle() {
    var dock = document.querySelector('.pp-music-dock');
    if (!dock) return false;
    if (dock.querySelector('.ux-dock-toggle')) return true;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ux-dock-toggle'; b.setAttribute('aria-label', 'Music player');
    b.innerHTML = '♪';
    b.addEventListener('click', function (e) { e.stopPropagation(); dock.classList.toggle('ux-open'); });
    dock.appendChild(b);
    return true;
  }
  function boot() {
    document.body.classList.add('ux-calm');
    document.querySelectorAll('.ad-stream').forEach(function (el) { el.remove(); });
    document.body.classList.remove('has-ad-stream');
    document.documentElement.style.removeProperty('--ad-stream-offset');
    findBar();
    var n = 0, t = setInterval(function () { if (dockToggle() || ++n > 40) clearInterval(t); }, 150);
  }
  document.body && document.body.classList.add('ux-calm');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
