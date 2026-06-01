<?php
$host = "localhost";
$user = "root";
$password = "";

$conn = mysqli_connect($host, $user, $password);

if (!$conn) {
    die("Koneksi gagal: " . mysqli_connect_error());
}

$sql_file = file_get_contents('perpustakaan.sql');
$sql_statements = array_filter(array_map('trim', explode(';', $sql_file)));

$success_count = 0;
$error_messages = [];

foreach ($sql_statements as $sql) {
    if (!empty($sql)) {
        if (!mysqli_query($conn, $sql . ';')) {
            $error_messages[] = "Error: " . mysqli_error($conn) . "<br>SQL: " . substr($sql, 0, 100) . "...";
        } else {
            $success_count++;
        }
    }
}

?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Database</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .success { color: #4CAF50; padding: 15px; background-color: #e8f5e9; border-radius: 4px; margin-bottom: 20px; }
        .error { color: #d32f2f; padding: 15px; background-color: #ffebee; border-radius: 4px; margin-bottom: 10px; }
        a { color: #0066cc; text-decoration: none; display: block; text-align: center; margin-top: 20px; padding: 10px; background-color: #4CAF50; color: white; border-radius: 4px; }
        a:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Setup Database EduGuardian</h1>
        
        <?php if (count($error_messages) === 0): ?>
            <div class="success">
                <h2>✓ Setup Berhasil!</h2>
                <p><?= $success_count ?> perintah SQL berhasil dijalankan.</p>
                <p>Database dan tabel telah dibuat dengan sukses.</p>
            </div>
            <a href="index.php">→ Mulai Menggunakan Aplikasi</a>
        <?php else: ?>
            <div class="error">
                <h2>✗ Setup Gagal!</h2>
                <p>Terjadi beberapa error:</p>
                <?php foreach ($error_messages as $msg): ?>
                    <p><?= htmlspecialchars($msg) ?></p>
                <?php endforeach; ?>
            </div>
            <a href="setup_db.php">🔄 Coba Lagi</a>
        <?php endif; ?>
    </div>
</body>
</html>

<?php
mysqli_close($conn);
?>
