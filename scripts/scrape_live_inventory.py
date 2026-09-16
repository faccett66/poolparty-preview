#!/usr/bin/env python3
"""Scrape poolparty.com public wp-json into preview events.json / venues.json."""
from __future__ import annotations

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace/poolparty")
DATA = ROOT / "data"
SITE_IMGS = sorted(
    str(p.relative_to(ROOT))
    for p in (ROOT / "assets" / "site").glob("*")
    if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
)

UA = "PoolPartyPreviewBot/1.0 (+static feature-mirror; polite; contact faccett66@gmail.com)"
BASE = "https://poolparty.com/wp-json/wp/v2"
SLEEP = 0.35

# Preview "now" for upcoming-first selection (America/New_York week of Sep 15, 2026)
TODAY = "2026-09-16"

# Caps per cities.json slug — oversample flagships; build_events keeps upcoming first
CITY_CAPS = {
    "las-vegas": 40,
    "miami": 30,
    "dubai": 16,
    "new-york": 16,
    "spain": 14,
    "italy": 14,
    "amalfi-coast": 12,
    "atlantic-city": 10,
    "los-angeles": 8,
    "california": 8,
    "phuket": 8,
    "bali": 8,
    "france": 8,
    "fort-lauderdale": 8,
    "sydney": 6,
    "arizona": 6,
    "budapest": 5,
    "india": 4,
    "southampton": 4,
}

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7, "aug": 8,
    "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}


def fetch_json(url: str, retries: int = 3):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=45) as resp:
                headers = {k.lower(): v for k, v in resp.headers.items()}
                body = resp.read()
                data = json.loads(body.decode("utf-8", errors="replace"))
                return data, headers
        except Exception as e:
            last = e
            time.sleep(SLEEP * (i + 2))
    raise last


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8", errors="replace")


