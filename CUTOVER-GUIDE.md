# Pool Party · live cutover guide

**Status:** planning / behind-the-scenes map — **do not execute DNS or WP theme flip until Phase 3 exit criteria are green.**  
**Preview (design + IA):** https://faccett66.github.io/poolparty-preview/  
**Live today:** https://poolparty.com (WordPress + Booketing + SquadUp)  
**Last updated:** 2026-09-17 · enriched from `LIVE-CONNECTED.md`

Goal: when we flip, the new front end is **fully functional** with **no holdups** — tickets buy, forms land, inventory stays true, legal pages work, music/dock OK. We keep the **existing money backends**; we do not invent a replacement ticketing stack on cutover day.

---

## How to read this

| Phase | What | When |
|-------|------|------|
| **0** | Access + ownership map | **Now** — blocks everything behind the scenes |
| **1** | Integration inventory (this doc + live probes) | **Now** — no customer-facing change |
| **2** | Wire preview → real backends (staging / soft launch) | After Phase 0 filled |
| **3** | Parallel run + go/no-go | Before any DNS / theme cut |
| **4** | Cutover day | Only when Phase 3 checklist is all ✅ |
| **5** | Post-cutover watch (24–72h) | Immediately after flip |

**Rule:** map and prove every money / lead path **before** the public switch. If a path is unproven, it stays on live WP or we delay the flip.

---

## Phase 0 — Access & ownership (Frank / operator — fill before coding)

Copy answers into `CUTOVER-FILL.md` (create when ready). Without these, Phase 2 guesses and cutover will stall.

### 0.1 Who controls what

| System | Owner (name) | Access Frank has today | Notes |
|--------|--------------|------------------------|-------|
| Domain / DNS (poolparty.com) | | ☐ none ☐ view ☐ edit | Registrar? Cloudflare? |
| Cloudflare / CDN | | ☐ none ☐ view ☐ edit | |
| WordPress admin | | ☐ none ☐ editor ☐ admin | Theme = `poolparty` |
| WooCommerce | | ☐ none ☐ view ☐ edit | Cart/checkout chrome |
| WP Event Manager / product catalog | | ☐ none ☐ view ☐ edit | Events as products |
| **SquadUp** (overlay checkout) | [[FILL]] | ☐ none ☐ view ☐ admin | Public `userId: **3438001**`; `#squadup-checkout`; also `squadup.com/events/{id}` |
| **Booketing** (microsite Book Now) | [[FILL]] | ☐ none ☐ view ☐ admin | Microsite **`ppl`**: `booketing.com/microsite/ppl/…` |
| **Spiagge.it** (beach Book Now) | [[FILL]] | ☐ none ☐ view ☐ admin | Third path: `widget.spiagge.it/.../it-sa-84010-one-fire-beach/` |
| Lead stack (Google Forms + Jotform + CF7) | [[FILL]] | ☐ none ☐ view ☐ edit | Canonical inbox TBD — Forms/Jotform dominate; CF7 scripts still load |
| CRM / email list (if any) | [[FILL]] | ☐ none ☐ view ☐ edit | Mailchimp-for-Woo present; tool name: [[FILL]] |
| Google Analytics / GTM | [[FILL]] | ☐ none ☐ view ☐ edit | **GTM-W2K9KB6** · **GA4 G-6RHWC2TFPZ** · tag **GT-PJ72PRK9** |
| Hosting / WP Rocket / backups | [[FILL]] | ☐ none ☐ view ☐ edit | Cloudflare + **GoDaddy Managed WP / MWC** (`x-gateway`, WPaaS) |

### 0.2 Credentials & handoff channels (never paste secrets into chat)

| Need | Where it will live | Ready? |
|------|--------------------|--------|
| WP admin URL + role for Page Builder / deploy partner | 1Password / shared vault | ☐ |
| SquadUp dashboard or embed keys (public `userId` already on site; need admin if we change mounts) | vault | ☐ |
| Booketing org / microsite admin | vault | ☐ |
| Staging subdomain or WP staging clone | e.g. `staging.poolparty.com` | ☐ |
| Form destination (CF7 → email / CRM / webhook) | documented | ☐ |
| Rollback contact (who can revert theme/DNS in &lt;15 min) | named human | ☐ |

### 0.3 Business rules to lock (one sentence each)

