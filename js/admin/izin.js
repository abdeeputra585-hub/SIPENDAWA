/**
 * js/admin/izin.js
 */

let adminIzinCurrentTab = 'pending';
let adminIzinHistoryPage = 1;
let isAdminIzinHtmlLoaded = false;
let pendingIzinList = [];

async function showAdminIzinPage() {
    if (!isAdminIzinHtmlLoaded) {
        try {
            const res = await fetch('pages/admin/izin.html?v=2?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('admin-izin-page-container').innerHTML = html;
            isAdminIzinHtmlLoaded = true;
        } catch(e) {
            console.error('Failed to load HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-admin-izin');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    adminIzinShowTab('pending');
}

function adminIzinShowTab(tab) {
    adminIzinCurrentTab = tab;
    document.getElementById('tab-izin-pending').className = tab === 'pending' 
        ? "px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm transition"
        : "px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition shadow-sm";
        
    document.getElementById('tab-izin-history').className = tab === 'history' 
        ? "px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm transition"
        : "px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition shadow-sm";

    if (tab === 'pending') {
        document.getElementById('admin-izin-pending-view').classList.remove('hidden');
        document.getElementById('admin-izin-history-view').classList.add('hidden');
        adminIzinLoadPending();
    } else {
        document.getElementById('admin-izin-pending-view').classList.add('hidden');
        document.getElementById('admin-izin-history-view').classList.remove('hidden');
        adminIzinLoadHistory(1);
    }
}

async function adminIzinLoadPending() {
    const tbody = document.getElementById('admin-izin-pending-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-500 mb-2"></i><br>Memuat antrean...</td></tr>';
    
    document.getElementById('izin-check-all').checked = false;
    document.getElementById('izin-selected-count').textContent = '0 Terpilih';
    
    try {
        const res = await fetch(`${API_BASE}/admin/izin/pending.php`, { headers: authHeaders() });
        const response = await res.json();
        
        // Sembunyikan bulk action jika bukan admin
        const bulkActionBar = document.querySelector('#admin-izin-pending-view .bg-white.p-4.rounded-2xl');
        if (appState.currentRole !== 'admin' && bulkActionBar) {
            bulkActionBar.classList.add('hidden');
        }
        
        if (response.success) {
            pendingIzinList = response.data;
            tbody.innerHTML = '';
            
            if (pendingIzinList.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-16 text-slate-400 bg-white"><div class="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl"><i class="fa-solid fa-check-double"></i></div><p class="font-bold">Semua Bersih!</p><p class="text-xs mt-1">Tidak ada pengajuan izin yang tertunda.</p></td></tr>';
            } else {
                pendingIzinList.forEach(p => {
                    const tglMulai = formatDateIDLocal(p.tgl_mulai);
                    const tglSelesai = formatDateIDLocal(p.tgl_selesai);
                    const rangeTgl = p.tgl_mulai === p.tgl_selesai ? tglMulai : `${tglMulai} - ${tglSelesai}`;
                    
                    let catColor = 'bg-slate-100 text-slate-600';
                    if (p.tipe_izin === 'Sakit') catColor = 'bg-red-50 text-red-600 border-red-100';
                    else if (p.tipe_izin === 'Izin') catColor = 'bg-blue-50 text-blue-600 border-blue-100';
                    else catColor = 'bg-purple-50 text-purple-600 border-purple-100';
                    
                    let btnBukti = '-';
                    if (p.bukti_file) {
                        btnBukti = `<button onclick="adminIzinShowBukti('${p.bukti_file}')" class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"><i class="fa-solid fa-file-invoice"></i> Lihat Bukti</button>`;
                    }

                    const isAdmin = appState.currentRole === 'admin';
                    const checkboxHtml = isAdmin 
                        ? `<input type="checkbox" value="${p.id}" onchange="adminIzinUpdateSelection()" class="izin-checkbox w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer">`
                        : `<i class="fa-solid fa-lock text-slate-300" title="Hanya Admin yang dapat memproses"></i>`;
                        
                    const actionHtml = isAdmin
                        ? `<button onclick="adminIzinOpenSingleAction(${p.id}, 'Approved')" class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition shadow-sm" title="Setujui"><i class="fa-solid fa-check"></i></button>
                           <button onclick="adminIzinOpenSingleAction(${p.id}, 'Rejected')" class="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition shadow-sm" title="Tolak"><i class="fa-solid fa-xmark"></i></button>`
                        : `<span class="text-xs text-slate-400 italic">Hanya Baca</span>`;

                    const row = document.createElement('tr');
                    row.className = "hover:bg-slate-50 transition-colors";
                    row.innerHTML = `
                        <td class="px-4 py-4 border-b border-slate-100 text-center">
                            ${checkboxHtml}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="font-bold text-slate-800 text-sm">${p.nama_siswa}</div>
                            <div class="text-xs text-slate-400 mt-0.5">Wali: ${p.nama_wali}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="inline-flex px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded border ${catColor} mb-1">${p.tipe_izin}</div>
                            <div class="text-xs text-slate-600 font-medium whitespace-nowrap"><i class="fa-regular fa-calendar mr-1"></i> ${rangeTgl}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="text-sm text-slate-600 line-clamp-2 max-w-xs whitespace-normal">${p.alasan}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-center">
                            ${btnBukti}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-right space-x-2">
                            ${actionHtml}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }
    } catch(e) {
        showToast('Gagal memuat antrean', 'error');
    }
}

function adminIzinToggleAll() {
    const isChecked = document.getElementById('izin-check-all').checked;
    const checkboxes = document.querySelectorAll('.izin-checkbox');
    checkboxes.forEach(cb => cb.checked = isChecked);
    adminIzinUpdateSelection();
}

function adminIzinUpdateSelection() {
    const checkboxes = document.querySelectorAll('.izin-checkbox:checked');
    document.getElementById('izin-selected-count').textContent = `${checkboxes.length} Terpilih`;
}

function getSelectedIzinIds() {
    const checkboxes = document.querySelectorAll('.izin-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function adminIzinOpenBulkModal(type) {
    const ids = getSelectedIzinIds();
    if (ids.length === 0) {
        showToast('Silakan pilih minimal satu pengajuan', 'warning');
        return;
    }
    
    document.getElementById('admin_izin_action_ids').value = ids.join(',');
    document.getElementById('admin_izin_action_type').value = type;
    document.getElementById('admin_izin_action_catatan').value = '';
    
    const info = document.getElementById('admin-izin-action-info');
    const btn = document.getElementById('admin-izin-btn-submit');
    const req = document.getElementById('admin_izin_action_req');
    
    if (type === 'Approved') {
        document.getElementById('admin-izin-modal-title').textContent = 'Setujui Pengajuan';
        info.className = 'mb-4 text-sm font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100';
        info.innerHTML = `<i class="fa-solid fa-check-circle mr-2"></i> Anda akan menyetujui ${ids.length} pengajuan izin.`;
        btn.className = 'px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition';
        req.classList.add('hidden');
        document.getElementById('admin_izin_action_catatan').required = false;
    } else {
        document.getElementById('admin-izin-modal-title').textContent = 'Tolak Pengajuan';
        info.className = 'mb-4 text-sm font-bold text-red-800 bg-red-50 p-3 rounded-xl border border-red-100';
        info.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i> Anda akan MENOLAK ${ids.length} pengajuan izin.`;
        btn.className = 'px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition';
        req.classList.remove('hidden');
        document.getElementById('admin_izin_action_catatan').required = true;
    }
    
    document.getElementById('modal-admin-izin-action').classList.remove('hidden');
}

function adminIzinOpenSingleAction(id, type) {
    document.getElementById('izin-check-all').checked = false;
    const checkboxes = document.querySelectorAll('.izin-checkbox');
    checkboxes.forEach(cb => { cb.checked = (cb.value == id); });
    adminIzinUpdateSelection();
    adminIzinOpenBulkModal(type);
}

function adminIzinCloseActionModal() {
    document.getElementById('modal-admin-izin-action').classList.add('hidden');
}

async function adminIzinSubmitAction(e) {
    e.preventDefault();
    const type = document.getElementById('admin_izin_action_type').value;
    const ids = document.getElementById('admin_izin_action_ids').value.split(',');
    const catatan = document.getElementById('admin_izin_action_catatan').value;
    
    const btn = document.getElementById('admin-izin-btn-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...';
    
    const url = type === 'Approved' ? '/admin/izin/approve.php' : '/admin/izin/reject.php';
    
    try {
        const res = await fetch(API_BASE + url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + appState.token
            },
            body: JSON.stringify({ ids, catatan })
        });
        const response = await res.json();
        if (response.success) {
            showToast(response.message, 'success');
            adminIzinCloseActionModal();
            adminIzinLoadPending();
        } else {
            showToast(response.error, 'error');
        }
    } catch(e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function adminIzinLoadHistory(page = 1) {
    adminIzinHistoryPage = page;
    const tbody = document.getElementById('admin-izin-history-tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-500 mb-2"></i><br>Memuat riwayat...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/izin/history.php?limit=10&offset=${(page-1)*10}`, { headers: authHeaders() });
        const response = await res.json();
        
        if (response.success) {
            const data = response.data;
            tbody.innerHTML = '';
            
            if (data.items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-400">Belum ada riwayat</td></tr>';
            } else {
                data.items.forEach(p => {
                    const rangeTgl = p.tgl_mulai === p.tgl_selesai ? formatDateIDLocal(p.tgl_mulai) : `${formatDateIDLocal(p.tgl_mulai)} - ${formatDateIDLocal(p.tgl_selesai)}`;
                    
                    let statusBadge = '';
                    if(p.status === 'Approved') statusBadge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">Disetujui</span>';
                    else statusBadge = '<span class="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200">Ditolak</span>';
                    
                    let catColor = 'bg-slate-100 text-slate-600';
                    if (p.tipe_izin === 'Sakit') catColor = 'bg-red-50 text-red-600 border-red-100';
                    else if (p.tipe_izin === 'Izin') catColor = 'bg-blue-50 text-blue-600 border-blue-100';
                    else catColor = 'bg-purple-50 text-purple-600 border-purple-100';

                    const row = document.createElement('tr');
                    row.className = "hover:bg-slate-50 transition-colors";
                    row.innerHTML = `
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="font-bold text-slate-800 text-sm">${p.nama_siswa}</div>
                            <div class="text-xs text-slate-400 mt-0.5">Wali: ${p.nama_wali}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="inline-flex px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded border ${catColor} mb-1">${p.tipe_izin}</div>
                            <div class="text-xs text-slate-600 font-medium whitespace-nowrap"><i class="fa-regular fa-calendar mr-1"></i> ${rangeTgl}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-center">
                            ${statusBadge}
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100">
                            <div class="text-sm font-bold text-slate-700">${p.nama_approver}</div>
                            <div class="text-xs text-slate-500">${formatDateOnly(p.updated_at)}</div>
                        </td>
                        <td class="px-6 py-4 border-b border-slate-100 text-right">
                            <button onclick="adminIzinViewDetail(${p.id})" class="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                                Detail
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
            adminIzinRenderPagination(data.total, data.limit, page);
        }
    } catch(e) {
        showToast('Gagal memuat riwayat', 'error');
    }
}

function adminIzinRenderPagination(total, limit, current) {
    const totalPages = Math.ceil(total / limit) || 1;
    const container = document.getElementById('admin-izin-pagination');
    const info = document.getElementById('admin-izin-page-info');
    
    let start = (current - 1) * limit + 1;
    let end = Math.min(current * limit, total);
    if (total === 0) { start = 0; end = 0; }
    info.textContent = `Menampilkan ${start}-${end} dari ${total} data`;
    
    container.innerHTML = '';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1.5 rounded-lg text-sm font-bold border transition ${current === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`;
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    if(current > 1) prevBtn.onclick = () => adminIzinLoadHistory(current - 1);
    container.appendChild(prevBtn);
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
            const btn = document.createElement('button');
            btn.className = `w-8 h-8 rounded-lg text-sm font-bold transition ${i === current ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`;
            btn.textContent = i;
            if(i !== current) btn.onclick = () => adminIzinLoadHistory(i);
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
    if(current < totalPages) nextBtn.onclick = () => adminIzinLoadHistory(current + 1);
    container.appendChild(nextBtn);
}

function adminIzinShowBukti(url) {
    const content = document.getElementById('admin-izin-detail-content');
    const ext = url.split('.').pop().toLowerCase();
    
    if (['jpg','jpeg','png'].includes(ext)) {
        content.innerHTML = `<img src="${url}" class="w-full h-auto rounded-xl shadow-sm border border-slate-200">`;
    } else {
        content.innerHTML = `
            <div class="text-center py-10">
                <i class="fa-regular fa-file-pdf text-6xl text-red-500 mb-4"></i>
                <h4 class="font-bold text-slate-800 text-lg mb-2">Dokumen PDF</h4>
                <a href="${url}" target="_blank" class="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">Buka Dokumen PDF <i class="fa-solid fa-external-link ml-1"></i></a>
            </div>
        `;
    }
    document.getElementById('modal-admin-izin-detail').classList.remove('hidden');
}

function adminIzinCloseDetail() {
    document.getElementById('modal-admin-izin-detail').classList.add('hidden');
}

async function adminIzinViewDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/admin/izin/detail.php?id=${id}`, { headers: authHeaders() });
        const response = await res.json();
        
        if (response.success) {
            const p = response.data;
            const content = document.getElementById('admin-izin-history-detail-content');
            
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
                                <i class="fa-solid fa-user-check text-slate-400"></i> Oleh: <b>${p.nama_approver || '-'}</b>
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
            
            document.getElementById('modal-admin-izin-history-detail').classList.remove('hidden');
        } else {
            showToast(response.error || 'Gagal memuat detail', 'error');
        }
    } catch(e) {
        console.error("Error adminIzinViewDetail:", e);
        showToast('Gagal memuat detail', 'error');
    }
}

function adminIzinCloseHistoryDetail() {
    document.getElementById('modal-admin-izin-history-detail').classList.add('hidden');
}

function formatDateIDLocal(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}
function formatDateOnly(datetime) {
    return new Date(datetime).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

