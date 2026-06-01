
const API_BASE = 'api';

let appState = {
    currentRole: 'admin',
    currentTab: 'admin-dashboard',
    currentUser: null
};

const navigationMenus = {
    admin: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'admin-siswa', label: 'Kelola Siswa', icon: 'fa-user-graduate' },
        { id: 'admin-relasi', label: 'Relasi Data', icon: 'fa-link' },
        { id: 'admin-laporan', label: 'Laporan', icon: 'fa-file-invoice-dollar' },
        { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: 0 }
    ],
    kepala_sekolah: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'admin-laporan', label: 'Laporan', icon: 'fa-file-invoice-dollar' },
        { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: 0 }
    ],
    parent: [
        { id: 'parent-portal', label: 'Dashboard Portal', icon: 'fa-chart-line' },
        { id: 'profil-siswa', label: 'Profil Anak', icon: 'fa-user-graduate' },
        { id: 'notifikasi', label: 'Pusat Notifikasi', icon: 'fa-bell', badge: 0 }
    ]
};

const userCredentialsMock = {
    admin: { name: 'Haryanto Putro', title: 'Super Administrator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' },
    kepala_sekolah: { name: 'Drs. Ahmad Dahlan', title: 'Kepala Sekolah', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
    parent: { name: 'Budi Santoso', title: 'Wali Murid (Orang Tua)', avatar: 'https://i1-c.pinimg.com/736x/69/c1/27/69c127c94e626793d5df6f274e187627.jpg' }
};

window.addEventListener('DOMContentLoaded', () => {
    showRoute('login');
});

function showRoute(routeId) {
    document.querySelectorAll('.route-view').forEach(view => view.classList.add('hidden'));
    document.getElementById('route-' + routeId).classList.remove('hidden');
}

function setLoginRole(role) {
    const btnAdmin = document.getElementById('login-toggle-admin');
    const btnParent = document.getElementById('login-toggle-parent');
    const btnKepsek = document.getElementById('login-toggle-kepsek');
    const emailInput = document.getElementById('login-email');

    [btnAdmin, btnParent, btnKepsek].forEach(btn => {
        if (btn) btn.className = "w-1/3 py-2 text-xs font-bold rounded-lg transition-all text-slate-500";
    });

    if (role === 'admin') {
        if (btnAdmin) btnAdmin.className = "w-1/3 py-2 text-xs font-bold rounded-lg transition-all bg-white text-blue-700 shadow-xs";
        emailInput.value = "admin@school.id";
    } else if (role === 'kepala_sekolah') {
        if (btnKepsek) btnKepsek.className = "w-1/3 py-2 text-xs font-bold rounded-lg transition-all bg-white text-blue-700 shadow-xs";
        emailInput.value = "kepsek@school.id";
    } else {
        if (btnParent) btnParent.className = "w-1/3 py-2 text-xs font-bold rounded-lg transition-all bg-white text-blue-700 shadow-xs";
        emailInput.value = "budisantoso@email.com";
    }
}

async function executeLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            appState.currentUser = data.data;
            loginAs(data.data.role, data.data);
        } else {
            alert('Login Gagal: ' + data.message);
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('\u26a0 Gagal terhubung ke server. Pastikan Laragon aktif dan database tersedia.');
    }
}

async function executeRegister(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input, textarea');

    const registerData = {
        nama: inputs[0].value,
        email: inputs[1].value,
        telepon: inputs[2].value,
        alamat: inputs[3].value,
        password: inputs[4].value
    };

    // Validasi password match
    if (inputs[4].value !== inputs[5].value) {
        alert('Kata sandi dan konfirmasi kata sandi tidak cocok!');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        const data = await res.json();

        if (data.success) {
            alert('Registrasi Berhasil! ' + data.message);
            showRoute('login');
        } else {
            alert('Registrasi Gagal: ' + data.message);
        }
    } catch (err) {
        console.error('Register error:', err);
        alert('\u26a0 Gagal terhubung ke server. Pastikan Laragon aktif dan database tersedia.');
    }
}

function loginAs(role, userData) {
    appState.currentRole = role;

    const creds = userData || userCredentialsMock[role];
    document.getElementById('user-fullname').innerText = creds.nama || creds.name;
    document.getElementById('user-role-title').innerText = role === 'admin' ? 'Super Administrator' : (role === 'kepala_sekolah' ? 'Kepala Sekolah' : 'Wali Murid (Orang Tua)');
    document.getElementById('user-avatar').src = creds.avatar || userCredentialsMock[role].avatar;

    const brandLogo = document.getElementById('brand-logo-container');
    const brandTitle = document.getElementById('brand-title');
    const brandSub = document.getElementById('brand-subtitle');

    if (role === 'admin') {
        brandLogo.className = "w-9 h-9 bg-blue-700 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-md";
        brandLogo.innerHTML = `<i class="fa-solid fa-shield-halved"></i>`;
        brandTitle.innerText = "Admin Panel";
        brandSub.innerText = "School Management";
        appState.currentTab = 'admin-dashboard';
        document.getElementById('topbar-context-title').innerText = "Sistem Pengelolaan Data Wali Siswa (Workspace Administrator)";
    } else if (role === 'kepala_sekolah') {
        brandLogo.className = "w-9 h-9 bg-emerald-700 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-md";
        brandLogo.innerHTML = `<i class="fa-solid fa-chart-pie"></i>`;
        brandTitle.innerText = "Executive Panel";
        brandSub.innerText = "School Monitoring";
        appState.currentTab = 'admin-dashboard';
        document.getElementById('topbar-context-title').innerText = "Dashboard Pemantauan Data (Read-Only)";
    } else {
        brandLogo.className = "w-9 h-9 bg-purple-700 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-md";
        brandLogo.innerHTML = `<i class="fa-solid fa-users-rectangle"></i>`;
        brandTitle.innerText = "Parent Portal";
        brandSub.innerText = "School Connect";
        appState.currentTab = 'parent-portal';
        document.getElementById('topbar-context-title').innerText = "Portal Integrasi Informasi Pendidikan Orang Tua / Wali Murid";
    }

    renderDynamicSidebarMenus();
    showRoute('app');
    switchTab(appState.currentTab);
}

function renderDynamicSidebarMenus() {
    const container = document.getElementById('app-sidebar-nav');
    container.innerHTML = '';

    const menus = navigationMenus[appState.currentRole];
    menus.forEach(menu => {
        const btn = document.createElement('button');
        btn.id = `sidebar-btn-${menu.id}`;
        btn.onclick = () => switchTab(menu.id);
        btn.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left outline-none text-slate-500 hover:bg-slate-50 hover:text-slate-900";

        let innerHTML = `<span class="flex items-center gap-3"><i class="fa-solid ${menu.icon} text-sm text-slate-400"></i> ${menu.label}</span>`;
        if (menu.badge !== undefined) {
            innerHTML += `<span class="sidebar-notif-badge bg-red-500 text-white text-4xs font-black px-1.5 py-0.5 rounded-full ${menu.badge === 0 ? 'hidden' : ''}">${menu.badge}</span>`;
        }
        btn.innerHTML = innerHTML;
        container.appendChild(btn);
    });
}

