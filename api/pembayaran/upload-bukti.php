<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$id = (int)($_POST['id'] ?? 0);

if (!$id) {
    sendResponse(['success' => false, 'message' => 'ID Pembayaran diperlukan'], 400);
}

if (!isset($_FILES['bukti_file']) || $_FILES['bukti_file']['error'] !== UPLOAD_ERR_OK) {
    sendResponse(['success' => false, 'message' => 'Bukti pembayaran gagal diunggah'], 400);
}

$file = $_FILES['bukti_file'];
$maxSize = 5 * 1024 * 1024; // 5MB
$allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedMimes)) {
    sendResponse(['success' => false, 'message' => 'Format file tidak didukung (Gunakan JPG, PNG, atau PDF)'], 400);
}
if ($file['size'] > $maxSize) {
    sendResponse(['success' => false, 'message' => 'Ukuran file maksimal 5MB'], 400);
}

$uploadDir = dirname(__DIR__, 2) . '/uploads/pembayaran/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'bukti_' . $id . '_' . time() . '.' . $ext;
$fullPath = $uploadDir . $filename;
$webPath = 'uploads/pembayaran/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
    sendResponse(['success' => false, 'message' => 'Gagal menyimpan file'], 500);
}

$stmt = $conn->prepare("UPDATE pembayaran SET bukti_file = ?, status = 'Menunggu Konfirmasi', tgl_bayar = NOW() WHERE id = ?");
$stmt->bind_param("si", $webPath, $id);

if ($stmt->execute()) {
    // Get student name & tipe tagihan
    $getSiswa = $conn->prepare("SELECT s.nama, p.tipe_pembayaran FROM pembayaran p JOIN siswa s ON p.id_siswa = s.id WHERE p.id = ?");
    $getSiswa->bind_param("i", $id);
    $getSiswa->execute();
    $siswaRes = $getSiswa->get_result()->fetch_assoc();
    $getSiswa->close();
    
    // Notify all admins and kepala sekolah
    $getAdmin = $conn->query("SELECT id FROM users WHERE role IN ('admin', 'kepala_sekolah')");
    while ($adm = $getAdmin->fetch_assoc()) {
        $notifId = $adm['id'];
        $judul = "Verifikasi Pembayaran: " . ($siswaRes['nama'] ?? 'Siswa');
        $pesan = "Wali murid telah mengunggah bukti pembayaran untuk tagihan " . ($siswaRes['tipe_pembayaran'] ?? 'Tagihan') . ". Segera cek dan verifikasi di menu Kelola Keuangan.";
        $nStmt = $conn->prepare("INSERT INTO notifikasi (user_id, judul, pesan, tipe) VALUES (?, ?, ?, 'info')");
        $nStmt->bind_param("iss", $notifId, $judul, $pesan);
        $nStmt->execute();
        $nStmt->close();
    }

    sendResponse(['success' => true, 'message' => 'Bukti pembayaran berhasil diunggah dan sedang diproses.']);
} else {
    sendResponse(['success' => false, 'message' => 'Gagal memperbarui status'], 500);
}
?>
