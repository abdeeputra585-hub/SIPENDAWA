<?php
include 'koneksi.php';

$id = mysqli_real_escape_string($conn, $_GET['id']);
$query = "SELECT * FROM siswa WHERE id='$id'";
$result = mysqli_query($conn, $query);
$data = mysqli_fetch_array($result);

if (!$data) {
    echo "Data siswa tidak ditemukan.";
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Siswa</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
        a { color: #0066cc; text-decoration: none; }
        h2 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>✏️ Edit Data Siswa</h2>

        <form action="update.php" method="post">
            <input type="hidden" name="id" value="<?= $data['id'] ?>">

            <div class="form-group">
                <label for="nisn">NISN:</label>
                <input type="text" id="nisn" name="nisn" value="<?= $data['nisn'] ?>" required>
            </div>

            <div class="form-group">
                <label for="nama">Nama Siswa:</label>
                <input type="text" id="nama" name="nama" value="<?= $data['nama'] ?>" required>
            </div>

            <div class="form-group">
                <label for="kelas">Kelas:</label>
                <select id="kelas" name="kelas" required>
                    <option value="">-- Pilih Kelas --</option>
                    <option value="X - MIPA 1" <?= $data['kelas'] == 'X - MIPA 1' ? 'selected' : '' ?>>X - MIPA 1</option>
                    <option value="X - MIPA 2" <?= $data['kelas'] == 'X - MIPA 2' ? 'selected' : '' ?>>X - MIPA 2</option>
                    <option value="X - MIPA 3" <?= $data['kelas'] == 'X - MIPA 3' ? 'selected' : '' ?>>X - MIPA 3</option>
                    <option value="X - IPS 1" <?= $data['kelas'] == 'X - IPS 1' ? 'selected' : '' ?>>X - IPS 1</option>
                    <option value="X - IPS 2" <?= $data['kelas'] == 'X - IPS 2' ? 'selected' : '' ?>>X - IPS 2</option>
                    <option value="XI - MIPA 1" <?= $data['kelas'] == 'XI - MIPA 1' ? 'selected' : '' ?>>XI - MIPA 1</option>
                    <option value="XI - MIPA 2" <?= $data['kelas'] == 'XI - MIPA 2' ? 'selected' : '' ?>>XI - MIPA 2</option>
                    <option value="XI - IPS 1" <?= $data['kelas'] == 'XI - IPS 1' ? 'selected' : '' ?>>XI - IPS 1</option>
                    <option value="XI - IPS 2" <?= $data['kelas'] == 'XI - IPS 2' ? 'selected' : '' ?>>XI - IPS 2</option>
                    <option value="XII - MIPA 1" <?= $data['kelas'] == 'XII - MIPA 1' ? 'selected' : '' ?>>XII - MIPA 1</option>
                    <option value="XII - MIPA 2" <?= $data['kelas'] == 'XII - MIPA 2' ? 'selected' : '' ?>>XII - MIPA 2</option>
                    <option value="XII - IPS 1" <?= $data['kelas'] == 'XII - IPS 1' ? 'selected' : '' ?>>XII - IPS 1</option>
                    <option value="XII - IPS 2" <?= $data['kelas'] == 'XII - IPS 2' ? 'selected' : '' ?>>XII - IPS 2</option>
                </select>
            </div>

            <div class="form-group">
                <label for="jenis_kelamin">Jenis Kelamin:</label>
                <select id="jenis_kelamin" name="jenis_kelamin" required>
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="Laki-laki" <?= $data['jenis_kelamin'] == 'Laki-laki' ? 'selected' : '' ?>>Laki-laki</option>
                    <option value="Perempuan" <?= $data['jenis_kelamin'] == 'Perempuan' ? 'selected' : '' ?>>Perempuan</option>
                </select>
            </div>

            <div class="form-group">
                <label for="status">Status:</label>
                <select id="status" name="status" required>
                    <option value="Aktif" <?= $data['status'] == 'Aktif' ? 'selected' : '' ?>>Aktif</option>
                    <option value="Verifikasi" <?= $data['status'] == 'Verifikasi' ? 'selected' : '' ?>>Verifikasi</option>
                    <option value="Alumni" <?= $data['status'] == 'Alumni' ? 'selected' : '' ?>>Alumni</option>
                    <option value="Pindah" <?= $data['status'] == 'Pindah' ? 'selected' : '' ?>>Pindah</option>
                </select>
            </div>

            <div class="form-group">
                <label for="alamat">Alamat:</label>
                <textarea id="alamat" name="alamat" rows="3"><?= $data['alamat'] ?></textarea>
            </div>

            <button type="submit" name="update">💾 Simpan Perubahan</button>
            <a href="tampil.php">← Kembali</a>
        </form>
    </div>
</body>
</html>
