<?php
require_once "c:/laragon/www/uts_pemograman/api/config.php";
$res = $conn->query("SHOW TABLES");
while($row = $res->fetch_array()) { echo $row[0] . "\n"; }
