<?php
/**
 * api/admin/mapel.php - Endpoint untuk manajemen master data Mata Pelajaran (CRUD)
 */
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Hanya admin dan kepala sekolah yang bisa mengelola master data mapel
$user = requireAuth(['admin', 'kepala_sekolah']);

if ($method === 'GET') {
    // Ambil daftar mata pelajaran beserta guru pengampunya
    $query = "
        SELECT 
            m.id, 
            m.nama_pelajaran, 
            m.kode_pelajaran,
            GROUP_CONCAT(gp.id) as guru_ids,
            GROUP_CONCAT(u.nama SEPARATOR ', ') as guru_names
        FROM mata_pelajaran m
        LEFT JOIN guru_mata_pelajaran gmp ON m.id = gmp.mata_pelajaran_id
        LEFT JOIN guru_profiles gp ON gmp.guru_profile_id = gp.id
        LEFT JOIN users u ON gp.user_id = u.id
        GROUP BY m.id
        ORDER BY m.nama_pelajaran ASC
    ";
    $result = $conn->query($query);
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $row['guru_ids'] = $row['guru_ids'] ? explode(',', $row['guru_ids']) : [];
        $data[] = $row;
    }
    
    sendResponse(['success' => true, 'data' => $data]);
} 
elseif ($method === 'POST' || $method === 'PUT') {
    // Tambah/Update mata pelajaran dan sinkronisasi guru pengampu
    $input = getJsonInput();
    $id = isset($input['id']) ? intval($input['id']) : 0;
    $nama_pelajaran = trim($input['nama_pelajaran'] ?? '');
    $kode_pelajaran = trim($input['kode_pelajaran'] ?? '');
    $guru_ids = isset($input['guru_ids']) && is_array($input['guru_ids']) ? $input['guru_ids'] : [];

    if (empty($nama_pelajaran)) {
        sendResponse(['success' => false, 'message' => 'Nama Pelajaran wajib diisi'], 400);
    }
    if ($method === 'PUT' && $id <= 0) {
        sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);
    }

    $conn->begin_transaction();
    try {
        if ($method === 'POST') {
            $stmt = $conn->prepare("INSERT INTO mata_pelajaran (nama_pelajaran, kode_pelajaran) VALUES (?, ?)");
            $stmt->bind_param("ss", $nama_pelajaran, $kode_pelajaran);
            $stmt->execute();
            $mapel_id = $conn->insert_id;
        } else {
            $stmt = $conn->prepare("UPDATE mata_pelajaran SET nama_pelajaran = ?, kode_pelajaran = ? WHERE id = ?");
            $stmt->bind_param("ssi", $nama_pelajaran, $kode_pelajaran, $id);
            $stmt->execute();
            $mapel_id = $id;

            // Hapus relasi guru sebelumnya
            $stmtDel = $conn->prepare("DELETE FROM guru_mata_pelajaran WHERE mata_pelajaran_id = ?");
            $stmtDel->bind_param("i", $mapel_id);
            $stmtDel->execute();
        }

        // Insert guru_ids yang baru
        if (!empty($guru_ids)) {
            // Filter non-numeric and invalid IDs to prevent SQL injection or bad data
            $guru_ids = array_filter(array_map('intval', $guru_ids), function($val) { return $val > 0; });
            
            if (!empty($guru_ids)) {
                $placeholders = implode(',', array_fill(0, count($guru_ids), '(?, ?)'));
                $sqlGuru = "INSERT INTO guru_mata_pelajaran (mata_pelajaran_id, guru_profile_id) VALUES " . $placeholders;
                $stmtGuru = $conn->prepare($sqlGuru);
                
                $bindTypes = str_repeat('i', count($guru_ids) * 2);
                $bindParams = [$bindTypes];
                foreach ($guru_ids as $gId) {
                    $bindParams[] = $mapel_id;
                    $bindParams[] = $gId;
                }
                
                $stmtGuru->bind_param(...$bindParams);
                $stmtGuru->execute();
            }
        }

        $conn->commit();
        $msg = $method === 'POST' ? 'Mata Pelajaran berhasil ditambahkan' : 'Mata Pelajaran berhasil diperbarui';
        sendResponse(['success' => true, 'message' => $msg, 'id' => $mapel_id]);
    } catch (Exception $e) {
        $conn->rollback();
        if ($conn->errno === 1062) {
            sendResponse(['success' => false, 'message' => 'Nama Mata Pelajaran tersebut sudah ada'], 400);
        }
        sendResponse(['success' => false, 'message' => 'Gagal memproses mata pelajaran: ' . $e->getMessage()], 500);
    }
}
elseif ($method === 'DELETE') {
    // Hapus mata pelajaran
    // ON DELETE CASCADE akan menghapus guru_mata_pelajaran otomatis
    $input = getJsonInput();
    $id = intval($input['id'] ?? 0);

    if ($id <= 0) {
        sendResponse(['success' => false, 'message' => 'ID tidak valid'], 400);
    }

    $stmt = $conn->prepare("DELETE FROM mata_pelajaran WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendResponse(['success' => true, 'message' => 'Mata Pelajaran berhasil dihapus']);
    } else {
        sendResponse(['success' => false, 'message' => 'Gagal menghapus mata pelajaran. Data mungkin tidak ditemukan.'], 500);
    }
}

sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