1. **Money path on day 1:** keep **Booketing + SquadUp + Spiagge.it** fulfillment (recommended) / replace with first-party Stripe (NOT recommended for v1 — cart shows GoDaddy Payments chrome only).  
2. **GA / ticket cut:** who gets paid when Booketing vs SquadUp vs Spiagge completes? [[FILL]]  
3. **Inventory source of truth after cutover:** live WP products / JSON API / hybrid. Public counts today: venues **190=190**; events preview **98** vs live `product` **2457** (not “active only”). [[FILL]] rule for publish subset.  
4. **Legal:** `/privacy/` + `/terms/` already **200**. Studio: add **301** from `/privacy-policy/` → `/privacy/` and `/terms-and-conditions/` → `/terms/` when WP unlocked (Frank approve).  
5. **Advertise / Contact:** lead stack = **Google Forms** (`1FAIpQLScQaIxp…`, popup `1FAIpQLSdNf5…`) + **Jotform** `251634016415449` + CF7 scripts. Canonical inbox: [[FILL]]. Preview Contact/Advertise now embed the same public forms.

---

## Phase 1 — Behind-the-scenes map (no public flip)

### 1.1 Live stack (public dig — confirmed)

```
Visitor → Cloudflare → GoDaddy Managed WP / WPaaS (theme poolparty)
                      ├─ Beaver Builder pages
                      ├─ WooCommerce (cart / account chrome; GoDaddy MWC Stripe/Poynt assets on cart)
                      ├─ Products as events (wp/v2/product ≈ 2457; preview curated 98)
                      ├─ Book Now → Booketing microsite ppl (off-site)
                      ├─ Book Now → SquadUp (userId 3438001 + squadup.com/events/{id})
                      ├─ Book Now → Spiagge.it beach widget (Italy / One Fire Beach)
                      └─ Leads → Google Forms + Jotform (+ CF7 scripts)
```

Preview today: static GitHub Pages mirror with **honest live handoffs** labeled Booketing / SquadUp / Spiagge / live site. Demo cart = quantity only, **no prices**. Contact/Advertise = **same public Google Forms + Jotform embeds as live** (not mailto demos).

### 1.2 Book path inventory (preview + live probe 2026-09-17)

| Provider | Preview `events.json` | Live events index (HTML) | Behavior |
|----------|----------------------|--------------------------|----------|
| **squadup** | ~61–63 | 8 popups / 7 unique IDs | Handoff to poolparty.com or `squadup.com/events/{id}`; sitewide `userId` **3438001** |
| **booketing** | ~35 | 19 unique microsite URLs | Direct `booketing.com/microsite/ppl/...` |
| **spiagge** | 2 overlap (One Fire Beach 236/240) | **13** popups → 1 widget URL | `widget.spiagge.it/.../it-sa-84010-one-fire-beach/` — see `data/BOOK-PATHS.md` |

**Inventory honesty:** venues **190 = live `wp/v2/venue` 190**. Events: preview **98** curated ≠ live **2457** products.

**Must stay working after cutover:** every Book Now either (a) opens the same proven Booketing/Spiagge URL, or (b) lands on a page that still mounts SquadUp with the same event IDs / `userId` 3438001.

### 1.3 Integration checklist (prove each row)

| # | Integration | How we prove it | Owner | Status |
|---|-------------|-----------------|-------|--------|
| A | Event list / product feed | Compare live WP `wp-json` / HTML vs `data/events.json` count + sample IDs | Page Builder | ☐ map |
| B | Venue + city hubs | Live scrape vs `venues.json` / `cities.json` | Page Builder | ☐ map |
| C | Booketing Book Now | Spot-check 10 URLs → 200 + ticket UI loads | Frank + PB | ☐ |
| D | SquadUp mount | Spot-check 10 live event pages → overlay opens, cart works | Frank + PB | ☐ |
| E | Contact form | Submit Google Form / Jotform test → Frank inbox within 5 min | Frank | ☐ prove |
| F | Advertise / partner form | Same (Advertising entry + Jotform) | Frank | ☐ prove |
| G | Privacy / Terms | `/privacy/` `/terms/` 200; **301** aliases `/privacy-policy/` `/terms-and-conditions/` | Studio + Frank | ☐ aliases still 404 |
| H | Cart / Checkout / Account | Decide: hide Woo chrome **or** keep WP routes (`/checkout/`→`/cart/` smell) | Frank | ☐ decide |
| I | Analytics (GTM/GA) | **GTM-W2K9KB6** + **G-6RHWC2TFPZ** fire on Book Now + form submit | Frank + PB | ☐ |
| J | Music dock / soft-nav | Preview behavior preserved on host | PB | ☐ |
| K | SEO / redirects | Old event/city URLs → new equivalents (301 map) | PB | ☐ |
| L | Backups + rollback | Snapshot WP + DNS TTL plan | Ops | ☐ |

### 1.4 URL / route map (draft)

