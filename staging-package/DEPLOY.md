# Nightlife staging package

Additive WordPress package for the parent executor. This package does not deploy itself.

## Not done yet

Current staging theme templates and a fresh staging backup were not available here. Do not treat this as a verified native header, hero, or template integration. Do not upload it to staging until that backup is verified. Do not touch live.

## What the plugin does

`pp-nightlife/pp-nightlife.php` registers the `[pp_nightlife]` shortcode only. It does not create pages, menus, products, venue records, taxonomies, options, or cron jobs. It does not change Pool, Beach, or Yacht queries. Analytics stay off unless `ppn_2026_enable_analytics` is explicitly enabled later. Nightlife pages are marked noindex.

Suggested pages, created manually after the real template reference is in hand:

- `/nightlife/` with `[pp_nightlife]`
- `/nightlife/tao-nightclub/` with `[pp_nightlife venue="tao-nightclub"]`
- `/nightlife/marquee-nightclub/` with `[pp_nightlife venue="marquee-nightclub"]`
- `/nightlife/omnia-nightclub/` with `[pp_nightlife venue="omnia-nightclub"]`
- `/nightlife/hakkasan-nightclub/` with `[pp_nightlife venue="hakkasan-nightclub"]`
- `/nightlife/jewel-nightclub/` with `[pp_nightlife venue="jewel-nightclub"]`

Use the existing theme page template. Do not replace theme files with this package.

## Deploy only after backup

1. Confirm the fresh staging files and database backup exists, is restorable, and is stored outside the web root.
2. Copy only `staging-package/pp-nightlife/` to `wp-content/plugins/pp-nightlife/`.
3. Activate the plugin. Activation does not write content.
4. Create the six pages above only after the sanitized current template reference is applied. Record each new page ID.
5. Read the current Master before any sheet edit. `proposed-master-reconciliation.json` is a proposal, not a write. Do not reuse a dayclub row.

## Rollback

If no pages were created, remove `wp-content/plugins/pp-nightlife/` and deactivate the plugin. Nothing else was written.

If the six pages were created, trash only those recorded page IDs. Do not delete venue or product records, and do not restore a full database over later unrelated edits.

If Master cells were written, revert only the cells recorded at write time. If none were written, leave the sheet alone.

Do not use this rollback on live.

## Imagery and links

Only the two CC BY 4.0 OMNIA Nightclub photographs are included. TAO, Marquee, Hakkasan, and JEWEL have no photo. Partner flyers are not in this package. Calendar and event URLs stay on the audited `ppl` paths.
