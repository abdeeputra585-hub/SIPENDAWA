<?php
/**
 * DELETE /api/admin/guru/delete.php
 * Soft delete data guru
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

requireAuth(['admin']);

$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    sendResponse(['success' => false, 'error' => 'ID guru tidak valid'], 400);
}

// Cek guru exist
$stmt = $conn->prepare("SELECT u.nama FROM users u JOIN guru_profiles gp ON u.id = gp.user_id WHERE u.id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    sendResponse(['success' => false, 'error' => 'Guru tidak ditemukan'], 404);
}

$nama = $res->fetch_assoc()['nama'];

$conn->begin_transaction();
try {
    // Soft delete: set is_active = 0
    $stmtProfile = $conn->prepare("UPDATE guru_profiles SET is_active = 0 WHERE user_id = ?");
    $stmtProfile->bind_param("i", $id);
    $stmtProfile->execute();
    
    // Optional: Kita biarkan relasi mapel dan kelas, atau dihapus
    // Jika nonaktif, mungkin lebih baik dibiarkan agar data historis tau dia pernah ngajar kelas apa, 
    // tapi tergantung logic sekolah. Kita soft-delete saja sesuai instruksi.

    $conn->commit();
    sendResponse([
        'success' => true,
        'message' => 'Guru berhasil dinonaktifkan (Soft Delete)',
        'data' => [
            'id' => $id,
            'nama' => $nama
        ]
    ]);
} catch (Exception $e) {
    $conn->rollback();
    sendResponse(['success' => false, 'error' => 'Gagal menghapus: ' . $e->getMessage()], 500);
}
?>
