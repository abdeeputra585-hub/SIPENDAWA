<?php
/**
 * GET /api/admin/guru/detail.php
 * Mengambil detail guru
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin']);

$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    sendResponse(['success' => false, 'error' => 'ID guru tidak valid'], 400);
}

// Query
$query = "
    SELECT u.id, u.nama, u.email, u.avatar as foto,
           gp.nip, gp.no_telepon, gp.alamat, gp.tanggal_lahir, gp.jenis_kelamin, 
           gp.status_pegawai, gp.is_active, gp.last_login, u.created_at
    FROM users u
    JOIN guru_profiles gp ON u.id = gp.user_id
    WHERE u.id = ? AND u.role = 'guru'
";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    sendResponse(['success' => false, 'error' => 'Guru tidak ditemukan'], 404);
}

$guru = $res->fetch_assoc();

// Get mapel
$guruProfileIdQuery = "SELECT id FROM guru_profiles WHERE user_id = ?";
$stmtGp = $conn->prepare($guruProfileIdQuery);
$stmtGp->bind_param("i", $id);
$stmtGp->execute();
$gpRes = $stmtGp->get_result()->fetch_assoc();
$gpId = $gpRes['id'];

$mapelQuery = "
    SELECT mp.id, mp.nama_pelajaran 
    FROM guru_mata_pelajaran gmp 
    JOIN mata_pelajaran mp ON gmp.mata_pelajaran_id = mp.id 
    WHERE gmp.guru_profile_id = ?
";
$stmtMapel = $conn->prepare($mapelQuery);
$stmtMapel->bind_param("i", $gpId);
$stmtMapel->execute();
$mapelRes = $stmtMapel->get_result();
$mapel = [];
while ($m = $mapelRes->fetch_assoc()) {
    $mapel[] = $m;
}

// Get kelas
$kelasQuery = "
    SELECT k.id, k.nama_kelas 
    FROM guru_kelas gk 
    JOIN kelas k ON gk.kelas_id = k.id 
    WHERE gk.guru_profile_id = ?
";
$stmtKelas = $conn->prepare($kelasQuery);
$stmtKelas->bind_param("i", $gpId);
$stmtKelas->execute();
$kelasRes = $stmtKelas->get_result();
$kelas = [];
while ($k = $kelasRes->fetch_assoc()) {
    $kelas[] = $k;
}

$guru['mata_pelajaran_detail'] = $mapel;
$guru['kelas_ampuan_detail'] = $kelas;

// Format for simpler arrays as requested
$guru['mata_pelajaran'] = array_map(function($m) { return $m['nama_pelajaran']; }, $mapel);
$guru['mata_pelajaran_ids'] = array_map(function($m) { return $m['id']; }, $mapel);
$guru['kelas_ampuan'] = array_map(function($k) { return $k['nama_kelas']; }, $kelas);
$guru['kelas_ampuan_ids'] = array_map(function($k) { return $k['id']; }, $kelas);

sendResponse([
    'success' => true,
    'data' => $guru
]);
?>

