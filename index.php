<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Manajemen Wali Siswa</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .tab-buttons { margin-bottom: 20px; display: flex; gap: 10px; }
        .tab-btn { padding: 10px 20px; background-color: #ddd; border: none; cursor: pointer; border-radius: 4px; font-size: 14px; }
        .tab-btn.active { background-color: #4CAF50; color: white; }
        .form-section { display: none; }
        .form-section.active { display: block; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        input, textarea, select { width: 100%; max-width: 500px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
        button { background-color: #4CAF50; color: white; padding: 12px 25px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        button:hover { background-color: #45a049; }
        .link-section { margin-top: 20px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        h1 { color: #333; margin-top: 0; }
        h2 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; margin-top: 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Sistem Manajemen Wali Siswa</h1>
        
        <div class="tab-buttons">
            <button class="tab-btn active" onclick="showTab('siswa')">Tambah Siswa</button>
            <button class="tab-btn" onclick="showTab('wali')">Tambah Wali</button>
            <button class="tab-btn" onclick="showTab('relasi')">Hubungkan Siswa-Wali</button>
        </div>

        <!-- Form Tambah Siswa -->
        <div id="siswa" class="form-section active">
            <h2>📝 Form Tambah Siswa</h2>
            <form action="simpan.php" method="post">
                <input type="hidden" name="tipe" value="siswa">
                
                <div class="form-group">
                    <label for="nisn">NISN (Nomor Induk Siswa Nasional):</label>
                    <input type="text" id="nisn" name="nisn" placeholder="Contoh: 0082415521" required>
                </div>

                <div class="form-group">
                    <label for="nama">Nama Siswa:</label>
                    <input type="text" id="nama" name="nama" placeholder="Contoh: Aditama Saputra" required>
                </div>

                <div class="form-group">
                    <label for="kelas">Kelas:</label>
                    <select id="kelas" name="kelas" required>
                        <option value="">-- Pilih Kelas --</option>
                        <option value="X - MIPA 1">X - MIPA 1</option>
                        <option value="X - MIPA 2">X - MIPA 2</option>
                        <option value="X - MIPA 3">X - MIPA 3</option>
                        <option value="X - IPS 1">X - IPS 1</option>
                        <option value="X - IPS 2">X - IPS 2</option>
                        <option value="XI - MIPA 1">XI - MIPA 1</option>
                        <option value="XI - MIPA 2">XI - MIPA 2</option>
                        <option value="XI - IPS 1">XI - IPS 1</option>
                        <option value="XI - IPS 2">XI - IPS 2</option>
                        <option value="XII - MIPA 1">XII - MIPA 1</option>
                        <option value="XII - MIPA 2">XII - MIPA 2</option>
                        <option value="XII - IPS 1">XII - IPS 1</option>
                        <option value="XII - IPS 2">XII - IPS 2</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="jenis_kelamin">Jenis Kelamin:</label>
                    <select id="jenis_kelamin" name="jenis_kelamin" required>
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="alamat">Alamat:</label>
                    <textarea id="alamat" name="alamat" rows="3" placeholder="Masukkan alamat siswa"></textarea>
                </div>

                <button type="submit" name="simpan">💾 Simpan Siswa</button>
            </form>
        </div>

        <!-- Form Tambah Wali -->
        <div id="wali" class="form-section">
            <h2>👨‍👩‍👧 Form Tambah Wali Siswa</h2>
            <form action="simpan.php" method="post">
                <input type="hidden" name="tipe" value="wali">
                
                <div class="form-group">
                    <label for="wali_nama">Nama Wali:</label>
                    <input type="text" id="wali_nama" name="wali_nama" placeholder="Contoh: Andi Saputra" required>
                </div>

                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" placeholder="Contoh: andi@email.com">
                </div>

                <div class="form-group">
                    <label for="telepon">Telepon:</label>
                    <input type="text" id="telepon" name="telepon" placeholder="Contoh: 081234567890">
                </div>

                <div class="form-group">
                    <label for="pekerjaan">Pekerjaan:</label>
                    <input type="text" id="pekerjaan" name="pekerjaan" placeholder="Contoh: Wiraswasta">
                </div>

                <div class="form-group">
                    <label for="wali_alamat">Alamat:</label>
                    <textarea id="wali_alamat" name="wali_alamat" rows="3" placeholder="Masukkan alamat wali"></textarea>
                </div>

                <button type="submit" name="simpan">💾 Simpan Wali</button>
            </form>
        </div>

        <!-- Form Hubungkan Siswa-Wali -->
        <div id="relasi" class="form-section">
            <h2>🔗 Form Hubungkan Siswa - Wali</h2>
            <form action="simpan.php" method="post">
                <input type="hidden" name="tipe" value="relasi">
                
                <div class="form-group">
                    <label for="siswa_id">Pilih Siswa:</label>
                    <select id="siswa_id" name="siswa_id" required>
                        <option value="">-- Pilih Siswa --</option>
                        <?php
                        include 'koneksi.php';
                        $query = "SELECT id, nisn, nama FROM siswa ORDER BY nama";
                        $result = mysqli_query($conn, $query);
                        while ($row = mysqli_fetch_array($result)) {
                            echo "<option value='{$row['id']}'>{$row['nama']} ({$row['nisn']})</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="wali_id">Pilih Wali:</label>
                    <select id="wali_id" name="wali_id" required>
                        <option value="">-- Pilih Wali --</option>
                        <?php
                        $query = "SELECT id, nama FROM wali ORDER BY nama";
                        $result = mysqli_query($conn, $query);
                        while ($row = mysqli_fetch_array($result)) {
                            echo "<option value='{$row['id']}'>{$row['nama']}</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="tipe_relasi">Tipe Relasi:</label>
                    <select id="tipe_relasi" name="tipe_relasi" required>
                        <option value="">-- Pilih Tipe --</option>
                        <option value="AYAH">Ayah</option>
                        <option value="IBU">Ibu</option>
                        <option value="WALI">Wali</option>
                    </select>
                </div>

                <button type="submit" name="simpan">🔗 Hubungkan</button>
            </form>
        </div>

        <div class="link-section">
            <h3>Menu Utama:</h3>
            <ul>
                <li><a href="tampil.php">📋 Lihat Data Siswa</a></li>
                <li><a href="tampil_wali.php">👥 Lihat Data Wali</a></li>
                <li><a href="tampil_relasi.php">🔗 Lihat Data Relasi</a></li>
            </ul>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all sections
            const sections = document.querySelectorAll('.form-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Remove active class from all buttons
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(button => button.classList.remove('active'));
            
            // Show selected section
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>