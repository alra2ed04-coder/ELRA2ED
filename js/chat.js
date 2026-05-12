/**
 * Al-Raed Platform - Advanced Chat System
 * ✅ Separated Group / Channel Creation
 * ✅ Invitation System: Invite -> Notify -> Accept -> Join
 * ✅ Permissions & Real-time sync
 */
const ChatManager = {
    currentType: 'private',
    currentReceiverId: null,
    currentReceiverName: null,
    _pendingAttachment: null,
    _pendingRoomImg: null,
    _isSelfChat: false,
    _isSending: false,
    _typingTimeout: null,
    _otherTypingTimeout: null,

    // ─── Storage Keys ─────────────────────────────────────────
    _getPrivateKey: (me, otherId) => `pm_${[me.id, otherId].sort().join('_')}`,
    _getSelfKey: (me) => `savedMessages_${me.id}`,
    _getRoomKey: (roomId) => `room_msgs_${roomId}`,

    _knownMessageIds: new Set(),
    init: () => {
        ChatManager.bindTabEvents();
        ChatManager.bindSendEvent();

        const activeTab = document.querySelector('.chat-tab.active');
        if (activeTab) {
            ChatManager.currentType = activeTab.dataset.type;
            ChatManager._styleActiveTab(activeTab);
        }

        ChatManager.render();
        setTimeout(() => { if (ChatManager._updateNavBadge) ChatManager._updateNavBadge(); }, 200);

        // Populate known message IDs to prevent notification flood on load
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('pm_') || k.startsWith('room_msgs_')) {
                try {
                    const msgs = JSON.parse(localStorage.getItem(k) || '[]');
                    msgs.forEach(m => ChatManager._knownMessageIds.add(m.id));
                } catch(e){}
            }
        });

        window.addEventListener('storeUpdated', (e) => {
            const key = e.detail?.key;
            const value = e.detail?.value;

            if (key === 'chat_rooms' || key === 'chat_invitations' || key === 'team') {
                ChatManager.render();
            }

            // Typing indicator
            if (key?.startsWith('typing_')) {
                const me = AuthManager.currentUser;
                if (!me) return;
                const convKey = key.replace('typing_', '');
                const myConvKey = ChatManager.currentReceiverId
                    ? ChatManager._getPrivateKey(me, ChatManager.currentReceiverId)
                    : null;
                const tyEl = document.getElementById('chat-typing-indicator');
                const tyText = document.getElementById('chat-typing-text');
                
                if (tyEl && myConvKey === convKey && value && value.userId !== me.id) {
                    tyEl.style.display = 'flex';
                    if (tyText) tyText.textContent = (value.userName || 'المستخدم') + ' يكتب الآن...';
                    clearTimeout(ChatManager._otherTypingTimeout);
                    ChatManager._otherTypingTimeout = setTimeout(() => { tyEl.style.display = 'none'; }, 3000);
                } else if (tyEl && myConvKey === convKey) {
                    tyEl.style.display = 'none';
                }
            }

            // Real-Time Messages & Notifications
            if (key?.startsWith('pm_') || key?.startsWith('room_msgs_')) {
                const me = AuthManager.currentUser;
                if (!me) return;
                const msgs = value || [];
                
                let hasNewForMe = false;
                let latestMsg = null;

                msgs.forEach(msg => {
                    if (!ChatManager._knownMessageIds.has(msg.id)) {
                        ChatManager._knownMessageIds.add(msg.id);
                        if (msg.senderId !== me.id) {
                            hasNewForMe = true;
                            latestMsg = msg;
                        }
                    }
                });

                const isPrivate = key.startsWith('pm_');
                let isActiveConv = false;
                if (ChatManager.currentReceiverId && document.getElementById('chat-section')?.classList.contains('active')) {
                    if (isPrivate && !ChatManager._isSelfChat && ChatManager._getPrivateKey(me, ChatManager.currentReceiverId) === key) {
                        isActiveConv = true;
                    } else if (!isPrivate && ChatManager._getRoomKey(ChatManager.currentReceiverId) === key) {
                        isActiveConv = true;
                    }
                }

                if (isActiveConv) {
                    ChatManager._clearUnread(key);
                    ChatManager.renderMessages();
                } else if (hasNewForMe && latestMsg) {
                    ChatManager._updateNavBadge();
                    ChatManager._playSound();
                    const roomName = isPrivate ? latestMsg.senderName : ((Store.get('chat_rooms')||[]).find(r=>r.id === key.replace('room_msgs_',''))?.name || 'مجموعة');
                    NotificationManager.add('💬 رسالة جديدة من ' + latestMsg.senderName + (isPrivate ? '' : ' في ' + roomName), 'fa-comment', 'chat', isPrivate ? latestMsg.senderId : key.replace('room_msgs_',''));
                }

                if (ChatManager.currentType === 'private') ChatManager.loadUsers();
                else ChatManager.loadRooms();
            }
        });

        // Global Avatar Error Handler
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG' && (e.target.classList.contains('chat-header-avatar') || e.target.closest('.chat-container'))) {
                const name = ChatManager.currentReceiverName || 'User';
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=6366f1&color=fff';
            }
        }, true);
    },

    render: () => {
        ChatManager.renderInvitations(); // Show pending invites
        if (ChatManager.currentType === 'private') {
            ChatManager.loadUsers();
        } else {
            ChatManager.loadRooms();
        }
        ChatManager.renderMessages();
    },

    _styleActiveTab: (btn) => {
        if (!btn) return;
        document.querySelectorAll('.chat-tab').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');
    },

    bindTabEvents: () => {
        document.querySelectorAll('.chat-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                ChatManager.currentType = btn.dataset.type;
                ChatManager._styleActiveTab(btn);
                ChatManager.currentReceiverId = null;
                ChatManager.currentReceiverName = null;
                ChatManager._isSelfChat = false;
                ChatManager.render();

                const header = document.getElementById('chat-active-name');
                const addBtn = document.getElementById('chat-dynamic-add-btn');
                const headerAvatar = document.getElementById('chat-active-avatar');
                const statusEl = document.getElementById('chat-active-status');

                if (headerAvatar) headerAvatar.style.display = 'none';
                if (statusEl) statusEl.innerHTML = '';

                if (ChatManager.currentType === 'group') {
                    header.textContent = LangManager.t('Groups');
                    if (addBtn) addBtn.style.display = 'flex';
                } else if (ChatManager.currentType === 'broadcast') {
                    header.textContent = LangManager.t('Channels');
                    if (addBtn) addBtn.style.display = 'flex';
                } else {
                    header.textContent = LangManager.t('Choose a chat to start');
                    if (addBtn) addBtn.style.display = 'none';
                }
            });
        });
    },

    handleCreateAction: () => {
        ChatManager.showCreateRoomModal(ChatManager.currentType);
    },

    // ─── Invitations Logic ────────────────────────────────────
    renderInvitations: () => {
        const sidebar = document.getElementById('chat-users-sidebar');
        const me = AuthManager.currentUser;
        if (!me) return;

        const allInvites = Store.get('chat_invitations') || [];
        const myInvites = allInvites.filter(inv => inv.toId === me.id && inv.status === 'pending');

        if (myInvites.length > 0) {
            const header = document.createElement('div');
            header.style.cssText = 'padding:0.6rem 1rem;font-size:0.75rem;font-weight:700;color:var(--warning);background:rgba(245,158,11,0.1);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;';
            header.innerHTML = `<span>دعوات جديدة (${myInvites.length})</span> <i class="fas fa-envelope-open-text"></i>`;
            sidebar.prepend(header);

            myInvites.forEach(inv => {
                const div = document.createElement('div');
                div.style.cssText = 'padding:0.8rem 1rem;background:rgba(245,158,11,0.05);border-bottom:1px solid var(--border-color);';
                div.innerHTML = `
                    <div style="font-size:0.8rem;margin-bottom:0.5rem;">دعوة للانضمام إلى <b>${inv.roomName}</b></div>
                    <div style="display:flex;gap:0.5rem;">
                        <button onclick="ChatManager.acceptInvitation('${inv.id}')" style="flex:1;padding:4px;border-radius:4px;border:none;background:var(--success);color:white;font-size:0.7rem;cursor:pointer;">قبول</button>
                        <button onclick="ChatManager.declineInvitation('${inv.id}')" style="flex:1;padding:4px;border-radius:4px;border:none;background:var(--danger);color:white;font-size:0.7rem;cursor:pointer;">رفض</button>
                    </div>
                `;
                sidebar.prepend(div);
            });
        }
    },

    acceptInvitation: (invId) => {
        const invites = Store.get('chat_invitations') || [];
        const inv = invites.find(i => i.id === invId);
        if (!inv) return;

        // 1. Add user to room members
        const rooms = Store.get('chat_rooms') || [];
        const room = rooms.find(r => r.id === inv.roomId);
        if (room) {
            if (!room.members) room.members = [];
            if (!room.members.includes(inv.toId)) room.members.push(inv.toId);
            Store.set('chat_rooms', rooms);
        }

        // 2. Mark invitation as accepted
        inv.status = 'accepted';
        Store.set('chat_invitations', invites);

        NotificationManager.add(`🎉 انضممت بنجاح إلى ${inv.roomName}`, 'fa-check-circle', 'chat');
        ChatManager.render();
    },

    declineInvitation: (invId) => {
        const invites = Store.get('chat_invitations') || [];
        const inv = invites.find(i => i.id === invId);
        if (inv) {
            inv.status = 'declined';
            Store.set('chat_invitations', invites);
            ChatManager.render();
        }
    },

    // ─── Sidebar Loaders ──────────────────────────────────────
    loadUsers: () => {
        const sidebar = document.getElementById('chat-users-sidebar');
        if (!sidebar) return;
        const team = Store.get('team') || [];
        const me = AuthManager.currentUser;
        const cleanMeName = me?.name?.replace(/\s*\(.*?\)\s*/g, '') || 'Me';

        sidebar.innerHTML = '';

        const selfDiv = document.createElement('div');
        selfDiv.className = 'chat-user-item';
        selfDiv.dataset.userId = me.id;
        if (ChatManager._isSelfChat) selfDiv.classList.add('selected');

        // Fetch fresh avatar from Store instead of session snapshot
        const users = Store.get('users') || [];
        const freshMe = users.find(u => u.id === me.id) || me;
        const meAvatar = freshMe.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanMeName)}&background=2563eb&color=fff&bold=true`;

        selfDiv.innerHTML = `
            <img src="${meAvatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--primary-color);">
            <div style="flex:1;">
                <div style="font-weight:700;font-size:0.875rem;">${me.name} (${LangManager.t('Me')})</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);" data-original="My Profile">${LangManager.t('My Profile')}</div>
            </div>
        `;
        selfDiv.onclick = () => ChatManager._selectUser(me.id, me.name, true, selfDiv, meAvatar);
        sidebar.appendChild(selfDiv);

        const header = document.createElement('div');
        header.style.cssText = `padding:0.6rem 1rem;font-size:0.72rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;border-bottom:1px solid var(--border-color);`;
        header.textContent = LangManager.t('Private');
        sidebar.appendChild(header);

        team.filter(m => m.id !== me?.id).forEach(member => {
            const cleanName = member.name.replace(/\s*\(.*?\)\s*/g, '');
            const avatar = member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563eb&color=fff&bold=true`;
            const isOnline = (Store._onlineUsers || []).includes(member.id);
            const key = ChatManager._getPrivateKey(me, member.id);
            const lastMsgs = JSON.parse(localStorage.getItem(key) || '[]');
            const lastMsg = lastMsgs.length > 0 ? lastMsgs[lastMsgs.length - 1] : null;

            const avatarUrl = member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff`;

            const div = document.createElement('div');
            div.className = 'chat-user-item';
            div.dataset.userId = member.id;
            if (ChatManager.currentReceiverId === member.id && !ChatManager._isSelfChat) div.classList.add('selected');
            const pmKey = ChatManager._getPrivateKey(me, member.id);
            const unread = ChatManager._getConvUnread ? ChatManager._getConvUnread(pmKey) : 0;
            div.innerHTML = `
                <div style="position:relative; flex-shrink:0;">
                    <img src="${avatarUrl}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:1.5px solid var(--border-color);">
                    ${isOnline ? '<span style="position:absolute;bottom:0;right:0;width:12px;height:12px;background:#10b981;border:2px solid var(--bg-secondary);border-radius:50%;"></span>' : ''}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                        <div style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${member.name}</div>
                        <div style="display:flex;align-items:center;gap:4px;">
                            ${lastMsg ? `<span style="font-size:0.65rem;color:var(--text-secondary);">${new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                            ${unread > 0 ? `<span style="background:#ef4444;color:#fff;font-size:0.6rem;font-weight:700;border-radius:50%;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center;padding:0 3px;">${unread > 99 ? '99+' : unread}</span>` : ''}
                        </div>
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px;">
                        ${lastMsg && lastMsg.senderId === me.id ? '<i class="fas fa-check" style="font-size:0.6rem;opacity:0.5;"></i>' : ''}
                        ${lastMsg ? (lastMsg.attachment ? '📁 File' : lastMsg.content) : member.role}
                    </div>
                </div>
            `;
            div.onclick = () => ChatManager._selectUser(member.id, member.name, false, div, avatarUrl);
            sidebar.appendChild(div);
        });
    },

    loadRooms: () => {
        const sidebar = document.getElementById('chat-users-sidebar');
        if (!sidebar) return;
        const rooms = Store.get('chat_rooms') || [];
        const me = AuthManager.currentUser;
        const type = ChatManager.currentType;

        sidebar.innerHTML = '';
        const filtered = rooms.filter(r => r.type === type && (r.members && r.members.includes(me.id)));

        if (filtered.length === 0) {
            sidebar.innerHTML = `
                <div style="padding:3rem 1.5rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1.25rem; opacity:0.6;">
                    <div style="width:64px; height:64px; border-radius:18px; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color);">
                        <i class="fas fa-${type === 'broadcast' ? 'bullhorn' : 'users'}" style="font-size:1.8rem; color:var(--primary-color);"></i>
                    </div>
                    <div style="font-size:0.85rem; font-weight:600; line-height:1.4; color:var(--text-secondary);">
                        ${type === 'broadcast' ? 'لا توجد قنوات إخبارية متاحة حالياً' : 'لا توجد مجموعات عمل مشترك بها حالياً'}
                    </div>
                </div>`;
            return;
        }

        filtered.forEach(room => {
            const roomMsgs = Store.get(ChatManager._getRoomKey(room.id)) || [];
            const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
            const roomAvatar = room.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.name)}&background=3b82f6&color=fff&rounded=true`;

            const div = document.createElement('div');
            div.className = 'chat-user-item';
            if (ChatManager.currentReceiverId === room.id) div.classList.add('selected');
            div.innerHTML = `
                <div style="position:relative; flex-shrink:0;">
                    <img src="${roomAvatar}" style="width:44px;height:44px;border-radius:12px;object-fit:cover;border:1.5px solid var(--border-color);">
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                        <span style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px;">
                            ${room.name}
                            ${room.type === 'broadcast' ? '<i class="fas fa-bullhorn" style="font-size:0.7rem;color:var(--primary-color);"></i>' : ''}
                        </span>
                        ${lastMsg ? `<span style="font-size:0.65rem;color:var(--text-secondary);">${new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${lastMsg ? `<b>${lastMsg.senderName.split(' ')[0]}:</b> ${lastMsg.content || '📁 ملف'}` : (room.desc || 'لا يوجد وصف')}
                    </div>
                </div>
            `;
            div.onclick = () => {
                document.querySelectorAll('.chat-user-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                ChatManager.currentReceiverId = room.id;
                ChatManager.currentReceiverName = room.name;
                document.getElementById('chat-active-name').textContent = room.name;

                // Update Header Avatar
                const headerAvatar = document.getElementById('chat-active-avatar');
                if (headerAvatar) {
                    headerAvatar.src = roomAvatar;
                    headerAvatar.style.display = 'block';
                }

                // Reveal UI
                const header = document.querySelector('.chat-main-header');
                const inputArea = document.querySelector('.chat-input-wrapper');
                if (header) { header.style.opacity = '1'; header.style.pointerEvents = 'auto'; }
                if (inputArea) { inputArea.style.opacity = '1'; inputArea.style.pointerEvents = 'auto'; }

                // Clear unread for this room
                const roomKey = ChatManager._getRoomKey(room.id);
                ChatManager._clearUnread(roomKey);
                ChatManager._updateNavBadge();

                // Hide typing indicator
                const tyEl = document.getElementById('chat-typing-indicator');
                if (tyEl) tyEl.style.display = 'none';

                ChatManager.renderMessages();
            };
            sidebar.appendChild(div);
        });
    },

    _selectUser: (id, name, isSelf, el, avatar) => {
        const cleanName = name.replace(/\s*\(.*?\)\s*/g, '');
        document.querySelectorAll('.chat-user-item').forEach(item => item.classList.remove('selected'));
        el.classList.add('selected');
        ChatManager.currentReceiverId = id;
        ChatManager.currentReceiverName = name;
        ChatManager._isSelfChat = isSelf;
        document.getElementById('chat-active-name').textContent = name;

        // Hide typing indicator when switching conversations
        const tyEl = document.getElementById('chat-typing-indicator');
        if (tyEl) tyEl.style.display = 'none';

        // Clear unread for this conversation
        if (!isSelf) {
            const me = AuthManager.currentUser;
            if (me) {
                const convKey = ChatManager._getPrivateKey(me, id);
                ChatManager._clearUnread(convKey);
                ChatManager._updateNavBadge();
            }
        }

        // Update Header Avatar
        const headerAvatar = document.getElementById('chat-active-avatar');
        if (headerAvatar) {
            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=6366f1&color=fff&bold=true`;
            headerAvatar.src = avatar || fallback;
            headerAvatar.style.display = 'block';
            headerAvatar.onerror = () => { headerAvatar.src = fallback; };
        }

        // Show online status in header
        const statusEl = document.getElementById('chat-active-status');
        if (statusEl) {
            if (isSelf) {
                statusEl.innerHTML = `<i class="fas fa-bookmark" style="font-size:0.65rem;"></i> ${LangManager.t('My Profile')}`;
            } else {
                const isOnline = (Store._onlineUsers || []).includes(id);
                statusEl.innerHTML = isOnline
                    ? `<span style="width:7px;height:7px;border-radius:50%;background:var(--success);display:inline-block;"></span> ${LangManager.t('Active')}`
                    : `<span style="width:7px;height:7px;border-radius:50%;background:var(--text-secondary);display:inline-block;"></span> ${LangManager.t('Planning')}`;
                statusEl.style.color = isOnline ? 'var(--success)' : 'var(--text-secondary)';
            }
        }

        document.getElementById('chat-input').placeholder = isSelf ? LangManager.t('Type a message...') : `${LangManager.t('Type a message...')} ${name.split(' ')[0]}...`;

        // Reveal UI
        const header = document.querySelector('.chat-main-header');
        const inputArea = document.querySelector('.chat-input-wrapper');
        if (header) { header.style.opacity = '1'; header.style.pointerEvents = 'auto'; }
        if (inputArea) { inputArea.style.opacity = '1'; inputArea.style.pointerEvents = 'auto'; }

        ChatManager.renderMessages();
    },

    _updateActiveStatus: (id) => {
        const statusEl = document.getElementById('chat-active-status');
        if (!statusEl) return;
        const isOnline = (Store._onlineUsers || []).includes(id);
        statusEl.innerHTML = isOnline
            ? `<span style="width:7px;height:7px;border-radius:50%;background:var(--success);display:inline-block;"></span> ${LangManager.t('Active')}`
            : `<span style="width:7px;height:7px;border-radius:50%;background:var(--text-secondary);display:inline-block;"></span> ${LangManager.t('Planning')}`;
    },

    // ─── Room Creation ────────────────────────────────────────
    showCreateRoomModal: (type) => {
        const modal = document.getElementById('chat-room-modal');
        const title = document.getElementById('room-modal-title');
        const typeHidden = document.getElementById('room-type-hidden');

        typeHidden.value = type;
        title.innerHTML = type === 'group' ? '<i class="fas fa-users"></i> إنشاء جروب جديد' : '<i class="fas fa-bullhorn"></i> إنشاء قناة إخبارية';

        modal.classList.remove('hidden');

        const list = document.getElementById('room-members-list');
        const team = Store.get('team') || [];
        const me = AuthManager.currentUser;

        list.innerHTML = '';
        team.filter(m => m.id !== me.id).forEach(member => {
            const label = document.createElement('label');
            label.className = 'member-check-item';
            label.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.6rem;background:var(--bg-primary);border-radius:8px;cursor:pointer;border:1px solid var(--border-color);';
            label.innerHTML = `
                <img src="${member.avatar || 'https://ui-avatars.com/api/?name=' + member.name}" style="width:24px;height:24px;border-radius:50%;">
                <span style="flex:1;font-size:0.85rem;">${member.name}</span>
                <input type="checkbox" name="room-member" value="${member.id}">
            `;
            list.appendChild(label);
        });
    },

    closeRoomModal: () => {
        const modal = document.getElementById('chat-room-modal');
        if (modal) modal.classList.add('hidden');
        document.getElementById('room-name').value = '';
        document.getElementById('room-desc').value = '';
        document.getElementById('room-img-preview').src = 'https://ui-avatars.com/api/?name=Chat&background=2563eb&color=fff&bold=true&size=128';
        ChatManager._pendingRoomImg = null;
    },

    handleRoomImg: (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('room-img-preview').src = e.target.result;
            ChatManager._pendingRoomImg = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    createRoom: () => {
        const name = document.getElementById('room-name').value.trim();
        const desc = document.getElementById('room-desc').value.trim();
        const type = document.getElementById('room-type-hidden').value;
        const me = AuthManager.currentUser;

        if (!name) { alert('برجاء إدخال اسم المساحة'); return; }

        const selectedIds = Array.from(document.querySelectorAll('input[name="room-member"]:checked')).map(cb => cb.value);

        const roomId = 'room_' + Date.now();
        const rooms = Store.get('chat_rooms') || [];
        const newRoom = {
            id: roomId,
            name,
            desc,
            type,
            image: ChatManager._pendingRoomImg,
            members: [me.id], // Only creator joins immediately
            createdBy: me.id,
            createdAt: new Date().toISOString()
        };

        rooms.push(newRoom);
        Store.set('chat_rooms', rooms);

        // Send Invitations
        const invitations = Store.get('chat_invitations') || [];
        selectedIds.forEach(targetId => {
            invitations.push({
                id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                roomId: roomId,
                roomName: name,
                fromId: me.id,
                fromName: me.name,
                toId: targetId,
                status: 'pending',
                timestamp: new Date().toISOString()
            });
        });
        Store.set('chat_invitations', invitations);

        ChatManager.closeRoomModal();
        ChatManager.currentType = type;
        const btn = document.querySelector(`.chat-tab[data-type="${type}"]`);
        if (btn) ChatManager._styleActiveTab(btn);

        ChatManager.currentReceiverId = roomId;
        ChatManager.currentReceiverName = name;
        ChatManager.render();

        alert(`تم إنشاء ال${type === 'group' ? 'جروب' : 'قناة'} وإرسال ${selectedIds.length} دعوة.`);
    },

    // ─── Messages Logic ───────────────────────────────────────
    getMessages: () => {
        const me = AuthManager.currentUser;
        if (!me || !ChatManager.currentReceiverId) return [];

        if (ChatManager.currentType === 'private') {
            if (ChatManager._isSelfChat) return JSON.parse(localStorage.getItem(ChatManager._getSelfKey(me)) || '[]');
            const key = ChatManager._getPrivateKey(me, ChatManager.currentReceiverId);
            return JSON.parse(localStorage.getItem(key) || '[]');
        } else {
            return Store.get(ChatManager._getRoomKey(ChatManager.currentReceiverId)) || [];
        }
    },

    saveMessages: (msgs) => {
        const me = AuthManager.currentUser;
        if (!me || !ChatManager.currentReceiverId) return;

        if (ChatManager.currentType === 'private') {
            if (ChatManager._isSelfChat) {
                localStorage.setItem(ChatManager._getSelfKey(me), JSON.stringify(msgs));
            } else {
                Store.set(ChatManager._getPrivateKey(me, ChatManager.currentReceiverId), msgs);
            }
        } else {
            Store.set(ChatManager._getRoomKey(ChatManager.currentReceiverId), msgs);
        }
    },

    renderMessages: () => {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const me = AuthManager.currentUser;
        const messages = ChatManager.getMessages();

        container.innerHTML = '';

        if (!ChatManager.currentReceiverId) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary); gap:2rem; padding:2rem; text-align:center;">
                    <div style="position:relative;">
                        <div style="width:120px; height:120px; border-radius:35px; background:linear-gradient(135deg, var(--bg-secondary), var(--bg-primary)); display:flex; align-items:center; justify-content:center; box-shadow:0 20px 40px rgba(0,0,0,0.1); border:1px solid var(--border-color);">
                            <i class="fas fa-comments" style="font-size:4rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
                        </div>
                    </div>
                    <div style="max-width:320px;">
                        <h3 style="font-size:1.5rem; font-weight:800; color:var(--text-primary); margin-bottom:0.75rem;">${LangManager.t('Choose a chat to start')}</h3>
                        <p style="font-size:0.95rem; line-height:1.6; opacity:0.7;">${LangManager.t('Select a team member to start chatting')}</p>
                    </div>
                </div>`;
            return;
        }

        const rooms = Store.get('chat_rooms') || [];
        const room = rooms.find(r => r.id === ChatManager.currentReceiverId);
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('btn-send-msg');

        if (room && room.type === 'broadcast') {
            const isAdmin = me.role === 'Super Admin' || me.role === 'Manager';
            if (!isAdmin) {
                input.disabled = true;
                input.placeholder = 'هذه القناة للإعلانات فقط';
                sendBtn.style.opacity = '0.5';
                sendBtn.style.pointerEvents = 'none';
            } else {
                input.disabled = false;
                input.placeholder = 'اكتب إعلاناً...';
                sendBtn.style.opacity = '1';
                sendBtn.style.pointerEvents = 'auto';
            }
        } else {
            input.disabled = false;
            input.placeholder = 'اكتب رسالة...';
            sendBtn.style.opacity = '1';
            sendBtn.style.pointerEvents = 'auto';
        }

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; opacity:0.6; gap:1rem; text-align:center; padding:2rem;">
                    <i class="fas fa-comment-dots" style="font-size:3rem; color:var(--primary-color);"></i>
                    <p style="font-size:1rem; font-weight:600;">${LangManager.t('No messages yet. Say hello! 👋')}</p>
                </div>`;
            return;
        }

        messages.forEach((msg, index) => {
            const isMe = msg.senderId === me?.id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const div = document.createElement('div');
            div.className = `msg-wrapper ${isMe ? 'msg-sent' : 'msg-received'}`;
            div.style.animationDelay = `${index * 0.05}s`;

            let attachmentHtml = '';
            if (msg.attachment) {
                const att = msg.attachment;
                if (att.mimeType?.startsWith('image/')) {
                    attachmentHtml = `<img src="${att.dataUrl}" style="max-width:280px;border-radius:15px;margin-bottom:0.5rem;display:block;cursor:pointer;box-shadow:var(--shadow-md);" onclick="window.open('${att.dataUrl}')">`;
                } else {
                    attachmentHtml = `<a href="${att.dataUrl}" download="${att.name}" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:rgba(255,255,255,0.1);border-radius:12px;text-decoration:none;color:inherit;margin-bottom:0.5rem;border:1px solid rgba(255,255,255,0.1);"><i class="fas fa-file-download" style="font-size:1.2rem;"></i> <div style="display:flex;flex-direction:column;"><span style="font-size:0.85rem;font-weight:600;">${att.name}</span><span style="font-size:0.65rem;opacity:0.7;">Download File</span></div></a>`;
                }
            }

            div.innerHTML = `
                <img src="${msg.senderAvatar || 'https://ui-avatars.com/api/?name=' + msg.senderName}" class="msg-avatar">
                <div style="max-width:75%; transform: scale(0.9); opacity: 0; animation: msgFadeIn 0.3s forwards;">
                    ${!isMe && ChatManager.currentType !== 'private' ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.4rem;font-weight:700;margin-right:0.5rem;display:flex;align-items:center;gap:4px;"><i class="fas fa-user-circle" style="font-size:0.8rem;opacity:0.5;"></i> ${msg.senderName}</div>` : ''}
                    <div class="msg-bubble">
                        ${attachmentHtml}
                        <div class="msg-content" style="word-break:break-word;">${msg.content || ''}</div>
                        <div class="msg-info" style="display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-top:4px;font-size:0.65rem;opacity:0.7;">
                            <span>${time}</span>
                            ${isMe ? '<i class="fas fa-check-double" style="color:rgba(255,255,255,0.9);"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        // Smooth scroll to bottom
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    },

    bindSendEvent: () => {
        const btn = document.getElementById('btn-send-msg');
        const input = document.getElementById('chat-input');
        if (!btn || !input) return;

        const send = () => {
            if (ChatManager._isSending) return;
            const content = input.value.trim();
            const att = ChatManager._pendingAttachment;
            if (!content && !att) return;
            if (!ChatManager.currentReceiverId) return;

            ChatManager._isSending = true;
            btn.disabled = true;

            const me = AuthManager.currentUser;
            const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const msg = {
                id: msgId,
                senderId: me.id,
                senderName: me.name,
                senderAvatar: me.avatar,
                content,
                attachment: att,
                timestamp: new Date().toISOString()
            };

            // Clear typing indicator
            if (ChatManager.currentType === 'private' && !ChatManager._isSelfChat && ChatManager.currentReceiverId) {
                const convKey = ChatManager._getPrivateKey(me, ChatManager.currentReceiverId);
                Store.set('typing_' + convKey, null);
            }

            const msgs = ChatManager.getMessages();
            // Dedup: don't add if same id already exists
            if (!msgs.find(m => m.id === msgId)) {
                msgs.push(msg);
                
                if (ChatManager.currentType === 'private' && ChatManager._isSelfChat) {
                    localStorage.setItem(ChatManager._getSelfKey(me), JSON.stringify(msgs));
                } else {
                    const key = ChatManager.currentType === 'private' 
                        ? ChatManager._getPrivateKey(me, ChatManager.currentReceiverId)
                        : ChatManager._getRoomKey(ChatManager.currentReceiverId);
                    
                    // Fast local cache update
                    localStorage.setItem(key, JSON.stringify(msgs));
                    
                    // Safe Cloud Update using arrayUnion
                    if (typeof firebase !== 'undefined' && firebase.apps.length) {
                        firebase.firestore().collection('messages').doc(key).set({
                            value: firebase.firestore.FieldValue.arrayUnion(msg),
                            updatedBy: me.id,
                            userName: me.name,
                            timestamp: Date.now()
                        }, { merge: true });
                    }
                }
            }

            input.value = '';
            ChatManager._pendingAttachment = null;

            const prev = document.getElementById('chat-attachment-preview');
            if (prev) prev.style.display = 'none';
            ChatManager.renderMessages();
            
            // Instantly update the sidebar list
            if (ChatManager.currentType === 'private') ChatManager.loadUsers();
            else ChatManager.loadRooms();

            setTimeout(() => {
                ChatManager._isSending = false;
                btn.disabled = false;
            }, 500);
        };

        // Typing indicator emit
        input.addEventListener('input', () => {
            const me = AuthManager.currentUser;
            if (!me || ChatManager.currentType !== 'private' || ChatManager._isSelfChat || !ChatManager.currentReceiverId) return;
            const convKey = ChatManager._getPrivateKey(me, ChatManager.currentReceiverId);
            Store.set('typing_' + convKey, { userId: me.id, userName: me.name, timestamp: Date.now() });
            clearTimeout(ChatManager._typingTimeout);
            ChatManager._typingTimeout = setTimeout(() => {
                Store.set('typing_' + convKey, null);
            }, 3000);
        });

        btn.onclick = send;
        input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    },

    handleFileSelect: (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            ChatManager._pendingAttachment = { dataUrl: e.target.result, name: file.name, mimeType: file.type };
            const prev = document.getElementById('chat-attachment-preview');
            const thumb = document.getElementById('chat-attachment-thumb');
            prev.style.display = 'flex';
            thumb.innerHTML = `📎 ${file.name}`;
        };
        reader.readAsDataURL(file);
    },

    clearAttachment: () => {
        ChatManager._pendingAttachment = null;
        document.getElementById('chat-attachment-preview').style.display = 'none';
    },

    filterSidebar: (query) => {
        const items = document.querySelectorAll('.chat-user-item');
        const q = query.toLowerCase().trim();
        items.forEach(item => {
            const name = item.innerText.toLowerCase();
            item.style.display = name.includes(q) ? 'flex' : 'none';
        });
    },

    deleteConversation: () => {
        if (!ChatManager.currentReceiverId) return;
        if (!confirm(LangManager.t('Are you sure you want to delete this conversation?'))) return;

        const me = AuthManager.currentUser;
        if (ChatManager.currentType === 'private') {
            const key = ChatManager._isSelfChat ? ChatManager._getSelfKey(me) : ChatManager._getPrivateKey(me, ChatManager.currentReceiverId);
            localStorage.removeItem(key);
        } else {
            Store.set(ChatManager._getRoomKey(ChatManager.currentReceiverId), []);
        }

        ChatManager.renderMessages();
        NotificationManager.add(LangManager.t('Delete Conversation'), 'fa-trash', 'chat');
    },

    // ─── Unread Counter (Timestamp-based) ─────────────────────────
    _clearUnread: (convKey) => {
        const data = JSON.parse(localStorage.getItem('chat_last_read') || '{}');
        data[convKey] = Date.now();
        localStorage.setItem('chat_last_read', JSON.stringify(data));
        ChatManager._updateNavBadge();
    },

    _getTotalUnread: () => {
        const me = AuthManager.currentUser;
        if (!me) return 0;
        let total = 0;
        const lastRead = JSON.parse(localStorage.getItem('chat_last_read') || '{}');
        
        (Store.get('team') || []).filter(m => m.id !== me.id).forEach(m => {
            const k = ChatManager._getPrivateKey(me, m.id);
            const lr = lastRead[k] || 0;
            total += (Store.get(k) || []).filter(msg => msg.senderId !== me.id && new Date(msg.timestamp).getTime() > lr).length;
        });

        (Store.get('chat_rooms') || []).filter(r => r.members?.includes(me.id)).forEach(r => {
            const k = ChatManager._getRoomKey(r.id);
            const lr = lastRead[k] || 0;
            total += (Store.get(k) || []).filter(msg => msg.senderId !== me.id && new Date(msg.timestamp).getTime() > lr).length;
        });

        return total;
    },

    _getConvUnread: (convKey) => {
        const me = AuthManager.currentUser;
        if (!me) return 0;
        const lr = JSON.parse(localStorage.getItem('chat_last_read') || '{}')[convKey] || 0;
        return (Store.get(convKey) || []).filter(msg => msg.senderId !== me.id && new Date(msg.timestamp).getTime() > lr).length;
    },

    // ─── Nav Badge ────────────────────────────────────────────────────
    _updateNavBadge: () => {
        const total = ChatManager._getTotalUnread();
        const navItem = document.querySelector('.nav-item[data-target="chat-section"]');
        if (!navItem) return;
        let badge = navItem.querySelector('.chat-nav-badge');
        if (total > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'chat-nav-badge';
                badge.style.cssText = 'position:absolute;top:4px;right:4px;background:#ef4444;color:#fff;font-size:0.65rem;font-weight:700;border-radius:50%;min-width:18px;height:18px;display:flex;align-items:center;justify-content:center;padding:0 3px;';
                navItem.style.position = 'relative';
                navItem.appendChild(badge);
            }
            badge.textContent = total > 99 ? '99+' : total;
        } else {
            if (badge) badge.remove();
        }
    },

    // ─── Sound Notification ──────────────────────────────────────────────
    _playSound: () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* audio blocked until first user gesture */ }
    }
};

const _chatStyles = document.createElement('style');
_chatStyles.textContent = `
    .chat-user-item { display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1.25rem;cursor:pointer;transition:background 0.15s;border-bottom:1px solid var(--border-color);border-inline-end:3px solid transparent; }
    .chat-user-item:hover { background:rgba(37,99,235,0.04); }
    .chat-user-item.selected { background:rgba(37,99,235,0.09) !important; border-inline-end-color:var(--primary-color); }
    .member-check-item:hover { background:rgba(37,99,235,0.05) !important; border-color:var(--primary-color) !important; }
    @keyframes msgFadeIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
    .typing-dots span { display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--text-secondary);margin:0 1px;animation:typingBounce 1s infinite ease-in-out; }
    .typing-dots span:nth-child(2){animation-delay:.15s} .typing-dots span:nth-child(3){animation-delay:.3s}
    @keyframes typingBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
    #chat-typing-indicator{display:none;padding:0.4rem 1.25rem;align-items:center;gap:6px;min-height:24px;}

`;
document.head.appendChild(_chatStyles);

window.ChatManager = ChatManager;
// ChatManager.init() is now called from App.init() to ensure proper order