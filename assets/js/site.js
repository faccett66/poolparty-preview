/* PoolParty prototype — shared client logic (no backend) */
(function () {
  const CART_KEY = 'pp_demo_cart_v1';
  const CITY_KEY = 'pp_selected_city';
  const IMG_BUST = '32';
  const bust = (src) => (!src ? '' : src.includes('?') ? src : `${src}?v=${IMG_BUST}`);
  const PREVIEW_TODAY = '2026-09-15'; // mid-Sep 2026 preview "now"

  const PP = {
    dataRoot: (document.body.dataset.dataRoot || 'data').replace(/\/$/, ''),
    assetRoot: (document.body.dataset.assetRoot || '').replace(/\/$/, ''),

    async loadJSON(name) {
      const url = `${this.dataRoot}/${name}.json?v=${IMG_BUST}`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load ${url}`);
      return res.json();
    },

    getCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
      catch { return []; }
    },
    saveCart(items) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      this.updateCartBadge();
      window.dispatchEvent(new CustomEvent('pp:cart'));
    },
    addToCart(item) {
      const cart = this.getCart();
      const key = `${item.eventId}::${item.tierId}`;
      const existing = cart.find(c => c.key === key);
      if (existing) existing.qty += item.qty || 1;
      else cart.push({ ...item, key, qty: item.qty || 1 });
      this.saveCart(cart);
      return cart;
    },
    setQty(key, qty) {
      let cart = this.getCart();
      if (qty <= 0) cart = cart.filter(c => c.key !== key);
      else cart = cart.map(c => c.key === key ? { ...c, qty } : c);
      this.saveCart(cart);
    },
    clearCart() { this.saveCart([]); },
    cartCount() { return this.getCart().reduce((n, c) => n + (c.qty || 0), 0); },
    updateCartBadge() {
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        const n = this.cartCount();
        el.textContent = n;
        el.hidden = n === 0;
      });
    },

    getCity() { return localStorage.getItem(CITY_KEY) || ''; },
    setCity(slug) {
      if (slug) localStorage.setItem(CITY_KEY, slug);
      else localStorage.removeItem(CITY_KEY);
      window.dispatchEvent(new CustomEvent('pp:city', { detail: slug }));
    },

    qs(name) {
      return new URLSearchParams(location.search).get(name);
    },
    formatDate(iso) {
      if (!iso) return '';
      try {
        return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
      } catch { return iso; }
    },
    cityName(cities, slug) {
      const c = (cities || []).find(x => x.slug === slug);
      return c ? c.name : (slug || '').replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
    },
    /** Prefer in-preview city hub (events + venues + live handoff). */
    cityHubHref(slug) {
      return `city.html?id=${encodeURIComponent(slug || '')}`;
    },
    cityTileMeta(city, { eventSlugs, venueSlugs } = {}) {
      const slug = city.slug;
      const hasE = eventSlugs && eventSlugs.has(slug);
      const hasV = venueSlugs && venueSlugs.has(slug);
      let blurb = 'City hub';
      if (hasE && hasV) blurb = 'Events + venues';
      else if (hasE) blurb = 'View events';
      else if (hasV) blurb = 'View venues';
      else blurb = 'Open hub · live link';
      return { href: this.cityHubHref(slug), blurb };
    },
    bookMeta(ev) {
      const provider = (ev.book_provider || '').toLowerCase();
      const url = String(ev.book_url || ev.live_url || '');
      const onBooketing = provider.includes('booketing') || /booketing\.com/i.test(url);
      const onSquadUpDirect = /squadup\.com/i.test(url);
      const onSiteHandoff = /poolparty\.com/i.test(url);
      let label = ev.book_label;
      if (!label) {
        if (onBooketing) label = 'Book Now — Booketing';
        else if (onSquadUpDirect) label = 'Book Now — SquadUp';
        else if (onSiteHandoff) label = 'Book Now — live site';
        else if (provider.includes('squadup')) label = 'Book Now — live checkout';
        else label = 'Book Now — live handoff';
      }
      let noteProvider = 'live';
      if (onBooketing) noteProvider = 'Booketing';
      else if (onSquadUpDirect) noteProvider = 'SquadUp';
      else if (onSiteHandoff) noteProvider = 'PoolParty.com (SquadUp overlay on live site — not embedded here)';
      else if (provider.includes('squadup')) noteProvider = 'SquadUp / Pool Party checkout';
      else if (provider) noteProvider = ev.book_provider;
      return { label, noteProvider, provider };
    },
    previewToday() { return PREVIEW_TODAY; },
    isUpcoming(ev) {
      const d = (ev && ev.date) || '';
      return !!d && d >= PREVIEW_TODAY;
    },
    upcomingOnly(items) {
      return (items || []).filter(e => this.isUpcoming(e));
    },
    countUpcoming(items, citySlug) {
      return (items || []).filter(e => this.isUpcoming(e) && (!citySlug || e.city === citySlug)).length;
    },
    sortEventsUpcomingFirst(items) {
      const today = PREVIEW_TODAY;
      return [...items].sort((a, b) => {
        const da = a.date || '';
        const db = b.date || '';
        const ua = da >= today ? 0 : 1;
        const ub = db >= today ? 0 : 1;
        if (ua !== ub) return ua - ub;
        if (da !== db) return da < db ? -1 : 1;
        return String(a.title || '').localeCompare(String(b.title || ''));
      });
    },
    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c]);
    },

    eventCard(ev, opts = {}) {
      const book = ev.book_url || ev.live_url || (ev.slug ? `https://poolparty.com/event/${encodeURIComponent(ev.slug)}/` : 'events.html');
      const meta = this.bookMeta(ev);
      const detailHref = opts.detailBase
        ? `${opts.detailBase}?id=${encodeURIComponent(ev.slug)}`
        : `event.html?id=${encodeURIComponent(ev.slug)}`;
      return `
      <article class="card" data-city="${this.esc(ev.city)}" data-vibe="${this.esc(ev.vibe)}">
        <div class="card-media">
          <img src="${this.esc(bust(ev.image))}" alt="${this.esc(ev.title)}" loading="lazy" />
          <div class="badge-row">
            <span class="tag">${this.esc((ev.vibe || 'pool').toUpperCase())}</span>
            ${this.isUpcoming(ev) ? '<span class="tag live">THIS WEEK</span>' : '<span class="tag demo">PAST CATALOG</span>'}
          </div>
        </div>
        <div class="card-body">
          <h3><a href="${detailHref}">${this.esc(ev.title)}</a></h3>
          <div class="card-meta">
            <span>${this.esc(this.formatDate(ev.date))}</span>
            <span>${this.esc(ev.venue || '')}</span>
            <span>${this.esc(this.cityName(opts.cities, ev.city))}</span>
          </div>
          <div class="card-actions">
            <a class="btn btn-primary btn-sm" href="${this.esc(book)}" target="_blank" rel="noopener">${this.esc(meta.label)}</a>
            <a class="btn btn-ghost btn-sm" href="${detailHref}">Details</a>
            <button type="button" class="btn btn-ghost btn-sm" data-add-demo
              data-event-id="${this.esc(ev.slug)}"
              data-title="${this.esc(ev.title)}"
              data-image="${this.esc(ev.image)}"
              data-tier-id="ga"
              data-tier-label="General Admission (DEMO)">+ Demo cart</button>
          </div>
          <p class="handoff-note">${this.esc(meta.label)} opens ${this.esc(meta.noteProvider)} — live PoolParty.com ticket stack unchanged. Prototype cart is DEMO quantity-only (no prices).</p>
        </div>
      </article>`;
    },

    venueCard(v, opts = {}) {
      const live = v.live_url || `https://poolparty.com/venue/${encodeURIComponent(v.slug || '')}/`;
      const hub = this.cityHubHref(v.city);
      return `
      <article class="card" data-city="${this.esc(v.city)}" data-vibe="${this.esc(v.vibe)}">
        <div class="card-media">
          <a href="${this.esc(live)}" target="_blank" rel="noopener" aria-label="${this.esc(v.name)} on live site">
            <img src="${this.esc(bust(v.image))}" alt="${this.esc(v.name)}" loading="lazy" />
          </a>
          <div class="badge-row">
            <span class="tag">${this.esc((v.vibe || 'pool').toUpperCase())}</span>
            <span class="tag live">LIVE</span>
          </div>
        </div>
        <div class="card-body">
          <h3><a href="${this.esc(live)}" target="_blank" rel="noopener">${this.esc(v.name)}</a></h3>
          <div class="card-meta">
            <span>${this.esc(v.city_name || this.cityName(opts.cities, v.city))}</span>
          </div>
          <p style="font-size:.88rem;color:var(--mist);font-weight:300">${this.esc(v.excerpt || '')}</p>
          <div class="card-actions">
            <a class="btn btn-primary btn-sm" href="${this.esc(live)}" target="_blank" rel="noopener">Venue on live site</a>
            <a class="btn btn-ghost btn-sm" href="events.html?city=${encodeURIComponent(v.city)}">Events in city</a>
            <a class="btn btn-ghost btn-sm" href="${hub}">City hub</a>
          </div>
        </div>
      </article>`;
    },


    /** Apply dayclub page overlays: LA rooftop / yacht / checkout (static class preferred). */
    initPageTheme() {
      const body = document.body;
      if (!body || body.classList.contains('page-checkout')) return;

      const path = (location.pathname.split('/').pop() || '').toLowerCase();
      const cityQ = (this.qs('city') || this.qs('id') || '').toLowerCase();
      const vibeQ = (this.qs('vibe') || '').toLowerCase();
      const stored = (this.getCity && this.getCity()) || '';

      const isLA = (s) => {
        const v = String(s || '').toLowerCase();
        return v === 'los-angeles' || v === 'la' || v === 'losangeles';
      };
      const isYacht = (s) => String(s || '').toLowerCase() === 'yacht';

      let la = false;
      let yacht = false;

      if (path === 'city.html' && isLA(cityQ)) la = true;
      if (path === 'events.html' || path === 'venues.html') {
        if (isLA(cityQ) || (!cityQ && isLA(stored))) la = true;
        if (isYacht(vibeQ)) yacht = true;
      }
      if (path === 'event.html') {
        // event detail may set data-city / data-vibe on body after load; also URL hints
        if (isYacht(vibeQ)) yacht = true;
        if (isLA(cityQ)) la = true;
      }

      // Prefer yacht when both (yacht vibe pages)
      if (yacht) {
        body.classList.add('page-yacht');
        body.classList.remove('page-la');
      } else if (la) {
        body.classList.add('page-la');
        body.classList.remove('page-yacht');
      }

      // Observe late-bound event detail attributes
      if (path === 'event.html') {
        const applyFromDataset = () => {
          if (isYacht(body.dataset.vibe)) {
            body.classList.add('page-yacht');
            body.classList.remove('page-la');
          } else if (isLA(body.dataset.city)) {
            body.classList.add('page-la');
            body.classList.remove('page-yacht');
          }
        };
        applyFromDataset();
        const mo = new MutationObserver(applyFromDataset);
        mo.observe(body, { attributes: true, attributeFilter: ['data-city', 'data-vibe'] });
      }

      // React to filter changes on events/venues
      if (path === 'events.html' || path === 'venues.html') {
        const citySel = document.querySelector('#city, [name="city"], select[data-filter="city"]');
        const vibeSel = document.querySelector('#vibe, [name="vibe"], select[data-filter="vibe"]');
        const sync = () => {
          const c = (citySel && citySel.value) || this.qs('city') || '';
          const v = (vibeSel && vibeSel.value) || this.qs('vibe') || '';
          body.classList.toggle('page-yacht', isYacht(v));
          body.classList.toggle('page-la', !isYacht(v) && isLA(c));
        };
        [citySel, vibeSel].forEach(el => el && el.addEventListener('change', sync));
      }
    },

    initNav() {
      const nav = document.querySelector('.nav');
      const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      const toggle = document.querySelector('[data-nav-toggle]');
      const drawer = document.querySelector('[data-nav-drawer]');
      if (toggle && drawer) {
        toggle.addEventListener('click', () => {
          const open = drawer.classList.toggle('open');
          toggle.setAttribute('aria-expanded', open);
          document.body.style.overflow = open ? 'hidden' : '';
        });
        drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
          drawer.classList.remove('open');
          document.body.style.overflow = '';
        }));
      }

      const path = location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-links a, [data-nav-drawer] a').forEach(a => {
        const href = (a.getAttribute('href') || '').split('?')[0];
        if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
      });

      this.updateCartBadge();

      const sticky = document.querySelector('.sticky-book');
      if (sticky) {
        const show = () => sticky.classList.toggle('show', window.scrollY > 420);
        show();
        window.addEventListener('scroll', show, { passive: true });
      }

      this.initAdStream();
    },


    initAdStream() {
      const path = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
      if (path === 'advertise.html') return;
      if (document.querySelector('.ad-stream')) return;
      const piece = [
        '<span class="ad-stream-pulse">Advertise here</span>',
        '<span class="ad-stream-sep">·</span>',
        '<span>Free offer</span>',
        '<span class="ad-stream-sep">·</span>',
        '<span class="ad-stream-pitch">Your events. Our audience.</span>',
        '<span class="ad-stream-sep">·</span>'
      ].join('');
      const chunks = Array.from({ length: 8 }, () => `<span class="ad-stream-chunk">${piece}</span>`).join('');
      const a = document.createElement('a');
      a.className = 'ad-stream';
      a.href = 'advertise.html';
      a.id = 'freeOffer';
      a.setAttribute('aria-label', 'Advertise here — free offer. Your events. Our audience.');
      a.innerHTML = `<span class="ad-stream-track">${chunks}${chunks}</span>`;
      // Fixed just under the measured nav bottom so the ticker is never covered
      Object.assign(a.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        zIndex: '79'
      });
      const place = () => {
        const nav = document.querySelector('header.nav');
        const top = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
        a.style.top = `${top}px`;
        document.documentElement.style.setProperty('--ad-stream-offset', `${top + a.offsetHeight}px`);
      };
      document.body.appendChild(a);
      document.body.classList.add('has-ad-stream');
      place();
      requestAnimationFrame(place);
      window.addEventListener('resize', place, { passive: true });
      window.addEventListener('scroll', place, { passive: true });
    },

    initReveal() {
      const els = document.querySelectorAll('.reveal');
      if (!els.length) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      els.forEach(el => io.observe(el));
    },

    initDemoCartButtons() {
      document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-add-demo]');
        if (!btn) return;
        e.preventDefault();
        this.addToCart({
          eventId: btn.dataset.eventId,
          title: btn.dataset.title,
          image: btn.dataset.image,
          tierId: btn.dataset.tierId || 'ga',
          tierLabel: btn.dataset.tierLabel || 'DEMO tier',
          qty: 1,
          demo: true
        });
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = '+ Demo cart'; }, 1400);
      });
    },

    initMailtoForms() {
      document.querySelectorAll('form[data-mailto]').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const to = form.dataset.mailto || 'faccett66@gmail.com';
          const subject = form.dataset.subject || 'PoolParty prototype inquiry';
          const fd = new FormData(form);
          const lines = [];
          fd.forEach((v, k) => lines.push(`${k}: ${v}`));
          const body = lines.join('\n');
          const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = href;
          const note = form.querySelector('[data-form-status]');
          if (note) {
            note.hidden = false;
            note.textContent = 'Opening your email client (demo). No backend — message goes via mailto.';
          }
        });
      });
    },

    bindFilters({ grid, search, city, vibe, items, render, upcomingToggle, emptyCityMessage }) {
      const isEventish = !!(items && items[0] && items[0].date !== undefined);
      const apply = () => {
        const q = (search?.value || '').toLowerCase().trim();
        const c = city?.value || '';
        const v = vibe?.value || '';
        const wantUpcoming = isEventish && upcomingToggle ? !!upcomingToggle.checked : (isEventish ? true : false);
        let filtered = items.filter(it => {
          if (c && it.city !== c) return false;
          if (v && it.vibe !== v) return false;
          if (isEventish && wantUpcoming && !this.isUpcoming(it)) return false;
          if (q) {
            const hay = `${it.title || it.name || ''} ${it.venue || ''} ${it.city || ''} ${it.excerpt || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
        if (isEventish) filtered = this.sortEventsUpcomingFirst(filtered);
        if (!filtered.length) {
          const cityLabel = c ? this.cityName(null, c) : '';
          const msg = (c && emptyCityMessage)
            ? emptyCityMessage(c, cityLabel, wantUpcoming)
            : (c && isEventish && wantUpcoming
              ? `No upcoming preview events for ${cityLabel || c} this week. Try another city, or show past catalog.`
              : 'No matches. Try another city or vibe.');
          grid.innerHTML = `<div class="empty-state">${msg}</div>`;
        } else {
          grid.innerHTML = filtered.map(render).join('');
        }
        const count = document.querySelector('[data-result-count]');
        if (count) {
          if (isEventish && wantUpcoming) {
            count.textContent = `${filtered.length} upcoming`;
          } else {
            count.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
          }
        }
      };
      [search, city, vibe, upcomingToggle].forEach(el => el && el.addEventListener('input', apply));
      [search, city, vibe, upcomingToggle].forEach(el => el && el.addEventListener('change', apply));
      // URL city wins; don't force stored city onto All Cities when browsing fresh
      const urlCity = this.qs('city');
      if (urlCity && city) {
        city.value = urlCity;
        this.setCity(urlCity);
      }
      const urlVibe = this.qs('vibe');
      if (urlVibe && vibe) vibe.value = urlVibe;
      const urlQ = this.qs('q');
      if (urlQ && search) search.value = urlQ;
      if (upcomingToggle && this.qs('past') === '1') upcomingToggle.checked = false;
      apply();
      return apply;
    }
  };

  window.PP = PP;
  document.addEventListener('DOMContentLoaded', () => {
    PP.initPageTheme();
    PP.initNav();
    PP.initReveal();
    PP.initDemoCartButtons();
    PP.initMailtoForms();
  });
})();
