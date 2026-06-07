/**
 * config.js — Konfigurasi Frontend EduGuardian
 *
 * CARA MENDAPATKAN GOOGLE_CLIENT_ID:
 * 1. Buka https://console.cloud.google.com/
 * 2. Buat project baru (atau pilih yang sudah ada)
 * 3. Pergi ke "APIs & Services" → "Credentials"
 * 4. Klik "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
 * 5. Application type: "Web application"
 * 6. Authorized JavaScript origins tambahkan:
 *      - http://localhost
 *      - http://uts_pemograman.test
 *      - http://localhost:80
 * 7. Klik Create → Salin Client ID
 * 8. Tempel di bawah ini (ganti teks placeholder)
 */

const GOOGLE_CLIENT_ID = 'GANTI_DENGAN_CLIENT_ID_ANDA.apps.googleusercontent.com';
