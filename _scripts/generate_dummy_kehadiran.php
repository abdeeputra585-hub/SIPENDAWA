<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/api/config.php';

// Ambil siswa yang punya relasi (ada walinya)
$res = $conn->query("SELECT DISTINCT siswa_id FROM relasi");
$siswa_ids = [];
while($row = $res->fetch_assoc()) {
    $siswa_ids[] = $row['siswa_id'];
}

if (empty($siswa_ids)) {
    echo "Tidak ada siswa yang punya relasi.";
    exit;
}

$bulan = date('m');
$tahun = date('Y');
$tanggal_awal = date('Y-m-01');
$tanggal_akhir = date('Y-m-d'); // Sampai hari ini

// Hapus data kehadiran lama bulan ini untuk siswa-siswa tersebut (biar gak numpuk)
$ids_str = implode(',', $siswa_ids);
$conn->query("DELETE FROM kehadiran WHERE siswa_id IN ($ids_str) AND MONTH(tanggal) = $bulan AND YEAR(tanggal) = $tahun");

$count = 0;
foreach ($siswa_ids as $sid) {
    // Generate data untuk 5 hari terakhir
    for ($i = 0; $i < 5; $i++) {
        $tgl = date('Y-m-d', strtotime("-$i days"));
        // Skip weekend
        if (date('N', strtotime($tgl)) >= 6) continue;
        
        $status_arr = ['Hadir', 'Hadir', 'Hadir', 'Izin', 'Sakit', 'Alpa'];
        $status = $status_arr[array_rand($status_arr)];
        
        $stmt = $conn->prepare("INSERT INTO kehadiran (siswa_id, tanggal, status, keterangan) VALUES (?, ?, ?, '')");
        $stmt->bind_param("iss", $sid, $tgl, $status);
        $stmt->execute();
        $count++;
    }
}

echo "✅ Berhasil! Mengisi $count data kehadiran (dummy) untuk bulan ini pada siswa: $ids_str";
?>
