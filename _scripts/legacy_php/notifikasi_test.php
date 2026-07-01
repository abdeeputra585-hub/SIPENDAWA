<?php
/**
 * api/notifikasi.php
 * GET  — ambil daftar notifikasi (filter per user_id dari token)
 * POST — tandai notifikasi sebagai dibaca (mark as read)
 *
 * BUG FIX: Tambah endpoint POST untuk mark as read
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ── GET: ambil notifikasi ─────────────────────────────────────────────
    case 'GET':
        $authUser = optionalAuth();

        if ($authUser) {
            $userId = $authUser['user_id'];
            $role   = $authUser['role'] ?? '';

            if ($role === 'admin' || $role === 'kepala_sekolah') {
                $sql    = "SELECT n.id, n.judul, n.pesan, n.tipe, n.dibaca, n.created_at, u.nama as user_nama
                           FROM notifikasi n
                           LEFT JOIN users u ON n.user_id = u.id
                           ORDER BY n.created_at DESC";
                $stmt   = $conn->prepare($sql);
                $stmt->execute();
            } else {
                $sql    = "SELECT id, judul, pesan, tipe, dibaca, created_at
                           FROM notifikasi
                           WHERE user_id = ? OR user_id IS NULL
                           ORDER BY created_at DESC";
                $stmt   = $conn->prepare($sql);
                $stmt->bind_param("i", $userId);
                $stmt->execute();
            }
            $result = $stmt->get_result();
        } elseif (isset($_GET['user_id'])) {
            // Fallback: filter via query param (tanpa token)
            $userId = (int)$_GET['user_id'];
            $sql    = "SELECT id, judul, pesan, tipe, dibaca, created_at
                       FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC";
            $stmt   = $conn->prepare($sql);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            // Admin/tanpa login: semua notifikasi
            $sql    = "SELECT n.id, n.judul, n.pesan, n.tipe, n.dibaca, n.created_at, u.nama as user_nama
                       FROM notifikasi n
                       LEFT JOIN users u ON n.user_id = u.id
                       ORDER BY n.created_at DESC";
            $result = $conn->query($sql);
        }

        $notifList   = [];
        $belumDibaca = 0;
        while ($row = $result->fetch_assoc()) {
            if ($row['dibaca'] == 0) $belumDibaca++;
            $notifList[] = $row;
        }

        if (isset($stmt)) $stmt->close();

        sendResponse([
            'success'      => true,
            'data'         => $notifList,
            'belum_dibaca' => $belumDibaca,
            'total'        => count($notifList)
        ]);
        break;

    // ── POST: tandai notifikasi sebagai dibaca ────────────────────────────
    case 'POST':
        $input = getJsonInput();

        // Tandai satu notifikasi
        if (isset($input['id'])) {
            $id   = (int)$input['id'];
            $sql  = "UPDATE notifikasi SET dibaca = 1 WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'message' => 'Notifikasi ditandai sebagai dibaca']);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal update notifikasi'], 500);
            }
            $stmt->close();
        }

        // Tandai semua notifikasi user sebagai dibaca
        if (isset($input['mark_all']) && $input['mark_all'] === true) {
            $authUser = requireAuth();
            $userId   = $authUser['user_id'];
            $sql      = "UPDATE notifikasi SET dibaca = 1 WHERE user_id = ? AND dibaca = 0";
            $stmt     = $conn->prepare($sql);
            $stmt->bind_param("i", $userId);
            if ($stmt->execute()) {
                sendResponse(['success' => true, 'message' => 'Semua notifikasi ditandai dibaca', 'affected' => $stmt->affected_rows]);
            } else {
                sendResponse(['success' => false, 'message' => 'Gagal update notifikasi'], 500);
            }
            $stmt->close();
        }

        sendResponse(['success' => false, 'message' => 'Parameter id atau mark_all diperlukan'], 400);
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>

