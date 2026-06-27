/**
 * js/parent/dashboard.js
 */

let isParentDashboardLoaded = false;
let parentDashboardData = null;

async function showParentDashboardPage() {
    if (!isParentDashboardLoaded) {
        try {
            const res = await fetch('pages/parent/dashboard.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('parent-portal-page-container').innerHTML = html;
            isParentDashboardLoaded = true;
        } catch(e) {
            console.error('Failed to load dashboard HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-parent-portal');
    if (page) page.classList.remove('hidden');

    loadParentDashboardData();
}

async function loadParentDashboardData(idSiswa = 0) {
    try {
        let url = `${API_BASE}/parent/dashboard.php`;
        if (idSiswa > 0) url += `?id_siswa=${idSiswa}`;

        const res = await fetch(url, { headers: authHeaders() });
        const json = await res.json();

        if (json.success) {
            parentDashboardData = json.data;
            renderParentDashboard(parentDashboardData);
        } else {
            showToast(json.message || 'Gagal memuat dashboard', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Terjadi kesalahan jaringan', 'error');
    }
}

function renderParentDashboard(data) {
    // 1. Greeting
    document.getElementById('dash-parent-name').textContent = data.wali.nama;

    // 2. Anak selector
    const sel = document.getElementById('dash-child-selector');
    sel.innerHTML = '';
    data.list_siswa.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nama;
        opt.className = 'text-slate-800 font-bold text-sm';
        if (parseInt(s.id) === parseInt(data.siswa_aktif.id)) {
            opt.selected = true;
        }
        sel.appendChild(opt);
    });

    if (!data.siswa_aktif) {
        sel.innerHTML = '<option disabled selected>Belum ada anak terverifikasi</option>';
        document.getElementById('dash-child-avatar').src = `https://ui-avatars.com/api/?name=Belum+Terverifikasi&background=random`;
        document.getElementById('dash-child-kelas').textContent = `NISN: - • Kelas: -`;
        document.getElementById('dash-stat-nilai').textContent = '0';
        document.getElementById('dash-stat-hadir').textContent = '0';
        document.getElementById('dash-stat-tunggakan').textContent = 'Rp 0';
        document.getElementById('dash-stat-pesan').textContent = data.stats.pesan_baru || '0';
    } else {
        document.getElementById('dash-child-avatar').src = data.siswa_aktif.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.siswa_aktif.nama)}&background=random`;
        document.getElementById('dash-child-kelas').textContent = `NISN: ${data.siswa_aktif.nisn} • Kelas: ${data.siswa_aktif.kelas}`;

        // 3. Stats
        document.getElementById('dash-stat-nilai').textContent = data.stats.rata_nilai;
        document.getElementById('dash-stat-hadir').textContent = data.stats.persentase_kehadiran;
        
        const fmtUang = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.stats.tunggakan_spp);
        document.getElementById('dash-stat-tunggakan').textContent = fmtUang;
        
        document.getElementById('dash-stat-pesan').textContent = data.stats.pesan_baru;
    }

    // 4. Notifikasi Terkini
    const notifContainer = document.getElementById('dash-notif-container');
    notifContainer.innerHTML = '';

    if (data.notifikasi_terbaru.length === 0) {
        notifContainer.innerHTML = '<div class="text-center py-10 text-slate-500 text-xs">Belum ada notifikasi baru</div>';
    } else {
        data.notifikasi_terbaru.forEach(n => {
            const dateStr = new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            
            let icon = 'fa-info-circle';
            let color = 'text-blue-500';
            let bg = 'bg-blue-50';
            
            if (n.tipe === 'warning') { icon = 'fa-triangle-exclamation'; color = 'text-amber-500'; bg = 'bg-amber-50'; }
            else if (n.tipe === 'error') { icon = 'fa-circle-xmark'; color = 'text-rose-500'; bg = 'bg-rose-50'; }
            else if (n.tipe === 'success') { icon = 'fa-circle-check'; color = 'text-emerald-500'; bg = 'bg-emerald-50'; }

            const div = document.createElement('div');
            div.className = 'p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start';
            div.innerHTML = `
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg} ${color}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-800 text-sm mb-1">${n.judul}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed">${n.pesan}</p>
                    <span class="text-[10px] text-slate-400 mt-2 block">${dateStr}</span>
                </div>
            `;
            notifContainer.appendChild(div);
        });
    }
}

function switchDashboardChild(id) {
    loadParentDashboardData(id);
}

