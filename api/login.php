<?php
/**
 * api/login.php
 * Login endpoint - kembalikan data user langsung
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$input = getJsonInput();

if (empty($input['email']) || empty($input['password'])) {
    sendResponse(['success' => false, 'message' => 'Email dan password wajib diisi'], 400);
}

$email    = $conn->real_escape_string($input['email']);
$password = $input['password'];

$sql  = "SELECT id, email, password, role, nama, avatar FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    sendResponse(['success' => false, 'message' => 'Database error'], 500);
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendResponse(['success' => false, 'message' => 'Email tidak ditemukan'], 401);
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    sendResponse(['success' => false, 'message' => 'Password salah'], 401);
}

unset($user['password']);

sendResponse([
    'success' => true,
    'message' => 'Login berhasil',
    'data'    => $user
]);

$stmt->close();
$conn->close();
?>
