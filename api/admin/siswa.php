<?php
/**
 * api/admin/siswa.php
 * GET — list semua siswa untuk keperluan dropdown (admin only)
 * Digunakan oleh form Buat Tagihan Baru di halaman Keuangan
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$authUser = requireAuth();
if (!in_array($authUser['role'], ['admin', 'kepala_sekolah'])) {
    sendResponse(['success' => false, 'message' => 'Akses ditolak'], 403);
}

$sql    = "SELECT s.id, s.nisn, s.nama, s.kelas, s.jenis_kelamin, s.status
           FROM siswa s
           WHERE s.status = 'aktif'
           ORDER BY s.kelas ASC, s.nama ASC";

$result = $conn->query($sql);

if (!$result) {
    sendResponse(['success' => false, 'message' => 'Gagal mengambil data siswa: ' . $conn->error], 500);
}

$list = [];
while ($row = $result->fetch_assoc()) {
    $list[] = $row;
}

sendResponse([
    'success' => true,
    'data'    => $list,
    'total'   => count($list)
]);

$conn->close();
?>
