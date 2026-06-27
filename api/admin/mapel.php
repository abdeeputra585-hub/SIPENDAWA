<?php
/**
 * api/admin/mapel.php - Endpoint untuk manajemen master data Mata Pelajaran (CRUD)
 */
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Hanya admin dan kepala sekolah yang bisa mengelola master data mapel
$user = requireAuth(['admin', 'kepala_sekolah']);

if ($method === 'GET') {
    // Ambil daftar mata pelajaran
    $query = "SELECT * FROM mata_pelajaran ORDER BY nama_pelajaran ASC";
    $result = $conn->query($query);
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    sendResponse(['success' => true, 'data' => $data]);
} 
elseif ($method === 'POST') {
    // Tambah mata pelajaran baru
    $input = getJsonInput();
    $nama_pelajaran = trim($input['nama_pelajaran'] ?? '');
    $kode_pelajaran = trim($input['kode_pelajaran'] ?? '');

    if (empty($nama_pelajaran)) {
        sendResponse(['success' => false, 'message' => 'Nama Pelajaran wajib diisi'], 400);
    }

    $stmt = $conn->prepare("INSERT INTO mata_pelajaran (nama_pelajaran, kode_pelajaran) VALUES (?, ?)");
    $stmt->bind_param("ss", $nama_pelajaran, $kode_pelajaran);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true, 'message' => 'Mata Pelajaran berhasil ditambahkan', 'id' => $conn->insert_id]);
    } else {
        if ($conn->errno === 1062) {
            sendResponse(['success' => false, 'message' => 'Nama Mata Pelajaran tersebut sudah ada'], 400);
        }
        sendResponse(['success' => false, 'message' => 'Gagal menambah mata pelajaran: ' . $stmt->error], 500);
    }
}
elseif ($method === 'PUT') {
    // Update mata pelajaran
    $input = getJsonInput();
    $id = intval($input['id'] ?? 0);
    $nama_pelajaran = trim($input['nama_pelajaran'] ?? '');
    $kode_pelajaran = trim($input['kode_pelajaran'] ?? '');

    if ($id <= 0 || empty($nama_pelajaran)) {
        sendResponse(['success' => false, 'message' => 'Data tidak lengkap atau ID tidak valid'], 400);
    }

    $stmt = $conn->prepare("UPDATE mata_pelajaran SET nama_pelajaran = ?, kode_pelajaran = ? WHERE id = ?");
    $stmt->bind_param("ssi", $nama_pelajaran, $kode_pelajaran, $id);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true, 'message' => 'Mata Pelajaran berhasil diperbarui']);
    } else {
        if ($conn->errno === 1062) {
            sendResponse(['success' => false, 'message' => 'Nama Mata Pelajaran tersebut sudah digunakan'], 400);
        }
        sendResponse(['success' => false, 'message' => 'Gagal memperbarui mata pelajaran: ' . $stmt->error], 500);
    }
}
elseif ($method === 'DELETE') {
    // Hapus mata pelajaran
    // Catatan: ON DELETE CASCADE sudah ada di guru_mata_pelajaran.
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
