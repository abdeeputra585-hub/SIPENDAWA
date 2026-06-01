<?php
include 'koneksi.php';
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Relasi</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #FF9800; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        a { color: #0066cc; text-decoration: none; margin-right: 10px; }
        a:hover { text-decoration: underline; }
        .delete { color: red; }
        .link-section { margin-bottom: 20px; }
        h2 { color: #333; border-bottom: 2px solid #FF9800; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 Data Relasi Siswa - Wali</h1>

        <div class="link-section">
            <a href="index.php">+ Tambah Data</a>
            <a href="tampil.php">📋 Lihat Data Siswa</a>
            <a href="tampil_wali.php">👥 Lihat Data Wali</a>
        </div>

        <table>
            <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>NISN</th>
                <th>Nama Wali</th>
                <th>Tipe Relasi</th>
                <th>Status</th>
                <th>Aksi</th>
            </tr>

            <?php
            $no = 1;
            $query = "SELECT r.id, s.nisn, s.nama as siswa_nama, w.nama as wali_nama, r.tipe, r.status 
                      FROM relasi r 
                      JOIN siswa s ON r.siswa_id = s.id 
                      JOIN wali w ON r.wali_id = w.id 
                      ORDER BY r.created_at DESC";
            $result = mysqli_query($conn, $query);

            while ($data = mysqli_fetch_array($result)) {
            ?>
                <tr>
                    <td><?= $no++ ?></td>
                    <td><?= $data['siswa_nama'] ?></td>
                    <td><?= $data['nisn'] ?></td>
                    <td><?= $data['wali_nama'] ?></td>
                    <td><?= $data['tipe'] ?></td>
                    <td><?= $data['status'] ?></td>
                    <td>
                        <a href="edit_relasi.php?id=<?= $data['id'] ?>">Edit</a>
                        <a href="delete_relasi.php?id=<?= $data['id'] ?>" class="delete" onclick="return confirm('Yakin hapus?')">Hapus</a>
                    </td>
                </tr>
            <?php } ?>
        </table>
    </div>
</body>
</html>
