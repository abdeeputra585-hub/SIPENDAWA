// --- LOGIN ROLE TOGGLE ---
let currentLoginRole = 'admin';
window.setLoginRole = function(role) {
    currentLoginRole = role;
    const btns = [
        document.getElementById('login-toggle-admin'),
        document.getElementById('login-toggle-kepsek'),
        document.getElementById('login-toggle-parent')
    ];
    btns.forEach(btn => {
        if(btn) btn.className = "w-1/3 py-2 text-xs font-bold rounded-lg transition-all text-slate-500";
    });
    let activeBtn;
    if (role === 'admin') activeBtn = document.getElementById('login-toggle-admin');
    else if (role === 'kepala_sekolah') activeBtn = document.getElementById('login-toggle-kepsek');
    else if (role === 'parent') activeBtn = document.getElementById('login-toggle-parent');
    
    if (activeBtn) {
        activeBtn.className = "w-1/3 py-2 text-xs font-bold rounded-lg transition-all bg-white text-blue-700 shadow-xs";
    }

    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if(emailInput && passInput) {
        if (role === 'admin') {
            emailInput.value = 'admin@sipendawa.com';
            passInput.value = 'admin123';
        } else if (role === 'kepala_sekolah') {
            emailInput.value = 'kepsek@sipendawa.com';
            passInput.value = 'kepsek123';
        } else if (role === 'parent') {
            emailInput.value = 'ortu_budi@gmail.com';
            passInput.value = 'ortu123';
        }
    }
};
let currentPath = window.location.pathname;
if (currentPath.endsWith('.html') || currentPath.endsWith('.php')) {
    currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
}
if (currentPath.endsWith('/')) {
    currentPath = currentPath.slice(0, -1);
}
const API_BASE = currentPath + '/api';

let appState = {
    currentRole: 'admin',
    currentTab: 'admin-dashboard',
    currentUser: null,
    token: localStorage.getItem('SIPENDAWA_token') || null
};

/**
 * Helper: header standar dengan Authorization JWT token
 * Dipakai di semua fetch POST/PUT/DELETE
 */
function authHeaders(extraHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    if (appState.token) headers['Authorization'] = 'Bearer ' + appState.token;
    return headers;
}

const navigationMenus = {
    admin: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'admin-kelas', label: 'Master Kelas', icon: 'fa-school' },
        { id: 'admin-mapel', label: 'Mata Pelajaran', icon: 'fa-book' },
        { id: 'admin-guru', label: 'Kelola Guru', icon: 'fa-chalkboard-user' },
        { id: 'admin-siswa', label: 'Kelola Siswa', icon: 'fa-user-graduate' },
        { id: 'admin-relasi', label: 'Relasi Data', icon: 'fa-link' },
        { id: 'admin-pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn' },
        { id: 'admin-izin', label: 'Kehadiran & Izin', icon: 'fa-user-check' },
        { id: 'admin-laporan', label: 'Laporan', icon: 'fa-file-invoice-dollar' },
        { id: 'admin-keuangan', label: 'Kelola Keuangan', icon: 'fa-money-check-dollar' },
        { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: 0 }
    ],
    kepala_sekolah: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'admin-kelas', label: 'Master Kelas', icon: 'fa-school' },
        { id: 'admin-mapel', label: 'Mata Pelajaran', icon: 'fa-book' },
        { id: 'admin-pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn' },
        { id: 'admin-izin', label: 'Kehadiran & Izin', icon: 'fa-user-check' },
        { id: 'admin-laporan', label: 'Laporan', icon: 'fa-file-invoice-dollar' },
        { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: 0 }
    ],
    guru: [
        { id: 'guru-nilai', label: 'Input Nilai Siswa', icon: 'fa-star' },
        { id: 'guru-kehadiran', label: 'Kehadiran Kelas', icon: 'fa-calendar-check' },
        { id: 'guru-catatan', label: 'Jurnal / Catatan', icon: 'fa-clipboard-user' },
        { id: 'admin-izin', label: 'Kehadiran & Izin', icon: 'fa-user-check' },
        { id: 'chat', label: 'Pesan / Obrolan', icon: 'fa-comments', badge: 0 },
        { id: 'admin-pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn' },
        { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: 0 },
        { id: 'guru-profil', label: 'Profil Saya', icon: 'fa-circle-user' }
    ],
    parent: [
        { id: 'parent-portal', label: 'Dashboard Portal', icon: 'fa-chart-line' },
        { id: 'parent-pengumuman', label: 'Pusat Info', icon: 'fa-bullhorn', badge: 0 },
        { id: 'parent-izin', label: 'Pengajuan Izin', icon: 'fa-calendar-plus' },
        { id: 'profil-siswa', label: 'Profil Anak', icon: 'fa-user-graduate' },
        { id: 'parent-pembayaran', label: 'Tagihan & Pembayaran', icon: 'fa-file-invoice-dollar' },
        { id: 'parent-nilai', label: 'Laporan Akademik', icon: 'fa-book-open' },
        { id: 'parent-catatan', label: 'Catatan Perilaku', icon: 'fa-clipboard-user' },
        { id: 'chat', label: 'Pesan Guru', icon: 'fa-comments', badge: 0 },
        { id: 'notifikasi', label: 'Pusat Notifikasi', icon: 'fa-bell', badge: 0 }
    ]
};

const userCredentialsMock = {
    admin: { name: 'Haryanto Putro', title: 'Super Administrator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' },
    kepala_sekolah: { name: 'Drs. Ahmad Dahlan', title: 'Kepala Sekolah', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
    guru: { name: 'Budi Santoso, S.Pd.', title: 'Guru / Tenaga Pendidik', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
    parent: { name: 'Budi Santoso', title: 'Wali Murid (Orang Tua)', avatar: 'https://i1-c.pinimg.com/736x/69/c1/27/69c127c94e626793d5df6f274e187627.jpg' }
};

window.addEventListener('DOMContentLoaded', () => {
    showRoute('login');
    // Inisialisasi Google Sign-In setelah library dimuat
    initGoogleSignIn();
});

// ======== GOOGLE SIGN-IN ========

/**
 * Inisialisasi Google Identity Services
 * Dipanggil saat DOMContentLoaded
 */
function initGoogleSignIn() {
    if (typeof google === 'undefined') {
        setTimeout(initGoogleSignIn, 800);
        return;
    }

    const clientId = typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : '';

    if (!clientId || clientId.includes('GANTI_DENGAN')) {
        const btn = document.getElementById('google-login-btn');
        if (btn) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.onclick = () => showGoogleError('⚙ Google Client ID belum dikonfigurasi.');
        }
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
        });
        console.log('✅ Google Sign-In berhasil diinisialisasi');
    } catch (err) {
        console.warn('Google Sign-In init error:', err);
    }
}

/**
 * Dipanggil saat tombol "Masuk dengan Google" diklik
 */
function signInWithGoogle() {
    const clientId = typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : '';

    if (!clientId || clientId.includes('GANTI_DENGAN')) {
        showGoogleError('⚙ Google Client ID belum dikonfigurasi.');
        return;
    }

    if (typeof google === 'undefined') {
        showGoogleError('⚠ Library Google belum dimuat. Periksa koneksi internet.');
        return;
    }

    hideGoogleError();
    setGoogleBtnLoading(true);

    // Coba One Tap prompt dulu, jika gagal/diblokir fallback ke popup OAuth
    try {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                setGoogleBtnLoading(false);
                openGoogleOAuthPopup(clientId);
            }
        });
    } catch (err) {
        setGoogleBtnLoading(false);
        openGoogleOAuthPopup(clientId);
    }
}

/**
 * Buka popup OAuth Google — fallback andal jika One Tap diblokir
 */
function openGoogleOAuthPopup(clientId) {
    const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
    const redirectUri = encodeURIComponent(base + 'google-callback.html');
    const scope      = encodeURIComponent('openid email profile');
    const nonce      = btoa(Math.random().toString()).replace(/=/g, '');
    const state      = btoa(Date.now().toString());
    sessionStorage.setItem('google_oauth_state', state);

    const oauthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${nonce}&state=${state}`;

    const w = 500, h = 600;
    const left = window.screenX + (window.outerWidth  - w) / 2;
    const top  = window.screenY + (window.outerHeight - h) / 2;

    setGoogleBtnLoading(true);
    const popup = window.open(oauthUrl, 'google-login',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`);

    if (!popup) {
        setGoogleBtnLoading(false);
        showGoogleError('⚠ Popup diblokir! Izinkan popup untuk situs ini di browser lalu coba lagi.');
        return;
    }

    const onMsg = (event) => {
        if (event.origin !== window.location.origin) return;
        if (!event.data || !event.data.type) return;
        window.removeEventListener('message', onMsg);
        clearInterval(checkClosed);
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            popup.close();
            handleGoogleSignIn({ credential: event.data.id_token });
        } else {
            setGoogleBtnLoading(false);
            showGoogleError('⚠ ' + (event.data.message || 'Login Google dibatalkan.'));
        }
    };
    window.addEventListener('message', onMsg);

    const checkClosed = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', onMsg);
            setGoogleBtnLoading(false);
        }
    }, 500);
}

/**
 * Callback dari Google Identity Services setelah user memilih akun
 * response.credential = ID Token dari Google
 */