function switchTab(tabId) {
    appState.currentTab = tabId;
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById(`page-${tabId}`);
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    const currentRoleMenus = navigationMenus[appState.currentRole];
    currentRoleMenus.forEach(m => {
        const domBtn = document.getElementById(`sidebar-btn-${m.id}`);
        if (domBtn) {
            if (m.id === tabId) {
                domBtn.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left outline-none bg-blue-50 text-blue-700 font-bold";
                domBtn.querySelector('i').classList.add('text-blue-600');
            } else {
                domBtn.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left outline-none text-slate-500 hover:bg-slate-50 hover:text-slate-900";
                domBtn.querySelector('i').className = `fa-solid ${m.icon} text-sm text-slate-400`;
            }
        }
    });

    document.getElementById('workspace-viewport').scrollTop = 0;

    // Sembunyikan tombol aksi dashboard jika role adalah kepala_sekolah
    const dashActions = document.getElementById('dashboard-action-buttons');
    if (dashActions) {
        dashActions.style.display = appState.currentRole === 'kepala_sekolah' ? 'none' : 'flex';
    }

    // Load data dari API sesuai tab
    if (tabId === 'admin-dashboard') loadDashboardData();
    if (tabId === 'admin-siswa') { loadSiswaData(); initKelasFilter(); }
    if (tabId === 'admin-relasi') { loadRelasiData(); setTimeout(initRelasiFilter, 300); }
    if (tabId === 'admin-laporan') { loadLaporanData(); setTimeout(initLaporanKelasFilter, 300); }
    if (tabId === 'notifikasi') loadNotifikasiData();
}

// ======== LOAD DASHBOARD DATA ========
async function loadDashboardData() {
    try {
        const [statsRes, waliRes, aktRes] = await Promise.all([
            fetch(`${API_BASE}/dashboard.php?action=stats`),
            fetch(`${API_BASE}/dashboard.php?action=wali_terbaru`),
            fetch(`${API_BASE}/dashboard.php?action=aktivitas`)
        ]);
        const stats = await statsRes.json();
        const wali = await waliRes.json();
        const aktivitas = await aktRes.json();

        if (stats.success) {
            document.getElementById('stat-total-wali').textContent = stats.data.total_wali.toLocaleString();
            document.getElementById('stat-total-siswa').textContent = stats.data.total_siswa.toLocaleString();
            document.getElementById('stat-total-relasi').textContent = stats.data.total_relasi.toLocaleString();
            document.getElementById('stat-total-notif').textContent = stats.data.total_notifikasi.toLocaleString();
            document.getElementById('stat-notif-baru').textContent = stats.data.notif_baru + ' Baru';
            // Update notifikasi badge di sidebar
            document.querySelectorAll('.sidebar-notif-badge').forEach(badge => {
                badge.textContent = stats.data.notif_baru;
                if (stats.data.notif_baru > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            });
        }

        if (wali.success && wali.data.length > 0) {
            const tbody = document.querySelector('#page-admin-dashboard table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                wali.data.forEach(w => {
                    const initials = w.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const statusClass = w.status === 'Terverifikasi'
                        ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
                    tbody.innerHTML += `<tr class="hover:bg-slate-50/50">
                        <td class="px-4 py-3 flex items-center gap-2">
                            <div class="w-7 h-7 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-3xs">${initials}</div>
                            <div><p class="font-bold text-slate-900">${w.nama}</p><p class="text-3xs text-slate-400 font-normal">${w.email || '-'}</p></div>
                        </td>
                        <td class="px-4 py-3">${w.pekerjaan || '-'}</td>
                        <td class="px-4 py-3"><span class="${statusClass} text-3xs font-bold px-2 py-0.5 rounded">${w.status}</span></td>
                        <td class="px-4 py-3 text-center"><button class="text-slate-400 hover:text-slate-600" onclick="showWaliQuickMenu(${w.id}, '${w.nama}', event, this)"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>
                    </tr>`;
                });
            }
        }

        // Render aktivitas terkini
        if (aktivitas.success && aktivitas.data.length > 0) {
            const container = document.getElementById('aktivitas-list');
            if (container) {
                container.innerHTML = '';
                aktivitas.data.forEach(a => {
                    const colorMap = { info: 'blue', success: 'emerald', warning: 'amber', error: 'red' };
                    const dotColor = colorMap[a.tipe] || 'blue';
                    // Determine target page based on content
                    let targetTab = 'notifikasi';
                    const judul = a.judul.toLowerCase();
                    if (judul.includes('relasi')) targetTab = 'admin-relasi';
                    else if (judul.includes('wali') && judul.includes('terdaftar')) targetTab = 'admin-siswa';
                    else if (judul.includes('sinkron') || judul.includes('dapodik')) targetTab = 'admin-siswa';
                    else if (judul.includes('verifikasi')) targetTab = 'notifikasi';
                    else if (judul.includes('laporan')) targetTab = 'admin-laporan';

                    const timeAgo = getTimeAgo(a.created_at);

                    container.innerHTML += `<div class="relative mb-2 cursor-pointer hover:opacity-80 transition-opacity" onclick="switchTab('${targetTab}')">
                        <span class="absolute -left-6 w-3 h-3 bg-${dotColor}-500 rounded-full border-2 border-white mt-0.5"></span>
                        <p class="font-bold text-slate-900">${a.judul}</p>
                        <p class="text-3xs text-slate-400">${a.pesan.substring(0, 60)}${a.pesan.length > 60 ? '...' : ''} • ${timeAgo}</p>
                    </div>`;
                });
            }
        }
    } catch (err) {
        console.warn('Dashboard API belum aktif:', err);
    }
}

// Helper: format waktu relatif
function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return diffMins + ' menit yang lalu';
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours + ' jam yang lalu';
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return diffDays + ' hari yang lalu';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ======== LOAD SISWA DATA ========
async function loadSiswaData() {
    try {
        const res = await fetch(`${API_BASE}/siswa.php`);
        const data = await res.json();
        if (!data.success) return;

        // Update stats cards
        document.getElementById('siswa-stat-total').textContent = data.stats.total.toLocaleString();
        document.getElementById('siswa-stat-aktif').textContent = data.stats.aktif.toLocaleString();
        document.getElementById('siswa-stat-verifikasi').textContent = data.stats.verifikasi.toLocaleString();
        document.getElementById('siswa-stat-alumni').textContent = data.stats.alumni_pindah.toLocaleString();

        // Update table
        const tbody = document.querySelector('#page-admin-siswa table tbody');
        if (tbody && data.data.length > 0) {
            tbody.innerHTML = '';
            data.data.forEach(s => {
                const initials = s.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const colors = ['blue', 'purple', 'emerald', 'amber', 'red'];
                const color = colors[Math.abs(s.nama.charCodeAt(0)) % colors.length];
                const statusMap = {
                    'Aktif': 'bg-emerald-50 text-emerald-600',
                    'Verifikasi': 'bg-amber-50 text-amber-600',
                    'Alumni': 'bg-slate-100 text-slate-600',
                    'Pindah': 'bg-red-50 text-red-600'
                };
                const statusClass = statusMap[s.status] || 'bg-slate-100 text-slate-600';

                tbody.innerHTML += `<tr class="hover:bg-slate-50/40">
                    <td class="px-6 py-3.5 text-blue-600 font-bold hover:underline cursor-pointer" onclick="viewSiswa(${s.id})">${s.nisn}</td>
                    <td class="px-6 py-3.5 flex items-center gap-2.5">
                        <div class="w-6 h-6 bg-${color}-100 text-${color}-700 rounded-full flex items-center justify-center text-3xs font-bold">${initials}</div>${s.nama}
                    </td>
                    <td class="px-6 py-3.5">${s.kelas}</td>
                    <td class="px-6 py-3.5">${s.jenis_kelamin}</td>
                    <td class="px-6 py-3.5"><span class="${statusClass} text-3xs font-bold px-2 py-0.5 rounded-full">${s.status}</span></td>
                    <td class="px-6 py-3.5 text-center text-slate-400 text-sm">
                        <button class="hover:text-blue-600 mx-1" onclick="viewSiswa(${s.id})"><i class="fa-regular fa-eye"></i></button>
                        <button class="hover:text-amber-500 mx-1" onclick="editSiswa(${s.id})"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="hover:text-red-600 mx-1" onclick="deleteSiswa(${s.id})"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>`;
            });
        }
    } catch (err) {
        console.warn('Siswa API belum aktif:', err);
    }
}

