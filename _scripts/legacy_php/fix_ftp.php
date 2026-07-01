<?php
$ftp_server = 'ftpupload.net';
$ftp_user = 'if0_42257928';
$ftp_pass = '5KMeOPh6jXjOT';

$conn_id = ftp_connect($ftp_server);
ftp_login($conn_id, $ftp_user, $ftp_pass);
ftp_pasv($conn_id, true);
ftp_chdir($conn_id, 'htdocs');

if (ftp_rename($conn_id, 'index.php', 'index_lama.php')) {
    echo "index.php successfully renamed to index_lama.php\n";
} else {
    echo "Failed to rename index.php or it doesn't exist.\n";
}

ftp_close($conn_id);
?>
