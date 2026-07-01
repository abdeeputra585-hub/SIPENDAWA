<?php
/**
 * Comprehensive API endpoint test
 * Tests all key API endpoints and validates responses
 */
require_once 'api/config.php';

// Simulate a logged-in admin to test auth
$testToken = generateToken(['user_id' => 1, 'email' => 'admin@sipendawa.com', 'role' => 'admin']);

$API_BASE = 'http://localhost/uts_pemograman/api';
$results = [];

function testEndpoint($url, $method = 'GET', $body = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) return ['status' => 'CURL_ERROR', 'code' => 0, 'error' => $error];
    
    $data = json_decode($response, true);
    if (!$data) return ['status' => 'JSON_PARSE_ERROR', 'code' => $httpCode, 'response' => substr($response, 0, 200)];
    
    return ['status' => $data['success'] ? 'OK' : 'FAIL', 'code' => $httpCode, 'message' => $data['message'] ?? 'N/A'];
}

echo "=== SIPENDAWA API AUDIT ===\n\n";

// Test login
$loginResult = testEndpoint("$API_BASE/auth/login.php", 'POST', ['email' => 'test@test.com', 'password' => 'test']);
echo "Login (bad creds): [{$loginResult['code']}] {$loginResult['status']} - {$loginResult['message']}\n";

// Test endpoints that need auth
$endpoints = [
    ['GET', "$API_BASE/dashboard.php?action=stats", null, $testToken, 'Dashboard Stats'],
    ['GET', "$API_BASE/siswa.php?action=list", null, $testToken, 'Siswa List'],
    ['GET', "$API_BASE/wali.php", null, $testToken, 'Wali List'],
    ['GET', "$API_BASE/relasi.php", null, $testToken, 'Relasi List'],
    ['GET', "$API_BASE/nilai.php?action=list", null, $testToken, 'Nilai List'],
    ['GET', "$API_BASE/kehadiran.php?action=list_kelas", null, $testToken, 'Kehadiran List Kelas'],
    ['GET', "$API_BASE/catatan_perilaku.php", null, $testToken, 'Catatan Perilaku List'],
    ['GET', "$API_BASE/pengumuman.php", null, $testToken, 'Pengumuman List'],
    ['GET', "$API_BASE/notifikasi.php", null, $testToken, 'Notifikasi List'],
    ['GET', "$API_BASE/laporan.php", null, $testToken, 'Laporan'],
    ['GET', "$API_BASE/pesan.php", null, $testToken, 'Pesan List'],
];

foreach ($endpoints as [$method, $url, $body, $token, $name]) {
    $r = testEndpoint($url, $method, $body, $token);
    $icon = $r['status'] === 'OK' ? '✅' : ($r['status'] === 'FAIL' ? '⚠️' : '❌');
    echo "$icon [$r[code]] $name: {$r['status']} - {$r['message']}\n";
}
