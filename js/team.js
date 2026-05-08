/**
 * Al-Raed SaaS Platform - Team Manager
 * Manages workspace team members with role assignment and shared data.
 */
const TeamManager = {
    init: () => {
        TeamManager.bindEvents();
        TeamManager.render();
    },

    bindEvents: () => {
        // Close modal buttons
        document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            });
        });
    },

    saveMember: () => {
        const name = document.getElementById('member-name').value.trim();
        const role = document.getElementById('member-role-select')?.value || 'Member';
        const title = document.getElementById('member-title').value.trim();
        const email = document.getElementById('member-email').value.trim();

        if (!name || !email) { alert('Name and Email are required.'); return; }

        const team = Store.get('team') || [];
        if (team.find(m => m.email === email)) {
            alert('A member with this email already exists.');
            return;
        }

        // Only Admin can assign Manager role
        const me = AuthManager.currentUser;
        const assignedRole = (me?.role === 'Super Admin') ? role : 'Member';

        const member = {
            id: 'user_' + Date.now(),
            name, email, title, role: assignedRole,
            avatar: null,
            joinedAt: new Date().toISOString()
        };

        team.push(member);
        Store.set('team', team);

        // Also create a user account so they can login
        const users = Store.get('users') || [];
        if (!users.find(u => u.email === email)) {
            users.push({ ...member, password: 'password123' }); // Default password
            Store.set('users', users);
        }

        // Reset modal
        document.getElementById('member-name').value = '';
        document.getElementById('member-email').value = '';
        if (document.getElementById('member-title')) document.getElementById('member-title').value = '';
        document.getElementById('team-modal').classList.add('hidden');

        TeamManager.render();
        if (typeof App !== 'undefined') App.updateDashboardStats();
        Store.log('Added Team Member', `${name} (${assignedRole})`);
        AuthManager.showToast(`✅ ${name} added to team. Default password: password123`);
    },

    render: () => {
        const grid = document.getElementById('team-grid');
        if (!grid) return;
        const team = Store.get('team') || [];
        const me = AuthManager.currentUser;
        const isAdmin = me?.role === 'Super Admin';

        grid.innerHTML = '';

        if (team.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary);">
                <i class="fas fa-users" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:1rem;"></i>
                لا يوجد أعضاء حتى الآن. اطلب من فريقك التسجيل في المنصة!
            </div>`;
            return;
        }

        team.forEach(member => {
            const avatarUrl = member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563eb&color=fff&bold=true&size=256`;
            const roleColors = {
                'Super Admin': 'rgba(139,92,246,0.15);color:#8b5cf6',
                'Manager': 'rgba(37,99,235,0.15);color:#2563eb',
                'Member': 'rgba(16,185,129,0.15);color:#10b981'
            };
            const roleStyle = roleColors[member.role] || roleColors['Member'];
            const isMe = member.id === me?.id;
            const isOnline = isMe || (Store._onlineUsers && Store._onlineUsers.includes(member.id));

            const card = document.createElement('div');
            card.className = 'team-card';
            card.dataset.id = member.id;
            card.innerHTML = `
                <div class="team-card-header"></div>
                <div class="team-card-avatar-wrapper">
                    <img src="${avatarUrl}" alt="${member.name}" loading="lazy">
                    <span class="status-dot" style="background: ${isOnline ? '#10b981' : '#9ca3af'};" title="${isOnline ? 'Online' : 'Offline'}"></span>
                </div>
                <h3>${member.name} ${isMe ? `<span style="font-size:0.6rem; background:rgba(37,99,235,0.1); color:var(--primary-color); padding:1px 6px; border-radius:4px; vertical-align:middle; margin-right:4px;">أنت</span>` : ''}</h3>
                <div class="member-title">${member.title || 'عضو الفريق'}</div>
                <div class="member-email">${member.email}</div>
                <div class="role-badge">
                    <i class="fas fa-shield-alt" style="font-size:0.7rem; color:${roleStyle.split(';')[1].replace('color:', '').trim()};"></i>
                    <span style="color:${roleStyle.split(';')[1].replace('color:', '').trim()}">${typeof LangManager !== 'undefined' ? LangManager.t(member.role) : member.role}</span>
                </div>
                <div class="team-actions" style="width:100%; padding:0 1.5rem 1.5rem; display:flex; justify-content:center; gap:0.75rem;">
                    ${(isAdmin || me?.role === 'Manager') && !isMe ? `
                    <select onchange="TeamManager.changeRole('${member.id}', this.value)" style="flex:1; padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-primary); color:var(--text-primary); font-size:0.8rem; cursor:pointer; outline:none;">
                        <option value="Member" ${member.role === 'Member' ? 'selected' : ''}>${typeof LangManager !== 'undefined' ? LangManager.t('Member') : 'Member'}</option>
                        <option value="Manager" ${member.role === 'Manager' ? 'selected' : ''}>${typeof LangManager !== 'undefined' ? LangManager.t('Manager') : 'Manager'}</option>
                        <option value="Super Admin" ${member.role === 'Super Admin' ? 'selected' : ''}>${typeof LangManager !== 'undefined' ? LangManager.t('Super Admin') : 'Super Admin'}</option>
                    </select>
                    <button title="إزالة" onclick="TeamManager.removeMember('${member.id}')" style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(239,68,68,0.08); color:var(--danger); border:none; border-radius:6px; cursor:pointer; transition:all 0.2s;">
                        <i class="fas fa-trash-alt"></i>
                    </button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    },

    openChat: (memberId) => {
        // Navigate to chat and open private conversation
        const navItem = document.querySelector('.nav-item[data-target="chat-section"]');
        if (navItem) navItem.click();
        setTimeout(() => {
            const privateTab = document.querySelector('.chat-tab[data-type="private"]');
            if (privateTab) privateTab.click();
            setTimeout(() => {
                const userItem = document.querySelector(`.chat-user-item[data-user-id="${memberId}"]`);
                if (userItem) userItem.click();
            }, 300);
        }, 300);
    },

    changeRole: (memberId, newRole) => {
        if (newRole === 'Super Admin') { alert('Cannot assign Super Admin role.'); return; }
        const me = AuthManager.currentUser;
        if (me?.role !== 'Super Admin') { alert('Only Super Admin can change roles.'); return; }

        let team = Store.get('team') || [];
        const idx = team.findIndex(m => m.id === memberId);
        if (idx > -1) {
            team[idx].role = newRole;
            Store.set('team', team);
            // Update users store too
            let users = Store.get('users') || [];
            const uidx = users.findIndex(u => u.id === memberId);
            if (uidx > -1) { users[uidx].role = newRole; Store.set('users', users); }
            Store.log('Role Changed', `${team[idx].name} → ${newRole}`);
            TeamManager.render();
        }
    },

    removeMember: (memberId) => {
        if (!confirm('Remove this team member?')) return;
        const me = AuthManager.currentUser;
        if (me?.role !== 'Super Admin') { alert('Only Super Admin can remove members.'); return; }

        let team = Store.get('team') || [];
        const member = team.find(m => m.id === memberId);
        if (member?.role === 'Super Admin') { alert('Cannot remove Super Admin.'); return; }

        team = team.filter(m => m.id !== memberId);
        Store.set('team', team);

        let users = Store.get('users') || [];
        users = users.filter(u => u.id !== memberId);
        Store.set('users', users);

        Store.log('Removed Team Member', member?.name || memberId);
        TeamManager.render();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    }
};

window.TeamManager = TeamManager;
