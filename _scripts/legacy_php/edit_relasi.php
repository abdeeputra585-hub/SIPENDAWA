<?php
include 'koneksi.php';

$id = mysqli_real_escape_string($conn, $_GET['id']);
$query = "SELECT r.*, s.nama as siswa_nama, w.nama as wali_nama FROM relasi r 
          JOIN siswa s ON r.siswa_id = s.id 
          JOIN wali w ON r.wali_id = w.id 
          WHERE r.id='$id'";
$result = mysqli_query($conn, $query);
$data = mysqli_fetch_array($result);

if (!$data) {
    echo "Data relasi tidak ditemukan.";
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Relasi</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #FF9800; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #e68900; }
        a { color: #0066cc; text-decoration: none; }
        h2 { color: #333; border-bottom: 2px solid #FF9800; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>✏️ Edit Relasi Siswa - Wali</h2>

        <form action="update_relasi.php" method="post">
            <input type="hidden" name="id" value="<?= $data['id'] ?>">

            <div class="form-group">
                <label for="siswa_nama">Nama Siswa:</label>
                <input type="text" id="siswa_nama" name="siswa_nama" value="<?= $data['siswa_nama'] ?>" disabled>
            </div>

            <div class="form-group">
                <label for="wali_nama">Nama Wali:</label>
                <input type="text" id="wali_nama" name="wali_nama" value="<?= $data['wali_nama'] ?>" disabled>
            </div>

            <div class="form-group">
                <label for="tipe">Tipe Relasi:</label>
                <select id="tipe" name="tipe" required>
                    <option value="AYAH" <?= $data['tipe'] == 'AYAH' ? 'selected' : '' ?>>Ayah</option>
                    <option value="IBU" <?= $data['tipe'] == 'IBU' ? 'selected' : '' ?>>Ibu</option>
                    <option value="WALI" <?= $data['tipe'] == 'WALI' ? 'selected' : '' ?>>Wali</option>
                </select>
            </div>

            <div class="form-group">
                <label for="status">Status:</label>
                <select id="status" name="status" required>
                    <option value="Terverifikasi" <?= $data['status'] == 'Terverifikasi' ? 'selected' : '' ?>>Terverifikasi</option>
                    <option value="Pending" <?= $data['status'] == 'Pending' ? 'selected' : '' ?>>Pending</option>
                </select>
            </div>

            <button type="submit" name="update">💾 Simpan Perubahan</button>
            <a href="tampil_relasi.php">← Kembali</a>
        </form>
    </div>
</body>
</html>
