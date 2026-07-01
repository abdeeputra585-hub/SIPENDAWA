<?php
include 'koneksi.php';

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);

    $query = "DELETE FROM siswa WHERE id='$id'";
    $delete = mysqli_query($conn, $query);

    if ($delete) {
        echo "<h3 style='color: green;'>✓ Data siswa berhasil dihapus.</h3>";
        echo "<a href='tampil.php'>← Kembali ke Data Siswa</a>";
    } else {
        echo "<h3 style='color: red;'>✗ Data siswa gagal dihapus: " . mysqli_error($conn) . "</h3>";
        echo "<a href='tampil.php'>← Kembali</a>";
    }
} else {
    echo "Akses tidak valid.";
}
?>