async function handleGoogleSignIn(response) {
    setGoogleBtnLoading(true);
    hideGoogleError();

    try {
        const res = await fetch(`${API_BASE}/auth/google.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: response.credential })
        });

        const data = await res.json();

        if (data.success) {
            // Simpan token
            appState.token = data.token;
            localStorage.setItem('SIPENDAWA_token', data.token);
            appState.currentUser = data.data;

            showToast('✅ ' + data.message, 'success');
            loginAs(data.data.role, data.data);
        } else {
            showGoogleError('⚠ ' + (data.message || 'Login Google gagal. Coba lagi.'));
        }
    } catch (err) {
        console.error('Google login error:', err);
        showGoogleError('⚠ Gagal terhubung ke server. Pastikan Laragon aktif.');
    } finally {
        setGoogleBtnLoading(false);
    }
}

/** Tampilkan/sembunyikan loading state di tombol Google */
function setGoogleBtnLoading(loading) {
    const btn = document.getElementById('google-login-btn');
    const text = document.getElementById('google-btn-text');
    const spinner = document.getElementById('google-btn-spinner');
    if (!btn) return;
    btn.disabled = loading;
    if (text) text.textContent = loading ? 'Memproses...' : 'Masuk dengan Google';
    if (spinner) spinner.classList.toggle('hidden', !loading);
}

/** Tampilkan pesan error di bawah tombol Google */
function showGoogleError(msg) {
    const el = document.getElementById('google-error-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 7000);
}

/** Sembunyikan pesan error Google */
function hideGoogleError() {
    const el = document.getElementById('google-error-msg');
    if (el) el.classList.add('hidden');
}



function showRoute(routeId) {
    // Sembunyikan semua route
    document.querySelectorAll('.route-view').forEach(view => view.classList.add('hidden'));

    // Tampilkan route yang dipilih
    const routeEl = document.getElementById('route-' + routeId);
    if (routeEl) {
        routeEl.classList.remove('hidden');
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
            // Simpan JWT token ke state dan localStorage
            if (data.token) {
                appState.token = data.token;
                localStorage.setItem('SIPENDAWA_token', data.token);
            }
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
    document.getElementById('user-role-title').innerText = role === 'admin' ? 'Super Administrator' : (role === 'kepala_sekolah' ? 'Kepala Sekolah' : (role === 'guru' ? 'Guru' : 'Wali Murid (Orang Tua)'));
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
    } else if (role === 'guru') {
        brandLogo.className = "w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-md";
        brandLogo.innerHTML = `<i class="fa-solid fa-chalkboard-user"></i>`;
        brandTitle.innerText = "Teacher Panel";
        brandSub.innerText = "School Education";
        appState.currentTab = 'guru-nilai';
        document.getElementById('topbar-context-title').innerText = "Portal Guru & Manajemen Akademik";
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
    
    if (appState.currentRole === 'parent') {
        updatePengumumanBadge();
    }
    if (typeof initGlobalChatPolling === 'function') initGlobalChatPolling();
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
            innerHTML += `<span id="menu-badge-${menu.id}" class="sidebar-notif-badge bg-red-500 text-white text-4xs font-black px-1.5 py-0.5 rounded-full ${menu.badge === 0 ? 'hidden' : ''}">${menu.badge}</span>`;
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

    if (tabId === 'admin-dashboard') loadDashboardData();
    if (tabId === 'admin-kelas') loadDataKelas();
    if (tabId === 'admin-mapel') loadDataMapel();
    if (tabId === 'admin-guru') {
        if (typeof showAdminGuruPage === 'function') showAdminGuruPage();
    }
    if (tabId === 'admin-siswa') { loadSiswaData(); initKelasFilter(); }
    if (tabId === 'admin-relasi') { loadRelasiData(); setTimeout(initRelasiFilter, 300); }
    if (tabId === 'admin-laporan') { loadLaporanData(); setTimeout(initLaporanKelasFilter, 300); }
    if (tabId === 'admin-pengumuman') {
        if (typeof showAdminPengumumanPage === 'function') showAdminPengumumanPage();
    }
    if (tabId === 'admin-keuangan') {
        if (typeof showAdminKeuanganPage === 'function') showAdminKeuanganPage();
    }
    if (tabId === 'guru-nilai') { loadGuruNilaiData(); }
    if (tabId === 'guru-kehadiran') { loadGuruKehadiran(); }
    if (tabId === 'guru-catatan') { loadGuruCatatan(); }
    if (tabId === 'parent-nilai') { loadParentNilaiData(); }
    if (tabId === 'parent-catatan') { loadParentCatatan(); }
    if (tabId === 'parent-pengumuman') {
        if (typeof showParentPengumumanPage === 'function') showParentPengumumanPage();
    }
    if (tabId === 'notifikasi') loadNotifikasiData();
    if (tabId === 'parent-portal') { loadParentPortal(); loadPengumumanWali(); }
    if (tabId === 'profil-siswa') { loadProfilSiswa(); }
    if (tabId === 'admin-izin') {
        if (typeof showAdminIzinPage === 'function') showAdminIzinPage();
    }
    if (tabId === 'parent-izin') {
        if (typeof showParentIzinPage === 'function') showParentIzinPage();
    }
    if (tabId === 'parent-portal') {
        if (typeof showParentDashboardPage === 'function') showParentDashboardPage();
    }
    if (tabId === 'parent-pembayaran') {
        if (typeof showParentPembayaranPage === 'function') showParentPembayaranPage();
    }
    if (tabId === 'guru-profil') {
        if (typeof showGuruProfilPage === 'function') showGuruProfilPage();
    }
    if (tabId === 'chat') { 
        if (typeof showChatPage === 'function') showChatPage(); 
    } else {
        if (typeof chatPollingInterval !== 'undefined' && chatPollingInterval) {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }
    }
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
                    let targetTab = 'notifikasi';
                    const judul = a.judul.toLowerCase();
                    if (judul.includes('relasi')) targetTab = 'admin-relasi';
                    else if (judul.includes('wali') && judul.includes('terdaftar')) targetTab = 'admin-siswa';
                    else if (judul.includes('sinkron') || judul.includes('dapodik')) targetTab = 'admin-siswa';
                    else if (judul.includes('verifikasi')) targetTab = 'notifikasi';
                    else if (judul.includes('laporan')) targetTab = 'admin-laporan';
                    else if (judul.includes('pengumuman')) targetTab = 'admin-pengumuman';

                    const timeAgo = getTimeAgo(a.created_at);
                    container.innerHTML += `<div class="relative mb-2 cursor-pointer hover:opacity-80 transition-opacity" onclick="switchTab('${targetTab}')">
                        <span class="absolute -left-6 w-3 h-3 bg-${dotColor}-500 rounded-full border-2 border-white mt-0.5"></span>
                        <p class="font-bold text-slate-900">${a.judul}</p>
                        <p class="text-3xs text-slate-400">${a.pesan.substring(0, 60)}${a.pesan.length > 60 ? '...' : ''} • ${timeAgo}</p>
                    </div>`;
                });
            }
        }

        // Load charts & antrian verifikasi
        await loadDashboardCharts();
        if (appState.currentRole === 'admin') loadAntrianVerifikasi();

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
                    <td class="px-6 py-3.5">
                        <div class="flex items-center gap-2.5">
                            <div class="relative group cursor-pointer" onclick="openUploadFoto('siswa',${s.id},'${s.nama.replace(/'/g, "\\'")}')"
                                title="Upload foto siswa">
                                ${s.foto
                        ? `<img src="${s.foto}" class="w-7 h-7 rounded-full object-cover border border-slate-200">`
                        : `<div class="w-7 h-7 bg-${color}-100 text-${color}-700 rounded-full flex items-center justify-center text-3xs font-bold">${initials}</div>`
                    }
                                <div class="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <i class="fa-solid fa-camera text-white text-3xs"></i>
                                </div>
                            </div>
                            ${s.nama}
                        </div>
                    </td>
                    <td class="px-6 py-3.5">${s.kelas}</td>
                    <td class="px-6 py-3.5">${s.jenis_kelamin}</td>
                    <td class="px-6 py-3.5"><span class="${statusClass} text-3xs font-bold px-2 py-0.5 rounded-full">${s.status}</span></td>
                    <td class="px-6 py-3.5 text-center text-slate-400 text-sm">
                        <button class="hover:text-blue-600 mx-1" title="Upload Foto" onclick="openUploadFoto('siswa',${s.id},'${s.nama.replace(/'/g, "\\'")}')"><i class="fa-solid fa-camera text-xs"></i></button>
                        <button class="hover:text-green-600 mx-1" title="Hubungkan dengan Wali" onclick="openHubungkanWaliModal(${s.id},'${s.nama.replace(/'/g, "\\'")}')"><i class="fa-solid fa-link text-xs"></i></button>
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
        const res = await fetch(`${API_BASE}/siswa.php?id=${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('\u2705 Siswa berhasil dihapus!', 'success');
            loadSiswaData();
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) {
        showToast('\u26a0 Gagal menghapus siswa', 'error');
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
        const res = await fetch(`${API_BASE}/relasi.php?id=${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('\u2705 Relasi berhasil dihapus!', 'success');
            loadRelasiData();
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) {
        showToast('\u26a0 Gagal menghapus relasi', 'error');
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
    const tipe = document.getElementById('edit-relasi-tipe').value;
    const status = document.getElementById('edit-relasi-status').value;
    try {
        const res = await fetch(`${API_BASE}/relasi.php?id=${id}`, {
            method: 'PUT',
            headers: authHeaders(),
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
    menu.style.top = (rect.bottom + 6) + 'px';
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
        const res = await fetch(`${API_BASE}/wali.php?id=${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
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
            headers: authHeaders(),
            body: JSON.stringify({ siswa_id: siswaId, wali_id: waliId, tipe: tipe })
        });
        const data = await res.json();

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk text-2xs"></i> Simpan Relasi`;
            ajaxLoader.classList.add('hidden');

            if (data.success) {
                showToast('\u2705 Relasi berhasil disimpan ke database!', 'success');
                loadRelasiData();
                document.getElementById('rel-siswa').value = '';
                document.getElementById('rel-wali').value = '';
            } else {
                showToast('\u26a0 Gagal: ' + data.message, 'error');
            }
        }, 800);
    } catch (err) {
        console.warn('API error:', err);
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk text-2xs"></i> Simpan Relasi`;
            ajaxLoader.classList.add('hidden');
            showToast('\u26a0 Gagal terhubung ke server. Pastikan Laragon aktif.', 'error');
        }, 800);
    }
}

