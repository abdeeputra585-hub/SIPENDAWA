<?php
$file = 'c:\laragon\www\uts_pemograman\script.js';
$content = file_get_contents($file);

$marker_start_lf = "// ============================================================\n// MASTER DATA: MATA PELAJARAN\n// ============================================================";
$marker_start_crlf = "// ============================================================\r\n// MASTER DATA: MATA PELAJARAN\r\n// ============================================================";
$marker_end = "// ======== EDIT PROFIL WALI (PARENT) ========";

$pos_start = strpos($content, $marker_start_lf);
if ($pos_start === false) $pos_start = strpos($content, $marker_start_crlf);
$pos_end = strpos($content, $marker_end);

if ($pos_start !== false && $pos_end !== false) {
    $before = substr($content, 0, $pos_start);
    $after = substr($content, $pos_end);
    
    $fixed_middle = "// ============================================================
// MASTER DATA: MATA PELAJARAN
// ============================================================
async function loadDataMapel() {
    const tbody = document.getElementById('tabel-mapel');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan=\"4\" class=\"text-center py-8 text-slate-400\">Memuat data...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/admin/mapel.php`, { headers: authHeaders() });
        const data = await res.json();
        
        if (data.success) {
            window.mapelDataList = data.data;
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan=\"4\" class=\"text-center py-8 text-slate-400\">Belum ada data mata pelajaran</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.map(m => `
                <tr class=\"hover:bg-slate-50 transition-colors\">
                    <td class=\"px-5 py-3 font-bold text-blue-700\">${m.nama_pelajaran}</td>
                    <td class=\"px-5 py-3 text-slate-500\">${m.kode_pelajaran || '-'}</td>
                    <td class=\"px-5 py-3 text-slate-700 text-sm\">${m.guru_names ? m.guru_names : '<span class=\"text-slate-400 italic\">Belum diatur</span>'}</td>
                    <td class=\"px-5 py-3 text-center admin-only\">
                        <div class=\"flex items-center justify-center gap-2\">
                            <button onclick=\"editMapel(${m.id})\" class=\"w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors\"><i class=\"fa-solid fa-pen\"></i></button>
                            <button onclick=\"hapusMapel(${m.id}, '${m.nama_pelajaran}')\" class=\"w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors\"><i class=\"fa-solid fa-trash\"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan=\"4\" class=\"text-center py-8 text-red-500\">Gagal memuat data</td></tr>';
    }
}

async function fetchGuruMapelOptions(selectedGuruIds = []) {
    const container = document.getElementById('mapel-guru-list');
    container.innerHTML = '<div class=\"text-xs text-slate-400 italic text-center py-4\">Memuat daftar guru...</div>';
    try {
        const res = await fetch(`${API_BASE}/admin/guru/list_all.php`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            if (data.data.length === 0) {
                container.innerHTML = '<div class=\"text-xs text-slate-400 italic text-center py-4\">Belum ada data guru</div>';
                return;
            }
            let html = '';
            data.data.forEach(g => {
                const isSelected = selectedGuruIds.includes(g.id.toString()) || selectedGuruIds.includes(g.id);
                const checked = isSelected ? 'checked' : '';
                html += `
                    <label class=\"flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200\">
                        <input type=\"checkbox\" name=\"mapel_guru_ids\" value=\"${g.id}\" class=\"w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500\" ${checked}>
                        <div class=\"flex flex-col\">
                            <span class=\"text-sm font-bold text-slate-700\">${g.nama}</span>
                            <span class=\"text-[10px] text-slate-400\">NIP: ${g.nip}</span>
                        </div>
                    </label>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class=\"text-xs text-red-500 text-center py-4\">Gagal memuat guru</div>';
        }
    } catch(e) {
        container.innerHTML = '<div class=\"text-xs text-red-500 text-center py-4\">Error jaringan</div>';
    }
}

function openModalMapel() {
    document.getElementById('mapel-id').value = '';
    document.getElementById('mapel-nama').value = '';
    document.getElementById('mapel-kode').value = '';
    fetchGuruMapelOptions([]);
    document.getElementById('modal-mapel').classList.remove('hidden');
}

async function simpanMapel(e) {
    e.preventDefault();
    const id = document.getElementById('mapel-id').value;
    const nama_pelajaran = document.getElementById('mapel-nama').value;
    const kode_pelajaran = document.getElementById('mapel-kode').value;
    
    const checkboxes = document.querySelectorAll('input[name=\"mapel_guru_ids\"]:checked');
    const guru_ids = Array.from(checkboxes).map(cb => cb.value);
    
    const method = id ? 'PUT' : 'POST';
    const payload = { nama_pelajaran, kode_pelajaran, guru_ids };
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

function editMapel(id) {
    const mapel = window.mapelDataList?.find(m => m.id == id);
    if (!mapel) return;
    document.getElementById('mapel-id').value = mapel.id;
    document.getElementById('mapel-nama').value = mapel.nama_pelajaran;
    document.getElementById('mapel-kode').value = mapel.kode_pelajaran || '';
    fetchGuruMapelOptions(mapel.guru_ids || []);
    document.getElementById('modal-mapel').classList.remove('hidden');
}

function hapusMapel(id, nama) {
    Swal.fire({
        title: `Hapus Mapel \${nama}?`,
        text: 'Data yang dihapus tidak bisa dikembalikan!',
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

\n\n";

    file_put_contents($file, $before . $fixed_middle . $after);
    echo "Fixed script.js successfully!";
} else {
    echo "Markers not found!";
}
?>
