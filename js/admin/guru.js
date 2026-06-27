/**
 * js/admin/guru.js
 * Logic for Admin Kelola Guru
 */

let adminGuruCurrentPage = 1;
let adminGuruSearchTimer = null;
let isAdminGuruHtmlLoaded = false;

async function showAdminGuruPage() {
    if (!isAdminGuruHtmlLoaded) {
        try {
            const res = await fetch('pages/admin/guru.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('admin-guru-page-container').innerHTML = html;
            isAdminGuruHtmlLoaded = true;
        } catch(e) {
            console.error('Failed to load guru HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-admin-guru');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    adminGuruLoadList(1);
}

async function adminGuruLoadList(page = 1) {
    adminGuruCurrentPage = page;
    const search = document.getElementById('admin-guru-search').value;
    const status = document.getElementById('admin-guru-status').value;
    const tbody = document.getElementById('admin-guru-tbody');
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-500 mb-2"></i><br>Memuat data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/guru/list.php?search=${encodeURIComponent(search)}&status=${status}&limit=20&offset=${(page-1)*20}`, {
            headers: authHeaders()
        });
        const response = await res.json();
        
        if (response.success) {
            const data = response.data;
            tbody.innerHTML = '';
            
            if (data.teachers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-400">Tidak ada data guru ditemukan</td></tr>';
            } else {
                data.teachers.forEach(g => {
                    const avatar = g.foto ? g.foto : `https://ui-avatars.com/api/?name=${encodeURIComponent(g.nama)}`;
                    const statusBadge = g.is_active 
                        ? '<span class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Aktif</span>'
                        : '<span class="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">Nonaktif</span>';
                    
                    const row = document.createElement('tr');
                    row.className = "hover:bg-slate-50 transition-colors group";
                    row.innerHTML = `
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="flex items-center gap-3">
                                <img src="${avatar}" class="w-10 h-10 rounded-full object-cover shadow-sm">
                                <div>
                                    <div class="font-bold text-slate-800">${g.nama}</div>
                                    <div class="text-xs text-slate-500">NIP. ${g.nip}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="text-sm text-slate-700"><i class="fa-regular fa-envelope w-4"></i> ${g.email}</div>
                            <div class="text-xs text-slate-500 mt-0.5"><i class="fa-solid fa-phone w-4"></i> ${g.no_telepon || '-'}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="text-sm text-slate-700 font-medium line-clamp-1 max-w-[150px]" title="${g.mata_pelajaran || '-'}">${g.mata_pelajaran || '-'}</div>
                            <div class="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[150px]" title="${g.kelas_ampuan || '-'}">Kls: ${g.kelas_ampuan || '-'}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="flex flex-col gap-1 items-start">
                                ${statusBadge}
                                <span class="text-xs text-slate-500 bg-slate-100 px-2 rounded">${g.status_pegawai}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-right">
                            <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="adminGuruResetPassword(${g.id})" class="w-8 h-8 flex items-center justify-center rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white transition shadow-sm" title="Reset Password">
                                    <i class="fa-solid fa-key"></i>
                                </button>
                                <button onclick="adminGuruEdit(${g.id})" class="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm" title="Edit Data">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                ${g.is_active ? `
                                <button onclick="adminGuruDelete(${g.id}, '${g.nama}')" class="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition shadow-sm" title="Nonaktifkan">
                                    <i class="fa-solid fa-ban"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
            
            // Render Pagination
            adminGuruRenderPagination(data.total, data.limit, adminGuruCurrentPage);
            
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Gagal memuat data', 'error');
    }
}

function adminGuruRenderPagination(total, limit, current) {
    const totalPages = Math.ceil(total / limit) || 1;
    const container = document.getElementById('admin-guru-pagination');
    const info = document.getElementById('admin-guru-page-info');
    
    let start = (current - 1) * limit + 1;
    let end = Math.min(current * limit, total);
    if (total === 0) { start = 0; end = 0; }
    info.textContent = `Menampilkan ${start}-${end} dari ${total} guru`;
    
    container.innerHTML = '';
    
    // Prev
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1.5 rounded-lg text-sm font-bold border transition ${current === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    if(current > 1) prevBtn.onclick = () => adminGuruLoadList(current - 1);
    container.appendChild(prevBtn);
    
    // Page Numbers (Simplified)
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
            const btn = document.createElement('button');
            btn.className = `w-8 h-8 rounded-lg text-sm font-bold transition ${i === current ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`;
            btn.textContent = i;
            if(i !== current) btn.onclick = () => adminGuruLoadList(i);
            container.appendChild(btn);
        } else if (i === current - 2 || i === current + 2) {
            const dots = document.createElement('span');
            dots.className = 'w-8 h-8 flex items-center justify-center text-slate-400';
            dots.textContent = '...';
            container.appendChild(dots);
        }
    }
    
    // Next
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1.5 rounded-lg text-sm font-bold border transition ${current === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    if(current < totalPages) nextBtn.onclick = () => adminGuruLoadList(current + 1);
    container.appendChild(nextBtn);
}

function adminGuruDebounceSearch() {
    clearTimeout(adminGuruSearchTimer);
    adminGuruSearchTimer = setTimeout(() => {
        adminGuruLoadList(1);
    }, 500);
}

function adminGuruOpenAddModal() {
    document.getElementById('admin-guru-form').reset();
    document.getElementById('guru_id').value = 0;
    document.getElementById('admin-guru-modal-title').textContent = 'Tambah Guru Baru';
    document.getElementById('guru_nip').disabled = false;
    document.getElementById('guru_status_container').classList.add('hidden');
    document.getElementById('guru_foto_preview').src = 'https://ui-avatars.com/api/?name=Baru';
    
    // Uncheck all checkboxes
    document.querySelectorAll('input[name="mata_pelajaran_ids[]"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="kelas_ampuan_ids[]"]').forEach(cb => cb.checked = false);
    
    document.getElementById('modal-admin-guru-form').classList.remove('hidden');
}

function adminGuruCloseModals() {
    document.getElementById('modal-admin-guru-form').classList.add('hidden');
}

function adminGuruPreviewFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('guru_foto_preview').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

async function adminGuruEdit(id) {
    try {
        const res = await fetch(`${API_BASE}/admin/guru/detail.php?id=${id}`, { headers: authHeaders() });
        const response = await res.json();
        
        if (response.success) {
            const g = response.data;
            document.getElementById('guru_id').value = g.id;
            document.getElementById('admin-guru-modal-title').textContent = 'Edit Data Guru';
            
            document.getElementById('guru_nip').value = g.nip;
            document.getElementById('guru_nip').disabled = true; // Readonly
            
            document.getElementById('guru_nama').value = g.nama;
            document.getElementById('guru_email').value = g.email;
            document.getElementById('guru_no_telepon').value = g.no_telepon || '';
            document.getElementById('guru_tanggal_lahir').value = g.tanggal_lahir || '';
            document.getElementById('guru_jenis_kelamin').value = g.jenis_kelamin || '';
            document.getElementById('guru_status_pegawai').value = g.status_pegawai;
            document.getElementById('guru_alamat').value = g.alamat || '';
            
            document.getElementById('guru_foto_preview').src = g.foto ? g.foto : `https://ui-avatars.com/api/?name=${encodeURIComponent(g.nama)}`;
            
            // Checkboxes mapel
            document.querySelectorAll('input[name="mata_pelajaran_ids[]"]').forEach(cb => {
                cb.checked = g.mata_pelajaran_ids.includes(parseInt(cb.value));
            });
            
            // Checkboxes kelas
            document.querySelectorAll('input[name="kelas_ampuan_ids[]"]').forEach(cb => {
                cb.checked = g.kelas_ampuan_ids.includes(parseInt(cb.value));
            });
            
            // Status aktif
            document.getElementById('guru_status_container').classList.remove('hidden');
            document.getElementById('guru_is_active').checked = parseInt(g.is_active) === 1;
            
            document.getElementById('modal-admin-guru-form').classList.remove('hidden');
        }
    } catch (e) {
        showToast('Gagal memuat data guru', 'error');
    }
}

async function adminGuruSave(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('guru_id').value);
    const form = document.getElementById('admin-guru-form');
    const formData = new FormData(form);
    const btn = document.getElementById('admin-guru-btn-save');
    
    // Convert multiple checkboxes to array for PHP
    const mapel = [];
    document.querySelectorAll('input[name="mata_pelajaran_ids[]"]:checked').forEach(cb => mapel.push(cb.value));
    formData.append('mata_pelajaran_ids', mapel.join(','));
    
    const kelas = [];
    document.querySelectorAll('input[name="kelas_ampuan_ids[]"]:checked').forEach(cb => kelas.push(cb.value));
    formData.append('kelas_ampuan_ids', kelas.join(','));
    
    if(!document.getElementById('guru_is_active').checked) {
        formData.append('is_active', 0);
    }
    
    if (id > 0) formData.append('id', id);
    
    const url = id === 0 ? `${API_BASE}/admin/guru/create.php` : `${API_BASE}/admin/guru/update.php`;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...';
    
    try {
        const res = await fetch(url, {
            method: 'POST', // Update juga pakai POST
            headers: { 'Authorization': 'Bearer ' + appState.token },
            body: formData
        });
        const response = await res.json();
        
        if (response.success) {
            showToast(response.message, 'success');
            adminGuruCloseModals();
            adminGuruLoadList(adminGuruCurrentPage);
            if(response.data && response.data.password_note) {
                alert(response.data.password_note);
            }
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch(e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Simpan Data';
    }
}

async function adminGuruDelete(id, nama) {
    if(confirm(`Apakah Anda yakin ingin menonaktifkan guru ${nama}? Data tidak akan dihapus permanen untuk menjaga riwayat nilai.`)) {
        try {
            const res = await fetch(`${API_BASE}/admin/guru/delete.php?id=${id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            const response = await res.json();
            if(response.success) {
                showToast(response.message, 'success');
                adminGuruLoadList(adminGuruCurrentPage);
            } else {
                showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
            }
        } catch(e) {
            showToast('Terjadi kesalahan', 'error');
        }
    }
}

async function adminGuruResetPassword(id) {
    if(confirm(`Apakah Anda yakin ingin mereset password guru ini? Password baru akan di-generate otomatis.`)) {
        try {
            const res = await fetch(`${API_BASE}/admin/guru/reset-password.php`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ id: id })
            });
            const response = await res.json();
            if(response.success) {
                showToast(response.message, 'success');
                alert(response.new_password_note);
            } else {
                showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
            }
        } catch(e) {
            showToast('Terjadi kesalahan', 'error');
        }
    }
}

function adminGuruExport() {
    showToast('Fitur export sedang dikembangkan', 'info');
}


