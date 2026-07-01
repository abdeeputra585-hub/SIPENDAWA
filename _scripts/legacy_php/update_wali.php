<?php
include 'koneksi.php';

if (isset($_POST['update'])) {
    $id = mysqli_real_escape_string($conn, $_POST['id']);
    $nama = mysqli_real_escape_string($conn, $_POST['nama']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $telepon = mysqli_real_escape_string($conn, $_POST['telepon']);
    $pekerjaan = mysqli_real_escape_string($conn, $_POST['pekerjaan']);
    $alamat = mysqli_real_escape_string($conn, $_POST['alamat']);
    $status = mysqli_real_escape_string($conn, $_POST['status']);

    $query = "UPDATE wali SET nama='$nama', email='$email', telepon='$telepon', pekerjaan='$pekerjaan', alamat='$alamat', status='$status' WHERE id='$id'";

    if (mysqli_query($conn, $query)) {
        echo "<h3 style='color: green;'>✓ Data wali berhasil diubah.</h3>";
        echo "<a href='tampil_wali.php'>← Kembali ke Data Wali</a>";
    } else {
        echo "<h3 style='color: red;'>✗ Data wali gagal diubah: " . mysqli_error($conn) . "</h3>";
        echo "<a href='edit_wali.php?id=$id'>← Kembali</a>";
    }
} else {
    echo "Akses tidak valid.";
}
?>
