<?php
/**
 * POST /api/admin/pengumuman/update.php
 * Note: Menggunakan POST karena enctype multipart/form-data
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin', 'guru']);

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) sendResponse(['success' => false, 'error' => 'ID tidak valid'], 400);

$judul = $_POST['judul'] ?? '';
$konten = $_POST['konten'] ?? '';
$kategori = $_POST['kategori'] ?? 'Info Penting';
$status = $_POST['status'] ?? 'Published';

if (empty($judul) || empty($konten)) {
    sendResponse(['success' => false, 'error' => 'Judul dan konten wajib diisi'], 400);
}

// Cek exist
$stmt = $conn->prepare("SELECT attachment FROM pengumuman WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) sendResponse(['success' => false, 'error' => 'Pengumuman tidak ditemukan'], 404);
$oldAttachment = $res->fetch_assoc()['attachment'];

// File Upload
$attachmentUrl = $oldAttachment;
if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['attachment'];
    $maxSize = 2 * 1024 * 1024; // 2MB
    
    if ($file['size'] > $maxSize) {
        sendResponse(['success' => false, 'error' => 'Ukuran file maksimal 2MB'], 400);
    }
    
    $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime, $allowedTypes)) {
        sendResponse(['success' => false, 'error' => 'Tipe file tidak diizinkan'], 400);
    }
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'ann_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $uploadDir = __DIR__ . '/../../../uploads/pengumuman/';
    
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
    
    if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
        if ($oldAttachment && file_exists(__DIR__ . '/../../../' . $oldAttachment)) {
            unlink(__DIR__ . '/../../../' . $oldAttachment);
        }
        $attachmentUrl = '/uploads/pengumuman/' . $filename;
    }
}

$sql = "UPDATE pengumuman SET judul = ?, konten = ?, kategori = ?, attachment = ?, status = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssssi", $judul, $konten, $kategori, $attachmentUrl, $status, $id);

if ($stmt->execute()) {
    sendResponse([
        'success' => true,
        'message' => 'Pengumuman berhasil diupdate'
    ]);
} else {
    sendResponse(['success' => false, 'error' => 'Gagal mengupdate data'], 500);
}
?>
