<?php
require_once __DIR__ . '/../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
$authUser = requireAuth(['parent', 'guru']);
$role = $authUser['role'];
$targetRole = $role === 'parent' ? 'guru' : 'parent';
$stmt = $conn->prepare("SELECT id, nama, role, avatar as foto FROM users WHERE role = ? ORDER BY nama ASC");
$stmt->bind_param("s", $targetRole);
$stmt->execute();
$res = $stmt->get_result();
$contacts = [];
while ($row = $res->fetch_assoc()) {
    $contacts[] = $row;
}
sendResponse(['success' => true, 'data' => $contacts]);
?>
