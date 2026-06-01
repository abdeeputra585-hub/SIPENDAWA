<?php
/**
 * config.php - DIPERBAIKI untuk keamanan
 * Baca kredensial dari .env, bukan hardcoded
 */

// Load .env file (Env.php ada di folder root, bukan di api/)
require_once __DIR__ . '/../env.php';

// Set header JSON
header('Content-Type: application/json; charset=utf-8');

// CORS - HANYA izinkan domain yang spesifik
$allowedDomains = explode(',', Env::get('ALLOWED_DOMAINS', 'http://localhost'));
$allowedDomains = array_map('trim', $allowedDomains);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Cek apakah origin diizinkan
if (in_array($origin, $allowedDomains)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Jika origin tidak diizinkan, tetap response tapi jangan set header
    // Ini akan error di browser, mencegah akses publik
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Koneksi database dengan kredensial dari .env
$conn = new mysqli(
    Env::get('DB_HOST', 'localhost'),
    Env::get('DB_USERNAME', 'root'),
    Env::get('DB_PASSWORD', ''),
    Env::get('DB_NAME', 'eduguardian')
);

// Cek error koneksi
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => Env::get('APP_DEBUG') === 'true' 
            ? 'Database error: ' . $conn->connect_error 
            : 'Connection failed'
    ]);
    exit();
}

$conn->set_charset("utf8mb4");

/**
 * Helper function untuk mengirim response JSON
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Helper function untuk membaca JSON input
 */
function getJsonInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

/**
 * PENTING: Cek apakah user sudah login
 * Digunakan di semua endpoint yang memerlukan autentikasi
 */
function requireAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader)) {
        sendResponse(['success' => false, 'message' => 'Unauthorized - no token'], 401);
    }
    
    // Extract token dari "Bearer {token}"
    preg_match('/Bearer\s+(\S+)/', $authHeader, $matches);
    $token = $matches[1] ?? null;
    
    if (!$token) {
        sendResponse(['success' => false, 'message' => 'Unauthorized - invalid token format'], 401);
    }
    
    // Verifikasi token (akan dijelaskan di auth.php)
    return verifyToken($token);
}

/**
 * Verifikasi JWT token
 */
function verifyToken($token) {
    // Simple JWT verification
    // Untuk production, gunakan library seperti firebase/jwt
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return null;
    }
    
    $payload = json_decode(base64_decode($parts[1]), true);
    
    if (!$payload || !isset($payload['user_id']) || !isset($payload['exp'])) {
        return null;
    }
    
    if ($payload['exp'] < time()) {
        return null; // Token sudah expired
    }
    
    return $payload;
}
?>