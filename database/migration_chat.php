<?php
require_once __DIR__ . '/../api/config.php';

mysqli_report(MYSQLI_REPORT_OFF);

echo "Menjalankan migrasi tabel chat...\n";

$sql1 = "
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_wali INT NOT NULL,
    id_guru INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_wali) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_guru) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (id_wali, id_guru)
);";

if ($conn->query($sql1)) {
    echo "âœ“ Tabel chat_conversations berhasil dibuat/sudah ada.\n";
} else {
    echo "âœ— Gagal membuat tabel chat_conversations: " . $conn->error . "\n";
}

$sql2 = "
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    id_sender INT NOT NULL,
    isi_pesan TEXT,
    attachment VARCHAR(255) DEFAULT NULL,
    dibaca TINYINT(1) DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (id_sender) REFERENCES users(id) ON DELETE CASCADE
);";

if ($conn->query($sql2)) {
    echo "âœ“ Tabel chat_messages berhasil dibuat/sudah ada.\n";
} else {
    echo "âœ— Gagal membuat tabel chat_messages: " . $conn->error . "\n";
}


echo "Migrasi selesai.\n";
?>

