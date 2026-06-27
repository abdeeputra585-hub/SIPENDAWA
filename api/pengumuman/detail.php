<?php
/**
 * GET /api/pengumuman/detail.php
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendResponse(['success' => false, 'error' => 'ID tidak valid'], 400);

$query = "
    SELECT p.*, u.nama as penulis_nama,
           CASE WHEN pd.dibaca_at IS NOT NULL THEN 1 ELSE 0 END as is_read
    FROM pengumuman p
    JOIN users u ON p.created_by = u.id
    LEFT JOIN pengumuman_dibaca pd ON p.id = pd.id_pengumuman AND pd.id_wali = ?
    WHERE p.id = ? AND p.status = 'Published'
";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $userId, $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) sendResponse(['success' => false, 'error' => 'Data tidak ditemukan'], 404);

$data = $res->fetch_assoc();

// Auto mark as read if not read
if (!(bool)$data['is_read']) {
    $stmtMark = $conn->prepare("INSERT IGNORE INTO pengumuman_dibaca (id_pengumuman, id_wali) VALUES (?, ?)");
    $stmtMark->bind_param("ii", $id, $userId);
    $stmtMark->execute();
    $data['is_read'] = 1;
}

sendResponse([
    'success' => true,
    'data' => $data
]);
?>
