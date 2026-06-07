<?php
/**
 * api/auth/google.php
 * POST — Verifikasi Google ID Token, buat/login akun otomatis
 *
 * Flow:
 * 1. Frontend kirim id_token dari Google Sign-In
 * 2. Backend verifikasi ke Google API
 * 3. Cari/buat user di database
 * 4. Return JWT token kita sendiri
 */

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Method tidak diizinkan'], 405);
}

$input   = getJsonInput();
$idToken = trim($input['id_token'] ?? '');

if (empty($idToken)) {
    sendResponse(['success' => false, 'message' => 'Google ID token diperlukan'], 400);
}

// ── Verifikasi token ke Google ──────────────────────────────────────────────
$googleData = verifyGoogleToken($idToken);

if (!$googleData) {
    sendResponse(['success' => false, 'message' => 'Token Google tidak valid atau sudah expired'], 401);
}

// ── Validasi Client ID ──────────────────────────────────────────────────────
$expectedClientId = Env::get('GOOGLE_CLIENT_ID', '');
if (!empty($expectedClientId) && $googleData['aud'] !== $expectedClientId) {
    sendResponse(['success' => false, 'message' => 'Client ID tidak cocok — periksa konfigurasi'], 401);
}

$googleId = $googleData['sub'];          // ID unik Google user
$email    = $googleData['email'];
$nama     = $googleData['name'];
$avatar   = $googleData['picture'] ?? null;

// ── Cari user berdasarkan google_id atau email ──────────────────────────────
$stmt = $conn->prepare(
    "SELECT id, email, role, nama, avatar, google_id FROM users WHERE google_id = ? OR email = ? LIMIT 1"
);
$stmt->bind_param("ss", $googleId, $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // User sudah ada — update google_id jika belum tersimpan
    $user = $result->fetch_assoc();
    $stmt->close();

    if (empty($user['google_id'])) {
        $updStmt = $conn->prepare("UPDATE users SET google_id = ?, avatar = ? WHERE id = ?");
        $updStmt->bind_param("ssi", $googleId, $avatar, $user['id']);
        $updStmt->execute();
        $updStmt->close();
        $user['avatar'] = $avatar;
    }

    // Perbarui avatar jika berbeda (foto Google bisa berubah)
    if (!empty($avatar) && $user['avatar'] !== $avatar) {
        $updAvatar = $conn->prepare("UPDATE users SET avatar = ? WHERE id = ?");
        $updAvatar->bind_param("si", $avatar, $user['id']);
        $updAvatar->execute();
        $updAvatar->close();
        $user['avatar'] = $avatar;
    }

} else {
    // User baru — buat akun otomatis sebagai parent
    $stmt->close();
    $conn->begin_transaction();

    try {
        // Password acak (tidak bisa dipakai untuk login biasa)
        $randomPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);

        $insUser = $conn->prepare(
            "INSERT INTO users (email, password, role, nama, avatar, google_id) VALUES (?, ?, 'parent', ?, ?, ?)"
        );
        $insUser->bind_param("sssss", $email, $randomPass, $nama, $avatar, $googleId);
        $insUser->execute();
        $userId = $conn->insert_id;
        $insUser->close();

        // Buat entry wali otomatis
        $insWali = $conn->prepare(
            "INSERT INTO wali (user_id, nama, email, status) VALUES (?, ?, ?, 'Pending')"
        );
        $insWali->bind_param("iss", $userId, $nama, $email);
        $insWali->execute();
        $insWali->close();

        // Notifikasi ke admin
        $judulNotif = "Pengguna Baru via Google";
        $pesanNotif = "{$nama} ({$email}) mendaftar menggunakan akun Google. Silakan verifikasi data wali.";
        $insNotif   = $conn->prepare(
            "INSERT INTO notifikasi (judul, pesan, tipe, user_id) VALUES (?, ?, 'info', 1)"
        );
        $insNotif->bind_param("ss", $judulNotif, $pesanNotif);
        $insNotif->execute();
        $insNotif->close();

        $conn->commit();

        $user = [
            'id'        => $userId,
            'email'     => $email,
            'role'      => 'parent',
            'nama'      => $nama,
            'avatar'    => $avatar,
            'google_id' => $googleId
        ];

    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(['success' => false, 'message' => 'Gagal membuat akun: ' . $e->getMessage()], 500);
    }
}

// ── Generate JWT token kita ─────────────────────────────────────────────────
$token = generateToken([
    'user_id' => (int)$user['id'],
    'email'   => $user['email'],
    'role'    => $user['role']
]);

sendResponse([
    'success' => true,
    'message' => 'Login dengan Google berhasil! Selamat datang, ' . $user['nama'] . '.',
    'token'   => $token,
    'data'    => [
        'id'     => (int)$user['id'],
        'email'  => $user['email'],
        'role'   => $user['role'],
        'nama'   => $user['nama'],
        'avatar' => $user['avatar']
    ]
]);

$conn->close();

// ── Helper: Verifikasi ID Token ke Google API ────────────────────────────────
function verifyGoogleToken($idToken) {
    $url  = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);

    // Coba dengan cURL dulu (lebih andal)
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json']
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        // Fallback: file_get_contents
        $context  = stream_context_create(['http' => ['timeout' => 10]]);
        $response = @file_get_contents($url, false, $context);
        $httpCode = 200;
        if ($response === false) return null;
    }

    if (!$response) return null;

    $data = json_decode($response, true);

    if (isset($data['error']) || $httpCode !== 200) return null;

    // Validasi field minimum yang dibutuhkan
    if (empty($data['sub']) || empty($data['email'])) return null;

    return $data;
}
?>
