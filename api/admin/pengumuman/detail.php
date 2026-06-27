<?php
/**
 * GET /api/admin/pengumuman/detail.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin', 'guru']);

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendResponse(['success' => false, 'error' => 'ID tidak valid'], 400);

$query = "
    SELECT p.*, u.nama as penulis_nama
    FROM pengumuman p
    JOIN users u ON p.created_by = u.id
    WHERE p.id = ?
";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) sendResponse(['success' => false, 'error' => 'Data tidak ditemukan'], 404);

sendResponse([
    'success' => true,
    'data' => $res->fetch_assoc()
]);
?>
