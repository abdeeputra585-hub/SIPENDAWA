<?php
/**
 * JWT.php - Simple JWT implementation
 * Untuk production, gunakan firebase/php-jwt library
 */

class JWT {
    
    /**
     * Generate JWT token
     * 
     * @param array $payload Data yang akan dienkripsi
     * @param int $expiresIn Token berlaku berapa detik (default 24 jam)
     * @return string JWT token
     */
    public static function generate($payload, $expiresIn = 86400) {
        $secret = Env::get('JWT_SECRET', 'default_secret_key_change_this');
        
        // Header
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];
        
        // Payload - tambah exp (expiration time)
        $payload['exp'] = time() + $expiresIn;
        
        // Encode header dan payload ke base64url
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        // Buat signature
        $signature = hash_hmac(
            'sha256',
            "$headerEncoded.$payloadEncoded",
            $secret,
            true
        );
        $signatureEncoded = self::base64UrlEncode($signature);
        
        // Gabungkan semuanya
        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }
    
    /**
     * Verifikasi JWT token
     * 
     * @param string $token JWT token
     * @return array|null Payload jika valid, null jika invalid
     */
    public static function verify($token) {
        $secret = Env::get('JWT_SECRET', 'default_secret_key_change_this');
        
        $parts = explode('.', $token);
        
        // Token harus punya 3 bagian: header.payload.signature
        if (count($parts) !== 3) {
            return null;
        }
        
        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
        
        // Verifikasi signature
        $expectedSignature = hash_hmac(
            'sha256',
            "$headerEncoded.$payloadEncoded",
            $secret,
            true
        );
        $expectedSignatureEncoded = self::base64UrlEncode($expectedSignature);
        
        // Bandingkan signature (gunakan hash_equals untuk cegah timing attack)
        if (!hash_equals($signatureEncoded, $expectedSignatureEncoded)) {
            return null;
        }
        
        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        if (!$payload) {
            return null;
        }
        
        // Cek apakah token sudah expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    /**
     * Encode string ke base64url
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Decode base64url ke string
     */
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 4 - (strlen($data) % 4)));
    }
}
?>