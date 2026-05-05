
let appState = {
    currentRole: 'admin',
    currentTab: 'admin-dashboard'
};

const navigationMenus = {
    admin: [
        { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'admin-siswa', label: 'Kelola Siswa', icon: 'fa-user-graduate' },
        { id: 'admin-relasi', label: 'Relasi Data', icon: 'fa-link' },
        { id: 'admin-laporan', label: 'Laporan', icon: 'fa-file-invoice-dollar' },
        { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: 12 },
        { id: 'profil-siswa', label: 'Profil Siswa', icon: 'fa-id-card' }
    ],
    parent: [
        { id: 'parent-portal', label: 'Dashboard Portal', icon: 'fa-chart-line' },
        { id: 'profil-siswa', label: 'Profil Anak', icon: 'fa-user-graduate' },
        { id: 'notifikasi', label: 'Pusat Notifikasi', icon: 'fa-bell', badge: 3 }
    ]
};

const userCredentialsMock = {
    admin: { name: 'Haryanto Putro', title: 'Super Administrator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' },
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
    const emailInput = document.getElementById('login-email');

    if (role === 'admin') {
        btnAdmin.className = "w-1/2 py-2 text-xs font-bold rounded-lg transition-all bg-white text-blue-700 shadow-xs";
        btnParent.className = "w-1/2 py-2 text-xs font-bold rounded-lg transition-all text-slate-500";
        emailInput.value = "admin@school.id";
    } else {
        btnParent.className = "w-1/2 py-2 text-xs font-bold rounded-lg transition-all bg-white text-blue-700 shadow-xs";
        btnAdmin.className = "w-1/2 py-2 text-xs font-bold rounded-lg transition-all text-slate-500";
        emailInput.value = "budisantoso@email.com";
    }
}

function executeLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    let targetedRole = email.includes('admin') ? 'admin' : 'parent';
    loginAs(targetedRole);
}

function executeRegister(event) {
    event.preventDefault();
    alert('Proses Registrasi Berhasil Disimpan ke Sandbox Database! Mengarahkan Anda kembali ke Halaman Login.');
    showRoute('login');
}

function loginAs(role) {
    appState.currentRole = role;
 
    document.getElementById('user-fullname').innerText = userCredentialsMock[role].name;
    document.getElementById('user-role-title').innerText = userCredentialsMock[role].title;
    document.getElementById('user-avatar').src = userCredentialsMock[role].avatar;

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
    container.innerHTML = ''; // Membersihkan buffer elemen

    const menus = navigationMenus[appState.currentRole];
    menus.forEach(menu => {
        const btn = document.createElement('button');
        btn.id = `sidebar-btn-${menu.id}`;
        btn.onclick = () => switchTab(menu.id);
        btn.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left outline-none text-slate-500 hover:bg-slate-50 hover:text-slate-900";
        
        let innerHTML = `<span class="flex items-center gap-3"><i class="fa-solid ${menu.icon} text-sm text-slate-400"></i> ${menu.label}</span>`;
        if (menu.badge) {
            innerHTML += `<span class="bg-red-500 text-white text-4xs font-black px-1.5 py-0.5 rounded-full">${menu.badge}</span>`;
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
}
function handleRelationAjaxSubmit(event) {
    event.preventDefault();

    const siswa = document.getElementById('rel-siswa').value;
    const wali = document.getElementById('rel-wali').value;
    const tipe = document.querySelector('input[name="rel-type"]:checked').value;
    const submitBtn = document.getElementById('rel-submit-btn');
    const ajaxLoader = document.getElementById('rel-ajax-loader');

    if (!siswa || !wali) return alert('Mohon lengkapi parameter entitas data siswa dan wali!');

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-2xs"></i> Menyinkronkan Data...`;
    
    ajaxLoader.classList.remove('hidden');

    setTimeout(() => {
        const tableBody = document.getElementById('rel-table-body');
        const newRow = document.createElement('tr');
        newRow.className = "hover:bg-slate-50/50 bg-emerald-50/20 transition-all border-l-4 border-emerald-500";
        
        let badgeStyle = "bg-blue-50 text-blue-700";
        if (tipe === 'IBU') badgeStyle = "bg-pink-50 text-pink-700";
        if (tipe === 'WALI') badgeStyle = "bg-slate-100 text-slate-700";

        newRow.innerHTML = `
            <td class="px-4 py-3"><p class="font-bold text-slate-900">${siswa}</p><p class="text-3xs text-slate-400 font-normal">NISN: 0098231456</p></td>
            <td class="px-4 py-3"><p>${wali}</p><p class="text-3xs text-slate-400 font-normal">automatic.api@school.id</p></td>
            <td class="px-4 py-3"><span class="text-3xs font-bold ${badgeStyle} px-2 py-0.5 rounded">${tipe}</span></td>
            <td class="px-4 py-3"><span class="flex items-center gap-1 text-3xs text-amber-600"><span class="w-1 h-1 bg-amber-500 rounded-full animate-ping"></span> Pending (Email Sent)</span></td>
            <td class="px-4 py-3 text-center text-slate-400"><button class="hover:text-blue-600 mx-1"><i class="fa-regular fa-pen-to-square"></i></button><button class="hover:text-red-600 mx-1"><i class="fa-regular fa-trash-can"></i></button></td>
        `;

        tableBody.insertBefore(newRow, tableBody.firstChild);

        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk text-2xs"></i> Simpan Relasi`;
        ajaxLoader.classList.add('hidden');

        document.getElementById('rel-siswa').value = '';
        document.getElementById('rel-wali').value = '';
        
        alert('Data Relasi Baru Berhasil Disimpan melalui AJAX Request! Notifikasi Email Keamanan telah dipicu otomatis via REST API.');
    }, 2000);
}