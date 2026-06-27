<?php
/**
 * migration_guru.php - Update database untuk Role Guru & Nilai
 */
mysqli_report(MYSQLI_REPORT_OFF);

require_once __DIR__ . '/../api/config.php';

// 1. Alter Enum Users
$sql1 = "ALTER TABLE users MODIFY COLUMN role ENUM('admin','parent','kepala_sekolah','guru') NOT NULL";
if (mysqli_query($conn, $sql1)) {
    echo "âœ“ Kolom role di tabel users berhasil diupdate\n";
} else {
    echo "âœ— Gagal update role: " . mysqli_error($conn) . "\n";
}

// 2. Buat tabel nilai
$sql2 = "CREATE TABLE IF NOT EXISTS nilai (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    guru_id INT NOT NULL,
    mata_pelajaran VARCHAR(100) NOT NULL,
    semester ENUM('Ganjil','Genap') NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    nilai_tugas DECIMAL(5,2) DEFAULT 0,
    nilai_uts DECIMAL(5,2) DEFAULT 0,
    nilai_uas DECIMAL(5,2) DEFAULT 0,
    nilai_akhir DECIMAL(5,2) GENERATED ALWAYS AS ((nilai_tugas * 0.3) + (nilai_uts * 0.3) + (nilai_uas * 0.4)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (guru_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB";

if (mysqli_query($conn, $sql2)) {
    echo "âœ“ Tabel nilai berhasil dibuat\n";
} else {
    echo "âœ— Gagal buat tabel nilai: " . mysqli_error($conn) . "\n";
}

// 3. Insert user Guru sample
$guruPass = password_hash('password123', PASSWORD_DEFAULT);
$sql3 = "INSERT INTO users (email, password, role, nama) VALUES ('guru@school.id', '$guruPass', 'guru', 'Budi Santoso, S.Pd.')";
if (mysqli_query($conn, $sql3)) {
    echo "âœ“ User guru@school.id berhasil dibuat\n";
} else {
    $err = mysqli_error($conn);
    if (strpos($err, 'Duplicate entry') !== false) {
        echo "â†© User guru sudah ada, skip.\n";
    } else {
        echo "âœ— Gagal buat user guru: " . $err . "\n";
    }
}

// Dapatkan guru_id (untuk sample)
$result = mysqli_query($conn, "SELECT id FROM users WHERE email = 'guru@school.id' LIMIT 1");
$guruRow = mysqli_fetch_assoc($result);

if ($guruRow) {
    $guruId = $guruRow['id'];
    
    // Insert sample nilai untuk siswa 1 dan 2 (kalau ada)
    $sql4 = "INSERT INTO nilai (siswa_id, guru_id, mata_pelajaran, semester, tahun_ajaran, nilai_tugas, nilai_uts, nilai_uas) VALUES
        (1, $guruId, 'Matematika', 'Genap', '2025/2026', 85, 80, 90),
        (1, $guruId, 'Bahasa Indonesia', 'Genap', '2025/2026', 90, 85, 88),
        (2, $guruId, 'Matematika', 'Genap', '2025/2026', 75, 78, 80)
    ";
    if (mysqli_query($conn, $sql4)) {
        echo "âœ“ Sample nilai berhasil diinput\n";
    } else {
        echo "âœ— Gagal input sample nilai (mungkin sudah ada atau siswa belum ada): " . mysqli_error($conn) . "\n";
    }
}


echo "Selesai.\n";
?>


