<?php
/**
 * api/auth/login.php
 * POST — verifikasi email & password, return JWT token + data user
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$input = getJsonInput();

if (empty($input['email']) || empty($input['password'])) {
    sendResponse(['success' => false, 'message' => 'Email dan password wajib diisi'], 400);
}

$email    = trim($input['email']);
$password = $input['password'];

$sql  = "SELECT id, email, password, role, nama, avatar FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendResponse(['success' => false, 'message' => 'Email tidak ditemukan'], 401);
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($password, $user['password'])) {
    sendResponse(['success' => false, 'message' => 'Password salah'], 401);
}

unset($user['password']);

// Generate JWT token dengan payload role dan user_id
$token = generateToken([
    'user_id' => $user['id'],
    'email'   => $user['email'],
    'role'    => $user['role']
]);

sendResponse([
    'success' => true,
    'message' => 'Login berhasil',
    'token'   => $token,
    'data'    => $user
]);

$conn->close();
?>
