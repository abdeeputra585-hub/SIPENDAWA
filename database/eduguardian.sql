
CREATE DATABASE IF NOT EXISTS eduguardian CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE eduguardian;

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


INSERT INTO users (email, password, role, nama, avatar) VALUES
('admin@school.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Haryanto Putro', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'),
('budisantoso@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'Budi Santoso', 'https://i1-c.pinimg.com/736x/69/c1/27/69c127c94e626793d5df6f274e187627.jpg'),
('kepsek@school.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kepala_sekolah', 'Drs. Ahmad Dahlan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100');

INSERT INTO siswa (nisn, nama, kelas, jenis_kelamin, status, alamat) VALUES
('0082415521', 'Aditama Saputra', 'XII - MIPA 1', 'Laki-laki', 'Aktif', 'Jl. Merdeka No. 10, Jakarta'),
('0091223405', 'Bella Nurhaliza', 'XI - IPS 2', 'Perempuan', 'Aktif', 'Jl. Pahlawan No. 25, Bandung'),
('0076610092', 'Fahri Ramadhan', 'X - MIPA 3', 'Laki-laki', 'Verifikasi', 'Jl. Sudirman No. 8, Surabaya'),
('0098231456', 'Arkananta Rayyan', 'XI - MIPA 1', 'Laki-laki', 'Aktif', 'Jl. Ahmad Yani No. 15, Semarang'),
('009283741', 'Ahmad Faisal', 'X - IPS 1', 'Laki-laki', 'Aktif', 'Jl. Gatot Subroto No. 12, Yogyakarta'),
('0087654321', 'Aditya Pratama', 'X - IPA 1', 'Laki-laki', 'Aktif', 'Jl. kemirahan GG 2 NO 16 RT 02 RW 02');

INSERT INTO wali (user_id, nama, email, telepon, pekerjaan, alamat, status) VALUES
(NULL, 'Andi Saputra', 'andi.s@email.com', '081234567890', 'Wiraswasta', 'Jl. Merdeka No. 10, Jakarta', 'Terverifikasi'),
(NULL, 'Budi Raharjo', 'budi.r@email.com', '081298765432', 'PNS', 'Jl. Pahlawan No. 25, Bandung', 'Pending'),
(NULL, 'Citra Hapsari', 'citra.h@email.com', '081356789012', 'Dokter', 'Jl. Sudirman No. 8, Surabaya', 'Terverifikasi'),
(NULL, 'Bambang Wijaya', 'bambang@email.com', '081367890123', 'Pengusaha', 'Jl. Ahmad Yani No. 15, Semarang', 'Terverifikasi'),
(NULL, 'Drs. Mulyono', 'mulyono@email.com', '081378901234', 'Guru', 'Jl. Gatot Subroto No. 12, Yogyakarta', 'Terverifikasi'),
(2, 'Budi Santoso', 'budisantoso@email.com', '081389012345', 'Karyawan Swasta', 'Jl. kemirahan GG 2 NO 16 RT 02 RW 02', 'Terverifikasi'),
(NULL, 'Sari Dewi', 'sari.d@email.com', '081390123456', 'Ibu Rumah Tangga', 'Jl. Kenangan No. 7, Malang', 'Pending'),
(NULL, 'Kurniawan', 'kurniawan@email.com', '081401234567', 'Insinyur', 'Jl. Diponegoro No. 20, Medan', 'Pending');

INSERT INTO relasi (siswa_id, wali_id, tipe, status) VALUES
(5, 5, 'AYAH', 'Terverifikasi'),
(1, 1, 'AYAH', 'Terverifikasi'),
(2, 2, 'AYAH', 'Pending'),
(3, 3, 'IBU', 'Terverifikasi'),
(4, 4, 'AYAH', 'Terverifikasi'),
(6, 6, 'AYAH', 'Terverifikasi');

INSERT INTO notifikasi (judul, pesan, tipe, dibaca, user_id) VALUES
('Verifikasi Data Berhasil', 'Data wali siswa atas nama Bapak Rahmad Hidayat telah berhasil diverifikasi oleh sistem.', 'success', 0, 1),
('Wali Siswa Baru Terdaftar', 'Bpk. Kurniawan telah mendaftar sebagai wali siswa baru. Silakan verifikasi data.', 'info', 0, 1),
('Relasi Diperbarui', 'Relasi antara Siswa Arkananta Rayyan dengan Wali Bambang Wijaya telah diperbarui.', 'info', 0, 1),
('Verifikasi Wali Pending', 'Data wali atas nama Ibu Sari masih menunggu verifikasi administrator.', 'warning', 0, 1),
('Sinkronisasi Data Dapodik', 'Data siswa telah berhasil disinkronkan dengan sistem Dapodik nasional.', 'success', 1, 1),
('Selamat Datang', 'Selamat datang di EduGuardian. Silakan lengkapi profil Anda.', 'info', 0, 2),
('Data Anak Diverifikasi', 'Data anak Anda (Aditya Pratama) telah berhasil diverifikasi oleh admin sekolah.', 'success', 0, 2);
