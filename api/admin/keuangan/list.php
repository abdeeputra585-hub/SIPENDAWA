<?php
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin', 'kepala_sekolah']);

// Auto-update overdue
$conn->query("UPDATE pembayaran SET status = 'Overdue' WHERE status = 'Belum bayar' AND tgl_jatuh_tempo < CURDATE()");

$status = $_GET['status'] ?? '';
$search = $_GET['search'] ?? '';

$sql = "SELECT p.*, s.nama as nama_siswa, s.nisn, s.kelas, i.invoice_number 
        FROM pembayaran p
        JOIN siswa s ON p.id_siswa = s.id
        LEFT JOIN invoice i ON p.id = i.id_pembayaran
        WHERE 1=1";

$types = "";
$params = [];

if ($status !== '') {
    $sql .= " AND p.status = ?";
    $types .= "s";
    $params[] = $status;
}

if ($search !== '') {
    $sql .= " AND (s.nama LIKE ? OR s.nisn LIKE ? OR p.tipe_pembayaran LIKE ?)";
    $types .= "sss";
    $searchWild = "%$search%";
    $params[] = $searchWild;
    $params[] = $searchWild;
    $params[] = $searchWild;
}

$sql .= " ORDER BY p.created_at DESC";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$data = [];
$stats = [
    'total_pendapatan' => 0,
    'menunggu_konfirmasi' => 0,
    'total_tunggakan' => 0
];

while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}
$stmt->close();

// Get general stats
$statSql = "SELECT 
                SUM(CASE WHEN status = 'Lunas' THEN jumlah ELSE 0 END) as total_pendapatan,
                SUM(CASE WHEN status = 'Menunggu Konfirmasi' THEN 1 ELSE 0 END) as menunggu_konfirmasi,
                SUM(CASE WHEN status IN ('Belum bayar', 'Overdue') THEN jumlah ELSE 0 END) as total_tunggakan
            FROM pembayaran";
$statRes = $conn->query($statSql);
if ($statRow = $statRes->fetch_assoc()) {
    $stats['total_pendapatan'] = (float)$statRow['total_pendapatan'];
    $stats['menunggu_konfirmasi'] = (int)$statRow['menunggu_konfirmasi'];
    $stats['total_tunggakan'] = (float)$statRow['total_tunggakan'];
}

sendResponse(['success' => true, 'data' => $data, 'stats' => $stats]);
?>
