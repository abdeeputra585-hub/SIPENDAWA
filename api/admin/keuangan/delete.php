<?php
/**
 * POST /api/admin/keuangan/delete.php
 * Hapus tagihan yang masih berstatus 'Belum bayar'
 */
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

requireAuth(['admin', 'kepala_sekolah']);
$input = getJsonInput();
$id = (int)($input['id'] ?? 0);

if ($id <= 0) {
    sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);
}

// Cek status dulu — hanya boleh hapus jika belum bayar
$cek = $conn->prepare("SELECT id, status FROM pembayaran WHERE id = ?");
$cek->bind_param("i", $id);
$cek->execute();
$row = $cek->get_result()->fetch_assoc();

if (!$row) {
    sendResponse(['success' => false, 'message' => 'Tagihan tidak ditemukan'], 404);
}
if (!in_array($row['status'], ['Belum bayar', 'Overdue'])) {
    sendResponse(['success' => false, 'message' => 'Hanya tagihan berstatus "Belum bayar" yang bisa dihapus'], 403);
}

$del = $conn->prepare("DELETE FROM pembayaran WHERE id = ?");
$del->bind_param("i", $id);
if ($del->execute()) {
    sendResponse(['success' => true, 'message' => 'Tagihan berhasil dihapus']);
} else {
    sendResponse(['success' => false, 'message' => 'Gagal menghapus tagihan'], 500);
}
$conn->close();
?>
