<?php
/**
 * Plugin Name: PoolParty Nightlife
 * Description: Additive Nightlife pages on the current pp-2026 lean templates. Does not create posts on activation, change Pool/Beach/Yacht listings, or write the Master sheet.
 * Version: 0.3.1
 */
if (!defined('ABSPATH')) {
    exit;
}
require_once __DIR__ . '/inc/render.php';

function ppn_2026_is_page() {
    if (!function_exists('is_page') || !is_page()) {
        return false;
    }
    $object = get_queried_object();
    if (!$object || empty($object->post_name)) {
        return false;
    }
    if ($object->post_name === 'nightlife') {
        return true;
    }
    if (!empty($object->post_parent)) {
        $parent = get_post($object->post_parent);
        if ($parent && $parent->post_name === 'nightlife') {
            return true;
        }
    }
    return false;
}

add_filter('template_include', function ($template) {
    if (!ppn_2026_is_page()) {
        return $template;
    }
    return __DIR__ . '/templates/page.php';
}, 1002);

add_filter('body_class', function ($classes) {
    if (!ppn_2026_is_page()) {
        return $classes;
    }
    foreach (array('pp2026', 'ux-calm', 'pp-lean', 'pp-nightlife') as $class) {
        $classes[] = $class;
    }
    return $classes;
}, 110);

add_action('wp_enqueue_scripts', function () {
    if (!ppn_2026_is_page()) {
        return;
    }
    if (defined('PP2026_URL') && defined('PP2026_VER')) {
        wp_enqueue_style('pp2026', PP2026_URL . 'assets/css/pp-2026.css', array(), PP2026_VER);
        wp_enqueue_style('pp2026-pages', PP2026_URL . 'assets/css/pp-pages.css', array('pp2026'), PP2026_VER);
        wp_enqueue_style('pp2026-mobile', PP2026_URL . 'assets/css/pp-mobile-polish.css', array('pp2026-pages'), PP2026_VER);
    }
    $css = plugins_url('assets/nightlife-native.css', __FILE__);
    wp_enqueue_style('ppn-native', $css, array(), '0.3.1');
    $hero = plugins_url('assets/omnia/omnia-nightclub-commons-3-1600.webp', __FILE__);
    wp_add_inline_style('ppn-native', 'body.pp-nightlife{--ppn-hero-image:url("' . esc_url($hero) . '");}');
    wp_enqueue_script('ppn-track', plugins_url('assets/preview-track.js', __FILE__), array(), '0.3.1', false);
    wp_enqueue_script('ppn-popup', plugins_url('assets/booking-popup.js', __FILE__), array('ppn-track'), '0.3.1', false);
    wp_enqueue_script('ppn-filter', plugins_url('assets/event-filters.js', __FILE__), array(), '0.3.1', true);
}, PHP_INT_MAX);

add_filter('wp_robots', function ($robots) {
    if (ppn_2026_is_page()) {
        $robots['noindex'] = true;
        unset($robots['index']);
    }
    return $robots;
});
