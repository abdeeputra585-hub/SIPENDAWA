<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent', 'admin']);
$id = (int)($_GET['id'] ?? 0);

if (!$id) {
    sendResponse(['success' => false, 'message' => 'ID Pembayaran diperlukan'], 400);
}

$sql = "SELECT p.*, i.invoice_number, i.created_at as invoice_date, s.nama as nama_siswa, s.nisn, s.kelas
        FROM pembayaran p 
        LEFT JOIN invoice i ON p.id = i.id_pembayaran 
        JOIN siswa s ON p.id_siswa = s.id
        WHERE p.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    sendResponse(['success' => false, 'message' => 'Pembayaran tidak ditemukan'], 404);
}

sendResponse(['success' => true, 'data' => $row]);
?>
