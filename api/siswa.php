<?php
/**
 * api/siswa.php
 * GET    — list siswa (admin/kepsek: semua | parent: hanya anaknya)
 * POST   — tambah siswa (admin only)
 * PUT    — update siswa (admin only)
 * DELETE — hapus siswa  (admin only)
 *
 * BUG FIX: filter kelas pakai prepared statement (bukan interpolasi string)
 * BUG FIX: parent hanya bisa lihat data siswa yang berelasi dengannya
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

function escapeOutput($data) {
    if (is_array($data)) return array_map('escapeOutput', $data);
    return htmlspecialchars($data ?? '', ENT_QUOTES, 'UTF-8');
}

switch ($method) {

    // ── GET ──────────────────────────────────────────────────────────────
    case 'GET':
        $authUser = optionalAuth();

        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];

            // Parent: cek apakah siswa ini memang anaknya
            if ($authUser && $authUser['role'] === 'parent') {
                $ownCheck = $conn->prepare(
                    "SELECT r.id FROM relasi r
                     JOIN wali w ON r.wali_id = w.id
                     WHERE r.siswa_id = ? AND w.user_id = ?"
                );
                $ownCheck->bind_param("ii", $id, $authUser['user_id']);
                $ownCheck->execute();
                if ($ownCheck->get_result()->num_rows === 0) {
                    sendResponse(['success' => false, 'message' => 'Forbidden — bukan data anak Anda'], 403);
                }
                $ownCheck->close();
            }

            $sql  = "SELECT s.id, s.nisn, s.nama, s.tanggal_lahir, s.kelas, s.jenis_kelamin, s.status, s.alamat, s.created_at,
                         GROUP_CONCAT(CONCAT(w.nama, '|', r.tipe, '|', IFNULL(w.email,''), '|', IFNULL(w.telepon,'')) SEPARATOR ';;') as wali_info
                     FROM siswa s
                     LEFT JOIN relasi r ON s.id = r.siswa_id
                     LEFT JOIN wali w ON r.wali_id = w.id
                     WHERE s.id = ?
                     GROUP BY s.id";
            $stmt = $conn->prepare($sql);
            if (!$stmt) sendResponse(['success' => false, 'message' => 'Database error'], 500);
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                sendResponse(['success' => false, 'message' => 'Siswa tidak ditemukan'], 404);
            }

            $siswa    = $result->fetch_assoc();
            $waliList = [];
            if (!empty($siswa['wali_info'])) {
                foreach (explode(';;', $siswa['wali_info']) as $item) {
                    $p = explode('|', $item);
                    $waliList[] = [
                        'nama'    => $p[0] ?? '',
                        'tipe'    => $p[1] ?? '',
                        'email'   => $p[2] ?? '',
                        'telepon' => $p[3] ?? ''
                    ];
                }
            }
            unset($siswa['wali_info']);
            $siswa    = escapeOutput($siswa);
            $waliList = escapeOutput($waliList);

            sendResponse(['success' => true, 'data' => array_merge($siswa, ['wali' => $waliList])]);
            $stmt->close();

        } else {
            // Jika parent, hanya tampilkan siswa yang berelasi dengannya
            if ($authUser && $authUser['role'] === 'parent') {
                $sql  = "SELECT DISTINCT s.id, s.nisn, s.nama, s.kelas, s.jenis_kelamin, s.status, s.created_at
                         FROM siswa s
                         JOIN relasi r ON s.id = r.siswa_id
                         JOIN wali w ON r.wali_id = w.id
                         WHERE w.user_id = ?
                         ORDER BY s.created_at DESC";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $authUser['user_id']);
                $stmt->execute();
                $result     = $stmt->get_result();
                $siswaList  = [];
                while ($row = $result->fetch_assoc()) $siswaList[] = escapeOutput($row);
                $stmt->close();

                sendResponse([
                    'success' => true,
                    'data'    => $siswaList,
                    'stats'   => ['total' => count($siswaList), 'aktif' => 0, 'verifikasi' => 0, 'alumni_pindah' => 0]
                ]);
            }

            // Admin & Kepala Sekolah: semua siswa dengan filter
            $page    = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $perPage = 20;
            $offset  = ($page - 1) * $perPage;

            // FIX: Bangun query dengan prepared statement
            $conditions = [];
            $bindTypes  = '';
            $bindValues = [];

            if (!empty($_GET['kelas'])) {
                $conditions[] = "kelas LIKE ?";
                $bindTypes   .= 's';
                $kelasParam   = '%' . $_GET['kelas'] . '%';
                $bindValues[] = $kelasParam;
            }

            if (!empty($_GET['status'])) {
                $conditions[] = "status = ?";
                $bindTypes   .= 's';
                $bindValues[] = $_GET['status'];
            }

            $whereClause = $conditions ? " WHERE " . implode(' AND ', $conditions) : '';
            $sql         = "SELECT id, nisn, nama, kelas, jenis_kelamin, status, created_at
                            FROM siswa{$whereClause}
                            ORDER BY created_at DESC LIMIT ? OFFSET ?";

            $bindTypes   .= 'ii';
            $bindValues[] = $perPage;
            $bindValues[] = $offset;

            $stmt = $conn->prepare($sql);
            if (!$stmt) sendResponse(['success' => false, 'message' => 'Database error'], 500);
            if ($bindValues) $stmt->bind_param($bindTypes, ...$bindValues);
            $stmt->execute();
            $result    = $stmt->get_result();
            $siswaList = [];
            while ($row = $result->fetch_assoc()) $siswaList[] = escapeOutput($row);
            $stmt->close();

            // Total count
            $countSql  = "SELECT COUNT(*) as total FROM siswa{$whereClause}";
            $countStmt = $conn->prepare($countSql);
            if ($conditions) {
                $countTypes  = substr($bindTypes, 0, -2); // tanpa 'ii' terakhir
                $countValues = array_slice($bindValues, 0, -2);
                if ($countValues) $countStmt->bind_param($countTypes, ...$countValues);
            }
            $countStmt->execute();
            $total      = (int)$countStmt->get_result()->fetch_assoc()['total'];
            $totalPages = (int)ceil($total / $perPage);
            $countStmt->close();

            // Statistik
            $stats       = [];
            $statusQuery = $conn->query("SELECT status, COUNT(*) as count FROM siswa GROUP BY status");
            while ($row = $statusQuery->fetch_assoc()) $stats[$row['status']] = (int)$row['count'];

            sendResponse([
                'success'    => true,
                'data'       => $siswaList,
                'pagination' => ['page' => $page, 'perPage' => $perPage, 'total' => $total, 'totalPages' => $totalPages],
                'stats'      => [
                    'total'         => array_sum($stats),
                    'aktif'         => $stats['Aktif']       ?? 0,
                    'verifikasi'    => $stats['Verifikasi']  ?? 0,
                    'alumni_pindah' => ($stats['Alumni'] ?? 0) + ($stats['Pindah'] ?? 0)
                ]
            ]);
        }
        break;

    // ── POST: tambah siswa (admin only) ──────────────────────────────────
    case 'POST':
        requireAuth(['admin']);
        $input = getJsonInput();

        if (empty($input['nisn']) || empty($input['nama']) || empty($input['kelas']) || empty($input['jenis_kelamin'])) {
            sendResponse(['success' => false, 'message' => 'NISN, nama, kelas, dan jenis kelamin wajib diisi'], 400);
        }

        $checkStmt = $conn->prepare("SELECT id FROM siswa WHERE nisn = ?");
        $checkStmt->bind_param("s", $input['nisn']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows > 0) {
            sendResponse(['success' => false, 'message' => 'NISN sudah terdaftar'], 409);
        }
        $checkStmt->close();

        $status        = $input['status']        ?? 'Aktif';
        $alamat        = $input['alamat']         ?? '';
        $tanggal_lahir = $input['tanggal_lahir']  ?? null;

        $sql  = "INSERT INTO siswa (nisn, nama, tanggal_lahir, kelas, jenis_kelamin, status, alamat) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) sendResponse(['success' => false, 'message' => 'Database error'], 500);
        $stmt->bind_param("sssssss", $input['nisn'], $input['nama'], $tanggal_lahir, $input['kelas'], $input['jenis_kelamin'], $status, $alamat);

        if ($stmt->execute()) {
            sendResponse(['success' => true, 'message' => 'Siswa berhasil ditambahkan', 'data' => ['id' => $conn->insert_id]], 201);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menambahkan siswa'], 500);
        }
        $stmt->close();
        break;

    // ── PUT: update siswa (admin only) ───────────────────────────────────
    case 'PUT':
        requireAuth(['admin']);

        if (!isset($_GET['id'])) sendResponse(['success' => false, 'message' => 'ID siswa diperlukan'], 400);

        $id    = (int)$_GET['id'];
        $input = getJsonInput();
        $fields = []; $types = ''; $values = [];

        if (isset($input['nisn']))          { $fields[] = "nisn = ?";          $types .= 's'; $values[] = $input['nisn']; }
        if (isset($input['nama']))          { $fields[] = "nama = ?";          $types .= 's'; $values[] = $input['nama']; }
        if (array_key_exists('tanggal_lahir', $input)) { $fields[] = "tanggal_lahir = ?"; $types .= 's'; $values[] = $input['tanggal_lahir'] ?: null; }
        if (isset($input['kelas']))         { $fields[] = "kelas = ?";         $types .= 's'; $values[] = $input['kelas']; }
        if (isset($input['jenis_kelamin'])) { $fields[] = "jenis_kelamin = ?"; $types .= 's'; $values[] = $input['jenis_kelamin']; }
        if (isset($input['status']))        { $fields[] = "status = ?";        $types .= 's'; $values[] = $input['status']; }
        if (isset($input['alamat']))        { $fields[] = "alamat = ?";        $types .= 's'; $values[] = $input['alamat']; }

        if (empty($fields)) sendResponse(['success' => false, 'message' => 'Tidak ada data yang diupdate'], 400);

        $types .= 'i'; $values[] = $id;
        $sql  = "UPDATE siswa SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) sendResponse(['success' => false, 'message' => 'Database error'], 500);
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            sendResponse(['success' => true, 'message' => 'Data siswa berhasil diupdate']);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal update siswa'], 500);
        }
        $stmt->close();
        break;

    // ── DELETE: hapus siswa (admin only) ─────────────────────────────────
    case 'DELETE':
        requireAuth(['admin']);

        if (!isset($_GET['id'])) sendResponse(['success' => false, 'message' => 'ID siswa diperlukan'], 400);

        $id   = (int)$_GET['id'];
        $sql  = "DELETE FROM siswa WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) sendResponse(['success' => false, 'message' => 'Database error'], 500);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Siswa berhasil dihapus']);
            } else {
                sendResponse(['success' => false, 'message' => 'Siswa tidak ditemukan'], 404);
            }
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal menghapus siswa'], 500);
        }
        $stmt->close();
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$conn->close();
?>
