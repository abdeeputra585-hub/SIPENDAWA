<?php
require_once __DIR__ . '/../env.php';
$host = Env::get('DB_HOST', 'localhost');
$user = Env::get('DB_USERNAME', 'root');
$password = Env::get('DB_PASSWORD', '');
$database = Env::get('DB_NAME', 'if0_42257928_eduguardian');

$conn = mysqli_connect($host, $user, $password, $database);
$out = "";
if (!$conn) $out .= "Koneksi DB gagal\n";
else {
    $result = mysqli_query($conn, "SELECT * FROM notifikasi");
    if ($result) {
        $out .= "Jumlah notifikasi: " . mysqli_num_rows($result) . "\n";
        while($row = mysqli_fetch_assoc($result)) {
            $out .= print_r($row, true);
        }
    } else {
        $out .= "Error: " . mysqli_error($conn) . "\n";
    }
}
file_put_contents('db_out.txt', $out);
?>