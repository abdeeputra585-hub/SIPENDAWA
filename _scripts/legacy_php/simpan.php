<?php
include 'koneksi.php';

if (isset($_POST['simpan'])) {
    $tipe = $_POST['tipe'];

    if ($tipe == 'siswa') {
        // Simpan data siswa
        $nisn = mysqli_real_escape_string($conn, $_POST['nisn']);
        $nama = mysqli_real_escape_string($conn, $_POST['nama']);
        $kelas = mysqli_real_escape_string($conn, $_POST['kelas']);
        $jenis_kelamin = mysqli_real_escape_string($conn, $_POST['jenis_kelamin']);
        $alamat = isset($_POST['alamat']) ? mysqli_real_escape_string($conn, $_POST['alamat']) : '';

        $query = "INSERT INTO siswa (nisn, nama, kelas, jenis_kelamin, status, alamat) 
                  VALUES ('$nisn', '$nama', '$kelas', '$jenis_kelamin', 'Aktif', '$alamat')";

        if (mysqli_query($conn, $query)) {
            echo "<h3 style='color: green;'>✓ Siswa berhasil disimpan.</h3>";
            echo "<a href='index.php'>← Kembali ke Form</a><br>";
            echo "<a href='tampil.php'>📋 Lihat Data Siswa</a>";
        } else {
            echo "<h3 style='color: red;'>✗ Siswa gagal disimpan: " . mysqli_error($conn) . "</h3>";
            echo "<a href='index.php'>← Kembali</a>";
        }

    } elseif ($tipe == 'wali') {
        // Simpan data wali
        $nama = mysqli_real_escape_string($conn, $_POST['wali_nama']);
        $email = isset($_POST['email']) ? mysqli_real_escape_string($conn, $_POST['email']) : '';
        $telepon = isset($_POST['telepon']) ? mysqli_real_escape_string($conn, $_POST['telepon']) : '';
        $pekerjaan = isset($_POST['pekerjaan']) ? mysqli_real_escape_string($conn, $_POST['pekerjaan']) : '';
        $alamat = isset($_POST['wali_alamat']) ? mysqli_real_escape_string($conn, $_POST['wali_alamat']) : '';

        $query = "INSERT INTO wali (nama, email, telepon, pekerjaan, alamat, status) 
                  VALUES ('$nama', '$email', '$telepon', '$pekerjaan', '$alamat', 'Pending')";

        if (mysqli_query($conn, $query)) {
            echo "<h3 style='color: green;'>✓ Wali berhasil disimpan.</h3>";
            echo "<a href='index.php'>← Kembali ke Form</a><br>";
            echo "<a href='tampil_wali.php'>👥 Lihat Data Wali</a>";
        } else {
            echo "<h3 style='color: red;'>✗ Wali gagal disimpan: " . mysqli_error($conn) . "</h3>";
            echo "<a href='index.php'>← Kembali</a>";
        }

    } elseif ($tipe == 'relasi') {
        // Simpan relasi siswa-wali
        $siswa_id = mysqli_real_escape_string($conn, $_POST['siswa_id']);
        $wali_id = mysqli_real_escape_string($conn, $_POST['wali_id']);
        $tipe_relasi = mysqli_real_escape_string($conn, $_POST['tipe_relasi']);

        $query = "INSERT INTO relasi (siswa_id, wali_id, tipe, status) 
                  VALUES ('$siswa_id', '$wali_id', '$tipe_relasi', 'Pending')";

        if (mysqli_query($conn, $query)) {
            echo "<h3 style='color: green;'>✓ Relasi berhasil disimpan.</h3>";
            echo "<a href='index.php'>← Kembali ke Form</a><br>";
            echo "<a href='tampil_relasi.php'>🔗 Lihat Data Relasi</a>";
        } else {
            echo "<h3 style='color: red;'>✗ Relasi gagal disimpan: " . mysqli_error($conn) . "</h3>";
            echo "<a href='index.php'>← Kembali</a>";
        }
    }
} else {
    echo "Akses tidak valid.";
}
?>

 