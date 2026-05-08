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
        const isAr = document.documentElement.dir === 'rtl';

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
            const headerGradient = member.role === 'Super Admin' ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : 
                                  member.role === 'Manager' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 
                                  'linear-gradient(135deg, #1e293b, #475569)';

            card.innerHTML = `
                <div class="team-card-header" style="background: ${headerGradient}"></div>
                <div class="team-card-avatar-wrapper">
                    <img src="${avatarUrl}" alt="${member.name}" loading="lazy">
                    <span class="status-dot ${isOnline ? 'status-pulse' : ''}" style="background: ${isOnline ? '#10b981' : '#9ca3af'};" title="${isOnline ? 'Online' : 'Offline'}"></span>
                </div>
                <div class="team-card-body">
                    <h3>${member.name} ${isMe ? `<span style="font-size:0.65rem; background:var(--primary-gradient); color:white; padding:2px 8px; border-radius:20px; vertical-align:middle; margin-inline-start:6px; box-shadow:0 2px 5px rgba(37,99,235,0.2);">أنت</span>` : ''}</h3>
                    <div class="member-title">${member.title || (isAr ? 'عضو الفريق' : 'Team Member')}</div>
                    
                    <div class="role-badge" style="background: ${roleStyle.split(';')[0]};">
                        <i class="fas fa-shield-alt" style="color:${roleStyle.split(';')[1].split(':')[1]};"></i>
                        <span style="color:${roleStyle.split(';')[1].split(':')[1]}">${typeof LangManager !== 'undefined' ? LangManager.t(member.role) : member.role}</span>
                    </div>

                    ${!isMe ? `
                    <button class="team-card-btn team-card-btn-primary" onclick="TeamManager.openChat('${member.id}')">
                        <i class="fas fa-paper-plane"></i> ${isAr ? 'مراسلة' : 'Message'}
                    </button>` : `
                    <button class="team-card-btn team-card-btn-outline" onclick="document.querySelector('.nav-item[data-target=profile]').click()">
                        <i class="fas fa-id-card"></i> ${isAr ? 'تعديل البروفايل' : 'Edit Profile'}
                    </button>`}
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
