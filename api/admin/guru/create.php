<?php
/**
 * POST /api/admin/guru/create.php
 * Menambah data guru baru
 */

require_once __DIR__ . '/../../config.php';
$guruConfig = require __DIR__ . '/../../../config/guru-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin']);

// Ambil input
$nip = $_POST['nip'] ?? '';
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

// Validasi
if (empty($nip) || empty($nama) || empty($email) || empty($mata_pelajaran_ids)) {
    sendResponse(['success' => false, 'error' => 'NIP, Nama, Email, dan Mata Pelajaran wajib diisi'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['success' => false, 'error' => 'Format email tidak valid'], 400);
}

// Cek NIP unique
$stmt = $conn->prepare("SELECT id FROM guru_profiles WHERE nip = ?");
$stmt->bind_param("s", $nip);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    sendResponse(['success' => false, 'error' => 'NIP sudah terdaftar', 'error_code' => 'NIP_EXISTS'], 400);
}

// Cek Email unique
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    sendResponse(['success' => false, 'error' => 'Email sudah terdaftar', 'error_code' => 'EMAIL_EXISTS'], 400);
}

// File Upload
$fotoUrl = null;
if (isset($_FILES['file_foto']) && $_FILES['file_foto']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file_foto'];
    
    if ($file['size'] > $guruConfig['max_upload_size']) {
        sendResponse(['success' => false, 'error' => 'Ukuran foto maksimal 2MB'], 400);
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime, $guruConfig['allowed_mime_types'])) {
        sendResponse(['success' => false, 'error' => 'Tipe file tidak diizinkan. Hanya JPG/PNG'], 400);
    }
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'guru_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    
    if (!is_dir($guruConfig['upload_base_path'])) {
        mkdir($guruConfig['upload_base_path'], 0777, true);
    }
    
    if (move_uploaded_file($file['tmp_name'], $guruConfig['upload_base_path'] . $filename)) {
        $fotoUrl = '/uploads/guru/' . $filename;
    }
}

// Auto-generate password
$plainPassword = bin2hex(random_bytes($guruConfig['default_password_length'] / 2));
$passwordHash = password_hash($plainPassword, PASSWORD_BCRYPT);

$conn->begin_transaction();

try {
    // Insert into users
    $stmtUser = $conn->prepare("INSERT INTO users (email, password, role, nama, avatar) VALUES (?, ?, 'guru', ?, ?)");
    $stmtUser->bind_param("ssss", $email, $passwordHash, $nama, $fotoUrl);
    $stmtUser->execute();
    $userId = $conn->insert_id;

    // Insert into guru_profiles
    if ($tanggal_lahir === '') $tanggal_lahir = null;
    $stmtProfile = $conn->prepare("INSERT INTO guru_profiles (user_id, nip, no_telepon, alamat, tanggal_lahir, jenis_kelamin, status_pegawai, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmtProfile->bind_param("issssssi", $userId, $nip, $no_telepon, $alamat, $tanggal_lahir, $jenis_kelamin, $status_pegawai, $is_active);
    $stmtProfile->execute();
    $profileId = $conn->insert_id;

    // Insert Mapel
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

    // Insert Kelas
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

    // OPTIONAL: Send Email
    // mail($email, "Akun Guru SIPENDAWA", "Password Anda: $plainPassword");

    sendResponse([
        'success' => true,
        'message' => 'Guru berhasil ditambahkan',
        'data' => [
            'id' => $userId,
            'nip' => $nip,
            'nama' => $nama,
            'email' => $email,
            'password_note' => "Password otomatis (Harap dicatat): $plainPassword"
        ]
    ]);

} catch (Exception $e) {
    $conn->rollback();
    sendResponse(['success' => false, 'error' => 'Gagal menyimpan data: ' . $e->getMessage()], 500);
}
?>

