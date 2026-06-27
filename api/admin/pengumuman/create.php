<?php
/**
 * POST /api/admin/pengumuman/create.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin', 'guru']);

$judul = $_POST['judul'] ?? '';
$konten = $_POST['konten'] ?? '';
$kategori = $_POST['kategori'] ?? 'Info Penting';
$status = $_POST['status'] ?? 'Published';
$created_by = (int)$authUser['user_id'];

if (empty($judul) || empty($konten)) {
    sendResponse(['success' => false, 'error' => 'Judul dan konten wajib diisi'], 400);
}

// File Upload
$attachmentUrl = null;
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
        sendResponse(['success' => false, 'error' => 'Tipe file tidak diizinkan (Hanya JPG, PNG, PDF)'], 400);
    }
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'ann_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $uploadDir = __DIR__ . '/../../../uploads/pengumuman/';
    
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
    
    if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
        $attachmentUrl = '/uploads/pengumuman/' . $filename;
    }
}

$sql = "INSERT INTO pengumuman (judul, konten, kategori, attachment, status, created_by) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssssi", $judul, $konten, $kategori, $attachmentUrl, $status, $created_by);

if ($stmt->execute()) {
    sendResponse([
        'success' => true,
        'message' => 'Pengumuman berhasil disimpan'
    ]);
} else {
    sendResponse(['success' => false, 'error' => 'Gagal menyimpan data'], 500);
}
?>
