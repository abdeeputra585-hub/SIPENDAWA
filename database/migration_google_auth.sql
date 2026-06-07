-- Migration: Tambah kolom google_id ke tabel users
-- Jalankan di phpMyAdmin atau MySQL client

USE eduguardian;

-- Tambah kolom google_id ke tabel users (jika belum ada)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL UNIQUE AFTER avatar;

-- Verifikasi
DESCRIBE users;
