<?php
/**
 * GET /api/admin/guru/list.php
 * Mengambil daftar guru untuk admin panel
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once __DIR__ . '/../../config.php';
    $configFile = __DIR__ . '/../../../config/guru-config.php';
    if (!file_exists($configFile)) {
        sendResponse(['success' => false, 'message' => 'File config/guru-config.php tidak ditemukan!'], 500);
    }
    $guruConfig = require $configFile;

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }

// Validasi JWT dan Role Admin
requireAuth(['admin']);

// Params
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? 'all';
$limit = (int)($_GET['limit'] ?? $guruConfig['default_list_limit']);
$offset = (int)($_GET['offset'] ?? 0);

if ($limit <= 0) $limit = 20;
if ($offset < 0) $offset = 0;

$whereClauses = ["u.role = 'guru'"];
$params = [];
$types = "";

if ($search !== '') {
    $whereClauses[] = "(u.nama LIKE ? OR u.email LIKE ? OR gp.nip LIKE ?)";
    $likeSearch = "%{$search}%";
    $params[] = $likeSearch;
    $params[] = $likeSearch;
    $params[] = $likeSearch;
    $types .= "sss";
}

if ($status === 'active') {
    $whereClauses[] = "gp.is_active = 1";
} elseif ($status === 'inactive') {
    $whereClauses[] = "gp.is_active = 0";
}

$whereSql = implode(' AND ', $whereClauses);

// Query utama
$query = "
    SELECT u.id, u.nama, u.email, u.avatar as foto,
           gp.nip, gp.no_telepon, gp.status_pegawai, gp.is_active, gp.last_login, u.created_at,
           (SELECT GROUP_CONCAT(mp.nama_pelajaran SEPARATOR ', ') 
            FROM guru_mata_pelajaran gmp 
            JOIN mata_pelajaran mp ON gmp.mata_pelajaran_id = mp.id 
            WHERE gmp.guru_profile_id = gp.id) as mata_pelajaran,
           (SELECT GROUP_CONCAT(k.nama_kelas SEPARATOR ', ') 
            FROM guru_kelas gk 
            JOIN kelas k ON gk.kelas_id = k.id 
            WHERE gk.guru_profile_id = gp.id) as kelas_ampuan
    FROM users u
    LEFT JOIN guru_profiles gp ON u.id = gp.user_id
    WHERE $whereSql
    ORDER BY u.nama ASC
    LIMIT ? OFFSET ?
";

$types .= "ii";
$params[] = $limit;
$params[] = $offset;

$stmt = $conn->prepare($query);
if (!$stmt) {
    sendResponse(['success' => false, 'message' => 'Query Error: ' . $conn->error], 400);
}
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
if (!$stmt->execute()) {
    sendResponse(['success' => false, 'message' => 'Execute Error: ' . $stmt->error], 400);
}
$res = $stmt->get_result();

$teachers = [];
while ($row = $res->fetch_assoc()) {
    $teachers[] = [
        'id' => (int)$row['id'],
        'nip' => $row['nip'],
        'nama' => $row['nama'],
        'email' => $row['email'],
        'no_telepon' => $row['no_telepon'],
        'mata_pelajaran' => $row['mata_pelajaran'],
        'kelas_ampuan' => $row['kelas_ampuan'],
        'status_pegawai' => $row['status_pegawai'],
        'is_active' => (bool)$row['is_active'],
        'last_login' => $row['last_login'],
        'created_at' => $row['created_at'],
        'foto' => $row['foto']
    ];
}

// Query total
$countQuery = "SELECT COUNT(u.id) as total FROM users u LEFT JOIN guru_profiles gp ON u.id = gp.user_id WHERE $whereSql";
$countTypes = substr($types, 0, -2); // Remove last 'ii'
$countParams = array_slice($params, 0, -2);

$stmtCount = $conn->prepare($countQuery);
if (!$stmtCount) {
    sendResponse(['success' => false, 'message' => 'Count Query Error: ' . $conn->error], 400);
}
if (!empty($countParams)) {
    $stmtCount->bind_param($countTypes, ...$countParams);
}
if (!$stmtCount->execute()) {
    sendResponse(['success' => false, 'message' => 'Count Execute Error: ' . $stmtCount->error], 400);
}
$total = (int)$stmtCount->get_result()->fetch_assoc()['total'];

    sendResponse([
        'success' => true,
        'data' => [
            'teachers' => $teachers,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]
    ]);
} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Fatal Error: ' . $e->getMessage()], 400);
}
?>

