<?php
/**
 * POST /api/wali/update-profil.php
 * Wali murid dapat memperbarui nama, telepon, alamat, dan password
 */

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth(['parent']);
$userId = (int)$user['user_id'];

if ($method !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method tidak diizinkan'], 405);
}

$input   = getJsonInput();
$nama    = trim($input['nama']        ?? '');
$telepon = trim($input['telepon']     ?? '');
$alamat  = trim($input['alamat']      ?? '');
$oldPwd  = trim($input['old_password'] ?? '');
$newPwd  = trim($input['new_password'] ?? '');

if (empty($nama)) {
    sendResponse(['success' => false, 'error' => 'Nama tidak boleh kosong'], 400);
}

// Update tabel users
$stmt = $conn->prepare("UPDATE users SET nama = ? WHERE id = ?");
if (!$stmt) sendResponse(['success' => false, 'error' => 'DB Users: ' . $conn->error], 500);
$stmt->bind_param("si", $nama, $userId);
$stmt->execute();

// Update tabel wali
$stmtW = $conn->prepare("
    UPDATE wali SET nama = ?, telepon = ?, alamat = ?
    WHERE user_id = ?
");
if (!$stmtW) {
    // Fallback if telepon column is actually no_telepon (depending on db version)
    $stmtW = $conn->prepare("
        UPDATE wali SET nama = ?, no_telepon = ?, alamat = ?
        WHERE user_id = ?
    ");
    if (!$stmtW) sendResponse(['success' => false, 'error' => 'DB Wali: ' . $conn->error], 500);
}
$stmtW->bind_param("sssi", $nama, $telepon, $alamat, $userId);
$stmtW->execute();

// Ganti password jika dikirim
if (!empty($oldPwd) && !empty($newPwd)) {
    $stmtPwd = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmtPwd->bind_param("i", $userId);
    $stmtPwd->execute();
    $row = $stmtPwd->get_result()->fetch_assoc();

    if (!password_verify($oldPwd, $row['password'])) {
        sendResponse(['success' => false, 'error' => 'Password lama salah'], 400);
    }
    if (strlen($newPwd) < 6) {
        sendResponse(['success' => false, 'error' => 'Password baru minimal 6 karakter'], 400);
    }
    $hash    = password_hash($newPwd, PASSWORD_DEFAULT);
    $stmtUpd = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmtUpd->bind_param("si", $hash, $userId);
    $stmtUpd->execute();
}

sendResponse(['success' => true, 'message' => 'Profil berhasil diperbarui']);
?>
