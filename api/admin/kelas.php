<?php
/**
 * api/admin/kelas.php - Endpoint untuk manajemen master data Kelas (CRUD)
 */
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Hanya admin dan kepala sekolah yang bisa mengelola master data kelas
$user = requireAuth(['admin', 'kepala_sekolah']);

if ($method === 'GET') {
    // Ambil daftar kelas beserta wali kelas dan jumlah siswa
    $query = "
        SELECT 
            k.*, 
            u.nama as wali_kelas_nama, 
            gk.guru_profile_id,
            (SELECT COUNT(*) FROM siswa WHERE kelas = k.nama_kelas AND status = 'Aktif') as jumlah_siswa
        FROM kelas k
        LEFT JOIN guru_kelas gk ON k.id = gk.kelas_id
        LEFT JOIN guru_profiles gp ON gk.guru_profile_id = gp.id
        LEFT JOIN users u ON gp.user_id = u.id
        ORDER BY k.tingkat ASC, k.nama_kelas ASC
    ";
    $result = $conn->query($query);
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        // Fetch daftar siswa_ids untuk kelas ini
        $siswaQuery = $conn->prepare("SELECT id FROM siswa WHERE kelas = ? AND status = 'Aktif'");
        $siswaQuery->bind_param("s", $row['nama_kelas']);
        $siswaQuery->execute();
        $siswaResult = $siswaQuery->get_result();
        
        $siswa_ids = [];
        while ($sRow = $siswaResult->fetch_assoc()) {
            $siswa_ids[] = $sRow['id'];
        }
        $row['siswa_ids'] = $siswa_ids;
        
        $data[] = $row;
    }
    
    sendResponse(['success' => true, 'data' => $data]);
} 
elseif ($method === 'POST' || $method === 'PUT') {
    $input = getJsonInput();
    $id = intval($input['id'] ?? 0);
    $nama_kelas = trim($input['nama_kelas'] ?? '');
    $tingkat = intval($input['tingkat'] ?? 0);
    $guru_profile_id = intval($input['guru_profile_id'] ?? 0);
    $siswa_ids = $input['siswa_ids'] ?? [];

    if (empty($nama_kelas) || $tingkat <= 0) {
        sendResponse(['success' => false, 'message' => 'Nama Kelas dan Tingkat wajib diisi dengan benar'], 400);
    }
    
    // Check old class name if updating
    $old_nama_kelas = $nama_kelas;
    if ($method === 'PUT') {
        if ($id <= 0) {
            sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);
        }
        $oldQuery = $conn->prepare("SELECT nama_kelas FROM kelas WHERE id = ?");
        $oldQuery->bind_param("i", $id);
        $oldQuery->execute();
        $oldRes = $oldQuery->get_result();
        if ($oldRow = $oldRes->fetch_assoc()) {
            $old_nama_kelas = $oldRow['nama_kelas'];
        }
    }

    $conn->begin_transaction();
    try {
        if ($method === 'POST') {
            $stmt = $conn->prepare("INSERT INTO kelas (nama_kelas, tingkat) VALUES (?, ?)");
            $stmt->bind_param("si", $nama_kelas, $tingkat);
            $stmt->execute();
            $id = $conn->insert_id;
        } else {
            $stmt = $conn->prepare("UPDATE kelas SET nama_kelas = ?, tingkat = ? WHERE id = ?");
            $stmt->bind_param("sii", $nama_kelas, $tingkat, $id);
            $stmt->execute();
        }

        // Simpan Wali Kelas
        if ($guru_profile_id > 0) {
            // Hapus yang lama
            $delGuru = $conn->prepare("DELETE FROM guru_kelas WHERE kelas_id = ?");
            $delGuru->bind_param("i", $id);
            $delGuru->execute();
            
            // Cek apakah guru ini sudah jadi wali di kelas lain
            $delOther = $conn->prepare("DELETE FROM guru_kelas WHERE guru_profile_id = ?");
            $delOther->bind_param("i", $guru_profile_id);
            $delOther->execute();

            $insGuru = $conn->prepare("INSERT INTO guru_kelas (guru_profile_id, kelas_id) VALUES (?, ?)");
            $insGuru->bind_param("ii", $guru_profile_id, $id);
            $insGuru->execute();
        } else {
            // Hapus wali kelas jika dikosongkan
            $delGuru = $conn->prepare("DELETE FROM guru_kelas WHERE kelas_id = ?");
            $delGuru->bind_param("i", $id);
            $delGuru->execute();
        }

        // Proses Siswa
        // 1. Kosongkan kelas dari siswa yang sebelumnya ada di kelas ini (old_nama_kelas)
        $clearSiswa = $conn->prepare("UPDATE siswa SET kelas = 'Belum Diatur' WHERE kelas = ?");
        $clearSiswa->bind_param("s", $old_nama_kelas);
        $clearSiswa->execute();

        // 2. Jika nama_kelas berubah, pastikan siswa yang masih 'nyangkut' di nama baru juga dikosongkan agar tidak bentrok (opsional)
        // 3. Update kelas untuk siswa_ids yang dikirim
        if (is_array($siswa_ids) && count($siswa_ids) > 0) {
            // Karena array, buat placeholder ?, ?, ?
            $placeholders = implode(',', array_fill(0, count($siswa_ids), '?'));
            $types = str_repeat('i', count($siswa_ids));
            
            // Prepend string untuk nama_kelas
            $stmtSiswa = $conn->prepare("UPDATE siswa SET kelas = ? WHERE id IN ($placeholders)");
            $bindParams = [$types = "s" . $types, $nama_kelas, ...$siswa_ids];
            $stmtSiswa->bind_param(...$bindParams);
            $stmtSiswa->execute();
        }

        $conn->commit();
        $msg = $method === 'POST' ? 'Kelas berhasil ditambahkan' : 'Kelas berhasil diperbarui';
        sendResponse(['success' => true, 'message' => $msg]);
    } catch (Exception $e) {
        $conn->rollback();
        $errorCode = $e->getCode();
        if ($errorCode == 1062 || $conn->errno === 1062) {
            sendResponse(['success' => false, 'message' => 'Nama kelas tersebut sudah digunakan'], 400);
        }
        sendResponse(['success' => false, 'message' => 'Gagal menyimpan kelas: ' . $e->getMessage()], 500);
    }
}
elseif ($method === 'DELETE') {
    $input = getJsonInput();
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);

    // Ambil nama kelas untuk membersihkan siswa
    $q = $conn->prepare("SELECT nama_kelas FROM kelas WHERE id = ?");
    $q->bind_param("i", $id);
    $q->execute();
    $r = $q->get_result();
    if ($row = $r->fetch_assoc()) {
        $nama_kelas = $row['nama_kelas'];
        $updSiswa = $conn->prepare("UPDATE siswa SET kelas = 'Belum Diatur' WHERE kelas = ?");
        $updSiswa->bind_param("s", $nama_kelas);
        $updSiswa->execute();
    }

    $stmt = $conn->prepare("DELETE FROM kelas WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendResponse(['success' => true, 'message' => 'Kelas berhasil dihapus']);
    } else {
        sendResponse(['success' => false, 'message' => 'Gagal menghapus kelas'], 500);
    }
}

sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
