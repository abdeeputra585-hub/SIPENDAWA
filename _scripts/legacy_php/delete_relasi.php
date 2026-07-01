<?php
include 'koneksi.php';

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);

    $query = "DELETE FROM relasi WHERE id='$id'";
    $delete = mysqli_query($conn, $query);

    if ($delete) {
        echo "<h3 style='color: green;'>✓ Data relasi berhasil dihapus.</h3>";
        echo "<a href='tampil_relasi.php'>← Kembali ke Data Relasi</a>";
    } else {
        echo "<h3 style='color: red;'>✗ Data relasi gagal dihapus: " . mysqli_error($conn) . "</h3>";
        echo "<a href='tampil_relasi.php'>← Kembali</a>";
    }
} else {
    echo "Akses tidak valid.";
}
?>
