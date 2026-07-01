<?php
/**
 * update_db.php - Jalankan sekali untuk mengupdate database di InfinityFree
 * Menggabungkan semua script migrasi
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/api/config.php';
mysqli_report(MYSQLI_REPORT_OFF);

echo "<h1>Proses Update Database (Migrasi)</h1>";
echo "<pre>";

$migrations = [
    __DIR__ . '/database/migration_guru.php',
    __DIR__ . '/database/migration_absensi_catatan.php',
    __DIR__ . '/database/migration_chat.php',
    __DIR__ . '/database/sync_parent_accounts.php'
];

foreach ($migrations as $file) {
    echo "\n============================================\n";
    echo "Menjalankan: " . basename($file) . "\n";
    echo "============================================\n";
    
    if (file_exists($file)) {
        // Output buffering to catch echos from included file
        ob_start();
        include $file;
        $output = ob_get_clean();
        
        // Bersihkan HTML tag jika ada dari file (karena kita dlm pre)
        echo strip_tags($output);
    } else {
        echo "❌ File tidak ditemukan: $file\n";
    }
}

echo "\n\n✅ <b>SEMUA MIGRASI SELESAI. SILAKAN HAPUS FILE update_db.php INI SETELAH DIGUNAKAN!</b>";
echo "</pre>";
?>
