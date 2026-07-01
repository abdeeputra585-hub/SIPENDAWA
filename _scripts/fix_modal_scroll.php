<?php
/**
 * Fix semua modal yang pakai overflow-hidden di dalam container fixed inset-0
 * Ubah jadi overflow-y-auto + max-h-[90vh] agar bisa discroll di layar kecil
 */

$htmlFiles = [
    'c:/laragon/www/uts_pemograman/index.html',
    'c:/laragon/www/uts_pemograman/pages/pesan.html',
    'c:/laragon/www/uts_pemograman/pages/admin/guru.html',
    'c:/laragon/www/uts_pemograman/pages/admin/izin.html',
    'c:/laragon/www/uts_pemograman/pages/admin/keuangan.html',
    'c:/laragon/www/uts_pemograman/pages/admin/pengumuman.html',
    'c:/laragon/www/uts_pemograman/pages/guru/profil.html',
    'c:/laragon/www/uts_pemograman/pages/kepala_sekolah/laporan_keuangan.html',
    'c:/laragon/www/uts_pemograman/pages/parent/dashboard.html',
    'c:/laragon/www/uts_pemograman/pages/parent/izin.html',
    'c:/laragon/www/uts_pemograman/pages/parent/pembayaran.html',
    'c:/laragon/www/uts_pemograman/pages/parent/pengumuman.html',
];

$totalFixed = 0;

foreach ($htmlFiles as $file) {
    if (!file_exists($file)) {
        echo "⚠️  File tidak ditemukan: $file\n";
        continue;
    }
    
    $content = file_get_contents($file);
    $original = $content;
    
    // Pattern: modal inner container yang pakai overflow-hidden
    // Ubah jadi overflow-y-auto max-h-[90vh]
    // Hanya ubah yang berada di dalam modal (ada "rounded-2xl" dan "shadow-2xl")
    $content = preg_replace(
        '/(rounded-2xl shadow-2xl[^"]*?)overflow-hidden(animate-in)/m',
        '$1overflow-y-auto max-h-[90vh] $2',
        $content
    );
    
    // Juga handle: "max-w-XY overflow-hidden animate-in"
    $content = preg_replace(
        '/(max-w-(?:sm|md|lg|xl|2xl)) overflow-hidden (animate-in)/m',
        '$1 overflow-y-auto max-h-[90vh] $2',
        $content
    );
    
    if ($content !== $original) {
        file_put_contents($file, $content);
        $count = substr_count($content, 'overflow-y-auto max-h-[90vh]') - substr_count($original, 'overflow-y-auto max-h-[90vh]');
        echo "✅ Fixed $count modal(s) in: " . basename($file) . "\n";
        $totalFixed += $count;
    } else {
        echo "   No change needed: " . basename($file) . "\n";
    }
}

echo "\n=== Total: $totalFixed modal(s) diperbaiki ===\n";
?>
