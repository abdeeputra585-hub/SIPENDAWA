<?php
/**
 * api/dashboard.php
 * GET — statistik dashboard, chart data, verifikasi antrian, aktivitas
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$action = $_GET['action'] ?? 'stats';

switch ($action) {

    // ── Stats utama ───────────────────────────────────────────────────────
    case 'stats':
        $totalWali       = (int)$conn->query("SELECT COUNT(*) as t FROM wali")->fetch_assoc()['t'];
        $totalSiswa      = (int)$conn->query("SELECT COUNT(*) as t FROM siswa")->fetch_assoc()['t'];
        $totalRelasi     = (int)$conn->query("SELECT COUNT(*) as t FROM relasi")->fetch_assoc()['t'];
        $totalNotifikasi = (int)$conn->query("SELECT COUNT(*) as t FROM notifikasi")->fetch_assoc()['t'];
        $notifBaru       = (int)$conn->query("SELECT COUNT(*) as t FROM notifikasi WHERE dibaca = 0")->fetch_assoc()['t'];
        $pendingWali     = (int)$conn->query("SELECT COUNT(*) as t FROM wali WHERE status = 'Pending'")->fetch_assoc()['t'];

        sendResponse([
            'success' => true,
            'data'    => [
                'total_wali'        => $totalWali,
                'total_siswa'       => $totalSiswa,
                'total_relasi'      => $totalRelasi,
                'total_notifikasi'  => $totalNotifikasi,
                'notif_baru'        => $notifBaru,
                'pending_wali'      => $pendingWali,
            ]
        ]);
        break;

    // ── Wali terbaru (tabel di dashboard) ────────────────────────────────
    case 'wali_terbaru':
        $limit = (int)($_GET['limit'] ?? 5);
        $sql   = "SELECT id, nama, email, pekerjaan, status, created_at FROM wali ORDER BY created_at DESC LIMIT ?";
        $stmt  = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result   = $stmt->get_result();
        $waliList = [];
        while ($row = $result->fetch_assoc()) $waliList[] = $row;
        sendResponse(['success' => true, 'data' => $waliList]);
        $stmt->close();
        break;

    // ── Aktivitas terkini dari notifikasi ────────────────────────────────
    case 'aktivitas':
        $sql    = "SELECT id, judul, pesan, tipe, created_at FROM notifikasi ORDER BY created_at DESC LIMIT 8";
        $result = $conn->query($sql);
        $list   = [];
        while ($row = $result->fetch_assoc()) $list[] = $row;
        sendResponse(['success' => true, 'data' => $list]);
        break;

    // ── Chart: Distribusi status siswa ───────────────────────────────────
    case 'chart_siswa':
        $result  = $conn->query("SELECT status, COUNT(*) as total FROM siswa GROUP BY status");
        $labels  = [];
        $values  = [];
        while ($row = $result->fetch_assoc()) {
            $labels[] = $row['status'];
            $values[] = (int)$row['total'];
        }
        sendResponse(['success' => true, 'data' => ['labels' => $labels, 'values' => $values]]);
        break;

    // ── Chart: Distribusi status wali ────────────────────────────────────
    case 'chart_wali':
        $result  = $conn->query("SELECT status, COUNT(*) as total FROM wali GROUP BY status");
        $labels  = [];
        $values  = [];
        while ($row = $result->fetch_assoc()) {
            $labels[] = $row['status'];
            $values[] = (int)$row['total'];
        }
        sendResponse(['success' => true, 'data' => ['labels' => $labels, 'values' => $values]]);
        break;

    // ── Chart: Kehadiran per bulan (6 bulan terakhir) ────────────────────
    case 'chart_kehadiran':
        $sql = "SELECT 
                    DATE_FORMAT(tanggal, '%Y-%m') as bulan,
                    DATE_FORMAT(tanggal, '%b %Y') as bulan_label,
                    SUM(status = 'Hadir') as hadir,
                    SUM(status = 'Izin')  as izin,
                    SUM(status = 'Sakit') as sakit,
                    SUM(status = 'Alpa')  as alpa
                FROM kehadiran
                WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b %Y')
                ORDER BY bulan ASC
                LIMIT 6";
        $result = $conn->query($sql);
        $labels = [];
        $hadir  = [];
        $alpa   = [];
        $izin   = [];
        while ($row = $result->fetch_assoc()) {
            $labels[] = $row['bulan_label'];
            $hadir[]  = (int)$row['hadir'];
            $alpa[]   = (int)$row['alpa'];
            $izin[]   = (int)$row['izin'] + (int)$row['sakit'];
        }
        // Jika belum ada data kehadiran, buat data placeholder
        if (empty($labels)) {
            $months = [];
            for ($i = 5; $i >= 0; $i--) {
                $months[] = date('M Y', strtotime("-$i months"));
            }
            $labels = $months;
            $hadir  = [0, 0, 0, 0, 0, 0];
            $alpa   = [0, 0, 0, 0, 0, 0];
            $izin   = [0, 0, 0, 0, 0, 0];
        }
        sendResponse([
            'success' => true,
            'data'    => ['labels' => $labels, 'hadir' => $hadir, 'alpa' => $alpa, 'izin' => $izin]
        ]);
        break;

    // ── Antrian verifikasi wali (pending) ────────────────────────────────
    case 'antrian_verifikasi':
        $sql  = "SELECT id, nama, email, telepon, pekerjaan, created_at FROM wali WHERE status = 'Pending' ORDER BY created_at ASC LIMIT 10";
        $result = $conn->query($sql);
        $list   = [];
        while ($row = $result->fetch_assoc()) $list[] = $row;
        sendResponse(['success' => true, 'data' => $list, 'total' => count($list)]);
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

$conn->close();
?>