| Live today | Preview | Cutover target |
|------------|---------|----------------|
| `/` | `index.html` | New home (theme or static host) |
| `/events/`, event products | `events.html`, `event.html?…` | Keep slug parity or 301 |
| venues / cities | `venues.html`, `cities.html`, `city.html` | Same |
| Booketing URLs | pass-through | **unchanged** |
| SquadUp overlays | labeled handoff to live | Embed or handoff — decide in Phase 2 |
| `/cart/`, `/checkout/`, `/my-account/` | demo shells | Hide **or** keep WP |
| `/privacy/`, `/terms/` | `privacy.html`, `terms.html` | Keep 200 on apex |
| `/privacy-policy/`, `/terms-and-conditions/` | → preview privacy/terms | **301** aliases (Studio when WP unlocked) |
| Contact / Advertise | `contact.html`, `advertise.html` | Same Google Forms + Jotform as live; CF7 TBD |

### 1.5 What we will **not** do on cutover day

- Replace SquadUp, Booketing, or Spiagge contracts  
- Invent ticket prices or inventory (or invent Spiagge event rows)  
- Flip DNS before Phase 3 go/no-go  
- Invent CRM destinations beyond live public forms  
- Claim first-party POS if money still settles off-platform  

---

## Phase 2 — Wire behind the scenes (still no apex flip)

Do this on **staging** or a WP child theme / soft-launch path that operators can hit without moving the public homepage.

### Step 2.1 — Choose host path (pick one)

| Option | Pros | Cons | Pick |
|--------|------|------|------|
| **A. WP theme swap** — new front end as WP theme/templates, keep plugins | Keeps CF7, SquadUp plugin, SEO plugins, same domain | Needs WP access + theme QA | ☐ |
| **B. Static front + WP API** — Pages/CDN for UI; WP remains API + forms | Clean preview → prod path | Need CORS, form proxy, SquadUp embed strategy | ☐ |
| **C. Hybrid** — static marketing + WP for event/ticket templates only | Incremental | Two systems to sync | ☐ |

**Recommendation:** **A or C** if SquadUp plugin must stay on same origin; **B** only if we keep Book Now as outbound handoffs (already works in preview).

### Step 2.2 — Inventory sync (no holdups on stale events)

1. Document live feed: `wp-json` product endpoints + any custom fields for `booketing` / SquadUp IDs.  
2. Automate refresh into preview `data/*.json` (already partially done via auto-refresh routine).  
3. Define SLA: inventory max age (e.g. ≤60 min) and who gets paged if sync fails.  
4. On staging, prove event count ±0 vs live for upcoming events.

### Step 2.3 — Money paths (prove, don’t redesign)

**Booketing**

1. Keep `book_url` as live Booketing links.  
2. Staging: 10 purchase-path dry runs (stop before pay if needed) — record pass/fail.  
3. Confirm fees / refunds copy still points to the right party.

**SquadUp**

1. Prefer **same-origin** mount (WP page with SquadUp plugin) over re-implementing embed.  
2. If front end is static: Book Now → live `poolparty.com/event/…` (handoff) **or** embed official SquadUp snippet with correct event IDs — **only with SquadUp admin confirmation**.  
3. Test: overlay opens, SMS/order question, cart, thank-you / email.

### Step 2.4 — Lead paths

1. Replace mailto with CF7 / webhook / CRM endpoint (same as live or better).  
2. Test Contact + Advertise end-to-end; save screenshots + message IDs.  
3. Optional: NDAL-style health watch on those two POSTs after cutover.

### Step 2.5 — Legal, cart chrome, analytics

1. Publish privacy + terms; 301 broken aliases → real pages.  
2. Either remove empty Woo cart/checkout loops from nav **or** wire real checkout (not demo).  
3. GTM: Book Now click, form submit, city filter — verify in Tag Assistant.

### Step 2.6 — Staging acceptance (exit Phase 2)

All must be ✅ before Phase 3:

- [ ] Staging URL shared with Frank  
- [ ] Upcoming events match live (± agreed tolerance)  
- [ ] 10/10 Booketing spots OK  
- [ ] 10/10 SquadUp spots OK  
- [ ] Contact + Advertise deliver  
- [ ] Privacy + Terms 200  
- [ ] Mobile + desktop Book Now smoke  
- [ ] Music dock / soft-nav no regressions  
- [ ] Rollback plan written (who / how / ETA)

---

## Phase 3 — Parallel run + go/no-go

1. Run staging for **≥48h** with real operators clicking Book Now.  
2. Diff inventory twice daily vs live WP.  
3. Freeze design changes 24h before cut (except P0 bugs).  
4. Go/no-go meeting checklist:

