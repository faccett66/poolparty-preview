<?php
if (!defined('ABSPATH')) {
    exit;
}
require_once __DIR__ . '/data.php';

function ppn_2026_h($value) {
    return esc_html((string) $value);
}
function ppn_2026_u($value) {
    return esc_url((string) $value);
}
function ppn_2026_asset($file) {
    if (function_exists('plugins_url')) {
        return plugins_url('assets/' . ltrim($file, '/'), dirname(__DIR__) . '/pp-nightlife.php');
    }
    return 'assets/' . ltrim($file, '/');
}
function ppn_2026_page_url($slug) {
    $path = $slug === '' ? '/nightlife/' : '/nightlife/' . $slug . '/';
    return function_exists('home_url') ? home_url($path) : $path;
}

function ppn_2026_hero($slug) {
    $venues = ppn_2026_venues();
    $is_home = ($slug === '');
    $venue = $is_home ? null : (isset($venues[$slug]) ? $venues[$slug] : null);
    $photo = ($is_home || $slug === 'omnia-nightclub');
    $class = 'page-hero nightlife' . ($photo ? '' : ' nightlife-plain');
    $hero_file = $photo ? ' data-ppn-hero="omnia-nightclub-commons-3-1600.webp"' : '';
    echo '<section class="' . ppn_2026_h($class) . '"' . $hero_file . '>';
    echo '<div class="wrap">';
    echo '<p class="eyebrow">' . ($is_home ? 'Nightlife' : 'Nightlife / Nightclub / Las Vegas') . '</p>';
    if ($is_home) {
        echo '<h1>Find your next <em>night</em></h1>';
        echo '<p class="lead">Five Las Vegas nightclubs, separate from pool, beach and yacht. The photograph behind this hero is OMNIA Nightclub only.</p>';
    } else {
        echo '<h1>' . ppn_2026_h($venue['name']) . '</h1>';
        echo '<p class="lead">' . ppn_2026_h($venue['tagline']) . ' ' . ppn_2026_h($venue['place']) . ', Las Vegas.</p>';
    }
    echo '</div></section>';
}

function ppn_2026_credit() {
    echo '<p class="ppn-credit">Photograph of <strong>OMNIA Nightclub</strong> only, Caesars Palace, Las Vegas. ';
    echo '<a href="https://commons.wikimedia.org/wiki/File:Omnia_Las_Vegas_2025_-_3.jpg">“Omnia Las Vegas 2025 - 3”</a> ';
    echo 'by InvadingInvader / Wikimedia Commons, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. ';
    echo 'Resized and converted to WebP. Cropped to fit this hero. Not a photograph of TAO, Marquee, Hakkasan, or JEWEL. Not a venue endorsement.</p>';
}