// ======== LOAD LAPORAN DATA ========
async function loadLaporanData(kelas = '', dari = '', sampai = '') {
    try {
        let url = `${API_BASE}/laporan.php?`;
        const params = [];
        if (kelas) params.push(`kelas=${encodeURIComponent(kelas)}`);
        if (dari) params.push(`dari=${encodeURIComponent(dari)}`);
        if (sampai) params.push(`sampai=${encodeURIComponent(sampai)}`);
        url += params.join('&');

        const res = await fetch(url, { headers: authHeaders() });
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
    const kelas = document.getElementById('laporan-filter-kelas')?.value || '';
    const dari = document.getElementById('laporan-tgl-dari')?.value || '';
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
        const url = userId ? `${API_BASE}/notifikasi.php?user_id=${userId}&_t=` + Date.now() : `${API_BASE}/notifikasi.php?_t=` + Date.now();
        const res = await fetch(url, { headers: authHeaders() });
        const data = await res.json();

        // Update summary panel
        const unreadEl = document.getElementById('notif-summary-unread');
        const totalEl = document.getElementById('notif-summary-total');
        if (unreadEl) unreadEl.textContent = (data.belum_dibaca || 0) + ' Belum Dibaca';
        if (totalEl) totalEl.textContent = (data.total || 0) + ' Total';

        if (!data.success) {
            const container = document.getElementById('notif-list-container');
            if (container) container.innerHTML = '<div class="flex flex-col items-center justify-center p-8 text-slate-400 bg-white border border-slate-200 rounded-2xl"><i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i><p>Gagal memuat notifikasi. Coba refresh halaman.</p></div>';
            return;
        }

        const container = document.getElementById('notif-list-container');
        if (container) {
            container.innerHTML = '';
            if (data.data && data.data.length > 0) {
                data.data.forEach(n => {
                    const iconMap = { info: 'fa-circle-exclamation text-blue-600', success: 'fa-circle-check text-emerald-600', warning: 'fa-triangle-exclamation text-amber-600', error: 'fa-circle-xmark text-red-600' };
                    const borderMap = { info: 'border-blue-600', success: 'border-emerald-600', warning: 'border-amber-600', error: 'border-red-600' };
                    const bgMap = { info: 'bg-blue-50', success: 'bg-emerald-50', warning: 'bg-amber-50', error: 'bg-red-50' };
                    const icon = iconMap[n.tipe] || iconMap.info;
                    const border = borderMap[n.tipe] || borderMap.info;
                    const bg = bgMap[n.tipe] || bgMap.info;
                    const timeStr = n.created_at ? new Date(n.created_at).toLocaleString('id-ID', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';

                    container.innerHTML += `<div class="bg-white border-l-4 ${border} p-4 border border-slate-200 rounded-r-2xl flex gap-3 ${n.dibaca == 0 ? '' : 'opacity-60'}" style="background:#fff;">
                        <div class="w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-xs shrink-0"><i class="fa-solid ${icon}"></i></div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start gap-2">
                                <h5 class="font-bold text-slate-900 text-sm">${n.judul}</h5>
                                ${n.dibaca == 0 ? '<span class="shrink-0 inline-block w-2 h-2 bg-blue-500 rounded-full mt-1"></span>' : ''}
                            </div>
                            <p class="text-xs text-slate-500 mt-0.5">${n.pesan}</p>
                            <p class="text-3xs text-slate-400 mt-1">${timeStr}${n.user_nama ? ' &bull; oleh ' + n.user_nama : ''}</p>
                        </div>
                    </div>`;
                });
            } else {
                container.innerHTML = '<div class="flex flex-col items-center justify-center p-8 text-slate-400 bg-white border border-slate-200 rounded-2xl"><i class="fa-regular fa-bell text-3xl mb-2"></i><p>Tidak ada notifikasi saat ini.</p></div>';
            }
        }
    } catch (err) {
        console.warn('Notifikasi API belum aktif:', err);
        const container = document.getElementById('notif-list-container');
        if (container) container.innerHTML = '<div class="flex flex-col items-center justify-center p-8 text-slate-400 bg-white border border-slate-200 rounded-2xl"><i class="fa-solid fa-wifi-slash text-2xl mb-2"></i><p>Koneksi bermasalah. Periksa jaringan Anda.</p></div>';
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
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Tanggal Lahir</p><p class="font-semibold text-slate-700 mt-1">${s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'}) : '-'}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Kelas</p><p class="font-semibold text-slate-700 mt-1">${s.kelas}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Jenis Kelamin</p><p class="font-semibold text-slate-700 mt-1">${s.jenis_kelamin}</p></div>
                    <div><p class="text-3xs font-bold text-slate-400 uppercase">Status</p><p class="font-semibold text-slate-700 mt-1">${s.status}</p></div>
                    <div class="col-span-2"><p class="text-3xs font-bold text-slate-400 uppercase">Alamat</p><p class="font-semibold text-slate-700 mt-1">${s.alamat || '-'}</p></div>
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

// ======== PENGUMUMAN BADGE ========
async function updatePengumumanBadge() {
    if (appState.currentRole !== 'parent') return;
    try {
        const res = await fetch(API_BASE + '/pengumuman/unread-count.php', { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            const badge = document.getElementById('menu-badge-parent-pengumuman');
            if (badge) {
                badge.textContent = data.data.unread;
                if (data.data.unread > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }
        }
    } catch (e) { console.error('Error updating pengumuman badge:', e); }
}

// ======== SUBMIT KEHADIRAN ========
async function submitKehadiran(event, siswaId) {
    event.preventDefault();
    const tanggal = document.getElementById('keh-tanggal').value;
    const status = document.getElementById('keh-status').value;
    const keterangan = document.getElementById('keh-keterangan').value;
    const btn = event.target.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyimpan...`;

    try {
        const res = await fetch(`${API_BASE}/kehadiran.php`, {
            method: 'POST',
            headers: authHeaders(),
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
                            ${attData.data.history && attData.data.history.length > 0 ? `<div class="mt-3 bg-slate-50 rounded-xl p-3"><p class="text-3xs font-bold text-slate-500 uppercase mb-2">Riwayat Terbaru</p><div class="space-y-2">${attData.data.history.map(h => { const c = h.status === 'Hadir' ? 'emerald' : (h.status === 'Izin' ? 'blue' : (h.status === 'Sakit' ? 'amber' : 'red')); return '<div class="flex justify-between items-center text-xs"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-' + c + '-500"></span><span class="text-slate-600">' + h.tanggal + '</span></div><span class="font-bold text-' + c + '-600">' + h.status + (h.keterangan ? ' (' + h.keterangan + ')' : '') + '</span></div>'; }).join('')}</div></div>` : ''}`;
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
                <div class="space-y-1"><label class="text-3xs font-bold text-slate-400 uppercase">Tanggal Lahir</label><input type="date" id="edit-tgl-lahir" value="${s.tanggal_lahir || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"></div>
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
            headers: authHeaders(),
            body: JSON.stringify({
                nisn: document.getElementById('edit-nisn').value,
                nama: document.getElementById('edit-nama').value,
                tanggal_lahir: document.getElementById('edit-tgl-lahir').value || null,
                kelas: document.getElementById('edit-kelas').value,
                jenis_kelamin: document.getElementById('edit-jk').value,
                status: document.getElementById('edit-status').value,
                alamat: document.getElementById('edit-alamat').value
            })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('edit-modal').remove();
            showToast('\u2705 Data siswa berhasil diperbarui!', 'success');
            loadSiswaData();
        } else {
            showToast('\u26a0 ' + data.message, 'error');
        }
    } catch (err) { showToast('\u26a0 Gagal menyimpan perubahan', 'error'); }
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
        await fetch(`${API_BASE}/notifikasi.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ id: id })
        });
        if (el) el.classList.add('opacity-60');
    } catch (err) { console.warn('Mark read error:', err); }
}

// ======== LOGOUT CLEANUP ========
function performLogout() {
    // Hapus token dari state dan localStorage
    appState.currentUser = null;
    appState.currentRole = 'admin';
    appState.currentTab = 'admin-dashboard';
    appState.token = null;
    localStorage.removeItem('SIPENDAWA_token');
    
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
    
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
            <div class="p-3 bg-slate-50 rounded-xl"><p class="font-bold text-slate-700">Versi Sistem</p><p class="text-slate-400 mt-1">SIPENDAWA v1.2.0</p></div>
        </div>
        <div class="pt-4 border-t border-slate-100">
            <button onclick="performLogout(); document.getElementById('settings-modal').remove();" class="w-full flex items-center justify-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all">
                <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i> Keluar Sistem
            </button>
        </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ======== DARK MODE TOGGLE ========
function toggleDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark');
        localStorage.setItem('SIPENDAWA-dark', 'true');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('SIPENDAWA-dark', 'false');
    }
}

// Apply saved dark mode on page load
(function () {
    // Reset dark mode otomatis supaya halaman tidak blank
    localStorage.removeItem('SIPENDAWA-dark');
    document.body.classList.remove('dark');
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
                    <div class="col-span-2 space-y-1">
                        <label class="text-3xs font-bold text-slate-400 uppercase">Tanggal Lahir</label>
                        <input type="date" id="ts-tgl-lahir"
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
        tanggal_lahir: document.getElementById('ts-tgl-lahir').value || null,
        kelas: document.getElementById('ts-kelas').value.trim(),
        jenis_kelamin: document.getElementById('ts-jk').value,
        status: document.getElementById('ts-status').value,
        alamat: document.getElementById('ts-alamat').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/siswa.php`, {
            method: 'POST',
            headers: authHeaders(),
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
            headers: authHeaders(),
            body: JSON.stringify({ nisn: siswaNisn, nama: siswaNama, kelas: siswaKelas, jenis_kelamin: siswaJk, status: 'Aktif' })
        });
        const siswaData = await siswaRes.json();
        if (!siswaData.success) { showToast('\u26a0 Gagal tambah siswa: ' + siswaData.message, 'error'); reset(); return; }
        const siswaId = siswaData.data.id;

        // 2. Buat wali baru
        const waliRes = await fetch(`${API_BASE}/wali.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ nama: waliNama, email: waliEmail, telepon: waliTelp, pekerjaan: waliKerja, status: 'Terverifikasi' })
        });
        const waliData = await waliRes.json();
        if (!waliData.success) { showToast('\u26a0 Gagal tambah wali: ' + waliData.message, 'error'); reset(); return; }
        const waliId = waliData.data.id;

        // 3. Buat relasi
        const relRes = await fetch(`${API_BASE}/relasi.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ siswa_id: siswaId, wali_id: waliId, tipe: relTipe })
        });
        const relData = await relRes.json();
        if (!relData.success) { showToast('\u26a0 Gagal buat relasi: ' + relData.message, 'error'); reset(); return; }

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
            headers: authHeaders(),
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
                <div class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">${(w.nama || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
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
        nama: document.getElementById('upw-nama').value.trim(),
        email: document.getElementById('upw-email').value.trim(),
        telepon: document.getElementById('upw-telepon').value.trim(),
        pekerjaan: document.getElementById('upw-pekerjaan').value.trim(),
        alamat: document.getElementById('upw-alamat').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/wali.php?id=${waliId}`, {
            method: 'PUT',
            headers: authHeaders(),
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

// ============================================================
// A) CHART.JS DASHBOARD
// ============================================================

/** Simpan instance chart agar bisa di-destroy sebelum re-render */
const chartInstances = {};

/**
 * Load semua data chart dan render ke canvas
 */
async function loadDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    try {
        const [siswaRes, waliRes, kehadiranRes] = await Promise.all([
            fetch(`${API_BASE}/dashboard.php?action=chart_siswa`),
            fetch(`${API_BASE}/dashboard.php?action=chart_wali`),
            fetch(`${API_BASE}/dashboard.php?action=chart_kehadiran`)
        ]);

        const siswaData = await siswaRes.json();
        const waliData = await waliRes.json();
        const kehadiranData = await kehadiranRes.json();

        if (siswaData.success) renderDonutChart('chart-status-siswa', siswaData.data, 'chart-siswa-total', 'chart-siswa-legend');
        if (waliData.success) renderDonutChart('chart-status-wali', waliData.data, 'chart-wali-total', 'chart-wali-legend');
        if (kehadiranData.success) renderBarChart('chart-kehadiran', kehadiranData.data);

    } catch (err) {
        console.warn('Chart data error:', err);
    }
}

/** Render donut chart (status siswa / status wali) */
function renderDonutChart(canvasId, data, totalId, legendId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Hapus chart lama jika ada
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }

    const colorPalette = {
        'Aktif': '#10B981',
        'Terverifikasi': '#10B981',
        'Verifikasi': '#F59E0B',
        'Pending': '#F59E0B',
        'Ditolak': '#EF4444',
        'Alumni': '#6366F1',
        'Pindah': '#A855F7',
    };
    const defaultColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#64748B'];

    const bgColors = data.labels.map((l, i) => colorPalette[l] || defaultColors[i % defaultColors.length]);
    const total = data.values.reduce((a, b) => a + b, 0);

    chartInstances[canvasId] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{ data: data.values, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / total * 100)}%)`
                    }
                }
            }
        }
    });

    // Update angka total di tengah
    const totalEl = document.getElementById(totalId);
    if (totalEl) totalEl.textContent = total.toLocaleString();

    // Render legend custom
    const legendEl = document.getElementById(legendId);
    if (legendEl) {
        legendEl.innerHTML = data.labels.map((l, i) =>
            `<span class="flex items-center gap-1" style="color:${bgColors[i]}">
                <span class="w-2 h-2 rounded-full inline-block" style="background:${bgColors[i]}"></span>
                ${l}: ${data.values[i]}
            </span>`
        ).join('');
    }
}

/** Render bar chart (kehadiran bulanan) */
function renderBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }

    chartInstances[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                { label: 'Hadir', data: data.hadir, backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 6 },
                { label: 'Izin/Sakit', data: data.izin, backgroundColor: 'rgba(245, 158, 11, 0.8)', borderRadius: 6 },
                { label: 'Alpa', data: data.alpa, backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 8, boxWidth: 10 } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                y: { grid: { color: 'rgba(200,200,200,0.1)' }, ticks: { font: { size: 9 }, precision: 0 }, beginAtZero: true }
            }
        }
    });
}


// ============================================================
// B) APPROVE / REJECT VERIFIKASI WALI
// ============================================================

/** Load antrian verifikasi wali di dashboard */
async function loadAntrianVerifikasi() {
    const container = document.getElementById('antrian-verifikasi-list');
    const badge = document.getElementById('pending-count-badge');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/dashboard.php?action=antrian_verifikasi`);
        const data = await res.json();

        if (!data.success) { container.innerHTML = '<div class="p-4 text-xs text-slate-400 text-center">Gagal memuat data</div>'; return; }

        // Update badge
        if (badge) {
            badge.textContent = data.total;
            badge.classList.toggle('hidden', data.total === 0);
        }

        if (data.data.length === 0) {
            container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">
                <i class="fa-solid fa-circle-check text-emerald-500 text-xl mb-2 block"></i>
                Semua wali sudah terverifikasi!
            </div>`;
            return;
        }

        container.innerHTML = data.data.map(w => `
            <div class="flex items-center justify-between px-5 py-3 hover:bg-amber-50/50 transition-all">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                        ${w.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-xs text-slate-900">${w.nama}</p>
                        <p class="text-3xs text-slate-400">${w.email || '-'} ${w.telepon ? '• ' + w.telepon : ''}</p>
                    </div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="approveWali(${w.id}, '${w.nama.replace(/'/g, "\\'")}')"
                        class="text-2xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1">
                        <i class="fa-solid fa-check"></i> Setuju
                    </button>
                    <button onclick="rejectWali(${w.id}, '${w.nama.replace(/'/g, "\\'")}')"
                        class="text-2xs font-bold bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1">
                        <i class="fa-solid fa-xmark"></i> Tolak
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        if (container) container.innerHTML = '<div class="p-4 text-xs text-slate-400 text-center">API tidak tersedia</div>';
    }
}

/** Approve verifikasi wali */
async function approveWali(id, nama) {
    if (!confirm(`Setujui verifikasi wali "${nama}"?`)) return;
    try {
        const res = await fetch(`${API_BASE}/wali.php?id=${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status: 'Terverifikasi' })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Wali "${nama}" berhasil diverifikasi!`, 'success');
            loadAntrianVerifikasi();
            loadDashboardData();
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('⚠ Gagal memperbarui status wali', 'error');
    }
}

/** Reject / tolak verifikasi wali dengan alasan */
async function rejectWali(id, nama) {
    const alasan = prompt(`Alasan penolakan untuk "${nama}" (opsional):`);
    if (alasan === null) return; // user cancel

    try {
        const res = await fetch(`${API_BASE}/wali.php?id=${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status: 'Ditolak', catatan: alasan })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`❌ Pengajuan wali "${nama}" ditolak.`, 'success');
            loadAntrianVerifikasi();
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('⚠ Gagal menolak pengajuan', 'error');
    }
}


// ============================================================
// C) EXPORT PDF DAN CSV
// ============================================================

/** Data sementara untuk export */
let laporanDataCache = [];

// Override loadLaporanData untuk cache hasil ke laporanDataCache
const _origLoadLaporan = typeof loadLaporanData === 'function' ? loadLaporanData : null;

/** Export laporan ke PDF menggunakan jsPDF + AutoTable */
async function exportLaporanPDF() {
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        showToast('⚠ Library jsPDF belum dimuat. Pastikan terhubung internet.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf || { jsPDF: window.jsPDF };
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header dokumen
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SIPENDAWA — Laporan Data Wali Siswa', 14, 13);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 200, 13);

    // Ambil data dari tabel yang sedang ditampilkan
    const tbody = document.querySelector('#page-admin-laporan table tbody');
    const rows = [];

    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const cells = tr.querySelectorAll('td');
            if (cells.length >= 5) {
                rows.push([
                    cells[0]?.innerText?.trim() || '',
                    cells[1]?.innerText?.trim() || '',
                    cells[2]?.innerText?.trim() || '',
                    cells[3]?.innerText?.trim() || '',
                    cells[4]?.innerText?.trim() || ''
                ]);
            }
        });
    }

    doc.autoTable({
        head: [['Nama Wali', 'Siswa Terkait', 'Kelas', 'Hubungan', 'No. Telepon']],
        body: rows.length > 0 ? rows : [['Tidak ada data', '', '', '', '']],
        startY: 25,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Halaman ${i} dari ${pageCount} — SIPENDAWA School Management System`, 14, doc.internal.pageSize.height - 5);
    }

    doc.save(`laporan-wali-siswa-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('✅ PDF berhasil diunduh!', 'success');
}

/** Export laporan ke CSV */
function exportLaporanCSV() {
    const tbody = document.querySelector('#page-admin-laporan table tbody');
    if (!tbody) { showToast('⚠ Tidak ada data untuk diexport', 'error'); return; }

    const headers = ['Nama Wali', 'Siswa Terkait', 'Kelas', 'Hubungan', 'No. Telepon'];
    const rows = [headers];

    tbody.querySelectorAll('tr').forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 5) {
            rows.push([
                cells[0]?.innerText?.trim() || '',
                cells[1]?.innerText?.trim() || '',
                cells[2]?.innerText?.trim() || '',
                cells[3]?.innerText?.trim() || '',
                cells[4]?.innerText?.trim() || ''
            ]);
        }
    });

    const csvContent = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-wali-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ CSV berhasil diunduh!', 'success');
}


