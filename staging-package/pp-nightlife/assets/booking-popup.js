/* Existing PoolParty Book Now contract: desktop centered 800x600 browser window.
   Below 768px the real anchor opens in a new tab. A blocked popup is not cancelled.
   Booketing "Loading Experiences" runs on the provider page, not in an iframe here. */
(function(){
  function openPP(url,w,h){
    var L=window.screenLeft!==undefined?window.screenLeft:window.screenX;
    var T=window.screenTop!==undefined?window.screenTop:window.screenY;
    var bw=window.innerWidth||document.documentElement.clientWidth||screen.width;
    var bh=window.innerHeight||document.documentElement.clientHeight||screen.height;
    w=w||800; h=h||600;
    return window.open(url,'ppbook','width='+w+',height='+h+',top='+(T+(bh-h)/2)+',left='+(L+(bw-w)/2)+',scrollbars=yes,resizable=yes');
  }
  if(typeof window.openCenteredPopup!=='function'){
    window.openCenteredPopup=function(u,w,h){var p=openPP(u,w,h); if(!p) window.open(u,'_blank'); return p;};
  }
  var HOSTS=/(^|\.)(booketing\.com|spiagge\.it)$/i, TIXR=/(^|\.)tixr\.com$/i;
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    if(window.innerWidth<768){
      var m=e.target.closest&&e.target.closest('a[data-pp-popup]');
      if(m&&!m.hasAttribute('data-pp-pass')&&!m.target){ m.target='_blank'; m.rel='noopener'; }
      return;
    }
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||a.hasAttribute('onclick')||a.hasAttribute('data-pp-pass')) return;
    var u; try{ u=new URL(a.href,location.href);}catch(x){return;}
    if(!/^https?:$/.test(u.protocol)) return;
    var book=a.hasAttribute('data-pp-book')||a.id==='ppbooknow'||/(^|\s)card-buy(\s|$)/.test(a.className||'');
    if(u.host===location.host){ if(!book||(u.pathname===location.pathname&&u.search===location.search)) return; }
    else {
      var vd=a.hasAttribute('data-pp-popup');
      var txt=(a.innerText||a.textContent||'').replace(/\s+/g,' ').trim();
      if(!(book||vd||HOSTS.test(u.hostname)||TIXR.test(u.hostname)||/^(book now|book|get tickets|buy tickets|tickets|reserve)\b/i.test(txt))) return;
    }
    var p=openPP(u.href,800,600);
    if(p){ e.preventDefault(); try{p.focus();}catch(x){} }
  },true);
})();
