/**
 * js/admin/pengumuman.js
 */

let adminPengumumanCurrentPage = 1;
let isAdminPengumumanHtmlLoaded = false;

async function showAdminPengumumanPage() {
    if (!isAdminPengumumanHtmlLoaded) {
        try {
            const res = await fetch('pages/admin/pengumuman.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('admin-pengumuman-page-container').innerHTML = html;
            isAdminPengumumanHtmlLoaded = true;
        } catch(e) {
            console.error('Failed to load HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-admin-pengumuman');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    adminPengumumanLoadList(1);
}

async function adminPengumumanLoadList(page = 1) {
    adminPengumumanCurrentPage = page;
    const kategori = document.getElementById('admin-pengumuman-kategori').value;
    const status = document.getElementById('admin-pengumuman-status').value;
    const tbody = document.getElementById('admin-pengumuman-tbody');
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-500 mb-2"></i><br>Memuat data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/pengumuman/list.php?kategori=${encodeURIComponent(kategori)}&status=${status}&limit=10&offset=${(page-1)*10}`, {
            headers: authHeaders()
        });
        const response = await res.json();
        
        if (response.success) {
            const data = response.data;
            tbody.innerHTML = '';
            
            if (data.items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400">Tidak ada pengumuman</td></tr>';
            } else {
                data.items.forEach(p => {
                    let statusBadge = '';
                    if(p.status === 'Published') statusBadge = '<span class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Published</span>';
                    else if(p.status === 'Draft') statusBadge = '<span class="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">Draft</span>';
                    else statusBadge = '<span class="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">Archived</span>';
                    
                    const row = document.createElement('tr');
                    row.className = "hover:bg-slate-50 transition-colors group";
                    row.innerHTML = `
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="font-bold text-slate-800 text-sm line-clamp-1">${p.judul}</div>
                            <div class="text-xs text-blue-600 font-medium mt-1">${p.kategori}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-sm text-slate-600">
                            ${p.penulis_nama}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-center">
                            ${statusBadge}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-center text-sm font-bold text-slate-700">
                            ${p.read_count} <span class="text-xs text-slate-400 font-normal">Wali</span>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-sm text-slate-500">
                            ${formatDateID(p.created_at)}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-right admin-only">
                            <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="adminPengumumanEdit(${p.id})" class="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition shadow-sm" title="Edit">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button onclick="adminPengumumanDelete(${p.id}, '${p.judul}')" class="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition shadow-sm" title="Hapus">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
            adminPengumumanRenderPagination(data.total, data.limit, page);
            
            if (appState.currentRole !== 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
            }
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch (e) {
        showToast('Gagal memuat daftar pengumuman', 'error');
    }
}

function adminPengumumanRenderPagination(total, limit, current) {
    const totalPages = Math.ceil(total / limit) || 1;
    const container = document.getElementById('admin-pengumuman-pagination');
    const info = document.getElementById('admin-pengumuman-page-info');
    
    let start = (current - 1) * limit + 1;
    let end = Math.min(current * limit, total);
    if (total === 0) { start = 0; end = 0; }
    info.textContent = `Menampilkan ${start}-${end} dari ${total} pengumuman`;
    
    container.innerHTML = '';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1.5 rounded-lg text-sm font-bold border transition ${current === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    if(current > 1) prevBtn.onclick = () => adminPengumumanLoadList(current - 1);
    container.appendChild(prevBtn);
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
            const btn = document.createElement('button');
            btn.className = `w-8 h-8 rounded-lg text-sm font-bold transition ${i === current ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`;
            btn.textContent = i;
            if(i !== current) btn.onclick = () => adminPengumumanLoadList(i);
            container.appendChild(btn);
        } else if (i === current - 2 || i === current + 2) {
            const dots = document.createElement('span');
            dots.className = 'w-8 h-8 flex items-center justify-center text-slate-400';
            dots.textContent = '...';
            container.appendChild(dots);
        }
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1.5 rounded-lg text-sm font-bold border transition ${current === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    if(current < totalPages) nextBtn.onclick = () => adminPengumumanLoadList(current + 1);
    container.appendChild(nextBtn);
}

function adminPengumumanOpenAddModal() {
    document.getElementById('admin-pengumuman-form').reset();
    document.getElementById('pengumuman_id').value = 0;
    document.getElementById('pengumuman_konten').innerHTML = '';
    document.getElementById('admin-pengumuman-modal-title').textContent = 'Buat Pengumuman Baru';
    document.getElementById('pengumuman_attachment_preview').innerHTML = '';
    document.getElementById('pengumuman_attachment_preview').classList.add('hidden');
    document.getElementById('modal-admin-pengumuman-form').classList.remove('hidden');
}

function adminPengumumanCloseModal() {
    document.getElementById('modal-admin-pengumuman-form').classList.add('hidden');
}

async function adminPengumumanEdit(id) {
    try {
        const res = await fetch(`${API_BASE}/admin/pengumuman/detail.php?id=${id}`, { headers: authHeaders() });
        const response = await res.json();
        
        if (response.success) {
            const p = response.data;
            document.getElementById('pengumuman_id').value = p.id;
            document.getElementById('admin-pengumuman-modal-title').textContent = 'Edit Pengumuman';
            
            document.getElementById('pengumuman_judul').value = p.judul;
            document.getElementById('pengumuman_kategori').value = p.kategori;
            document.getElementById('pengumuman_status').value = p.status;
            document.getElementById('pengumuman_konten').innerHTML = p.konten;
            
            const preview = document.getElementById('pengumuman_attachment_preview');
            if (p.attachment) {
                preview.innerHTML = `<a href="${p.attachment}" target="_blank" class="hover:underline"><i class="fa-solid fa-paperclip"></i> Lihat Lampiran Saat Ini</a>`;
                preview.classList.remove('hidden');
            } else {
                preview.innerHTML = '';
                preview.classList.add('hidden');
            }
            
            document.getElementById('modal-admin-pengumuman-form').classList.remove('hidden');
        }
    } catch (e) {
        showToast('Gagal memuat data', 'error');
    }
}

async function adminPengumumanSave(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('pengumuman_id').value);
    const konten = document.getElementById('pengumuman_konten').innerHTML;
    
    if (konten.trim() === '') {
        showToast('Isi pengumuman tidak boleh kosong', 'error');
        return;
    }
    
    const form = document.getElementById('admin-pengumuman-form');
    const formData = new FormData(form);
    formData.append('konten', konten); // manually append contenteditable HTML
    if (id > 0) formData.append('id', id);
    
    const url = id === 0 ? `${API_BASE}/admin/pengumuman/create.php` : `${API_BASE}/admin/pengumuman/update.php`;
    const btn = document.getElementById('admin-pengumuman-btn-save');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...';
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + appState.token },
            body: formData
        });
        const response = await res.json();
        
        if (response.success) {
            showToast(response.message, 'success');
            adminPengumumanCloseModal();
            adminPengumumanLoadList(adminPengumumanCurrentPage);
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch(e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Simpan & Publikasi';
    }
}

async function adminPengumumanDelete(id, judul) {
    if(confirm(`Hapus pengumuman "${judul}" secara permanen?`)) {
        try {
            const res = await fetch(`${API_BASE}/admin/pengumuman/delete.php?id=${id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            const response = await res.json();
            if(response.success) {
                showToast(response.message, 'success');
                adminPengumumanLoadList(adminPengumumanCurrentPage);
            } else {
                showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
            }
        } catch(e) {
            showToast('Terjadi kesalahan', 'error');
        }
    }
}

function formatDateID(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}