// ============================================================
// D) PENGUMUMAN / BROADCAST
// ============================================================

/** Load daftar pengumuman (halaman admin) */
async function loadPengumuman() {
    const container = document.getElementById('pengumuman-list');
    if (!container) return;

    container.innerHTML = '<div class="p-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner animate-spin text-base mb-2 block"></i>Memuat...</div>';

    try {
        const res = await fetch(`${API_BASE}/pengumuman.php`);
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-xs text-slate-400"><i class="fa-solid fa-bullhorn text-xl mb-2 block opacity-30"></i>Belum ada pengumuman.</div>';
            return;
        }

        const tipeConfig = {
            info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'fa-circle-info', text: 'text-blue-700', label: 'Informasi' },
            penting: { bg: 'bg-red-50', border: 'border-red-200', icon: 'fa-circle-exclamation', text: 'text-red-700', label: 'Penting' },
            warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'fa-triangle-exclamation', text: 'text-amber-700', label: 'Peringatan' }
        };

        container.innerHTML = data.data.map(p => {
            const cfg = tipeConfig[p.tipe] || tipeConfig.info;
            return `
            <div class="p-5 hover:bg-slate-50/50 transition-all">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3 flex-1 min-w-0">
                        <div class="w-8 h-8 ${cfg.bg} ${cfg.text} rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5">
                            <i class="fa-solid ${cfg.icon}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                                <h5 class="font-bold text-slate-900 text-sm">${p.judul}</h5>
                                <span class="text-3xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border} px-1.5 py-0.5 rounded">${cfg.label}</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed">${p.isi}</p>
                            <p class="text-3xs text-slate-400 mt-1.5">
                                <i class="fa-solid fa-user text-2xs"></i> ${p.penulis_nama || 'Admin'}
                                &nbsp;•&nbsp;
                                <i class="fa-regular fa-clock text-2xs"></i> ${getTimeAgo(p.created_at)}
                            </p>
                        </div>
                    </div>
                    ${appState.currentRole === 'admin' ? `
                    <button onclick="deletePengumuman(${p.id})" title="Hapus pengumuman"
                        class="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>` : ''}
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        container.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">Gagal memuat pengumuman.</div>';
    }
}

/** Buat pengumuman baru (admin) */
async function submitPengumuman(e) {
    e.preventDefault();
    const btn = document.getElementById('pg-submit-btn');
    const judul = document.getElementById('pg-judul')?.value?.trim();
    const isi = document.getElementById('pg-isi')?.value?.trim();
    const tipe = document.getElementById('pg-tipe')?.value || 'info';

    if (!judul || !isi) { showToast('⚠ Judul dan isi wajib diisi', 'error'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Mempublikasikan...';

    try {
        const res = await fetch(`${API_BASE}/pengumuman.php`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ judul, isi, tipe })
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ ' + data.message, 'success');
            document.getElementById('form-pengumuman')?.reset();
            loadPengumuman();
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('⚠ Gagal terhubung ke server', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane text-2xs"></i> Publikasikan ke Semua';
    }
}

/** Hapus pengumuman */
async function deletePengumuman(id) {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
        const res = await fetch(`${API_BASE}/pengumuman.php?id=${id}`, {
            method: 'DELETE', headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Pengumuman dihapus', 'success');
            loadPengumuman();
        } else {
            showToast('⚠ ' + data.message, 'error');
        }
    } catch (err) {
        showToast('⚠ Gagal menghapus pengumuman', 'error');
    }
}

/** Load pengumuman di portal wali (read-only) */
async function loadPengumumanWali() {
    const container = document.getElementById('pengumuman-wali-list');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/pengumuman/list.php?limit=5`, {
            headers: authHeaders()
        });
        const response = await res.json();

        if (!response.success || response.data.items.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">Belum ada pengumuman dari sekolah.</div>';
            return;
        }

        const tipeConfig = {
            'Info': { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'fa-circle-info' },
            'Penting': { bg: 'bg-red-50', text: 'text-red-700', icon: 'fa-circle-exclamation' },
            'Info Penting': { bg: 'bg-red-50', text: 'text-red-700', icon: 'fa-circle-exclamation' },
            'Event': { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'fa-calendar-star' },
            'Akademik': { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'fa-graduation-cap' },
            'Keuangan': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'fa-wallet' }
        };

        container.innerHTML = response.data.items.map(p => {
            const cfg = tipeConfig[p.kategori] || tipeConfig['Info'];
            return `
            <div class="px-5 py-4 hover:bg-slate-50 transition-all cursor-pointer" onclick="switchTab('parent-pengumuman')">
                <div class="flex items-start gap-3">
                    <div class="w-7 h-7 ${cfg.bg} ${cfg.text} rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5">
                        <i class="fa-solid ${cfg.icon}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-xs text-slate-900">${p.judul}</p>
                        <p class="text-2xs text-slate-500 mt-0.5 leading-relaxed">${p.preview}</p>
                        <p class="text-3xs text-slate-400 mt-1">${formatDateIDLocal(p.created_at)}</p>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        if (container) container.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">Gagal memuat pengumuman.</div>';
    }
}

// ============================================================
// PORTAL WALI — DATA DINAMIS DARI API
// ============================================================

/** Simpan data siswa aktif untuk loadProfilSiswa */
let _parentSiswaList = [];

/**
 * Load semua data real untuk portal wali:
 * - Profil wali dari database
 * - Daftar siswa terkait
 * - Kehadiran bulan ini
 */
async function loadParentPortal() {
    try {
        // Jika tidak ada token (tidak login via API, pakai mock), tampilkan data dari appState
        const user = appState.currentUser;

        // ── Update profil sidebar ──────────────────────────────────────────
        if (user) {
            const namaEl = document.getElementById('portal-wali-nama');
            const emailEl = document.getElementById('portal-wali-email');
            const telponEl = document.getElementById('portal-wali-telepon');
            const greetEl = document.getElementById('portal-greeting-name');

            if (namaEl) namaEl.textContent = user.nama || user.name || 'Wali Murid';
            if (emailEl) emailEl.textContent = user.email || '-';
            if (greetEl) greetEl.textContent = user.nama || user.name || 'Wali Murid';

            // Coba fetch data wali lebih lengkap dari API (telepon, dll)
            if (appState.token) {
                try {
                    const profilRes = await fetch(`${API_BASE}/parent_portal.php?action=profil`, {
                        headers: authHeaders()
                    });
                    const profilData = await profilRes.json();
                    if (profilData.success && profilData.data) {
                        const w = profilData.data;
                        if (namaEl && w.nama) namaEl.textContent = w.nama;
                        if (emailEl && w.email) emailEl.textContent = w.email;
                        if (telponEl && w.telepon) telponEl.textContent = '📞 ' + w.telepon;
                        if (greetEl && w.nama) greetEl.textContent = w.nama;
                    }
                } catch (e) { /* Gunakan data dari appState */ }
            }
        }

        // ── Load siswa terkait ─────────────────────────────────────────────
        if (appState.token) {
            await _loadSiswaCard();
        } else {
            _renderSiswaCardEmpty('Login ulang untuk melihat data siswa Anda.');
        }

    } catch (err) {
        console.warn('loadParentPortal error:', err);
    }
}

/** Fetch dan render card siswa di portal wali */
async function _loadSiswaCard() {
    const card = document.getElementById('portal-siswa-card');
    if (!card) return;

    try {
        const res = await fetch(`${API_BASE}/parent_portal.php?action=siswa`, {
            headers: authHeaders()
        });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            _renderSiswaCardEmpty('Belum ada siswa yang terhubung dengan akun Anda.<br>Hubungi admin untuk menambahkan relasi.');
            return;
        }

        _parentSiswaList = data.data;
        const s = data.data[0]; // Tampilkan siswa pertama

        // Fetch kehadiran siswa pertama
        let kehadiran = { persen: '-', hadir: 0, alpa: 0, izin: 0 };
        try {
            const kRes = await fetch(`${API_BASE}/parent_portal.php?action=kehadiran&siswa_id=${s.id}`, {
                headers: authHeaders()
            });
            const kData = await kRes.json();
            if (kData.success) kehadiran = kData.data;
        } catch (e) { }

        const statusColor = {
            'Aktif': 'bg-emerald-50 text-emerald-700',
            'Verifikasi': 'bg-amber-50 text-amber-700',
            'Alumni': 'bg-slate-100 text-slate-600',
            'Pindah': 'bg-red-50 text-red-700'
        };
        const sColor = statusColor[s.status] || 'bg-blue-50 text-blue-700';

        card.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-6">
            <div class="w-full sm:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl overflow-hidden flex items-center justify-center" style="min-height:140px">
                <div class="text-center p-4">
                    <div class="w-16 h-16 bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-2">
                        ${s.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span class="text-4xs font-bold ${sColor} px-2 py-0.5 rounded-full">${s.status || 'Aktif'}</span>
                </div>
            </div>
            <div class="w-full sm:w-2/3 flex flex-col justify-between min-h-0">
                <div>
                    <div class="text-4xs font-extrabold uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded tracking-wider inline-block mb-1">
                        ${s.tipe_hubungan || 'Wali'} — Nama Lengkap Anak
                    </div>
                    <h3 class="text-base font-bold text-slate-900">${s.nama}</h3>
                    <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-3xs text-slate-500 font-medium">
                        ${s.nisn ? `<span><i class="fa-solid fa-id-card text-blue-400 mr-0.5"></i> NISN: ${s.nisn}</span>` : ''}
                        ${s.kelas ? `<span><i class="fa-solid fa-school text-indigo-400 mr-0.5"></i> Kelas: ${s.kelas}</span>` : ''}
                        ${s.jenis_kelamin ? `<span><i class="fa-solid fa-venus-mars text-purple-400 mr-0.5"></i> ${s.jenis_kelamin}</span>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 border-t pt-4 mt-4 text-center font-medium">
                    <div class="bg-blue-50/50 p-2 border border-blue-100 rounded-xl">
                        <p class="text-4xs text-blue-500 font-bold uppercase">Kehadiran</p>
                        <p class="text-sm font-black text-blue-900 mt-0.5">${kehadiran.persen !== '-' ? kehadiran.persen + '%' : '-'}</p>
                        <p class="text-4xs text-slate-400">${kehadiran.total ? 'dari ' + kehadiran.total + ' hari' : 'bulan ini'}</p>
                    </div>
                    <div class="bg-emerald-50/50 p-2 border border-emerald-100 rounded-xl">
                        <p class="text-4xs text-emerald-500 font-bold uppercase">Hadir</p>
                        <p class="text-sm font-black text-emerald-900 mt-0.5">${kehadiran.hadir || 0}</p>
                        <p class="text-4xs text-slate-400">hari</p>
                    </div>
                    <div class="bg-red-50/50 p-2 border border-red-100 rounded-xl">
                        <p class="text-4xs text-red-500 font-bold uppercase">Alpa</p>
                        <p class="text-sm font-black text-red-900 mt-0.5">${kehadiran.alpa || 0}</p>
                        <p class="text-4xs text-slate-400">hari</p>
                    </div>
                </div>
                ${data.data.length > 1 ? `
                <div class="mt-3 flex flex-wrap gap-1.5">
                    <p class="text-3xs text-slate-400 font-bold uppercase w-full">Anak lainnya:</p>
                    ${data.data.slice(1).map(si => `
                        <span class="text-3xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">${si.nama} (${si.kelas || '-'})</span>
                    `).join('')}
                </div>` : ''}
            </div>
        </div>`;

    } catch (err) {
        _renderSiswaCardEmpty('Gagal memuat data siswa. Pastikan koneksi aktif.');
    }
}

/** Tampilkan card kosong dengan pesan */
function _renderSiswaCardEmpty(msg) {
    const card = document.getElementById('portal-siswa-card');
    if (card) card.innerHTML = `
        <div class="flex flex-col items-center justify-center h-32 text-center text-xs text-slate-400 gap-2">
            <i class="fa-solid fa-user-graduate text-2xl opacity-30"></i>
            <p>${msg}</p>
        </div>`;
}

/**
 * Load halaman profil siswa detail (untuk menu "Profil Anak")
 */
async function loadProfilSiswa() {
    const content = document.getElementById('profil-siswa-content');
    if (!content) return;

    // Jika _parentSiswaList belum diload, load dulu
    if (_parentSiswaList.length === 0 && appState.token) {
        try {
            const res = await fetch(`${API_BASE}/parent_portal.php?action=siswa`, {
                headers: authHeaders()
            });
            const data = await res.json();
            if (data.success) _parentSiswaList = data.data;
        } catch (e) { }
    }

    if (_parentSiswaList.length === 0) {
        content.innerHTML = `<div class="lg:col-span-3 flex flex-col items-center justify-center h-40 text-xs text-slate-400 gap-2">
            <i class="fa-solid fa-user-graduate text-3xl opacity-30"></i>
            <p>Belum ada data siswa yang terhubung.</p>
        </div>`;
        return;
    }

    const s = _parentSiswaList[0];

    // Fetch kehadiran detail
    let kehadiran = { persen: 0, hadir: 0, alpa: 0, izin: 0, sakit: 0, total: 0 };
    if (appState.token) {
        try {
            const kRes = await fetch(`${API_BASE}/parent_portal.php?action=kehadiran&siswa_id=${s.id}`, {
                headers: authHeaders()
            });
            const kData = await kRes.json();
            if (kData.success) kehadiran = kData.data;
        } catch (e) { }
    }

    const infoRows = [
        { label: 'NISN', value: s.nisn || '-', icon: 'fa-id-card' },
        { label: 'Kelas', value: s.kelas || '-', icon: 'fa-school' },
        { label: 'Jenis Kelamin', value: s.jenis_kelamin || '-', icon: 'fa-venus-mars' },
        {
            label: 'Tanggal Lahir', value: s.tanggal_lahir
                ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-', icon: 'fa-calendar'
        },
        { label: 'Alamat', value: s.alamat || '-', icon: 'fa-location-dot' },
        { label: 'Status', value: s.status || 'Aktif', icon: 'fa-circle-check' },
        { label: 'Hubungan', value: s.tipe_hubungan || '-', icon: 'fa-people-line' },
    ];

    content.innerHTML = `
    <!-- Kartu profil kiri -->
    <div class="bg-white border border-slate-200 p-6 rounded-2xl text-center shadow-2xs space-y-4">
        <div class="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
            <span class="text-white text-2xl font-black">
                ${s.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </span>
        </div>
        <div>
            <h3 class="text-lg font-bold text-slate-900">${s.nama}</h3>
            <p class="text-3xs text-slate-400 font-medium mt-0.5">NISN: ${s.nisn || '-'}</p>
            <p class="text-3xs font-bold mt-1.5">
                <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">${s.status || 'Aktif'}</span>
            </p>
        </div>
        <!-- Ringkasan kehadiran bulan ini -->
        <div class="border-t pt-4 space-y-2 text-left">
            <p class="text-3xs font-bold text-slate-400 uppercase">Kehadiran Bulan Ini</p>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-emerald-500 h-2 rounded-full transition-all" style="width:${kehadiran.persen}%"></div>
            </div>
            <p class="text-xs font-black text-center text-emerald-700">${kehadiran.persen}%</p>
            <div class="grid grid-cols-4 gap-1 text-center text-3xs font-bold mt-1">
                <div><p class="text-slate-400">Hadir</p><p class="text-emerald-600">${kehadiran.hadir}</p></div>
                <div><p class="text-slate-400">Izin</p><p class="text-blue-600">${kehadiran.izin}</p></div>
                <div><p class="text-slate-400">Sakit</p><p class="text-amber-600">${kehadiran.sakit}</p></div>
                <div><p class="text-slate-400">Alpa</p><p class="text-red-600">${kehadiran.alpa}</p></div>
            </div>
        </div>
    </div>

    <!-- Detail informasi kanan -->
    <div class="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs space-y-4">
        <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2">
            <i class="fa-solid fa-id-card text-blue-600"></i> Detail Informasi Pribadi
        </h3>
        <div class="divide-y divide-slate-100">
            ${infoRows.map(row => `
            <div class="flex items-start gap-3 py-2.5">
                <div class="w-6 h-6 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center text-2xs shrink-0 mt-0.5">
                    <i class="fa-solid ${row.icon}"></i>
                </div>
                <div class="flex-1">
                    <p class="text-3xs text-slate-400 font-bold uppercase">${row.label}</p>
                    <p class="text-xs font-semibold text-slate-700 mt-0.5">${row.value}</p>
                </div>
            </div>`).join('')}
        </div>

        ${_parentSiswaList.length > 1 ? `
        <div class="border-t pt-4">
            <p class="text-3xs font-bold text-slate-400 uppercase mb-2">Anak Lainnya</p>
            <div class="flex flex-wrap gap-2">
                ${_parentSiswaList.slice(1).map(si => `
                <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <div class="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xs font-bold">
                        ${si.nama[0].toUpperCase()}
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-700">${si.nama}</p>
                        <p class="text-3xs text-slate-400">${si.kelas || '-'}</p>
                    </div>
                </div>`).join('')}
            </div>
        </div>` : ''}
    </div>`;
}

// ============================================================
// UPLOAD FOTO — Modal Universal
// ============================================================

/** State modal upload foto */
const _fotoUploadState = {
    type: null,   // 'siswa' | 'wali' | 'profil'
    id: null,   // ID record
    label: '',     // Nama untuk judul modal
    selectedFile: null,   // File yang dipilih
    onSuccess: null,   // Callback setelah sukses upload
    currentTab: 'file', // 'file' atau 'camera'
    mediaStream: null,   // MediaStream dari kamera
    capturedImageData: null  // Captured image dari kamera (Blob)
};

/**
 * Buka modal upload foto untuk siswa (oleh admin)
 * @param {string} type - 'siswa' | 'wali'
 * @param {number} id   - ID record
 * @param {string} label - Nama untuk tampil di judul
 */
function openUploadFoto(type, id, label) {
    _fotoUploadState.type = type;
    _fotoUploadState.id = id;
    _fotoUploadState.label = label;
    _fotoUploadState.onSuccess = () => loadSiswaData();

    const title = type === 'siswa'
        ? `Upload Foto Siswa — ${label}`
        : `Upload Foto Wali — ${label}`;

    document.getElementById('upload-modal-title').textContent = title;
    _resetFotoModal();
    document.getElementById('modal-upload-foto').classList.remove('hidden');
}

/**
 * Buka modal upload foto profil (oleh wali sendiri)
 */
function openUploadFotoProfil() {
    const user = appState.currentUser;
    _fotoUploadState.type = 'profil';
    _fotoUploadState.id = user?.id || null;
    _fotoUploadState.label = user?.nama || 'Profil';
    _fotoUploadState.onSuccess = (fotoUrl) => {
        // Update avatar di sidebar dan portal
        const avatarEls = document.querySelectorAll('#user-avatar, #portal-wali-avatar');
        avatarEls.forEach(el => { if (el) el.src = fotoUrl + '?t=' + Date.now(); });
        loadParentPortal();
    };

    document.getElementById('upload-modal-title').textContent = `Ganti Foto Profil — ${_fotoUploadState.label}`;
    _resetFotoModal();
    document.getElementById('modal-upload-foto').classList.remove('hidden');
}

/** Tutup modal upload foto */
function closeUploadFotoModal() {
    document.getElementById('modal-upload-foto').classList.add('hidden');
    _resetFotoModal();
}

/** Reset state dan UI modal */
function _resetFotoModal() {
    _fotoUploadState.selectedFile = null;

    const previewImg = document.getElementById('foto-preview-img');
    const placeholder = document.getElementById('foto-preview-placeholder');
    const fileInfo = document.getElementById('foto-file-info');
    const uploadBtn = document.getElementById('foto-upload-btn');
    const fileInput = document.getElementById('foto-file-input');

    if (previewImg) { previewImg.classList.add('hidden'); previewImg.src = ''; }
    if (placeholder) placeholder.classList.remove('hidden');
    if (fileInfo) fileInfo.classList.add('hidden');
    if (uploadBtn) uploadBtn.disabled = true;
    if (fileInput) fileInput.value = '';
}

/** Handle pilih file dari input */
function handleFotoFileSelect(event) {
    const file = event.target.files[0];
    if (file) _processFotoFile(file);
}

/** Drag over */
function handleFotoDragOver(event) {
    event.preventDefault();
    const zone = document.getElementById('foto-drop-zone');
    if (zone) zone.classList.add('border-blue-500', 'bg-blue-50');
}

/** Drag leave */
function handleFotoDragLeave(event) {
    const zone = document.getElementById('foto-drop-zone');
    if (zone) zone.classList.remove('border-blue-500', 'bg-blue-50');
}

/** Drop file */
function handleFotoDrop(event) {
    event.preventDefault();
    handleFotoDragLeave(event);
    const file = event.dataTransfer.files[0];
    if (file) _processFotoFile(file);
}

/** Proses file yang dipilih — validasi + preview */
function _processFotoFile(file) {
    const maxSize = 3 * 1024 * 1024; // 3MB
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.type)) {
        showToast('⚠ Format tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
        return;
    }
    if (file.size > maxSize) {
        showToast('⚠ Ukuran file melebihi 3MB.', 'error');
        return;
    }

    _fotoUploadState.selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById('foto-preview-img');
        const placeholder = document.getElementById('foto-preview-placeholder');
        if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
        }
        if (placeholder) placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    // Info file
    const fileInfo = document.getElementById('foto-file-info');
    const fileName = document.getElementById('foto-file-name');
    const fileSize = document.getElementById('foto-file-size');
    if (fileInfo) fileInfo.classList.remove('hidden');
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';

    // Enable tombol upload
    const uploadBtn = document.getElementById('foto-upload-btn');
    if (uploadBtn) uploadBtn.disabled = false;
}

