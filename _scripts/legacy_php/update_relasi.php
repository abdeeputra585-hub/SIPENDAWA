<?php
include 'koneksi.php';

if (isset($_POST['update'])) {
    $id = mysqli_real_escape_string($conn, $_POST['id']);
    $tipe = mysqli_real_escape_string($conn, $_POST['tipe']);
    $status = mysqli_real_escape_string($conn, $_POST['status']);

    $query = "UPDATE relasi SET tipe='$tipe', status='$status' WHERE id='$id'";

    if (mysqli_query($conn, $query)) {
        echo "<h3 style='color: green;'>✓ Data relasi berhasil diubah.</h3>";
        echo "<a href='tampil_relasi.php'>← Kembali ke Data Relasi</a>";
    } else {
        echo "<h3 style='color: red;'>✗ Data relasi gagal diubah: " . mysqli_error($conn) . "</h3>";
        echo "<a href='edit_relasi.php?id=$id'>← Kembali</a>";
    }
} else {
    echo "Akses tidak valid.";
}
?>
