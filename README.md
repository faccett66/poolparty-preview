# Pool Party — deep static feature-mirror (prototype)

Summery, light, dayclub **eye candy** (champagne daylight, decluttered whitespace) modernization of [poolparty.com](https://poolparty.com/) for **Frank Accettulli** (21–35 party discovery — not dark club / not spa brochure).  
**GitHub Pages:** https://faccett66.github.io/poolparty-preview/  
**Local:** `/workspace/poolparty/index.html`

**Honest:** Book Now = live Booketing/SquadUp/Spiagge handoff. Demo cart has no real prices. No CATCH branding.

## Partnership note — POS / ticket cut

**Today (live):** Many “Book Now” paths hand off to venue ticketing (Booketing microsites; SquadUp overlays on PoolParty pages — including Liquid Pool and other dayclub inventory). When fulfillment completes off-platform, PoolParty may get **no GA ticket cut**.

**Goal (Frank):** PoolParty as **point of sale** with a **GA ticket cut**, not only a discovery/referral front.

**What this prototype does:** Labels every Book Now as a **live handoff**, ships a **demo cart/checkout shell** (quantity-only, **no invented prices**) so stakeholders can feel first-party POS chrome, and keeps real purchase links on the live stack.

---

## Feature checklist

| Feature | Status | Notes |
|--------|--------|--------|
| Multi-page IA (home, events, venues, event detail, cities/city, advertise, FAQs, blog, blog-post, contact, cart, checkout, account, privacy, terms) | **Prototype** | Shared `assets/css/site.css` + `assets/js/site.js` |
| Luxury dayclub visual system | **Prototype** | Champagne daylight, quieter eye candy, Fraunces/Outfit, venue photography in `assets/site/` |
| `data/events.json` 15+ events | **Live-sampled** | Real names/URLs/Booketing from poolparty.com scrape 2026-09-15 |
| `data/venues.json` 12+ venues | **Live-sampled** | wp-json venues + LV venues from event cards |
| `data/cities.json` 19 cities | **Live** | From pp-cities sitemap |
| City picker + localStorage filter | **Prototype** | Home → events/venues/city hubs |
| Search + city + vibe filters | **Prototype** | Client-side on events & venues |
| Book Now deep-links | **Live handoff** | Booketing or poolparty.com event URL; labeled clearly |
| Demo cart (localStorage) | **Prototype** | Quantity-only; **no prices** |
| Checkout shell | **Prototype** | No payments |
| Account mock login | **Prototype** | localStorage UI only — no auth backend |
| Advertise + Contact forms | **Live embeds** | Same public Google Forms + Jotform as poolparty.com |
| FAQs | **Prototype** | Adapted from live FAQ themes |
| Blog list + sample articles | **Prototype** | Live wp-json titles + 2 sample posts |
| SEC music tease | **Prototype** | Soft tease on **home only** |
| SquadUp / Booketing fulfillment | **Still needs live backend** | Not replaced |
| Real ticket inventory, pricing, GA cut POS | **Still needs backend / contracts** | Partnership work |
| CRM, CF7, email confirmations | **Partial** | Live Forms/Jotform wired; CF7 inbox + canonical lead owner still Frank |
| CATCH / NDAL branding | **Not included** | Per brief |

### Legend
- **Live** — data or link from production poolparty.com  
- **Prototype** — works in static HTML/JS  
- **Still needs backend** — cannot be honest without their stack / deals  

---

## Open in browser

1. **Pages (share with Frank):** https://faccett66.github.io/poolparty-preview/  
2. **Local file:** open `/workspace/poolparty/index.html` (or serve the folder over HTTP so `fetch` of JSON works — required for events/venues/cities grids).

```bash
cd /workspace/poolparty && python3 -m http.server 8765
# then http://127.0.0.1:8765/
```

---

## Honest limits

- Do **not** invent live ticket prices as real.  
- Do **not** claim SquadUp/Booketing were replaced.  
- Demo cart is layout / partnership conversation only.
