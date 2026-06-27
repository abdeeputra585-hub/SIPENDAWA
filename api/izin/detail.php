<?php
/**
 * GET /api/izin/detail.php
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
    SELECT a.*, s.nama as nama_siswa, u.nama as nama_approver
    FROM absence_requests a
    JOIN siswa s ON a.id_siswa = s.id
    LEFT JOIN users u ON a.approved_by = u.id
    WHERE a.id = ? AND a.created_by = ?
";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $id, $userId);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) sendResponse(['success' => false, 'error' => 'Data tidak ditemukan'], 404);

sendResponse([
    'success' => true,
    'data' => $res->fetch_assoc()
]);
?>
