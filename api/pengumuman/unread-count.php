<?php
/**
 * GET /api/pengumuman/unread-count.php
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

$query = "
    SELECT COUNT(p.id) as unread
    FROM pengumuman p
    LEFT JOIN pengumuman_dibaca pd ON p.id = pd.id_pengumuman AND pd.id_wali = ?
    WHERE p.status = 'Published' AND pd.id_pengumuman IS NULL
";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

sendResponse([
    'success' => true,
    'data' => [
        'unread' => (int)$res->fetch_assoc()['unread']
    ]
]);
?>
