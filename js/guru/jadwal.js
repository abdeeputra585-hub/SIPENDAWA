/**
 * js/guru/jadwal.js
 * Halaman Jadwal Mengajar — menampilkan mapel dan kelas yang diampu guru
 */

let isGuruJadwalHtmlLoaded = false;

async function showGuruJadwalPage() {
    if (!isGuruJadwalHtmlLoaded) {
        try {
            const res  = await fetch('pages/guru/jadwal.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('guru-jadwal-page-container').innerHTML = html;
            isGuruJadwalHtmlLoaded = true;
        } catch (e) {
            console.error('Gagal load jadwal HTML:', e);
            return;
        }
    }

    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-guru-jadwal');
    if (page) page.classList.remove('hidden');

    guruJadwalLoad();
}

async function guruJadwalLoad() {
    const loading = document.getElementById('guru-jadwal-loading');
    const content = document.getElementById('guru-jadwal-content');
    if (loading) loading.classList.remove('hidden');
    if (content) content.classList.add('hidden');

    try {
        const res  = await fetch(`${API_BASE}/guru/profil.php`, { headers: authHeaders() });
        const json = await res.json();

        if (!json.success) {
            showToast(json.error || 'Gagal memuat jadwal', 'error');
            return;
        }

        const d = json.data;

        // Summary cards
        document.getElementById('jadwal-total-mapel').textContent = (d.mata_pelajaran || []).length;
        document.getElementById('jadwal-total-kelas').textContent = (d.kelas_ampuan || []).length;
        const statusEl = document.getElementById('jadwal-status');
        if (d.is_active == 1) {
            statusEl.textContent = 'Aktif';
            statusEl.className = 'text-lg font-black text-emerald-600';
        } else {
            statusEl.textContent = 'Nonaktif';
            statusEl.className = 'text-lg font-black text-red-500';
        }

        // Mapel grid
        const mapelGrid = document.getElementById('jadwal-mapel-grid');
        const mapel = d.mata_pelajaran || [];
        if (mapel.length === 0) {
            mapelGrid.innerHTML = '<p class="text-sm text-slate-400 italic col-span-full">Belum ada mata pelajaran yang ditugaskan</p>';
        } else {
            const colors = ['blue','indigo','violet','purple','fuchsia','pink'];
            mapelGrid.innerHTML = mapel.map((m, i) => {
                const c = colors[i % colors.length];
                return `
                <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 bg-${c}-100 text-${c}-600 rounded-xl flex items-center justify-center text-lg">
                            <i class="fa-solid fa-book-open"></i>
                        </div>
                        <h4 class="font-bold text-slate-800">${m}</h4>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <i class="fa-solid fa-chalkboard"></i>
                        <span>Mata Pelajaran Aktif</span>
                    </div>
                </div>`;
            }).join('');
        }

        // Kelas grid
        const kelasGrid = document.getElementById('jadwal-kelas-grid');
        const kelas = d.kelas_ampuan || [];
        if (kelas.length === 0) {
            kelasGrid.innerHTML = '<p class="text-sm text-slate-400 italic col-span-full">Belum ada kelas yang ditugaskan</p>';
        } else {
            kelasGrid.innerHTML = kelas.map(k => `
                <div class="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm hover:border-emerald-300 transition-colors cursor-default">
                    <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-lg">
                        <i class="fa-solid fa-door-open"></i>
                    </div>
                    <p class="font-bold text-slate-800 text-sm">${k}</p>
                </div>
            `).join('');
        }

        if (loading) loading.classList.add('hidden');
        if (content) content.classList.remove('hidden');

    } catch (e) {
        console.error('Error guruJadwalLoad:', e);
        showToast('Gagal memuat data jadwal', 'error');
    }
}

