/**
 * pesan.js - Real-time pesan System Logic
 */

let pesanPollingInterval = null;
let globalpesanPollingInterval = null;
let currentpesanConvId = 0;
let currentpesanOtherUser = 0;
let pesanContacts = [];

let ispesanHtmlLoaded = false;

// ======= INIT & UI =======

async function initGlobalpesanPolling() {
    if (globalpesanPollingInterval) clearInterval(globalpesanPollingInterval);
    if (appState.currentUser && (appState.currentUser.role === 'guru' || appState.currentUser.role === 'parent')) {
        // Initial fetch
        loadpesanList();
        // Poll every 10 seconds for global badge
        globalpesanPollingInterval = setInterval(() => {
            if (appState.currentTab !== 'pesan') {
                loadpesanListSilent();
            }
        }, 10000);
    }
}

async function loadpesanListSilent() {
    try {
        const res = await fetch(`${API_BASE}/pesan/list.php`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            let totalUnread = 0;
            data.conversations.forEach(pesan => { totalUnread += parseInt(pesan.unread_count); });
            updateGlobalpesanBadge(totalUnread);
        }
    } catch(e) {}
}

async function showpesanPage() {
    if (!ispesanHtmlLoaded) {
        try {
            // Kita perlu mengambil template pesan.html karena dipisah dari index
            const res = await fetch('pages/pesan.html?v=' + new Date().getTime());
            const html = await res.text();
            document.getElementById('pesan-app-container').innerHTML = html;
            ispesanHtmlLoaded = true;
        } catch (e) {
            console.error("Gagal memuat template pesan", e);
            return;
        }
    }
    
    // Switch visibility since we are managing it dynamically now
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    const targetedPageDOM = document.getElementById('page-pesan');
    if (targetedPageDOM) targetedPageDOM.classList.remove('hidden');

    await loadpesanList();
}

async function loadpesanList(isSilent = false) {
    try {
        const res = await fetch(`${API_BASE}/pesan/list.php`, {
            headers: authHeaders()
        });
        const data = await res.json();
        
        if (data.success) {
            let totalUnread = 0;
            if (data.conversations && data.conversations.length > 0) {
                data.conversations.forEach(pesan => {
                    totalUnread += parseInt(pesan.unread_count);
                });
            }

            // Update global badge FIRST, regardless of what page we are on
            updateGlobalpesanBadge(totalUnread);

            // Now, only if we are on the pesan page, we update the DOM
            const listContainer = document.getElementById('pesan-list-container');
            if (listContainer) {
                listContainer.innerHTML = '';
                
                if (data.conversations.length === 0) {
                    listContainer.innerHTML = '<div class="text-center text-xs text-slate-500 py-10">Belum ada percakapan. Mulai obrolan baru!</div>';
                } else {
                    data.conversations.forEach(pesan => {
                        const unreadCount = parseInt(pesan.unread_count);
                        
                        const timeStr = formatWhatsAppTime(pesan.last_message_at);
                        
                        const avatar = pesan.other_foto ? pesan.other_foto : `https://ui-avatars.com/api/?name=${encodeURIComponent(pesan.other_name)}&background=random`;
                        
                        const unreadBadge = unreadCount > 0 
                            ? `<div class="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">${unreadCount}</div>`
                            : '';

                        const isSelected = currentpesanConvId === pesan.id ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-transparent border-transparent hover:bg-slate-50';

                        const item = document.createElement('div');
                        item.className = `p-2 rounded-xl border flex gap-3 cursor-pointer transition-colors pesan-list-item ${isSelected}`;
                        item.onclick = () => openpesanRoom(pesan.id, pesan.id_other_user, pesan.other_user_name, pesan.other_user_role, avatar);
                        
                        // Format message snippet
                        let snippet = pesan.last_message_preview || 'Tidak ada pesan';
                        if (snippet.length > 30) snippet = snippet.substring(0, 30) + '...';

                        item.innerHTML = `
                            <img src="${avatar}" class="w-10 h-10 rounded-full object-cover shrink-0">
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-center mb-1">
                                    <h4 class="font-bold text-slate-800 text-xs truncate">${pesan.other_name}</h4>
                                    <span class="text-[9px] text-slate-400 shrink-0">${timeStr}</span>
                                </div>
                                <div class="flex justify-between items-center gap-2">
                                    <p class="text-xs text-slate-500 truncate">${snippet}</p>
                                    ${unreadBadge}
                                </div>
                            </div>
                        `;
                        listContainer.appendChild(item);
                    });
                }
            }
        }

    } catch (e) {
        console.error("Failed to load pesan list", e);
    }
}