// ======== DELETE SISWA ========
async function deleteSiswa(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;
    try {
        const res = await fetch(`${API_BASE}/siswa.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        if (data.success) loadSiswaData();
    } catch (err) {
        alert('Gagal menghapus siswa');
    }
}

// ======== LOAD RELASI DATA ========
async function loadRelasiData() {
    try {
        // Load dropdown siswa & wali
        const [siswaRes, waliRes, relasiRes] = await Promise.all([
            fetch(`${API_BASE}/siswa.php`),
            fetch(`${API_BASE}/wali.php`),
            fetch(`${API_BASE}/relasi.php`)
        ]);
        const siswaData = await siswaRes.json();
        const waliData = await waliRes.json();
        const relasiData = await relasiRes.json();

        // Populate dropdown siswa
        const selSiswa = document.getElementById('rel-siswa');
        if (selSiswa && siswaData.success) {
            selSiswa.innerHTML = '<option value="">Pilih Siswa</option>';
            siswaData.data.forEach(s => {
                selSiswa.innerHTML += `<option value="${s.id}">${s.nama} (NISN: ${s.nisn})</option>`;
            });
        }

        // Populate dropdown wali
        const selWali = document.getElementById('rel-wali');
        if (selWali && waliData.success) {
            selWali.innerHTML = '<option value="">Pilih Wali</option>';
            waliData.data.forEach(w => {
                selWali.innerHTML += `<option value="${w.id}">${w.nama} (${w.email || '-'})</option>`;
            });
        }

        // Populate table
        if (relasiData.success) {
            const tbody = document.getElementById('rel-table-body');
            if (tbody) {
                tbody.innerHTML = '';
                relasiData.data.forEach(r => {
                    let badgeStyle = "bg-blue-50 text-blue-700";
                    if (r.tipe === 'IBU') badgeStyle = "bg-pink-50 text-pink-700";
                    if (r.tipe === 'WALI') badgeStyle = "bg-slate-100 text-slate-700";
                    const statusColor = r.status === 'Terverifikasi' ? 'emerald' : 'amber';

                    tbody.innerHTML += `<tr class="hover:bg-slate-50/50">
                        <td class="px-4 py-3"><p class="font-bold text-slate-900">${r.siswa_nama}</p><p class="text-3xs text-slate-400 font-normal">NISN: ${r.nisn}</p></td>
                        <td class="px-4 py-3"><p>${r.wali_nama}</p><p class="text-3xs text-slate-400 font-normal">${r.wali_email || '-'}</p></td>
                        <td class="px-4 py-3"><span class="text-3xs font-bold ${badgeStyle} px-2 py-0.5 rounded">${r.tipe}</span></td>
                        <td class="px-4 py-3"><span class="flex items-center gap-1 text-3xs text-${statusColor}-600"><span class="w-1 h-1 bg-${statusColor}-500 rounded-full"></span> ${r.status}</span></td>
                        <td class="px-4 py-3 text-center text-slate-400">
                            <button class="hover:text-blue-600 mx-1" onclick="editRelasi(${r.id}, '${r.tipe}', '${r.siswa_nama}', '${r.wali_nama}')"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="hover:text-red-600 mx-1" onclick="deleteRelasi(${r.id})"><i class="fa-regular fa-trash-can"></i></button>
                        </td>
                    </tr>`;
                });
            }
            // Update Quick Insights
            const qiTotal = document.getElementById('qi-total-relasi');
            const qiTanpa = document.getElementById('qi-siswa-tanpa-relasi');
            if (qiTotal) qiTotal.textContent = relasiData.stats?.total_relasi ?? relasiData.data.length;
            if (qiTanpa) qiTanpa.textContent = (relasiData.stats?.siswa_tanpa_relasi ?? '-') + ' Siswa';
        }

    } catch (err) {
        console.warn('Relasi API belum aktif:', err);
    }
}

// ======== DELETE RELASI ========
async function deleteRelasi(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus relasi ini?')) return;
    try {
        const res = await fetch(`${API_BASE}/relasi.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        if (data.success) loadRelasiData();
    } catch (err) {
        alert('Gagal menghapus relasi');
    }
}

// ======== EDIT RELASI ========
function editRelasi(id, currentTipe, siswaNama, waliNama) {
    const existing = document.getElementById('edit-relasi-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-relasi-modal';
    modal.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `<div class="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <div class="flex justify-between items-center">
            <h3 class="font-bold text-lg text-slate-900">Edit Relasi</h3>
            <button onclick="document.getElementById('edit-relasi-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
            <p class="text-slate-500"><span class="font-bold text-slate-700">Siswa:</span> ${siswaNama}</p>
            <p class="text-slate-500"><span class="font-bold text-slate-700">Wali:</span> ${waliNama}</p>
        </div>
        <div class="space-y-3">
            <div class="space-y-1">
                <label class="text-3xs font-bold text-slate-400 uppercase">Tipe Hubungan</label>
                <select id="edit-relasi-tipe" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-500">
                    <option value="AYAH" ${currentTipe === 'AYAH' ? 'selected' : ''}>Ayah</option>
                    <option value="IBU" ${currentTipe === 'IBU' ? 'selected' : ''}>Ibu</option>
                    <option value="WALI" ${currentTipe === 'WALI' ? 'selected' : ''}>Wali</option>
                </select>
            </div>
            <div class="space-y-1">
                <label class="text-3xs font-bold text-slate-400 uppercase">Status Verifikasi</label>
                <select id="edit-relasi-status" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-500">
                    <option value="Terverifikasi">Terverifikasi</option>
                    <option value="Pending">Pending</option>
                </select>
            </div>
        </div>
        <div class="flex gap-3 pt-1">
            <button onclick="document.getElementById('edit-relasi-modal').remove()" class="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50">Batal</button>
            <button onclick="submitEditRelasi(${id})" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs">Simpan</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function submitEditRelasi(id) {
    const tipe   = document.getElementById('edit-relasi-tipe').value;
    const status = document.getElementById('edit-relasi-status').value;
    try {
        const res = await fetch(`${API_BASE}/relasi.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipe, status })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('edit-relasi-modal').remove();
            showToast('\u2705 Relasi berhasil diperbarui!', 'success');
            loadRelasiData();
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) {
        showToast('\u26a0 Gagal memperbarui relasi. Coba lagi.', 'error');
    }
}

// ======== WALI QUICK MENU (Dashboard) ========
function showWaliQuickMenu(id, nama, event, btn) {
    event.stopPropagation();
    const existing = document.getElementById('wali-quick-menu');
    if (existing) { existing.remove(); return; }

    const rect = btn.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.id = 'wali-quick-menu';
    menu.className = 'fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44 text-xs';
    menu.style.top  = (rect.bottom + 6) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.innerHTML = `
        <button onclick="switchTab('admin-relasi'); document.getElementById('wali-quick-menu')?.remove()" class="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium">
            <i class="fa-regular fa-eye text-blue-500 w-4 text-center"></i> Lihat Relasi
        </button>
        <hr class="border-slate-100 mx-2">
        <button onclick="deleteWaliFromDashboard(${id}, '${nama}')" class="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-2 text-red-500 font-medium">
            <i class="fa-regular fa-trash-can w-4 text-center"></i> Hapus Wali
        </button>
    `;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
}

