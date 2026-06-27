<?php
require_once __DIR__ . '/../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
$authUser = requireAuth(['parent', 'guru']);
$idSender = (int)$authUser['user_id'];

$data = json_decode(file_get_contents('php://input'), true);
$msgId = (int)($data['message_id'] ?? 0);

if ($msgId <= 0) {
    sendResponse(['success' => false, 'error' => 'Invalid ID'], 400);
}

// Hanya sender yang bisa delete pesannya sendiri
$stmt = $conn->prepare("UPDATE messages SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND id_sender = ?");
$stmt->bind_param("ii", $msgId, $idSender);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    sendResponse(['success' => true]);
} else {
    sendResponse(['success' => false, 'error' => 'Not found or not authorized'], 404);
}
?>
