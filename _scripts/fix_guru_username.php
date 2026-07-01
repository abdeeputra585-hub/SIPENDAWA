<?php
/**
 * Fix: Hapus kolom username dari guru_profiles jika ada (penyebab Duplicate entry error)
 * Lalu pastikan NIP unique tetap ada
 */

require_once __DIR__ . '/api/config.php';

echo "=== Diagnosa Tabel guru_profiles ===\n\n";

// Cek struktur tabel
$result = $conn->query("DESCRIBE guru_profiles");
if (!$result) {
    echo "Error: " . $conn->error . "\n";
    exit;
}

echo "Kolom di tabel guru_profiles:\n";
$hasUsername = false;
$usernameIsNullable = false;
while ($row = $result->fetch_assoc()) {
    echo "  - {$row['Field']} | Type: {$row['Type']} | Null: {$row['Null']} | Key: {$row['Key']} | Default: {$row['Default']}\n";
    if ($row['Field'] === 'username') {
        $hasUsername = true;
        $usernameIsNullable = ($row['Null'] === 'YES');
    }
}

echo "\n";

if ($hasUsername) {
    echo "⚠️  Kolom 'username' ditemukan!\n";
    echo "   Nullable: " . ($usernameIsNullable ? 'YES' : 'NO') . "\n\n";
    
    // Cek apakah ada index UNIQUE pada username
    $indexResult = $conn->query("SHOW INDEX FROM guru_profiles WHERE Column_name = 'username'");
    $indexes = [];
    while ($idx = $indexResult->fetch_assoc()) {
        $indexes[] = $idx;
        echo "   Index: {$idx['Key_name']} | Unique: " . ($idx['Non_unique'] == 0 ? 'YES' : 'NO') . "\n";
    }
    
    echo "\n🔧 Solusi yang tersedia:\n";
    echo "   1. DROP kolom username (direkomendasikan jika tidak dipakai)\n";
    echo "   2. Ubah username menjadi NULLABLE agar tidak bentrok\n\n";
    
    // Pilih solusi: hapus index unique dulu, lalu ubah jadi nullable
    // Hapus index unique jika ada
    foreach ($indexes as $idx) {
        if ($idx['Non_unique'] == 0 && $idx['Key_name'] !== 'PRIMARY') {
            $dropIndex = "ALTER TABLE guru_profiles DROP INDEX `{$idx['Key_name']}`";
            if ($conn->query($dropIndex)) {
                echo "✅ Index '{$idx['Key_name']}' berhasil dihapus\n";
            } else {
                echo "❌ Gagal hapus index: " . $conn->error . "\n";
            }
        }
    }
    
    // Ubah username menjadi nullable tanpa unique
    $alter = "ALTER TABLE guru_profiles MODIFY COLUMN username VARCHAR(100) NULL DEFAULT NULL";
    if ($conn->query($alter)) {
        echo "✅ Kolom 'username' diubah menjadi NULLABLE (tidak UNIQUE lagi)\n";
    } else {
        echo "❌ Gagal modify column: " . $conn->error . "\n";
        
        // Fallback: coba drop column
        $drop = "ALTER TABLE guru_profiles DROP COLUMN username";
        if ($conn->query($drop)) {
            echo "✅ Kolom 'username' berhasil dihapus dari tabel\n";
        } else {
            echo "❌ Gagal drop column: " . $conn->error . "\n";
        }
    }
} else {
    echo "✅ Kolom 'username' TIDAK ada di tabel. Masalah mungkin di tempat lain.\n";
    
    // Cek tabel users
    echo "\nCek tabel users:\n";
    $result2 = $conn->query("DESCRIBE users");
    while ($row = $result2->fetch_assoc()) {
        if ($row['Field'] === 'username') {
            echo "  ⚠️  users.username: {$row['Type']} | Null: {$row['Null']} | Key: {$row['Key']}\n";
        }
    }
}

echo "\n=== Selesai ===\n";
?>
