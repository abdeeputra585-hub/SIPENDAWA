<?php
/**
 * api/kehadiran.php - DIPERBAIKI
 * - GET untuk lihat kehadiran siswa
 * - POST untuk tambah kehadiran baru
 * - DELETE untuk hapus kehadiran
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];


/**
 * Helper - escape output
 */
function escapeOutput($data) {
    if (is_array($data)) {
        return array_map('escapeOutput', $data);
    }
    return htmlspecialchars($data ?? '', ENT_QUOTES, 'UTF-8');
}

switch ($method) {
    
    case 'GET':
        if (!isset($_GET['siswa_id']) || empty($_GET['siswa_id'])) {
            sendResponse(['success' => false, 'message' => 'siswa_id wajib diisi'], 400);
        }
        
        $siswaId = (int)$_GET['siswa_id'];
        $action = $_GET['action'] ?? '';
        
        if ($action === 'summary') {
            // GET ringkasan kehadiran siswa
            $sql = "SELECT status, COUNT(*) as total FROM kehadiran 
                   WHERE siswa_id = ? 
                   GROUP BY status";
            $stmt = $conn->prepare($sql);
            
            if (!$stmt) {
                sendResponse(['success' => false, 'message' => 'Database error'], 500);
            }
            
            $stmt->bind_param("i", $siswaId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $summary = [
                'Hadir' => 0,
                'Izin' => 0,
                'Sakit' => 0,
                'Alpa' => 0,
                'Total' => 0
            ];
            
            while ($row = $result->fetch_assoc()) {
                $summary[$row['status']] = (int)$row['total'];
                $summary['Total'] += (int)$row['total'];
            }

            // Get history terbaru
            $historySql = "SELECT tanggal, status, keterangan FROM kehadiran 
                          WHERE siswa_id = ? 
                          ORDER BY tanggal DESC LIMIT 10";
            $histStmt = $conn->prepare($historySql);
            $histStmt->bind_param("i", $siswaId);
            $histStmt->execute();
            $histResult = $histStmt->get_result();
            
            $history = [];
            while ($row = $histResult->fetch_assoc()) {
                $history[] = escapeOutput($row);
            }

            sendResponse([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'history' => $history
                ]
            ]);
            
            $stmt->close();
            $histStmt->close();
        } else {
            // GET list kehadiran siswa
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $perPage = 20;
            $offset = ($page - 1) * $perPage;
            
            $sql = "SELECT id, tanggal, status, keterangan, created_at 
                   FROM kehadiran 
                   WHERE siswa_id = ? 
                   ORDER BY tanggal DESC 
                   LIMIT $perPage OFFSET $offset";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $siswaId);
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
            $countResult = $countStmt->get_result();
            $countRow = $countResult->fetch_assoc();
            $total = $countRow['total'];
            
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
            
            $stmt->close();
            $countStmt->close();
        }
        break;

    case 'POST':
        $input = getJsonInput();
        
        if (empty($input['siswa_id']) || empty($input['tanggal']) || empty($input['status'])) {
            sendResponse(['success' => false, 'message' => 'siswa_id, tanggal, dan status wajib diisi'], 400);
        }
        
        // Validasi status
        $validStatus = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
        if (!in_array($input['status'], $validStatus)) {
            sendResponse(['success' => false, 'message' => 'Status harus: Hadir, Izin, Sakit, atau Alpa'], 400);
        }
        
        // Validasi tanggal format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['tanggal'])) {
            sendResponse(['success' => false, 'message' => 'Format tanggal harus YYYY-MM-DD'], 400);
        }
        
        $siswaId = (int)$input['siswa_id'];
        $tanggal = $input['tanggal'];
        $status = $input['status'];
        $keterangan = $input['keterangan'] ?? '';
        
        // Cek apakah siswa ada
        $checkSql = "SELECT id FROM siswa WHERE id = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("i", $siswaId);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows === 0) {
            sendResponse(['success' => false, 'message' => 'Siswa tidak ditemukan'], 404);
        }
        $checkStmt->close();
        
        // Cek apakah kehadiran untuk tanggal tersebut sudah ada
        $existSql = "SELECT id FROM kehadiran WHERE siswa_id = ? AND tanggal = ?";
        $existStmt = $conn->prepare($existSql);
        $existStmt->bind_param("is", $siswaId, $tanggal);
        $existStmt->execute();
        
        if ($existStmt->get_result()->num_rows > 0) {
            sendResponse(['success' => false, 'message' => 'Kehadiran untuk tanggal ini sudah tercatat'], 409);
        }
        $existStmt->close();
        
        // Insert kehadiran
        $sql = "INSERT INTO kehadiran (siswa_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }
        
        $stmt->bind_param("isss", $siswaId, $tanggal, $status, $keterangan);
        
        if ($stmt->execute()) {
            sendResponse([
                'success' => true,
                'message' => 'Kehadiran berhasil dicatat',
                'data' => ['id' => $conn->insert_id]
            ], 201);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal mencatat kehadiran'], 500);
        }
        $stmt->close();
        break;

    case 'PUT':
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID kehadiran diperlukan'], 400);
        }
        
        $id = (int)$_GET['id'];
        $input = getJsonInput();
        
        $fields = [];
        $types = '';
        $values = [];
        
        if (isset($input['status']) && in_array($input['status'], ['Hadir', 'Izin', 'Sakit', 'Alpa'])) {
            $fields[] = "status = ?";
            $types .= 's';
            $values[] = $input['status'];
        }
        
        if (isset($input['keterangan'])) {
            $fields[] = "keterangan = ?";
            $types .= 's';
            $values[] = $input['keterangan'];
        }
        
        if (empty($fields)) {
            sendResponse(['success' => false, 'message' => 'Tidak ada data yang diupdate'], 400);
        }
        
        $types .= 'i';
        $values[] = $id;
        
        $sql = "UPDATE kehadiran SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }
        
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            sendResponse(['success' => true, 'message' => 'Kehadiran berhasil diupdate']);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal update kehadiran'], 500);
        }
        $stmt->close();
        break;

    case 'DELETE':
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID kehadiran diperlukan'], 400);
        }
        
        $id = (int)$_GET['id'];
        
        $sql = "DELETE FROM kehadiran WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }
        
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Kehadiran berhasil dihapus']);
            } else {
                sendResponse(['success' => false, 'message' => 'Kehadiran tidak ditemukan'], 404);
            }
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus kehadiran'], 500);
        }
        $stmt->close();
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>
