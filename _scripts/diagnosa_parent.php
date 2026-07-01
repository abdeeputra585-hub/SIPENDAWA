<?php
/**
 * Diagnostik: Cek error di parent/dashboard.php step by step
 */
header('Content-Type: text/plain; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/api/config.php';

echo "=== STEP 1: DB Connected ===\n";
echo "OK\n\n";

// Cek tabel yang ada
echo "=== STEP 2: Tabel di database ===\n";
$tables = $conn->query("SHOW TABLES");
while ($t = $tables->fetch_row()) {
    echo "  - " . $t[0] . "\n";
}
echo "\n";

// Cek kolom di tabel messages (kalau ada)
echo "=== STEP 3: Cek tabel messages ===\n";
$chkMsg = $conn->query("SHOW TABLES LIKE 'messages'");
if ($chkMsg->num_rows > 0) {
    echo "✅ Tabel messages ADA\n";
    $cols = $conn->query("DESCRIBE messages");
    while ($c = $cols->fetch_assoc()) {
        echo "  - {$c['Field']} ({$c['Type']})\n";
    }
} else {
    echo "❌ Tabel messages TIDAK ADA\n";
}
echo "\n";

// Cek kolom di tabel notifikasi (kalau ada)
echo "=== STEP 4: Cek tabel notifikasi ===\n";
$chkNotif = $conn->query("SHOW TABLES LIKE 'notifikasi'");
if ($chkNotif->num_rows > 0) {
    echo "✅ Tabel notifikasi ADA\n";
} else {
    echo "❌ Tabel notifikasi TIDAK ADA\n";
}
echo "\n";

// Cek kolom di tabel wali
echo "=== STEP 5: Kolom tabel wali ===\n";
$cols = $conn->query("DESCRIBE wali");
if ($cols) {
    while ($c = $cols->fetch_assoc()) {
        echo "  - {$c['Field']} ({$c['Type']}) Key:{$c['Key']}\n";
    }
} else {
    echo "ERROR: " . $conn->error . "\n";
}
echo "\n";

// Cek kolom di tabel nilai
echo "=== STEP 6: Kolom tabel nilai ===\n";
$cols = $conn->query("DESCRIBE nilai");
if ($cols) {
    while ($c = $cols->fetch_assoc()) {
        echo "  - {$c['Field']} ({$c['Type']})\n";
    }
} else {
    echo "ERROR: " . $conn->error . "\n";
}
echo "\n";

// Cek kolom di tabel kehadiran
echo "=== STEP 7: Kolom tabel kehadiran ===\n";
$cols = $conn->query("DESCRIBE kehadiran");
if ($cols) {
    while ($c = $cols->fetch_assoc()) {
        echo "  - {$c['Field']} ({$c['Type']})\n";
    }
} else {
    echo "ERROR: " . $conn->error . "\n";
}
echo "\n";

// Cek kolom di tabel pembayaran
echo "=== STEP 8: Kolom tabel pembayaran ===\n";
$cols = $conn->query("DESCRIBE pembayaran");
if ($cols) {
    while ($c = $cols->fetch_assoc()) {
        echo "  - {$c['Field']} ({$c['Type']})\n";
    }
} else {
    echo "ERROR: " . $conn->error . "\n";
}

echo "\n=== SELESAI ===\n";
?>