function ppn_2026_card($event) {
    $slug = $event['slug'];
    $info = ppn_2026_page_url($slug);
    $omnia = ($event['venue_id'] === '1089');
    echo '<article class="card" data-vibe="nightclub" data-date="' . ppn_2026_h($event['ymd']) . '" data-venue="' . ppn_2026_h($event['venue_id']) . '">';
    echo '<div class="card-media' . ($omnia ? '' : ' ppn-no-photo') . '"><a href="' . ppn_2026_u($info) . '" tabindex="-1" aria-hidden="true">';
    if ($omnia) {
        echo '<img src="' . ppn_2026_u(ppn_2026_asset('omnia/omnia-nightclub-commons-1-1600.webp')) . '" width="1600" height="1200" alt="OMNIA Nightclub interior with its suspended chandelier and dance-floor lighting" loading="lazy" decoding="async">';
    } else {
        echo '<span class="ppn-no-photo-label">No cleared photo for ' . ppn_2026_h($event['venue']) . '</span>';
    }
    echo '</a><div class="badge-row"><span class="tag">NIGHTCLUB</span></div></div>';
    echo '<div class="card-body"><h3><a class="card-link" href="' . ppn_2026_u($info) . '">' . ppn_2026_h($event['title']) . '</a></h3>';
    echo '<div class="card-meta"><span>' . ppn_2026_h($event['date']) . '</span><span>' . ppn_2026_h($event['venue']) . '</span><span>Las Vegas</span></div>';
    echo '<div class="card-actions"><a class="btn btn-ghost btn-sm card-info" href="' . ppn_2026_u($info) . '">More Info</a>';
    echo '<a class="btn btn-primary btn-sm card-buy" data-pp-book="1" data-pp-click-type="partner" data-pp-dest="booketing.com" data-pp-event="' . ppn_2026_h($event['title']) . '" data-pp-eventcode="' . ppn_2026_h($event['code']) . '" data-pp-venue="' . ppn_2026_h($event['venue']) . '" data-pp-venue-id="' . ppn_2026_h($event['venue_id']) . '" data-pp-vibe="nightclub" data-pp-placement="nightlife" href="' . ppn_2026_u($event['url']) . '" target="_blank" rel="noopener">Book Now</a></div>';
    if ($omnia) {
        echo '<p class="ppn-card-credit"><a href="https://commons.wikimedia.org/wiki/File:Omnia_Las_Vegas_2025_-_1.jpg">“Omnia Las Vegas 2025 - 1”</a> by InvadingInvader / Wikimedia Commons, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Resized and converted to WebP. OMNIA Nightclub interior, not this event’s artist.</p>';
    }
    echo '</div></article>';
}

function ppn_2026_render($slug) {
    $venues = ppn_2026_venues();
    $events = ppn_2026_events();
    if ($slug !== '' && !isset($venues[$slug])) {
        echo '<p>That Nightlife venue guide is not available.</p>';
        return;
    }
    ppn_2026_hero($slug);
    echo '<section class="lean-sec lean-ev" id="events-list"><div class="wrap">';
    if ($slug === '' || $slug === 'omnia-nightclub') {
        ppn_2026_credit();
    } else {
        echo '<p class="ppn-credit">No cleared photograph for ' . ppn_2026_h($venues[$slug]['name']) . '. The OMNIA Nightclub photo is not used here.</p>';
    }
    if ($slug === '') {
        echo '<form class="lean-filter" data-nl-filter onsubmit="return false" aria-label="Filter nightclubs"><div class="lean-filter__row"><label><span>Venue</span><select name="venue"><option value="">All nightclubs</option>';
        foreach ($venues as $id => $venue) {
            echo '<option value="' . ppn_2026_h($venue['id']) . '">' . ppn_2026_h($venue['name']) . '</option>';
        }
        echo '</select></label></div></form>';
    } else {
        $venue = $venues[$slug];
        echo '<p class="lead">' . ppn_2026_h($venue['note']) . ' ' . ppn_2026_h($venue['address']) . '</p>';
        echo '<p><a class="btn btn-primary card-buy" data-pp-popup="1" data-ppn-booking="1" data-ppn-venue="' . ppn_2026_h($venue['name']) . '" data-ppn-venue-id="' . ppn_2026_h($venue['id']) . '" href="' . ppn_2026_u($venue['calendar']) . '" target="_blank" rel="sponsored noopener noreferrer">View partner calendar</a></p>';
        echo '<p>On a computer this opens the partner calendar in a booking window and keeps this page open. On a phone, or if that window is blocked, the same link opens in a new tab.</p>';
    }
    $shown = 0;
    echo '<div class="card-grid cols-3 lean-ev__grid" data-nl-grid>';
    foreach ($events as $event) {
        if ($slug !== '' && $event['slug'] !== $slug) {
            continue;
        }
        ppn_2026_card($event);
        $shown++;
    }
    echo '</div>';
    echo '<p class="lean-ev__count">' . (int) $shown . ' upcoming events in this static sample. Not live inventory. No prices are shown here.</p>';
    echo '</div></section>';
}
