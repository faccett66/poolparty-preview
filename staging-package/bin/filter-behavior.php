<?php
define('ABSPATH', __DIR__);
function esc_html($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function esc_url($value) { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function plugins_url($path, $file) { return 'https://plugins.example/' . ltrim($path, '/'); }
function home_url($path) { return 'https://staging.example' . $path; }
require dirname(__DIR__) . '/pp-nightlife/inc/render.php';
ob_start();
ppn_2026_render('');
$main = ob_get_clean();
$script = file_get_contents(dirname(__DIR__) . '/pp-nightlife/assets/event-filters.js');
$html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>.card[hidden]{display:none !important}</style></head><body>'
    . $main . '<script>' . $script . '</script></body></html>';
$path = sys_get_temp_dir() . '/ppn-filter.html';
file_put_contents($path, $html);
echo $path, "\n";
