<?php
/**
 * GET /api/chat/history.php
 * Mengambil riwayat pesan antara dua pengguna (sender dan recipient)
 */

require_once __DIR__ . '/../config.php';
$pesanConfig = require __DIR__ . '/../../config/pesan-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

// Validasi JWT dan Role
$authUser = requireAuth(['parent', 'guru']);
$idSender = (int)$authUser['user_id'];

// Ambil input
$idRecipient = (int)($_GET['id_recipient'] ?? 0);
$limit = (int)($_GET['limit'] ?? $pesanConfig['default_history_limit']);
$offset = (int)($_GET['offset'] ?? 0);

if ($idRecipient <= 0) {
    sendResponse(['success' => false, 'error' => 'Penerima tidak valid', 'error_code' => 'INVALID_RECIPIENT'], 400);
}

if ($limit > $pesanConfig['max_history_limit']) {
    $limit = $pesanConfig['max_history_limit'];
}
if ($limit <= 0) $limit = 50;
if ($offset < 0) $offset = 0;

// Update status dibaca
$stmtRead = $conn->prepare("
    UPDATE messages 
    SET dibaca = 1, dibaca_at = NOW() 
    WHERE id_sender = ? AND id_recipient = ? AND dibaca = 0
");
$stmtRead->bind_param("ii", $idRecipient, $idSender); // Pesan DARI recipient KE sender
$stmtRead->execute();

// Ambil riwayat pesan
$stmt = $conn->prepare("
    SELECT m.id, m.id_sender, u.nama as sender_name, m.isi_pesan, 
           m.attachment, m.attachment_type, m.timestamp, m.dibaca, m.dibaca_at 
    FROM messages m
    JOIN users u ON m.id_sender = u.id
    WHERE m.is_deleted = 0 AND (
        (m.id_sender = ? AND m.id_recipient = ?) OR 
        (m.id_sender = ? AND m.id_recipient = ?)
    )
    ORDER BY m.timestamp DESC
    LIMIT ? OFFSET ?
");
$stmt->bind_param("iiiiii", $idSender, $idRecipient, $idRecipient, $idSender, $limit, $offset);
$stmt->execute();
$res = $stmt->get_result();

$messages = [];
while ($row = $res->fetch_assoc()) {
    $messages[] = [
        'id' => (int)$row['id'],
        'id_sender' => (int)$row['id_sender'],
        'sender_name' => $row['sender_name'],
        'isi_pesan' => htmlspecialchars_decode($row['isi_pesan']), // Decode if safely displaying in JS
        'attachment' => $row['attachment'],
        'attachment_type' => $row['attachment_type'],
        'timestamp' => $row['timestamp'],
        'dibaca' => (bool)$row['dibaca'],
        'dibaca_at' => $row['dibaca_at']
    ];
}

// Balik array agar pesan lama di atas (untuk UI rendering di frontend)
// Ataupun biarkan order by DESC, biar JS yang append prepend
// Untuk UI SPA kita sebelumnya butuh ASC, tapi instruksi user "Order: timestamp DESC". 
// Saya akan biarkan DESC dan handle di frontend.

// Get total count
$stmtTotal = $conn->prepare("
    SELECT COUNT(id) as total 
    FROM messages 
    WHERE is_deleted = 0 AND (
        (id_sender = ? AND id_recipient = ?) OR 
        (id_sender = ? AND id_recipient = ?)
    )
");
$stmtTotal->bind_param("iiii", $idSender, $idRecipient, $idRecipient, $idSender);
$stmtTotal->execute();
$total = (int)$stmtTotal->get_result()->fetch_assoc()['total'];

sendResponse([
    'success' => true,
    'messages' => $messages,
    'total' => $total,
    'limit' => $limit,
    'offset' => $offset
]);
?>
