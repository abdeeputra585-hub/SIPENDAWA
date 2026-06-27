<?php
/**
 * GET /api/admin/izin/pending.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin', 'guru', 'kepala_sekolah']);

$query = "
    SELECT a.*, s.nama as nama_siswa, u.nama as nama_wali
    FROM absence_requests a
    JOIN siswa s ON a.id_siswa = s.id
    JOIN users u ON a.created_by = u.id
    WHERE a.status = 'Pending'
    ORDER BY a.created_at ASC
";
$stmt = $conn->prepare($query);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

sendResponse([
    'success' => true,
    'data' => $data,
    'total' => count($data)
]);
?>
