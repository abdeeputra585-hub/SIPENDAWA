<?php
/**
 * api/nilai.php - Endpoint untuk manajemen nilai (CRUD)
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Semua role yang valid bisa akses (admin, kepala_sekolah, guru, parent)
$user = requireAuth(['admin', 'kepala_sekolah', 'guru', 'parent']);

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';

    if ($action === 'list') {
        // Jika role parent, pastikan dia hanya bisa melihat nilai anaknya
        if ($user['role'] === 'parent') {
            $siswaId = isset($_GET['siswa_id']) ? intval($_GET['siswa_id']) : 0;
            if (!$siswaId) {
                sendResponse(['success' => false, 'message' => 'Siswa ID wajib ada'], 400);
            }

            // Validasi apakah parent ini adalah wali dari siswa tersebut
            $stmt = $conn->prepare("
                SELECT r.id FROM relasi r 
                JOIN wali w ON r.wali_id = w.id 
                WHERE r.siswa_id = ? AND w.user_id = ? AND r.status = 'Terverifikasi'
            ");
            $stmt->bind_param("ii", $siswaId, $user['user_id']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 0) {
                sendResponse(['success' => false, 'message' => 'Akses ditolak'], 403);
            }

            $semester = $_GET['semester'] ?? '';
            $tahun = $_GET['tahun_ajaran'] ?? '';

            $where = ["n.siswa_id = ?"];
            $params = [$siswaId];
            $types = "i";

            if ($semester) { $where[] = "n.semester = ?"; $params[] = $semester; $types .= "s"; }
            if ($tahun) { $where[] = "n.tahun_ajaran = ?"; $params[] = $tahun; $types .= "s"; }

            $whereSql = implode(" AND ", $where);
            $query = "SELECT n.*, s.nama as nama_siswa, u.nama as nama_guru 
                      FROM nilai n 
                      JOIN siswa s ON n.siswa_id = s.id 
                      JOIN users u ON n.guru_id = u.id 
                      WHERE $whereSql
                      ORDER BY n.tahun_ajaran DESC, n.semester DESC, n.mata_pelajaran ASC";
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();

            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            sendResponse(['success' => true, 'data' => $data]);
        } 
        else {
            // Guru, Admin, Kepala Sekolah bisa melihat semua nilai
            // Jika dikasih filter semester/tahun
            $semester = $_GET['semester'] ?? '';
            $tahun = $_GET['tahun_ajaran'] ?? '';
            $mapel = $_GET['mata_pelajaran'] ?? '';
            $siswa_id = isset($_GET['siswa_id']) ? intval($_GET['siswa_id']) : 0;

            $where = ["1=1"];
            $params = [];
            $types = "";

            if ($semester) { $where[] = "n.semester = ?"; $params[] = $semester; $types .= "s"; }
            if ($tahun) { $where[] = "n.tahun_ajaran = ?"; $params[] = $tahun; $types .= "s"; }
            if ($mapel) { $where[] = "n.mata_pelajaran = ?"; $params[] = $mapel; $types .= "s"; }
            if ($siswa_id) { $where[] = "n.siswa_id = ?"; $params[] = $siswa_id; $types .= "i"; }
            
            // Guru mungkin hanya mau lihat nilainya sendiri? Atau bisa lihat semua tapi cuma bisa edit punya dia.
            // Saat ini kita biarkan lihat semua.

            $whereSql = implode(" AND ", $where);
            $query = "SELECT n.*, s.nama as nama_siswa, u.nama as nama_guru 
                      FROM nilai n 
                      JOIN siswa s ON n.siswa_id = s.id 
                      JOIN users u ON n.guru_id = u.id 
                      WHERE $whereSql
                      ORDER BY s.nama ASC, n.mata_pelajaran ASC";
            
            $stmt = $conn->prepare($query);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();

            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            sendResponse(['success' => true, 'data' => $data]);
        }
    }
}

elseif ($method === 'POST') {
    // Hanya Admin dan Guru yang boleh input nilai
    if (!in_array($user['role'], ['admin', 'guru'])) {
        sendResponse(['success' => false, 'message' => 'Forbidden'], 403);
    }

    $input = getJsonInput();
    $siswa_id = intval($input['siswa_id'] ?? 0);
    $mapel = trim($input['mata_pelajaran'] ?? '');
    $semester = trim($input['semester'] ?? '');
    $tahun = trim($input['tahun_ajaran'] ?? '');
    $tugas = floatval($input['nilai_tugas'] ?? 0);
    $uts = floatval($input['nilai_uts'] ?? 0);
    $uas = floatval($input['nilai_uas'] ?? 0);
    $id = intval($input['id'] ?? 0); // Jika ada ID, berarti Update

    if (!$siswa_id || !$mapel || !$semester || !$tahun) {
        sendResponse(['success' => false, 'message' => 'Lengkapi data wajib (Siswa, Mapel, Semester, Tahun)'], 400);
    }

    $guru_id = $user['user_id']; // Yang menginput

    if ($id > 0) {
        // UPDATE
        try {
            $stmt = $conn->prepare("UPDATE nilai SET nilai_tugas=?, nilai_uts=?, nilai_uas=? WHERE id=? AND (guru_id=? OR ?='admin')");
            $stmt->bind_param("dddiis", $tugas, $uts, $uas, $id, $guru_id, $user['role']);
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Nilai berhasil diperbarui']);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal memperbarui nilai atau Anda tidak punya hak akses. Error: ' . $stmt->error]);
            }
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Gagal memperbarui nilai (Server Error): ' . $e->getMessage()]);
        }
    } else {
        // CEK DUPLIKAT
        $cek = $conn->prepare("SELECT id FROM nilai WHERE siswa_id=? AND mata_pelajaran=? AND semester=? AND tahun_ajaran=?");
        $cek->bind_param("isss", $siswa_id, $mapel, $semester, $tahun);
        $cek->execute();
        if ($cek->get_result()->num_rows > 0) {
            sendResponse(['success' => false, 'message' => 'Nilai untuk mata pelajaran ini di semester tersebut sudah ada. Silakan edit.']);
        }

        // INSERT
        try {
            $stmt = $conn->prepare("INSERT INTO nilai (siswa_id, guru_id, mata_pelajaran, semester, tahun_ajaran, nilai_tugas, nilai_uts, nilai_uas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("iisssddd", $siswa_id, $guru_id, $mapel, $semester, $tahun, $tugas, $uts, $uas);
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'message' => 'Nilai berhasil disimpan']);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal menyimpan nilai: ' . $stmt->error]);
            }
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Gagal menyimpan nilai (Server Error): ' . $e->getMessage()]);
        }
    }
}

elseif ($method === 'DELETE') {
    if (!in_array($user['role'], ['admin', 'guru'])) {
        sendResponse(['success' => false, 'message' => 'Forbidden'], 403);
    }

    $input = getJsonInput();
    $id = intval($input['id'] ?? 0);

    if (!$id) {
        sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);
    }

    $guru_id = $user['user_id'];

    $stmt = $conn->prepare("DELETE FROM nilai WHERE id=? AND (guru_id=? OR ?='admin')");
    $stmt->bind_param("iis", $id, $guru_id, $user['role']);
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendResponse(['success' => true, 'message' => 'Nilai berhasil dihapus']);
    } else {
        sendResponse(['success' => false, 'message' => 'Gagal menghapus nilai atau tidak ada hak akses']);
    }
}

sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
