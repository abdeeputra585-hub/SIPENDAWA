<?php
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin']);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) $data = $_POST;

$id_siswa = (int)($data['id_siswa'] ?? 0);
$tipe_pembayaran = trim($data['tipe_pembayaran'] ?? '');
$jumlah = (float)($data['jumlah'] ?? 0);
$tgl_jatuh_tempo = trim($data['tgl_jatuh_tempo'] ?? '');
$catatan = trim($data['catatan'] ?? '');

if (!$id_siswa || !$tipe_pembayaran || !$jumlah || !$tgl_jatuh_tempo) {
    sendResponse(['success' => false, 'message' => 'Semua kolom wajib diisi'], 400);
}

// Cek siswa
$cekSiswa = $conn->prepare("SELECT id, nama FROM siswa WHERE id = ?");
$cekSiswa->bind_param("i", $id_siswa);
$cekSiswa->execute();
$siswa = $cekSiswa->get_result()->fetch_assoc();
$cekSiswa->close();

if (!$siswa) {
    sendResponse(['success' => false, 'message' => 'Siswa tidak ditemukan'], 404);
}

$stmt = $conn->prepare("INSERT INTO pembayaran (id_siswa, tipe_pembayaran, jumlah, tgl_jatuh_tempo, catatan, status) VALUES (?, ?, ?, ?, ?, 'Belum bayar')");
$stmt->bind_param("isdss", $id_siswa, $tipe_pembayaran, $jumlah, $tgl_jatuh_tempo, $catatan);

if ($stmt->execute()) {
    $id_pemb = $stmt->insert_id;
    
    // Kirim notifikasi ke parent jika ada
    $getWali = $conn->prepare("SELECT w.user_id FROM relasi r JOIN wali w ON r.wali_id = w.id WHERE r.siswa_id = ? AND w.user_id IS NOT NULL");
    $getWali->bind_param("i", $id_siswa);
    $getWali->execute();
    $waliRes = $getWali->get_result();
    while ($w = $waliRes->fetch_assoc()) {
        $notifUserId = $w['user_id'];
        $judul = "Tagihan Baru: " . $tipe_pembayaran;
        $pesan = "Terdapat tagihan baru sebesar Rp " . number_format($jumlah, 0, ',', '.') . " untuk ananda " . $siswa['nama'] . " dengan jatuh tempo " . date('d M Y', strtotime($tgl_jatuh_tempo)) . ".";
        $nStmt = $conn->prepare("INSERT INTO notifikasi (user_id, judul, pesan, tipe) VALUES (?, ?, ?, 'info')");
        $nStmt->bind_param("iss", $notifUserId, $judul, $pesan);
        $nStmt->execute();
        $nStmt->close();
    }
    $getWali->close();

    sendResponse(['success' => true, 'message' => 'Tagihan berhasil dibuat']);
} else {
    sendResponse(['success' => false, 'message' => 'Gagal membuat tagihan: ' . $stmt->error], 500);
}
?>
