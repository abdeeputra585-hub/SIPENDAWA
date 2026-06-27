/**
 * js/parent/pembayaran.js
 */

let parentPembayaranCurrentId = null;
let parentPembayaranSelectedFile = null;
let isParentPembayaranHtmlLoaded = false;
let parentPembayaranDetailData = null;

async function showParentPembayaranPage() {
    if (!isParentPembayaranHtmlLoaded) {
        try {
            const res = await fetch('pages/parent/pembayaran.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('parent-pembayaran-page-container').innerHTML = html;
            isParentPembayaranHtmlLoaded = true;
        } catch(e) {
            console.error('Failed to load HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-parent-pembayaran');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    // Populate dropdown if not populated
    const select = document.getElementById('pembayaran-siswa-select');
    if (select && select.options.length <= 1 && typeof _parentSiswaList !== 'undefined') {
        let html = '<option value="">Pilih Anak...</option>';
        _parentSiswaList.forEach(s => {
            html += `<option value="${s.id}">${s.nama} (${s.kelas})</option>`;
        });
        select.innerHTML = html;
        if (_parentSiswaList.length > 0) {
            select.value = _parentSiswaList[0].id;
        }
    }

    parentPembayaranLoadAll();
}

function parentPembayaranLoadAll() {
    const idSiswa = document.getElementById('pembayaran-siswa-select')?.value;
    if (!idSiswa) {
        document.getElementById('pembayaran-tbody').innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Pilih anak untuk melihat tagihan</td></tr>';
        return;
    }
    parentPembayaranLoadSummary(idSiswa);
    parentPembayaranLoadList(idSiswa);
}

async function parentPembayaranLoadSummary(idSiswa) {
    try {
        const res = await fetch(`${API_BASE}/pembayaran/summary.php?id_siswa=${idSiswa}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            const sum = data.data;
            document.getElementById('summary-total-tagihan').textContent = formatRupiah(sum.total_tagihan);
            document.getElementById('summary-total-terbayar').textContent = formatRupiah(sum.total_terbayar);
            document.getElementById('summary-sisa-tagihan').textContent = formatRupiah(sum.sisa_tagihan);
            document.getElementById('summary-total-overdue').textContent = formatRupiah(sum.total_overdue);
        }
    } catch(e) {
        console.error(e);
    }
}

async function parentPembayaranLoadList(idSiswa = null) {
    if(!idSiswa) idSiswa = document.getElementById('pembayaran-siswa-select')?.value;
    if(!idSiswa) return;

    const tbody = document.getElementById('pembayaran-tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400"><i class="fa-solid fa-spinner animate-spin text-2xl mb-2"></i><br>Memuat data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/pembayaran/list.php?id_siswa=${idSiswa}`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400"><i class="fa-solid fa-check-circle text-3xl mb-3 text-slate-300"></i><br>Tidak ada tagihan untuk siswa ini</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(p => {
                return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-800">${p.tipe_pembayaran}</td>
                    <td class="px-6 py-4 font-medium">${formatRupiah(p.jumlah)}</td>
                    <td class="px-6 py-4 text-slate-500">${formatDateIDLocal(p.tgl_jatuh_tempo)}</td>
                    <td class="px-6 py-4">${getPaymentStatusBadge(p.status)}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="parentPembayaranOpenDetail(${p.id})" class="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            ${p.status === 'Lunas' ? 'Lihat Kuitansi' : 'Bayar / Detail'}
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Gagal memuat data pembayaran</td></tr>';
    }
}

async function parentPembayaranOpenDetail(id) {
    parentPembayaranCurrentId = id;
    parentPembayaranSelectedFile = null;
    
    const displayFile = document.getElementById('file-name-display');
    if(displayFile) { displayFile.textContent = ''; displayFile.classList.add('hidden'); }
    const btn = document.getElementById('btn-upload-bukti');
    if(btn) { btn.disabled = true; btn.textContent = 'Kirim Bukti Pembayaran'; }
    document.getElementById('pembayaran-file').value = '';

    try {
        const res = await fetch(`${API_BASE}/pembayaran/detail.php?id=${id}`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            const p = data.data;
            parentPembayaranDetailData = p; // store for PDF

            document.getElementById('det-tipe').textContent = p.tipe_pembayaran;
            document.getElementById('det-jumlah').textContent = formatRupiah(p.jumlah);
            document.getElementById('det-tempo').textContent = formatDateIDLocal(p.tgl_jatuh_tempo);
            document.getElementById('det-status').innerHTML = getPaymentStatusBadge(p.status);

            const uploadSec = document.getElementById('upload-section');
            const receiptSec = document.getElementById('receipt-section');
            const reviewDiv = document.getElementById('bukti-review');
            const btnDownload = document.getElementById('btn-download-receipt');

            uploadSec.classList.add('hidden');
            receiptSec.classList.add('hidden');
            reviewDiv.innerHTML = '';
            btnDownload.classList.add('hidden');

            if (p.status === 'Belum bayar' || p.status === 'Overdue') {
                uploadSec.classList.remove('hidden');
            } else if (p.status === 'Menunggu Konfirmasi') {
                receiptSec.classList.remove('hidden');
                reviewDiv.innerHTML = `<div class="bg-amber-50 p-4 border border-amber-200 rounded-xl text-center"><i class="fa-solid fa-clock text-amber-500 text-2xl mb-2"></i><p class="font-bold text-amber-700 text-sm">Sedang Diverifikasi Admin</p><p class="text-xs text-amber-600 mt-1">Bukti pembayaran Anda sudah diterima dan sedang dalam proses pengecekan.</p></div>`;
            } else if (p.status === 'Lunas') {
                receiptSec.classList.remove('hidden');
                btnDownload.classList.remove('hidden');
                document.getElementById('det-invoice').textContent = p.invoice_number || '-';
                document.getElementById('det-tgl-bayar').textContent = formatDateIDLocal(p.tgl_bayar);
            }

            const modal = document.getElementById('modal-pembayaran-detail');
            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.remove('opacity-0'); modal.firstElementChild.classList.remove('scale-95'); }, 10);
        }
    } catch(e) {
        showToast('Gagal memuat detail', 'error');
    }
}

function parentPembayaranCloseModal() {
    const modal = document.getElementById('modal-pembayaran-detail');
    modal.classList.add('opacity-0');
    modal.firstElementChild.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function parentPembayaranHandleFile(input) {
    if (input.files && input.files[0]) {
        parentPembayaranSelectedFile = input.files[0];
        const display = document.getElementById('file-name-display');
        display.textContent = `File: ${parentPembayaranSelectedFile.name}`;
        display.classList.remove('hidden');
        document.getElementById('btn-upload-bukti').disabled = false;
    }
}

async function parentPembayaranSubmitUpload() {
    if (!parentPembayaranSelectedFile || !parentPembayaranCurrentId) return;

    const btn = document.getElementById('btn-upload-bukti');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Mengunggah...';

    const formData = new FormData();
    formData.append('id', parentPembayaranCurrentId);
    formData.append('bukti_file', parentPembayaranSelectedFile);

    try {
        const res = await fetch(`${API_BASE}/pembayaran/upload-bukti.php`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + appState.token },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Bukti berhasil diunggah', 'success');
            parentPembayaranCloseModal();
            parentPembayaranLoadAll(); // reload
        } else {
            showToast('⚠ ' + data.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Kirim Bukti Pembayaran';
        }
    } catch(e) {
        showToast('⚠ Gagal terhubung ke server', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Kirim Bukti Pembayaran';
    }
}

function parentPembayaranDownloadReceipt() {
    if (!parentPembayaranDetailData || typeof window.jspdf === 'undefined') {
        showToast('Library PDF belum dimuat atau data kosong', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ format: 'a5', orientation: 'landscape' });
    const p = parentPembayaranDetailData;

    // Header
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SIPENDAWA - Kuitansi Pembayaran', 10, 16);

    // Invoice Meta
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. Invoice : ${p.invoice_number}`, 10, 40);
    doc.text(`Tanggal Bayar : ${formatDateIDLocal(p.tgl_bayar)}`, 10, 46);
    
    // Student Meta
    doc.setFont('helvetica', 'bold');
    doc.text('Diterima Dari:', 100, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama Siswa  : ${p.nama_siswa}`, 100, 46);
    doc.text(`NISN / Kelas: ${p.nisn || '-'} / ${p.kelas || '-'}`, 100, 52);

    // Box Table
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(10, 65, 190, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Deskripsi Pembayaran', 15, 71);
    doc.text('Jumlah', 160, 71);

    doc.setFont('helvetica', 'normal');
    doc.text(p.tipe_pembayaran, 15, 85);
    doc.text(formatRupiah(p.jumlah), 160, 85);

    doc.line(10, 95, 200, 95);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text('Total Lunas:', 120, 105);
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105); // emerald
    doc.text(formatRupiah(p.jumlah), 160, 105);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('Dokumen ini sah dihasilkan secara elektronik oleh sistem SIPENDAWA.', 10, 130);

    doc.save(`Kuitansi_${p.invoice_number}.pdf`);
}

function getPaymentStatusBadge(status) {
    if (status === 'Lunas') return '<span class="px-2 py-1 text-2xs font-bold uppercase rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"><i class="fa-solid fa-check"></i> Lunas</span>';
    if (status === 'Menunggu Konfirmasi') return '<span class="px-2 py-1 text-2xs font-bold uppercase rounded-lg bg-amber-50 text-amber-600 border border-amber-100"><i class="fa-solid fa-clock"></i> Menunggu</span>';
    if (status === 'Overdue') return '<span class="px-2 py-1 text-2xs font-bold uppercase rounded-lg bg-red-50 text-red-600 border border-red-100"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>';
    return '<span class="px-2 py-1 text-2xs font-bold uppercase rounded-lg bg-slate-100 text-slate-600 border border-slate-200"><i class="fa-solid fa-circle-exclamation"></i> Belum Bayar</span>';
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// Format local date existing di file lain, tp jaga2 jika tidak ada
if (typeof formatDateIDLocal !== 'function') {
    window.formatDateIDLocal = function(dateString) {
        if(!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
}

