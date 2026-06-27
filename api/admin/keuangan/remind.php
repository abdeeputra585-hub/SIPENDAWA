<?php
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin']);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) $data = $_POST;

$id = (int)($data['id'] ?? 0);

if (!$id) {
    sendResponse(['success' => false, 'message' => 'ID Pembayaran diperlukan'], 400);
}

// Get payment detail
$stmt = $conn->prepare("SELECT p.*, s.nama as nama_siswa FROM pembayaran p JOIN siswa s ON p.id_siswa = s.id WHERE p.id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$pemb = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$pemb || $pemb['status'] === 'Lunas') {
    sendResponse(['success' => false, 'message' => 'Tagihan tidak valid untuk dikirimkan reminder'], 400);
}

// Kirim Notifikasi
$terkirim = 0;
$getWali = $conn->prepare("SELECT w.user_id FROM relasi r JOIN wali w ON r.wali_id = w.id WHERE r.siswa_id = ? AND w.user_id IS NOT NULL");
$getWali->bind_param("i", $pemb['id_siswa']);
$getWali->execute();
$waliRes = $getWali->get_result();

while ($w = $waliRes->fetch_assoc()) {
    $judul = "Reminder Pembayaran Tagihan: " . $pemb['tipe_pembayaran'];
    $pesan = "Mohon segera melunasi tagihan sebesar Rp " . number_format($pemb['jumlah'], 0, ',', '.') . " untuk ananda " . $pemb['nama_siswa'] . ". Jatuh tempo pada: " . date('d M Y', strtotime($pemb['tgl_jatuh_tempo'])) . ".";
    $tipe = ($pemb['status'] === 'Overdue') ? "error" : "warning";

    $nStmt = $conn->prepare("INSERT INTO notifikasi (user_id, judul, pesan, tipe) VALUES (?, ?, ?, ?)");
    $nStmt->bind_param("isss", $w['user_id'], $judul, $pesan, $tipe);
    if($nStmt->execute()) $terkirim++;
    $nStmt->close();
}
$getWali->close();

if ($terkirim > 0) {
    sendResponse(['success' => true, 'message' => 'Reminder berhasil dikirim ke ' . $terkirim . ' wali murid']);
} else {
    sendResponse(['success' => false, 'message' => 'Siswa ini belum memiliki wali murid yang terhubung dengan akun pengguna'], 404);
}
?>
