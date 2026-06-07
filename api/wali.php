<?php
/**
 * api/wali.php
 * GET    — daftar semua wali / wali by id
 * POST   — tambah wali baru  (wajib login: admin)
 * PUT    — update wali by id (wajib login: admin | parent utk diri sendiri)
 * DELETE — hapus wali by id  (wajib login: admin)
 *
 * BUG FIX: Hapus double-escaping real_escape_string + bind_param
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ── GET: daftar wali atau detail satu wali ────────────────────────────
    case 'GET':
        if (isset($_GET['id'])) {
            $id   = (int)$_GET['id'];
            $sql  = "SELECT w.*, u.email as user_email, u.role
                     FROM wali w
                     LEFT JOIN users u ON w.user_id = u.id
                     WHERE w.id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                sendResponse(['success' => false, 'message' => 'Wali tidak ditemukan'], 404);
            }

            sendResponse(['success' => true, 'data' => $result->fetch_assoc()]);
            $stmt->close();
        } else {
            $sql    = "SELECT w.id, w.nama, w.email, w.telepon, w.pekerjaan, w.status, w.created_at
                       FROM wali w
                       ORDER BY w.created_at DESC";
            $result = $conn->query($sql);

            $waliList = [];
            while ($row = $result->fetch_assoc()) {
                $waliList[] = $row;
            }

            sendResponse([
                'success' => true,
                'data'    => $waliList,
                'total'   => count($waliList)
            ]);
        }
        break;

    // ── POST: tambah wali baru (wajib login sebagai admin) ───────────────
    case 'POST':
        requireAuth(['admin']);

        $input = getJsonInput();

        if (empty($input['nama'])) {
            sendResponse(['success' => false, 'message' => 'Nama wali wajib diisi'], 400);
        }

        // FIX: Gunakan bind_param langsung — TIDAK pakai real_escape_string bersamaan
        $nama      = trim($input['nama']);
        $email     = trim($input['email']     ?? '');
        $telepon   = trim($input['telepon']   ?? '');
        $pekerjaan = trim($input['pekerjaan'] ?? '');
        $alamat    = trim($input['alamat']    ?? '');
        $status    = $input['status']         ?? 'Pending';

        // Validasi status
        if (!in_array($status, ['Terverifikasi', 'Pending', 'Ditolak'])) {
            $status = 'Pending';
        }

        $sql  = "INSERT INTO wali (nama, email, telepon, pekerjaan, alamat, status)
                 VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error: ' . $conn->error], 500);
        }

        $stmt->bind_param("ssssss", $nama, $email, $telepon, $pekerjaan, $alamat, $status);

        if ($stmt->execute()) {
            $newId = $conn->insert_id;

            // Notifikasi otomatis ke admin
            $judulNotif = "Wali Baru Ditambahkan";
            $pesanNotif = "Data wali $nama telah ditambahkan oleh admin.";
            $notifSql   = "INSERT INTO notifikasi (judul, pesan, tipe, user_id) VALUES (?, ?, 'info', 1)";
            $notifStmt  = $conn->prepare($notifSql);
            if ($notifStmt) {
                $notifStmt->bind_param("ss", $judulNotif, $pesanNotif);
                $notifStmt->execute();
                $notifStmt->close();
            }

            sendResponse([
                'success' => true,
                'message' => 'Data wali berhasil ditambahkan',
                'data'    => ['id' => $newId]
            ], 201);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menambahkan wali: ' . $stmt->error], 500);
        }
        $stmt->close();
        break;

    // ── PUT: update wali (admin atau parent untuk profil sendiri) ─────────
    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID wali diperlukan'], 400);
        }

        $authUser = requireAuth(['admin', 'parent', 'kepala_sekolah']);
        $id       = (int)$_GET['id'];
        $input    = getJsonInput();

        // Parent hanya boleh edit wali yang terhubung ke user_id-nya
        if ($authUser['role'] === 'parent') {
            $checkSql  = "SELECT id FROM wali WHERE id = ? AND user_id = ?";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bind_param("ii", $id, $authUser['user_id']);
            $checkStmt->execute();
            if ($checkStmt->get_result()->num_rows === 0) {
                sendResponse(['success' => false, 'message' => 'Forbidden — Anda hanya bisa edit profil Anda sendiri'], 403);
            }
            $checkStmt->close();
        }

        $fields = [];
        $types  = '';
        $values = [];

        if (isset($input['nama']))      { $fields[] = "nama = ?";      $types .= 's'; $values[] = trim($input['nama']); }
        if (isset($input['email']))     { $fields[] = "email = ?";     $types .= 's'; $values[] = trim($input['email']); }
        if (isset($input['telepon']))   { $fields[] = "telepon = ?";   $types .= 's'; $values[] = trim($input['telepon']); }
        if (isset($input['pekerjaan'])) { $fields[] = "pekerjaan = ?"; $types .= 's'; $values[] = trim($input['pekerjaan']); }
        if (isset($input['alamat']))    { $fields[] = "alamat = ?";    $types .= 's'; $values[] = trim($input['alamat']); }
        if (isset($input['status']) && $authUser['role'] === 'admin') {
            $fields[] = "status = ?"; $types .= 's'; $values[] = $input['status'];
        }

        if (empty($fields)) {
            sendResponse(['success' => false, 'message' => 'Tidak ada data yang diupdate'], 400);
        }

        $types   .= 'i';
        $values[] = $id;

        $sql  = "UPDATE wali SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }

        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            sendResponse(['success' => true, 'message' => 'Data wali berhasil diupdate']);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal update wali'], 500);
        }
        $stmt->close();
        break;

    // ── DELETE: hapus wali (hanya admin) ─────────────────────────────────
    case 'DELETE':
        requireAuth(['admin']);

        if (!isset($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID wali diperlukan'], 400);
        }

        $id   = (int)$_GET['id'];
        $sql  = "DELETE FROM wali WHERE id = ?";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error'], 500);
        }

        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Data wali berhasil dihapus']);
            } else {
                sendResponse(['success' => false, 'message' => 'Wali tidak ditemukan'], 404);
            }
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus wali'], 500);
        }
        $stmt->close();
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>
