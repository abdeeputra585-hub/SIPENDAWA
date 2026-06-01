# 📚 Sistem Manajemen Wali Siswa - EduGuardian

Sistem web untuk mengelola data siswa dan wali siswa dengan fitur relasi orang tua/wali.

## 🚀 Cara Setup

### 1. **Persiapan Awal**
- Pastikan Anda memiliki **XAMPP** atau **WAMP** terinstall
- Aktifkan **Apache** dan **MySQL** dari control panel XAMPP/WAMP

### 2. **Konfigurasi Database**
File `koneksi.php` sudah dikonfigurasi untuk:
- Host: `localhost`
- User: `root`
- Password: `` (kosong)
- Database: `eduguardian`

### 3. **Setup Otomatis**
Buka browser dan akses:
```
http://localhost/[folder-anda]/setup_db.php
```

Sistem akan otomatis:
- ✓ Membuat database `eduguardian`
- ✓ Membuat 6 tabel (users, siswa, wali, relasi, notifikasi, kehadiran)
- ✓ Menampilkan status setup

**Jika setup berhasil**, klik tombol untuk lanjut ke aplikasi.

---

## 📖 Panduan Penggunaan

### **Dashboard Utama** - `index.php`
Halaman ini memiliki 3 tab:

#### Tab 1: **Tambah Siswa** 
- Isi data: NISN, Nama, Kelas, Jenis Kelamin, Alamat
- Status otomatis: "Aktif"
- Klik **"💾 Simpan Siswa"**

#### Tab 2: **Tambah Wali**
- Isi data: Nama, Email, Telepon, Pekerjaan, Alamat
- Status otomatis: "Pending"
- Klik **"💾 Simpan Wali"**

#### Tab 3: **Hubungkan Siswa-Wali**
- Pilih Siswa dari dropdown (data otomatis dimuat)
- Pilih Wali dari dropdown (data otomatis dimuat)
- Pilih Tipe Relasi: AYAH, IBU, atau WALI
- Klik **"🔗 Hubungkan"**

---

## 📊 Menu Data

### **1. Lihat Data Siswa** - `tampil.php`
- Menampilkan tabel semua siswa
- Kolom: No, NISN, Nama, Kelas, Jenis Kelamin, Status, Alamat, Aksi
- **Aksi:**
  - ✏️ **Edit** - Ubah data siswa
  - 🗑️ **Hapus** - Hapus data siswa

### **2. Lihat Data Wali** - `tampil_wali.php`
- Menampilkan tabel semua wali
- Kolom: No, Nama, Email, Telepon, Pekerjaan, Status, Alamat, Aksi
- **Aksi:**
  - ✏️ **Edit** - Ubah data wali
  - 🗑️ **Hapus** - Hapus data wali

### **3. Lihat Data Relasi** - `tampil_relasi.php`
- Menampilkan tabel hubungan siswa-wali
- Kolom: No, Nama Siswa, NISN, Nama Wali, Tipe Relasi, Status, Aksi
- **Aksi:**
  - ✏️ **Edit** - Ubah tipe atau status relasi
  - 🗑️ **Hapus** - Hapus relasi

---

## 🔧 File-File Penting

### **Backend (PHP)**
```
├── koneksi.php          - Koneksi ke database
├── index.php            - Dashboard dengan form input
├── simpan.php           - Proses menyimpan data
├── tampil.php           - Lihat data siswa
├── tampil_wali.php      - Lihat data wali
├── tampil_relasi.php    - Lihat data relasi
├── edit.php             - Form edit siswa
├── edit_wali.php        - Form edit wali
├── edit_relasi.php      - Form edit relasi
├── update.php           - Proses update siswa
├── update_wali.php      - Proses update wali
├── update_relasi.php    - Proses update relasi
├── delete.php           - Proses hapus siswa
├── delete_wali.php      - Proses hapus wali
├── delete_relasi.php    - Proses hapus relasi
└── setup_db.php         - Setup database otomatis
```

### **Database**
```
└── perpustakaan.sql     - Script SQL (CREATE TABLE tanpa data)
```

---

## 💾 Struktur Database

### **Tabel: siswa**
- `id` - Primary Key
- `nisn` - Nomor Induk Siswa Nasional (UNIQUE)
- `nama` - Nama Siswa
- `kelas` - Kelas Siswa
- `jenis_kelamin` - Laki-laki/Perempuan
- `status` - Aktif/Verifikasi/Alumni/Pindah
- `foto` - URL Foto
- `alamat` - Alamat Siswa
- `created_at` - Tanggal Dibuat

### **Tabel: wali**
- `id` - Primary Key
- `user_id` - Foreign Key ke users (optional)
- `nama` - Nama Wali
- `email` - Email Wali
- `telepon` - No Telepon
- `pekerjaan` - Pekerjaan
- `alamat` - Alamat
- `status` - Terverifikasi/Pending/Ditolak
- `created_at` - Tanggal Dibuat

### **Tabel: relasi**
- `id` - Primary Key
- `siswa_id` - Foreign Key ke siswa
- `wali_id` - Foreign Key ke wali
- `tipe` - AYAH/IBU/WALI
- `status` - Terverifikasi/Pending
- `created_at` - Tanggal Dibuat

### **Tabel: users, notifikasi, kehadiran**
- Tersedia untuk fitur tambahan di masa depan

---

## 🔒 Keamanan

✅ **Sudah diimplementasikan:**
- ✓ `mysqli_real_escape_string()` untuk mencegah SQL Injection
- ✓ Validasi form HTML5
- ✓ Error handling yang baik
- ✓ Prepared statements siap diterapkan

---

## ⚠️ Catatan Penting

1. **Database kosong** - Data diisi manual melalui web, bukan dari SQL script
2. **Charset UTF-8** - Mendukung huruf Indonesia (ë, à, dll)
3. **ID Auto Increment** - Semua tabel menggunakan auto increment
4. **Foreign Key** - Relasi tabel sudah dikonfigurasi dengan CASCADE DELETE

---

## 🐛 Troubleshooting

### **Error: "Koneksi gagal"**
- Pastikan MySQL sudah running
- Cek username/password di `koneksi.php`
- Cek nama database di `koneksi.php`

### **Error: "Tabel sudah ada"**
- Ini normal, bisa diabaikan
- Sistem menggunakan `IF NOT EXISTS`

### **Data tidak muncul di dropdown Relasi**
- Pastikan sudah menambah Siswa terlebih dahulu
- Pastikan sudah menambah Wali terlebih dahulu

### **Error 500 saat setup**
- Cek file `perpustakaan.sql` tidak ada error syntax
- Cek permission folder untuk read/write

---

## 📝 Contoh Alur Penggunaan

1. **Buka aplikasi** → `http://localhost/UTS PEMOGRAMAN/index.php`
2. **Tab "Tambah Siswa"** → Isi dan simpan (minimal 1 siswa)
3. **Tab "Tambah Wali"** → Isi dan simpan (minimal 1 wali)
4. **Tab "Hubungkan Siswa-Wali"** → Pilih siswa + wali + tipe, simpan
5. **Lihat Data** → Buka tampil.php, tampil_wali.php, tampil_relasi.php

---

## 📞 Support

Jika ada pertanyaan atau error, periksa:
1. Console browser (F12 → Console tab)
2. File error di folder logs (jika ada)
3. PHPMyAdmin untuk cek struktur database

---

**Status: ✅ Siap Digunakan**  
**Versi: 1.0**  
**Last Update: 23 Mei 2026**
