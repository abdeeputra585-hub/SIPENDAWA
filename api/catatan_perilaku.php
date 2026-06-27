<?php
/**
 * api/catatan_perilaku.php
 * Endpoint untuk CRUD catatan perilaku siswa
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
        $siswaId = isset($_GET['siswa_id']) ? (int)$_GET['siswa_id'] : 0;
        
        // Parent hanya bisa melihat milik anaknya
        if ($user['role'] === 'parent') {
            if (!$siswaId) {
                // Ambil daftar anak jika tidak dikirim siswa_id
                $stmt = $conn->prepare("SELECT r.siswa_id FROM relasi r JOIN wali w ON r.wali_id = w.id WHERE w.user_id = ? AND r.status = 'Terverifikasi'");
                $stmt->bind_param("i", $user['user_id']);
                $stmt->execute();
                $res = $stmt->get_result();
                $siswaIds = [];
                while ($row = $res->fetch_assoc()) {
                    $siswaIds[] = $row['siswa_id'];
                }
                
                if (empty($siswaIds)) {
                    sendResponse(['success' => true, 'data' => []]);
                }
                
                // Jika ingin melihat semua anak (default fallback)
                $placeholders = implode(',', array_fill(0, count($siswaIds), '?'));
                $query = "SELECT c.*, s.nama as nama_siswa, u.nama as nama_guru 
                          FROM catatan_perilaku c
                          JOIN siswa s ON c.siswa_id = s.id
                          JOIN users u ON c.guru_id = u.id
                          WHERE c.siswa_id IN ($placeholders)
                          ORDER BY c.tanggal DESC, c.created_at DESC";
                $stmt = $conn->prepare($query);
                $stmt->bind_param(str_repeat('i', count($siswaIds)), ...$siswaIds);
                
            } else {
                $stmt = $conn->prepare("SELECT r.id FROM relasi r JOIN wali w ON r.wali_id = w.id WHERE r.siswa_id = ? AND w.user_id = ? AND r.status = 'Terverifikasi'");
                $stmt->bind_param("ii", $siswaId, $user['user_id']);
                $stmt->execute();
                if ($stmt->get_result()->num_rows === 0) {
                    sendResponse(['success' => false, 'message' => 'Akses ditolak'], 403);
                }
                
                $query = "SELECT c.*, s.nama as nama_siswa, u.nama as nama_guru 
                          FROM catatan_perilaku c
                          JOIN siswa s ON c.siswa_id = s.id
                          JOIN users u ON c.guru_id = u.id
                          WHERE c.siswa_id = ?
                          ORDER BY c.tanggal DESC, c.created_at DESC";
                $stmt = $conn->prepare($query);
                $stmt->bind_param("i", $siswaId);
            }
        } else {
            // Guru, Admin, Kepsek
            $query = "SELECT c.*, s.nama as nama_siswa, u.nama as nama_guru 
                      FROM catatan_perilaku c
                      JOIN siswa s ON c.siswa_id = s.id
                      JOIN users u ON c.guru_id = u.id
                      WHERE 1=1 ";
            
            $params = [];
            $types = "";
            
            if ($siswaId) {
                $query .= " AND c.siswa_id = ? ";
                $params[] = $siswaId;
                $types .= "i";
            }
            
            if (isset($_GET['guru_id'])) {
                $query .= " AND c.guru_id = ? ";
                $params[] = (int)$_GET['guru_id'];
                $types .= "i";
            }

            if (isset($_GET['tanggal'])) {
                $query .= " AND c.tanggal = ? ";
                $params[] = $_GET['tanggal'];
                $types .= "s";
            }

            $query .= " ORDER BY c.tanggal DESC, c.created_at DESC";
            $stmt = $conn->prepare($query);
            
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = escapeOutput($row);
        }
        sendResponse(['success' => true, 'data' => $data]);
        break;

    case 'POST':
        if (!in_array($user['role'], ['admin', 'guru'])) {
            sendResponse(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $input = getJsonInput();
        $siswa_id = (int)($input['siswa_id'] ?? 0);
        $tanggal = $input['tanggal'] ?? '';
        $tipe = $input['tipe'] ?? '';
        $catatan = trim($input['catatan'] ?? '');
        $id = (int)($input['id'] ?? 0);
        
        $validTipe = ['Positif', 'Negatif', 'Info'];
        if (!$siswa_id || !$tanggal || !in_array($tipe, $validTipe) || empty($catatan)) {
            sendResponse(['success' => false, 'message' => 'Lengkapi form dengan benar'], 400);
        }

        $guru_id = $user['user_id'];

        if ($id > 0) {
            // UPDATE
            $stmt = $conn->prepare("UPDATE catatan_perilaku SET tipe=?, catatan=?, tanggal=? WHERE id=? AND (guru_id=? OR ?='admin')");
            $stmt->bind_param("sssiis", $tipe, $catatan, $tanggal, $id, $guru_id, $user['role']);
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Catatan berhasil diperbarui']);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal memperbarui atau hak akses ditolak']);
            }
        } else {
            // INSERT
            $stmt = $conn->prepare("INSERT INTO catatan_perilaku (siswa_id, guru_id, tanggal, tipe, catatan) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("iisss", $siswa_id, $guru_id, $tanggal, $tipe, $catatan);
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'message' => 'Catatan berhasil disimpan']);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal menyimpan: ' . $stmt->error]);
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
            sendResponse(['success' => false, 'message' => 'ID catatan tidak valid'], 400);
        }

        $guru_id = $user['user_id'];
        $stmt = $conn->prepare("DELETE FROM catatan_perilaku WHERE id=? AND (guru_id=? OR ?='admin')");
        $stmt->bind_param("iis", $id, $guru_id, $user['role']);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            sendResponse(['success' => true, 'message' => 'Catatan berhasil dihapus']);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus atau hak akses ditolak']);
        }
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}
?>
