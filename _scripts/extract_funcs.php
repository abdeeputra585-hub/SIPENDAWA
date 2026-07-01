<?php
$html = file_get_contents('index.html');
preg_match_all('/on(click|submit|change)=["\']([^"\']+)["\']/', $html, $matches);
$funcs = array_unique($matches[2]);
$results = [];
foreach($funcs as $f) {
    // extract function name
    $name = explode('(', $f)[0];
    if (trim($name) !== '' && strpos($name, 'document') === false && strpos($name, 'appState') === false) {
        $results[] = trim($name);
    }
}
$results = array_unique($results);
sort($results);
echo implode("\n", $results);
