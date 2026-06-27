-- /database/migrations/guru-schema.sql

-- Tabel Profil Guru (Berelasi dengan users)
CREATE TABLE IF NOT EXISTS guru_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    nip VARCHAR(20) UNIQUE NOT NULL,          -- Nomor Induk Pegawai
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

-- Master Mata Pelajaran (jika belum ada)
CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_pelajaran VARCHAR(100) NOT NULL UNIQUE,
    kode_pelajaran VARCHAR(20) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Master Kelas (jika belum ada)
CREATE TABLE IF NOT EXISTS kelas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kelas VARCHAR(50) NOT NULL UNIQUE,
    tingkat INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relasi Guru dengan Kelas Ampuan
CREATE TABLE IF NOT EXISTS guru_kelas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guru_profile_id INT NOT NULL,
    kelas_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (guru_profile_id) REFERENCES guru_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_guru_kelas (guru_profile_id, kelas_id)
);

-- Relasi Guru dengan Mata Pelajaran
CREATE TABLE IF NOT EXISTS guru_mata_pelajaran (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guru_profile_id INT NOT NULL,
    mata_pelajaran_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (guru_profile_id) REFERENCES guru_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (mata_pelajaran_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_guru_mapel (guru_profile_id, mata_pelajaran_id)
);

-- Seed basic data for mapel and kelas so we have something to test with
INSERT IGNORE INTO mata_pelajaran (nama_pelajaran, kode_pelajaran) VALUES 
('Matematika', 'MTK'), ('Bahasa Indonesia', 'BIN'), ('Bahasa Inggris', 'ING'), ('IPA', 'IPA'), ('IPS', 'IPS');

INSERT IGNORE INTO kelas (nama_kelas, tingkat) VALUES 
('7A', 7), ('7B', 7), ('8A', 8), ('8B', 8), ('9A', 9), ('9B', 9);
