<?php
require_once __DIR__ . '/../api/config.php';

mysqli_report(MYSQLI_REPORT_OFF);

// Drop old tables
$conn->query("DROP TABLE IF EXISTS chat_messages");
$conn->query("DROP TABLE IF EXISTS chat_conversations");

// Run new schema
$sql = file_get_contents(__DIR__ . '/migrations/chat-schema.sql');
if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    echo "Migrasi database berhasil dijalankan.";
} else {
    echo "Error menjalankan migrasi: " . $conn->error;
}
$conn->close();
?>
