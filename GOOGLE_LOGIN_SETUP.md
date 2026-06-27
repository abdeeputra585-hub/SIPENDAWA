# Panduan Setup Google Login

## Langkah 1 — Buat Google OAuth Client ID

1. Buka: https://console.cloud.google.com/
2. Login dengan akun Google Anda
3. Buat project baru (atau pilih yang sudah ada)
4. Pergi ke: APIs & Services → Credentials
5. Klik "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
6. Application type: "Web application"
7. Di bagian "Authorized JavaScript origins", tambahkan:
   - http://localhost
   - http://uts_pemograman.test
   - http://localhost:80
8. Klik "Create" → **Salin Client ID yang muncul**

## Langkah 2 — Isi Client ID di config.js

Buka file: config.js
Ganti baris:
```
const GOOGLE_CLIENT_ID = 'GANTI_DENGAN_CLIENT_ID_ANDA.apps.googleusercontent.com';
```
Dengan:
```
const GOOGLE_CLIENT_ID = 'XXXXXX.apps.googleusercontent.com'; // hasil copy dari Google
```

## Langkah 3 — Jalankan migrasi database

Di phpMyAdmin, jalankan query:
```sql
USE eduguardian;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL UNIQUE AFTER avatar;
```

Setelah itu Google Login langsung bisa digunakan!
