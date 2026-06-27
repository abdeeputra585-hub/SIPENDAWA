<?php
/**
 * GET /api/pengumuman/list.php
 * Mengambil daftar pengumuman untuk wali murid (Published only)
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

$limit = (int)($_GET['limit'] ?? 10);
$offset = (int)($_GET['offset'] ?? 0);
$kategori = $_GET['kategori'] ?? 'all';

$whereClauses = ["p.status = 'Published'"];
$params = [];
$types = "";

if ($kategori !== 'all') {
    $whereClauses[] = "p.kategori = ?";
    $params[] = $kategori;
    $types .= "s";
}

$whereSql = implode(' AND ', $whereClauses);

$query = "
    SELECT p.id, p.judul, SUBSTRING(p.konten, 1, 150) as preview, p.kategori, p.created_at, u.nama as penulis_nama,
           CASE WHEN pd.dibaca_at IS NOT NULL THEN 1 ELSE 0 END as is_read
    FROM pengumuman p
    JOIN users u ON p.created_by = u.id
    LEFT JOIN pengumuman_dibaca pd ON p.id = pd.id_pengumuman AND pd.id_wali = ?
    WHERE $whereSql
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
";

// Prepend user_id for the LEFT JOIN
array_unshift($params, $userId);
$types = "i" . $types . "ii";
$params[] = $limit;
$params[] = $offset;

$stmt = $conn->prepare($query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
    $row['preview'] = strip_tags($row['preview']) . '...';
    $data[] = $row;
}

// Count total
$countQuery = "SELECT COUNT(id) as total FROM pengumuman p WHERE $whereSql";
$countTypes = substr($types, 1, -2); // Remove first 'i' and last 'ii'
$countParams = array_slice($params, 1, -2);
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
