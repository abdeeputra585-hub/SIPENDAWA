<?php
/**
 * config.php - Konfigurasi utama API
 * - Koneksi database dari .env
 * - JWT generate & verify dengan signature HMAC
 * - Helper functions
 * - CORS lengkap
 */

require_once __DIR__ . '/../env.php';

// Set header JSON
header('Content-Type: application/json; charset=utf-8');

// CORS - izinkan semua domain yang terdaftar di .env
$allowedDomains = array_map('trim', explode(',', Env::get('ALLOWED_DOMAINS', 'http://localhost')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedDomains) || empty($origin)) {
    header("Access-Control-Allow-Origin: " . ($origin ?: $allowedDomains[0]));
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Koneksi database
try {
    $conn = new mysqli(
        Env::get('DB_HOST', 'localhost'),
        Env::get('DB_USERNAME', 'root'),
        Env::get('DB_PASSWORD', ''),
        Env::get('DB_NAME', 'eduguardian')
    );

    if ($conn->connect_error) {
        throw new Exception($conn->connect_error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => Env::get('APP_DEBUG') === 'true'
            ? 'Database error: ' . $e->getMessage()
            : 'Koneksi database gagal. Pastikan MySQL aktif.'
    ]);
    exit();
}

$conn->set_charset("utf8mb4");

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Kirim response JSON dan hentikan eksekusi
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Baca body JSON dari request
 */
function getJsonInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

// ─── JWT FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Encode base64 URL-safe (tanpa padding)
 */
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Decode base64 URL-safe
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Generate JWT Token dengan signature HMAC-SHA256
 */
function generateToken($payload) {
    $secret = Env::get('JWT_SECRET', 'eduguardian_secret_key_2026_ganti_ini');

    $header  = base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload['iat'] = time();
    $payload['exp'] = time() + (60 * 60 * 24); // 24 jam
    $body = base64UrlEncode(json_encode($payload));

    $signature = base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));

    return "$header.$body.$signature";
}

/**
 * Verifikasi JWT Token — cek signature + expiry
 * Return: payload array | null jika tidak valid
 */
function verifyToken($token) {
    $secret = Env::get('JWT_SECRET', 'eduguardian_secret_key_2026_ganti_ini');
    $parts  = explode('.', $token);

    if (count($parts) !== 3) return null;

    [$header, $body, $signature] = $parts;

    // Cek signature
    $expectedSig = base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));
    if (!hash_equals($expectedSig, $signature)) return null;

    $payload = json_decode(base64UrlDecode($body), true);
    if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) return null;

    // Cek expiry
    if ($payload['exp'] < time()) {
        sendResponse(['success' => false, 'message' => 'Token sudah expired. Silakan login ulang.'], 401);
    }

    return $payload;
}

/**
 * Wajib login — hentikan jika tidak ada token atau token invalid.
 * $allowedRoles: array role yang diizinkan, misal ['admin', 'kepala_sekolah']
 * Return: payload token (user_id, role, email, exp)
 */
function requireAuth($allowedRoles = []) {
    // Kompatibel dengan Apache, LiteSpeed, nginx
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
              ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
              ?? '';
    
    if (empty($authHeader) && function_exists('getallheaders')) {
        $h = getallheaders();
        $authHeader = $h['Authorization'] ?? $h['authorization'] ?? '';
    }

    if (empty($authHeader)) {
        sendResponse(['success' => false, 'message' => 'Unauthorized — token diperlukan'], 401);
    }

    preg_match('/Bearer\s+(\S+)/', $authHeader, $matches);
    $token = $matches[1] ?? null;

    if (!$token) {
        sendResponse(['success' => false, 'message' => 'Unauthorized — format token tidak valid'], 401);
    }

    $payload = verifyToken($token);

    if (!$payload) {
        sendResponse(['success' => false, 'message' => 'Unauthorized — token tidak valid'], 401);
    }

    // Cek pembatasan role
    if (!empty($allowedRoles) && !in_array($payload['role'], $allowedRoles)) {
        sendResponse(['success' => false, 'message' => 'Forbidden — akses ditolak untuk role Anda'], 403);
    }

    return $payload;
}

/**
 * Cek token opsional — return payload jika ada token valid, null jika tidak
 */
function optionalAuth() {
    // Kompatibel dengan Apache, LiteSpeed, nginx
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
              ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
              ?? '';
    
    if (empty($authHeader) && function_exists('getallheaders')) {
        $h = getallheaders();
        $authHeader = $h['Authorization'] ?? $h['authorization'] ?? '';
    }
    if (empty($authHeader)) return null;
    preg_match('/Bearer\s+(\S+)/', $authHeader, $matches);
    $token = $matches[1] ?? null;
    if (!$token) return null;
    return verifyToken($token);
}
?>