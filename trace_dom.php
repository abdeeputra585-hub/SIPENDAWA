<?php
$html = file_get_contents("c:/laragon/www/uts_pemograman/index.html");
$dom = new DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML($html);
$body = $dom->getElementsByTagName("body")->item(0);

function countDivs($node, $indent = 0) {
    if (!$node) return;
    foreach ($node->childNodes as $child) {
        if ($child->nodeName === "div") {
            $class = $child->getAttribute("class");
            $id = $child->getAttribute("id");
            if (strpos($id, "page-") !== false || strpos($class, "flex-1 flex flex-row") !== false || strpos($class, "flex-1 flex flex-col") !== false || $id == "workspace-viewport") {
                echo str_repeat("  ", $indent) . "<div id=\"$id\" class=\"" . substr($class, 0, 30) . "\">\n";
                countDivs($child, $indent + 1);
            } else {
                countDivs($child, $indent);
            }
        } else if ($child->nodeName === "footer") {
            echo str_repeat("  ", $indent) . "<footer>\n";
        } else if ($child->childNodes) {
            countDivs($child, $indent);
        }
    }
}
countDivs($body);
