<?php
/**
 * GET /api/izin/list.php
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

$limit = (int)($_GET['limit'] ?? 10);
$offset = (int)($_GET['offset'] ?? 0);

$query = "
    SELECT a.*, s.nama as nama_siswa 
    FROM absence_requests a
    JOIN siswa s ON a.id_siswa = s.id
    WHERE a.created_by = ?
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
";
$stmt = $conn->prepare($query);
$stmt->bind_param("iii", $userId, $limit, $offset);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

$countStmt = $conn->prepare("SELECT COUNT(*) as total FROM absence_requests WHERE created_by = ?");
$countStmt->bind_param("i", $userId);
$countStmt->execute();
$total = (int)$countStmt->get_result()->fetch_assoc()['total'];

sendResponse([
    'success' => true,
    'data' => [
        'items' => $data,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]
]);
?>
