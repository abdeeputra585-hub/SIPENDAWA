/**
 * js/parent/pengumuman.js
 */

let parentPengumumanCurrentPage = 1;
let isParentPengumumanHtmlLoaded = false;

async function showParentPengumumanPage() {
    if (!isParentPengumumanHtmlLoaded) {
        try {
            const res = await fetch('pages/parent/pengumuman.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('parent-pengumuman-page-container').innerHTML = html;
            isParentPengumumanHtmlLoaded = true;
        } catch(e) {
            console.error('Failed to load HTML', e);
            return;
        }
    }
    
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-parent-pengumuman');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    parentPengumumanLoadList(1);
}

async function parentPengumumanLoadList(page = 1) {
    parentPengumumanCurrentPage = page;
    const kategori = document.getElementById('parent-pengumuman-kategori').value;
    const feed = document.getElementById('parent-pengumuman-feed');
    
    feed.innerHTML = '<div class="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-500 mb-2"></i><br>Memuat pengumuman...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/pengumuman/list.php?kategori=${encodeURIComponent(kategori)}&limit=10&offset=${(page-1)*10}`, {
            headers: authHeaders()
        });
        const response = await res.json();
        
        if (response.success) {
            const data = response.data;
            feed.innerHTML = '';
            
            if (data.items.length === 0) {
                feed.innerHTML = '<div class="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm"><div class="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl"><i class="fa-solid fa-inbox"></i></div><p class="font-bold">Tidak ada pengumuman</p><p class="text-xs mt-1">Belum ada info terbaru untuk kategori ini.</p></div>';
            } else {
                data.items.forEach(p => {
                    const isUnread = p.is_read === 0;
                    
                    // Kategori styling
                    let catColor = 'bg-slate-100 text-slate-600';
                    let icon = 'fa-info-circle';
                    
                    if (p.kategori === 'Info Penting') { catColor = 'bg-red-50 text-red-600 border-red-100'; icon = 'fa-exclamation-circle'; }
                    else if (p.kategori === 'Akademik') { catColor = 'bg-blue-50 text-blue-600 border-blue-100'; icon = 'fa-graduation-cap'; }
                    else if (p.kategori === 'Event') { catColor = 'bg-purple-50 text-purple-600 border-purple-100'; icon = 'fa-calendar-star'; }
                    else if (p.kategori === 'Keuangan') { catColor = 'bg-emerald-50 text-emerald-600 border-emerald-100'; icon = 'fa-wallet'; }
                    
                    const card = document.createElement('div');
                    card.className = `bg-white p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${isUnread ? 'border-blue-300 shadow-md ring-1 ring-blue-50' : 'border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md'}`;
                    card.onclick = () => parentPengumumanOpenDetail(p.id);
                    
                    // Unread indicator line
                    if (isUnread) {
                        const line = document.createElement('div');
                        line.className = 'absolute left-0 top-0 bottom-0 w-1 bg-blue-500';
                        card.appendChild(line);
                    }
                    
                    card.innerHTML += `
                        <div class="flex justify-between items-start gap-4 mb-3">
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-1 text-2xs font-bold uppercase tracking-wider rounded-lg border ${catColor}">
                                    <i class="fa-solid ${icon} mr-1"></i> ${p.kategori}
                                </span>
                                ${isUnread ? '<span class="px-2 py-0.5 bg-blue-600 text-white text-2xs font-bold rounded-md uppercase tracking-wider shadow-sm animate-pulse">Baru</span>' : ''}
                            </div>
                            <div class="text-xs text-slate-400 font-medium whitespace-nowrap">
                                <i class="fa-regular fa-clock"></i> ${formatDateIDLocal(p.created_at)}
                            </div>
                        </div>
                        <h3 class="text-lg font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'} group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                            ${p.judul}
                        </h3>
                        <p class="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                            ${p.preview}
                        </p>
                        <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                            <div class="text-xs text-slate-500 flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-3xs">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <span>Oleh: <span class="font-bold text-slate-700">${p.penulis_nama}</span></span>
                            </div>
                            <span class="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Baca Selengkapnya <i class="fa-solid fa-arrow-right"></i>
                            </span>
                        </div>
                    `;
                    
                    feed.appendChild(card);
                });
            }
            parentPengumumanRenderPagination(data.total, data.limit, page);
        } else {
            showToast(response.message || response.error ||  'Terjadi kesalahan', 'error');
        }
    } catch (e) {
        showToast('Gagal memuat pengumuman', 'error');
    }
}

function parentPengumumanRenderPagination(total, limit, current) {
    const totalPages = Math.ceil(total / limit) || 1;
    const container = document.getElementById('parent-pengumuman-pagination');
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === current) {
            html += `<button class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md">${i}</button>`;
        } else {
            html += `<button onclick="parentPengumumanLoadList(${i})" class="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition">${i}</button>`;
        }
    }
    container.innerHTML = html;
}

async function parentPengumumanOpenDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/pengumuman/detail.php?id=${id}`, { headers: authHeaders() });
        const response = await res.json();
        
        if (response.success) {
            const p = response.data;
            
            document.getElementById('parent-detail-kategori').textContent = p.kategori;
            document.getElementById('parent-detail-judul').textContent = p.judul;
            document.getElementById('parent-detail-tanggal').textContent = formatDateIDLocal(p.created_at);
            document.getElementById('parent-detail-penulis').textContent = p.penulis_nama;
            document.getElementById('parent-detail-konten').innerHTML = p.konten;
            
            const attachmentContainer = document.getElementById('parent-detail-attachment-container');
            const attachmentLink = document.getElementById('parent-detail-attachment-link');
            const attachmentName = document.getElementById('parent-detail-attachment-name');
            
            if (p.attachment) {
                attachmentLink.href = p.attachment;
                const ext = p.attachment.split('.').pop().toUpperCase();
                attachmentName.textContent = `Unduh Lampiran (${ext})`;
                attachmentContainer.classList.remove('hidden');
            } else {
                attachmentContainer.classList.add('hidden');
            }
            
            document.getElementById('modal-parent-pengumuman').classList.remove('hidden');
            
            // Reload list softly to update the unread line styling
            setTimeout(() => {
                parentPengumumanLoadList(parentPengumumanCurrentPage);
                updatePengumumanBadge(); // from script.js to update sidebar notification
            }, 1000);
            
        } else {
            showToast('Gagal memuat detail pengumuman', 'error');
        }
    } catch(e) {
        showToast('Terjadi kesalahan', 'error');
    }
}

function parentPengumumanCloseModal() {
    document.getElementById('modal-parent-pengumuman').classList.add('hidden');
}

function formatDateIDLocal(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}


