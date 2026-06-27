<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$authUser = requireAuth(['parent']);
$userId = (int)$authUser['user_id'];

// Get wali info
$stmt = $conn->prepare("SELECT id, nama FROM wali WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$wali = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$wali) {
    sendResponse(['success' => false, 'message' => 'Profil wali tidak ditemukan'], 404);
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
    // Rata-rata Nilai
    $stmt = $conn->prepare("SELECT AVG(nilai) as rata FROM nilai WHERE siswa_id = ?");
    $stmt->bind_param("i", $selectedSiswaId);
    $stmt->execute();
    $rata = $stmt->get_result()->fetch_assoc()['rata'];
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

// Pesan Belum Dibaca
// Query untuk pesan baru schema
$stmt = $conn->prepare("SELECT COUNT(id) as unread FROM messages WHERE id_recipient = ? AND dibaca = 0 AND is_deleted = 0");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stats['pesan_baru'] = (int)$stmt->get_result()->fetch_assoc()['unread'];
$stmt->close();

// Notifikasi Terbaru
$notifikasi = [];
$stmt = $conn->prepare("SELECT id, judul, pesan, tipe, created_at, dibaca FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
$stmt->bind_param("i", $userId);
$stmt->execute();
$resNotif = $stmt->get_result();
while($row = $resNotif->fetch_assoc()){
    $notifikasi[] = $row;
}
$stmt->close();

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
