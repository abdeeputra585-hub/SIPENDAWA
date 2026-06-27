<?php
/**
 * POST /api/admin/guru/update.php
 * Update data guru. Karena PHP native tidak handle multipart/form-data via PUT, 
 * kita gunakan POST dengan _method=PUT atau parameter id.
 */

require_once __DIR__ . '/../../config.php';
$guruConfig = require __DIR__ . '/../../../config/guru-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin']);

// Handling both POST (multipart) and PUT (json) 
// Namun karena butuh file_foto, frontend HARUS pakai POST.
$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) {
    sendResponse(['success' => false, 'error' => 'ID guru tidak valid'], 400);
}

$nama = $_POST['nama'] ?? '';
$email = $_POST['email'] ?? '';
$no_telepon = $_POST['no_telepon'] ?? '';
$alamat = $_POST['alamat'] ?? '';
$tanggal_lahir = $_POST['tanggal_lahir'] ?? null;
$jenis_kelamin = $_POST['jenis_kelamin'] ?? null;
$status_pegawai = $_POST['status_pegawai'] ?? 'GTT';
$mata_pelajaran_ids = isset($_POST['mata_pelajaran_ids']) ? explode(',', $_POST['mata_pelajaran_ids']) : [];
$kelas_ampuan_ids = isset($_POST['kelas_ampuan_ids']) ? explode(',', $_POST['kelas_ampuan_ids']) : [];
$is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;

if (empty($nama) || empty($email) || empty($mata_pelajaran_ids)) {
    sendResponse(['success' => false, 'error' => 'Nama, Email, dan Mata Pelajaran wajib diisi'], 400);
}

// Cek Email unique exclude self
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
$stmt->bind_param("si", $email, $id);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    sendResponse(['success' => false, 'error' => 'Email sudah terdaftar', 'error_code' => 'EMAIL_EXISTS'], 400);
}

// Cek Guru exist
$stmt = $conn->prepare("SELECT u.id, gp.id as profile_id, u.avatar as foto FROM users u JOIN guru_profiles gp ON u.id = gp.user_id WHERE u.id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    sendResponse(['success' => false, 'error' => 'Guru tidak ditemukan'], 404);
}
$guruData = $res->fetch_assoc();
$profileId = $guruData['profile_id'];
$fotoUrl = $guruData['foto'];

// File Upload
if (isset($_FILES['file_foto']) && $_FILES['file_foto']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file_foto'];
    if ($file['size'] > $guruConfig['max_upload_size']) {
        sendResponse(['success' => false, 'error' => 'Ukuran foto maksimal 2MB'], 400);
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $guruConfig['allowed_mime_types'])) {
        sendResponse(['success' => false, 'error' => 'Tipe file tidak diizinkan'], 400);
    }
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'guru_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    
    if (!is_dir($guruConfig['upload_base_path'])) mkdir($guruConfig['upload_base_path'], 0777, true);
    if (move_uploaded_file($file['tmp_name'], $guruConfig['upload_base_path'] . $filename)) {
        // Delete old photo if exists
        if ($fotoUrl && strpos($fotoUrl, '/uploads/') !== false) {
            $oldPath = __DIR__ . '/../../../' . $fotoUrl;
            if (file_exists($oldPath)) unlink($oldPath);
        }
        $fotoUrl = '/uploads/guru/' . $filename;
    }
}

$conn->begin_transaction();

try {
    // Update users
    $stmtUser = $conn->prepare("UPDATE users SET email = ?, nama = ?, avatar = ? WHERE id = ?");
    $stmtUser->bind_param("sssi", $email, $nama, $fotoUrl, $id);
    $stmtUser->execute();

    // Update profiles
    if ($tanggal_lahir === '') $tanggal_lahir = null;
    $stmtProfile = $conn->prepare("UPDATE guru_profiles SET no_telepon = ?, alamat = ?, tanggal_lahir = ?, jenis_kelamin = ?, status_pegawai = ?, is_active = ? WHERE user_id = ?");
    $stmtProfile->bind_param("sssssii", $no_telepon, $alamat, $tanggal_lahir, $jenis_kelamin, $status_pegawai, $is_active, $id);
    $stmtProfile->execute();

    // Reset Relasi
    $conn->query("DELETE FROM guru_mata_pelajaran WHERE guru_profile_id = $profileId");
    $conn->query("DELETE FROM guru_kelas WHERE guru_profile_id = $profileId");

    // Insert Mapel Baru
    if (!empty($mata_pelajaran_ids)) {
        $stmtMapel = $conn->prepare("INSERT IGNORE INTO guru_mata_pelajaran (guru_profile_id, mata_pelajaran_id) VALUES (?, ?)");
        foreach ($mata_pelajaran_ids as $mpId) {
            $mpIdInt = (int)$mpId;
            if ($mpIdInt > 0) {
                $stmtMapel->bind_param("ii", $profileId, $mpIdInt);
                $stmtMapel->execute();
            }
        }
    }

    // Insert Kelas Baru
    if (!empty($kelas_ampuan_ids)) {
        $stmtKelas = $conn->prepare("INSERT IGNORE INTO guru_kelas (guru_profile_id, kelas_id) VALUES (?, ?)");
        foreach ($kelas_ampuan_ids as $kId) {
            $kIdInt = (int)$kId;
            if ($kIdInt > 0) {
                $stmtKelas->bind_param("ii", $profileId, $kIdInt);
                $stmtKelas->execute();
            }
        }
    }

    $conn->commit();
    sendResponse([
        'success' => true,
        'message' => 'Guru berhasil diupdate'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    sendResponse(['success' => false, 'error' => 'Gagal update: ' . $e->getMessage()], 500);
}
?>

