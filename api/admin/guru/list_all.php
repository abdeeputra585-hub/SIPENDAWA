<?php
/**
 * api/admin/guru/list_all.php
 * GET — list semua guru untuk dropdown (tanpa paginasi)
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$authUser = requireAuth();
if (!in_array($authUser['role'], ['admin', 'kepala_sekolah'])) {
    sendResponse(['success' => false, 'message' => 'Akses ditolak'], 403);
}

// Fetch active teachers
$query = "
    SELECT gp.id as guru_profile_id, u.nama, gp.nip 
    FROM guru_profiles gp 
    JOIN users u ON gp.user_id = u.id 
    WHERE gp.is_active = 1 
    ORDER BY u.nama ASC
";

$result = $conn->query($query);

if (!$result) {
    sendResponse(['success' => false, 'message' => 'Gagal mengambil data guru'], 500);
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

sendResponse(['success' => true, 'data' => $data]);
?>
