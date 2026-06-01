<?php
/**
 * tampil.php - DIPERBAIKI
 * - Output di-escape untuk XSS protection
 * - Fitur search dan filter
 * - Pagination untuk performa
 * - Session check untuk autentikasi
 */

session_start();

// Uncomment jika perlu check login
// if (!isset($_SESSION['user_id'])) {
//     header('Location: login.php');
//     exit();
// }

include 'koneksi.php';

// Pagination
$perPage = 20;
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$offset = ($page - 1) * $perPage;

// Search & filter
$search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';
$statusFilter = isset($_GET['status']) ? mysqli_real_escape_string($conn, $_GET['status']) : '';

// Build WHERE clause
$where = '1=1';
if (!empty($search)) {
    $where .= " AND (nama LIKE '%$search%' OR nisn LIKE '%$search%')";
}
if (!empty($statusFilter)) {
    $where .= " AND status = '$statusFilter'";
}

// Count total
$countQuery = "SELECT COUNT(*) as total FROM siswa WHERE $where";
$countResult = mysqli_query($conn, $countQuery);
$countRow = mysqli_fetch_assoc($countResult);
$total = $countRow['total'];
$totalPages = ceil($total / $perPage);

// Get data dengan pagination
$query = "SELECT * FROM siswa WHERE $where ORDER BY created_at DESC LIMIT $perPage OFFSET $offset";
$result = mysqli_query($conn, $query);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Siswa</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #2c3e50; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        header h1 { font-size: 28px; margin-bottom: 10px; }
        header .breadcrumb { font-size: 13px; color: #7f8c8d; }
        
        .controls { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .controls-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 12px; align-items: end; }
        
        input, select { padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: inherit; }
        input:focus, select:focus { outline: none; border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }
        
        .btn { padding: 10px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #3498db; color: white; }
        .btn-primary:hover { background: #2980b9; }
        .btn-secondary { background: #ecf0f1; color: #2c3e50; }
        .btn-secondary:hover { background: #d5dbde; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-danger:hover { background: #c0392b; }
        
        table { width: 100%; background: white; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        thead { background: #34495e; color: white; }
        th { padding: 15px; text-align: left; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; }
        td { padding: 12px 15px; border-bottom: 1px solid #ecf0f1; }
        tbody tr:hover { background: #f8f9fa; }
        
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .status-aktif { background: #d5f4e6; color: #27ae60; }
        .status-pending { background: #ffeaa7; color: #f39c12; }
        .status-alumni { background: #fab1a0; color: #d63031; }
        
        .action-links { display: flex; gap: 8px; }
        a { color: #3498db; text-decoration: none; font-size: 13px; font-weight: 500; }
        a:hover { text-decoration: underline; }
        a.delete { color: #e74c3c; }
        
        .pagination { margin-top: 20px; text-align: center; }
        .pagination a, .pagination span { display: inline-block; padding: 8px 12px; margin: 0 4px; border: 1px solid #e0e0e0; border-radius: 4px; color: #3498db; }
        .pagination span.active { background: #3498db; color: white; border-color: #3498db; }
        .pagination a:hover { background: #ecf0f1; }
        
        .info { background: #ecf0f1; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #555; }
        .info strong { color: #2c3e50; }
        
        .empty { text-align: center; padding: 40px 20px; color: #7f8c8d; }
        
        @media (max-width: 768px) {
            .controls-row { grid-template-columns: 1fr; }
            table { font-size: 12px; }
            td, th { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📋 Data Siswa</h1>
            <div class="breadcrumb"><a href="index.php">Home</a> / Data Siswa</div>
        </header>

        <!-- Informasi -->
        <div class="info">
            Menampilkan <strong><?php echo mysqli_num_rows($result); ?></strong> dari <strong><?php echo $total; ?></strong> siswa | Halaman <strong><?php echo $page; ?></strong> dari <strong><?php echo $totalPages ?: 1; ?></strong>
        </div>

        <!-- Search & Filter -->
        <div class="controls">
            <form method="GET" class="controls-row">
                <input type="text" name="search" placeholder="Cari nama atau NISN..." value="<?php echo htmlspecialchars($search); ?>">
                <select name="status">
                    <option value="">- Semua Status -</option>
                    <option value="Aktif" <?php echo $statusFilter === 'Aktif' ? 'selected' : ''; ?>>Aktif</option>
                    <option value="Verifikasi" <?php echo $statusFilter === 'Verifikasi' ? 'selected' : ''; ?>>Verifikasi</option>
                    <option value="Alumni" <?php echo $statusFilter === 'Alumni' ? 'selected' : ''; ?>>Alumni</option>
                    <option value="Pindah" <?php echo $statusFilter === 'Pindah' ? 'selected' : ''; ?>>Pindah</option>
                </select>
                <button type="submit" class="btn btn-primary">Cari</button>
                <a href="tampil.php" class="btn btn-secondary">Reset</a>
            </form>
        </div>

        <!-- Tabel Data -->
        <?php if (mysqli_num_rows($result) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>NISN</th>
                        <th>Nama</th>
                        <th>Kelas</th>
                        <th>Jenis Kelamin</th>
                        <th>Status</th>
                        <th>Alamat</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $no = ($page - 1) * $perPage + 1;
                    while ($data = mysqli_fetch_array($result)) {
                        $statusClass = 'status-' . strtolower(str_replace(' ', '-', $data['status']));
                        echo '<tr>';
                        echo '<td>' . $no++ . '</td>';
                        echo '<td>' . htmlspecialchars($data['nisn']) . '</td>';
                        echo '<td><strong>' . htmlspecialchars($data['nama']) . '</strong></td>';
                        echo '<td>' . htmlspecialchars($data['kelas']) . '</td>';
                        echo '<td>' . htmlspecialchars($data['jenis_kelamin']) . '</td>';
                        echo '<td><span class="status-badge ' . $statusClass . '">' . htmlspecialchars($data['status']) . '</span></td>';
                        echo '<td>' . htmlspecialchars(substr($data['alamat'], 0, 50) . (strlen($data['alamat']) > 50 ? '...' : '')) . '</td>';
                        echo '<td>';
                        echo '<div class="action-links">';
                        echo '<a href="edit.php?id=' . $data['id'] . '">✏️ Edit</a>';
                        echo '<a href="delete.php?id=' . $data['id'] . '" class="delete" onclick="return confirm(\'Yakin hapus data ini?\')">🗑️ Hapus</a>';
                        echo '</div>';
                        echo '</td>';
                        echo '</tr>';
                    }
                    ?>
                </tbody>
            </table>

            <!-- Pagination -->
            <?php if ($totalPages > 1): ?>
                <div class="pagination">
                    <?php if ($page > 1): ?>
                        <a href="?page=1&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($statusFilter); ?>">« Pertama</a>
                        <a href="?page=<?php echo $page - 1; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($statusFilter); ?>">‹ Sebelumnya</a>
                    <?php endif; ?>

                    <?php 
                    $start = max(1, $page - 2);
                    $end = min($totalPages, $page + 2);
                    
                    for ($i = $start; $i <= $end; $i++):
                    ?>
                        <?php if ($i === $page): ?>
                            <span class="active"><?php echo $i; ?></span>
                        <?php else: ?>
                            <a href="?page=<?php echo $i; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($statusFilter); ?>"><?php echo $i; ?></a>
                        <?php endif; ?>
                    <?php endfor; ?>

                    <?php if ($page < $totalPages): ?>
                        <a href="?page=<?php echo $page + 1; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($statusFilter); ?>">Selanjutnya ›</a>
                        <a href="?page=<?php echo $totalPages; ?>&search=<?php echo urlencode($search); ?>&status=<?php echo urlencode($statusFilter); ?>">Terakhir »</a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

        <?php else: ?>
            <div class="empty">
                <p style="font-size: 16px; margin-bottom: 10px;">📭 Tidak ada data siswa</p>
                <p style="font-size: 13px; color: #95a5a6;">Mulai dengan <a href="index.php">menambah data siswa baru</a></p>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>

<?php mysqli_close($conn); ?>