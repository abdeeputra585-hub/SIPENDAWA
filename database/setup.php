<?php
/**
 * setup.php - Setup Database EduGuardian
 * Jalankan sekali via: http://localhost/UTS PEMOGRAMAN/database/setup.php
 * 
 * Ini akan:
 * 1. Membuat database 'eduguardian' jika belum ada
 * 2. Membuat semua tabel yang dibutuhkan
 * 3. Memasukkan user admin default
 * 4. Memasukkan data sample (siswa, wali, notifikasi)
 */

$host     = 'localhost';
$user     = 'root';
$password = '';

// Baca dari .env jika ada
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        $key = trim($key); $val = trim($val);
        if ($key === 'DB_HOST')     $host     = $val;
        if ($key === 'DB_USERNAME') $user     = $val;
        if ($key === 'DB_PASSWORD') $password = $val;
    }
}

$conn = mysqli_connect($host, $user, $password);
$log  = [];
$errors = [];

function runSQL($conn, $sql, &$log, &$errors, $label = '') {
    if (mysqli_query($conn, $sql)) {
        $log[] = "✓ " . ($label ?: substr($sql, 0, 60));
    } else {
        $err = mysqli_error($conn);
        // Abaikan error "already exists" supaya aman dijalankan ulang
        if (strpos($err, 'already exists') === false && strpos($err, 'Duplicate entry') === false) {
            $errors[] = "✗ " . ($label ?: substr($sql, 0, 60)) . " | Error: " . $err;
        } else {
            $log[] = "↩ Sudah ada (skip): " . ($label ?: '');
        }
    }
}

