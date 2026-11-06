<?php
/**
 * Plugin Name: PoolParty Nightlife
 * Description: Additive shortcode for the Nightlife landing and five nightclub guides. Does not create posts, menus, products, taxonomies, options, or cron, and does not change Pool, Beach, or Yacht behavior.
 * Version: 0.2.0
 *
 * This is not a verified native theme integration. Current staging templates were not available when this package was built.
 */
if (!defined('ABSPATH')) {
    exit;
}

function ppn_2026_templates() {
    return array(
        '' => 'landing.html',
        'tao-nightclub' => 'tao-nightclub.html',
        'marquee-nightclub' => 'marquee-nightclub.html',
        'omnia-nightclub' => 'omnia-nightclub.html',
        'hakkasan-nightclub' => 'hakkasan-nightclub.html',
        'jewel-nightclub' => 'jewel-nightclub.html',
    );
}

function ppn_2026_page_slug() {
    if (!is_singular()) {
        return null;
    }
    $post = get_post();
    if (!$post || !has_shortcode($post->post_content, 'pp_nightlife')) {
        return null;
    }
    $attrs = array();
    if (preg_match('/' . get_shortcode_regex(array('pp_nightlife')) . '/s', $post->post_content, $match)) {
        $parsed = shortcode_parse_atts($match[3]);
        $attrs = is_array($parsed) ? $parsed : array();
    }
    $slug = isset($attrs['venue']) ? sanitize_key($attrs['venue']) : '';
    $templates = ppn_2026_templates();
    return isset($templates[$slug]) ? $slug : null;
}

function ppn_2026_shortcode($atts = array()) {
    $atts = shortcode_atts(array('venue' => ''), $atts, 'pp_nightlife');
    $slug = sanitize_key($atts['venue']);
    $templates = ppn_2026_templates();
    if (!isset($templates[$slug])) {
        return '<p>That Nightlife venue guide is not available.</p>';
    }
    $file = __DIR__ . '/templates/' . $templates[$slug];
    if (!is_readable($file)) {
        return '';
    }
    $html = file_get_contents($file);
    $html = str_replace('{{ASSETS}}', esc_url(plugins_url('assets/', __FILE__)), $html);
    $html = str_replace('{{BASE}}', esc_url(trailingslashit(home_url('/nightlife/'))), $html);
    if (apply_filters('ppn_2026_enable_analytics', false)) {
        $html = str_replace('data-ppn-analytics="disabled"', 'data-ppn-analytics="enabled"', $html);
    }
    return $html;
}
add_shortcode('pp_nightlife', 'ppn_2026_shortcode');

add_action('wp_enqueue_scripts', function () {
    $slug = ppn_2026_page_slug();
    if ($slug === null) {
        return;
    }
    $ver = '0.2.0';
    $base = plugins_url('assets/', __FILE__);
    wp_enqueue_style('ppn-2026-hero', $base . 'hero.css', array(), $ver);
    wp_enqueue_style('ppn-2026-backdrop', $base . 'nightlife-backdrop.css', array('ppn-2026-hero'), $ver);
    if ($slug === '') {
        wp_enqueue_style('ppn-2026-events', $base . 'events.css', array('ppn-2026-backdrop'), $ver);
        wp_enqueue_script('ppn-2026-filters', $base . 'event-filters.js', array(), $ver, true);
    } else {
        wp_enqueue_style('ppn-2026-nightlife', $base . 'nightlife.css', array('ppn-2026-backdrop'), $ver);
        wp_enqueue_style('ppn-2026-preview', $base . 'preview.css', array('ppn-2026-nightlife'), $ver);
        wp_enqueue_script('ppn-2026-nightlife', $base . 'nightlife.js', array(), $ver, true);
    }
    wp_enqueue_script('ppn-2026-track', $base . 'preview-track.js', array(), $ver, false);
    wp_enqueue_script('ppn-2026-popup', $base . 'booking-popup.js', array('ppn-2026-track'), $ver, false);
});

add_filter('wp_robots', function ($robots) {
    if (ppn_2026_page_slug() !== null) {
        $robots['noindex'] = true;
        unset($robots['index']);
    }
    return $robots;
});
