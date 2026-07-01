<?php
/**
 * Fixed audit - check full function names
 */

$htmlContent = file_get_contents('index.html');

// Extract all event handlers
preg_match_all('/on(?:click|submit|change)=["\']([^"\']{3,})["\']/', $htmlContent, $matches);
$handlers = array_unique($matches[1]);

// Load all JS
$jsFiles = ['script.js'];
foreach (glob('js/*.js') as $f) $jsFiles[] = $f;
foreach (glob('js/**/*.js') as $f) $jsFiles[] = $f;

$jsContent = '';
foreach ($jsFiles as $f) {
    if (file_exists($f)) $jsContent .= file_get_contents($f) . "\n";
}

// Extract unique function names from handlers
$calledFuncs = [];
foreach ($handlers as $h) {
    preg_match_all('/\b([a-zA-Z_][a-zA-Z0-9_]+)\s*\(/', $h, $m);
    foreach ($m[1] as $fn) {
        // Skip built-ins / DOM methods
        $skip = ['if', 'function', 'event', 'parseInt', 'parseFloat', 'confirm', 'alert',
                 'console', 'document', 'window', 'setTimeout', 'clearTimeout', 'JSON',
                 'Array', 'Object', 'String', 'Math', 'Date', 'Boolean', 'Number',
                 'getElementById', 'querySelector', 'querySelectorAll', 'addEventListener',
                 'classList', 'add', 'remove', 'toggle', 'contains', 'getAttribute',
                 'setAttribute', 'textContent', 'innerHTML', 'value', 'checked',
                 'preventDefault', 'stopPropagation', 'removeItem', 'setItem', 'getItem',
                 'target', 'currentTarget', 'toString', 'includes', 'filter', 'map',
                 'find', 'forEach', 'replace', 'trim', 'split', 'join', 'push', 'pop',
                 'this', 'fetch', 'then', 'catch', 'finally', 'resolve', 'reject',
                 'encodeURIComponent', 'decodeURIComponent'];
        if (!in_array($fn, $skip) && strlen($fn) > 3) {
            $calledFuncs[$fn] = $fn;
        }
    }
}

// Check which functions are missing from JS
$missing = [];
foreach ($calledFuncs as $fn) {
    $found = preg_match('/\bfunction\s+' . preg_quote($fn, '/') . '\s*\(/', $jsContent) ||
             preg_match('/\b' . preg_quote($fn, '/') . '\s*=\s*(?:async\s+)?function/', $jsContent) ||
             preg_match('/\b' . preg_quote($fn, '/') . '\s*=\s*\(/', $jsContent) ||
             preg_match('/async\s+function\s+' . preg_quote($fn, '/') . '\s*\(/', $jsContent) ||
             preg_match('/\bconst\s+' . preg_quote($fn, '/') . '\s*=/', $jsContent);
    if (!$found) {
        $missing[] = $fn;
    }
}

sort($missing);
echo "=== MISSING FUNCTIONS (" . count($missing) . "): ===\n";
foreach ($missing as $fn) {
    echo " - $fn\n";
}
echo "\n=== TOTAL FUNCTIONS SCANNED: " . count($calledFuncs) . " ===\n";
