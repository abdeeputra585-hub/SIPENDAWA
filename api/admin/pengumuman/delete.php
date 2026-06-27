<?php
/**
 * DELETE /api/admin/pengumuman/delete.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin', 'guru']);

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendResponse(['success' => false, 'error' => 'ID tidak valid'], 400);

$stmt = $conn->prepare("DELETE FROM pengumuman WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    sendResponse([
        'success' => true,
        'message' => 'Pengumuman berhasil dihapus'
    ]);
} else {
    sendResponse(['success' => false, 'error' => 'Gagal menghapus data'], 500);
}
?>
