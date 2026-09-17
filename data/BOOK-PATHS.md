# Book path honesty (public scrape)

**Probed:** 2026-09-17 (from live `/events/` HTML)  
**Companion:** `LIVE-CONNECTED.md`

## Providers seen on live Book Now

| Provider | Count on live events index | Pattern |
|----------|----------------------------|---------|
| Booketing | 19 unique microsite URLs | `booketing.com/microsite/ppl/…` |
| SquadUp | 8 popups / 7 unique IDs | `squadup.com/events/{id}` + sitewide `userId` **3438001** |
| **Spiagge.it** | **13** popups (1 unique URL) | `widget.spiagge.it/.../it-sa-84010-one-fire-beach/` |

## Spiagge slugs on live index (do not invent extras in preview)

one-fire-beach-the-amalfi-escape-229, one-fire-beach-the-amalfi-escape-230, one-fire-beach-the-amalfi-escape-231, one-fire-beach-the-amalfi-escape-232, one-fire-beach-the-amalfi-escape-233, one-fire-beach-the-amalfi-escape-234, one-fire-beach-the-amalfi-escape-235, one-fire-beach-the-amalfi-escape-236, one-fire-beach-the-amalfi-escape-237, one-fire-beach-the-amalfi-escape-238, one-fire-beach-the-amalfi-escape-239, one-fire-beach-the-amalfi-escape-240, one-fire-beach-the-amalfi-escape-241

**Widget URL:** `https://widget.spiagge.it/stabilimenti-balneari/prenotazione/it-sa-84010-one-fire-beach/`

**Preview overlap updated in `events.json`:** one-fire-beach-the-amalfi-escape-236, one-fire-beach-the-amalfi-escape-240

Preview remains a curated **98**-event handoff set vs live **2457** products — missing Spiagge date rows stay off the preview calendar until a publish-rule feed includes them.
