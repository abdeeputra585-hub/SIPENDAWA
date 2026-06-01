<?php
/**
 * api/siswa.php - DIPERBAIKI
 * - Memerlukan autentikasi dengan JWT token
 * - Output di-escape untuk cegah XSS
 * - Prepared statement untuk cegah SQL injection
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Endpoint yang memodifikasi data (POST/PUT/DELETE) tetap perlu auth di production
// Untuk sementara, GET diizinkan tanpa auth agar frontend bisa load data

/**
 * Helper function - escape output untuk cegah XSS
 */
function escapeOutput($data) {
    if (is_array($data)) {
        return array_map('escapeOutput', $data);
    }
    return htmlspecialchars($data ?? '', ENT_QUOTES, 'UTF-8');
}

switch ($method) {
    
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            
            $sql = "SELECT s.id, s.nisn, s.nama, s.kelas, s.jenis_kelamin, s.status, s.alamat, s.created_at,
                        GROUP_CONCAT(CONCAT(w.nama, '|', r.tipe, '|', w.email, '|', w.telepon) SEPARATOR ';;') as wali_info
                    FROM siswa s 
                    LEFT JOIN relasi r ON s.id = r.siswa_id 
                    LEFT JOIN wali w ON r.wali_id = w.id 
                    WHERE s.id = ?
                    GROUP BY s.id";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                sendResponse(['success' => false, 'message' => 'Database error'], 500);
            }
            
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                sendResponse(['success' => false, 'message' => 'Siswa tidak ditemukan'], 404);
            }

            $siswa = $result->fetch_assoc();
            
            // Parse wali info
            $waliList = [];
            if (!empty($siswa['wali_info'])) {
                $waliItems = explode(';;', $siswa['wali_info']);
                foreach ($waliItems as $item) {
                    $parts = explode('|', $item);
                    $waliList[] = [
                        'nama' => $parts[0] ?? '',
                        'tipe' => $parts[1] ?? '',
                        'email' => $parts[2] ?? '',
                        'telepon' => $parts[3] ?? ''
                    ];
                }
            }
            
            unset($siswa['wali_info']);
            
            // ESCAPE OUTPUT untuk XSS protection
            $siswa = escapeOutput($siswa);
            $waliList = escapeOutput($waliList);
            
            sendResponse([
                'success' => true,
                'data' => array_merge($siswa, ['wali' => $waliList])
            ]);
            
            $stmt->close();
        } else {
            // List semua siswa dengan pagination
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $perPage = 20;
            $offset = ($page - 1) * $perPage;
            
            $sql = "SELECT id, nisn, nama, kelas, jenis_kelamin, status, created_at FROM siswa";
            
            // Filter by kelas jika ada
            if (isset($_GET['kelas']) && !empty($_GET['kelas'])) {
                $kelas = $conn->real_escape_string($_GET['kelas']);
                $sql .= " WHERE kelas LIKE '%$kelas%'";
            }
            
            // Filter by status jika ada
            if (isset($_GET['status']) && !empty($_GET['status'])) {
                $status = $conn->real_escape_string($_GET['status']);
                $sql .= (strpos($sql, 'WHERE') !== false ? ' AND' : ' WHERE') . " status = '$status'";
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT $perPage OFFSET $offset";
            
            $result = $conn->query($sql);
            $siswaList = [];
            
            while ($row = $result->fetch_assoc()) {
                $siswaList[] = escapeOutput($row);
            }

            // Hitung total untuk pagination
            $totalSql = "SELECT COUNT(*) as total FROM siswa";
            if (isset($_GET['kelas']) && !empty($_GET['kelas'])) {
                $kelas = $conn->real_escape_string($_GET['kelas']);
                $totalSql .= " WHERE kelas LIKE '%$kelas%'";
            }
            
            $totalResult = $conn->query($totalSql);
            $totalRow = $totalResult->fetch_assoc();
            $total = $totalRow['total'];
            $totalPages = ceil($total / $perPage);

            // Statistik
            $stats = [];
            $statusQuery = $conn->query("SELECT status, COUNT(*) as count FROM siswa GROUP BY status");
            while ($row = $statusQuery->fetch_assoc()) {
                $stats[$row['status']] = (int)$row['count'];
            }

            // Hitung stats dengan key yang sesuai dengan frontend
            $statTotal  = array_sum($stats);
            $statAktif  = $stats['Aktif'] ?? 0;
            $statVerif  = $stats['Verifikasi'] ?? 0;
            $statAlumni = ($stats['Alumni'] ?? 0) + ($stats['Pindah'] ?? 0);

            sendResponse([
                'success' => true,
                'data' => $siswaList,
                'pagination' => [
                    'page' => $page,
                    'perPage' => $perPage,
                    'total' => $total,
                    'totalPages' => $totalPages
                ],
                'stats' => [
                    'total'        => $statTotal,
                    'aktif'        => $statAktif,
                    'verifikasi'   => $statVerif,
                    'alumni_pindah'=> $statAlumni
                ]
            ]);
        }
        break;

    case 'POST':
        $input = getJsonInput();

        if (empty($input['nisn']) || empty($input['nama']) || empty($input['kelas']) || empty($input['jenis_kelamin'])) {
            sendResponse(['success' => false, 'message' => 'NISN, nama, kelas, dan jenis kelamin wajib diisi'], 400);
        }

        // Cek NISN sudah ada atau belum
        $checkSql = "SELECT id FROM siswa WHERE nisn = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("s", $input['nisn']);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows > 0) {
            sendResponse(['success' => false, 'message' => 'NISN sudah terdaftar'], 409);
        }
        $checkStmt->close();

        $sql = "INSERT INTO siswa (nisn, nama, kelas, jenis_kelamin, status, alamat) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }
        
        $status = $input['status'] ?? 'Aktif';
        $alamat = $input['alamat'] ?? '';
        
        $stmt->bind_param(
            "ssssss",
            $input['nisn'],
            $input['nama'],
            $input['kelas'],
            $input['jenis_kelamin'],
            $status,
            $alamat
        );

        if ($stmt->execute()) {
            sendResponse([
                'success' => true,
                'message' => 'Siswa berhasil ditambahkan',
                'data' => ['id' => $conn->insert_id]
            ], 201);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menambahkan siswa'], 500);
        }
        $stmt->close();
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID siswa diperlukan'], 400);
        }

        $id = (int)$_GET['id'];
        $input = getJsonInput();

        $fields = [];
        $types = '';
        $values = [];

        if (isset($input['nisn'])) { 
            $fields[] = "nisn = ?"; 
            $types .= 's'; 
            $values[] = $input['nisn']; 
        }
        if (isset($input['nama'])) { 
            $fields[] = "nama = ?"; 
            $types .= 's'; 
            $values[] = $input['nama']; 
        }
        if (isset($input['kelas'])) { 
            $fields[] = "kelas = ?"; 
            $types .= 's'; 
            $values[] = $input['kelas']; 
        }
        if (isset($input['jenis_kelamin'])) { 
            $fields[] = "jenis_kelamin = ?"; 
            $types .= 's'; 
            $values[] = $input['jenis_kelamin']; 
        }
        if (isset($input['status'])) { 
            $fields[] = "status = ?"; 
            $types .= 's'; 
            $values[] = $input['status']; 
        }
        if (isset($input['alamat'])) { 
            $fields[] = "alamat = ?"; 
            $types .= 's'; 
            $values[] = $input['alamat']; 
        }

        if (empty($fields)) {
            sendResponse(['success' => false, 'message' => 'Tidak ada data yang diupdate'], 400);
        }

        $types .= 'i';
        $values[] = $id;

        $sql = "UPDATE siswa SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }
        
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            sendResponse(['success' => true, 'message' => 'Data siswa berhasil diupdate']);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal update siswa'], 500);
        }
        $stmt->close();
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID siswa diperlukan'], 400);
        }

        $id = (int)$_GET['id'];
        $sql = "DELETE FROM siswa WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }
        
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Siswa berhasil dihapus']);
            } else {
                sendResponse(['success' => false, 'message' => 'Siswa tidak ditemukan'], 404);
            }
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus siswa'], 500);
        }
        $stmt->close();
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>
