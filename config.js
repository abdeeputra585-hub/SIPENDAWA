/**
 * config.js — Konfigurasi Frontend SIPENDAWA
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
 *      - https://sipendawa.rf.gd        ← PRODUCTION
 * 7. Authorized redirect URIs tambahkan:
 *      - https://sipendawa.rf.gd/google-callback.html
 *      - https://sipendawa.rf.gd/api/auth/google.php
 * 8. Klik Create → Salin Client ID
 */

const GOOGLE_CLIENT_ID = '540228165992-ghrlknt7a9s22mllknl7kqn4o1knvoc1.apps.googleusercontent.com';

