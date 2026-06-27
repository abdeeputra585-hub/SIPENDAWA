<?php
require_once __DIR__ . '/../api/config.php';
mysqli_report(MYSQLI_REPORT_OFF);

echo "Memulai sinkronisasi akun Wali Murid...\n";

$result = $conn->query("SELECT * FROM wali");
$defaultPassword = password_hash('password123', PASSWORD_DEFAULT);

$count_new = 0;
$count_link = 0;

while ($row = $result->fetch_assoc()) {
    $email = $row['email'];
    $nama = $row['nama'];
    $wali_id = $row['id'];
    $current_user_id = $row['user_id'];
    
    // Cek apakah email sudah ada di users
    $cekUser = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $cekUser->bind_param("s", $email);
    $cekUser->execute();
    $resUser = $cekUser->get_result();
    
    if ($resUser->num_rows == 0) {
        // Buat user baru
        $stmt = $conn->prepare("INSERT INTO users (email, password, role, nama) VALUES (?, ?, 'parent', ?)");
        $stmt->bind_param("sss", $email, $defaultPassword, $nama);
        if ($stmt->execute()) {
            $new_user_id = $conn->insert_id;
            echo "âœ“ Membuat akun parent untuk: $email\n";
            $count_new++;
            
            // Update wali.user_id
            $upd = $conn->prepare("UPDATE wali SET user_id = ? WHERE id = ?");
            $upd->bind_param("ii", $new_user_id, $wali_id);
            $upd->execute();
            $count_link++;
        }
    } else {
        $userData = $resUser->fetch_assoc();
        $existing_user_id = $userData['id'];
        
        if (empty($current_user_id)) {
            // Update wali.user_id jika masih null tapi user sudah ada
            $upd = $conn->prepare("UPDATE wali SET user_id = ? WHERE id = ?");
            $upd->bind_param("ii", $existing_user_id, $wali_id);
            $upd->execute();
            echo "âœ“ Menghubungkan wali $nama dengan user_id yang ada\n";
            $count_link++;
        }
    }
}

echo "\nSelesai! $count_new akun baru dibuat. $count_link wali berhasil dihubungkan ke akun login.\n";
echo "Password default untuk semua orang tua adalah: password123\n";


?>


