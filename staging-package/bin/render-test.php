<?php
define('ABSPATH', __DIR__);
function esc_html($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function esc_url($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function plugins_url($path, $file) { return 'https://plugins.example/' . ltrim($path, '/'); }
function home_url($path) { return 'https://staging.example' . $path; }
require dirname(__DIR__) . '/pp-nightlife/inc/render.php';
ob_start();
ppn_2026_render('');
$home = ob_get_clean();
ob_start();
ppn_2026_render('tao-nightclub');
$tao = ob_get_clean();
ob_start();
ppn_2026_render('omnia-nightclub');
$omnia = ob_get_clean();
$fail = 0;
function expect($ok, $message) {
    global $fail;
    if (!$ok) { fwrite(STDERR, "FAIL $message\n"); $fail++; }
    else { echo "ok $message\n"; }
}
expect(strpos($home, 'class="page-hero nightlife"') !== false, 'landing uses native page-hero');
expect(strpos($home, 'Find your next <em>night</em>') !== false, 'landing h1');
expect(substr_count($home, 'card-buy') === 29, '29 book buttons');
expect(strpos($home, 'venueeventartist') === false, 'no uncleared flyers');
expect(strpos($home, 'omnia-nightclub-commons-1-1600.webp') !== false, 'omnia tile photo');
expect(strpos($home, 'No cleared photo for TAO Nightclub') !== false, 'tao has no photo');
expect(strpos($home, 'CC BY 4.0') !== false, 'license visible');
expect(strpos($home, '/events/61/') === false, 'landing is not calendar urls');
expect(strpos($tao, 'https://booketing.com/microsite/ppl/events/61/1112/tao-nightclub') !== false, 'tao calendar');
expect(strpos($tao, 'omnia-nightclub-commons') === false, 'tao does not use omnia photo');
expect(strpos($omnia, 'data-ppn-hero="omnia-nightclub-commons-3-1600.webp"') !== false, 'omnia hero photo');
expect(strpos($omnia, 'Omnia_Las_Vegas_2025_-_3') !== false, 'omnia hero credit');
expect(strpos($omnia, 'https://booketing.com/microsite/ppl/events/61/1089/omnia') !== false, 'omnia calendar');
expect(strpos($home, 'https://booketing.com/microsite/ppl/event/61/1112/dj-phenom?eventcode=EVE111200020261106') !== false, 'event url preserved');
expect(strpos($home, 'data-pp-book="1"') !== false, 'book attribute');
expect(strpos($home, 'data-nl-filter') !== false, 'venue filter form');
expect(strpos($home, 'data-nl-grid') !== false, 'filter grid');
expect(strpos($home, 'data-nl-count') !== false, 'filter count');
expect(strpos($home, 'data-venue="1112"') !== false, 'tao venue attribute');
expect(strpos($home, 'data-venue="1108"') !== false, 'marquee venue attribute');
expect(strpos($home, 'data-venue="1089"') !== false, 'omnia venue attribute');
expect(strpos($home, 'data-venue="1085"') !== false, 'hakkasan venue attribute');
expect(strpos($home, 'data-venue="100542"') !== false, 'jewel venue attribute');
expect(strpos($home, 'type="reset"') !== false, 'clear control');
expect(strpos(file_get_contents(dirname(__DIR__) . '/pp-nightlife/pp-nightlife.php'), 'event-filters.js') !== false, 'filter script enqueued');
if ($fail) exit(1);
echo "render-test passed\n";