def strip_html(s: str) -> str:
    s = re.sub(r"<script[\s\S]*?</script>", " ", s or "", flags=re.I)
    s = re.sub(r"<style[\s\S]*?</style>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    return html.unescape(re.sub(r"\s+", " ", s)).strip()


def detect_vibe(title: str, text: str) -> str:
    hay = f"{title} {text}".lower()
    if re.search(r"\b(yacht|boat|cruise)\b", hay):
        return "yacht"
    if re.search(r"\b(beach club|beach|oceanfront|sand)\b", hay):
        return "beach"
    if re.search(r"\b(dayclub|day club|encore beach|tao beach|liv beach)\b", hay):
        return "dayclub"
    if re.search(r"\b(pass|access pass|pool party pass)\b", hay):
        return "pass"
    if re.search(r"\b(rooftop|pool)\b", hay):
        return "pool"
    return "pool"


def parse_event_date(title: str, content: str, fallback_iso: str) -> str:
    hay = f"{title} {content}"
    # Month Day, Year or Month Day Year
    m = re.search(
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December|"
        r"Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*)(\d{4})?\b",
        hay,
        re.I,
    )
    if m:
        mon = MONTHS[m.group(1).lower()]
        day = int(m.group(2))
        year = int(m.group(3)) if m.group(3) else 2026
        try:
            return f"{year:04d}-{mon:02d}-{day:02d}"
        except Exception:
            pass
    # ISO-ish in text
    m2 = re.search(r"\b(20\d{2})-(\d{2})-(\d{2})\b", hay)
    if m2:
        return f"{m2.group(1)}-{m2.group(2)}-{m2.group(3)}"
    # fallback: WP post date (YYYY-MM-DD)
    if fallback_iso and len(fallback_iso) >= 10:
        return fallback_iso[:10]
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def detect_book(content_html: str, live_url: str):
    links = re.findall(r"""href=["']([^"']+)["']""", content_html or "", flags=re.I)
    booketing = next((u for u in links if "booketing.com" in u.lower()), None)
    squadup = next((u for u in links if "squadup.com" in u.lower()), None)
    if booketing:
        return {
            "book_url": booketing,
            "book_provider": "booketing",
            "book_label": "Book Now — Booketing",
            "booketing": booketing,
        }
    if squadup:
        return {
            "book_url": squadup,
            "book_provider": "squadup",
            "book_label": "Book Now — live checkout",
            "booketing": None,
        }
    # On-site product pages typically mount SquadUp / #ppevent
    return {
        "book_url": live_url,
        "book_provider": "squadup",
        "book_label": "Book on Pool Party",
        "booketing": None,
    }


def guess_venue(title: str, text: str) -> str:
    # Patterns: "at The Pool at X", "at Venue", "– Venue"
    for pat in [
        r"\bat\s+The\s+Pool\s+at\s+([A-Z][^.;\n]{2,60})",
        r"\bat\s+([A-Z][A-Za-z0-9'&.\- ]{2,50}(?:Resort|Hotel|Club|Beach|Pool|Casino|Yacht|Marina|Palace|Tower))",
        r"\bat\s+([A-Z][A-Za-z0-9'&.\- ]{2,40})\b",
    ]:
        m = re.search(pat, text)
        if m:
            v = m.group(1).strip(" -–—,.")
            if len(v) > 3 and "Friday" not in v and "Saturday" not in v:
                return v[:80]
    # Title before em-dash / hyphen often event; after may be venue
    parts = re.split(r"\s+[–—|]\s+", title)
    if len(parts) >= 2 and len(parts[-1]) < 60:
        return parts[-1].strip()[:80]
    return title[:60]


def infer_venue_city(name: str, text: str, city_slugs: list[str], city_names: dict[str, str]) -> str | None:
    hay = f"{name} {text}".lower()
    # Prefer longer / more specific names first
    ordered = sorted(city_slugs, key=lambda s: (-len(city_names.get(s, s)), s))
    # Special aliases
    aliases = {
        "las-vegas": ["las vegas", "vegas", "strip"],
        "new-york": ["new york", "nyc", "brooklyn", "manhattan"],
        "los-angeles": ["los angeles", " l.a.", " la ", "hollywood"],
        "amalfi-coast": ["amalfi"],
        "fort-lauderdale": ["fort lauderdale", "ft lauderdale"],
        "spain": ["ibiza", "marbella", "barcelona", "spain"],
        "italy": ["italy", "positano", "capri", "rome", "milan", "tuscany"],
        "dubai": ["dubai", "jumeirah", "marina dubai"],
        "miami": ["miami", "south beach", "wynwood"],
        "arizona": ["arizona", "scottsdale", "phoenix"],
        "california": ["california", "san diego", "palm springs"],
        "atlantic-city": ["atlantic city"],
        "india": ["india", "goa", "mumbai", "delhi", "lucknow"],
        "france": ["france", "cannes", "nice", "paris", "riviera"],
        "phuket": ["phuket", "thailand"],
        "bali": ["bali", "canggu", "seminyak"],
        "sydney": ["sydney", "australia"],
        "budapest": ["budapest", "hungary"],
        "southampton": ["southampton", "hamptons"],
    }
    for slug in ordered:
        needles = aliases.get(slug, [city_names.get(slug, slug).lower(), slug.replace("-", " ")])
        for n in needles:
            n = n.strip().lower()
            if len(n) >= 3 and n in hay:
                return slug
    return None


def load_city_map():
    cities = json.loads((DATA / "cities.json").read_text())["cities"]
    # Fetch live taxonomy for id→slug
    terms, _ = fetch_json(f"{BASE}/pp-cities?per_page=100")
    time.sleep(SLEEP)
    id_to_slug = {}
    allowed = {c["slug"] for c in cities}
    name_by_slug = {c["slug"]: c["name"] for c in cities}
    for t in terms:
        slug = t.get("slug")
        if slug in allowed:
            id_to_slug[t["id"]] = slug
    return cities, id_to_slug, name_by_slug, allowed


def best_media_url(media_obj):
    if not isinstance(media_obj, dict):
        return None
    sizes = (media_obj.get("media_details") or {}).get("sizes") or {}
    for key in ("medium_large", "large", "woocommerce_single", "full"):
        if key in sizes and sizes[key].get("source_url"):
            return sizes[key]["source_url"]
    return media_obj.get("source_url")


def fetch_city_products(city_id: int, city_slug: str, cap: int):
    out = []
    page = 1
    per_page = 20
    while len(out) < cap:
        need = min(per_page, cap - len(out))
        url = (
            f"{BASE}/product?pp-cities={city_id}&per_page={need}&page={page}"
            f"&orderby=date&order=desc&_embed=1"
        )
        try:
            data, headers = fetch_json(url)
        except Exception as e:
            print(f"  ! {city_slug} page {page} failed: {e}")
            break
        if not data:
            break
        out.extend(data)
        total_pages = int(headers.get("x-wp-totalpages", "1") or 1)
        print(f"  {city_slug}: page {page}/{total_pages} got {len(data)} (have {len(out)})")
        if page >= total_pages or len(data) < need:
            break
        page += 1
        time.sleep(SLEEP)
    return out[:cap]


def collect_booketing_from_html():
    """Map loose title tokens → booketing URL from public HTML pages."""
    mapping = {}
    for path in ["/", "/events/", "/pp-cities/las-vegas/"]:
        try:
            html_text = fetch_text("https://poolparty.com" + path)
            time.sleep(SLEEP)
        except Exception as e:
            print("html scrape fail", path, e)
            continue
        for m in re.finditer(r"""https?://(?:www\.)?booketing\.com[^"'\\\s<>]+""", html_text, re.I):
            url = m.group(0).rstrip(").,;")
            # slug-ish last path segment
            seg = urllib.parse.urlparse(url).path.rstrip("/").split("/")[-1]
            if seg:
                mapping[seg.lower()] = url
        print(f"  booketing URLs from {path}: running total {len(mapping)}")
    return mapping


def match_booketing(slug: str, title: str, booketing_map: dict) -> str | None:
    slug_l = slug.lower()
    title_l = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    for key, url in booketing_map.items():
        if key in slug_l or key in title_l:
            return url
        # token overlap
        key_toks = set(key.split("-"))
        slug_toks = set(slug_l.split("-"))
        if len(key_toks) >= 2 and len(key_toks & slug_toks) >= 2:
            return url
    return None


def build_events(products_by_city, booketing_map, name_by_slug):
    events = []
    seen = set()
    img_i = 0
    for city_slug, products in products_by_city.items():
        for p in products:
            slug = p.get("slug") or f"product-{p.get('id')}"
            if slug in seen:
                continue
            # Prefer the requested city; if multi-tagged keep this city bucket
            title = strip_html((p.get("title") or {}).get("rendered") or slug)
            content_html = (p.get("content") or {}).get("rendered") or ""
            excerpt = strip_html((p.get("excerpt") or {}).get("rendered") or "")
            text = strip_html(content_html) or excerpt
            live_url = p.get("link") or f"https://poolparty.com/event/{slug}/"
            book = detect_book(content_html, live_url)
            # Enrich booketing from HTML map if content lacked it
            if book["book_provider"] != "booketing":
                bt = match_booketing(slug, title, booketing_map)
                if bt:
                    book = {
                        "book_url": bt,
                        "book_provider": "booketing",
                        "book_label": "Book Now — Booketing",
                        "booketing": bt,
                    }
            date = parse_event_date(title, text, p.get("date") or p.get("modified") or "")
            vibe = detect_vibe(title, text)
            venue = guess_venue(title, text)
            emb = p.get("_embedded") or {}
            media = (emb.get("wp:featuredmedia") or [None])[0]
            remote = best_media_url(media) if media else None
            if remote:
                image = remote
            else:
                image = SITE_IMGS[img_i % len(SITE_IMGS)] if SITE_IMGS else "assets/site/feat-encore-pool.jpg"
                img_i += 1
            eid = f"ev-{len(events)+1:03d}"
            events.append({
                "id": eid,
                "slug": slug,
                "title": title,
                "city": city_slug,
                "venue": venue,
                "vibe": vibe,
                "date": date,
                "booketing": book.get("booketing"),
                "live_url": live_url,
                "image": image,
                "source": "live",
                "demo": False,
                "book_url": book["book_url"],
                "book_provider": book["book_provider"],
                "book_label": book["book_label"],
                "ticket_tiers": [
                    {"id": "ga", "label": "General Admission (DEMO layout)", "demo": True},
                    {"id": "cabana", "label": "Cabana / VIP interest (DEMO layout)", "demo": True},
                ],
            })
            seen.add(slug)
    # Prefer upcoming-first; keep a DIVERSE past catalog so city hubs stay browsable.
    # Never invent upcoming — empty cities stay empty of near-term dates.
    def sort_key(e):
        d = e.get("date") or "9999"
        return (0 if d >= TODAY else 1, d, e.get("title") or "")
    events.sort(key=sort_key)
    upcoming = [e for e in events if (e.get("date") or "") >= TODAY]
    past = [e for e in events if (e.get("date") or "") < TODAY]
    past.sort(key=lambda e: e.get("date") or "", reverse=True)
    # Per-city past caps — flagships denser; thin hubs still get a few PAST rows
    past_city_caps = {
        "las-vegas": 18, "miami": 14, "dubai": 10, "new-york": 8, "spain": 8,
        "italy": 10, "amalfi-coast": 6, "atlantic-city": 6, "los-angeles": 4,
        "california": 4, "phuket": 5, "bali": 5, "france": 5, "fort-lauderdale": 5,
        "sydney": 4, "arizona": 4, "budapest": 3, "india": 3, "southampton": 2,
    }
    from collections import defaultdict
    past_by = defaultdict(list)
    for e in past:
        past_by[e["city"]].append(e)
    # Round-robin past picks so thin hubs (France, Amalfi, Sydney…) aren’t
    # wiped by Vegas/Miami’s newer past dates when we soft-cap total size.
    buckets = {}
    for city, rows in past_by.items():
        cap = past_city_caps.get(city, 4)
        buckets[city] = rows[:cap]
    selected_past = []
    total_target = 110
    room = max(0, total_target - len(upcoming))
    idx = 0
    while len(selected_past) < room and buckets:
        progressed = False
        for city in list(buckets.keys()):
            if len(selected_past) >= room:
                break
            rows = buckets[city]
            if idx < len(rows):
                selected_past.append(rows[idx])
                progressed = True
            else:
                del buckets[city]
        if not progressed:
            break
        idx += 1
    events = upcoming + selected_past
    events.sort(key=sort_key)
    for i, e in enumerate(events, 1):
        e["id"] = f"ev-{i:03d}"
    print(f"  selection: {len(upcoming)} upcoming + {len(selected_past)} past = {len(events)}")
    print(f"  past cities: {dict(__import__('collections').Counter(e['city'] for e in selected_past))}")
    return events


def fetch_venues(allowed, name_by_slug, target=50):
    venues = []
    page = 1
    per_page = 20
    img_i = 0
    while len(venues) < target + 20:  # oversample then filter
        url = f"{BASE}/venue?per_page={per_page}&page={page}&orderby=date&order=desc&_embed=1"
        try:
            data, headers = fetch_json(url)
        except Exception as e:
            print("venue page fail", page, e)
            break
        if not data:
            break
        for v in data:
            slug = v.get("slug") or f"venue-{v.get('id')}"
            name = strip_html((v.get("title") or {}).get("rendered") or slug)
            content_html = (v.get("content") or {}).get("rendered") or ""
            text = strip_html(content_html)
            yh = v.get("yoast_head_json") or {}
            og = yh.get("og_description") or ""
            city = infer_venue_city(name, f"{text} {og}", list(allowed), name_by_slug)
            if not city:
                # park unmapped with skip — try Tampa etc only if we map; else skip
                continue
            live_url = v.get("link") or f"https://poolparty.com/venue/{slug}/"
            emb = v.get("_embedded") or {}
            media = (emb.get("wp:featuredmedia") or [{}])[0]
            remote = best_media_url(media) if isinstance(media, dict) else None
            # Prefer live featured media for venue accuracy; fall back to local pool only if missing
            if remote:
                image = remote
            else:
                image = SITE_IMGS[img_i % len(SITE_IMGS)] if SITE_IMGS else "assets/site/feat-encore-pool.jpg"
                img_i += 1
            vibe = detect_vibe(name, text)
            excerpt = (og or text)[:160]
            venues.append({
                "id": f"vn-{len(venues)+1:03d}",
                "slug": slug,
                "name": name,
                "city": city,
                "city_name": name_by_slug.get(city, city),
                "vibe": vibe,
                "live_url": live_url,
                "image": image,
                "source": "live",
                "excerpt": excerpt,
            })
        total_pages = int(headers.get("x-wp-totalpages", "1") or 1)
        print(f"venues page {page}/{total_pages} mapped so far {len(venues)}")
        if page >= total_pages or len(venues) >= target + 20:
            break
        page += 1
        time.sleep(SLEEP)
    # Dedup by slug, diversify cities
    by_slug = {}
    for v in venues:
        by_slug[v["slug"]] = v
    venues = list(by_slug.values())
    # Ensure city diversity: take up to N per city then fill
    per_city = defaultdict(list)
    for v in venues:
        per_city[v["city"]].append(v)
    selected = []
    # Round-robin prefer flagship
    priority = [
        "las-vegas", "miami", "dubai", "spain", "new-york", "los-angeles",
        "amalfi-coast", "italy", "bali", "phuket", "atlantic-city", "france",
        "budapest", "fort-lauderdale", "sydney", "arizona", "california",
        "india", "southampton",
    ]
    caps = {c: 6 for c in priority}
    for c in ("las-vegas", "miami", "dubai", "spain", "new-york"):
        caps[c] = 8
    for c in priority:
        selected.extend(per_city.get(c, [])[: caps.get(c, 4)])
    # fill to ≥40
    if len(selected) < 40:
        have = {v["slug"] for v in selected}
        for v in venues:
            if v["slug"] not in have:
                selected.append(v)
                have.add(v["slug"])
            if len(selected) >= 45:
                break
    for i, v in enumerate(selected, 1):
        v["id"] = f"vn-{i:03d}"
    return selected[:55]


def main():
    print("Loading city map…")
    cities, id_to_slug, name_by_slug, allowed = load_city_map()
    print(f"Mapped {len(id_to_slug)} city term IDs")

    print("Collecting Booketing URLs from public HTML…")
    booketing_map = collect_booketing_from_html()

    products_by_city = {}
    # Reverse: slug → id
    slug_to_id = {slug: tid for tid, slug in id_to_slug.items()}
    for slug, cap in CITY_CAPS.items():
        tid = slug_to_id.get(slug)
        if not tid:
            print(f"skip unmapped slug {slug}")
            continue
        print(f"Fetching products for {slug} (id={tid}, cap={cap})…")
        products_by_city[slug] = fetch_city_products(tid, slug, cap)
        time.sleep(SLEEP)

    events = build_events(products_by_city, booketing_map, name_by_slug)
    print(f"Built {len(events)} events")
    print("City breakdown:", dict(Counter(e["city"] for e in events)))
    print("Book providers:", dict(Counter(e["book_provider"] for e in events)))

    print("Fetching venues…")
    venues = fetch_venues(allowed, name_by_slug, target=45)
    print(f"Built {len(venues)} venues")
    print("Venue cities:", dict(Counter(v["city"] for v in venues)))

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    events_doc = {
        "generated": now,
        "source": "poolparty.com",
        "note": "Static feature-mirror sampled 2026-09-15 from public wp-json product + HTML Booketing links. Upcoming-first. Book Now is a live handoff (Booketing or SquadUp/on-site). No invented prices. Not a replacement for SquadUp/Booketing.",
        "events": events,
    }
    venues_doc = {
        "generated": now,
        "source": "poolparty.com",
        "note": "Venues from public wp-json venue CPT; city inferred from public copy. Preview images may be local assets or remote https.",
        "venues": venues,
    }
    (DATA / "events.json").write_text(json.dumps(events_doc, indent=2, ensure_ascii=False) + "\n")
    (DATA / "venues.json").write_text(json.dumps(venues_doc, indent=2, ensure_ascii=False) + "\n")
    print("Wrote", DATA / "events.json", "and", DATA / "venues.json")


if __name__ == "__main__":
    main()
