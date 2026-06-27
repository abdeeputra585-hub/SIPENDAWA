<?php
$ftp_server = 'ftpupload.net';
$ftp_user = 'if0_42257928';
$ftp_pass = '5KMeOPh6jXjOT';
$conn_id = ftp_connect($ftp_server) or die("Koneksi gagal");
ftp_login($conn_id, $ftp_user, $ftp_pass) or die("Login gagal");
ftp_pasv($conn_id, true);

$local_file = 'c:\laragon\www\uts_pemograman\api\notifikasi.php';
$content = file_get_contents($local_file);
$replacement = "
            if (\ === 'admin' || \ === 'kepala_sekolah') {
                // HARDCODED DUMMY FOR DEBUG
                \ = [
                    ['id' => 991, 'judul' => 'DUMMY DEBUG 1', 'pesan' => 'TESTING 1', 'tipe' => 'info', 'dibaca' => 0, 'created_at' => date('Y-m-d H:i:s'), 'user_nama' => 'Admin'],
                    ['id' => 992, 'judul' => 'DUMMY DEBUG 2', 'pesan' => 'TESTING 2', 'tipe' => 'success', 'dibaca' => 0, 'created_at' => date('Y-m-d H:i:s'), 'user_nama' => 'Admin']
                ];
                sendResponse([
                    'success'      => true,
                    'data'         => \,
                    'belum_dibaca' => 2,
                    'total'        => 2
                ]);
                exit;
            } else {
";
$content = str_replace("
            if (\ === 'admin' || \ === 'kepala_sekolah') {
                \    = \"SELECT n.id, n.judul, n.pesan, n.tipe, n.dibaca, n.created_at, u.nama as user_nama
                           FROM notifikasi n
                           LEFT JOIN users u ON n.user_id = u.id
                           ORDER BY n.created_at DESC\";
                \   = \->prepare(\);
                \->execute();
", $replacement, $content);

file_put_contents('notifikasi_test2.php', $content);
ftp_put($conn_id, 'htdocs/api/notifikasi.php', 'notifikasi_test2.php', FTP_BINARY);
ftp_close($conn_id);
?>
