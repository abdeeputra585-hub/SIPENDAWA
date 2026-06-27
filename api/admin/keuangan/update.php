<?php
/**
 * POST /api/admin/keuangan/update.php
 * Edit nominal, jatuh tempo, catatan tagihan
 */
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

requireAuth(['admin']);
$input = getJsonInput();

$id     = (int)($input['id']              ?? 0);
$jumlah = (float)($input['jumlah']        ?? 0);
$tempo  = trim($input['tgl_jatuh_tempo']  ?? '');
$tipe   = trim($input['tipe_pembayaran']  ?? '');
$catatan= trim($input['catatan']          ?? '');

if ($id <= 0 || $jumlah <= 0 || empty($tempo)) {
    sendResponse(['success' => false, 'message' => 'Data tidak lengkap'], 400);
}

// Hanya bisa edit jika belum lunas
$cek = $conn->prepare("SELECT status FROM pembayaran WHERE id = ?");
$cek->bind_param("i", $id);
$cek->execute();
$row = $cek->get_result()->fetch_assoc();
if (!$row) {
    sendResponse(['success' => false, 'message' => 'Tagihan tidak ditemukan'], 404);
}
if ($row['status'] === 'Lunas') {
    sendResponse(['success' => false, 'message' => 'Tagihan yang sudah lunas tidak bisa diubah'], 403);
}

$stmt = $conn->prepare("UPDATE pembayaran SET jumlah = ?, tgl_jatuh_tempo = ?, tipe_pembayaran = ?, catatan = ? WHERE id = ?");
$stmt->bind_param("dsssi", $jumlah, $tempo, $tipe, $catatan, $id);
if ($stmt->execute()) {
    sendResponse(['success' => true, 'message' => 'Tagihan berhasil diperbarui']);
} else {
    sendResponse(['success' => false, 'message' => 'Gagal memperbarui tagihan'], 500);
}
$conn->close();
?>
