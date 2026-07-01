<?php
/**
 * api/profil/get.php
 * GET - Mengambil data profil user yang sedang login.
 */
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$authUser = requireAuth();
$userId = $authUser['user_id'];
$role = $authUser['role'];

$query = "SELECT id, email, username, nama, role, avatar, created_at FROM users WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendResponse(['success' => false, 'message' => 'User tidak ditemukan'], 404);
}

$user = $result->fetch_assoc();

if ($role === 'parent') {
    $q_wali = "SELECT id, telepon, alamat FROM wali_murid WHERE user_id = ?";
    $stmt_wali = $conn->prepare($q_wali);
    $stmt_wali->bind_param("i", $userId);
    $stmt_wali->execute();
    $res_wali = $stmt_wali->get_result();
    
    if ($res_wali->num_rows > 0) {
        $wali = $res_wali->fetch_assoc();
        $user['wali_id'] = $wali['id'];
        $user['telepon'] = $wali['telepon'];
        $user['alamat'] = $wali['alamat'];
    } else {
        $user['telepon'] = '-';
        $user['alamat'] = '-';
    }
}

sendResponse(['success' => true, 'data' => $user]);
?>
