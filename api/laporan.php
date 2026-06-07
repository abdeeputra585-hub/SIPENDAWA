<?php
/**
 * api/laporan.php
 * GET — laporan relasi siswa-wali dengan filter kelas & tanggal
 *
 * BUG FIX: Filter kelas & tanggal pakai prepared statement (bukan string interpolasi)
 * AKSES: admin & kepala_sekolah (read-only)
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

// Laporan hanya untuk admin dan kepala_sekolah
requireAuth(['admin', 'kepala_sekolah']);

$kelas  = isset($_GET['kelas'])  && $_GET['kelas']  !== '' ? trim($_GET['kelas'])  : null;
$dari   = isset($_GET['dari'])   && $_GET['dari']   !== '' ? trim($_GET['dari'])   : null;
$sampai = isset($_GET['sampai']) && $_GET['sampai'] !== '' ? trim($_GET['sampai']) : null;

// FIX: Bangun query dengan prepared statement
$conditions  = [];
$bindTypes   = '';
$bindValues  = [];

$sql = "SELECT w.nama as wali_nama, w.telepon,
               s.nama as siswa_nama, s.kelas,
               r.tipe as hubungan, r.status,
               r.created_at
        FROM relasi r
        JOIN siswa s ON r.siswa_id = s.id
        JOIN wali  w ON r.wali_id  = w.id";

if ($kelas) {
    $conditions[] = "s.kelas LIKE ?";
    $bindTypes   .= 's';
    $bindValues[] = '%' . $kelas . '%';
}
if ($dari) {
    $conditions[] = "DATE(r.created_at) >= ?";
    $bindTypes   .= 's';
    $bindValues[] = $dari;
}
if ($sampai) {
    $conditions[] = "DATE(r.created_at) <= ?";
    $bindTypes   .= 's';
    $bindValues[] = $sampai;
}

if ($conditions) {
    $sql .= " WHERE " . implode(' AND ', $conditions);
}
$sql .= " ORDER BY s.kelas, s.nama";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    sendResponse(['success' => false, 'message' => 'Database error: ' . $conn->error], 500);
}

if ($bindValues) {
    $stmt->bind_param($bindTypes, ...$bindValues);
}

$stmt->execute();
$result      = $stmt->get_result();
$laporanList = [];
while ($row = $result->fetch_assoc()) {
    $laporanList[] = $row;
}
$stmt->close();

sendResponse([
    'success' => true,
    'data'    => $laporanList,
    'total'   => count($laporanList)
]);

$conn->close();
?>
