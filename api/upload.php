<?php
/**
 * api/upload.php
 * POST — upload foto profil wali/siswa
 *
 * Form fields:
 *   foto (file)      — gambar yang diupload
 *   type (string)    — 'siswa' | 'wali' | 'profil' (user sendiri)
 *   id   (int)       — ID record yang akan diupdate
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$authUser = requireAuth(['admin', 'parent', 'kepala_sekolah']);
$type     = $_POST['type'] ?? '';
$recordId = (int)($_POST['id'] ?? 0);

// ── Validasi input ────────────────────────────────────────────────────────────
if (!in_array($type, ['siswa', 'wali', 'profil'])) {
    sendResponse(['success' => false, 'message' => 'Tipe upload tidak valid'], 400);
}

if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    $errMsg = match($_FILES['foto']['error'] ?? -1) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Ukuran file terlalu besar (maks 3MB)',
        UPLOAD_ERR_NO_FILE  => 'Tidak ada file yang diunggah',
        default             => 'Terjadi kesalahan saat mengunggah file'
    };
    sendResponse(['success' => false, 'message' => $errMsg], 400);
}

$file     = $_FILES['foto'];
$maxSize  = 3 * 1024 * 1024; // 3MB
$allowed  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// ── Validasi file ─────────────────────────────────────────────────────────────
if ($file['size'] > $maxSize) {
    sendResponse(['success' => false, 'message' => 'Ukuran file melebihi 3MB'], 400);
}

// Deteksi MIME type yang sebenarnya (bukan dari header)
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowed)) {
    sendResponse(['success' => false, 'message' => 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP'], 400);
}

// ── Permission check per tipe ─────────────────────────────────────────────────
$role   = $authUser['role'];
$userId = (int)$authUser['user_id'];

if ($type === 'siswa' && $role !== 'admin') {
    sendResponse(['success' => false, 'message' => 'Hanya admin yang bisa upload foto siswa'], 403);
}

if ($type === 'wali' && $role !== 'admin') {
    sendResponse(['success' => false, 'message' => 'Hanya admin yang bisa mengubah foto wali lain'], 403);
}

// ── Tentukan folder dan nama file ─────────────────────────────────────────────
$uploadBase = dirname(__DIR__) . '/uploads/';

$subfolder  = match($type) {
    'siswa'  => 'siswa/',
    'wali'   => 'wali/',
    'profil' => 'profil/',
    default  => 'profil/'
};

$uploadDir = $uploadBase . $subfolder;

// Generate nama unik
$ext      = match($mimeType) {
    'image/jpeg', 'image/jpg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    default      => 'jpg'
};
$filename = $type . '_' . ($recordId ?: $userId) . '_' . time() . '.' . $ext;
$fullPath = $uploadDir . $filename;
$webPath  = 'uploads/' . $subfolder . $filename;

// ── Pindahkan file ───────────────────────────────────────────────────────────
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
    sendResponse(['success' => false, 'message' => 'Gagal menyimpan file. Cek permission folder uploads/'], 500);
}

// ── Update database ──────────────────────────────────────────────────────────
$updated = false;
$oldFoto = null;

switch ($type) {

    case 'siswa':
        // Hapus foto lama
        $old = $conn->prepare("SELECT foto FROM siswa WHERE id = ?");
        $old->bind_param("i", $recordId);
        $old->execute();
        $oldRow = $old->get_result()->fetch_assoc();
        $old->close();
        if ($oldRow) $oldFoto = $oldRow['foto'];

        $stmt = $conn->prepare("UPDATE siswa SET foto = ? WHERE id = ?");
        $stmt->bind_param("si", $webPath, $recordId);
        $updated = $stmt->execute() && $stmt->affected_rows > 0;
        $stmt->close();
        break;

    case 'wali':
        $old = $conn->prepare("SELECT foto FROM wali WHERE id = ?");
        $old->bind_param("i", $recordId);
        $old->execute();
        $oldRow = $old->get_result()->fetch_assoc();
        $old->close();
        if ($oldRow) $oldFoto = $oldRow['foto'];

        $stmt = $conn->prepare("UPDATE wali SET foto = ? WHERE id = ?");
        $stmt->bind_param("si", $webPath, $recordId);
        $updated = $stmt->execute() && $stmt->affected_rows > 0;
        $stmt->close();
        break;

    case 'profil':
        // Update avatar di tabel users (user yang sedang login)
        $targetId = $recordId ?: $userId;

        $old = $conn->prepare("SELECT avatar FROM users WHERE id = ?");
        $old->bind_param("i", $targetId);
        $old->execute();
        $oldRow = $old->get_result()->fetch_assoc();
        $old->close();
        if ($oldRow) $oldFoto = $oldRow['avatar'];

        $stmt = $conn->prepare("UPDATE users SET avatar = ? WHERE id = ?");
        $stmt->bind_param("si", $webPath, $targetId);
        $updated = $stmt->execute() && $stmt->affected_rows > 0;
        $stmt->close();

        // Juga update di tabel wali jika ada (berdasarkan email)
        $emailStmt = $conn->prepare("SELECT email FROM users WHERE id = ?");
        $emailStmt->bind_param("i", $targetId);
        $emailStmt->execute();
        $emailRow = $emailStmt->get_result()->fetch_assoc();
        $emailStmt->close();
        if ($emailRow && $emailRow['email']) {
            $waliStmt = $conn->prepare("UPDATE wali SET foto = ? WHERE email = ?");
            $waliStmt->bind_param("ss", $webPath, $emailRow['email']);
            $waliStmt->execute();
            $waliStmt->close();
        }
        break;
}

// Hapus file lama jika ada
if ($oldFoto && file_exists(dirname(__DIR__) . '/' . $oldFoto)) {
    @unlink(dirname(__DIR__) . '/' . $oldFoto);
}

if ($updated) {
    sendResponse([
        'success' => true,
        'message' => 'Foto berhasil diperbarui',
        'data'    => ['foto_url' => $webPath]
    ]);
} else {
    // File sudah terupload tapi DB tidak terupdate (mungkin ID tidak ditemukan)
    // Tetap kembalikan sukses dengan URL foto
    sendResponse([
        'success'  => true,
        'message'  => 'Foto berhasil diupload',
        'data'     => ['foto_url' => $webPath],
        'warning'  => 'Record tidak ditemukan di database, foto tersimpan lokal'
    ]);
}

$conn->close();
?>
