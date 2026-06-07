<?php
/**
 * api/parent_portal.php
 * GET — data untuk portal wali (profil wali + siswa terkait + kehadiran)
 * Membutuhkan JWT auth, role = parent
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$authUser = requireAuth(['parent', 'admin']);
$userId   = (int)$authUser['user_id'];

$action = $_GET['action'] ?? 'profil';

switch ($action) {

    // ── Profil wali (dari tabel wali, terhubung ke users) ─────────────────
    case 'profil':
        // Cari wali yang terhubung ke user ini (berdasarkan email)
        $sql  = "SELECT w.* FROM wali w
                 JOIN users u ON w.email = u.email
                 WHERE u.id = ?
                 LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $wali   = $result->fetch_assoc();
        $stmt->close();

        if (!$wali) {
            // Fallback: ambil langsung dari users
            $sql  = "SELECT id, nama, email, google_id, created_at FROM users WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $wali = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            $wali['is_user_only'] = true;
        }

        sendResponse(['success' => true, 'data' => $wali]);
        break;

    // ── Siswa terkait dengan wali ini ─────────────────────────────────────
    case 'siswa':
        $sql  = "SELECT s.*, r.tipe_hubungan, r.status as relasi_status
                 FROM siswa s
                 JOIN relasi r ON r.siswa_id = s.id
                 JOIN wali w ON r.wali_id = w.id
                 JOIN users u ON w.email = u.email
                 WHERE u.id = ?
                 ORDER BY r.created_at DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $list   = [];
        while ($row = $result->fetch_assoc()) $list[] = $row;
        $stmt->close();

        sendResponse(['success' => true, 'data' => $list, 'total' => count($list)]);
        break;

    // ── Kehadiran siswa terkait (ringkasan) ───────────────────────────────
    case 'kehadiran':
        $siswaId = (int)($_GET['siswa_id'] ?? 0);
        if (!$siswaId) {
            sendResponse(['success' => false, 'message' => 'siswa_id diperlukan'], 400);
        }

        // Verifikasi bahwa siswa ini memang terkait dengan user yang login
        $cek  = "SELECT r.id FROM relasi r
                  JOIN wali w ON r.wali_id = w.id
                  JOIN users u ON w.email = u.email
                  WHERE u.id = ? AND r.siswa_id = ?
                  LIMIT 1";
        $stmt = $conn->prepare($cek);
        $stmt->bind_param("ii", $userId, $siswaId);
        $stmt->execute();
        $valid = $stmt->get_result()->num_rows > 0;
        $stmt->close();

        if (!$valid) {
            sendResponse(['success' => false, 'message' => 'Akses tidak diizinkan'], 403);
        }

        // Ringkasan kehadiran
        $sql  = "SELECT
                    COUNT(*) as total,
                    SUM(status = 'Hadir')  as hadir,
                    SUM(status = 'Izin')   as izin,
                    SUM(status = 'Sakit')  as sakit,
                    SUM(status = 'Alpa')   as alpa
                 FROM kehadiran
                 WHERE siswa_id = ?
                   AND MONTH(tanggal) = MONTH(CURDATE())
                   AND YEAR(tanggal)  = YEAR(CURDATE())";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $siswaId);
        $stmt->execute();
        $stats = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // Persen kehadiran bulan ini
        $pct = $stats['total'] > 0
            ? round(($stats['hadir'] / $stats['total']) * 100)
            : 0;

        sendResponse([
            'success' => true,
            'data'    => [
                'total'     => (int)$stats['total'],
                'hadir'     => (int)$stats['hadir'],
                'izin'      => (int)$stats['izin'],
                'sakit'     => (int)$stats['sakit'],
                'alpa'      => (int)$stats['alpa'],
                'persen'    => $pct
            ]
        ]);
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

$conn->close();
?>
