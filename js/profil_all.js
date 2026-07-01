// js/profil_all.js

async function loadProfilUmum() {
    try {
        const res = await fetch(`${API_BASE}/profil/get.php`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('profil-umum-nama').value = data.data.nama;
            document.getElementById('profil-umum-username').value = data.data.username;
            document.getElementById('profil-umum-email').value = data.data.email;
            if (data.data.avatar) {
                document.getElementById('profil-umum-avatar-preview').src = data.data.avatar;
                document.getElementById('user-avatar').src = data.data.avatar;
            }
        }
    } catch (e) {
        console.error("Gagal memuat profil umum", e);
    }
}

async function simpanProfilUmum(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-profil-umum');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    const payload = {
        nama: document.getElementById('profil-umum-nama').value,
        username: document.getElementById('profil-umum-username').value,
        email: document.getElementById('profil-umum-email').value,
        password: document.getElementById('profil-umum-password').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/profil/update.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire('Berhasil', data.message, 'success');
            document.getElementById('profil-umum-password').value = '';
            // Update name in sidebar if changed
            document.getElementById('user-fullname').textContent = payload.nama;
        } else {
            Swal.fire('Gagal', data.message, 'error');
        }
    } catch (e) {
        Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadParentProfil() {
    try {
        const res = await fetch(`${API_BASE}/profil/get.php`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('parent-profil-nama').value = data.data.nama;
            document.getElementById('parent-profil-username').value = data.data.username;
            document.getElementById('parent-profil-email').value = data.data.email;
            document.getElementById('parent-profil-telepon').value = data.data.telepon !== '-' ? data.data.telepon : '';
            document.getElementById('parent-profil-alamat').value = data.data.alamat !== '-' ? data.data.alamat : '';
            if (data.data.avatar) {
                document.getElementById('parent-profil-avatar-preview').src = data.data.avatar;
                document.getElementById('user-avatar').src = data.data.avatar;
            }
        }
    } catch (e) {
        console.error("Gagal memuat profil parent", e);
    }
}

async function simpanParentProfil(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-parent-profil');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    const payload = {
        nama: document.getElementById('parent-profil-nama').value,
        username: document.getElementById('parent-profil-username').value,
        email: document.getElementById('parent-profil-email').value,
        telepon: document.getElementById('parent-profil-telepon').value,
        alamat: document.getElementById('parent-profil-alamat').value,
        password: document.getElementById('parent-profil-password').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/profil/update.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire('Berhasil', data.message, 'success');
            document.getElementById('parent-profil-password').value = '';
            document.getElementById('user-fullname').textContent = payload.nama;
        } else {
            Swal.fire('Gagal', data.message, 'error');
        }
    } catch (e) {
        Swal.fire('Error', 'Terjadi kesalahan jaringan', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function uploadFotoProfil(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);
    formData.append('type', 'profil');

    try {
        preview.style.opacity = '0.5';
        const res = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('SIPENDAWA_token')}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            preview.src = data.data.foto_url;
            document.getElementById('user-avatar').src = data.data.foto_url;
            Swal.fire({
                title: 'Berhasil',
                text: 'Foto profil berhasil diperbarui',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } else {
            Swal.fire('Gagal', data.message, 'error');
        }
    } catch (e) {
        Swal.fire('Error', 'Terjadi kesalahan jaringan saat mengunggah', 'error');
    } finally {
        preview.style.opacity = '1';
        input.value = ''; // reset input
    }
}
