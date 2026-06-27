<?php
/**
 * GET /api/admin/izin/history.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin', 'guru']);

$limit = (int)($_GET['limit'] ?? 20);
$offset = (int)($_GET['offset'] ?? 0);

$query = "
    SELECT a.*, s.nama as nama_siswa, u.nama as nama_wali, ap.nama as nama_approver
    FROM absence_requests a
    JOIN siswa s ON a.id_siswa = s.id
    JOIN users u ON a.created_by = u.id
    LEFT JOIN users ap ON a.approved_by = ap.id
    WHERE a.status != 'Pending'
    ORDER BY a.updated_at DESC
    LIMIT ? OFFSET ?
";
$stmt = $conn->prepare($query);
$stmt->bind_param("ii", $limit, $offset);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

$countStmt = $conn->prepare("SELECT COUNT(*) as total FROM absence_requests WHERE status != 'Pending'");
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
