<?php
/**
 * PUT /api/pengumuman/mark-read.php
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$id = (int)($data['id'] ?? 0);

if ($id <= 0) sendResponse(['success' => false, 'error' => 'ID tidak valid'], 400);

$stmt = $conn->prepare("INSERT IGNORE INTO pengumuman_dibaca (id_pengumuman, id_wali) VALUES (?, ?)");
$stmt->bind_param("ii", $id, $userId);

if ($stmt->execute()) {
    sendResponse([
        'success' => true,
        'message' => 'Telah dibaca'
    ]);
} else {
    sendResponse(['success' => false, 'error' => 'Gagal'], 500);
}
?>