/** Hapus pilihan file */
function clearFotoSelection() {
    _resetFotoModal();
}

/** Submit upload foto ke API */
async function submitFotoUpload() {
    if (!_fotoUploadState.selectedFile) {
        showToast('⚠ Pilih foto terlebih dahulu', 'error');
        return;
    }

    const btn = document.getElementById('foto-upload-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Mengupload...';
    }

    try {
        const formData = new FormData();
        formData.append('foto', _fotoUploadState.selectedFile);
        formData.append('type', _fotoUploadState.type);
        formData.append('id', _fotoUploadState.id || 0);

        const headers = {};
        if (appState.token) headers['Authorization'] = 'Bearer ' + appState.token;

        const res = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ ' + data.message, 'success');
            closeUploadFotoModal();

            // Jalankan callback onSuccess
            if (typeof _fotoUploadState.onSuccess === 'function') {
                _fotoUploadState.onSuccess(data.data?.foto_url);
            }
        } else {
            showToast('⚠ ' + data.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-upload text-2xs"></i> Upload Foto';
            }
        }
    } catch (err) {
        showToast('⚠ Gagal terhubung ke server', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-upload text-2xs"></i> Upload Foto';
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// ▶ FUNGSI UNTUK FITUR KAMERA & UPLOAD FILE
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Switch antara tab Upload File dan Ambil Kamera
 */
function switchUploadTab(tab) {
    _fotoUploadState.currentTab = tab;

    const fileTab = document.getElementById('upload-file-tab');
    const cameraTab = document.getElementById('upload-camera-tab');
    const fileTabBtn = document.getElementById('tab-upload-file');
    const cameraTabBtn = document.getElementById('tab-upload-camera');
    const uploadBtn = document.getElementById('foto-upload-btn');
    const cameraSubmitBtn = document.getElementById('submit-camera-capture-btn');

    if (tab === 'file') {
        // Tampilkan tab file
        if (fileTab) fileTab.classList.remove('hidden');
        if (cameraTab) cameraTab.classList.add('hidden');

        // Update button styling
        if (fileTabBtn) {
            fileTabBtn.classList.add('bg-white', 'text-blue-700', 'shadow-xs');
            fileTabBtn.classList.remove('text-slate-500');
        }
        if (cameraTabBtn) {
            cameraTabBtn.classList.remove('bg-white', 'text-blue-700', 'shadow-xs');
            cameraTabBtn.classList.add('text-slate-500');
        }

        // Show/hide buttons
        if (uploadBtn) uploadBtn.hidden = false;
        if (cameraSubmitBtn) cameraSubmitBtn.hidden = true;

        // Stop kamera jika sedang berjalan
        stopCameraStream();
    } else if (tab === 'camera') {
        // Tampilkan tab camera
        if (fileTab) fileTab.classList.add('hidden');
        if (cameraTab) cameraTab.classList.remove('hidden');

        // Update button styling
        if (cameraTabBtn) {
            cameraTabBtn.classList.add('bg-white', 'text-blue-700', 'shadow-xs');
            cameraTabBtn.classList.remove('text-slate-500');
        }
        if (fileTabBtn) {
            fileTabBtn.classList.remove('bg-white', 'text-blue-700', 'shadow-xs');
            fileTabBtn.classList.add('text-slate-500');
        }

        // Show/hide buttons
        if (uploadBtn) uploadBtn.hidden = true;
        if (cameraSubmitBtn) cameraSubmitBtn.hidden = true;
    }
}

/**
 * Mulai stream dari kamera
 */
async function startCameraStream() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('⚠ Akses kamera diblokir browser. Gunakan localhost atau HTTPS.', 'error');
            return;
        }

        // Request akses ke kamera
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        _fotoUploadState.mediaStream = mediaStream;

        const videoEl = document.getElementById('camera-stream');
        if (videoEl) {
            videoEl.srcObject = mediaStream;
            videoEl.classList.remove('hidden');

            // Hide placeholder dan canvas
            const placeholder = document.getElementById('camera-placeholder');
            const canvas = document.getElementById('camera-canvas');
            if (placeholder) placeholder.classList.add('hidden');
            if (canvas) canvas.classList.add('hidden');
        }

        // Enable capture button dan hide start button
        const captureBtn = document.getElementById('capture-camera-btn');
        const startBtn = document.getElementById('start-camera-btn');
        if (captureBtn) captureBtn.disabled = false;
        if (startBtn) startBtn.style.display = 'none';

        showToast('✅ Kamera berhasil diaktifkan', 'success');
    } catch (err) {
        console.error('Kamera error:', err);
        if (err.name === 'NotAllowedError') {
            showToast('⚠ Akses kamera ditolak. Izinkan akses kamera untuk melanjutkan.', 'error');
        } else if (err.name === 'NotFoundError') {
            showToast('⚠ Kamera tidak ditemukan di perangkat ini.', 'error');
        } else {
            showToast('⚠ Gagal mengakses kamera: ' + err.message, 'error');
        }
    }
}

