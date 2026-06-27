<?php
/**
 * POST /api/admin/izin/reject.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin']);
$userId = (int)$authUser['user_id'];

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$ids = $data['ids'] ?? [];
$catatan = $data['catatan'] ?? '';

if (empty($ids) || !is_array($ids)) {
    sendResponse(['success' => false, 'error' => 'Tidak ada pengajuan yang dipilih'], 400);
}

if (empty($catatan)) {
    sendResponse(['success' => false, 'error' => 'Catatan penolakan wajib diisi'], 400);
}

$successCount = 0;
foreach ($ids as $id) {
    $id = (int)$id;
    $stmt = $conn->prepare("UPDATE absence_requests SET status = 'Rejected', approved_by = ?, catatan_approval = ? WHERE id = ? AND status = 'Pending'");
    $stmt->bind_param("isi", $userId, $catatan, $id);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        $successCount++;
    }
}

sendResponse([
    'success' => true,
    'message' => "$successCount pengajuan berhasil ditolak"
]);
?>
