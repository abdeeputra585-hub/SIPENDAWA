<?php
/**
 * GET /api/chat/list.php
 * Mengambil daftar percakapan aktif untuk user yang login
 */

require_once __DIR__ . '/../config.php';
$pesanConfig = require __DIR__ . '/../../config/pesan-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent', 'guru']);
$userId = (int)$authUser['user_id'];
$role = $authUser['role'];

$limit = (int)($_GET['limit'] ?? $pesanConfig['default_list_limit']);
$offset = (int)($_GET['offset'] ?? 0);

if ($limit <= 0) $limit = 20;
if ($offset < 0) $offset = 0;

if ($role === 'parent') {
    $query = "
        SELECT c.id, 
               c.id_guru as id_other_user, 
               u.nama as other_user_name, 
               u.avatar as other_user_foto,
               'Guru' as other_user_role,
               c.last_message_preview, 
               c.last_message_at,
               (SELECT COUNT(id) FROM messages m WHERE m.id_recipient = ? AND m.id_sender = c.id_guru AND m.dibaca = 0 AND m.is_deleted = 0) as unread_count,
               (SELECT attachment FROM messages m WHERE m.id = c.last_message_id) as last_attachment
        FROM conversations c
        JOIN users u ON c.id_guru = u.id
        WHERE c.id_wali = ?
        ORDER BY c.last_message_at DESC
        LIMIT ? OFFSET ?
    ";
} else {
    $query = "
        SELECT c.id, 
               c.id_wali as id_other_user, 
               u.nama as other_user_name, 
               u.avatar as other_user_foto,
               'Wali Murid' as other_user_role,
               c.last_message_preview, 
               c.last_message_at,
               (SELECT COUNT(id) FROM messages m WHERE m.id_recipient = ? AND m.id_sender = c.id_wali AND m.dibaca = 0 AND m.is_deleted = 0) as unread_count,
               (SELECT attachment FROM messages m WHERE m.id = c.last_message_id) as last_attachment
        FROM conversations c
        JOIN users u ON c.id_wali = u.id
        WHERE c.id_guru = ?
        ORDER BY c.last_message_at DESC
        LIMIT ? OFFSET ?
    ";
}

$stmt = $conn->prepare($query);
$stmt->bind_param("iiii", $userId, $userId, $limit, $offset);
$stmt->execute();
$res = $stmt->get_result();

$conversations = [];
while ($row = $res->fetch_assoc()) {
    $conversations[] = [
        'id' => (int)$row['id'],
        'id_other_user' => (int)$row['id_other_user'],
        'other_user_name' => $row['other_user_name'],
        'other_user_foto' => $row['other_user_foto'],
        'other_user_role' => $row['other_user_role'],
        'last_message_preview' => $row['last_message_preview'],
        'last_message_at' => $row['last_message_at'],
        'unread_count' => (int)$row['unread_count'],
        'has_attachment' => !empty($row['last_attachment'])
    ];
}

// Get total count
$stmtTotal = $conn->prepare("SELECT COUNT(id) as total FROM conversations WHERE " . ($role === 'parent' ? "id_wali" : "id_guru") . " = ?");
$stmtTotal->bind_param("i", $userId);
$stmtTotal->execute();
$total = (int)$stmtTotal->get_result()->fetch_assoc()['total'];

sendResponse([
    'success' => true,
    'conversations' => $conversations,
    'total' => $total
]);
?>
