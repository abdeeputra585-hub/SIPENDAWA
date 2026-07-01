<?php
$ftp = ftp_connect('ftpupload.net');
ftp_login($ftp, 'if0_42257928', '5KMeOPh6jXjOT');
ftp_pasv($ftp, true);
ftp_get($ftp, 'c:/laragon/www/uts_pemograman/script.js', 'htdocs/script.js', FTP_BINARY);
ftp_close($ftp);
echo "Downloaded script.js successfully!";
?>
