<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent', 'admin']);
$id_siswa = (int)($_GET['id_siswa'] ?? 0);

if (!$id_siswa) {
    sendResponse(['success' => false, 'message' => 'ID Siswa diperlukan'], 400);
}

// Update status to Overdue if needed
$conn->query("UPDATE pembayaran SET status = 'Overdue' WHERE status = 'Belum bayar' AND tgl_jatuh_tempo < CURDATE()");

$sql = "SELECT p.*, i.invoice_number 
        FROM pembayaran p 
        LEFT JOIN invoice i ON p.id = i.id_pembayaran 
        WHERE p.id_siswa = ? 
        ORDER BY p.tgl_jatuh_tempo DESC, p.created_at DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_siswa);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

sendResponse(['success' => true, 'data' => $data]);
?>