function updateGlobalpesanBadge(count) {
    const badgeElements = document.querySelectorAll(`[id^="menu-badge-pesan"]`);
    badgeElements.forEach(el => {
        if (count > 0) {
            el.textContent = count > 99 ? '99+' : count;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

function filterpesanList() {
    const q = document.getElementById('pesan-search-input').value.toLowerCase();
    const items = document.querySelectorAll('.pesan-list-item');
    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        if (name.includes(q)) item.style.display = 'flex';
        else item.style.display = 'none';
    });
}

// ======= pesan ROOM =======

async function openpesanRoom(convId, otherUserId, otherName, otherRole, otherAvatar) {
    currentpesanConvId = parseInt(convId);
    currentpesanOtherUser = parseInt(otherUserId);
    
    document.getElementById('pesan-empty-state').classList.add('hidden');
    document.getElementById('pesan-active-state').classList.remove('hidden');
    document.getElementById('pesan-active-state').classList.add('flex');
    
    document.getElementById('pesan-room-name').textContent = otherName;
    document.getElementById('pesan-room-role').textContent = otherRole === 'guru' ? 'Guru' : 'Wali Murid';
    document.getElementById('pesan-room-avatar').src = otherAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}`;
    
    // For mobile
    const pesanRoom = document.getElementById('pesan-active-state').parentElement;
    pesanRoom.classList.add('z-50');
    if(window.innerWidth < 768) {
        pesanRoom.style.position = 'fixed';
        pesanRoom.style.inset = '0';
        pesanRoom.style.height = '100vh';
        pesanRoom.style.borderRadius = '0';
    }

    // Clear previous polling
    if (pesanPollingInterval) clearInterval(pesanPollingInterval);
    
    // Load immediately
    await loadpesanHistory(currentpesanConvId, currentpesanOtherUser);
    
    // Start polling every 3 seconds
    pesanPollingInterval = setInterval(() => {
        loadpesanHistory(currentpesanConvId, currentpesanOtherUser, true);
    }, 3000);
    
    // Re-highlight active list
    loadpesanList();
}

function closepesanRoomMobile() {
    document.getElementById('pesan-empty-state').classList.remove('hidden');
    document.getElementById('pesan-active-state').classList.add('hidden');
    document.getElementById('pesan-active-state').classList.remove('flex');
    
    const pesanRoom = document.getElementById('pesan-active-state').parentElement;
    pesanRoom.classList.remove('z-50');
    pesanRoom.style.position = 'relative';
    pesanRoom.style.height = 'calc(100vh - 10rem)';
    pesanRoom.style.borderRadius = '1rem';
    
    if (pesanPollingInterval) clearInterval(pesanPollingInterval);
    currentpesanConvId = 0;
    currentpesanOtherUser = 0;
}

async function loadpesanHistory(convId, otherUserId, isSilent = false) {
    if (!isSilent) {
        document.getElementById('pesan-messages-container').innerHTML = '<div class="text-center text-slate-400 py-4"><i class="fa-solid fa-spinner animate-spin text-fuchsia-500"></i></div>';
    }

    try {
        const res = await fetch(`${API_BASE}/pesan/history.php?id_recipient=${otherUserId}`, {
            headers: authHeaders()
        });
        const data = await res.json();
        
        if (data.success) {
            renderpesanMessages(data.messages);
        }
    } catch (e) {
        console.error("Failed loading history", e);
    }
}

function renderpesanMessages(messages) {
    const container = document.getElementById('pesan-messages-container');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="flex-1 flex items-center justify-center text-xs text-slate-400">Belum ada pesan. Sapa mereka!</div>';
        return;
    }
    
    // Check if scroll is at bottom before rendering to auto-scroll later
    const isScrolledToBottom = container.scrollTop <= 0; // flex-col-reverse makes scrollTop negative or 0 depending on browser, generally 0 is bottom

    container.innerHTML = '';
    
    // Karena flex-col-reverse, elemen pertama di DOM akan tampil paling bawah.
    // array messages dari backend berurut DESC (index 0 = pesan terbaru).
    // Jadi kita harus melooping dari 0 ke akhir agar pesan terbaru ditambahkan pertama dan berada di bawah.
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isMe = parseInt(msg.id_sender) === parseInt(appState.currentUser.id);
        
        const timeStr = formatWhatsAppTime(msg.timestamp);
        
        const alignClass = isMe ? 'self-end items-end' : 'self-start items-start';
        const bubbleClass = isMe 
            ? 'bg-fuchsia-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
            : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-2xs';
            
        const timeColor = isMe ? 'text-fuchsia-200' : 'text-slate-400';
        
        // Read receipt (only for me)
        const readReceipt = isMe ? (
            parseInt(msg.dibaca) === 1 
                ? '<i class="fa-solid fa-check-double text-fuchsia-200 ml-1"></i>' 
                : '<i class="fa-solid fa-check text-fuchsia-200 ml-1"></i>'
        ) : '';

        // Attachment rendering
        let attachHTML = '';
        if (msg.attachment) {
            const ext = msg.attachment.split('.').pop().toLowerCase();
            const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext);
            
            if (isImg) {
                attachHTML = `<div class="mb-2 max-w-[200px] md:max-w-[250px] overflow-hidden rounded-xl border ${isMe ? 'border-fuchsia-500' : 'border-slate-200'} bg-black/5">
                    <img src="${msg.attachment}" class="w-full h-auto cursor-pointer hover:opacity-90" onclick="window.open('${msg.attachment}', '_blank')">
                </div>`;
            } else {
                attachHTML = `<a href="${msg.attachment}" target="_blank" class="flex items-center gap-3 p-2 mb-2 rounded-lg ${isMe ? 'bg-fuchsia-700 hover:bg-fuchsia-800' : 'bg-slate-50 hover:bg-slate-100'} transition-colors shadow-sm">
                    <i class="fa-solid fa-file-lines text-2xl ${isMe ? 'text-white' : 'text-slate-500'}"></i>
                    <div class="text-left overflow-hidden">
                        <div class="text-xs font-bold truncate ${isMe ? 'text-white' : 'text-slate-700'}">Attachment</div>
                        <div class="text-[9px] uppercase tracking-wider ${isMe ? 'text-fuchsia-200' : 'text-slate-500'}">Dokumen</div>
                    </div>
                </a>`;
            }
        }

        // Delete button for sender
        const deleteBtn = (isMe && parseInt(msg.is_deleted) === 0) 
            ? `<button onclick="deletepesanMessage(${msg.id})" class="text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 ${isMe ? '-left-6' : '-right-6'} text-red-400 hover:text-red-600" title="Hapus Pesan"><i class="fa-solid fa-trash"></i></button>`
            : '';

        const msgDiv = document.createElement('div');
        msgDiv.className = `flex flex-col max-w-[85%] md:max-w-[70%] group relative ${alignClass}`;
        
        let contentHTML = msg.isi_pesan;
        if (parseInt(msg.is_deleted) === 1) {
            contentHTML = `<i class="fa-solid fa-ban mr-1 opacity-60"></i> <span class="italic opacity-80">Pesan ini telah dihapus</span>`;
            bubbleClass += ' opacity-70';
        }

        msgDiv.innerHTML = `
            ${deleteBtn}
            <div class="px-4 py-2 ${bubbleClass}">
                ${attachHTML}
                <div class="text-sm whitespace-pre-wrap break-words leading-relaxed">${contentHTML}</div>
            </div>
            <div class="flex items-center mt-1 text-[10px] ${timeColor} px-1">
                ${timeStr}
                ${readReceipt}
            </div>
        `;
        
        container.appendChild(msgDiv);
    }
}

function formatWhatsAppTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    
    const timeStr = date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    
    if (isToday) {
        return timeStr;
    } else if (isYesterday) {
        return `Kemarin ${timeStr}`;
    } else {
        return `${date.toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${timeStr}`;
    }
}

// ======= SEND MESSAGES =======

let selectedpesanFile = null;

function previewpesanAttachment(input) {
    if (input.files && input.files[0]) {
        selectedpesanFile = input.files[0];
        const preview = document.getElementById('pesan-attachment-preview');
        document.getElementById('pesan-attach-name').textContent = selectedpesanFile.name;
        document.getElementById('pesan-attach-size').textContent = (selectedpesanFile.size / 1024).toFixed(1) + ' KB';
        preview.classList.remove('hidden');
    }
}

function cancelpesanAttachment() {
    selectedpesanFile = null;
    document.getElementById('pesan-file-input').value = '';
    document.getElementById('pesan-attachment-preview').classList.add('hidden');
}

async function submitpesanMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('pesan-text-input');
    const msg = input.value.trim();
    
    if (!msg && !selectedpesanFile) return;
    
    const btn = document.getElementById('pesan-send-btn');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin"></i>';
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('action', 'send');
        formData.append('conversation_id', currentpesanConvId);
        formData.append('id_recipient', currentpesanOtherUser);
        formData.append('isi_pesan', msg);
        if (selectedpesanFile) {
            formData.append('file', selectedpesanFile);
        }

        const res = await fetch(`${API_BASE}/pesan/send.php`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + appState.token },
            body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
            input.value = '';
            cancelpesanAttachment();
            await loadpesanHistory(currentpesanConvId, currentpesanOtherUser, true);
        } else {
            showToast(data.error || data.message || 'Gagal mengirim pesan', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Gagal mengirim pesan', 'error');
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane text-sm translate-x-[-1px] translate-y-[1px]"></i>';
        btn.disabled = false;
        input.focus();
    }
}

async function deletepesanMessage(msgId) {
    if (!confirm("Apakah Anda yakin ingin menghapus pesan ini?")) return;
    
    try {
        const res = await fetch(`${API_BASE}/pesan/delete.php`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ message_id: msgId })
        });
        const data = await res.json();
        if (data.success) {
            await loadpesanHistory(currentpesanConvId, currentpesanOtherUser, true);
        }
    } catch(e) {}
}

// ======= NEW CONTACTS =======

async function showpesanContacts() {
    document.getElementById('modal-pesan-contacts').classList.remove('hidden');
    const list = document.getElementById('pesan-contacts-list');
    list.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner animate-spin text-fuchsia-500"></i></div>';
    
    try {
        const res = await fetch(`${API_BASE}/pesan/contacts.php`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
            pesanContacts = data.data;
            renderpesanContacts(pesanContacts);
        }
    } catch(e) {}
}

function closepesanContacts() {
    document.getElementById('modal-pesan-contacts').classList.add('hidden');
}

function renderpesanContacts(contacts) {
    const list = document.getElementById('pesan-contacts-list');
    list.innerHTML = '';
    
    if (contacts.length === 0) {
        list.innerHTML = '<div class="text-center text-xs text-slate-500 py-4">Tidak ada kontak tersedia</div>';
        return;
    }
    
    contacts.forEach(c => {
        const avatar = c.foto ? c.foto : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nama)}`;
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors';
        div.onclick = () => {
            closepesanContacts();
            openpesanRoom(0, c.id, c.nama, c.role, avatar);
        };
        div.innerHTML = `
            <img src="${avatar}" class="w-10 h-10 rounded-full object-cover">
            <div>
                <h4 class="font-bold text-sm text-slate-800">${c.nama}</h4>
                <p class="text-xs text-slate-500 capitalize">${c.role === 'parent' ? 'Wali Murid' : 'Guru'}</p>
            </div>
        `;
        list.appendChild(div);
    });
}

function filterpesanContacts() {
    const q = document.getElementById('pesan-contact-search').value.toLowerCase();
    const filtered = pesanContacts.filter(c => c.nama.toLowerCase().includes(q));
    renderpesanContacts(filtered);
}

// End of pesan.js

