<?php
require_once __DIR__ . '/../api/config.php';

$siswaIds = [];
$res = $conn->query("SELECT id FROM siswa LIMIT 6");
while ($row = $res->fetch_assoc()) {
    $siswaIds[] = (int)$row['id'];
}

if (empty($siswaIds)) {
    die("Tidak ada data siswa untuk dibuatkan dummy tagihan.");
}

$bulanIni = date('Y-m-d', strtotime('+5 days'));
$bulanLalu = date('Y-m-d', strtotime('-25 days'));
$tglBayar = date('Y-m-d H:i:s', strtotime('-10 days'));

foreach ($siswaIds as $id_siswa) {
    // 1. Tagihan bulan ini (Belum Bayar)
    $stmt = $conn->prepare("INSERT INTO pembayaran (id_siswa, tipe_pembayaran, jumlah, tgl_jatuh_tempo, status) VALUES (?, 'SPP Bulan Ini', 500000, ?, 'Belum bayar')");
    $stmt->bind_param("is", $id_siswa, $bulanIni);
    if (!$stmt->execute()) {
        die("Error SPP Bulan Ini: " . $stmt->error);
    }
    $stmt->close();

    // 2. Tagihan buku (Lunas)
    $stmt = $conn->prepare("INSERT INTO pembayaran (id_siswa, tipe_pembayaran, jumlah, tgl_jatuh_tempo, status, tgl_bayar) VALUES (?, 'Buku Paket Semester 1', 350000, ?, 'Lunas', ?)");
    $stmt->bind_param("iss", $id_siswa, $bulanIni, $tglBayar);
    if (!$stmt->execute()) {
        die("Error Buku: " . $stmt->error);
    }
    $id_pemb = $stmt->insert_id;
    $stmt->close();
    
    // Buat invoice untuk yang lunas
    $invNum = 'INV-' . date('Ymd') . '-' . str_pad($id_pemb, 4, '0', STR_PAD_LEFT);
    $conn->query("INSERT INTO invoice (id_pembayaran, invoice_number) VALUES ($id_pemb, '$invNum')");

    // 3. Tagihan bulan lalu (Overdue) - hanya untuk siswa genap
    if ($id_siswa % 2 == 0) {
        $stmt = $conn->prepare("INSERT INTO pembayaran (id_siswa, tipe_pembayaran, jumlah, tgl_jatuh_tempo, status) VALUES (?, 'SPP Bulan Lalu', 500000, ?, 'Overdue')");
        $stmt->bind_param("is", $id_siswa, $bulanLalu);
        if (!$stmt->execute()) {
            die("Error SPP Bulan Lalu: " . $stmt->error);
        }
        $stmt->close();
    }
}

echo "Dummy data berhasil dimasukkan!\n";
$conn->close();
?>
