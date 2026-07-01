<?php
require_once "c:/laragon/www/uts_pemograman/api/config.php";

$conn->query("
CREATE TABLE IF NOT EXISTS `nilai` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,
  `mata_pelajaran` varchar(100) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `tahun_ajaran` varchar(20) NOT NULL,
  `nilai_tugas` double NOT NULL DEFAULT 0,
  `nilai_uts` double NOT NULL DEFAULT 0,
  `nilai_uas` double NOT NULL DEFAULT 0,
  `nilai` double GENERATED ALWAYS AS ((`nilai_tugas` + `nilai_uts` + `nilai_uas`) / 3) STORED,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
");

$conn->query("
CREATE TABLE IF NOT EXISTS `catatan_perilaku` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `tipe` enum('Positif','Negatif','Info') NOT NULL DEFAULT 'Info',
  `catatan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
");

echo "Tables created successfully.\n";
