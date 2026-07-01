<?php
/**
 * Fix: Kolom users.username adalah NOT NULL + UNIQUE
 * padahal tidak pernah diisi saat tambah guru/user baru.
 * Solusi: ubah username menjadi NULL + hapus UNIQUE constraint
 * atau generate username otomatis dari email.
 */

require_once __DIR__ . '/api/config.php';

echo "=== Fix users.username ===\n\n";

// Cek ada index apa saja di tabel users untuk kolom username
$indexResult = $conn->query("SHOW INDEX FROM users WHERE Column_name = 'username'");
$indexes = [];
while ($row = $indexResult->fetch_assoc()) {
    $indexes[] = $row;
    echo "Index: {$row['Key_name']} | Non_unique: {$row['Non_unique']}\n";
}

echo "\n";

// 1. Hapus UNIQUE index dari username
foreach ($indexes as $idx) {
    if ($idx['Key_name'] !== 'PRIMARY') {
        $sql = "ALTER TABLE users DROP INDEX `{$idx['Key_name']}`";
        if ($conn->query($sql)) {
            echo "✅ Index '{$idx['Key_name']}' berhasil dihapus\n";
        } else {
            echo "❌ Gagal hapus index '{$idx['Key_name']}': " . $conn->error . "\n";
        }
    }
}

// 2. Ubah kolom username menjadi NULL DEFAULT NULL
$alter = "ALTER TABLE users MODIFY COLUMN username VARCHAR(255) NULL DEFAULT NULL";
if ($conn->query($alter)) {
    echo "✅ Kolom 'username' diubah menjadi NULLABLE\n";
} else {
    echo "❌ Gagal modify: " . $conn->error . "\n";
}

// 3. Set semua username yang kosong ('') menjadi NULL
$update = "UPDATE users SET username = NULL WHERE username = ''";
if ($conn->query($update)) {
    echo "✅ Username kosong diset ke NULL (" . $conn->affected_rows . " baris)\n";
} else {
    echo "❌ Gagal update: " . $conn->error . "\n";
}

// 4. Verifikasi
echo "\n--- Verifikasi akhir ---\n";
$r = $conn->query("DESCRIBE users");
while ($row = $r->fetch_assoc()) {
    if ($row['Field'] === 'username') {
        echo "username: Type={$row['Type']} | Null={$row['Null']} | Key={$row['Key']} | Default={$row['Default']}\n";
    }
}

echo "\n=== Fix selesai! Silakan coba tambah guru lagi ===\n";
?>
