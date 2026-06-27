-- ============================================================
-- eduguardian_FULL.sql
-- File SQL Lengkap untuk Deploy ke Hosting (InfinityFree)
-- Import file INI SAJA di phpMyAdmin — sudah include semua tabel
-- ============================================================
-- CATATAN: Jangan gunakan "CREATE DATABASE" atau "USE" di InfinityFree
--          karena database sudah dibuat dari panel. Hapus 2 baris itu.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- BAGIAN 1: TABEL DASAR
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'parent', 'kepala_sekolah', 'guru') NOT NULL,
    nama VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    google_id VARCHAR(255) DEFAULT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nisn VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    tanggal_lahir DATE DEFAULT NULL,
    kelas VARCHAR(50) NOT NULL,
    jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    status ENUM('Aktif', 'Verifikasi', 'Alumni', 'Pindah') DEFAULT 'Aktif',
    foto VARCHAR(500) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wali (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    telepon VARCHAR(20) DEFAULT NULL,
    pekerjaan VARCHAR(100) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    foto VARCHAR(500) DEFAULT NULL,
    status ENUM('Terverifikasi', 'Pending', 'Ditolak') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    wali_id INT NOT NULL,
    tipe ENUM('AYAH', 'IBU', 'WALI') NOT NULL,
    status ENUM('Terverifikasi', 'Pending') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (wali_id) REFERENCES wali(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    pesan TEXT NOT NULL,
    tipe ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    dibaca TINYINT(1) DEFAULT 0,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kehadiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    status ENUM('Hadir', 'Izin', 'Sakit', 'Alpa') NOT NULL,
    keterangan VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 2: TABEL GURU
-- ============================================================

CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_pelajaran VARCHAR(100) NOT NULL UNIQUE,
    kode_pelajaran VARCHAR(20) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kelas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kelas VARCHAR(50) NOT NULL UNIQUE,
    tingkat INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guru_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nip VARCHAR(20) UNIQUE NOT NULL,
    no_telepon VARCHAR(15),
    alamat TEXT,
    tanggal_lahir DATE,
    jenis_kelamin ENUM('L', 'P'),
    status_pegawai ENUM('PNS', 'GTT', 'Honorer') DEFAULT 'GTT',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_nip (nip),
    INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS guru_kelas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guru_profile_id INT NOT NULL,
    kelas_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_profile_id) REFERENCES guru_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_guru_kelas (guru_profile_id, kelas_id)
);

CREATE TABLE IF NOT EXISTS guru_mata_pelajaran (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guru_profile_id INT NOT NULL,
    mata_pelajaran_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_profile_id) REFERENCES guru_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (mata_pelajaran_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    UNIQUE KEY unique_guru_mapel (guru_profile_id, mata_pelajaran_id)
);

-- ============================================================
-- BAGIAN 3: TABEL IZIN/ABSENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS absence_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_siswa INT NOT NULL,
    tipe_izin ENUM('Sakit', 'Izin', 'Dispensasi') NOT NULL,
    tgl_mulai DATE NOT NULL,
    tgl_selesai DATE NOT NULL,
    alasan TEXT NOT NULL,
    bukti_file VARCHAR(500) NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT NULL,
    catatan_approval TEXT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_siswa) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_siswa (id_siswa)
);

-- ============================================================
-- BAGIAN 4: TABEL PEMBAYARAN
-- ============================================================

CREATE TABLE IF NOT EXISTS pembayaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_siswa INT NOT NULL,
    tipe_pembayaran VARCHAR(100) NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    tgl_jatuh_tempo DATE NOT NULL,
    status ENUM('Belum bayar', 'Menunggu Konfirmasi', 'Lunas', 'Overdue') DEFAULT 'Belum bayar',
    tgl_bayar DATETIME DEFAULT NULL,
    bukti_file VARCHAR(255) DEFAULT NULL,
    catatan TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_siswa) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pembayaran INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pembayaran) REFERENCES pembayaran(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 5: TABEL PENGUMUMAN
-- ============================================================

CREATE TABLE IF NOT EXISTS pengumuman (
    id INT PRIMARY KEY AUTO_INCREMENT,
    judul VARCHAR(255) NOT NULL,
    konten TEXT NOT NULL,
    kategori ENUM('Akademik', 'Event', 'Info Penting', 'Keuangan', 'Lainnya') DEFAULT 'Info Penting',
    attachment VARCHAR(500) NULL,
    status ENUM('Draft', 'Published', 'Archived') DEFAULT 'Published',
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_kategori (kategori),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS pengumuman_dibaca (
    id_pengumuman INT NOT NULL,
    id_wali INT NOT NULL,
    dibaca_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pengumuman, id_wali),
    FOREIGN KEY (id_pengumuman) REFERENCES pengumuman(id) ON DELETE CASCADE,
    FOREIGN KEY (id_wali) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- BAGIAN 6: TABEL CHAT
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_sender INT NOT NULL,
    id_recipient INT NOT NULL,
    isi_pesan TEXT NOT NULL,
    attachment VARCHAR(255) NULL,
    attachment_type VARCHAR(50) NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    dibaca BOOLEAN DEFAULT FALSE,
    dibaca_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_sender) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_recipient) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (id_sender),
    INDEX idx_recipient (id_recipient),
    INDEX idx_conversation (id_sender, id_recipient, timestamp),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_wali INT NOT NULL,
    id_guru INT NOT NULL,
    last_message_id INT NULL,
    last_message_preview VARCHAR(100) NULL,
    last_message_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_wali) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_guru) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    UNIQUE KEY unique_conversation (id_wali, id_guru),
    INDEX idx_wali (id_wali),
    INDEX idx_guru (id_guru)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- BAGIAN 7: DATA SEED (Dummy / Default)
