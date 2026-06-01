<?php
include 'koneksi.php';

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);

    $query = "DELETE FROM wali WHERE id='$id'";
    $delete = mysqli_query($conn, $query);

    if ($delete) {
        echo "<h3 style='color: green;'>✓ Data wali berhasil dihapus.</h3>";
        echo "<a href='tampil_wali.php'>← Kembali ke Data Wali</a>";
    } else {
        echo "<h3 style='color: red;'>✗ Data wali gagal dihapus: " . mysqli_error($conn) . "</h3>";
        echo "<a href='tampil_wali.php'>← Kembali</a>";
    }
} else {
    echo "Akses tidak valid.";
}
?>
