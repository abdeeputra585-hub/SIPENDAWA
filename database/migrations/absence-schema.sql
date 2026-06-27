-- /database/migrations/absence-schema.sql

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
