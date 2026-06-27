-- /database/migrations/pengumuman-schema.sql

-- Hapus tabel pengumuman lama jika ada (karena skema lama mungkin tidak cocok)
DROP TABLE IF EXISTS pengumuman_dibaca;
DROP TABLE IF EXISTS pengumuman;

CREATE TABLE pengumuman (
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

CREATE TABLE pengumuman_dibaca (
    id_pengumuman INT NOT NULL,
    id_wali INT NOT NULL,
    dibaca_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id_pengumuman, id_wali),
    FOREIGN KEY (id_pengumuman) REFERENCES pengumuman(id) ON DELETE CASCADE,
    FOREIGN KEY (id_wali) REFERENCES users(id) ON DELETE CASCADE
);
