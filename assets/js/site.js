/* PoolParty prototype — shared client logic (no backend) */
(function () {
  const CART_KEY = 'pp_demo_cart_v1';
  const CITY_KEY = 'pp_selected_city';

  const PP = {
    dataRoot: (document.body.dataset.dataRoot || 'data').replace(/\/$/, ''),
    assetRoot: (document.body.dataset.assetRoot || '').replace(/\/$/, ''),

    async loadJSON(name) {
      const url = `${this.dataRoot}/${name}.json`;
      const res = await fetch(url);
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
      const label = ev.book_label
        || (provider.includes('booketing') ? 'Book Now — Booketing'
          : provider.includes('squadup') ? 'Book Now — live checkout'
          : 'Book Now — live handoff');
      let noteProvider = 'live';
      if (provider.includes('booketing')) noteProvider = 'Booketing';
      else if (provider.includes('squadup')) noteProvider = 'SquadUp / Pool Party checkout';
      else if (provider) noteProvider = ev.book_provider;
      return { label, noteProvider, provider };
    },
    sortEventsUpcomingFirst(items) {
      const today = '2026-09-15';
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
      const book = ev.book_url || ev.live_url || '#';
      const meta = this.bookMeta(ev);
      const detailHref = opts.detailBase
        ? `${opts.detailBase}?id=${encodeURIComponent(ev.slug)}`
        : `event.html?id=${encodeURIComponent(ev.slug)}`;
      return `
      <article class="card" data-city="${this.esc(ev.city)}" data-vibe="${this.esc(ev.vibe)}">
        <div class="card-media">
          <img src="${this.esc(ev.image)}" alt="${this.esc(ev.title)}" loading="lazy" />
          <div class="badge-row">
            <span class="tag">${this.esc((ev.vibe || 'pool').toUpperCase())}</span>
            <span class="tag live">LIVE LINK</span>
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
      const href = opts.listMode ? `venues.html?city=${encodeURIComponent(v.city)}` : (v.live_url || '#');
      return `
      <article class="card" data-city="${this.esc(v.city)}" data-vibe="${this.esc(v.vibe)}">
        <div class="card-media">
          <img src="${this.esc(v.image)}" alt="${this.esc(v.name)}" loading="lazy" />
          <div class="badge-row">
            <span class="tag">${this.esc((v.vibe || 'pool').toUpperCase())}</span>
            <span class="tag live">LIVE</span>
          </div>
        </div>
        <div class="card-body">
          <h3>${this.esc(v.name)}</h3>
          <div class="card-meta">
            <span>${this.esc(v.city_name || this.cityName(opts.cities, v.city))}</span>
          </div>
          <p style="font-size:.88rem;color:var(--mist);font-weight:300">${this.esc(v.excerpt || '')}</p>
          <div class="card-actions">
            <a class="btn btn-primary btn-sm" href="${this.esc(v.live_url)}" target="_blank" rel="noopener">View on live site</a>
            <a class="btn btn-ghost btn-sm" href="events.html?city=${encodeURIComponent(v.city)}">Events in city</a>
          </div>
        </div>
      </article>`;
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

    bindFilters({ grid, search, city, vibe, items, render }) {
      const apply = () => {
        const q = (search?.value || '').toLowerCase().trim();
        const c = city?.value || '';
        const v = vibe?.value || '';
        let filtered = items.filter(it => {
          if (c && it.city !== c) return false;
          if (v && it.vibe !== v) return false;
          if (q) {
            const hay = `${it.title || it.name || ''} ${it.venue || ''} ${it.city || ''} ${it.excerpt || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
        // Events with dates: upcoming-first
        if (filtered.length && filtered[0] && filtered[0].date !== undefined) {
          filtered = this.sortEventsUpcomingFirst(filtered);
        }
        grid.innerHTML = filtered.length
          ? filtered.map(render).join('')
          : `<div class="empty-state">No matches. Try another city or vibe.</div>`;
        const count = document.querySelector('[data-result-count]');
        if (count) count.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
      };
      [search, city, vibe].forEach(el => el && el.addEventListener('input', apply));
      [search, city, vibe].forEach(el => el && el.addEventListener('change', apply));
      // URL / stored city
      const urlCity = this.qs('city') || this.getCity();
      if (urlCity && city) {
        city.value = urlCity;
        if (urlCity) this.setCity(urlCity);
      }
      const urlVibe = this.qs('vibe');
      if (urlVibe && vibe) vibe.value = urlVibe;
      const urlQ = this.qs('q');
      if (urlQ && search) search.value = urlQ;
      apply();
      return apply;
    }
  };

  window.PP = PP;
  document.addEventListener('DOMContentLoaded', () => {
    PP.initNav();
    PP.initReveal();
    PP.initDemoCartButtons();
    PP.initMailtoForms();
  });
})();
