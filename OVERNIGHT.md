# Pool Party preview — overnight log

## Shipped
- Hero locked: staggered “Sun’s out!” / “Who’s in?”, coral Book Now, yellow kicker + Home outline
- Venues: **190** from live CPT (was 52) — `a5c8779`
- Events: refreshed from live `product` catalog — **98** events, Booketing/SquadUp labeled — `82de567` (venues kept at 190)
- Advertise pitch + streaming banner live

## Live
- https://faccett66.github.io/poolparty-preview/
- https://faccett66.github.io/poolparty-preview/venues.html
- https://faccett66.github.io/poolparty-preview/events.html

## NDAL (separate)
- Showcase-ready: https://faccett66.github.io/neverdropalead-preview/
- Free-audit CTAs prominent; brand Never Drop A Lead only
- Stripe Payment Links: needs Frank auth
- Domain: deferred

## Still grinding
- None material on customer-facing pages after QA passes 1–4
- Known constraint: venue excerpts from `a5c8779` are still generic shells (do not regress 190 venues to rewrite)

## QA pass — 2026-09-16 06:23 ET
- Cities: fixed `count_hint` (atlantic-city/southampton were bare ints); retargeted 404 hubs (aruba/croatia/texas/amsterdam) → live venue pages; Goa name already corrected
- `cities.html`: “35 hubs” headline + density-sorted grid + honest venue/upcoming blurbs
- Homepage city grid: flagships + densest hubs (top 16 with real venue/event data), image fallback, `?v=43`
- `events.html` lead: **98** events / **22 upcoming** (Vegas week) honesty
- Contact lead enriched; FAQ catalog-size answer (190 venues / 98 events)
- Thin blog bodies expanded: `nyc-summer-club-guide`, `tao`
- Cache bust `site.js?v=41` sitewide
- Venues remain **190** (untouched)

## QA pass 2 — 2026-09-16 06:25 ET
- `city.html`: image fallback + `?v=43`; “Live venue page” CTA when hub has no live city URL
- `events.html` city filter: only cities present in catalog, sorted by upcoming/density with counts
- `venues.html` city filter: densest-first with venue counts
- Cache `site.js?v=42` on city/events/venues

## QA pass 3 — 2026-09-16 06:26 ET
- Retargeted 4 events that still used mismatched Vegas/Ibiza stock to city-matched local covers (Sydney/Dubai/France) when live featured media was missing
- Venues still **190**

## QA pass 4 — 2026-09-16 06:26 ET
- Advertise + cities meta: **35 hubs** (was stale “19 cities”)
- Amalfi city tile uses Italy live cover (was generic beach vibe stock)

## Status — morning checklist (2026-09-16 06:27 ET)
- Live: https://faccett66.github.io/poolparty-preview/ (cache `site.js?v=42`, city imgs `?v=43`)
- Venues **190** · Events **98** (22 upcoming, all Vegas) · Cities **35** hubs
- Commits tonight after inventory: `d4ff910` → `5febff1` → `b7a9c59` → `be0b6a6`