/**
 * Capture frame dari video stream ke canvas
 */
function captureCamera() {
    const videoEl = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');

    if (!videoEl || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    // Draw video frame ke canvas
    ctx.drawImage(videoEl, 0, 0);

    // Convert canvas ke blob dan simpan
    canvas.toBlob((blob) => {
        _fotoUploadState.capturedImageData = blob;

        // Tampilkan preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('capture-preview-img');
            if (previewImg) {
                previewImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(blob);

        // Tampilkan preview container
        const previewContainer = document.getElementById('capture-preview-container');
        if (previewContainer) previewContainer.classList.remove('hidden');

        // Hide video, tampilkan canvas
        videoEl.classList.add('hidden');
        canvas.classList.remove('hidden');

        // Update buttons
        const captureBtn = document.getElementById('capture-camera-btn');
        const retakeBtn = document.getElementById('retake-camera-btn');
        const submitBtn = document.getElementById('submit-camera-capture-btn');

        if (captureBtn) captureBtn.hidden = true;
        if (retakeBtn) retakeBtn.hidden = false;
        if (submitBtn) submitBtn.hidden = false;

        showToast('✅ Foto berhasil ditangkap', 'success');
    }, 'image/jpeg', 0.95);
}

/**
 * Ambil ulang capture
 */
function retakeCameraCapture() {
    const videoEl = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const previewContainer = document.getElementById('capture-preview-container');

    if (videoEl) videoEl.classList.remove('hidden');
    if (canvas) canvas.classList.add('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');

    // Reset buttons
    const captureBtn = document.getElementById('capture-camera-btn');
    const retakeBtn = document.getElementById('retake-camera-btn');
    const submitBtn = document.getElementById('submit-camera-capture-btn');

    if (captureBtn) captureBtn.hidden = false;
    if (retakeBtn) retakeBtn.hidden = true;
    if (submitBtn) submitBtn.hidden = true;

    _fotoUploadState.capturedImageData = null;
}

/**
 * Submit capture hasil kamera ke API
 */
async function submitCameraCapture() {
    if (!_fotoUploadState.capturedImageData) {
        showToast('⚠ Tidak ada foto yang ditangkap', 'error');
        return;
    }

    const btn = document.getElementById('submit-camera-capture-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Mengunggah...';
    }

    try {
        const formData = new FormData();

        // Convert blob ke File
        const file = new File([_fotoUploadState.capturedImageData], 'capture.jpg', { type: 'image/jpeg' });
        formData.append('foto', file);
        formData.append('type', _fotoUploadState.type);
        formData.append('id', _fotoUploadState.id || 0);

        const headers = {};
        if (appState.token) headers['Authorization'] = 'Bearer ' + appState.token;

        const res = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ ' + data.message, 'success');
            closeUploadFotoModal();

            // Jalankan callback onSuccess
            if (typeof _fotoUploadState.onSuccess === 'function') {
                _fotoUploadState.onSuccess(data.data?.foto_url);
            }
        } else {
            showToast('⚠ ' + data.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-check text-2xs"></i> Gunakan Foto Ini';
            }
        }
    } catch (err) {
        showToast('⚠ Gagal terhubung ke server', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check text-2xs"></i> Gunakan Foto Ini';
        }
    } finally {
        stopCameraStream();
    }
}

/**
 * Stop camera stream
 */
function stopCameraStream() {
    if (_fotoUploadState.mediaStream) {
        _fotoUploadState.mediaStream.getTracks().forEach(track => track.stop());
        _fotoUploadState.mediaStream = null;
    }
}

/** Update _resetFotoModal untuk reset kamera juga */
const originalResetFotoModal = _resetFotoModal || (() => { });
function _resetFotoModal_WithCamera() {
    // Call original reset untuk file upload
    _fotoUploadState.selectedFile = null;

    const previewImg = document.getElementById('foto-preview-img');
    const placeholder = document.getElementById('foto-preview-placeholder');
    const fileInfo = document.getElementById('foto-file-info');
    const uploadBtn = document.getElementById('foto-upload-btn');
    const fileInput = document.getElementById('foto-file-input');

    if (previewImg) { previewImg.classList.add('hidden'); previewImg.src = ''; }
    if (placeholder) placeholder.classList.remove('hidden');
    if (fileInfo) fileInfo.classList.add('hidden');
    if (uploadBtn) uploadBtn.disabled = true;
    if (fileInput) fileInput.value = '';

    // Reset camera state
    stopCameraStream();

    const videoEl = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const capturePreviewContainer = document.getElementById('capture-preview-container');
    const captureBtn = document.getElementById('capture-camera-btn');
    const retakeBtn = document.getElementById('retake-camera-btn');
    const submitCameraBtn = document.getElementById('submit-camera-capture-btn');
    const startBtn = document.getElementById('start-camera-btn');

    if (videoEl) videoEl.classList.add('hidden');
    if (canvas) canvas.classList.add('hidden');
    if (cameraPlaceholder) cameraPlaceholder.classList.remove('hidden');
    if (capturePreviewContainer) capturePreviewContainer.classList.add('hidden');
    if (captureBtn) {
        captureBtn.disabled = true;
        captureBtn.hidden = false;
    }
    if (retakeBtn) retakeBtn.hidden = true;
    if (submitCameraBtn) submitCameraBtn.hidden = true;
    if (startBtn) startBtn.style.display = '';

    _fotoUploadState.currentTab = 'file';
    _fotoUploadState.capturedImageData = null;

    // Reset ke tab file
    switchUploadTab('file');
}

_resetFotoModal = _resetFotoModal_WithCamera;

// ======== MODUL MANAJEMEN NILAI (GURU & PARENT) ========
async function loadGuruNilaiData() {
    const tahun = document.getElementById('filter-nilai-tahun').value;
    const semester = document.getElementById('filter-nilai-semester').value;
    const tbody = document.getElementById('tbody-guru-nilai');
    
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center"><i class="fa-solid fa-spinner animate-spin text-blue-500"></i> Memuat data nilai...</td></tr>';

    try {
        let url = `${API_BASE}/nilai.php?action=list`;
        if (tahun) url += `&tahun_ajaran=${encodeURIComponent(tahun)}`;
        if (semester) url += `&semester=${encodeURIComponent(semester)}`;

        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${appState.token}` } });
        const data = await res.json();

        if (data.success) {
            window._guruNilaiCache = data.data; // Simpan ke cache global untuk edit
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-slate-500">Belum ada data nilai.</td></tr>';
                return;
            }

            data.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/50';
                tr.innerHTML = `
                    <td class="px-6 py-4 font-bold text-slate-900">${item.nama_siswa}</td>
                    <td class="px-4 py-4">${item.mata_pelajaran}</td>
                    <td class="px-4 py-4 text-xs">
                        <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-3xs font-bold">${item.semester}</span>
                        <br><span class="text-3xs text-slate-400">${item.tahun_ajaran}</span>
                    </td>
                    <td class="px-4 py-4 text-center">${parseFloat(item.nilai_tugas).toFixed(1)}</td>
                    <td class="px-4 py-4 text-center">${parseFloat(item.nilai_uts).toFixed(1)}</td>
                    <td class="px-4 py-4 text-center">${parseFloat(item.nilai_uas).toFixed(1)}</td>
                    <td class="px-4 py-4 text-center font-bold text-blue-700">${parseFloat(item.nilai_akhir).toFixed(1)}</td>
                    <td class="px-4 py-4 text-center">
                        <button onclick="openModalNilai(${item.id})" class="text-blue-500 hover:text-blue-700 mx-1" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteNilai(${item.id})" class="text-red-500 hover:text-red-700 mx-1" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">${data.message}</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Gagal terhubung ke server</td></tr>`;
    }
}

async function openModalNilai(id = null) {
    document.getElementById('form-nilai').reset();
    document.getElementById('nilai-id').value = id || '';
    document.getElementById('modal-nilai-title').innerText = id ? 'Edit Nilai' : 'Input Nilai Baru';

    // Load Data Siswa untuk Datalist
    try {
        const resSiswa = await fetch(`${API_BASE}/siswa.php?action=list`);
        const dataSiswa = await resSiswa.json();
        const datalistSiswa = document.getElementById('datalist-siswa');
        if (dataSiswa.success) {
            datalistSiswa.innerHTML = '';
            dataSiswa.data.forEach(s => {
                datalistSiswa.innerHTML += `<option data-id="${s.id}" value="${s.nama} (${s.nisn})"></option>`;
            });
        }
    } catch (e) {
        console.error(e);
    }

    if (id && window._guruNilaiCache) {
        const nilai = window._guruNilaiCache.find(n => n.id === id);
        if (nilai) {
            const datalistSiswa = document.getElementById('datalist-siswa');
            const option = Array.from(datalistSiswa.options).find(opt => opt.getAttribute('data-id') == nilai.siswa_id);
            document.getElementById('nilai-siswa-search').value = option ? option.value : '';
            document.getElementById('nilai-siswa').value = nilai.siswa_id;
            
            document.getElementById('nilai-mapel').value = nilai.mata_pelajaran;
            document.getElementById('nilai-tahun').value = nilai.tahun_ajaran;
            document.getElementById('nilai-semester').value = nilai.semester;
            document.getElementById('nilai-tugas').value = parseFloat(nilai.nilai_tugas);
            document.getElementById('nilai-uts').value = parseFloat(nilai.nilai_uts);
            document.getElementById('nilai-uas').value = parseFloat(nilai.nilai_uas);
        }
    }

    document.getElementById('modal-nilai').classList.remove('hidden');
}

async function submitNilai(event) {
    event.preventDefault();
    
    const searchVal = document.getElementById('nilai-siswa-search').value;
    const datalist = document.getElementById('datalist-siswa');
    const option = Array.from(datalist.options).find(opt => opt.value === searchVal);
    
    let siswa_id = 0;
    if (option) {
        siswa_id = parseInt(option.getAttribute('data-id'));
    }

    if (!siswa_id || siswa_id <= 0) {
        showToast('❌ Silakan pilih siswa yang valid dari daftar pencarian', 'error');
        return;
    }

    const id = document.getElementById('nilai-id').value;
    const payload = {
        id: id ? parseInt(id) : null,
        siswa_id: siswa_id,
        mata_pelajaran: document.getElementById('nilai-mapel').value,
        tahun_ajaran: document.getElementById('nilai-tahun').value,
        semester: document.getElementById('nilai-semester').value,
        nilai_tugas: parseFloat(document.getElementById('nilai-tugas').value),
        nilai_uts: parseFloat(document.getElementById('nilai-uts').value),
        nilai_uas: parseFloat(document.getElementById('nilai-uas').value)
    };

    try {
        const res = await fetch(`${API_BASE}/nilai.php`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ ' + data.message);
            document.getElementById('modal-nilai').classList.add('hidden');
            loadGuruNilaiData(); // Refresh list
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Gagal menyimpan nilai (Network/Server Error)', 'error');
    }
}

async function deleteNilai(id) {
    if (!confirm('Anda yakin ingin menghapus data nilai ini?')) return;
    try {
        const res = await fetch(`${API_BASE}/nilai.php`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Data nilai berhasil dihapus');
            loadGuruNilaiData();
        } else {
            showToast('❌ Gagal menghapus nilai: ' + data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Gagal menghapus nilai (Network/Server Error)', 'error');
    }
}

let parentTrendChart = null;

async function loadParentNilaiData() {
    const tbody = document.getElementById('tbody-parent-nilai');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center"><i class="fa-solid fa-spinner animate-spin text-blue-500"></i> Memuat data akademik anak Anda...</td></tr>';

    try {
        // Step 1: Dapatkan siswa_id yang terelasi dengan wali login
        const resWali = await fetch(`${API_BASE}/relasi.php?action=list_by_wali`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const dataWali = await resWali.json();
        
        const verifiedSiswa = dataWali.data.filter(w => w.status === 'Terverifikasi');
        if (!dataWali.success || verifiedSiswa.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-500">Belum ada anak yang terhubung atau belum diverifikasi.</td></tr>';
            return;
        }

        const siswaId = verifiedSiswa[0].siswa_id;

        // Ambil filter
        const tahun = document.getElementById('parent-filter-tahun').value;
        const semester = document.getElementById('parent-filter-semester').value;
        const bulan = document.getElementById('parent-filter-bulan').value;

        // Fetch Nilai & Kehadiran secara paralel
        const [resNilai, resHadir] = await Promise.all([
            fetch(`${API_BASE}/nilai.php?action=list&siswa_id=${siswaId}&tahun_ajaran=${tahun}&semester=${semester}`, {
                headers: { 'Authorization': `Bearer ${appState.token}` }
            }),
            fetch(`${API_BASE}/kehadiran.php?action=summary&siswa_id=${siswaId}&bulan=${bulan}`, {
                headers: { 'Authorization': `Bearer ${appState.token}` }
            })
        ]);

        const dataNilai = await resNilai.json();
        const dataHadir = await resHadir.json();

        // ===== 1. UPDATE SUMMARY CARDS & ALERTS =====
        let avgNilai = 0;
        let hasLowGrades = false;
        
        if (dataNilai.success && dataNilai.data.length > 0) {
            const sum = dataNilai.data.reduce((acc, curr) => acc + parseFloat(curr.nilai_akhir), 0);
            avgNilai = sum / dataNilai.data.length;
            hasLowGrades = dataNilai.data.some(n => parseFloat(n.nilai_akhir) < 70);
        }

        let percentHadir = 0;
        let totalAlpa = 0;
        if (dataHadir.success && dataHadir.data.summary) {
            const sumHadir = dataHadir.data.summary.Hadir || 0;
            const sumTotal = dataHadir.data.summary.Total || 0;
            totalAlpa = dataHadir.data.summary.Alpa || 0;
            if (sumTotal > 0) {
                percentHadir = Math.round((sumHadir / sumTotal) * 100);
            }
        }

        // Render Cards
        document.getElementById('parent-avg-nilai').textContent = avgNilai.toFixed(1);
        document.getElementById('parent-avg-hadir').textContent = percentHadir + '%';
        document.getElementById('parent-total-alpa').textContent = totalAlpa + ' Hari';
        
        const statusDOM = document.getElementById('parent-status-akademik');
        if (avgNilai >= 75 && totalAlpa <= 3) {
            statusDOM.textContent = 'Memuaskan';
            statusDOM.className = 'text-lg mt-1 font-black text-emerald-600';
        } else if (avgNilai > 0) {
            statusDOM.textContent = 'Perlu Perhatian';
            statusDOM.className = 'text-lg mt-1 font-black text-amber-500';
        } else {
            statusDOM.textContent = 'Belum Ada Data';
            statusDOM.className = 'text-lg mt-1 font-black text-slate-500';
        }

        // Render Alert Box
        const alertBox = document.getElementById('parent-alert-box');
        let alerts = [];
        if (hasLowGrades) alerts.push('Terdapat nilai di bawah standar (Kriteria Ketuntasan Minimal 70). Mohon perhatikan jadwal belajar anak.');
        if (totalAlpa > 3) alerts.push(`Tingkat kehadiran Alpa cukup tinggi (${totalAlpa} hari). Silakan hubungi wali kelas.`);
        
        if (alerts.length > 0) {
            alertBox.innerHTML = `
                <div class="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-pulse">
                    <i class="fa-solid fa-triangle-exclamation text-red-500 mt-0.5"></i>
                    <div>
                        <h4 class="text-sm font-bold text-red-800 mb-1">Peringatan Akademik</h4>
                        <ul class="list-disc pl-4 text-xs text-red-700 space-y-1">
                            ${alerts.map(a => `<li>${a}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }

        // ===== 2. RENDER CHART =====
        renderParentChart(dataNilai.data);

        // ===== 3. RENDER TABLE =====
        if (dataNilai.success) {
            tbody.innerHTML = '';
            if (dataNilai.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-500">Belum ada data nilai untuk filter ini.</td></tr>';
                return;
            }

            dataNilai.data.forEach(item => {
                const nAkhir = parseFloat(item.nilai_akhir).toFixed(1);
                
                let badgeClass = 'bg-red-50 text-red-700';
                let statusTxt = 'Kurang';
                if (nAkhir >= 80) { badgeClass = 'bg-emerald-50 text-emerald-700'; statusTxt = 'Sangat Baik'; }
                else if (nAkhir >= 70) { badgeClass = 'bg-amber-50 text-amber-700'; statusTxt = 'Cukup'; }

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/50';
                tr.innerHTML = `
                    <td class="px-4 py-3">
                        <div class="font-bold text-slate-900">${item.mata_pelajaran}</div>
                        <div class="text-3xs text-slate-400">Guru: ${item.nama_guru}</div>
                    </td>
                    <td class="px-4 py-3 text-center text-xs text-slate-600">${parseFloat(item.nilai_tugas).toFixed(1)}</td>
                    <td class="px-4 py-3 text-center text-xs text-slate-600">${parseFloat(item.nilai_uts).toFixed(1)}</td>
                    <td class="px-4 py-3 text-center text-xs text-slate-600">${parseFloat(item.nilai_uas).toFixed(1)}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="font-bold text-slate-900">${nAkhir}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="${badgeClass} px-2 py-1 rounded shadow-xs text-2xs font-bold uppercase tracking-wider">${statusTxt}</span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-red-500">Terjadi kesalahan koneksi</td></tr>`;
    }
}

function renderParentChart(nilaiData) {
    const ctx = document.getElementById('chart-parent-trend');
    if (!ctx) return;
    
    if (parentTrendChart) {
        parentTrendChart.destroy();
    }

    if (!nilaiData || nilaiData.length === 0) {
        return; // Tidak ada data untuk dirender
    }

    const labels = nilaiData.map(d => d.mata_pelajaran);
    const dataTugas = nilaiData.map(d => parseFloat(d.nilai_tugas));
    const dataUTS = nilaiData.map(d => parseFloat(d.nilai_uts));
    const dataUAS = nilaiData.map(d => parseFloat(d.nilai_uas));

    parentTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Tugas',
                    data: dataTugas,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'UTS',
                    data: dataUTS,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'UAS',
                    data: dataUAS,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// ======== MODUL KEHADIRAN (GURU) ========
async function loadGuruKehadiran() {
    const tanggalDOM = document.getElementById('filter-kehadiran-tanggal');
    if (!tanggalDOM.value) tanggalDOM.value = new Date().toISOString().split('T')[0];
    const tanggal = tanggalDOM.value;

    const tbody = document.getElementById('tbody-guru-kehadiran');
    tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500">Memuat data...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/kehadiran.php?action=list_kelas&tanggal=${tanggal}`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-500">Tidak ada data siswa ditemukan.</td></tr>';
                return;
            }

            data.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/50';
                
                const status = item.status || 'Hadir'; // Default 'Hadir'
                const keterangan = item.keterangan || '';

                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-900">${item.nama}</div>
                        <div class="text-3xs text-slate-500">NISN: ${item.nisn}</div>
                    </td>
                    <td class="px-4 py-4">
                        <div class="flex items-center justify-center gap-2">
                            <label class="cursor-pointer flex items-center gap-1"><input type="radio" name="hadir_${item.id}" value="Hadir" ${status === 'Hadir' ? 'checked' : ''} class="w-3 h-3 text-emerald-600 focus:ring-emerald-500"> <span class="text-xs text-slate-700">Hadir</span></label>
                            <label class="cursor-pointer flex items-center gap-1"><input type="radio" name="hadir_${item.id}" value="Izin" ${status === 'Izin' ? 'checked' : ''} class="w-3 h-3 text-blue-600 focus:ring-blue-500"> <span class="text-xs text-slate-700">Izin</span></label>
                            <label class="cursor-pointer flex items-center gap-1"><input type="radio" name="hadir_${item.id}" value="Sakit" ${status === 'Sakit' ? 'checked' : ''} class="w-3 h-3 text-amber-600 focus:ring-amber-500"> <span class="text-xs text-slate-700">Sakit</span></label>
                            <label class="cursor-pointer flex items-center gap-1"><input type="radio" name="hadir_${item.id}" value="Alpa" ${status === 'Alpa' ? 'checked' : ''} class="w-3 h-3 text-red-600 focus:ring-red-500"> <span class="text-xs text-slate-700">Alpa</span></label>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <input type="text" id="ket_${item.id}" value="${keterangan}" class="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-500" placeholder="Keterangan opsional">
                    </td>
                `;
                tbody.appendChild(tr);
            });
            window._guruKehadiranCache = data.data; // Simpan untuk simpanKehadiranMasal
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">Gagal memuat absensi</td></tr>';
    }
}

async function simpanKehadiranMasal() {
    if (!window._guruKehadiranCache || window._guruKehadiranCache.length === 0) return;
    
    const tanggal = document.getElementById('filter-kehadiran-tanggal').value;
    const kehadiran = [];
    
    window._guruKehadiranCache.forEach(item => {
        const selectedRadio = document.querySelector(`input[name="hadir_${item.id}"]:checked`);
        const keteranganInput = document.getElementById(`ket_${item.id}`);
        
        if (selectedRadio) {
            kehadiran.push({
                siswa_id: item.id,
                status: selectedRadio.value,
                keterangan: keteranganInput ? keteranganInput.value : ''
            });
        }
    });

    try {
        const res = await fetch(`${API_BASE}/kehadiran.php?action=masal`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ tanggal, kehadiran })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ ' + data.message);
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('❌ Gagal menyimpan absensi', 'error');
    }
}


// ======== MODUL CATATAN PERILAKU ========
async function loadGuruCatatan() {
    const grid = document.getElementById('grid-guru-catatan');
    grid.innerHTML = '<div class="col-span-full text-center text-slate-500 text-xs py-4">Memuat data catatan...</div>';

    try {
        const res = await fetch(`${API_BASE}/catatan_perilaku.php`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await res.json();
        if (data.success) {
            window._guruCatatanCache = data.data;
            renderGuruCatatan(data.data);
            
            // Populate datalist siswa
            const resSiswa = await fetch(`${API_BASE}/siswa.php?action=list`);
            const dataSiswa = await resSiswa.json();
            const datalistSiswa = document.getElementById('datalist-siswa-catatan');
            if (dataSiswa.success) {
                datalistSiswa.innerHTML = '';
                dataSiswa.data.forEach(s => {
                    datalistSiswa.innerHTML += `<option data-id="${s.id}" value="${s.nama} (${s.nisn})"></option>`;
                });
            }
        }
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<div class="col-span-full text-center text-red-500 py-4">Gagal memuat catatan</div>';
    }
}

function renderGuruCatatan(catatanArray) {
    const grid = document.getElementById('grid-guru-catatan');
    grid.innerHTML = '';
    if (catatanArray.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-slate-500 text-xs py-4">Belum ada catatan perilaku.</div>';
        return;
    }

    catatanArray.forEach(c => {
        const card = document.createElement('div');
        card.className = 'bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 flex flex-col justify-between';
        
        let badgeColor = 'bg-slate-100 text-slate-700';
        if (c.tipe === 'Positif') badgeColor = 'bg-emerald-100 text-emerald-700';
        if (c.tipe === 'Negatif') badgeColor = 'bg-red-100 text-red-700';
        if (c.tipe === 'Info') badgeColor = 'bg-blue-100 text-blue-700';

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="${badgeColor} text-3xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">${c.tipe}</span>
                    <span class="text-3xs text-slate-400 font-medium"><i class="fa-regular fa-calendar mr-1"></i>${c.tanggal}</span>
                </div>
                <h4 class="font-bold text-sm text-slate-900 mb-1">${c.nama_siswa}</h4>
                <p class="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">${c.catatan}</p>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                <span class="text-3xs text-slate-400">Oleh: ${c.nama_guru}</span>
                <div class="flex gap-2">
                    <button onclick="openModalCatatan(${c.id})" class="text-blue-500 hover:text-blue-700 transition-colors" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteCatatan(${c.id})" class="text-red-400 hover:text-red-600 transition-colors" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterCatatanGuru() {
    const keyword = document.getElementById('filter-catatan-guru').value.toLowerCase();
    if (!window._guruCatatanCache) return;
    const filtered = window._guruCatatanCache.filter(c => c.nama_siswa.toLowerCase().includes(keyword) || c.catatan.toLowerCase().includes(keyword));
    renderGuruCatatan(filtered);
}

function openModalCatatan(id = null) {
    document.getElementById('form-catatan').reset();
    document.getElementById('catatan-id').value = id || '';
    document.getElementById('modal-catatan-title').innerText = id ? 'Edit Catatan Perilaku' : 'Tambah Catatan Baru';
    
    if (!id) {
        document.getElementById('catatan-tanggal').value = new Date().toISOString().split('T')[0];
    } else if (window._guruCatatanCache) {
        const c = window._guruCatatanCache.find(x => x.id === id);
        if (c) {
            const datalistSiswa = document.getElementById('datalist-siswa-catatan');
            const option = Array.from(datalistSiswa.options).find(opt => opt.getAttribute('data-id') == c.siswa_id);
            document.getElementById('catatan-siswa-search').value = option ? option.value : c.nama_siswa;
            document.getElementById('catatan-tanggal').value = c.tanggal;
            document.getElementById('catatan-tipe').value = c.tipe;
            document.getElementById('catatan-isi').value = c.catatan;
        }
    }
    document.getElementById('modal-catatan').classList.remove('hidden');
}

async function submitCatatan(event) {
    event.preventDefault();
    
    const searchVal = document.getElementById('catatan-siswa-search').value;
    const datalist = document.getElementById('datalist-siswa-catatan');
    const option = Array.from(datalist.options).find(opt => opt.value === searchVal);
    
    let siswa_id = 0;
    if (option) {
        siswa_id = parseInt(option.getAttribute('data-id'));
    } else {
        // Fallback untuk edit: jika input teks tidak diubah dari nilai default nama siswa dan id siswa ada di cache
        const idToEdit = document.getElementById('catatan-id').value;
        if (idToEdit && window._guruCatatanCache) {
             const c = window._guruCatatanCache.find(x => x.id == idToEdit);
             if (c && c.nama_siswa === searchVal) siswa_id = c.siswa_id;
        }
    }

    if (!siswa_id || siswa_id <= 0) {
        showToast('❌ Silakan pilih siswa yang valid dari daftar pencarian', 'error');
        return;
    }

    const id = document.getElementById('catatan-id').value;
    const payload = {
        id: id ? parseInt(id) : null,
        siswa_id: siswa_id,
        tanggal: document.getElementById('catatan-tanggal').value,
        tipe: document.getElementById('catatan-tipe').value,
        catatan: document.getElementById('catatan-isi').value
    };

    try {
        const res = await fetch(`${API_BASE}/catatan_perilaku.php`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ ' + data.message);
            document.getElementById('modal-catatan').classList.add('hidden');
            loadGuruCatatan();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Gagal menyimpan catatan', 'error');
    }
}

async function deleteCatatan(id) {
    if (!confirm('Hapus catatan ini?')) return;
    try {
        const res = await fetch(`${API_BASE}/catatan_perilaku.php`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`
            },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Catatan dihapus');
            loadGuruCatatan();
        } else {
            showToast('❌ ' + data.message, 'error');
        }
    } catch (e) {
        showToast('❌ Gagal menghapus catatan', 'error');
    }
}

