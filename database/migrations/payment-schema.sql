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
