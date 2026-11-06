/* In-memory preview only. Does not add UTMs, call gtag, or push a dataLayer hit. A click is not a sale. */
(function(){
  window.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[data-pp-book]');
    if(!a)return;
    var payload={
      event:'book_now_click',
      content_vertical:'Nightlife',
      venue_type:'Nightclub',
      click_type:a.getAttribute('data-pp-click-type')||'partner',
      dest_domain:a.getAttribute('data-pp-dest')||'booketing.com',
      event_title:a.getAttribute('data-pp-event')||'',
      venue:a.getAttribute('data-pp-venue')||'',
      venue_id:a.getAttribute('data-pp-venue-id')||'',
      eventcode:a.getAttribute('data-pp-eventcode')||'',
      city:a.getAttribute('data-pp-city')||'',
      vibe:a.getAttribute('data-pp-vibe')||'',
      placement:a.getAttribute('data-pp-placement')||'',
      affiliate_code:'ppl',
      link_url:a.href,
      confirmed_sale:false
    };
    window.ppNightlifePreviewEvents=window.ppNightlifePreviewEvents||[];
    window.ppNightlifePreviewEvents.push(payload);
  },true);
})();
