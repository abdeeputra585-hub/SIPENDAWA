<?php
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['admin']);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) $data = $_POST;

$id = (int)($data['id'] ?? 0);
$action = trim($data['action'] ?? ''); // 'approve' or 'reject'
$alasan = trim($data['alasan'] ?? '');

if (!$id || !in_array($action, ['approve', 'reject'])) {
    sendResponse(['success' => false, 'message' => 'ID dan Action valid diperlukan'], 400);
}

// Get payment detail
$stmt = $conn->prepare("SELECT p.*, s.nama as nama_siswa FROM pembayaran p JOIN siswa s ON p.id_siswa = s.id WHERE p.id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$pemb = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$pemb || $pemb['status'] !== 'Menunggu Konfirmasi') {
    sendResponse(['success' => false, 'message' => 'Pembayaran tidak valid atau sudah diproses'], 400);
}

if ($action === 'approve') {
    // 1. Update status
    $upStmt = $conn->prepare("UPDATE pembayaran SET status = 'Lunas', tgl_bayar = NOW() WHERE id = ?");
    $upStmt->bind_param("i", $id);
    if ($upStmt->execute()) {
        // 2. Generate invoice
        $invNum = 'INV-' . date('Ymd') . '-' . str_pad($id, 4, '0', STR_PAD_LEFT);
        $conn->query("INSERT INTO invoice (id_pembayaran, invoice_number) VALUES ($id, '$invNum')");
        
        $msg = 'Pembayaran disetujui';
        $notifJudul = "Pembayaran Berhasil Diverifikasi";
        $notifPesan = "Bukti pembayaran Anda untuk tagihan {$pemb['tipe_pembayaran']} ananda {$pemb['nama_siswa']} telah disetujui. Pembayaran dinyatakan Lunas.";
        $notifTipe = "success";
    }
} else {
    // Reject
    // Hapus file fisik jika ada
    if ($pemb['bukti_file'] && file_exists(dirname(__DIR__, 3) . '/' . $pemb['bukti_file'])) {
        @unlink(dirname(__DIR__, 3) . '/' . $pemb['bukti_file']);
    }
    
    // Tentukan status kembalian (jika lewat jatuh tempo jadi Overdue, else Belum bayar)
    $tglTempo = strtotime($pemb['tgl_jatuh_tempo']);
    $newStatus = (time() > $tglTempo) ? 'Overdue' : 'Belum bayar';
    
    $catatanFull = $pemb['catatan'] ? $pemb['catatan'] . "\n\n" : "";
    if ($alasan) $catatanFull .= "[Ditolak]: " . $alasan;

    $upStmt = $conn->prepare("UPDATE pembayaran SET status = ?, bukti_file = NULL, catatan = ? WHERE id = ?");
    $upStmt->bind_param("ssi", $newStatus, $catatanFull, $id);
    $upStmt->execute();

    $msg = 'Pembayaran ditolak';
    $notifJudul = "Pembayaran Ditolak";
    $notifPesan = "Bukti pembayaran Anda untuk tagihan {$pemb['tipe_pembayaran']} ananda {$pemb['nama_siswa']} telah DITOLAK." . ($alasan ? " Alasan: $alasan" : "");
    $notifTipe = "error";
}

// Kirim Notifikasi
$getWali = $conn->prepare("SELECT w.user_id FROM relasi r JOIN wali w ON r.wali_id = w.id WHERE r.siswa_id = ? AND w.user_id IS NOT NULL");
$getWali->bind_param("i", $pemb['id_siswa']);
$getWali->execute();
$waliRes = $getWali->get_result();
while ($w = $waliRes->fetch_assoc()) {
    $nStmt = $conn->prepare("INSERT INTO notifikasi (user_id, judul, pesan, tipe) VALUES (?, ?, ?, ?)");
    $nStmt->bind_param("isss", $w['user_id'], $notifJudul, $notifPesan, $notifTipe);
    $nStmt->execute();
    $nStmt->close();
}

sendResponse(['success' => true, 'message' => $msg]);
?>
