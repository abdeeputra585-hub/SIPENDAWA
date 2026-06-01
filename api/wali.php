<?php
/**
 * api/wali.php
 * GET  - ambil daftar wali / wali by id
 * POST - tambah wali baru
 * PUT  - update wali by id
 * DELETE - hapus wali by id
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

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

    case 'POST':
        $input = getJsonInput();

        if (empty($input['nama'])) {
            sendResponse(['success' => false, 'message' => 'Nama wali wajib diisi'], 400);
        }

        $nama      = $conn->real_escape_string(trim($input['nama']));
        $email     = isset($input['email'])     ? $conn->real_escape_string(trim($input['email']))     : '';
        $telepon   = isset($input['telepon'])   ? $conn->real_escape_string(trim($input['telepon']))   : '';
        $pekerjaan = isset($input['pekerjaan']) ? $conn->real_escape_string(trim($input['pekerjaan'])) : '';
        $alamat    = isset($input['alamat'])    ? $conn->real_escape_string(trim($input['alamat']))    : '';
        $status    = isset($input['status'])    ? $conn->real_escape_string($input['status'])          : 'Pending';

        // Validasi status
        $validStatus = ['Terverifikasi', 'Pending', 'Ditolak'];
        if (!in_array($status, $validStatus)) $status = 'Pending';

        $sql  = "INSERT INTO wali (nama, email, telepon, pekerjaan, alamat, status)
                 VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            sendResponse(['success' => false, 'message' => 'Database error: ' . $conn->error], 500);
        }

        $stmt->bind_param("ssssss", $nama, $email, $telepon, $pekerjaan, $alamat, $status);

        if ($stmt->execute()) {
            $newId = $conn->insert_id;

            // Buat notifikasi otomatis
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

    case 'PUT':
        if (!isset($_GET['id'])) {
            sendResponse(['success' => false, 'message' => 'ID wali diperlukan'], 400);
        }

        $id    = (int)$_GET['id'];
        $input = getJsonInput();

        $fields = [];
        $types  = '';
        $values = [];

        if (isset($input['nama']))      { $fields[] = "nama = ?";      $types .= 's'; $values[] = $input['nama']; }
        if (isset($input['email']))     { $fields[] = "email = ?";     $types .= 's'; $values[] = $input['email']; }
        if (isset($input['telepon']))   { $fields[] = "telepon = ?";   $types .= 's'; $values[] = $input['telepon']; }
        if (isset($input['pekerjaan'])) { $fields[] = "pekerjaan = ?"; $types .= 's'; $values[] = $input['pekerjaan']; }
        if (isset($input['alamat']))    { $fields[] = "alamat = ?";    $types .= 's'; $values[] = $input['alamat']; }
        if (isset($input['status']))    { $fields[] = "status = ?";    $types .= 's'; $values[] = $input['status']; }

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

    case 'DELETE':
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