-- ============================================================

-- Akun default (password: "password")
INSERT IGNORE INTO users (email, password, role, nama, avatar) VALUES
('admin@school.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Haryanto Putro', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'),
('budisantoso@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'Budi Santoso', 'https://i1-c.pinimg.com/736x/69/c1/27/69c127c94e626793d5df6f274e187627.jpg'),
('kepsek@school.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kepala_sekolah', 'Drs. Ahmad Dahlan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100');

INSERT IGNORE INTO siswa (nisn, nama, kelas, jenis_kelamin, status, alamat) VALUES
('0082415521', 'Aditama Saputra', 'XII - MIPA 1', 'Laki-laki', 'Aktif', 'Jl. Merdeka No. 10, Jakarta'),
('0091223405', 'Bella Nurhaliza', 'XI - IPS 2', 'Perempuan', 'Aktif', 'Jl. Pahlawan No. 25, Bandung'),
('0076610092', 'Fahri Ramadhan', 'X - MIPA 3', 'Laki-laki', 'Verifikasi', 'Jl. Sudirman No. 8, Surabaya'),
('0098231456', 'Arkananta Rayyan', 'XI - MIPA 1', 'Laki-laki', 'Aktif', 'Jl. Ahmad Yani No. 15, Semarang'),
('009283741', 'Ahmad Faisal', 'X - IPS 1', 'Laki-laki', 'Aktif', 'Jl. Gatot Subroto No. 12, Yogyakarta'),
('0087654321', 'Aditya Pratama', 'X - IPA 1', 'Laki-laki', 'Aktif', 'Jl. kemirahan GG 2 NO 16 RT 02 RW 02');

INSERT IGNORE INTO wali (user_id, nama, email, telepon, pekerjaan, alamat, status) VALUES
(NULL, 'Andi Saputra', 'andi.s@email.com', '081234567890', 'Wiraswasta', 'Jl. Merdeka No. 10, Jakarta', 'Terverifikasi'),
(NULL, 'Budi Raharjo', 'budi.r@email.com', '081298765432', 'PNS', 'Jl. Pahlawan No. 25, Bandung', 'Pending'),
(NULL, 'Citra Hapsari', 'citra.h@email.com', '081356789012', 'Dokter', 'Jl. Sudirman No. 8, Surabaya', 'Terverifikasi'),
(NULL, 'Bambang Wijaya', 'bambang@email.com', '081367890123', 'Pengusaha', 'Jl. Ahmad Yani No. 15, Semarang', 'Terverifikasi'),
(NULL, 'Drs. Mulyono', 'mulyono@email.com', '081378901234', 'Guru', 'Jl. Gatot Subroto No. 12, Yogyakarta', 'Terverifikasi'),
(2, 'Budi Santoso', 'budisantoso@email.com', '081389012345', 'Karyawan Swasta', 'Jl. kemirahan GG 2 NO 16 RT 02 RW 02', 'Terverifikasi'),
(NULL, 'Sari Dewi', 'sari.d@email.com', '081390123456', 'Ibu Rumah Tangga', 'Jl. Kenangan No. 7, Malang', 'Pending'),
(NULL, 'Kurniawan', 'kurniawan@email.com', '081401234567', 'Insinyur', 'Jl. Diponegoro No. 20, Medan', 'Pending');

INSERT IGNORE INTO relasi (siswa_id, wali_id, tipe, status) VALUES
(5, 5, 'AYAH', 'Terverifikasi'),
(1, 1, 'AYAH', 'Terverifikasi'),
(2, 2, 'AYAH', 'Pending'),
(3, 3, 'IBU', 'Terverifikasi'),
(4, 4, 'AYAH', 'Terverifikasi'),
(6, 6, 'AYAH', 'Terverifikasi');

INSERT IGNORE INTO notifikasi (judul, pesan, tipe, dibaca, user_id) VALUES
('Verifikasi Data Berhasil', 'Data wali siswa atas nama Bapak Rahmad Hidayat telah berhasil diverifikasi oleh sistem.', 'success', 0, 1),
('Wali Siswa Baru Terdaftar', 'Bpk. Kurniawan telah mendaftar sebagai wali siswa baru. Silakan verifikasi data.', 'info', 0, 1),
('Relasi Diperbarui', 'Relasi antara Siswa Arkananta Rayyan dengan Wali Bambang Wijaya telah diperbarui.', 'info', 0, 1),
('Verifikasi Wali Pending', 'Data wali atas nama Ibu Sari masih menunggu verifikasi administrator.', 'warning', 0, 1),
('Sinkronisasi Data Dapodik', 'Data siswa telah berhasil disinkronkan dengan sistem Dapodik nasional.', 'success', 1, 1),
('Selamat Datang', 'Selamat datang di EduGuardian. Silakan lengkapi profil Anda.', 'info', 0, 2),
('Data Anak Diverifikasi', 'Data anak Anda (Aditya Pratama) telah berhasil diverifikasi oleh admin sekolah.', 'success', 0, 2);

-- Data seed untuk mata pelajaran dan kelas
INSERT IGNORE INTO mata_pelajaran (nama_pelajaran, kode_pelajaran) VALUES
('Matematika', 'MTK'), ('Bahasa Indonesia', 'BIN'), ('Bahasa Inggris', 'ING'),
('IPA', 'IPA'), ('IPS', 'IPS'), ('PKN', 'PKN'), ('Penjaskes', 'PJAS');

INSERT IGNORE INTO kelas (nama_kelas, tingkat) VALUES
('7A', 7), ('7B', 7), ('8A', 8), ('8B', 8), ('9A', 9), ('9B', 9);
