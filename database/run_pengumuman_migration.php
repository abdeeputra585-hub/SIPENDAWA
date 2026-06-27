<?php
require_once __DIR__ . '/../api/config.php';
mysqli_report(MYSQLI_REPORT_OFF);

$sql = file_get_contents(__DIR__ . '/migrations/pengumuman-schema.sql');
if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    echo "Migrasi pengumuman berhasil dijalankan.\n";
} else {
    echo "Error menjalankan migrasi: " . $conn->error . "\n";
}
$conn->close();
?>
