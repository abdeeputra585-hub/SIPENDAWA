<?php
/**
 * POST /api/admin/guru/toggle-status.php
 * Toggle is_active guru antara aktif (1) dan nonaktif (0)
 */
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

requireAuth(['admin']);
$input = getJsonInput();
$id = (int)($input['id'] ?? 0);

if ($id <= 0) {
    sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);
}

// Cek kondisi sekarang
$cek = $conn->prepare("SELECT gp.is_active, u.nama FROM guru_profiles gp JOIN users u ON gp.user_id = u.id WHERE gp.user_id = ?");
$cek->bind_param("i", $id);
$cek->execute();
$row = $cek->get_result()->fetch_assoc();
if (!$row) {
    sendResponse(['success' => false, 'message' => 'Guru tidak ditemukan'], 404);
}

$newStatus = $row['is_active'] ? 0 : 1;
$label     = $newStatus ? 'diaktifkan' : 'dinonaktifkan';

$stmt = $conn->prepare("UPDATE guru_profiles SET is_active = ? WHERE user_id = ?");
$stmt->bind_param("ii", $newStatus, $id);
if ($stmt->execute()) {
    sendResponse([
        'success'    => true,
        'message'    => "Guru {$row['nama']} berhasil $label",
        'new_status' => $newStatus
    ]);
} else {
    sendResponse(['success' => false, 'message' => 'Gagal mengubah status guru'], 500);
}
$conn->close();
?>