async function deleteWaliFromDashboard(id, nama) {
    document.getElementById('wali-quick-menu')?.remove();
    if (!confirm(`Hapus wali "${nama}" dari database?`)) return;
    try {
        const res = await fetch(`${API_BASE}/wali.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('\u2705 Data wali berhasil dihapus!', 'success');
            loadDashboardData();
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) {
        showToast('\u26a0 Gagal menghapus wali. Coba lagi.', 'error');
    }
}

// ======== HANDLE RELASI SUBMIT (via API) ========
async function handleRelationAjaxSubmit(event) {
    event.preventDefault();

    const siswaId = document.getElementById('rel-siswa').value;
    const waliId = document.getElementById('rel-wali').value;
    const tipe = document.querySelector('input[name="rel-type"]:checked').value;
    const submitBtn = document.getElementById('rel-submit-btn');
    const ajaxLoader = document.getElementById('rel-ajax-loader');

    if (!siswaId || !waliId) return alert('Mohon lengkapi parameter entitas data siswa dan wali!');

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyinkronkan Data...`;
    ajaxLoader.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/relasi.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siswa_id: siswaId, wali_id: waliId, tipe: tipe })
        });
        const data = await res.json();

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk text-2xs"></i> Simpan Relasi`;
            ajaxLoader.classList.add('hidden');

            if (data.success) {
                alert('Data Relasi Baru Berhasil Disimpan ke Database! Notifikasi telah dipicu otomatis.');
                loadRelasiData();
                document.getElementById('rel-siswa').value = '';
                document.getElementById('rel-wali').value = '';
            } else {
                alert('Gagal: ' + data.message);
            }
        }, 1500);
    } catch (err) {
        console.warn('API belum aktif, menggunakan mode demo:', err);
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk text-2xs"></i> Simpan Relasi`;
            ajaxLoader.classList.add('hidden');
            alert('Data Relasi Baru Berhasil Disimpan (Mode Demo).');
        }, 1500);
    }
}

// ======== LOAD LAPORAN DATA ========
async function loadLaporanData(kelas = '', dari = '', sampai = '') {
    try {
        let url = `${API_BASE}/laporan.php?`;
        const params = [];
        if (kelas) params.push(`kelas=${encodeURIComponent(kelas)}`);
        if (dari)  params.push(`dari=${encodeURIComponent(dari)}`);
        if (sampai) params.push(`sampai=${encodeURIComponent(sampai)}`);
        url += params.join('&');

        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) return;

        const tbody = document.querySelector('#page-admin-laporan table tbody');
        if (!tbody) return;

        if (data.data.length > 0) {
            tbody.innerHTML = '';
            data.data.forEach(l => {
                const tipeStyle = l.hubungan === 'AYAH' ? 'bg-blue-50 text-blue-600' :
                    l.hubungan === 'IBU' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-600';
                const tgl = l.created_at ? new Date(l.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                tbody.innerHTML += `<tr class="hover:bg-slate-50/50">
                    <td class="px-4 py-3"><p class="font-bold text-slate-900">${l.wali_nama}</p></td>
                    <td class="px-4 py-3">${l.siswa_nama}</td>
                    <td class="px-4 py-3">${l.kelas}</td>
                    <td class="px-4 py-3"><span class="text-3xs font-bold ${tipeStyle} px-1.5 py-0.5 rounded">${l.hubungan}</span></td>
                    <td class="px-4 py-3">${l.telepon || '-'}</td>
                </tr>`;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 italic text-xs">Tidak ada data yang cocok dengan filter.</td></tr>`;
        }

        // Populate kelas dropdown jika belum terisi
        const sel = document.getElementById('laporan-filter-kelas');
        if (sel && sel.options.length <= 1) {
            const kelasSet = new Set();
            data.data.forEach(l => { if (l.kelas) kelasSet.add(l.kelas); });
            [...kelasSet].sort().forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = k;
                sel.appendChild(opt);
            });
        }
    } catch (err) {
        console.warn('Laporan API belum aktif:', err);
    }
}

// ======== FILTER LAPORAN ========
function filterLaporan() {
    const kelas  = document.getElementById('laporan-filter-kelas')?.value || '';
    const dari   = document.getElementById('laporan-tgl-dari')?.value || '';
    const sampai = document.getElementById('laporan-tgl-sampai')?.value || '';

    if (dari && sampai && dari > sampai) {
        showToast('\u26a0 Tanggal "Dari" tidak boleh lebih besar dari "Sampai"', 'error');
        return;
    }

    loadLaporanData(kelas, dari, sampai);
}

// ======== KELAS FILTER (LAPORAN PAGE) ========
function initLaporanKelasFilter() {
    // Kelas dropdown sudah di-populate oleh loadLaporanData
    // Fungsi ini tetap ada untuk backward compatibility
}
async function loadNotifikasiData() {
    try {
        const userId = appState.currentUser ? appState.currentUser.id : null;
        const url = userId ? `${API_BASE}/notifikasi.php?user_id=${userId}` : `${API_BASE}/notifikasi.php`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success) return;

        const container = document.querySelector('#page-notifikasi .lg\\:col-span-2');
        if (container && data.data.length > 0) {
            container.innerHTML = '';
            data.data.forEach(n => {
                const iconMap = { info: 'fa-circle-exclamation text-blue-600', success: 'fa-circle-check text-emerald-600', warning: 'fa-triangle-exclamation text-amber-600', error: 'fa-circle-xmark text-red-600' };
                const borderMap = { info: 'border-blue-600', success: 'border-emerald-600', warning: 'border-amber-600', error: 'border-red-600' };
                const bgMap = { info: 'bg-blue-50', success: 'bg-emerald-50', warning: 'bg-amber-50', error: 'bg-red-50' };
                const icon = iconMap[n.tipe] || iconMap.info;
                const border = borderMap[n.tipe] || borderMap.info;
                const bg = bgMap[n.tipe] || bgMap.info;

                container.innerHTML += `<div class="bg-white border-l-4 ${border} p-4 border border-slate-200 rounded-r-2xl shadow-3xs flex gap-3 ${n.dibaca == 0 ? '' : 'opacity-60'}">
                    <div class="w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-xs shrink-0"><i class="fa-solid ${icon}"></i></div>
                    <div><h5 class="font-bold text-slate-900 text-sm">${n.judul}</h5><p class="text-xs text-slate-500 mt-0.5">${n.pesan}</p></div>
                </div>`;
            });
        }
    } catch (err) {
        console.warn('Notifikasi API belum aktif:', err);
    }
}

// ======== PASSWORD TOGGLE ========
function togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.querySelector('#login-password ~ span i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
    }
}

// ======== SEARCH FUNCTIONALITY ========
function initSearch() {
    const searchInput = document.querySelector('header input[type="text"]');
    if (!searchInput) return;
    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const currentPage = document.querySelector('.page-view:not(.hidden)');
        if (!currentPage) return;
        const rows = currentPage.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) || query === '' ? '' : 'none';
        });
    });
}

// ======== RADIO BUTTON VISUAL FEEDBACK ========
function initRadioButtons() {
    const radios = document.querySelectorAll('input[name="rel-type"]');
    function updateRadioStyle() {
        radios.forEach(r => {
            const label = r.closest('label');
            if (r.checked) {
                label.className = 'border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-xl p-2 cursor-pointer block text-center';
            } else {
                label.className = 'border border-slate-200 rounded-xl p-2 cursor-pointer hover:bg-slate-50 block';
            }
        });
    }
    radios.forEach(r => r.addEventListener('change', updateRadioStyle));
    updateRadioStyle();
}

// ======== VIEW SISWA DETAIL ========
function viewSiswa(id) {
    switchTab('profil-siswa');
    loadProfilSiswa(id);
}

