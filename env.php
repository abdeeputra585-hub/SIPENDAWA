<?php
/**
 * Env.php - Membaca file .env dengan aman
 * Letakkan di root project folder
 */

class Env {
    private static $env = [];
    private static $loaded = false;

    public static function load($path = null) {
        if (self::$loaded) return;
        
        $envFile = $path ?? __DIR__ . '/.env';
        
        if (!file_exists($envFile)) {
            if (getenv('APP_ENV') === 'development') {
                throw new Exception(".env file not found at $envFile");
            }
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) continue;
            
            if (strpos($line, '=') === false) continue;
            
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes jika ada
            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                $value = substr($value, 1, -1);
            }
            
            self::$env[$key] = $value;
        }
        
        self::$loaded = true;
    }

    public static function get($key, $default = null) {
        if (!self::$loaded) self::load();
        return self::$env[$key] ?? $default;
    }

    public static function all() {
        if (!self::$loaded) self::load();
        return self::$env;
    }
}

// Auto load .env saat file di-include
Env::load();