/**
 * js/kepala_sekolah/laporan_keuangan.js
 * Monitor pembayaran siswa untuk kepala sekolah
 */

let isKepsekKeuanganLoaded = false;
let _kepsekKeuanganAllData = [];

async function showKepsekLaporanKeuanganPage() {
    if (!isKepsekKeuanganLoaded) {
        try {
            const res  = await fetch('pages/kepala_sekolah/laporan_keuangan.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('kepsek-laporan-keuangan-page-container').innerHTML = html;
            isKepsekKeuanganLoaded = true;
        } catch (e) {
            console.error('Gagal load kepsek keuangan HTML:', e);
            return;
        }
    }

    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-kepsek-laporan-keuangan');
    if (page) page.classList.remove('hidden');

    kepsekKeuanganLoadData();
}

async function kepsekKeuanganLoadData() {
    const tbody = document.getElementById('kepsek-keu-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl mb-2"></i><br>Memuat data...</td></tr>';

    try {
        const res  = await fetch(`${API_BASE}/admin/keuangan/list.php`, { headers: authHeaders() });
        const data = await res.json();

        if (data.success) {
            _kepsekKeuanganAllData = data.data || [];

            // Stats
            if (data.stats) {
                const fmtRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
                document.getElementById('kepsek-keu-total').textContent     = fmtRp((data.stats.total_pendapatan || 0) + (data.stats.total_tunggakan || 0));
                document.getElementById('kepsek-keu-lunas').textContent     = fmtRp(data.stats.total_pendapatan || 0);
                document.getElementById('kepsek-keu-menunggu').textContent  = data.stats.menunggu_konfirmasi || 0;
                document.getElementById('kepsek-keu-tunggakan').textContent = fmtRp(data.stats.total_tunggakan || 0);
            }

            kepsekKeuanganRender(_kepsekKeuanganAllData);
        }
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Gagal memuat data</td></tr>';
    }
}

function kepsekKeuanganRender(list) {
    const tbody = document.getElementById('kepsek-keu-tbody');
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">Tidak ada data</td></tr>';
        return;
    }

    const fmtRp   = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    tbody.innerHTML = list.map(p => {
        let badge = '';
        if (p.status === 'Lunas')                badge = '<span class="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">Lunas</span>';
        else if (p.status === 'Menunggu Konfirmasi') badge = '<span class="px-2 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 border border-amber-100">Menunggu</span>';
        else if (p.status === 'Overdue')          badge = '<span class="px-2 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-100">Overdue</span>';
        else                                      badge = '<span class="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-200">Belum Bayar</span>';

        return `<tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4"><p class="font-bold text-slate-800">${p.nama_siswa}</p><p class="text-xs text-slate-500">${p.kelas || '-'}</p></td>
            <td class="px-6 py-4 font-medium">${p.tipe_pembayaran}</td>
            <td class="px-6 py-4 font-bold">${fmtRp(p.jumlah)}</td>
            <td class="px-6 py-4 text-slate-500">${fmtDate(p.tgl_jatuh_tempo)}</td>
            <td class="px-6 py-4">${badge}</td>
        </tr>`;
    }).join('');
}

function kepsekKeuanganSearch() {
    const q = (document.getElementById('kepsek-keu-search')?.value || '').toLowerCase();
    if (!q) {
        kepsekKeuanganRender(_kepsekKeuanganAllData);
        return;
    }
    const filtered = _kepsekKeuanganAllData.filter(p =>
        (p.nama_siswa || '').toLowerCase().includes(q) ||
        (p.kelas || '').toLowerCase().includes(q) ||
        (p.tipe_pembayaran || '').toLowerCase().includes(q)
    );
    kepsekKeuanganRender(filtered);
}

