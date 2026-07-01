<?php
include 'koneksi.php';

if (isset($_POST['update'])) {
    $id = mysqli_real_escape_string($conn, $_POST['id']);
    $nisn = mysqli_real_escape_string($conn, $_POST['nisn']);
    $nama = mysqli_real_escape_string($conn, $_POST['nama']);
    $kelas = mysqli_real_escape_string($conn, $_POST['kelas']);
    $jenis_kelamin = mysqli_real_escape_string($conn, $_POST['jenis_kelamin']);
    $status = mysqli_real_escape_string($conn, $_POST['status']);
    $alamat = mysqli_real_escape_string($conn, $_POST['alamat']);

    $query = "UPDATE siswa SET nisn='$nisn', nama='$nama', kelas='$kelas', jenis_kelamin='$jenis_kelamin', status='$status', alamat='$alamat' WHERE id='$id'";

    if (mysqli_query($conn, $query)) {
        echo "<h3 style='color: green;'>✓ Data siswa berhasil diubah.</h3>";
        echo "<a href='tampil.php'>← Kembali ke Data Siswa</a>";
    } else {
        echo "<h3 style='color: red;'>✗ Data siswa gagal diubah: " . mysqli_error($conn) . "</h3>";
        echo "<a href='edit.php?id=$id'>← Kembali</a>";
    }
} else {
    echo "Akses tidak valid.";
}
?>