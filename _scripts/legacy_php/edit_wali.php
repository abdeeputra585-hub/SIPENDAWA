<?php
include 'koneksi.php';

$id = mysqli_real_escape_string($conn, $_GET['id']);
$query = "SELECT * FROM wali WHERE id='$id'";
$result = mysqli_query($conn, $query);
$data = mysqli_fetch_array($result);

if (!$data) {
    echo "Data wali tidak ditemukan.";
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Wali</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #0b7dda; }
        a { color: #0066cc; text-decoration: none; }
        h2 { color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>✏️ Edit Data Wali</h2>

        <form action="update_wali.php" method="post">
            <input type="hidden" name="id" value="<?= $data['id'] ?>">

            <div class="form-group">
                <label for="nama">Nama Wali:</label>
                <input type="text" id="nama" name="nama" value="<?= $data['nama'] ?>" required>
            </div>

            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="<?= $data['email'] ?>">
            </div>

            <div class="form-group">
                <label for="telepon">Telepon:</label>
                <input type="text" id="telepon" name="telepon" value="<?= $data['telepon'] ?>">
            </div>

            <div class="form-group">
                <label for="pekerjaan">Pekerjaan:</label>
                <input type="text" id="pekerjaan" name="pekerjaan" value="<?= $data['pekerjaan'] ?>">
            </div>

            <div class="form-group">
                <label for="alamat">Alamat:</label>
                <textarea id="alamat" name="alamat" rows="3"><?= $data['alamat'] ?></textarea>
            </div>

            <div class="form-group">
                <label for="status">Status:</label>
                <select id="status" name="status" required>
                    <option value="Terverifikasi" <?= $data['status'] == 'Terverifikasi' ? 'selected' : '' ?>>Terverifikasi</option>
                    <option value="Pending" <?= $data['status'] == 'Pending' ? 'selected' : '' ?>>Pending</option>
                    <option value="Ditolak" <?= $data['status'] == 'Ditolak' ? 'selected' : '' ?>>Ditolak</option>
                </select>
            </div>

            <button type="submit" name="update" value="1">💾 Simpan Perubahan</button>
            <a href="tampil_wali.php">← Kembali</a>
        </form>
    </div>
</body>
</html>
