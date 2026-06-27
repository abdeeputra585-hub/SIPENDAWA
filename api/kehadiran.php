<?php
/**
 * api/kehadiran.php
 * - GET untuk lihat kehadiran siswa (Parent/Guru/Admin)
 * - POST untuk tambah kehadiran baru (Guru/Admin)
 * - DELETE untuk hapus kehadiran (Guru/Admin)
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth(['admin', 'kepala_sekolah', 'guru', 'parent']);

function escapeOutput($data) {
    if (is_array($data)) {
        return array_map('escapeOutput', $data);
    }
    return htmlspecialchars($data ?? '', ENT_QUOTES, 'UTF-8');
}

switch ($method) {
    
    case 'GET':
        // Jika action=list_kelas (untuk form absensi guru/admin)
        if (isset($_GET['action']) && $_GET['action'] === 'list_kelas') {
            if (!in_array($user['role'], ['admin', 'guru'])) {
                sendResponse(['success' => false, 'message' => 'Forbidden'], 403);
            }
            
            $tanggal = $_GET['tanggal'] ?? date('Y-m-d');
            
            // Ambil semua siswa beserta status absensinya pada tanggal tersebut
            $sql = "SELECT s.id, s.nama, s.nisn, k.status, k.keterangan 
                    FROM siswa s
                    LEFT JOIN kehadiran k ON s.id = k.siswa_id AND k.tanggal = ?
                    ORDER BY s.nama ASC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $tanggal);
            $stmt->execute();
            $res = $stmt->get_result();
            
            $data = [];
            while ($row = $res->fetch_assoc()) {
                $data[] = $row;
            }
            sendResponse(['success' => true, 'data' => $data]);
            break;
        }

        // --- GET DETAIL PER SISWA ---
        if (!isset($_GET['siswa_id']) || empty($_GET['siswa_id'])) {
            sendResponse(['success' => false, 'message' => 'siswa_id wajib diisi'], 400);
        }
        
        $siswaId = (int)$_GET['siswa_id'];
        
        // Parent: pastikan ini adalah anaknya
        if ($user['role'] === 'parent') {
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
        }

        $action = $_GET['action'] ?? '';
        
        if ($action === 'summary') {
            $bulan = $_GET['bulan'] ?? '';
            
            $where = ["siswa_id = ?"];
            $params = [$siswaId];
            $types = "i";
            
            if ($bulan) {
                $where[] = "DATE_FORMAT(tanggal, '%Y-%m') = ?";
                $params[] = $bulan;
                $types .= "s";
            }
            $whereSql = implode(" AND ", $where);

            // GET ringkasan kehadiran siswa
            $sql = "SELECT status, COUNT(*) as total FROM kehadiran 
                   WHERE $whereSql 
                   GROUP BY status";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $summary = ['Hadir' => 0, 'Izin' => 0, 'Sakit' => 0, 'Alpa' => 0, 'Total' => 0];
            while ($row = $result->fetch_assoc()) {
                $summary[$row['status']] = (int)$row['total'];
                $summary['Total'] += (int)$row['total'];
            }

            // Get history terbaru
            $historySql = "SELECT tanggal, status, keterangan FROM kehadiran WHERE $whereSql ORDER BY tanggal DESC LIMIT 10";
            $histStmt = $conn->prepare($historySql);
            $histStmt->bind_param($types, ...$params);
            $histStmt->execute();
            $histResult = $histStmt->get_result();
            
            $history = [];
            while ($row = $histResult->fetch_assoc()) {
                $history[] = escapeOutput($row);
            }

            sendResponse([
                'success' => true,
                'data' => ['summary' => $summary, 'history' => $history]
            ]);
        } else {
            // GET list kehadiran siswa (PAGINATION)
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $perPage = 20;
            $offset = ($page - 1) * $perPage;
            
            $sql = "SELECT id, tanggal, status, keterangan, created_at FROM kehadiran WHERE siswa_id = ? ORDER BY tanggal DESC LIMIT ? OFFSET ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("iii", $siswaId, $perPage, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = escapeOutput($row);
            }
            
            // Count total
            $countSql = "SELECT COUNT(*) as total FROM kehadiran WHERE siswa_id = ?";
            $countStmt = $conn->prepare($countSql);
            $countStmt->bind_param("i", $siswaId);
            $countStmt->execute();
            $total = $countStmt->get_result()->fetch_assoc()['total'];
            
            sendResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'perPage' => $perPage,
                    'total' => $total,
                    'totalPages' => ceil($total / $perPage)
                ]
            ]);
        }
        break;

    case 'POST':
        if (!in_array($user['role'], ['admin', 'guru'])) {
            sendResponse(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $input = getJsonInput();
        
        // Mode absensi masal
        if (isset($_GET['action']) && $_GET['action'] === 'masal') {
            $tanggal = $input['tanggal'] ?? '';
            $kehadiran = $input['kehadiran'] ?? []; // format: [{siswa_id: 1, status: 'Hadir', keterangan: ''}, ...]
            
            if (!$tanggal || empty($kehadiran)) {
                sendResponse(['success' => false, 'message' => 'Data tidak lengkap'], 400);
            }

            $conn->begin_transaction();
            try {
                // Hapus absensi sebelumnya pada tanggal yang sama untuk mencegah duplikat
                $del = $conn->prepare("DELETE FROM kehadiran WHERE tanggal = ?");
                $del->bind_param("s", $tanggal);
                $del->execute();

                // Insert absensi baru
                $stmt = $conn->prepare("INSERT INTO kehadiran (siswa_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?)");
                foreach ($kehadiran as $k) {
                    $sid = (int)$k['siswa_id'];
                    $sts = $k['status'];
                    $ket = $k['keterangan'] ?? '';
                    $stmt->bind_param("isss", $sid, $tanggal, $sts, $ket);
                    $stmt->execute();
                }
                $conn->commit();
                sendResponse(['success' => true, 'message' => 'Kehadiran kelas berhasil disimpan']);
            } catch (Exception $e) {
                $conn->rollback();
                sendResponse(['success' => false, 'message' => 'Gagal menyimpan absensi: ' . $e->getMessage()]);
            }
        } else {
            // Absensi single
            if (empty($input['siswa_id']) || empty($input['tanggal']) || empty($input['status'])) {
                sendResponse(['success' => false, 'message' => 'siswa_id, tanggal, dan status wajib diisi'], 400);
            }
            
            $validStatus = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
            if (!in_array($input['status'], $validStatus)) {
                sendResponse(['success' => false, 'message' => 'Status tidak valid'], 400);
            }
            
            $siswaId = (int)$input['siswa_id'];
            $tanggal = $input['tanggal'];
            $status = $input['status'];
            $keterangan = $input['keterangan'] ?? '';
            
            // Cek duplikat
            $existStmt = $conn->prepare("SELECT id FROM kehadiran WHERE siswa_id = ? AND tanggal = ?");
            $existStmt->bind_param("is", $siswaId, $tanggal);
            $existStmt->execute();
            if ($existStmt->get_result()->num_rows > 0) {
                sendResponse(['success' => false, 'message' => 'Kehadiran untuk tanggal ini sudah tercatat'], 409);
            }
            
            $stmt = $conn->prepare("INSERT INTO kehadiran (siswa_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $siswaId, $tanggal, $status, $keterangan);
            
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'message' => 'Kehadiran berhasil dicatat']);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal mencatat kehadiran: ' . $stmt->error]);
            }
        }
        break;

    case 'DELETE':
        if (!in_array($user['role'], ['admin', 'guru'])) {
            sendResponse(['success' => false, 'message' => 'Forbidden'], 403);
        }
        
        $input = getJsonInput();
        $id = (int)($input['id'] ?? $_GET['id'] ?? 0);
        
        if (!$id) {
            sendResponse(['success' => false, 'message' => 'ID kehadiran diperlukan'], 400);
        }
        
        $stmt = $conn->prepare("DELETE FROM kehadiran WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            sendResponse(['success' => true, 'message' => 'Kehadiran berhasil dihapus']);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus atau data tidak ditemukan']);
        }
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>
