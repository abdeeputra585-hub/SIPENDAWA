<?php
/**
 * api/pengumuman.php
 * GET    — daftar pengumuman (semua role)
 * POST   — buat pengumuman baru (admin only)
 * DELETE — hapus pengumuman (admin only)
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ── GET: daftar semua pengumuman ─────────────────────────────────────
    case 'GET':
        $limit  = (int)($_GET['limit'] ?? 20);
        $sql    = "SELECT p.id, p.judul, p.isi, p.tipe, p.created_at, u.nama as penulis_nama
                   FROM pengumuman p
                   LEFT JOIN users u ON p.penulis_id = u.id
                   ORDER BY p.created_at DESC
                   LIMIT ?";
        $stmt   = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $list   = [];
        while ($row = $result->fetch_assoc()) $list[] = $row;
        $stmt->close();

        sendResponse(['success' => true, 'data' => $list, 'total' => count($list)]);
        break;

    // ── POST: buat pengumuman baru (admin only) ──────────────────────────
    case 'POST':
        $authUser = requireAuth(['admin']);
        $input    = getJsonInput();

        if (empty($input['judul']) || empty($input['isi'])) {
            sendResponse(['success' => false, 'message' => 'Judul dan isi pengumuman wajib diisi'], 400);
        }

        $judul    = trim($input['judul']);
        $isi      = trim($input['isi']);
        $tipe     = $input['tipe'] ?? 'info';
        $penulisId = (int)$authUser['user_id'];

        if (!in_array($tipe, ['info', 'penting', 'warning'])) $tipe = 'info';

        $sql  = "INSERT INTO pengumuman (judul, isi, tipe, penulis_id) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $judul, $isi, $tipe, $penulisId);

        if ($stmt->execute()) {
            $newId = $conn->insert_id;

            // Kirim notifikasi ke semua user (broadcast)
            $allUsers = $conn->query("SELECT id FROM users WHERE role IN ('parent', 'kepala_sekolah')");
            $notifSql = "INSERT INTO notifikasi (judul, pesan, tipe, user_id) VALUES (?, ?, 'info', ?)";
            $nStmt    = $conn->prepare($notifSql);
            $notifMsg = "📢 " . substr($isi, 0, 150) . (strlen($isi) > 150 ? '...' : '');
            while ($u = $allUsers->fetch_assoc()) {
                $nStmt->bind_param("ssi", $judul, $notifMsg, $u['id']);
                $nStmt->execute();
            }
            $nStmt->close();

            sendResponse([
                'success' => true,
                'message' => 'Pengumuman berhasil dipublikasikan ke semua pengguna',
                'data'    => ['id' => $newId]
            ], 201);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal membuat pengumuman: ' . $stmt->error], 500);
        }
        $stmt->close();
        break;

    // ── DELETE: hapus pengumuman (admin only) ────────────────────────────
    case 'DELETE':
        requireAuth(['admin']);

        if (!isset($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID pengumuman diperlukan'], 400);
        }

        $id   = (int)$_GET['id'];
        $stmt = $conn->prepare("DELETE FROM pengumuman WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Pengumuman berhasil dihapus']);
            } else {
                sendResponse(['success' => false, 'message' => 'Pengumuman tidak ditemukan'], 404);
            }
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus pengumuman'], 500);
        }
        $stmt->close();
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>
