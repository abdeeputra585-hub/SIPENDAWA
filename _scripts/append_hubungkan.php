<?php
$js = <<<JS

// ======== HUBUNGKAN WALI ========
async function openHubungkanWaliModal(siswaId, siswaNama) {
    document.getElementById('hubungkan-siswa-nama').textContent = siswaNama;
    document.getElementById('hubungkan-siswa-id').value = siswaId;
    document.getElementById('modal-hubungkan-wali').classList.remove('hidden');
    const select = document.getElementById('hubungkan-wali-select');
    select.innerHTML = '<option value="">Memuat wali...</option>';
    try {
        const res = await fetch(`\${API_BASE}/wali.php`, { headers: { 'Authorization': `Bearer \${appState.token}` } });
        const data = await res.json();
        if (data.success) {
            select.innerHTML = '<option value="">-- Pilih Wali --</option>';
            data.data.forEach(w => {
                select.innerHTML += `<option value="\${w.id}">\${w.nama} (\${w.email})</option>`;
            });
        }
    } catch (e) {
        select.innerHTML = '<option value="">Gagal memuat</option>';
    }
}

function closeHubungkanWaliModal() {
    document.getElementById('modal-hubungkan-wali').classList.add('hidden');
    document.getElementById('hubungkan-form').reset();
}

async function submitHubungkanWali(event) {
    if(event) event.preventDefault();
    const siswa_id = document.getElementById('hubungkan-siswa-id').value;
    const wali_id = document.getElementById('hubungkan-wali-select').value;
    const tipe = document.querySelector('input[name="hubungkan-tipe"]:checked').value;
    if (!wali_id) return showToast('Pilih wali terlebih dahulu', 'error');
    
    const btn = document.getElementById('hubungkan-submit-btn');
    const loading = document.getElementById('hubungkan-loading');
    btn.disabled = true;
    loading.classList.remove('hidden');
    
    try {
        const res = await fetch(`\${API_BASE}/relasi.php`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer \${appState.token}`
            },
            body: JSON.stringify({ siswa_id, wali_id, tipe })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ ' + data.message);
            closeHubungkanWaliModal();
            if (typeof loadSiswaData === 'function') loadSiswaData();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Gagal terhubung ke server', 'error');
    } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
    }
}
JS;

file_put_contents('c:/laragon/www/uts_pemograman/script.js', $js, FILE_APPEND);
