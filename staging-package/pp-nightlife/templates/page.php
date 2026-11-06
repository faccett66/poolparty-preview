<?php
if (!defined('ABSPATH')) {
    exit;
}
require_once dirname(__DIR__) . '/inc/render.php';
$object = get_queried_object();
$slug = ($object && $object->post_name !== 'nightlife') ? $object->post_name : '';
if (function_exists('pp2026_lean_open')) {
    pp2026_lean_open();
} else {
    echo "<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
    wp_head();
    echo "</head><body ";
    body_class();
    echo ">";
}
echo '<main id="main">';
ppn_2026_render($slug);
echo '</main>';
if (function_exists('pp2026_lean_close')) {
    pp2026_lean_close();
} else {
    wp_footer();
    echo "</body></html>";
}
