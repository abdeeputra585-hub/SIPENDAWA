<?php
/**
 * koneksi.php - DIPERBAIKI
 * Baca kredensial dari .env, bukan hardcoded
 */

require_once __DIR__ . '/env.php';

$host     = Env::get('DB_HOST', 'localhost');
$user     = Env::get('DB_USERNAME', 'root');
$password = Env::get('DB_PASSWORD', '');
$database = Env::get('DB_NAME', 'eduguardian');

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    die("Koneksi gagal: " . mysqli_connect_error());
}

// Set charset to UTF-8
mysqli_set_charset($conn, "utf8mb4");

// PENTING: Cek session untuk memastikan user sudah login
// Uncomment ini jika halaman PHP memerlukan autentikasi
/*
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}
*/
?>