// ======== MODUL CATATAN (PARENT) ========
async function loadParentCatatan() {
    const listDOM = document.getElementById('list-parent-catatan');
    listDOM.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Memuat catatan harian...</div>';

    try {
        // Asumsi endpoint mengambil catatan dari seluruh anak milik wali yang terlogin
        const res = await fetch(`${API_BASE}/catatan_perilaku.php`, {
            headers: { 'Authorization': `Bearer ${appState.token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            listDOM.innerHTML = '';
            if (data.data.length === 0) {
                listDOM.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Belum ada catatan terbaru.</div>';
                return;
            }

            data.data.forEach(c => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                let iconClass = 'fa-info-circle text-blue-500';
                
                if (c.tipe === 'Positif') {
                    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    iconClass = 'fa-star text-emerald-500';
                }
                if (c.tipe === 'Negatif') {
                    badgeColor = 'bg-red-50 text-red-700 border-red-100';
                    iconClass = 'fa-triangle-exclamation text-red-500';
                }
                if (c.tipe === 'Info') {
                    badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                    iconClass = 'fa-bullhorn text-blue-500';
                }

                const item = document.createElement('div');
                item.className = `p-4 border rounded-xl ${badgeColor} flex gap-4 items-start`;
                
                item.innerHTML = `
                    <div class="mt-1">
                        <i class="fa-solid ${iconClass} text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-wrap justify-between items-center mb-1">
                            <h4 class="font-bold text-sm text-slate-900">${c.nama_siswa}</h4>
                            <span class="text-3xs text-slate-500"><i class="fa-regular fa-calendar mr-1"></i> ${c.tanggal}</span>
                        </div>
                        <p class="text-xs text-slate-700 leading-relaxed mb-2">${c.catatan}</p>
                        <div class="text-3xs text-slate-500 font-medium">Pengirim: Guru ${c.nama_guru}</div>
                    </div>
                `;
                listDOM.appendChild(item);
            });
        }
    } catch (err) {
        listDOM.innerHTML = '<div class="text-center text-red-500 py-4">Gagal memuat catatan</div>';
    }
}

// ============================================================
// MASTER DATA: KELAS
// ============================================================
async function loadDataKelas() {
    const tbody = document.getElementById('tabel-kelas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400">Memuat data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/kelas.php`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400">Belum ada data kelas</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.map(k => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-3">${k.tingkat}</td>
                    <td class="px-5 py-3 font-bold text-blue-700">${k.nama_kelas}</td>
                    <td class="px-5 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="editKelas(${k.id}, '${k.nama_kelas}', ${k.tingkat})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="hapusKelas(${k.id}, '${k.nama_kelas}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-red-500">Gagal memuat data</td></tr>';
    }
}

async function simpanKelas(e) {
    e.preventDefault();
    const id = document.getElementById('kelas-id').value;
    const nama_kelas = document.getElementById('kelas-nama').value;
    const tingkat = document.getElementById('kelas-tingkat').value;
    
    const method = id ? 'PUT' : 'POST';
    const payload = { nama_kelas, tingkat };
    if (id) payload.id = id;
    
    try {
        const res = await fetch(`${API_BASE}/admin/kelas.php`, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false });
            document.getElementById('modal-kelas').classList.add('hidden');
            loadDataKelas();
        } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan jaringan' });
    }
}

function editKelas(id, nama, tingkat) {
    document.getElementById('kelas-id').value = id;
    document.getElementById('kelas-nama').value = nama;
    document.getElementById('kelas-tingkat').value = tingkat;
    document.getElementById('modal-kelas').classList.remove('hidden');
}

function hapusKelas(id, nama) {
    Swal.fire({
        title: `Hapus Kelas ${nama}?`,
        text: "Data yang dihapus tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/admin/kelas.php`, {
                    method: 'DELETE',
                    headers: authHeaders(),
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                
                if (data.success) {
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: data.message, timer: 1500, showConfirmButton: false });
                    loadDataKelas();
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Kesalahan jaringan' });
            }
        }
    });
}

