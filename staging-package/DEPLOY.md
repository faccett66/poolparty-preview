# Nightlife staging install

Backup verified 6:33 PM EST is the gate for the parent executor. This package does not connect to staging or live.

Current UI to match: theme `poolparty` 1.0.0 and plugin `pp-2026` 0.8.3-leads-captcha. Nightlife uses that plugin's lean header, footer, `page-hero`, and event cards. It does not replace those files and does not call the events/venues hero rotator, so daytime photos stay on daytime pages.

## Install

1. Confirm the verified backup is still the one you can restore.
2. Copy `pp-nightlife/` to `wp-content/plugins/pp-nightlife/`.
3. `wp plugin activate pp-nightlife`
4. `sh staging-package/bin/install-pages.sh` from a checkout on the staging host, or run the same `wp post create` commands. Record every page ID.
5. Do not add these pages to the venue or product sync. They are ordinary pages, not `venue` or `product` records.

Pages:

| Path | Slug | Parent |
| --- | --- | --- |
| /nightlife/ | nightlife | none |
| /nightlife/tao-nightclub/ | tao-nightclub | nightlife |
| /nightlife/marquee-nightclub/ | marquee-nightclub | nightlife |
| /nightlife/omnia-nightclub/ | omnia-nightclub | nightlife |
| /nightlife/hakkasan-nightclub/ | hakkasan-nightclub | nightlife |
| /nightlife/jewel-nightclub/ | jewel-nightclub | nightlife |

## After upload

`php -l wp-content/plugins/pp-nightlife/pp-nightlife.php`

`wp eval 'echo function_exists("pp2026_lean_open") ? "lean-ok\n" : "lean-missing\n";'`

Then request each of the six paths and confirm:

- one h1
- body class `pp-nightlife`
- Book Now points at `/microsite/ppl/event/61/...`
- each guide's calendar button points at its own `/microsite/ppl/events/61/{id}/...` URL
- OMNIA shows the Commons credit and `CC BY 4.0`
- TAO, Marquee, Hakkasan, and JEWEL say no cleared photo and do not load the OMNIA file
- `/events/` still says pool, beach and yacht

Desktop Book Now uses the centered 800×600 `ppbook` window from `booking-popup.js`. Under 768px, and when the popup is blocked, the real link opens in a new tab.

## Rollback

Deactivate and delete `wp-content/plugins/pp-nightlife/`. Trash only the six recorded page IDs. Do not delete venue or product records. Do not restore the whole database over later edits. If the Master was not written, leave it alone.

## Master

`proposed-master-reconciliation.json` matches by nightclub name and partner venue id. It is not a sheet write. Do not use an old row number as the target.
