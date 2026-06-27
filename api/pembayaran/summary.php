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

$sql = "SELECT 
            SUM(jumlah) as total_tagihan,
            SUM(CASE WHEN status = 'Lunas' THEN jumlah ELSE 0 END) as total_terbayar,
            SUM(CASE WHEN status IN ('Belum bayar', 'Overdue', 'Menunggu Konfirmasi') THEN jumlah ELSE 0 END) as sisa_tagihan,
            SUM(CASE WHEN status = 'Overdue' THEN jumlah ELSE 0 END) as total_overdue
        FROM pembayaran 
        WHERE id_siswa = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_siswa);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

sendResponse([
    'success' => true, 
    'data' => [
        'total_tagihan' => (float)($row['total_tagihan'] ?? 0),
        'total_terbayar' => (float)($row['total_terbayar'] ?? 0),
        'sisa_tagihan' => (float)($row['sisa_tagihan'] ?? 0),
        'total_overdue' => (float)($row['total_overdue'] ?? 0)
    ]
]);
?>
