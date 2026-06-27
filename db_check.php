<?php
require_once __DIR__ . '/../env.php';
$host = Env::get('DB_HOST', 'localhost');
$user = Env::get('DB_USERNAME', 'root');
$password = Env::get('DB_PASSWORD', '');
$database = Env::get('DB_NAME', 'if0_42257928_eduguardian');

$conn = mysqli_connect($host, $user, $password, $database);
if (!$conn) die("Koneksi DB gagal");
$result = mysqli_query($conn, "SELECT * FROM notifikasi");
if ($result) {
    echo "Jumlah notifikasi: " . mysqli_num_rows($result) . "\n";
    while($row = mysqli_fetch_assoc($result)) {
        print_r($row);
    }
} else {
    echo "Error: " . mysqli_error($conn);
}
?>