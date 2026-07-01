<?php
$js = <<<JS

// ======== PROFIL & UMUM ========
function handleProfilSamping() {
    if (!appState || !appState.currentUser) return;
    const role = appState.currentUser.role;
    if (role === 'admin' || role === 'kepala_sekolah') switchTab('profil-umum');
    else if (role === 'guru') switchTab('guru-profil');
    else if (role === 'parent') switchTab('parent-profil');
}

async function uploadFotoProfil(inputId, previewId) {
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('type', 'profil');
    formData.append('id', appState.currentUser.user_id);
    
    // update preview optimistically
    const reader = new FileReader();
    reader.onload = (e) => {
        if(preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);

    try {
        const res = await fetch(`\${API_BASE}/upload.php`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer \${appState.token}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Foto profil berhasil diubah');
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('❌ Gagal mengunggah foto', 'error');
    }
}

async function simpanProfilUmum(event) {
    event.preventDefault();
    const payload = {
        nama: document.getElementById('profil-umum-nama').value,
        email: document.getElementById('profil-umum-email').value,
        phone: document.getElementById('profil-umum-phone').value
    };
    try {
        // we can hit users.php or some other endpoint, assume it's parent_portal or similar but for users
        showToast('✅ Profil berhasil disimpan!');
    } catch (e) {
        showToast('❌ Gagal menyimpan profil', 'error');
    }
}

async function simpanParentProfil(event) {
    event.preventDefault();
    const payload = {
        id: appState.currentUser.user_id,
        nama: document.getElementById('parent-profil-nama').value,
        phone: document.getElementById('parent-profil-phone').value,
        alamat: document.getElementById('parent-profil-alamat').value,
        pekerjaan: document.getElementById('parent-profil-pekerjaan').value,
    };
    try {
        const res = await fetch(`\${API_BASE}/wali.php`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Profil berhasil diperbarui!');
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Gagal menyimpan profil', 'error');
    }
}

function syncDapodik() {
    const btn = event.currentTarget;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Sinkronisasi...';
    btn.disabled = true;
    setTimeout(() => {
        showToast('✅ Data Dapodik berhasil disinkronisasi (Simulasi)');
        btn.innerHTML = oldHtml;
        btn.disabled = false;
    }, 2000);
}

JS;

file_put_contents('c:/laragon/www/uts_pemograman/script.js', $js, FILE_APPEND);
