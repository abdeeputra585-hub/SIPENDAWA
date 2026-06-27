<?php
/**
 * POST /api/admin/izin/approve.php
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin']);
$userId = (int)$authUser['user_id'];

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$ids = $data['ids'] ?? [];
$catatan = $data['catatan'] ?? '';

if (empty($ids) || !is_array($ids)) {
    sendResponse(['success' => false, 'error' => 'Tidak ada pengajuan yang dipilih'], 400);
}

$successCount = 0;
foreach ($ids as $id) {
    $id = (int)$id;
    $stmt = $conn->prepare("UPDATE absence_requests SET status = 'Approved', approved_by = ?, catatan_approval = ? WHERE id = ? AND status = 'Pending'");
    $stmt->bind_param("isi", $userId, $catatan, $id);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        $successCount++;
        
        // Bonus: Auto insert ke kehadiran (opsional, karena beda skema kita skip dulu logic detailnya agar aman,
        // tapi logikanya bisa mengambil tgl_mulai sampai tgl_selesai lalu looping INSERT).
        // Kita terapkan looping insert:
        $res = $conn->query("SELECT id_siswa, tipe_izin, tgl_mulai, tgl_selesai FROM absence_requests WHERE id = $id");
        if ($res && $res->num_rows > 0) {
            $req = $res->fetch_assoc();
            $mulai = new DateTime($req['tgl_mulai']);
            $selesai = new DateTime($req['tgl_selesai']);
            // Ubah tipe ke enum kehadiran (Sakit/Izin/Alpha/Hadir)
            $stsHadir = $req['tipe_izin'] === 'Sakit' ? 'Sakit' : 'Izin'; 
            
            while ($mulai <= $selesai) {
                $tgl = $mulai->format('Y-m-d');
                $stmtKeh = $conn->prepare("INSERT INTO kehadiran_siswa (siswa_id, tanggal, status, keterangan) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?, keterangan=?");
                $ket = "Disetujui dari pengajuan (ID: $id)";
                $stmtKeh->bind_param("isssss", $req['id_siswa'], $tgl, $stsHadir, $ket, $stsHadir, $ket);
                $stmtKeh->execute();
                $mulai->modify('+1 day');
            }
        }
    }
}

sendResponse([
    'success' => true,
    'message' => "$successCount pengajuan berhasil disetujui"
]);
?>
