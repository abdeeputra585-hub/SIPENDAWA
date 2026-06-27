<?php
/**
 * GET /api/admin/pengumuman/list.php
 * Mengambil daftar pengumuman untuk admin/guru
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin', 'guru', 'kepala_sekolah']);

$limit = (int)($_GET['limit'] ?? 20);
$offset = (int)($_GET['offset'] ?? 0);
$kategori = $_GET['kategori'] ?? 'all';
$status = $_GET['status'] ?? 'all';

$whereClauses = ["1=1"];
$params = [];
$types = "";

if ($kategori !== 'all') {
    $whereClauses[] = "p.kategori = ?";
    $params[] = $kategori;
    $types .= "s";
}

if ($status !== 'all') {
    $whereClauses[] = "p.status = ?";
    $params[] = $status;
    $types .= "s";
}

$whereSql = implode(' AND ', $whereClauses);

$query = "
    SELECT p.id, p.judul, p.kategori, p.status, p.created_at, u.nama as penulis_nama,
           (SELECT COUNT(*) FROM pengumuman_dibaca pd WHERE pd.id_pengumuman = p.id) as read_count
    FROM pengumuman p
    JOIN users u ON p.created_by = u.id
    WHERE $whereSql
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
";

$types .= "ii";
$params[] = $limit;
$params[] = $offset;

$stmt = $conn->prepare($query);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

$countQuery = "SELECT COUNT(id) as total FROM pengumuman p WHERE $whereSql";
$countTypes = substr($types, 0, -2);
$countParams = array_slice($params, 0, -2);
$stmtCount = $conn->prepare($countQuery);
if (!empty($countParams)) {
    $stmtCount->bind_param($countTypes, ...$countParams);
}
$stmtCount->execute();
$total = (int)$stmtCount->get_result()->fetch_assoc()['total'];

sendResponse([
    'success' => true,
    'data' => [
        'items' => $data,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]
]);
?>