async function loadProfilSiswa(id) {
    try {
        const res = await fetch(`${API_BASE}/siswa.php?id=${id}`);
        const data = await res.json();
        if (!data.success) return;
        const s = data.data;
        const page = document.getElementById('page-profil-siswa');
        const profileCard = page.querySelector('.text-center');
        if (profileCard) {
            profileCard.querySelector('h3').textContent = s.nama;
            profileCard.querySelector('p').textContent = 'NISN: ' + s.nisn;
        }
        const detailCard = page.querySelector('.lg\\:col-span-2');
        if (detailCard) {
            detailCard.innerHTML = `
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2"><i class="fa-solid fa-id-card text-blue-600"></i> Detail Informasi Pribadi</h3>
                <div class="grid grid-cols-2 gap-4 text-xs">
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Nama Lengkap</p><p class="font-semibold text-slate-700 mt-1">${s.nama}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">NISN</p><p class="font-semibold text-slate-700 mt-1">${s.nisn}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Kelas</p><p class="font-semibold text-slate-700 mt-1">${s.kelas}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Jenis Kelamin</p><p class="font-semibold text-slate-700 mt-1">${s.jenis_kelamin}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Status</p><p class="font-semibold text-slate-700 mt-1">${s.status}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Alamat</p><p class="font-semibold text-slate-700 mt-1">${s.alamat || '-'}</p></div>
                </div>
                ${s.wali && s.wali.length > 0 ? `<h3 class="font-bold text-slate-900 text-sm flex items-center gap-2 mt-4"><i class="fa-solid fa-users text-purple-600"></i> Data Wali</h3>
                <div class="space-y-2">${s.wali.map(w => `<div class="bg-slate-50 p-3 rounded-xl text-xs"><span class="font-bold">${w.nama}</span> <span class="text-3xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded ml-1">${w.tipe}</span><p class="text-slate-400 mt-1">${w.email || '-'} • ${w.telepon || '-'}</p></div>`).join('')}</div>` : ''}
                <div id="attendance-overview-container" class="mt-4">
                    <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-calendar-check text-emerald-600"></i> Ringkasan Kehadiran Siswa</h3>
                    <div class="flex items-center justify-center p-4"><i class="fa-solid fa-spinner animate-spin text-blue-600"></i></div>
                </div>
                <div class="mt-4">
                    <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-calendar-plus text-blue-600"></i> Input Kehadiran</h3>
                    <form onsubmit="submitKehadiran(event, ${id})" class="space-y-3 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="text-3xs font-bold text-slate-400 uppercase">Tanggal</label>
                                <input type="date" id="keh-tanggal" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white">
                            </div>
                            <div class="space-y-1">
                                <label class="text-3xs font-bold text-slate-400 uppercase">Status</label>
                                <select id="keh-status" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-500">
                                    <option value="Hadir">Hadir</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Alpa">Alpa</option>
                                </select>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-3xs font-bold text-slate-400 uppercase">Keterangan (Opsional)</label>
                            <input type="text" id="keh-keterangan" placeholder="Misal: Sakit demam, ada keperluan..." class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white">
                        </div>
                        <button type="submit" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2">
                            <i class="fa-solid fa-check text-2xs"></i> Simpan Kehadiran
                        </button>
                    </form>
                </div>`;

            // Fetch attendance
            fetch(`${API_BASE}/kehadiran.php?siswa_id=${id}&action=summary`)
                .then(r => r.json())
                .then(attData => {
                    const attContainer = document.getElementById('attendance-overview-container');
                    if (attContainer && attData.success) {
                        const sum = attData.data.summary;
                        attContainer.innerHTML = `
                            <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-calendar-check text-emerald-600"></i> Ringkasan Kehadiran Siswa</h3>
                            <div class="grid grid-cols-4 gap-2 text-center text-xs">
                                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-100"><p class="font-bold text-lg">${sum.Hadir || 0}</p><p class="text-3xs font-bold uppercase mt-1">Hadir</p></div>
                                <div class="bg-blue-50 text-blue-700 p-2 rounded-xl border border-blue-100"><p class="font-bold text-lg">${sum.Izin || 0}</p><p class="text-3xs font-bold uppercase mt-1">Izin</p></div>
                                <div class="bg-amber-50 text-amber-700 p-2 rounded-xl border border-amber-100"><p class="font-bold text-lg">${sum.Sakit || 0}</p><p class="text-3xs font-bold uppercase mt-1">Sakit</p></div>
                                <div class="bg-red-50 text-red-700 p-2 rounded-xl border border-red-100"><p class="font-bold text-lg">${sum.Alpa || 0}</p><p class="text-3xs font-bold uppercase mt-1">Alpa</p></div>
                            </div>
                            ${attData.data.history && attData.data.history.length > 0 ? `
                                <div class="mt-3 bg-slate-50 rounded-xl p-3">
                                    <p class="text-3xs font-bold text-slate-500 uppercase mb-2">Riwayat Terbaru</p>
                                    <div class="space-y-2">
                                        ${attData.data.history.map(h => {
                            const statusColor = h.status === 'Hadir' ? 'emerald' : (h.status === 'Izin' ? 'blue' : (h.status === 'Sakit' ? 'amber' : 'red'));
                            return `<div class="flex justify-between items-center text-xs">
                                                <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-${statusColor}-500"></span><span class="text-slate-600">${h.tanggal}</span></div>
                                                <span class="font-bold text-${statusColor}-600">${h.status} ${h.keterangan ? `(${h.keterangan})` : ''}</span>
                                            </div>`;
                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        `;
                    } else if (attContainer) {
                        attContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Data kehadiran belum tersedia.</p>`;
                    }
                })
                .catch(e => {
                    const attContainer = document.getElementById('attendance-overview-container');
                    if (attContainer) attContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Data kehadiran belum tersedia (API offline).</p>`;
                });
        }
    } catch (err) {
        console.warn('Profil API error:', err);
    }
}

// ======== SUBMIT KEHADIRAN ========
async function submitKehadiran(event, siswaId) {
    event.preventDefault();
    const tanggal    = document.getElementById('keh-tanggal').value;
    const status     = document.getElementById('keh-status').value;
    const keterangan = document.getElementById('keh-keterangan').value;
    const btn = event.target.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyimpan...`;

    try {
        const res = await fetch(`${API_BASE}/kehadiran.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siswa_id: siswaId, tanggal, status, keterangan })
        });
        const data = await res.json();

        if (data.success) {
            showToast('\u2705 Kehadiran berhasil dicatat!', 'success');
            document.getElementById('keh-keterangan').value = '';
            // Refresh attendance overview
            const attContainer = document.getElementById('attendance-overview-container');
            if (attContainer) {
                attContainer.innerHTML = `<h3 class="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-calendar-check text-emerald-600"></i> Ringkasan Kehadiran Siswa</h3><div class="flex items-center justify-center p-4"><i class="fa-solid fa-spinner animate-spin text-blue-600"></i></div>`;
                fetch(`${API_BASE}/kehadiran.php?siswa_id=${siswaId}&action=summary`)
                    .then(r => r.json())
                    .then(attData => {
                        if (attData.success) {
                            const sum = attData.data.summary;
                            attContainer.innerHTML = `<h3 class="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-calendar-check text-emerald-600"></i> Ringkasan Kehadiran Siswa</h3>
                            <div class="grid grid-cols-4 gap-2 text-center text-xs">
                                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-100"><p class="font-bold text-lg">${sum.Hadir || 0}</p><p class="text-3xs font-bold uppercase mt-1">Hadir</p></div>
                                <div class="bg-blue-50 text-blue-700 p-2 rounded-xl border border-blue-100"><p class="font-bold text-lg">${sum.Izin || 0}</p><p class="text-3xs font-bold uppercase mt-1">Izin</p></div>
                                <div class="bg-amber-50 text-amber-700 p-2 rounded-xl border border-amber-100"><p class="font-bold text-lg">${sum.Sakit || 0}</p><p class="text-3xs font-bold uppercase mt-1">Sakit</p></div>
                                <div class="bg-red-50 text-red-700 p-2 rounded-xl border border-red-100"><p class="font-bold text-lg">${sum.Alpa || 0}</p><p class="text-3xs font-bold uppercase mt-1">Alpa</p></div>
                            </div>
                            ${attData.data.history && attData.data.history.length > 0 ? `<div class="mt-3 bg-slate-50 rounded-xl p-3"><p class="text-3xs font-bold text-slate-500 uppercase mb-2">Riwayat Terbaru</p><div class="space-y-2">${attData.data.history.map(h => { const c = h.status === 'Hadir' ? 'emerald' : (h.status === 'Izin' ? 'blue' : (h.status === 'Sakit' ? 'amber' : 'red')); return '<div class="flex justify-between items-center text-xs"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-'+c+'-500"></span><span class="text-slate-600">'+h.tanggal+'</span></div><span class="font-bold text-'+c+'-600">'+h.status+(h.keterangan ? ' ('+h.keterangan+')' : '')+'</span></div>'; }).join('')}</div></div>` : ''}`;
                        } else {
                            attContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Data kehadiran belum tersedia.</p>`;
                        }
                    })
                    .catch(() => {
                        attContainer.innerHTML = `<p class="text-xs text-slate-400 italic">Data kehadiran belum tersedia.</p>`;
                    });
            }
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) {
        showToast('\u26a0 Gagal menyimpan kehadiran. Coba lagi.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check text-2xs"></i> Simpan Kehadiran`;
}

// ======== EDIT SISWA (MODAL) ========
function editSiswa(id) {
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `<div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h3 class="font-bold text-lg text-slate-900">Edit Data Siswa</h3>
        <div class="text-center py-4"><i class="fa-solid fa-spinner animate-spin text-blue-600 text-xl"></i><p class="text-xs text-slate-400 mt-2">Memuat data...</p></div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    fetch(`${API_BASE}/siswa.php?id=${id}`).then(r => r.json()).then(data => {
        if (!data.success) { modal.remove(); alert('Data tidak ditemukan'); return; }
        const s = data.data;
        modal.querySelector('.bg-white').innerHTML = `
            <div class="flex justify-between items-center"><h3 class="font-bold text-lg text-slate-900">Edit Data Siswa</h3><button onclick="document.getElementById('edit-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button></div>
            <form onsubmit="submitEditSiswa(event,${id})" class="space-y-3">
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">NISN</label><input id="edit-nisn" value="${s.nisn}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500" required></div>
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">Nama</label><input id="edit-nama" value="${s.nama}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500" required></div>
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">Kelas</label><input id="edit-kelas" value="${s.kelas}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500" required></div>
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">Jenis Kelamin</label><select id="edit-jk" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option ${s.jenis_kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option><option ${s.jenis_kelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option></select></div>
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">Status</label><select id="edit-status" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option ${s.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${s.status === 'Verifikasi' ? 'selected' : ''}>Verifikasi</option><option ${s.status === 'Alumni' ? 'selected' : ''}>Alumni</option><option ${s.status === 'Pindah' ? 'selected' : ''}>Pindah</option></select></div>
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">Alamat</label><textarea id="edit-alamat" rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 resize-none">${s.alamat || ''}</textarea></div>
                <button type="submit" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs">Simpan Perubahan</button>
            </form>`;
    }).catch(() => { modal.remove(); alert('Gagal memuat data'); });
}

async function submitEditSiswa(e, id) {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE}/siswa.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nisn: document.getElementById('edit-nisn').value,
                nama: document.getElementById('edit-nama').value,
                kelas: document.getElementById('edit-kelas').value,
                jenis_kelamin: document.getElementById('edit-jk').value,
                status: document.getElementById('edit-status').value,
                alamat: document.getElementById('edit-alamat').value
            })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) { document.getElementById('edit-modal').remove(); loadSiswaData(); }
    } catch (err) { alert('Gagal menyimpan perubahan'); }
}

// ======== EXPORT PDF/EXCEL ========
function exportData(type) {
    const currentPage = document.querySelector('.page-view:not(.hidden)');
    if (!currentPage) return;
    const table = currentPage.querySelector('table');
    if (!table) { alert('Tidak ada data tabel untuk diekspor'); return; }

    const rows = table.querySelectorAll('tr');
    let csv = '';
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        cols.forEach(col => rowData.push('"' + col.textContent.trim().replace(/"/g, '""') + '"'));
        csv += rowData.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_data_${Date.now()}.csv`;
    link.click();
    alert('Data berhasil diekspor sebagai CSV!');
}

// ======== FILTER RELASI ========
function initRelasiFilter() {
    const filterInput = document.querySelector('#page-admin-relasi .relative input[type="text"]');
    if (!filterInput) return;
    filterInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#rel-table-body tr');
        rows.forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) || query === '' ? '' : 'none';
        });
    });
}

// ======== KELAS FILTER (SISWA PAGE) ========
async function initKelasFilter() {
    try {
        const res = await fetch(`${API_BASE}/siswa.php`);
        const data = await res.json();
        if (!data.success) return;
        const kelasSet = new Set(data.data.map(s => s.kelas));
        const selects = document.querySelectorAll('#page-admin-siswa select');
        if (selects[0]) {
            selects[0].innerHTML = '<option value="">Filter Kelas: Semua Kelas</option>';
            kelasSet.forEach(k => selects[0].innerHTML += `<option value="${k}">${k}</option>`);
            selects[0].addEventListener('change', function () {
                const rows = document.querySelectorAll('#page-admin-siswa table tbody tr');
                rows.forEach(row => {
                    if (!this.value) { row.style.display = ''; return; }
                    const kelasCell = row.querySelectorAll('td')[2];
                    row.style.display = kelasCell && kelasCell.textContent.trim() === this.value ? '' : 'none';
                });
            });
        }
    } catch (err) { console.warn('Filter kelas error:', err); }
}

// ======== KELAS FILTER (LAPORAN PAGE) ========
function initLaporanKelasFilter() {
    const sel = document.querySelector('#page-admin-laporan select');
    if (!sel) return;
    sel.addEventListener('change', function () {
        const rows = document.querySelectorAll('#page-admin-laporan table tbody tr');
        rows.forEach(row => {
            if (!this.value || this.value === 'Semua Kelas') { row.style.display = ''; return; }
            const kelasCell = row.querySelectorAll('td')[2];
            row.style.display = kelasCell && kelasCell.textContent.trim().includes(this.value) ? '' : 'none';
        });
    });
}

// ======== MARK NOTIFIKASI AS READ ========
async function markNotifRead(id, el) {
    try {
        await fetch(`${API_BASE}/notifikasi.php?id=${id}&mark_read=1`);
        if (el) el.classList.add('opacity-60');
    } catch (err) { console.warn('Mark read error:', err); }
}

// ======== LOGOUT CLEANUP ========
function performLogout() {
    appState.currentUser = null;
    appState.currentRole = 'admin';
    appState.currentTab = 'admin-dashboard';
    document.getElementById('login-password').value = 'password123';
    setLoginRole('admin');
    showRoute('login');
}

// ======== SETTINGS PANEL ========
function openSettings() {
    const existing = document.getElementById('settings-modal');
    if (existing) { existing.remove(); return; }
    const isDark = document.body.classList.contains('dark');
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `<div class="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <div class="flex justify-between items-center"><h3 class="font-bold text-lg text-slate-900">Pengaturan</h3><button onclick="document.getElementById('settings-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="space-y-3 text-xs">
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl"><span class="font-bold text-slate-700">Notifikasi Email</span><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked class="sr-only peer"><div class="w-9 h-5 bg-slate-300 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div></label></div>
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl"><span class="font-bold text-slate-700">Mode Gelap</span><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="dark-mode-toggle" ${isDark ? 'checked' : ''} class="sr-only peer" onchange="toggleDarkMode(this.checked)"><div class="w-9 h-5 bg-slate-300 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div></label></div>
            <div class="p-3 bg-slate-50 rounded-xl"><p class="font-bold text-slate-700">Versi Sistem</p><p class="text-slate-400 mt-1">EduGuardian v1.2.0</p></div>
        </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ======== DARK MODE TOGGLE ========
function toggleDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark');
        localStorage.setItem('eduguardian-dark', 'true');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('eduguardian-dark', 'false');
    }
}

// Apply saved dark mode on page load
(function () {
    if (localStorage.getItem('eduguardian-dark') === 'true') {
        document.body.classList.add('dark');
    }
})();

// ======== FORGOT PASSWORD ========
function showForgotPassword() {
    const modal = document.createElement('div');
    modal.id = 'forgot-modal';
    modal.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `<div class="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <div class="flex justify-between items-center"><h3 class="font-bold text-lg text-slate-900">Lupa Kata Sandi</h3><button onclick="document.getElementById('forgot-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button></div>
        <p class="text-xs text-slate-400">Masukkan email Anda untuk menerima instruksi reset password.</p>
        <input type="email" id="forgot-email" placeholder="nama@email.com" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500">
        <button onclick="alert('Instruksi reset password telah dikirim ke email: '+document.getElementById('forgot-email').value);document.getElementById('forgot-modal').remove()" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs">Kirim Reset Link</button>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ======== TAMBAH SISWA BARU (MODAL) ========
function openTambahSiswaModal() {
    const existing = document.getElementById('tambah-siswa-modal');
    if (existing) { existing.remove(); return; }

    const modal = document.createElement('div');
    modal.id = 'tambah-siswa-modal';
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div class="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-white text-base">Tambah Siswa Baru</h3>
                    <p class="text-blue-200 text-3xs mt-0.5">Isi semua data berikut untuk mendaftarkan siswa baru</p>
                </div>
                <button onclick="document.getElementById('tambah-siswa-modal').remove()" class="text-white/70 hover:text-white text-lg"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form onsubmit="submitTambahSiswa(event)" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2 space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">NISN <span class="text-red-500">*</span></label>
                        <input type="text" id="ts-nisn" required placeholder="Contoh: 0082415521"
                            class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all">
                    </div>
                    <div class="col-span-2 space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Nama Lengkap <span class="text-red-500">*</span></label>
                        <input type="text" id="ts-nama" required placeholder="Nama lengkap siswa"
                            class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Kelas <span class="text-red-500">*</span></label>
                        <input type="text" id="ts-kelas" required placeholder="XII - MIPA 1"
                            class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Jenis Kelamin <span class="text-red-500">*</span></label>
                        <select id="ts-jk" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-500">
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Status</label>
                        <select id="ts-status" class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-500">
                            <option value="Aktif">Aktif</option>
                            <option value="Verifikasi">Verifikasi</option>
                            <option value="Alumni">Alumni</option>
                            <option value="Pindah">Pindah</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Alamat</label>
                        <input type="text" id="ts-alamat" placeholder="Alamat lengkap siswa"
                            class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all">
                    </div>
                </div>
                <div id="ts-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-3xs text-red-700 font-semibold"></div>
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="document.getElementById('tambah-siswa-modal').remove()"
                        class="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50">Batal</button>
                    <button type="submit" id="ts-submit-btn"
                        class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2">
                        <i class="fa-solid fa-plus text-2xs"></i> Tambah Siswa
                    </button>
                </div>
            </form>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function submitTambahSiswa(e) {
    e.preventDefault();
    const btn = document.getElementById('ts-submit-btn');
    const errEl = document.getElementById('ts-error');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyimpan...`;
    errEl.classList.add('hidden');

    const payload = {
        nisn: document.getElementById('ts-nisn').value.trim(),
        nama: document.getElementById('ts-nama').value.trim(),
        kelas: document.getElementById('ts-kelas').value.trim(),
        jenis_kelamin: document.getElementById('ts-jk').value,
        status: document.getElementById('ts-status').value,
        alamat: document.getElementById('ts-alamat').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/siswa.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('tambah-siswa-modal').remove();
            showToast('✅ Siswa berhasil ditambahkan ke database!', 'success');
            loadSiswaData();
        } else {
            errEl.textContent = '⚠ ' + data.message;
            errEl.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-plus text-2xs"></i> Tambah Siswa`;
        }
    } catch (err) {
        errEl.textContent = '⚠ Koneksi ke server gagal. Pastikan Laragon aktif.';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-plus text-2xs"></i> Tambah Siswa`;
    }
}

// ======== SWITCH TAB RELASI (Pilih Ada vs Input Manual) ========
function switchRelasiTab(tab) {
    const tabPilih = document.getElementById('rel-tab-pilih');
    const tabBaru = document.getElementById('rel-tab-baru');
    const formPilih = document.getElementById('rel-form-pilih');
    const formBaru = document.getElementById('rel-form-baru');

    if (tab === 'pilih') {
        tabPilih.className = 'flex-1 py-1.5 rounded-md bg-white text-blue-700 shadow-xs transition-all';
        tabBaru.className = 'flex-1 py--1.5 rounded-md text-slate-500 transition-all';
        formPilih.classList.remove('hidden');
        formBaru.classList.add('hidden');
    } else {
        tabBaru.className = 'flex-1 py-1.5 rounded-md bg-white text-emerald-700 shadow-xs transition-all';
        tabPilih.className = 'flex-1 py-1.5 rounded-md text-slate-500 transition-all';
        formBaru.classList.remove('hidden');
        formPilih.classList.add('hidden');
    }
}

// ======== HANDLE RELASI MANUAL SUBMIT (Buat Siswa + Wali baru lalu Relasikan) ========
async function handleRelasiManualSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('rel-manual-btn');
    const loader = document.getElementById('rel-manual-loader');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyimpan...`;
    loader.classList.remove('hidden');

    const siswaNisn = document.getElementById('new-siswa-nisn').value.trim();
    const siswaNama = document.getElementById('new-siswa-nama').value.trim();
    const siswaKelas = document.getElementById('new-siswa-kelas').value.trim();
    const siswaJk = document.getElementById('new-siswa-jk').value;
    const waliNama = document.getElementById('new-wali-nama').value.trim();
    const waliEmail = document.getElementById('new-wali-email').value.trim();
    const waliTelp = document.getElementById('new-wali-telepon').value.trim();
    const waliKerja = document.getElementById('new-wali-pekerjaan').value.trim();
    const relTipe = document.getElementById('new-rel-tipe').value;

    const reset = () => {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-floppy-disk text-2xs"></i> Simpan Semua Data`;
        loader.classList.add('hidden');
    };

    try {
        // 1. Buat siswa baru
        const siswaRes = await fetch(`${API_BASE}/siswa.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nisn: siswaNisn, nama: siswaNama, kelas: siswaKelas, jenis_kelamin: siswaJk, status: 'Aktif' })
        });
        const siswaData = await siswaRes.json();
        if (!siswaData.success) { showToast('⚠ Gagal tambah siswa: ' + siswaData.message, 'error'); reset(); return; }
        const siswaId = siswaData.data.id;

        // 2. Buat wali baru
        const waliRes = await fetch(`${API_BASE}/wali.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: waliNama, email: waliEmail, telepon: waliTelp, pekerjaan: waliKerja, status: 'Terverifikasi' })
        });
        const waliData = await waliRes.json();
        if (!waliData.success) { showToast('⚠ Gagal tambah wali: ' + waliData.message, 'error'); reset(); return; }
        const waliId = waliData.data.id;

        // 3. Buat relasi
        const relRes = await fetch(`${API_BASE}/relasi.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siswa_id: siswaId, wali_id: waliId, tipe: relTipe })
        });
        const relData = await relRes.json();
        if (!relData.success) { showToast('⚠ Gagal buat relasi: ' + relData.message, 'error'); reset(); return; }

        showToast('✅ Siswa, Wali, dan Relasi berhasil disimpan ke database!', 'success');
        e.target.reset();
        switchRelasiTab('pilih');
        loadRelasiData();
        reset();

    } catch (err) {
        showToast('⚠ Koneksi gagal. Pastikan Laragon aktif.', 'error');
        reset();
    }
}

// ======== HANDLE TAMBAH WALI SAJA ========
async function handleTambahWaliSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyimpan...`;

    const payload = {
        nama: document.getElementById('wali-only-nama').value.trim(),
        email: document.getElementById('wali-only-email').value.trim(),
        telepon: document.getElementById('wali-only-telepon').value.trim(),
        pekerjaan: document.getElementById('wali-only-pekerjaan').value.trim(),
        status: document.getElementById('wali-only-status').value,
        alamat: document.getElementById('wali-only-alamat').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/wali.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Data Wali berhasil disimpan ke database!', 'success');
            e.target.reset();
            toggleTambahWaliPanel();
            loadRelasiData(); // Refresh dropdown wali
        } else {
            showToast('⚠ Gagal: ' + data.message, 'error');
        }
    } catch (err) {
        showToast('⚠ Koneksi gagal. Pastikan Laragon aktif.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-user-plus text-2xs"></i> Simpan Data Wali`;
}

// ======== TOGGLE PANEL TAMBAH WALI ========
function toggleTambahWaliPanel() {
    const panel = document.getElementById('tambah-wali-panel');
    const chevron = document.getElementById('tambah-wali-chevron');
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
}

// ======== UPDATE PROFIL WALI (Parent Portal) ========
async function openUpdateProfilWali() {
    // Cari wali berdasarkan nama user yang login
    const userName = appState.currentUser?.nama || 'Budi Santoso';

    try {
        // Ambil daftar wali, cari yang namanya cocok
        const res = await fetch(`${API_BASE}/wali.php`);
        const data = await res.json();

        let wali = null;
        if (data.success && data.data.length > 0) {
            wali = data.data.find(w => w.nama === userName);
            if (!wali) wali = data.data[0]; // fallback ke wali pertama
        }

        if (!wali) {
            showToast('\u26a0 Data wali tidak ditemukan di database.', 'error');
            return;
        }

        // Ambil detail lengkap wali
        const detailRes = await fetch(`${API_BASE}/wali.php?id=${wali.id}`);
        const detailData = await detailRes.json();

        if (!detailData.success) {
            showToast('\u26a0 Gagal mengambil data profil wali.', 'error');
            return;
        }

        const w = detailData.data;

        const existing = document.getElementById('update-profil-wali-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'update-profil-wali-modal';
        modal.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `<div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-lg text-slate-900">Update Profil Wali</h3>
                <button onclick="document.getElementById('update-profil-wali-modal').remove()" class="text-slate-400 hover:text-slate-600 text-lg"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">${(w.nama || '').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}</div>
                <div>
                    <p class="font-bold text-slate-900 text-sm">${w.nama}</p>
                    <p class="text-3xs text-blue-600 font-medium">ID Wali: ${w.id}</p>
                </div>
            </div>

            <form onsubmit="submitUpdateProfilWali(event, ${w.id})" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-3xs font-bold text-slate-400 uppercase">Nama Lengkap</label>
                    <input type="text" id="upw-nama" value="${w.nama || ''}" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Email</label>
                        <input type="email" id="upw-email" value="${w.email || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white">
                    </div>
                    <div class="space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Telepon</label>
                        <input type="text" id="upw-telepon" value="${w.telepon || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white">
                    </div>
                </div>
                <div class="space-y-1">
                    <label class="text-3xs font-bold text-slate-400 uppercase">Pekerjaan</label>
                    <input type="text" id="upw-pekerjaan" value="${w.pekerjaan || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white">
                </div>
                <div class="space-y-1">
                    <label class="text-3xs font-bold text-slate-400 uppercase">Alamat</label>
                    <textarea id="upw-alamat" rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 bg-white resize-none">${w.alamat || ''}</textarea>
                </div>
                <div class="flex gap-3 pt-1">
                    <button type="button" onclick="document.getElementById('update-profil-wali-modal').remove()" class="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50">Batal</button>
                    <button type="submit" id="upw-submit-btn" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2">
                        <i class="fa-solid fa-check text-2xs"></i> Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    } catch (err) {
        console.error('Error fetching wali profile:', err);
        showToast('\u26a0 Gagal memuat data profil. Coba lagi.', 'error');
    }
}

async function submitUpdateProfilWali(event, waliId) {
    event.preventDefault();
    const btn = document.getElementById('upw-submit-btn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyimpan...`;

    const payload = {
        nama:      document.getElementById('upw-nama').value.trim(),
        email:     document.getElementById('upw-email').value.trim(),
        telepon:   document.getElementById('upw-telepon').value.trim(),
        pekerjaan: document.getElementById('upw-pekerjaan').value.trim(),
        alamat:    document.getElementById('upw-alamat').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/wali.php?id=${waliId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('update-profil-wali-modal').remove();
            showToast('\u2705 Profil wali berhasil diperbarui!', 'success');

            // Update tampilan di parent portal secara real-time
            const portalPage = document.getElementById('page-parent-portal');
            if (portalPage) {
                const nameEl = portalPage.querySelector('.font-bold.text-slate-900.text-sm');
                const emailEl = portalPage.querySelector('.text-3xs.text-slate-400');
                const welcomeEl = portalPage.querySelector('h2.text-xl');
                if (nameEl) nameEl.textContent = payload.nama;
                if (emailEl) emailEl.textContent = payload.email;
                if (welcomeEl) welcomeEl.textContent = `Selamat Datang, ${payload.nama}`;
            }

            // Update sidebar user name
            document.getElementById('user-fullname').textContent = payload.nama;
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) {
        console.error('Error updating wali profile:', err);
        showToast('\u26a0 Gagal menyimpan perubahan. Coba lagi.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check text-2xs"></i> Simpan Perubahan`;
}

// ======== TOAST NOTIFICATION ========
function showToast(msg, type = 'success') {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const colorMap = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-amber-500'
    };
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `fixed bottom-6 right-6 z-[100] ${colorMap[type] || colorMap.info} text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transition-all opacity-0 translate-y-2`;
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}


const _origDOMReady = window.onload;
window.addEventListener('DOMContentLoaded', () => {
    // Password toggle
    const eyeBtn = document.querySelector('#login-password ~ span');
    if (eyeBtn) eyeBtn.addEventListener('click', togglePasswordVisibility);

    // Search
    initSearch();

    // Radio buttons
    setTimeout(initRadioButtons, 500);

    // Relasi filter
    setTimeout(initRelasiFilter, 500);
});