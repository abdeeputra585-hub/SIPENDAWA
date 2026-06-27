<?php
$ftp_server = 'ftpupload.net';
$ftp_user = 'if0_42257928';
$ftp_pass = '5KMeOPh6jXjOT';

$conn_id = ftp_connect($ftp_server) or die("Koneksi gagal");
ftp_login($conn_id, $ftp_user, $ftp_pass) or die("Login gagal");
ftp_pasv($conn_id, true);

// Pindah ke direktori utama (htdocs di infinityfree)
ftp_chdir($conn_id, 'htdocs');

function uploadFile($conn_id, $local_file, $remote_file) {
    echo "Uploading $local_file -> $remote_file... ";
    
    // Pastikan folder remote ada
    $dir = dirname($remote_file);
    $parts = explode('/', $dir);
    $path = '';
    foreach ($parts as $part) {
        if ($part === '.' || empty($part)) continue;
        $path .= $part . '/';
        @ftp_mkdir($conn_id, $path);
    }
    
    if (ftp_put($conn_id, $remote_file, $local_file, FTP_BINARY)) {
        echo "OK\n";
    } else {
        echo "FAILED\n";
    }
}

// Upload index.html & script.js & config.php
uploadFile($conn_id, 'C:\laragon\www\uts_pemograman\index.html', 'index.html');
uploadFile($conn_id, 'C:\laragon\www\uts_pemograman\script.js', 'script.js');
uploadFile($conn_id, 'C:\laragon\www\uts_pemograman\api\config.php', 'api/config.php');

// Recursive upload function
function uploadDir($conn_id, $local_dir, $remote_dir) {
    $files = scandir($local_dir);
    foreach ($files as $file) {
        if ($file == '.' || $file == '..') continue;
        $local_path = $local_dir . DIRECTORY_SEPARATOR . $file;
        $remote_path = $remote_dir . '/' . $file;
        if (is_dir($local_path)) {
            uploadDir($conn_id, $local_path, $remote_path);
        } else {
            uploadFile($conn_id, $local_path, $remote_path);
        }
    }
}

// Upload js and pages directories
uploadDir($conn_id, 'C:\laragon\www\uts_pemograman\js', 'js');
uploadDir($conn_id, 'C:\laragon\www\uts_pemograman\pages', 'pages');

ftp_close($conn_id);
echo "Upload Selesai!";
?>
