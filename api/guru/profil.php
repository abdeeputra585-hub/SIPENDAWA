<?php
/**
 * GET/POST /api/guru/profil.php
 * Guru dapat melihat dan memperbarui profilnya sendiri
 */

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user   = requireAuth(['guru', 'admin']);
$userId = (int)$user['user_id'];

// â”€â”€ GET: Ambil data profil guru yang sedang login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if ($method === 'GET') {
    $query = "
        SELECT u.id, u.nama, u.email, u.avatar as foto,
               gp.nip, gp.no_telepon, gp.alamat, gp.tanggal_lahir,
               gp.jenis_kelamin, gp.status_pegawai, gp.is_active, u.created_at
        FROM users u
        JOIN guru_profiles gp ON u.id = gp.user_id
        WHERE u.id = ? AND u.role = 'guru'
    ";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $res  = $stmt->get_result();

    if ($res->num_rows === 0) {
        sendResponse(['success' => false, 'error' => 'Profil guru tidak ditemukan'], 404);
    }
    $guru = $res->fetch_assoc();

    // Mata pelajaran
    $stmtGp = $conn->prepare("SELECT id FROM guru_profiles WHERE user_id = ?");
    $stmtGp->bind_param("i", $userId);
    $stmtGp->execute();
    $gpRow = $stmtGp->get_result()->fetch_assoc();
    $gpId  = $gpRow ? (int)$gpRow['id'] : 0;

    $mapel = [];
    $kelas = [];
    if ($gpId) {
        $stmtM = $conn->prepare("
            SELECT mp.id, mp.nama_pelajaran
            FROM guru_mata_pelajaran gmp
            JOIN mata_pelajaran mp ON gmp.mata_pelajaran_id = mp.id
            WHERE gmp.guru_profile_id = ?
        ");
        $stmtM->bind_param("i", $gpId);
        $stmtM->execute();
        $resM = $stmtM->get_result();
        while ($r = $resM->fetch_assoc()) $mapel[] = $r['nama_pelajaran'];

        $stmtK = $conn->prepare("
            SELECT k.nama_kelas
            FROM guru_kelas gk
            JOIN kelas k ON gk.kelas_id = k.id
            WHERE gk.guru_profile_id = ?
        ");
        $stmtK->bind_param("i", $gpId);
        $stmtK->execute();
        $resK = $stmtK->get_result();
        while ($r = $resK->fetch_assoc()) $kelas[] = $r['nama_kelas'];
    }

    $guru['mata_pelajaran'] = $mapel;
    $guru['kelas_ampuan']   = $kelas;

    sendResponse(['success' => true, 'data' => $guru]);
}

// â”€â”€ POST: Update profil guru (nama, telepon, alamat) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
elseif ($method === 'POST') {
    $input     = getJsonInput();
    $nama      = trim($input['nama']      ?? '');
    $telepon   = trim($input['no_telepon'] ?? '');
    $alamat    = trim($input['alamat']    ?? '');
    $oldPwd    = trim($input['old_password'] ?? '');
    $newPwd    = trim($input['new_password'] ?? '');

    if (empty($nama)) {
        sendResponse(['success' => false, 'error' => 'Nama tidak boleh kosong'], 400);
    }

    // Update tabel users (nama)
    $stmt = $conn->prepare("UPDATE users SET nama = ? WHERE id = ?");
    $stmt->bind_param("si", $nama, $userId);
    $stmt->execute();

    // Update guru_profiles (telepon, alamat)
    $stmt2 = $conn->prepare("UPDATE guru_profiles SET no_telepon = ?, alamat = ? WHERE user_id = ?");
    $stmt2->bind_param("ssi", $telepon, $alamat, $userId);
    $stmt2->execute();

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
        $hash     = password_hash($newPwd, PASSWORD_DEFAULT);
        $stmtUpd  = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmtUpd->bind_param("si", $hash, $userId);
        $stmtUpd->execute();
    }

    sendResponse(['success' => true, 'message' => 'Profil berhasil diperbarui']);
}

else {
    sendResponse(['success' => false, 'error' => 'Method tidak diizinkan'], 405);
}
?>

