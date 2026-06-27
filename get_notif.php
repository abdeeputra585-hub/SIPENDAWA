<?php
$ftp_server = 'ftpupload.net';
$ftp_user = 'if0_42257928';
$ftp_pass = '5KMeOPh6jXjOT';
$conn_id = ftp_connect($ftp_server) or die("Koneksi gagal");
ftp_login($conn_id, $ftp_user, $ftp_pass) or die("Login gagal");
ftp_pasv($conn_id, true);

ftp_get($conn_id, 'notifikasi_downloaded.php', 'htdocs/api/notifikasi.php', FTP_BINARY);
ftp_close($conn_id);
?>
