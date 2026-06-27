/**
 * js/admin/keuangan.js
 */

let isAdminKeuanganHtmlLoaded = false;
let adminKeuanganCurrentFilter = '';
let adminKeuanganVerifyId = null;

async function showAdminKeuanganPage() {
    if (!isAdminKeuanganHtmlLoaded) {
        try {
            const res = await fetch('pages/admin/keuangan.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('admin-keuangan-page-container').innerHTML = html;
            isAdminKeuanganHtmlLoaded = true;

            // Bind search enter
            const sInp = document.getElementById('adm-keu-search');
            if (sInp) {
                sInp.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') adminKeuanganLoadList();
                });
            }
        } catch(e) {
            console.error('Failed to load HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-admin-keuangan');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    adminKeuanganLoadList();
}

function adminKeuanganFilter(status) {
    adminKeuanganCurrentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === status) {
            btn.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-slate-800 text-white filter-btn";
        } else {
            btn.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 filter-btn";
        }
    });
    adminKeuanganLoadList();
}

async function adminKeuanganLoadList() {
    const tbody = document.getElementById('adm-keu-tbody');
    if(!tbody) return;
    
    const search = document.getElementById('adm-keu-search')?.value || '';
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl mb-2"></i><br>Memuat data...</td></tr>';
    
    try {
        let url = `${API_BASE}/admin/keuangan/list.php?search=${encodeURIComponent(search)}`;
        if (adminKeuanganCurrentFilter) {
            // Jika filter Overdue, tapi backend expects exact match
            // Handle multiple filter like 'Belum bayar,Overdue' is not supported directly in API if it uses exact =.
            // Oh wait, in API we only check exact =. Let's just pass exact, and in UI handle tunggakan later.
            // For now, if currentFilter has comma, just send empty and filter in frontend, OR backend only supports exact.
            if (!adminKeuanganCurrentFilter.includes(',')) {
                url += `&status=${encodeURIComponent(adminKeuanganCurrentFilter)}`;
            }
        }

        const res = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            let list = data.data;

            // Apply frontend filter if multiple statuses
            if (adminKeuanganCurrentFilter && adminKeuanganCurrentFilter.includes(',')) {
                const statuses = adminKeuanganCurrentFilter.split(',');
                list = list.filter(item => statuses.includes(item.status));
            }

            // Update stats
            if (data.stats) {
                document.getElementById('adm-keu-total-pendapatan').textContent = formatRupiah(data.stats.total_pendapatan);
                document.getElementById('adm-keu-menunggu').textContent = data.stats.menunggu_konfirmasi;
                document.getElementById('adm-keu-total-tunggakan').textContent = formatRupiah(data.stats.total_tunggakan);
            }

            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400"><i class="fa-solid fa-inbox text-3xl mb-3 text-slate-300"></i><br>Tidak ada data tagihan</td></tr>';
                return;
            }

            tbody.innerHTML = list.map(p => {
                let actionBtn = '';
                if (p.status === 'Menunggu Konfirmasi') {
                    actionBtn = `<button onclick="adminKeuanganOpenVerifyModal(${p.id})" class="text-amber-600 hover:text-amber-800 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded-lg transition-colors border border-amber-100"><i class="fa-solid fa-magnifying-glass"></i> Cek Bukti</button>`;
                } else if (p.status === 'Belum bayar' || p.status === 'Overdue') {
                    actionBtn = `<button onclick="adminKeuanganRemind(${p.id})" class="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100"><i class="fa-solid fa-bell"></i> Ingatkan</button>`;
                } else {
                    actionBtn = `<span class="text-xs text-slate-400 font-medium italic"><i class="fa-solid fa-check"></i> Selesai</span>`;
                }

                // escape for json injecting
                const jStr = encodeURIComponent(JSON.stringify(p));

                return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <p class="font-bold text-slate-800 text-sm">${p.nama_siswa}</p>
                        <p class="text-xs text-slate-500">${p.kelas || '-'} | ${p.nisn || '-'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-bold text-slate-700 text-sm">${p.tipe_pembayaran}</p>
                        <p class="text-3xs text-slate-400">Tempo: ${formatDateIDLocal(p.tgl_jatuh_tempo)}</p>
                    </td>
                    <td class="px-6 py-4 font-black text-slate-800">${formatRupiah(p.jumlah)}</td>
                    <td class="px-6 py-4" id="adm-row-status-${p.id}">${getPaymentStatusBadge(p.status)}</td>
                    <td class="px-6 py-4 text-center">
                        ${actionBtn}
                        <span class="hidden" id="adm-row-data-${p.id}">${jStr}</span>
                    </td>
                </tr>`;
            }).join('');
        }
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Gagal memuat data</td></tr>';
    }
}

// ======== BUAT TAGIHAN ========

async function adminKeuanganOpenCreateModal() {
    const sel = document.getElementById('inp-keu-siswa');
    sel.innerHTML = '<option value="">Memuat data siswa...</option>';
    document.getElementById('form-adm-keu-create').reset();
    
    const modal = document.getElementById('modal-adm-keu-create');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.firstElementChild.classList.remove('scale-95'); }, 10);

    // Fetch siswa list
    try {
        const res = await fetch(`${API_BASE}/admin/siswa.php`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            sel.innerHTML = '<option value="">-- Pilih Siswa --</option>' + data.data.map(s => `<option value="${s.id}">${s.nama} (${s.kelas})</option>`).join('');
        }
    } catch(e) {
        sel.innerHTML = '<option value="">Gagal memuat siswa</option>';
    }
}

function adminKeuanganCloseCreateModal() {
    const modal = document.getElementById('modal-adm-keu-create');
    modal.classList.add('opacity-0');
    modal.firstElementChild.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

async function adminKeuanganSubmitCreate(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-keu');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...';

    const payload = {
        id_siswa: document.getElementById('inp-keu-siswa').value,
        tipe_pembayaran: document.getElementById('inp-keu-tipe').value,
        jumlah: document.getElementById('inp-keu-jumlah').value,
        tgl_jatuh_tempo: document.getElementById('inp-keu-tempo').value,
        catatan: document.getElementById('inp-keu-catatan').value
    };

    try {
        const res = await fetch(`${API_BASE}/admin/keuangan/create.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ ' + data.message, 'success');
            adminKeuanganCloseCreateModal();
            adminKeuanganLoadList();
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch(e) {
        showToast('⚠ Gagal terhubung', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ======== VERIFY BUKTI ========

function adminKeuanganOpenVerifyModal(id) {
    adminKeuanganVerifyId = id;
    const raw = document.getElementById(`adm-row-data-${id}`)?.textContent;
    if(!raw) return;
    const p = JSON.parse(decodeURIComponent(raw));

    document.getElementById('verif-siswa').textContent = p.nama_siswa;
    document.getElementById('verif-tipe').textContent = p.tipe_pembayaran;
    document.getElementById('verif-jumlah').textContent = formatRupiah(p.jumlah);
    document.getElementById('verif-catatan').textContent = p.catatan || '-';
    
    // Hide inputs
    const boxTolak = document.getElementById('box-tolak');
    boxTolak.classList.add('hidden');
    document.getElementById('inp-verif-alasan').value = '';

    // Show image/pdf
    const imgEl = document.getElementById('verif-img');
    const pdfEl = document.getElementById('verif-pdf');
    const emptyEl = document.getElementById('verif-empty');

    imgEl.classList.add('hidden');
    pdfEl.classList.add('hidden');
    emptyEl.classList.add('hidden');
    imgEl.src = '';
    pdfEl.src = '';

    if (p.bukti_file) {
        const fullUrl = p.bukti_file.startsWith('http') ? p.bukti_file : (API_BASE.replace('/api', '/') + p.bukti_file);
        if (fullUrl.toLowerCase().endsWith('.pdf')) {
            pdfEl.src = fullUrl;
            pdfEl.classList.remove('hidden');
        } else {
            imgEl.src = fullUrl;
            imgEl.classList.remove('hidden');
        }
    } else {
        emptyEl.classList.remove('hidden');
    }

    const modal = document.getElementById('modal-adm-keu-verify');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.firstElementChild.classList.remove('scale-95'); }, 10);
}

function adminKeuanganCloseVerifyModal() {
    const modal = document.getElementById('modal-adm-keu-verify');
    modal.classList.add('opacity-0');
    modal.firstElementChild.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

async function adminKeuanganProcessVerify(action) {
    if (!adminKeuanganVerifyId) return;

    let alasan = '';
    const boxTolak = document.getElementById('box-tolak');
    
    if (action === 'reject') {
        if (boxTolak.classList.contains('hidden')) {
            boxTolak.classList.remove('hidden');
            document.getElementById('inp-verif-alasan').focus();
            showToast('Silakan isi alasan penolakan sebelum menolak', 'warning');
            return;
        }
        alasan = document.getElementById('inp-verif-alasan').value.trim();
        if (!alasan) {
            showToast('Alasan penolakan wajib diisi', 'warning');
            return;
        }
    }

    const btn = action === 'approve' ? document.getElementById('btn-verif-approve') : document.getElementById('btn-verif-reject');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Proses...';

    try {
        const res = await fetch(`${API_BASE}/admin/keuangan/verify.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ id: adminKeuanganVerifyId, action: action, alasan: alasan })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ ' + data.message, 'success');
            adminKeuanganCloseVerifyModal();
            adminKeuanganLoadList();
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch(e) {
        showToast('⚠ Gagal terhubung', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ======== REMINDER ========

async function adminKeuanganRemind(id) {
    try {
        const res = await fetch(`${API_BASE}/admin/keuangan/remind.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('🔔 ' + data.message, 'success');
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch(e) {
        showToast('⚠ Gagal mengirim reminder', 'error');
    }
}

