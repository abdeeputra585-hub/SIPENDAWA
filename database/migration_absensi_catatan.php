<?php
require_once __DIR__ . '/../api/config.php';
mysqli_report(MYSQLI_REPORT_OFF);

echo "Memulai migrasi tabel catatan_perilaku...\n";

// 1. Buat tabel catatan_perilaku
$sql = "CREATE TABLE IF NOT EXISTS catatan_perilaku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    guru_id INT NOT NULL,
    tanggal DATE NOT NULL,
    tipe ENUM('Positif', 'Negatif', 'Info') NOT NULL DEFAULT 'Info',
    catatan TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE
)";

if ($conn->query($sql)) {
    echo "âœ“ Tabel catatan_perilaku siap.\n";
} else {
    echo "âŒ Gagal membuat tabel catatan_perilaku: " . $conn->error . "\n";
}

// 2. Dapatkan guru_id
$guruResult = $conn->query("SELECT id FROM users WHERE role = 'guru' LIMIT 1");
$guruRow = $guruResult->fetch_assoc();
$guruId = $guruRow ? $guruRow['id'] : 1;

// 3. Masukkan sample data jika tabel masih kosong
$cek = $conn->query("SELECT COUNT(*) as total FROM catatan_perilaku");
$row = $cek->fetch_assoc();

if ($row['total'] == 0) {
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 days'));
    
    $samples = [
        "(1, $guruId, '$today', 'Positif', 'Budi sangat aktif bertanya di pelajaran Matematika hari ini dan berhasil menjawab soal tersulit di papan tulis.')",
        "(2, $guruId, '$yesterday', 'Negatif', 'Siti terlambat masuk kelas setelah jam istirahat dan lupa membawa buku cetak.')",
        "(3, $guruId, '$today', 'Info', 'Tugas kelompok IPA sudah dikumpulkan. Tinggal presentasi minggu depan.')"
    ];
    
    $insertQuery = "INSERT INTO catatan_perilaku (siswa_id, guru_id, tanggal, tipe, catatan) VALUES " . implode(", ", $samples);
    if ($conn->query($insertQuery)) {
        echo "âœ“ Sample catatan_perilaku berhasil diinput.\n";
    } else {
        echo "âŒ Gagal input sample data: " . $conn->error . "\n";
    }
} else {
    echo "â„¹ï¸ Sample data sudah ada, melewati tahap pengisian.\n";
}

echo "\nSelesai!\n";

?>

