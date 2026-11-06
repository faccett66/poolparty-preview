#!/bin/sh
# Create the six Nightlife pages. Run on the staging host after the backup is verified.
# Refuses https://poolparty.com. Does not write the Master sheet.
set -eu
home=$(wp option get home)
case "$home" in
  https://poolparty.com|https://poolparty.com/|https://www.poolparty.com|https://www.poolparty.com/)
    echo "Refusing to run against live: $home" >&2
    exit 1
    ;;
esac
wp plugin is-active pp-nightlife
ensure() {
  name="$1"
  title="$2"
  parent="$3"
  id=$(wp post list --post_type=page --name="$name" --post_parent="$parent" --field=ID --posts_per_page=1)
  if [ -z "$id" ]; then
    id=$(wp post create --post_type=page --post_status=publish --post_name="$name" --post_title="$title" --post_parent="$parent" --post_content='' --porcelain)
  fi
  printf '%s %s\n' "$name" "$id"
}
parent=$(ensure nightlife Nightlife 0 | awk '{print $2}')
echo "nightlife $parent"
ensure tao-nightclub "TAO Nightclub" "$parent"
ensure marquee-nightclub "Marquee Nightclub" "$parent"
ensure omnia-nightclub "OMNIA Nightclub" "$parent"
ensure hakkasan-nightclub "Hakkasan Nightclub" "$parent"
ensure jewel-nightclub "JEWEL Nightclub" "$parent"