| Question | Yes / No |
|----------|----------|
| Phase 0 ownership table complete? | |
| Phase 2.6 all green? | |
| Rollback person online on cut day? | |
| DNS TTL lowered (if DNS cut)? | |
| Backup / WP snapshot taken? | |
| Support path for ticket failures (SquadUp/Booketing contacts)? | |

**No → delay. Do not “hope” on cut day.**

---

## Phase 4 — Cutover day (execute only when Phase 3 = go)

### T−24h

1. Final inventory sync.  
2. Announce internal war-room channel.  
3. Confirm SquadUp + Booketing status pages / contacts.  
4. Snapshot WP + export `data/*.json`.

### T−1h

1. Re-run Phase 2.6 smoke on staging.  
2. Disable nonessential deploys.  
3. Open monitoring tabs: homepage, events, one Booketing, one SquadUp, Contact.

### T0 — flip (one path only)

**If theme swap (Option A):** activate new theme / templates; purge WP Rocket + Cloudflare cache.  
**If DNS / Pages (Option B):** flip DNS or CF worker to new origin; keep WP for API/forms as designed.  
**If hybrid (Option C):** switch only agreed routes; leave ticket templates on WP.

### T+15m — must-pass smoke

1. `/` 200, hero + Book Now visible  
2. Events list loads; open 3 events  
3. One Booketing Book Now → ticket UI  
4. One SquadUp Book Now → checkout overlay  
5. Contact test submit → inbox  
6. Privacy + Terms 200  
7. No console-breaking JS on home/events  

**Any fail → rollback immediately (Phase 4b).**

### T+2h

1. Re-check inventory counts  
2. Spot-check city hubs  
3. Confirm GTM hits  
4. Frank sign-off or rollback  

### Phase 4b — Rollback

1. Revert theme **or** DNS to pre-cut snapshot.  
2. Purge caches.  
3. Re-run smoke on **old** live.  
4. Write incident note: what failed, which Phase 2 proof was wrong.

---

## Phase 5 — Post-cutover watch (24–72h)

| Watch | Cadence | Fail action |
|-------|---------|-------------|
| Homepage + events + privacy/terms | every 15–30 min day 1 | page / rollback if widespread |
| Booketing sample URLs | hourly day 1 | pause Booketing CTAs if provider down |
| SquadUp mount on 2 events | hourly day 1 | fall back to live handoff URL |
| Contact / Advertise inbox | every new submit | page Frank |
| Inventory sync job | each run | page if stale &gt; SLA |
| Search Console / 404 spike | daily | fix redirects |

Optional: add a Pool Party health routine (like SEC 4h) once host is stable.

---

## Behind-the-scenes work queue (do now — no flip)

Ordered so nothing blocks go-live later:

1. **Fill Phase 0 tables** (Frank) — access + money rules.  
2. **Create `CUTOVER-FILL.md`** with answers (no secrets in git; vault links only).  
3. **Complete integration rows A–L** with evidence links/screenshots.  
4. **301 legal aliases** `/privacy-policy/`→`/privacy/`, `/terms-and-conditions/`→`/terms/` (Studio when WP unlocked; Frank approve).  
5. **Decide Option A/B/C** host path.  
6. **Stand up staging** matching that option.  
7. **Confirm lead inbox** for Google Forms + Jotform (preview already embeds live forms); decide CF7 fate.  
8. **SquadUp strategy locked** (same-origin plugin vs labeled handoff).  
9. **Redirect map** old → new slugs.  
10. **Rollback drill** once on staging (practice revert).  
11. **Only then** schedule Phase 3 parallel run + Phase 4 date.

---

## Quick reference — preview vs live honesty

| Surface | Preview now | Required at live cutover |
|---------|-------------|---------------------------|
| Design / IA / music dock | Showcase-ready | Keep |
| Events / venues / cities | Synced mirror | Live feed or ≤SLA sync |
| Book Now | Labeled handoff | Proven Booketing + SquadUp |
| Cart / checkout | Demo shell | Real or hidden |
| Contact / Advertise | Live Google Forms + Jotform embeds | Proven inbox + decide CF7 fate |
| Account | localStorage mock | Real auth or hidden |
| Legal | Present on preview | 200 on apex |

---

## Related docs

- `README.md` — prototype honesty labels  
- `LIVE-CONNECTED.md` — public systems map (2026-09-17)  
- `RUN-2026-09-15.md` — earlier public dig  
- `data/BOOK-PATHS.md` — Spiagge / Booketing / SquadUp honesty  
- `OVERNIGHT.md` / `REFRESH.md` — inventory refresh notes  
- Preview: https://faccett66.github.io/poolparty-preview/

---

*When Frank drops Phase 0 details, update this guide’s Status line and tick the integration table — then start Phase 2 on staging only.*
