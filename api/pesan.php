<?php
require_once __DIR__ . '/config.php';

$authUser = requireAuth(['admin', 'parent', 'guru', 'kepala_sekolah']);
$userId = (int)$authUser['user_id'];
$role = $authUser['role'];

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

switch ($action) {
    case 'list':
        // Dapatkan daftar percakapan pengguna
        if ($role === 'parent') {
            $query = "
                SELECT c.id as conversation_id, c.updated_at,
                       u.id as other_user_id, u.nama as other_name, u.avatar as foto as other_foto, u.role as other_role,
                       (SELECT isi_pesan FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.id_sender != ? AND m.dibaca = 0) as unread_count
                FROM chat_conversations c
                JOIN users u ON c.id_guru = u.id
                WHERE c.id_wali = ?
                ORDER BY c.updated_at DESC
            ";
        } else if ($role === 'guru') {
            $query = "
                SELECT c.id as conversation_id, c.updated_at,
                       u.id as other_user_id, u.nama as other_name, u.avatar as foto as other_foto, u.role as other_role,
                       (SELECT isi_pesan FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.id_sender != ? AND m.dibaca = 0) as unread_count
                FROM chat_conversations c
                JOIN users u ON c.id_wali = u.id
                WHERE c.id_guru = ?
                ORDER BY c.updated_at DESC
            ";
        } else {
            sendResponse(['success' => true, 'data' => []]);
        }

        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $userId, $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        $data = [];
        while ($row = $res->fetch_assoc()) {
            if (!$row['last_message_time']) $row['last_message_time'] = $row['updated_at'];
            $data[] = escapeOutput($row);
        }
        sendResponse(['success' => true, 'data' => $data]);
        break;

    case 'history':
        $conversationId = (int)($_GET['conversation_id'] ?? 0);
        $otherUserId = (int)($_GET['other_user_id'] ?? 0);

        // Jika conversation_id 0 tapi ada other_user_id, coba cari
        if ($conversationId === 0 && $otherUserId > 0) {
            $idWali = $role === 'parent' ? $userId : $otherUserId;
            $idGuru = $role === 'guru' ? $userId : $otherUserId;
            
            $stmt = $conn->prepare("SELECT id FROM chat_conversations WHERE id_wali = ? AND id_guru = ?");
            $stmt->bind_param("ii", $idWali, $idGuru);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                $conversationId = $row['id'];
            }
        }

        if ($conversationId === 0) {
            sendResponse(['success' => true, 'data' => [], 'conversation_id' => 0]);
        }

        // Ambil pesan
        $stmt = $conn->prepare("
            SELECT m.*, u.nama as sender_name 
            FROM chat_messages m
            JOIN users u ON m.id_sender = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        ");
        $stmt->bind_param("i", $conversationId);
        $stmt->execute();
        $res = $stmt->get_result();
        $data = [];
        while ($row = $res->fetch_assoc()) {
            if ($row['is_deleted']) {
                $row['isi_pesan'] = 'Pesan ini telah dihapus';
                $row['attachment'] = null;
            }
            $data[] = escapeOutput($row);
        }
        sendResponse(['success' => true, 'data' => $data, 'conversation_id' => $conversationId]);
        break;

    case 'send':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
        }

        $conversationId = (int)($_POST['conversation_id'] ?? 0);
        $otherUserId = (int)($_POST['other_user_id'] ?? 0);
        $isiPesan = trim($_POST['message'] ?? '');

        if (!$isiPesan && !isset($_FILES['attachment'])) {
            sendResponse(['success' => false, 'message' => 'Pesan atau lampiran tidak boleh kosong'], 400);
        }

        // Cari atau buat percakapan
        if ($conversationId === 0) {
            if (!$otherUserId) sendResponse(['success' => false, 'message' => 'Penerima tidak valid'], 400);
            
            $idWali = $role === 'parent' ? $userId : $otherUserId;
            $idGuru = $role === 'guru' ? $userId : $otherUserId;

            $stmt = $conn->prepare("SELECT id FROM chat_conversations WHERE id_wali = ? AND id_guru = ?");
            $stmt->bind_param("ii", $idWali, $idGuru);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            
            if ($row) {
                $conversationId = $row['id'];
            } else {
                $stmt = $conn->prepare("INSERT INTO chat_conversations (id_wali, id_guru) VALUES (?, ?)");
                $stmt->bind_param("ii", $idWali, $idGuru);
                $stmt->execute();
                $conversationId = $conn->insert_id;
            }
        }

        // Cek dan upload file
        $attachmentPath = null;
        if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['attachment'];
            $maxSize = 5 * 1024 * 1024; // 5MB
            if ($file['size'] > $maxSize) {
                sendResponse(['success' => false, 'message' => 'Ukuran file maks 5MB'], 400);
            }
            
            $allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mime, $allowed)) {
                sendResponse(['success' => false, 'message' => 'Format file tidak didukung'], 400);
            }

            $uploadDir = dirname(__DIR__) . '/uploads/chat/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = time() . '_' . rand(100,999) . '.' . $ext;
            $fullPath = $uploadDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $fullPath)) {
                $attachmentPath = 'uploads/chat/' . $filename;
            }
        }

        // Insert pesan
        $stmt = $conn->prepare("INSERT INTO chat_messages (conversation_id, id_sender, isi_pesan, attachment) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiss", $conversationId, $userId, $isiPesan, $attachmentPath);
        if ($stmt->execute()) {
            // Update timestamp conversation
            $conn->query("UPDATE chat_conversations SET updated_at = NOW() WHERE id = $conversationId");
            
            sendResponse([
                'success' => true, 
                'message' => 'Pesan terkirim',
                'data' => [
                    'id' => $conn->insert_id,
                    'conversation_id' => $conversationId,
                    'isi_pesan' => htmlspecialchars($isiPesan),
                    'attachment' => $attachmentPath,
                    'created_at' => date('Y-m-d H:i:s'),
                    'id_sender' => $userId
                ]
            ]);
        } else {
            sendResponse(['success' => false, 'message' => 'Gagal mengirim pesan'], 500);
        }
        break;

    case 'read':
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $conversationId = (int)($data['conversation_id'] ?? 0);
        if ($conversationId) {
            $stmt = $conn->prepare("UPDATE chat_messages SET dibaca = 1 WHERE conversation_id = ? AND id_sender != ?");
            $stmt->bind_param("ii", $conversationId, $userId);
            $stmt->execute();
            sendResponse(['success' => true]);
        }
        sendResponse(['success' => false], 400);
        break;

    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $messageId = (int)($data['message_id'] ?? 0);
        if ($messageId) {
            $stmt = $conn->prepare("UPDATE chat_messages SET is_deleted = 1 WHERE id = ? AND id_sender = ?");
            $stmt->bind_param("ii", $messageId, $userId);
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                sendResponse(['success' => true, 'message' => 'Pesan dihapus']);
            }
        }
        sendResponse(['success' => false, 'message' => 'Gagal menghapus pesan'], 400);
        break;

    case 'contacts':
        // Endpoint tambahan: daftar guru/wali untuk membuat chat baru
        if ($role === 'parent') {
            $query = "SELECT id, nama, email, foto, role FROM users WHERE role = 'guru'";
        } else if ($role === 'guru') {
            $query = "SELECT id, nama, email, foto, role FROM users WHERE role = 'parent'";
        } else {
            sendResponse(['success' => true, 'data' => []]);
        }
        $res = $conn->query($query);
        $data = [];
        while ($row = $res->fetch_assoc()) $data[] = escapeOutput($row);
        sendResponse(['success' => true, 'data' => $data]);
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Action invalid'], 400);
}

