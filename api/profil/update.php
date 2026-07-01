<?php
/**
 * api/profil/update.php
 * POST - Mengupdate data profil user yang sedang login.
 */
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$authUser = requireAuth();
$userId = $authUser['user_id'];
$role = $authUser['role'];

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    sendResponse(['success' => false, 'message' => 'Data tidak valid'], 400);
}

$nama = trim($data['nama'] ?? '');
$email = trim($data['email'] ?? '');
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($nama) || empty($email) || empty($username)) {
    sendResponse(['success' => false, 'message' => 'Nama, Username, dan Email wajib diisi'], 400);
}

// Cek apakah email sudah dipakai user lain
$cek_email = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
$cek_email->bind_param("si", $email, $userId);
$cek_email->execute();
if ($cek_email->get_result()->num_rows > 0) {
    sendResponse(['success' => false, 'message' => 'Email sudah digunakan'], 400);
}

// Cek apakah username sudah dipakai user lain
$cek_user = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
$cek_user->bind_param("si", $username, $userId);
$cek_user->execute();
if ($cek_user->get_result()->num_rows > 0) {
    sendResponse(['success' => false, 'message' => 'Username sudah digunakan'], 400);
}

$conn->begin_transaction();

try {
    if (!empty($password)) {
        // Update dengan password
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET nama = ?, email = ?, username = ?, password = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $nama, $email, $username, $hashed, $userId);
    } else {
        // Update tanpa password
        $stmt = $conn->prepare("UPDATE users SET nama = ?, email = ?, username = ? WHERE id = ?");
        $stmt->bind_param("sssi", $nama, $email, $username, $userId);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Gagal update tabel users");
    }

    if ($role === 'parent') {
        $telepon = trim($data['telepon'] ?? '');
        $alamat = trim($data['alamat'] ?? '');
        
        // Cek apakah data parent sudah ada
        $cek_parent = $conn->prepare("SELECT id FROM wali_murid WHERE user_id = ?");
        $cek_parent->bind_param("i", $userId);
        $cek_parent->execute();
        
        if ($cek_parent->get_result()->num_rows > 0) {
            $stmt_w = $conn->prepare("UPDATE wali_murid SET nama_wali = ?, telepon = ?, alamat = ? WHERE user_id = ?");
            $stmt_w->bind_param("sssi", $nama, $telepon, $alamat, $userId);
        } else {
            $stmt_w = $conn->prepare("INSERT INTO wali_murid (user_id, nama_wali, telepon, alamat) VALUES (?, ?, ?, ?)");
            $stmt_w->bind_param("isss", $userId, $nama, $telepon, $alamat);
        }
        
        if (!$stmt_w->execute()) {
            throw new Exception("Gagal update tabel wali_murid");
        }
    }

    $conn->commit();
    sendResponse(['success' => true, 'message' => 'Profil berhasil diperbarui']);
} catch (Exception $e) {
    $conn->rollback();
    sendResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
?>
