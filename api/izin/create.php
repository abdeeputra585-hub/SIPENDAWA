<?php
/**
 * POST /api/izin/create.php
 * Wali murid membuat permohonan izin
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

$id_siswa = (int)($_POST['id_siswa'] ?? 0);
$tipe_izin = $_POST['tipe_izin'] ?? '';
$tgl_mulai = $_POST['tgl_mulai'] ?? '';
$tgl_selesai = $_POST['tgl_selesai'] ?? '';
$alasan = $_POST['alasan'] ?? '';

if ($id_siswa <= 0 || empty($tipe_izin) || empty($tgl_mulai) || empty($tgl_selesai) || empty($alasan)) {
    sendResponse(['success' => false, 'error' => 'Data tidak lengkap'], 400);
}

// Validasi tgl_mulai tidak boleh mundur dari hari ini (H-0)
$today = date('Y-m-d');
if ($tgl_mulai < $today) {
    sendResponse(['success' => false, 'error' => 'Tanggal mulai tidak boleh lebih lama dari hari ini'], 400);
}

if ($tgl_selesai < $tgl_mulai) {
    sendResponse(['success' => false, 'error' => 'Tanggal selesai tidak valid'], 400);
}

if (!in_array($tipe_izin, ['Sakit', 'Izin', 'Dispensasi'])) {
    sendResponse(['success' => false, 'error' => 'Tipe izin tidak valid'], 400);
}

// File Upload
$attachmentUrl = null;
if (isset($_FILES['bukti_file']) && $_FILES['bukti_file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['bukti_file'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if ($file['size'] > $maxSize) sendResponse(['success' => false, 'error' => 'Ukuran file maksimal 5MB'], 400);
    
    $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime, $allowedTypes)) {
        sendResponse(['success' => false, 'error' => 'Tipe file tidak diizinkan (Hanya JPG, PNG, PDF)'], 400);
    }
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'abs_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $uploadDir = __DIR__ . '/../../uploads/absence/';
    
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
    
    if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
        $attachmentUrl = '/uploads/absence/' . $filename;
    }
}

// Wajib upload jika Sakit
if ($tipe_izin === 'Sakit' && !$attachmentUrl) {
    sendResponse(['success' => false, 'error' => 'Surat keterangan dokter wajib dilampirkan untuk izin Sakit'], 400);
}

$sql = "INSERT INTO absence_requests (id_siswa, tipe_izin, tgl_mulai, tgl_selesai, alasan, bukti_file, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("isssssi", $id_siswa, $tipe_izin, $tgl_mulai, $tgl_selesai, $alasan, $attachmentUrl, $userId);

if ($stmt->execute()) {
    sendResponse([
        'success' => true,
        'message' => 'Pengajuan izin berhasil dikirim. Menunggu persetujuan.'
    ]);
} else {
    sendResponse(['success' => false, 'error' => 'Gagal mengirim pengajuan izin'], 500);
}
?>