// ============================================================
// MASTER DATA: MATA PELAJARAN
// ============================================================
async function loadDataMapel() {
    const tbody = document.getElementById('tabel-mapel');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400">Memuat data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/mapel.php`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400">Belum ada data mata pelajaran</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.map(m => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-3 text-slate-500">${m.kode_pelajaran || '-'}</td>
                    <td class="px-5 py-3 font-bold text-blue-700">${m.nama_pelajaran}</td>
                    <td class="px-5 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="editMapel(${m.id}, '${m.nama_pelajaran}', '${m.kode_pelajaran || ''}')" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="hapusMapel(${m.id}, '${m.nama_pelajaran}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-red-500">Gagal memuat data</td></tr>';
    }
}

async function simpanMapel(e) {
    e.preventDefault();
    const id = document.getElementById('mapel-id').value;
    const nama_pelajaran = document.getElementById('mapel-nama').value;
    const kode_pelajaran = document.getElementById('mapel-kode').value;
    
    const method = id ? 'PUT' : 'POST';
    const payload = { nama_pelajaran, kode_pelajaran };
    if (id) payload.id = id;
    
    try {
        const res = await fetch(`${API_BASE}/admin/mapel.php`, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false });
            document.getElementById('modal-mapel').classList.add('hidden');
            loadDataMapel();
        } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan jaringan' });
    }
}

function editMapel(id, nama, kode) {
    document.getElementById('mapel-id').value = id;
    document.getElementById('mapel-nama').value = nama;
    document.getElementById('mapel-kode').value = kode;
    document.getElementById('modal-mapel').classList.remove('hidden');
}

function hapusMapel(id, nama) {
    Swal.fire({
        title: `Hapus Mapel ${nama}?`,
        text: "Data yang dihapus tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/admin/mapel.php`, {
                    method: 'DELETE',
                    headers: authHeaders(),
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                
                if (data.success) {
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: data.message, timer: 1500, showConfirmButton: false });
                    loadDataMapel();
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Kesalahan jaringan' });
            }
        }
    });
}

// ======== EDIT PROFIL WALI (PARENT) ========

function openUpdateProfilWali() {
    const nama    = document.getElementById('portal-wali-nama')?.textContent.trim()    || '';
    const telepon = document.getElementById('portal-wali-telepon')?.textContent.trim() || '';
    document.getElementById('wali-edit-nama').value    = (nama !== 'Memuat...') ? nama : '';
    document.getElementById('wali-edit-telepon').value = (telepon !== '-') ? telepon : '';
    document.getElementById('wali-edit-alamat').value  = '';
    document.getElementById('modal-wali-edit-profil').classList.remove('hidden');
}

function closeUpdateProfilWali() {
    document.getElementById('modal-wali-edit-profil').classList.add('hidden');
    document.getElementById('wali-edit-pwd-form').reset();
}

async function waliProfilSave(e) {
    e.preventDefault();
    const btn = document.getElementById('wali-edit-btn-save');
    const ori = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...';
    try {
        const res = await fetch(`${API_BASE}/wali/update-profil.php`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({
                nama: document.getElementById('wali-edit-nama').value,
                telepon: document.getElementById('wali-edit-telepon').value,
                alamat: document.getElementById('wali-edit-alamat').value,
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Profil berhasil diperbarui', 'success');
            const namaVal = document.getElementById('wali-edit-nama').value;
            const telVal  = document.getElementById('wali-edit-telepon').value;
            const namaEl = document.getElementById('portal-wali-nama');
            if (namaEl) namaEl.textContent = namaVal;
            document.getElementById('user-fullname').textContent = namaVal;
            const telEl = document.getElementById('portal-wali-telepon');
            if (telEl) telEl.textContent = telVal || '-';
            closeUpdateProfilWali();
        } else { showToast(data.error || 'Gagal menyimpan', 'error'); }
    } catch(err) { showToast('Terjadi kesalahan', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = ori; }
}

async function waliGantiPassword(e) {
    e.preventDefault();
    const oldPwd  = document.getElementById('wali-pwd-old').value;
    const newPwd  = document.getElementById('wali-pwd-new').value;
    const confPwd = document.getElementById('wali-pwd-confirm').value;
    if (newPwd !== confPwd) { showToast('Konfirmasi password tidak cocok', 'warning'); return; }
    const btn = document.getElementById('wali-pwd-btn');
    const ori = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Memproses...';
    try {
        const nama = document.getElementById('wali-edit-nama').value || (document.getElementById('portal-wali-nama')?.textContent ?? '');
        const res = await fetch(`${API_BASE}/wali/update-profil.php`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ nama, old_password: oldPwd, new_password: newPwd })
        });
        const data = await res.json();
        if (data.success) { showToast('Password berhasil diperbarui', 'success'); document.getElementById('wali-edit-pwd-form').reset(); }
        else { showToast(data.error || 'Gagal mengganti password', 'error'); }
    } catch(err) { showToast('Terjadi kesalahan', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = ori; }
}

function waliEditTab(tab) {
    const dataPanel = document.getElementById('wali-tab-data');
    const pwdPanel  = document.getElementById('wali-tab-pwd');
    const dataBtn   = document.getElementById('tab-wali-data');
    const pwdBtn    = document.getElementById('tab-wali-pwd');
    if (tab === 'data') {
        dataPanel.classList.remove('hidden'); pwdPanel.classList.add('hidden');
        dataBtn.className  = 'flex-1 py-3 text-xs font-bold text-blue-700 border-b-2 border-blue-600 transition';
        pwdBtn.className   = 'flex-1 py-3 text-xs font-bold text-slate-400 border-b-2 border-transparent transition';
    } else {
        pwdPanel.classList.remove('hidden'); dataPanel.classList.add('hidden');
        pwdBtn.className   = 'flex-1 py-3 text-xs font-bold text-blue-700 border-b-2 border-blue-600 transition';
        dataBtn.className  = 'flex-1 py-3 text-xs font-bold text-slate-400 border-b-2 border-transparent transition';
    }
}

// Toggle Sidebar Mobile
function toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
}







