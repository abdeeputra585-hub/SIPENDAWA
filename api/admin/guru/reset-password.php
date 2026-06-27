<?php
/**
 * POST /api/admin/guru/reset-password.php
 * Reset password guru
 */

require_once __DIR__ . '/../../config.php';
$guruConfig = require __DIR__ . '/../../../config/guru-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin']);

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    sendResponse(['success' => false, 'error' => 'ID guru tidak valid'], 400);
}

$stmt = $conn->prepare("SELECT email FROM users WHERE id = ? AND role = 'guru'");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    sendResponse(['success' => false, 'error' => 'Guru tidak ditemukan'], 404);
}
$email = $res->fetch_assoc()['email'];

$newPassword = bin2hex(random_bytes($guruConfig['default_password_length'] / 2));
$hash = password_hash($newPassword, PASSWORD_BCRYPT);

$stmtUpd = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
$stmtUpd->bind_param("si", $hash, $id);
$stmtUpd->execute();

// OPTIONAL: Send email
// mail($email, "Reset Password SIPENDAWA", "Password baru Anda: $newPassword");

sendResponse([
    'success' => true,
    'message' => 'Password berhasil direset',
    'password_sent_to' => $email,
    'new_password_note' => "Password baru: $newPassword (Harap sampaikan ke guru jika email tidak aktif)"
]);
?>

