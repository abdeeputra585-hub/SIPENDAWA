<?php
/**
 * POST /api/chat/send.php
 * Endpoint untuk mengirim pesan (teks & file)
 */

require_once __DIR__ . '/../config.php';
$pesanConfig = require __DIR__ . '/../../config/pesan-config.php';

// Validasi request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'error' => 'Method not allowed', 'error_code' => 'METHOD_NOT_ALLOWED'], 405);
}

// Validasi JWT dan Role
$authUser = requireAuth(['parent', 'guru']);
$idSender = (int)$authUser['user_id'];
$roleSender = $authUser['role'];

// Ambil input
$idRecipient = (int)($_POST['id_recipient'] ?? 0);
$isiPesan = trim($_POST['isi_pesan'] ?? '');

// Sanitasi input XSS
$isiPesan = htmlspecialchars($isiPesan, ENT_QUOTES, 'UTF-8');

// Validasi dasar
if ($idRecipient <= 0 || $idRecipient === $idSender) {
    sendResponse(['success' => false, 'error' => 'Penerima tidak valid', 'error_code' => 'INVALID_RECIPIENT'], 400);
}

if (empty($isiPesan) && !isset($_FILES['file'])) {
    sendResponse(['success' => false, 'error' => 'Pesan tidak boleh kosong', 'error_code' => 'EMPTY_MESSAGE'], 400);
}

if (strlen($isiPesan) > 5000) {
    sendResponse(['success' => false, 'error' => 'Pesan terlalu panjang (maks 5000 karakter)', 'error_code' => 'MESSAGE_TOO_LONG'], 400);
}

// --- Proses Upload File ---
$attachmentPath = null;
$attachmentType = null;

if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file'];
    
    // Validasi ukuran
    if ($file['size'] > $pesanConfig['max_upload_size']) {
        sendResponse(['success' => false, 'error' => 'Ukuran file maks 5MB', 'error_code' => 'FILE_TOO_LARGE'], 400);
    }
    
    // Validasi MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime, $pesanConfig['allowed_mime_types'])) {
        sendResponse(['success' => false, 'error' => 'Format file tidak didukung', 'error_code' => 'INVALID_MIME_TYPE'], 400);
    }
    
    // Validasi ekstensi
    $filenameParts = explode('.', $file['name']);
    if (count($filenameParts) > 2) {
        sendResponse(['success' => false, 'error' => 'Nama file tidak valid (multiple extensions)', 'error_code' => 'INVALID_FILE_NAME'], 400);
    }
    
    $ext = strtolower(end($filenameParts));
    if (!in_array($ext, $pesanConfig['allowed_extensions'])) {
        sendResponse(['success' => false, 'error' => 'Ekstensi file tidak didukung', 'error_code' => 'INVALID_EXTENSION'], 400);
    }
    
    // Tentukan tipe attachment
    $attachmentType = in_array($ext, ['jpg', 'jpeg', 'png']) ? 'image' : 'document';
    
    // Buat direktori jika belum ada
    $targetDir = $pesanConfig['upload_base_path'] . $idSender . '/' . $idRecipient . '/';
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    // Generate nama file unik
    $cleanOriginalName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
    $newFilename = time() . '_' . bin2hex(random_bytes(4)) . '_' . $cleanOriginalName . '.' . $ext;
    $fullPath = $targetDir . $newFilename;
    
    if (move_uploaded_file($file['tmp_name'], $fullPath)) {
        $attachmentPath = 'uploads/pesan/' . $idSender . '/' . $idRecipient . '/' . $newFilename;
    } else {
        sendResponse(['success' => false, 'error' => 'Gagal mengunggah file', 'error_code' => 'UPLOAD_FAILED'], 500);
    }
}

// Mulai transaksi database
$conn->begin_transaction();

try {
    // 1. Simpan pesan ke tabel messages
    $stmt = $conn->prepare("
        INSERT INTO messages (id_sender, id_recipient, isi_pesan, attachment, attachment_type, timestamp) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->bind_param("iisss", $idSender, $idRecipient, $isiPesan, $attachmentPath, $attachmentType);
    $stmt->execute();
    $messageId = $conn->insert_id;
    
    // Ambil timestamp pesan yang baru disimpan
    $stmtTime = $conn->prepare("SELECT timestamp FROM messages WHERE id = ?");
    $stmtTime->bind_param("i", $messageId);
    $stmtTime->execute();
    $timestamp = $stmtTime->get_result()->fetch_assoc()['timestamp'];
    
    // 2. Update atau Insert ke tabel conversations
    $idWali = $roleSender === 'parent' ? $idSender : $idRecipient;
    $idGuru = $roleSender === 'guru' ? $idSender : $idRecipient;
    
    // Preview pesan (maks 100 char)
    $preview = $isiPesan;
    if (empty($preview) && $attachmentPath) {
        $preview = '[Lampiran ' . ucfirst($attachmentType) . ']';
    } elseif (mb_strlen($preview) > 97) {
        $preview = mb_substr($preview, 0, 97) . '...';
    }
    
    // Upsert conversation
    $stmtConv = $conn->prepare("
        INSERT INTO conversations (id_wali, id_guru, last_message_id, last_message_preview, last_message_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        last_message_id = VALUES(last_message_id),
        last_message_preview = VALUES(last_message_preview),
        last_message_at = VALUES(last_message_at),
        updated_at = NOW()
    ");
    $stmtConv->bind_param("iiiss", $idWali, $idGuru, $messageId, $preview, $timestamp);
    $stmtConv->execute();
    
    $conn->commit();
    
    sendResponse([
        'success' => true,
        'message_id' => $messageId,
        'timestamp' => $timestamp,
        'attachment' => $attachmentPath
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    sendResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage(), 'error_code' => 'DB_ERROR'], 500);
}
?>
