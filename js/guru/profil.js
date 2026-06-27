/**
 * js/guru/profil.js
 * Halaman Profil Guru — lihat, edit data diri, dan ganti password
 */

let isGuruProfilHtmlLoaded = false;

async function showGuruProfilPage() {
    if (!isGuruProfilHtmlLoaded) {
        try {
            const res  = await fetch('pages/guru/profil.html?v=1?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('guru-profil-page-container').innerHTML = html;
            isGuruProfilHtmlLoaded = true;
        } catch (e) {
            console.error('Gagal load guru profil HTML:', e);
            return;
        }
    }

    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-guru-profil');
    if (page) page.classList.remove('hidden');

    guruProfilLoad();
}

async function guruProfilLoad() {
    try {
        const res      = await fetch(`${API_BASE}/guru/profil.php`, { headers: authHeaders() });
        const response = await res.json();

        if (!response.success) {
            showToast(response.error || 'Gagal memuat profil', 'error');
            return;
        }

        const d = response.data;

        // Foto
        const fotoEl = document.getElementById('guru-profil-foto');
        if (fotoEl) fotoEl.src = d.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nama)}&size=120`;

        // Teks display
        document.getElementById('guru-profil-nama-display').textContent = d.nama;
        document.getElementById('guru-profil-email-display').textContent = d.email;
        document.getElementById('guru-profil-nip-display').textContent  = 'NIP: ' + (d.nip || '-');

        // Status badge
        const badge = document.getElementById('guru-profil-status-badge');
        if (badge) {
            badge.innerHTML = d.is_active == 1
                ? '<span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full"><i class="fa-solid fa-circle-check mr-1"></i>Aktif</span>'
                : '<span class="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full"><i class="fa-solid fa-circle-xmark mr-1"></i>Nonaktif</span>';
        }

        // Form fields
        document.getElementById('guru-profil-nama').value    = d.nama    || '';
        document.getElementById('guru-profil-nip').value     = d.nip     || '';
        document.getElementById('guru-profil-email').value   = d.email   || '';
        document.getElementById('guru-profil-telepon').value = d.no_telepon || '';
        document.getElementById('guru-profil-alamat').value  = d.alamat  || '';

        // Tags mapel
        const mapelContainer = document.getElementById('guru-profil-mapel-tags');
        if (mapelContainer) {
            if (d.mata_pelajaran && d.mata_pelajaran.length > 0) {
                mapelContainer.innerHTML = d.mata_pelajaran
                    .map(m => `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">${m}</span>`)
                    .join('');
            } else {
                mapelContainer.innerHTML = '<span class="text-xs text-slate-400 italic">Belum ditentukan</span>';
            }
        }

        // Tags kelas
        const kelasContainer = document.getElementById('guru-profil-kelas-tags');
        if (kelasContainer) {
            if (d.kelas_ampuan && d.kelas_ampuan.length > 0) {
                kelasContainer.innerHTML = d.kelas_ampuan
                    .map(k => `<span class="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">${k}</span>`)
                    .join('');
            } else {
                kelasContainer.innerHTML = '<span class="text-xs text-slate-400 italic">Belum ditentukan</span>';
            }
        }

    } catch (e) {
        console.error('Error guruProfilLoad:', e);
        showToast('Gagal memuat profil', 'error');
    }
}

async function guruProfilSave(e) {
    e.preventDefault();
    const btn          = document.getElementById('guru-profil-btn-save');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...';

    try {
        const res = await fetch(`${API_BASE}/guru/profil.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                nama:       document.getElementById('guru-profil-nama').value,
                no_telepon: document.getElementById('guru-profil-telepon').value,
                alamat:     document.getElementById('guru-profil-alamat').value,
            })
        });
        const response = await res.json();
        if (response.success) {
            showToast('✅ Profil berhasil diperbarui', 'success');
            // Update nama di sidebar
            const namaEl = document.getElementById('user-fullname');
            if (namaEl) namaEl.textContent = document.getElementById('guru-profil-nama').value;
            document.getElementById('guru-profil-nama-display').textContent = document.getElementById('guru-profil-nama').value;
        } else {
            showToast(response.error || 'Gagal menyimpan', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = originalText;
    }
}

async function guruProfilGantiPwd(e) {
    e.preventDefault();
    const oldPwd  = document.getElementById('guru-pwd-old').value;
    const newPwd  = document.getElementById('guru-pwd-new').value;
    const confPwd = document.getElementById('guru-pwd-confirm').value;

    if (newPwd !== confPwd) {
        showToast('Konfirmasi password tidak cocok', 'warning');
        return;
    }

    const btn          = document.getElementById('guru-pwd-btn');
    const originalText = btn.innerHTML;
    btn.disabled  = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...';

    try {
        const res = await fetch(`${API_BASE}/guru/profil.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                nama:         document.getElementById('guru-profil-nama').value,
                old_password: oldPwd,
                new_password: newPwd,
            })
        });
        const response = await res.json();
        if (response.success) {
            showToast('✅ Password berhasil diperbarui', 'success');
            document.getElementById('guru-profil-pwd-form').reset();
        } else {
            showToast(response.error || 'Gagal mengganti password', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = originalText;
    }
}

async function guruProfilUploadFoto(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto maksimal 2MB', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'guru_profil');

    try {
        const res = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + appState.token },
            body: formData
        });
        const response = await res.json();
        if (response.success && response.url) {
            document.getElementById('guru-profil-foto').src = response.url;
            document.getElementById('user-avatar').src      = response.url;
            showToast('✅ Foto profil diperbarui', 'success');
        } else {
            showToast(response.message || 'Gagal upload foto', 'error');
        }
    } catch (e) {
        showToast('Gagal upload foto', 'error');
    }
}

