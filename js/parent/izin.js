/**
 * js/parent/izin.js
 */

let parentIzinCurrentPage = 1;
let isParentIzinHtmlLoaded = false;

async function showParentIzinPage() {
    if (!isParentIzinHtmlLoaded) {
        try {
            const res = await fetch('pages/parent/izin.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('parent-izin-page-container').innerHTML = html;
            isParentIzinHtmlLoaded = true;
        } catch(e) {
            console.error('Failed to load HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-parent-izin');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    parentIzinLoadSiswa();
    parentIzinLoadList(1);
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('izin_mulai').min = today;
    document.getElementById('izin_mulai').value = today;
    document.getElementById('izin_selesai').min = today;
    document.getElementById('izin_selesai').value = today;
    
    document.getElementById('izin_mulai').addEventListener('change', function() {
        document.getElementById('izin_selesai').min = this.value;
        if(document.getElementById('izin_selesai').value < this.value) {
            document.getElementById('izin_selesai').value = this.value;
        }
    });
}

async function parentIzinLoadSiswa() {
    try {
        const res = await fetch(`${API_BASE}/siswa.php`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            const select = document.getElementById('izin_id_siswa');
            select.innerHTML = '<option value="">Pilih Siswa</option>';
            data.data.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.nama} (${s.nis})</option>`;
            });
        }
    } catch(e) { console.error('Error load siswa'); }
}

async function parentIzinLoadList(page = 1) {
    parentIzinCurrentPage = page;
    const tbody = document.getElementById('parent-izin-tbody');
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-500 mb-2"></i><br>Memuat riwayat pengajuan...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/izin/list.php?limit=10&offset=${(page-1)*10}`, {
            headers: authHeaders()
        });
        const response = await res.json();
        
        if (response.success) {
            const data = response.data;
            tbody.innerHTML = '';
            
            if (data.items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400">Belum ada riwayat pengajuan</td></tr>';
            } else {
                data.items.forEach(p => {
                    let statusBadge = '';
                    if(p.status === 'Pending') statusBadge = '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">Pending</span>';
                    else if(p.status === 'Approved') statusBadge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">Disetujui</span>';
                    else statusBadge = '<span class="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200">Ditolak</span>';
                    
                    const tglMulai = formatDateIDLocal(p.tgl_mulai);
                    const tglSelesai = formatDateIDLocal(p.tgl_selesai);
                    const rangeTgl = p.tgl_mulai === p.tgl_selesai ? tglMulai : `${tglMulai} s.d ${tglSelesai}`;
                    
                    const row = document.createElement('tr');
                    row.className = "hover:bg-slate-50 transition-colors";
                    row.innerHTML = `
                        <td class="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
                            ${p.nama_siswa}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-sm font-bold text-blue-600">
                            ${p.tipe_izin}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-sm text-slate-600">
                            ${rangeTgl}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-sm text-slate-500">
                            ${formatDateOnly(p.created_at)}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-center">
                            ${statusBadge}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-right">
                            <button onclick="parentIzinViewDetail(${p.id})" class="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                                Detail
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
            parentIzinRenderPagination(data.total, data.limit, page);
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch (e) {
        showToast('Gagal memuat daftar izin', 'error');
    }
}

function parentIzinRenderPagination(total, limit, current) {
    const totalPages = Math.ceil(total / limit) || 1;
    const container = document.getElementById('parent-izin-pagination');
    const info = document.getElementById('parent-izin-page-info');
    
    let start = (current - 1) * limit + 1;
    let end = Math.min(current * limit, total);
    if (total === 0) { start = 0; end = 0; }
    info.textContent = `Menampilkan ${start}-${end} dari ${total} pengajuan`;
    
    container.innerHTML = '';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1.5 rounded-lg text-sm font-bold border transition ${current === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    if(current > 1) prevBtn.onclick = () => parentIzinLoadList(current - 1);
    container.appendChild(prevBtn);
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
            const btn = document.createElement('button');
            btn.className = `w-8 h-8 rounded-lg text-sm font-bold transition ${i === current ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`;
            btn.textContent = i;
            if(i !== current) btn.onclick = () => parentIzinLoadList(i);
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
    if(current < totalPages) nextBtn.onclick = () => parentIzinLoadList(current + 1);
    container.appendChild(nextBtn);
}

function parentIzinCheckTipe() {
    const val = document.getElementById('izin_tipe').value;
    const label = document.getElementById('izin_label_wajib');
    const input = document.getElementById('izin_file');
    if (val === 'Sakit') {
        label.textContent = '* (Wajib Dokter)';
        input.required = true;
    } else {
        label.textContent = '(Opsional)';
        input.required = false;
    }
}

function parentIzinOpenAddModal() {
    document.getElementById('parent-izin-form').reset();
    parentIzinCheckTipe();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('izin_mulai').value = today;
    document.getElementById('izin_selesai').value = today;
    document.getElementById('modal-parent-izin-form').classList.remove('hidden');
}

function parentIzinCloseModal() {
    document.getElementById('modal-parent-izin-form').classList.add('hidden');
}

function parentIzinCloseDetail() {
    document.getElementById('modal-parent-izin-detail').classList.add('hidden');
}

async function parentIzinSave(e) {
    e.preventDefault();
    
    const form = document.getElementById('parent-izin-form');
    const formData = new FormData(form);
    
    const btn = document.getElementById('parent-izin-btn-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...';
    
    try {
        const res = await fetch(`${API_BASE}/izin/create.php`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + appState.token },
            body: formData
        });
        const response = await res.json();
        
        if (response.success) {
            showToast(response.message, 'success');
            parentIzinCloseModal();
            parentIzinLoadList(1);
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch(e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Pengajuan';
    }
}

async function parentIzinViewDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/izin/detail.php?id=${id}`, { headers: authHeaders() });
        const response = await res.json();
        
        if (response.success) {
            const p = response.data;
            const content = document.getElementById('parent-izin-detail-content');
            
            let statusColor = 'text-amber-500';
            let statusIcon = 'fa-clock';
            if(p.status === 'Approved') { statusColor = 'text-emerald-500'; statusIcon = 'fa-circle-check'; }
            if(p.status === 'Rejected') { statusColor = 'text-red-500'; statusIcon = 'fa-circle-xmark'; }
            
            const tglMulai = formatDateIDLocal(p.tgl_mulai);
            const tglSelesai = formatDateIDLocal(p.tgl_selesai);
            const rangeTgl = p.tgl_mulai === p.tgl_selesai ? tglMulai : `${tglMulai} - ${tglSelesai}`;
            
            let fileHtml = '<div class="text-sm text-slate-400 italic">Tidak ada lampiran</div>';
            if (p.bukti_file) {
                fileHtml = `<a href="${p.bukti_file}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition"><i class="fa-solid fa-download"></i> Unduh Lampiran Bukti</a>`;
            }
            
            let approvalHtml = '';
            if (p.status !== 'Pending') {
                approvalHtml = `
                    <div class="mt-6 pt-5 border-t border-slate-100">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catatan Persetujuan</div>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div class="text-sm text-slate-700 leading-relaxed font-medium">"${p.catatan_approval || 'Tidak ada catatan'}"</div>
                            <div class="text-xs text-slate-500 mt-2 flex items-center gap-2">
                                <i class="fa-solid fa-user-check text-slate-400"></i> Oleh: <b>${p.nama_approver}</b>
                            </div>
                        </div>
                    </div>
                `;
            }

            content.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <div class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">${p.tipe_izin}</div>
                    <div class="text-sm font-bold ${statusColor} flex items-center gap-1"><i class="fa-solid ${statusIcon}"></i> ${p.status}</div>
                </div>
                <h4 class="text-xl font-bold text-slate-900">${p.nama_siswa}</h4>
                <div class="text-sm text-slate-500 font-medium"><i class="fa-regular fa-calendar mr-1 text-slate-400"></i> ${rangeTgl}</div>
                
                <div class="mt-6">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alasan Pengajuan</div>
                    <p class="text-sm text-slate-700 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl">${p.alasan}</p>
                </div>

                <div class="mt-6">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bukti Pendukung</div>
                    ${fileHtml}
                </div>
                
                ${approvalHtml}
                
                <div class="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100 text-center">
                    Diajukan pada: ${formatDateOnly(p.created_at)}
                </div>
            `;
            
            document.getElementById('modal-parent-izin-detail').classList.remove('hidden');
        }
    } catch(e) {
        showToast('Gagal memuat detail', 'error');
    }
}

function formatDateIDLocal(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}
function formatDateOnly(datetime) {
    return new Date(datetime).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}


