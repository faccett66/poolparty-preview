# PoolParty.com — Live Connected Systems Map

**Probed:** 2026-09-17 ~12:03 AM ET (America/New_York)  
**Live:** https://poolparty.com (public HTML / headers / `wp-json` only)  
**Preview:** https://faccett66.github.io/poolparty-preview/  
**Methods:** curl headers + HTML, `wp-json` totals, spot HTTP on Booketing / SquadUp / embeds  
**Constraints:** No admin access. No contracts. No invented backends. Status = what the public surface shows.

Companion digs: `RUN-2026-09-15.md`, `CUTOVER-GUIDE.md`.

---

## TLDR (Frank / Studio — Phase 0–1)

| # | Fact |
|---|------|
| 1 | Money paths still split: **Booketing** microsite popups + **SquadUp** (`squadup.com/events/{id}` and sitewide `#squadup-checkout` / `window.squadup`). |
| 2 | Preview inventory **venues 190 = live `wp/v2/venue` 190**. Events: preview **98** curated vs live **`product` 2457** (full catalog, not “active only”). Cities: preview **35** vs live **`pp-cities` 26** (taxonomy includes junk artist names). |
| 3 | Lead capture is messier than “CF7 only”: **Google Forms** + **Jotform** iframes dominate contact/advertise; CF7 + reCAPTCHA scripts still load. |
| 4 | Still broken: `/privacy-policy/` + `/terms-and-conditions/` **404**; `/checkout/` **302→/cart/**; `/privacy/` + `/terms/` **200**. |
| 5 | **NEW vs 2026-09-15 dig:** Jotform, Google Forms embeds, MapMe, Spiagge.it beach widget, GoDaddy Managed WP / Payments (Stripe/Poynt CSS+JS on cart), GA4 `G-6RHWC2TFPZ`, Google tag `GT-PJ72PRK9`, SquadUp popup IDs on events index. |

**Confirmed live connections counted below:** **28** (publicly evidenced).  
**Broken paths:** `/privacy-policy/` 404, `/terms-and-conditions/` 404, `/checkout/` → cart.

---

## Phase 0/1 checklist (crisp)

| ☐ | Action | Blocked on Frank? |
|---|--------|-------------------|
| ☐ | Confirm Booketing org / microsite `ppl` admin + who owns GA ticket cut | **Yes** |
| ☐ | Confirm SquadUp account for `userId: 3438001` + event ID map (140283–140286, 146519+) | **Yes** |
| ☐ | Decide which lead inbox is canonical: Google Forms vs Jotform vs CF7 vs `info@poolparty.com` | **Yes** |
| ☐ | Cloudflare / DNS / GoDaddy Managed WP access (headers show Cloudflare + GoDaddy MWC/`x-gateway`) | **Yes** |
| ☐ | GTM `GTM-W2K9KB6` + GA4 `G-6RHWC2TFPZ` edit access | **Yes** |
| ☐ | Fix legal aliases 301 → `/privacy/` `/terms/` (or recreate) before cutover | Studio can PR; Frank to approve on live |
| ☐ | Keep preview Book Now as **handoff only** until Phase 2 wires proven URLs/IDs | No |
| ☐ | Reconcile preview events (98) to live product subset / publish rules — do not treat 2457 as “active parties” | Frank + Studio |
| ☐ | Document Spiagge.it + MapMe: keep, drop, or re-embed on preview | Frank |
| ☐ | Do **not** assume first-party Stripe replaces ticketing (cart shows GoDaddy Payments chrome; Book Now does not use it) | — |

---

## Inventory vs preview (spot-check)

| Metric | Live (2026-09-17) | Preview | Notes |
|--------|-------------------|---------|-------|
| Venues | `wp/v2/venue` **X-WP-Total: 190** | **190** | Match |
| Products / events CPT | `wp/v2/product` **2457**; `wc/store/v1/products` **2457** | **98** events | Preview = curated/active handoff set, not full WP catalog |
| `event_listing` (WP Event Manager CPT) | **0** | — | Plugin present; listings empty via REST |
| Cities `pp-cities` | **26** | **35** | Live names include non-cities (“Cedric Gervais”, “Gryffin”) |
| `pp-venue` taxonomy | **44** | — | Separate from venue CPT |
| Booketing URLs (events index HTML) | **19** unique microsite URLs | ~35 booketing-tagged events in `events.json` | Preview tags; live page shows current week’s Booketing set |
| SquadUp event IDs (events index popups) | **7** IDs → all **HTTP 200** sampled | ~63 squadup-tagged | Live index shows current pass IDs |

---

## Connection inventory

Legend: **Status** = confirmed live / suspected / broken.  
Evidence is public-only. **Blocked on Frank?** = needs operator access or business decision.

### A. Ticketing / booking

| System | Status | Evidence | Preview today | Cutover needs | Blocked on Frank? |
|--------|--------|----------|---------------|---------------|-------------------|
| **Booketing** microsites | **Confirmed live** | Home/events Book Now → `openCenteredPopup('https://booketing.com/microsite/ppl/event/61/…')`. Events index: **19** unique URLs. Spot-check **5/5 home + 3/3 extra = 8/8 HTTP 200** (e.g. dj-lucky-lou, mike-attack, dj-mondo, cedric-gervais, don-diablo). | Handoff URLs in `events.json` (`book_provider: booketing`) | Preserve exact microsite URLs per event; re-scrape before flip | Yes — org/admin + fee split |
| **SquadUp** overlay mount | **Confirmed live** | Sitewide `window.squadup = { root: 'squadup-checkout', userId: [3438001], shoppingCartEnabled: true, reservedSeatingEnabled: true, orderQuestions: [SMS phone…] }`; `#squadup-checkout`; plugin `wp-squadup-data-grabber`. Present on LV Pass + Booketing event product pages. | Labels SquadUp handoff; no overlay mount | Mount same `userId` / event IDs or keep deep-link to live/SquadUp | Yes — SquadUp admin |
| **SquadUp.com event URLs** | **Confirmed live** | Pass-style Book Now → `https://squadup.com/events/{id}` (popup or href). Sampled **140283–140285, 146519, 146525 → 200** (e.g. redirects to `las-vegas-pool-party-pass--sept-19`). Events index: **8** squadup popups / **7** unique IDs. | Handoff to live or squadup.com | Keep ID map in data feed | Yes |
| **Spiagge.it** beach booking | **Confirmed live** | Events index: **13** popups to `https://widget.spiagge.it/stabilimenti-balneari/prenotazione/it-sa-84010-one-fire-beach/` (**HTTP 200**). Third booking vendor (Italy / One Fire Beach). | Not modeled as first-class provider in preview dig | Decide keep/drop; if keep, handoff pattern like Booketing | Yes |
| **WooCommerce add-to-cart** | **Confirmed live (chrome)** | Product event HTML includes Woo markers + `add-to-cart`; `/cart/` 200; `/my-account/` 200 login. Primary “Book Now” observed → Booketing/SquadUp/Spiagge, **not** native WC ticket checkout. | Demo cart quantity-only, no prices | Do not replace money path with demo cart | No for discovery; Frank if WC orders matter |
| **Eventbrite** | Not seen | No Eventbrite links in sampled home/events HTML (same as Sep 15). | — | — | — |

### B. Commerce / payments (public clues only)

| System | Status | Evidence | Preview today | Cutover needs | Blocked on Frank? |
|--------|--------|----------|---------------|---------------|-------------------|
| **WooCommerce** | **Confirmed live** | Plugin paths, robots Woo disallows, `/cart/` `/my-account/` 200; `/checkout/` **302 → `/cart/`**. Namespaces `wc/store`, `wc/v3`, etc. | Shell pages only | Keep URLs or redirect policy | Frank if shop used |
| **GoDaddy Payments / MWC Stripe** | **Suspected (cart chrome)** | Cart loads `mu-plugins/vendor/godaddy/mwc-core` Stripe settings CSS, Poynt `poynt.js`, wallets JS, `godaddy.com/sdk.js`. Home only **dns-prefetch** `js.stripe.com` (Rocket) — **no** public Stripe.js checkout on Book Now pages sampled. | No payments | Do **not** claim Stripe is the ticket processor | Frank — is GoDaddy Pay used for any WC SKUs? |
| **PayPal** | Not seen | No PayPal scripts/classes on sampled event/cart HTML. | — | — | — |

### C. CMS / plugins / hosting

| System | Status | Evidence | Preview today | Cutover needs | Blocked on Frank? |
|--------|--------|----------|---------------|---------------|-------------------|
| **WordPress** | **Confirmed live** | `wp-json` name “Pool Party”; `wp-login.php` 200; theme `wp-content/themes/poolparty`. | Static GH Pages | Content migration / parallel run | Yes — WP admin |
| **Beaver Builder** | **Confirmed live** | `bb-plugin`, `fl-builder` / `fl-row` / `fl-node-*` class soup. | Static HTML/CSS | Not porting BB | No |
| **WP Event Manager** | **Confirmed plugin / empty CPT** | Plugin path `wp-event-manager`; CPT `event_listing` REST total **0**. Events sold as Woo `product`. | N/A | Clarify if plugin still required | Frank |
| **Custom taxonomies** | **Confirmed live** | `pp-cities` (26), `pp-venue` (44), `pp-artist`. | cities/venues JSON | Clean city taxonomy (artists mis-filed) | Frank/editor |
| **Contact Form 7** | **Confirmed plugin; form markup present** | `contact-form-7` + `wpcf7-form` + reCAPTCHA script on contact; namespace `contact-form-7/v1`. Visible primary embeds are Google Forms / Jotform. | mailto demos | Map which CF7 forms still receive mail | Yes — inbox |
| **Popup Maker** | **Confirmed live** | `popmake` containers embedding Google Form iframe. | None | Replicate or drop popups | Frank |
| **WP Rocket 3.23.3.3** | **Confirmed live** | Generator meta; lazyload; long `cache-control: max-age=2678400`; HTML ~861–939 KB. | N/A (static) | Cache purge plan on cutover | Frank/host |
| **Cloudflare** | **Confirmed live** | `server: cloudflare`, `cf-ray`, `cf-cache-status: HIT`, `__cf_bm` cookie. Missing HSTS/CSP/Referrer-Policy/XFO on apex (still). | GH Pages CDN | DNS cutover + header policy | Yes |
| **GoDaddy Managed WP / WPaaS** | **Confirmed live (signals)** | REST: `wpaas/v1`, `godaddy/mwc/v1`; `img1.wsimg.com/signals/.../scc-c2.min.js`; `x-gateway-cache-*` headers. | N/A | Hosting access for theme/DNS | Yes |
| **Yoast SEO** | **Confirmed live** | `sitemap_index.xml` in robots; yoast refs. | Static SEO | Titles still city-locked (NYC/LV) — fix on live or new FE | Studio + Frank |
| **Smush / Site Kit / Jetpack / Code Snippets / CookieYes (`cky`)** | **Confirmed or namespaced** | Plugin paths and/or `wp-json` namespaces (`google-site-kit/v1`, `jetpack/v4`, `cky/v1`, `code-snippets/v1`, `wp-smush/v1`). Jetpack scripts not prominent in home HTML. | — | Inventory which stay post-cutover | Frank |
| **Accessibility OneTap** | **Confirmed live** | `accessibility-onetap` plugin assets; `wponetap.com`. | Optional | Parity decision | Frank |
| **Instagram Feed** | **Confirmed live** | `instagram-feed` / `sbi_` markers. | Optional | — | No |
| **Cookie Law Info + CookieYes** | **Confirmed live** | Plugin path + `cky` namespace / consent UI markers. | Preview has privacy/terms pages | Consent on new FE | Frank (legal) |

### D. Analytics / tags

| System | Status | Evidence | Preview today | Cutover needs | Blocked on Frank? |
|--------|--------|----------|---------------|---------------|-------------------|
| **GTM** | **Confirmed live** | `GTM-W2K9KB6` script + noscript iframe. | None / light | Install same container on new FE or keep via WP | Yes |
| **GA4** | **Confirmed live** | `gtag('config','G-6RHWC2TFPZ')`. | None | Measurement ID continuity | Yes |
| **Google tag / Ads** | **Confirmed live** | `gtag('config','GT-PJ72PRK9')`. | None | Confirm Ads vs floodlight use | Yes |
| **Google Site Kit** | **Confirmed live** | Generator `Site Kit by Google 1.187.0`; plugin path. | — | — | Frank |
| **Mailchimp for WooCommerce** | **Confirmed live** | Plugin JS + `chimpstatic.com/mcjs-connected/...`; REST `mailchimp-for-woocommerce/v1`. | None | Ecommerce/audience sync ownership | Yes |
| **Facebook Pixel** | **Not seen** | No `fbq('init')` / `fbevents.js` on home sample. Social **link** to Facebook page only. | — | — | — |

### E. Forms / CRM / email clues

| System | Status | Evidence | Preview today | Cutover needs | Blocked on Frank? |
|--------|--------|----------|---------------|---------------|-------------------|
| **Google Forms** | **Confirmed live** | Contact/advertise/home iframes: embed `1FAIpQLScQaIxp…` (**200**); popup `1FAIpQLSdNf5…` with page entry params; edit URLs also in HTML. | mailto demos | Choose canonical lead form; wire or keep embed | Yes |
| **Jotform** | **Confirmed live** | `https://form.jotform.com/251634016415449` iframe under “Let’s Plan Your Unforgettable…” (**HTTP 200**). | mailto | Same | Yes |
| **CF7 + reCAPTCHA** | **Confirmed scripts** | Loaded on contact; form class present — destination email **not** visible publicly. | mailto | Prove submission still works | Yes |
| **info@poolparty.com** | **Confirmed cited** | FAQ HTML contains `info@poolparty.com`. | Shown in preview copy | Keep monitored | Frank |
| **SquadUp SMS order question** | **Confirmed live** | `orderQuestions` phone for SMS updates in `window.squadup`. | N/A | Privacy copy must cover SMS | Frank/legal |

### F. Embeds / maps / social / fonts / misc CDN

| System | Status | Evidence | Preview today | Cutover needs | Blocked on Frank? |
|--------|--------|----------|---------------|---------------|-------------------|
| **MapMe** | **Confirmed live** | iframe `https://viewer.mapme.com/b643b0ab-8bdb-4a70-9397-de7588f8c251` (**200**). | Not ported | Keep/drop | Frank |
| **Spiagge.it** | (see Ticketing) | — | — | — | — |
| **Social links** | **Confirmed live** | Instagram `@poolpartycom`, TikTok `@poolpartycom`, Facebook `poolpartyworld`, YouTube `@poolpartyworld`, Twitter/X `@PoolPartyCom`. | Footer parity | Keep | No |
| **Fonts** | **Partial** | `fonts.gstatic.com` present; no `fonts.googleapis.com` stylesheet link on home sample (Rocket preload fonts feature on). | Self/hosted in preview assets | — | No |
| **docs.google.com** | (see Forms) | — | — | — | — |

### G. Security / hygiene (still relevant)

| Check | Status | Evidence | Cutover needs | Blocked on Frank? |
|-------|--------|----------|---------------|-------------------|
| `/privacy/` `/terms/` | **200** | Confirmed | Ship on apex | No |
| `/privacy-policy/` `/terms-and-conditions/` | **Broken 404** | Confirmed 2026-09-17 | 301 aliases | Frank approve |
| `/checkout/` | **Broken path smell** | 302 → `/cart/` | Label or fix Woo path | Frank |
| `/wp-json/wp/v2/users` | **Open** | 200; sample user `xenelsoft` / Nalini | Restrict enumeration | Frank/host |
| `xmlrpc.php` | **403** | Good | Keep blocked | — |
| Security headers | Weak | `x-content-type-options`, `x-xss-protection` only; **no** HSTS/CSP/Referrer/XFO | Cloudflare policy | Frank |

---

## Book path spot-checks (this run)

### Booketing (sample ≥5) — all 200

1. `…/61/1109/dj-lucky-lou?eventcode=EVE110900020260917` → **200**  
2. `…/61/1109/mike-attack?eventcode=EVE110900020260918` → **200**  
3. `…/61/1117/dj-mondo?eventcode=EVE111700020260917` → **200**  
4. `…/61/1119/dj-buza-the-wednesday-dip?eventcode=EVE111900020260916` → **200**  
5. `…/61/1119/dj-que?eventcode=EVE111900020260918` → **200**  
6. `…/61/1109/lavern?…` → **200**  
7. `…/61/1109/party-pupils-presents-yacht-house?…` → **200**  
8. `…/61/1113/don-diablo?…` → **200**  

### SquadUp event pages (overlay + outbound)

| Live event page | Overlay markers | Book Now target |
|-----------------|-----------------|-----------------|
| `/event/las-vegas-pool-party-pass-sept-19/` | `window.squadup` + `#squadup-checkout` (`userId` 3438001) | `https://squadup.com/events/140284` (**200**) |
| `/event/vegas-nightclub-access-pass-september-19/` | Same sitewide SquadUp mount | `https://squadup.com/events/140284` (same ID pattern family; verify per-date IDs in data) |
| `/event/cedric-gervais-at-omnia-dayclub-september-18/` | SquadUp mount **also** present | Booketing microsite (**200**) |
| `/event/don-diablo-at-tao-beach-september-19/` | SquadUp mount **also** present | Booketing microsite (**200**) |

**Note:** SquadUp config appears **sitewide** even when Book Now is Booketing — cutover UX must not assume “has `#squadup-checkout` ⇒ this event sells on SquadUp.”

### Legal

| URL | Status |
|-----|--------|
| `/privacy/` | 200 |
| `/terms/` | 200 |
| `/privacy-policy/` | **404** |
| `/terms-and-conditions/` | **404** |

---

## NEW vs `RUN-2026-09-15.md`

| Item | Sep 15 dig | This probe (2026-09-17) |
|------------------|-------------------------|
| Jotform embed | Not called out | **Confirmed** form `251634016415449` |
| Google Forms | Not called out | **Confirmed** multiple embeds + Popup Maker |
| MapMe viewer | Not called out | **Confirmed** map iframe |
| Spiagge.it | Not called out | **Confirmed** third Book Now vendor (13 popups on events) |
| GoDaddy MWC / WPaaS / Payments | Cloudflare+Rocket only | **Confirmed** hosting/payments signals + Stripe/Poynt assets on cart |
| GA4 / GT IDs | GTM only emphasized | **GTM-W2K9KB6** + **G-6RHWC2TFPZ** + **GT-PJ72PRK9** |
| SquadUp Book Now | `#ppevent` overlay emphasis | Also **direct** `squadup.com/events/{id}` popups/hrefs for passes |
| `pp-cities` count | Sitemap **19** cities | REST **26** (includes likely mis-tagged artists) |
| Venue REST | Not totals-matched to preview | **190 = preview 190** |
| Product REST total | Sitemap size only | **2457** products |
| Privacy/terms aliases | 404 | **Still 404** |
| Checkout → cart | 302 | **Still 302** |
| Users REST | Open | **Still open** |
| Home HTML weight | ~844 KB | ~**861 KB** |
| WP Rocket | 3.23.x | **3.23.3.3** |
| Site Kit | Present | **1.187.0** |

---

## Confirmed connection count (28)

1. Cloudflare  
2. GoDaddy Managed WP / WPaaS (`x-gateway`, wsimg signals)  
3. WordPress + theme `poolparty`  
4. Beaver Builder  
5. WooCommerce  
6. WP Event Manager (plugin; empty listings CPT)  
7. SquadUp (`userId` 3438001 + squadup.com events)  
8. Booketing (`booketing.com/microsite/ppl/…`)  
9. Spiagge.it widget  
10. GoDaddy Payments / MWC Stripe–Poynt (cart assets)  
11. Contact Form 7 (+ reCAPTCHA scripts)  
12. Google Forms  
13. Jotform  
14. Popup Maker  
15. GTM `GTM-W2K9KB6`  
16. GA4 `G-6RHWC2TFPZ`  
17. Google tag `GT-PJ72PRK9`  
18. Google Site Kit  
19. Mailchimp for WooCommerce / chimpstatic  
20. WP Rocket  
21. Yoast SEO  
22. Cookie Law Info / CookieYes  
23. Accessibility OneTap  
24. Instagram Feed  
25. MapMe  
26. Smush (plugin path)  
27. Social platforms (IG/TikTok/FB/YT/X) — outbound links  
28. `fonts.gstatic.com` (font CDN clue)

**Suspected / not counted as separate money backends:** Jetpack (namespace only), Code Snippets (namespace), first-party Stripe ticket checkout (not evidenced on Book Now).

**Broken paths to track:** `/privacy-policy/`, `/terms-and-conditions/`, `/checkout/`→`/cart/`.

---

## Honest limits

- No WP admin, SquadUp admin, Booketing admin, Cloudflare, or GTM container inspection.  
- No claim that GoDaddy Stripe processes pool tickets — only that payment assets appear on Woo cart chrome.  
- Product count **2457** ≠ “2457 parties this weekend”; preview **98** is the honest active handoff set until a publish-rule feed exists.  
- Contracts, margins, and “who gets paid” are **Frank Phase 0** — not inferable from HTML.

---

*Generated for cutover prep · public surface re-probe 2026-09-17 ~12:03 AM ET*