if (!$conn) {
    die("<h2 style='color:red'>Koneksi gagal: " . mysqli_connect_error() . "</h2>
         <p>Pastikan Laragon/XAMPP sudah berjalan!</p>");
}

// ============================================================
// 1. BUAT DATABASE
// ============================================================
runSQL($conn, "CREATE DATABASE IF NOT EXISTS eduguardian CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci", $log, $errors, "Buat database 'eduguardian'");
runSQL($conn, "USE eduguardian", $log, $errors, "Gunakan database 'eduguardian'");

// ============================================================
// 2. BUAT TABEL
// ============================================================
runSQL($conn, "
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','parent','kepala_sekolah') NOT NULL,
    nama VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
", $log, $errors, "Buat tabel 'users'");

runSQL($conn, "
CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    jenis_kelamin ENUM('Laki-laki','Perempuan') NOT NULL,
    status ENUM('Aktif','Verifikasi','Alumni','Pindah') DEFAULT 'Aktif',
    foto VARCHAR(500) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
", $log, $errors, "Buat tabel 'siswa'");

runSQL($conn, "
CREATE TABLE IF NOT EXISTS wali (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    telepon VARCHAR(20) DEFAULT NULL,
    pekerjaan VARCHAR(100) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    status ENUM('Terverifikasi','Pending','Ditolak') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB
", $log, $errors, "Buat tabel 'wali'");

runSQL($conn, "
CREATE TABLE IF NOT EXISTS relasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    wali_id INT NOT NULL,
    tipe ENUM('AYAH','IBU','WALI') NOT NULL,
    status ENUM('Terverifikasi','Pending') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (wali_id) REFERENCES wali(id) ON DELETE CASCADE
) ENGINE=InnoDB
", $log, $errors, "Buat tabel 'relasi'");

runSQL($conn, "
CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    pesan TEXT NOT NULL,
    tipe ENUM('info','success','warning','error') DEFAULT 'info',
    dibaca TINYINT(1) DEFAULT 0,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB
", $log, $errors, "Buat tabel 'notifikasi'");

runSQL($conn, "
CREATE TABLE IF NOT EXISTS kehadiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    status ENUM('Hadir','Izin','Sakit','Alpa') NOT NULL,
    keterangan VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB
", $log, $errors, "Buat tabel 'kehadiran'");

// ============================================================
// 3. INSERT USER DEFAULT
// ============================================================
$adminPass   = password_hash('password123', PASSWORD_DEFAULT);
$kepsekPass  = password_hash('password123', PASSWORD_DEFAULT);

runSQL($conn, "INSERT INTO users (email, password, role, nama) VALUES ('admin@school.id', '$adminPass', 'admin', 'Haryanto Putro')", $log, $errors, "Insert admin user");
runSQL($conn, "INSERT INTO users (email, password, role, nama) VALUES ('kepsek@school.id', '$kepsekPass', 'kepala_sekolah', 'Drs. Ahmad Dahlan')", $log, $errors, "Insert kepala sekolah user");

// ============================================================
// 4. INSERT DATA SAMPLE SISWA
// ============================================================
runSQL($conn, "INSERT INTO siswa (nisn, nama, kelas, jenis_kelamin, status, alamat) VALUES
    ('0082415521', 'Aditama Saputra',  'XII - MIPA 1', 'Laki-laki',   'Aktif',      'Jl. Merdeka No.12, Jakarta'),
    ('0091223405', 'Bella Nurhaliza',  'XI - IPS 2',   'Perempuan',   'Aktif',      'Jl. Melati No.5, Bandung'),
    ('0076610092', 'Fahri Ramadhan',   'X - MIPA 3',   'Laki-laki',   'Verifikasi', 'Jl. Sudirman No.99, Surabaya'),
    ('0085512347', 'Citra Hapsari',    'XII - IPS 1',  'Perempuan',   'Aktif',      'Jl. Pahlawan No.7, Yogyakarta'),
    ('0093341782', 'Dimas Prayoga',    'XI - MIPA 2',  'Laki-laki',   'Alumni',     'Jl. Anggrek No.3, Semarang')
", $log, $errors, "Insert 5 data siswa sample");

// ============================================================
// 5. INSERT DATA SAMPLE WALI
// ============================================================
runSQL($conn, "INSERT INTO wali (nama, email, telepon, pekerjaan, alamat, status) VALUES
    ('Andi Saputra',   'andi.s@email.com',   '081234567890', 'Wiraswasta', 'Jl. Merdeka No.12, Jakarta',    'Terverifikasi'),
    ('Budi Raharjo',   'budi.r@email.com',   '082345678901', 'PNS',        'Jl. Melati No.5, Bandung',      'Pending'),
    ('Siti Nurhaliza', 'siti.n@email.com',   '083456789012', 'Guru',       'Jl. Melati No.5, Bandung',      'Terverifikasi'),
    ('Rizki Prayoga',  'rizki.p@email.com',  '084567890123', 'TNI',        'Jl. Anggrek No.3, Semarang',    'Terverifikasi'),
    ('Dr. Hapsari',    'dr.hapsari@email.com','085678901234', 'Dokter',     'Jl. Pahlawan No.7, Yogyakarta', 'Terverifikasi')
", $log, $errors, "Insert 5 data wali sample");

// ============================================================
// 6. INSERT RELASI SISWA-WALI SAMPLE
// ============================================================
runSQL($conn, "INSERT INTO relasi (siswa_id, wali_id, tipe, status) VALUES
    (1, 1, 'AYAH', 'Terverifikasi'),
    (2, 2, 'AYAH', 'Pending'),
    (2, 3, 'IBU',  'Terverifikasi'),
    (5, 4, 'AYAH', 'Terverifikasi'),
    (4, 5, 'IBU',  'Terverifikasi')
", $log, $errors, "Insert relasi siswa-wali sample");

// ============================================================
// 7. INSERT NOTIFIKASI SAMPLE
// ============================================================
runSQL($conn, "INSERT INTO notifikasi (judul, pesan, tipe, dibaca, user_id) VALUES
    ('Wali Siswa Baru Terdaftar',    'Budi Raharjo telah mendaftar sebagai wali siswa baru. Silakan verifikasi data.',      'info',    0, 1),
    ('Verifikasi Wali Berhasil',     'Data wali Andi Saputra telah berhasil diverifikasi oleh admin.',                       'success', 0, 1),
    ('Sinkronisasi Dapodik',         'Data siswa berhasil disinkronkan dari sistem Dapodik. 5 siswa diperbarui.',            'success', 1, 1),
    ('Relasi Siswa-Wali Diperbarui', 'Relasi antara Bella Nurhaliza dengan Siti Nurhaliza telah diverifikasi.',              'info',    0, 1),
    ('Perhatian: Verifikasi Pending','Terdapat 1 data wali yang masih menunggu verifikasi. Harap segera ditindaklanjuti.',   'warning', 0, 1)
", $log, $errors, "Insert notifikasi sample");

// ============================================================
// 8. INSERT KEHADIRAN SAMPLE
// ============================================================
runSQL($conn, "INSERT INTO kehadiran (siswa_id, tanggal, status, keterangan) VALUES
    (1, CURDATE() - INTERVAL 4 DAY, 'Hadir', NULL),
    (1, CURDATE() - INTERVAL 3 DAY, 'Hadir', NULL),
    (1, CURDATE() - INTERVAL 2 DAY, 'Sakit', 'Demam'),
    (1, CURDATE() - INTERVAL 1 DAY, 'Hadir', NULL),
    (1, CURDATE(),                  'Hadir', NULL),
    (2, CURDATE() - INTERVAL 4 DAY, 'Hadir', NULL),
    (2, CURDATE() - INTERVAL 3 DAY, 'Izin',  'Keperluan keluarga'),
    (2, CURDATE() - INTERVAL 2 DAY, 'Hadir', NULL),
    (2, CURDATE() - INTERVAL 1 DAY, 'Hadir', NULL),
    (2, CURDATE(),                  'Hadir', NULL)
", $log, $errors, "Insert data kehadiran sample");

mysqli_close($conn);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Database EduGuardian</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 700px; width: 100%; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 32px; text-align: center; }
        .header h1 { font-size: 24px; margin-bottom: 4px; }
        .header p { opacity: 0.8; font-size: 14px; }
        .body { padding: 28px; }
        .status-box { border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; }
        .status-success { background: #ecfdf5; border: 1px solid #6ee7b7; }
        .status-error { background: #fef2f2; border: 1px solid #fca5a5; }
        .status-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        .status-success .status-title { color: #065f46; }
        .status-error .status-title { color: #991b1b; }
        .log-list { list-style: none; space-y: 4px; }
        .log-list li { font-size: 13px; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.04); color: #374151; }
        .log-list li.err { color: #dc2626; font-weight: 600; }
        .credentials { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin: 16px 0; }
        .credentials h3 { color: #1e40af; font-size: 14px; font-weight: 700; margin-bottom: 10px; }
        .cred-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
        .cred-row .label { color: #6b7280; }
        .cred-row .value { font-family: monospace; font-weight: 700; color: #111827; background: white; padding: 1px 8px; border-radius: 6px; }
        .btn { display: inline-block; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 10px; transition: all .2s; }
        .btn-primary { background: #1e40af; color: white; }
        .btn-primary:hover { background: #1e3a8a; }
        .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; margin-left: 8px; }
        .btn-secondary:hover { background: #e2e8f0; }
        .actions { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
        .warning-note { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 16px; }
    </style>
</head>
<body>
<div class="card">
    <div class="header">
        <h1>⚙️ Setup Database EduGuardian</h1>
        <p>Inisialisasi database MySQL untuk sistem pengelolaan data wali siswa</p>
    </div>
    <div class="body">

        <?php if (empty($errors)): ?>
        <div class="status-box status-success">
            <div class="status-title">✅ Setup Berhasil!</div>
            <p style="font-size:13px;color:#065f46;margin-bottom:12px;">Database <strong>eduguardian</strong> berhasil dibuat dengan semua tabel dan data sample.</p>
            <ul class="log-list">
                <?php foreach ($log as $l): ?>
                <li><?= htmlspecialchars($l) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>

        <div class="credentials">
            <h3>🔑 Akun Login Default</h3>
            <div class="cred-row"><span class="label">Admin Email</span><span class="value">admin@school.id</span></div>
            <div class="cred-row"><span class="label">Kepsek Email</span><span class="value">kepsek@school.id</span></div>
            <div class="cred-row"><span class="label">Password</span><span class="value">password123</span></div>
        </div>

        <div class="actions">
            <a href="../index.html" class="btn btn-primary">🚀 Buka Aplikasi EduGuardian</a>
            <a href="http://localhost/phpmyadmin" target="_blank" class="btn btn-secondary">🗄️ Buka phpMyAdmin</a>
        </div>

        <div class="warning-note">
            ⚠️ <strong>Penting:</strong> Hapus atau proteksi file <code>setup.php</code> ini setelah setup selesai agar tidak bisa dijalankan ulang oleh orang lain.
        </div>

        <?php else: ?>
        <div class="status-box status-error">
            <div class="status-title">❌ Setup Gagal!</div>
            <p style="font-size:13px;color:#991b1b;margin-bottom:12px;">Terjadi error saat setup. Pastikan Laragon/XAMPP sudah berjalan.</p>
            <ul class="log-list">
                <?php foreach ($errors as $e): ?>
                <li class="err"><?= htmlspecialchars($e) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php if (!empty($log)): ?>
        <details style="margin-top:12px;">
            <summary style="font-size:13px;cursor:pointer;color:#6b7280;">Lihat log yang berhasil (<?= count($log) ?>)</summary>
            <ul class="log-list" style="margin-top:8px;">
                <?php foreach ($log as $l): ?>
                <li><?= htmlspecialchars($l) ?></li>
                <?php endforeach; ?>
            </ul>
        </details>
        <?php endif; ?>
        <div class="actions">
            <a href="setup.php" class="btn btn-primary">🔄 Coba Lagi</a>
        </div>
        <?php endif; ?>

    </div>
</div>
</body>
</html>
