# Pool Party cutover — fill sheet (no secrets)

Copy to a private vault doc; leave this template in repo.  
**Date:** 2026-09-17 (public values from `LIVE-CONNECTED.md`; secrets stay in vault)

## Ownership (Phase 0.1)
- DNS / Cloudflare: Cloudflare confirmed on apex (`server: cloudflare`) — owner: [[FILL]] · access: [[FILL]]
- WordPress admin: theme `poolparty` · GoDaddy Managed WP / WPaaS signals — owner: [[FILL]] · access: [[FILL]]
- SquadUp: public `userId: **3438001**` · owner: [[FILL]] · access: [[FILL]]
- Booketing: microsite **`ppl`** (`booketing.com/microsite/ppl/…`) · owner: [[FILL]] · access: [[FILL]]
- Spiagge.it: One Fire Beach widget `it-sa-84010-one-fire-beach` · owner: [[FILL]] · keep/drop: [[FILL]]
- Forms / CRM: Google Forms + Jotform + CF7 (canonical inbox: [[FILL]]) · Mailchimp-for-Woo present · owner: [[FILL]]
- Analytics: **GTM-W2K9KB6** · **GA4 G-6RHWC2TFPZ** · Google tag **GT-PJ72PRK9** · owner: [[FILL]] · edit access: [[FILL]]
- Rollback person + phone/Slack: [[FILL]]

## Access ready (checkboxes)
- [ ] WP staging or admin for theme/deploy
- [ ] SquadUp confirm embed/handoff rules (`userId` 3438001 + event ID map)
- [ ] Booketing microsite `ppl` admin reachable
- [ ] Spiagge.it keep/drop + handoff decision
- [ ] Form destination documented (which Google Form / Jotform / CF7 is canonical)
- [ ] GTM/GA4 edit access confirmed
- [ ] Backup + rollback drill scheduled

## Known public IDs (no secrets)
| Item | Value | Source |
|------|-------|--------|
| SquadUp userId | `3438001` | live `window.squadup` |
| Booketing microsite | `ppl` | live Book Now URLs |
| Spiagge widget | `…/it-sa-84010-one-fire-beach/` | live events index |
| Google Form (embedded) | `1FAIpQLScQaIxpRGdZjxuz9bxgflWmfoeBzfB6h1IFXFz_avY0fY1qWw` | contact/advertise |
| Google Form (popup) | `1FAIpQLSdNf5-wJhxJrueOm87oQOa0ZLdb14kOHzAJ03RG-JSWlMiF1Q` | Popup Maker |
| Jotform | `251634016415449` | contact/advertise |
| GTM | `GTM-W2K9KB6` | live HTML |
| GA4 | `G-6RHWC2TFPZ` | live gtag |
| Google tag | `GT-PJ72PRK9` | live gtag |
| Venues | live 190 = preview 190 | wp-json |
| Events / products | preview 98 curated vs live product **2457** | wp-json |
| Cities | preview 35 vs live `pp-cities` 26 | taxonomy includes junk artist names |
| Legal working | `/privacy/` `/terms/` **200** | probe |
| Legal broken | `/privacy-policy/` `/terms-and-conditions/` **404** — need 301 | probe |
| Checkout smell | `/checkout/` **302→/cart/** | probe |
| Guest email cited | `info@poolparty.com` | FAQ HTML |

## Business rules (Phase 0.3)
1. Day-1 money path: keep Booketing + SquadUp + Spiagge (recommended) / other: [[FILL]]
2. Who gets paid (Booketing vs SquadUp vs Spiagge): [[FILL]]
3. Inventory source of truth / publish rule for 98 vs 2457: [[FILL]]
4. Advertise/Contact land in (canonical): [[FILL]] Google Forms / Jotform / CF7 / `info@poolparty.com`
5. MapMe keep/drop: [[FILL]] (`viewer.mapme.com/b643b0ab-…`)

## Host path choice (Phase 2.1)
- [ ] A WP theme swap
- [ ] B Static + WP API
- [ ] C Hybrid

## Evidence log (link screenshots / notes)
| Integration | Date | Result | Link |
|-------------|------|--------|------|
| Booketing ×10 | 2026-09-17 | 8/8 sample URLs HTTP 200 (public dig) | `LIVE-CONNECTED.md` |
| SquadUp ×10 | 2026-09-17 | Sampled event IDs 200; overlay mount sitewide | `LIVE-CONNECTED.md` |
| Spiagge | 2026-09-17 | 13 popups / widget 200; preview overlap 236+240 labeled | `data/BOOK-PATHS.md` |
| Contact | 2026-09-17 | Preview embeds live Google Forms + Jotform | preview `/contact.html` |
| Advertise | 2026-09-17 | Preview embeds live Google Forms + Jotform | preview `/advertise.html` |
| Privacy/Terms | 2026-09-17 | Preview pages solid; live aliases still 404 | Frank: approve 301s |
| Inbox proof (submit → arrive) | [[FILL]] | [[FILL]] | [[FILL]] |
