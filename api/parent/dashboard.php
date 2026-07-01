<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

// Get wali info via email join (karena user_id di tabel wali tidak selalu terisi)
$stmt = $conn->prepare("
    SELECT w.id, w.nama 
    FROM wali w 
    JOIN users u ON w.email = u.email 
    WHERE u.id = ?
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$wali = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$wali) {
    // Fallback: cek apakah ada wali dengan email yang sama
    $stmtEmail = $conn->prepare("SELECT email FROM users WHERE id = ?");
    $stmtEmail->bind_param("i", $userId);
    $stmtEmail->execute();
    $userRow = $stmtEmail->get_result()->fetch_assoc();
    $stmtEmail->close();
    
    if ($userRow) {
        $stmtWali = $conn->prepare("SELECT id, nama FROM wali WHERE email = ?");
        $stmtWali->bind_param("s", $userRow['email']);
        $stmtWali->execute();
        $wali = $stmtWali->get_result()->fetch_assoc();
        $stmtWali->close();
    }
}

if (!$wali) {
    sendResponse(['success' => false, 'message' => 'Profil wali tidak ditemukan. Hubungi admin.'], 404);
}
$waliId = (int)$wali['id'];

// 1. Ambil daftar anak
$listSiswa = [];
$stmt = $conn->prepare("
    SELECT s.id, s.nama, s.kelas, s.nisn, s.foto 
    FROM siswa s 
    JOIN relasi r ON s.id = r.siswa_id 
    WHERE r.wali_id = ? AND r.status = 'Terverifikasi'
");
$stmt->bind_param("i", $waliId);
$stmt->execute();
$resSiswa = $stmt->get_result();
while($row = $resSiswa->fetch_assoc()){
    $listSiswa[] = $row;
}
$stmt->close();

$selectedSiswaId = (int)($_GET['id_siswa'] ?? 0);
$siswaAktif = null;

if (count($listSiswa) > 0) {
    if ($selectedSiswaId > 0) {
        foreach($listSiswa as $s) {
            if((int)$s['id'] === $selectedSiswaId) {
                $siswaAktif = $s; break;
            }
        }
    }
    if (!$siswaAktif) {
        $siswaAktif = $listSiswa[0];
        $selectedSiswaId = (int)$siswaAktif['id'];
    }
}

// Default Stats
$stats = [
    'rata_nilai' => 0,
    'persentase_kehadiran' => 0,
    'tunggakan_spp' => 0,
    'pesan_baru' => 0
];

if ($siswaAktif) {
    // Rata-rata Nilai (kolom nilai_akhir)
    $stmt = $conn->prepare("SELECT AVG(nilai_akhir) as rata FROM nilai WHERE siswa_id = ?");
    $stmt->bind_param("i", $selectedSiswaId);
    $stmt->execute();
    $rataRow = $stmt->get_result()->fetch_assoc();
    $rata = $rataRow ? $rataRow['rata'] : null;
    $stats['rata_nilai'] = $rata ? round($rata, 1) : 0;
    $stmt->close();

    // Persentase Kehadiran
    $stmt = $conn->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='Hadir' THEN 1 ELSE 0 END) as hadir FROM kehadiran WHERE siswa_id = ?");
    $stmt->bind_param("i", $selectedSiswaId);
    $stmt->execute();
    $khd = $stmt->get_result()->fetch_assoc();
    $totalHadir = (int)$khd['total'];
    $jmlHadir = (int)$khd['hadir'];
    $stats['persentase_kehadiran'] = $totalHadir > 0 ? round(($jmlHadir / $totalHadir) * 100) : 100;
    $stmt->close();

    // Tunggakan Pembayaran
    $stmt = $conn->prepare("SELECT SUM(jumlah) as tunggakan FROM pembayaran WHERE id_siswa = ? AND status != 'Lunas' AND status != 'Menunggu Konfirmasi'");
    $stmt->bind_param("i", $selectedSiswaId);
    $stmt->execute();
    $tg = $stmt->get_result()->fetch_assoc()['tunggakan'];
    $stats['tunggakan_spp'] = $tg ? (float)$tg : 0;
    $stmt->close();
}

// Pesan Belum Dibaca (dengan fallback aman)
try {
    $stmtMsg = $conn->prepare("SELECT COUNT(id) as unread FROM messages WHERE id_recipient = ? AND dibaca = 0 AND is_deleted = 0");
    if ($stmtMsg) {
        $stmtMsg->bind_param("i", $userId);
        $stmtMsg->execute();
        $msgRow = $stmtMsg->get_result()->fetch_assoc();
        $stats['pesan_baru'] = (int)($msgRow['unread'] ?? 0);
        $stmtMsg->close();
    }
} catch (Exception $e) {
    $stats['pesan_baru'] = 0;
}

// Notifikasi Terbaru (dengan fallback aman)
$notifikasi = [];
try {
    $stmtNotif = $conn->prepare("SELECT id, judul, pesan, tipe, created_at, dibaca FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
    if ($stmtNotif) {
        $stmtNotif->bind_param("i", $userId);
        $stmtNotif->execute();
        $resNotif = $stmtNotif->get_result();
        while($row = $resNotif->fetch_assoc()){
            $notifikasi[] = $row;
        }
        $stmtNotif->close();
    }
} catch (Exception $e) {
    $notifikasi = [];
}

sendResponse([
    'success' => true,
    'data' => [
        'wali' => ['nama' => $wali['nama']],
        'siswa_aktif' => $siswaAktif,
        'list_siswa' => $listSiswa,
        'stats' => $stats,
        'notifikasi_terbaru' => $notifikasi
    ]
]);
?>
