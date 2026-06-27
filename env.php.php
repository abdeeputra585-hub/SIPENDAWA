<?php
/**
 * env.php - Simple environment variable reader
 * Baca dari file .env dan simpan di memory
 */

class Env {
    private static $data = null;

    public static function load() {
        if (self::$data !== null) return;
        
        self::$data = [];
        $envFile = dirname(__DIR__) . '/uts_pemograman/.env';
        
        // Coba di lokasi berbeda
        if (!file_exists($envFile)) {
            $envFile = __DIR__ . '/.env';
        }
        
        if (!file_exists($envFile)) {
            // Fallback: gunakan default
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comment lines
            if (strpos(trim($line), '#') === 0) continue;
            
            // Parse KEY=VALUE
            if (strpos($line, '=') !== false) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
                if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                    (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                    $value = substr($value, 1, -1);
                }
                
                self::$data[$key] = $value;
            }
        }
    }

    public static function get($key, $default = null) {
        self::load();
        return self::$data[$key] ?? $default;
    }
}

// Auto-load saat file di-include
Env::load();
?>
