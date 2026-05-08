/**
 * Al-Raed SaaS Platform - Admin Panel
 * Super Admin only: view all users, reset passwords, change roles, delete users.
 */
const AdminPanel = {
    _resetTargetId: null,

    init: () => {
        AdminPanel.refresh();
        // Close modal buttons
        document.querySelectorAll('#admin-reset-modal .close-modal, #admin-reset-modal .cancel-modal, #admin-manage-user-modal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('admin-reset-modal').classList.add('hidden');
                document.getElementById('admin-manage-user-modal').classList.add('hidden');
            });
        });

        // Event listener for Role change inside modal
        const roleSelect = document.getElementById('manage-user-role');
        if(roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                if(AdminPanel._manageTargetId) {
                    AdminPanel.changeRole(AdminPanel._manageTargetId, e.target.value);
                }
            });
        }
    },

    refresh: () => {
        const users = Store.get('users') || [];
        const tasks = Store.get('tasks') || [];

        // Update stats
        const totalEl  = document.getElementById('admin-stat-total');
        const adminsEl = document.getElementById('admin-stat-admins');
        const tasksEl  = document.getElementById('admin-stat-tasks');
        if (totalEl)  totalEl.textContent  = users.length;
        if (adminsEl) adminsEl.textContent = users.filter(u => u.role === 'Super Admin' || u.role === 'Manager').length;
        if (tasksEl)  tasksEl.textContent  = tasks.length;

        AdminPanel.renderTable(users);
    },

    renderTable: (users) => {
        const tbody = document.getElementById('admin-users-table');
        if (!tbody) return;
        const me = AuthManager.currentUser;

        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary);">${LangManager.t('No users found.')}</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const avatar = user.avatar
                ? `<img src="${user.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:0.5rem;">`
                : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&bold=true&size=64" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:0.5rem;">`;

            const joined = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '—';
            const isSuperAdmin = user.role === 'Super Admin';
            const isMe = user.id === me?.id;

            return `
                <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s;cursor:pointer;" 
                    onmouseenter="this.style.background='var(--bg-primary)'" 
                    onmouseleave="this.style.background='transparent'"
                    onclick="AdminPanel.openManageModal('${user.id}')">
                    <td style="padding:0.875rem 0.75rem;">
                        ${avatar}
                        <span style="font-weight:600;">${user.name}${isMe ? ' <span style="font-size:0.7rem;background:rgba(16,185,129,0.1);color:#10b981;padding:2px 6px;border-radius:10px;">You</span>' : ''}</span>
                    </td>
                    <td style="padding:0.875rem 0.75rem;color:var(--text-secondary);font-size:0.85rem;">${user.email}</td>
                    <td style="padding:0.875rem 0.75rem;">
                        ${isSuperAdmin
                            ? '<span style="background:rgba(139,92,246,0.1);color:#8b5cf6;padding:0.2rem 0.6rem;border-radius:10px;font-size:0.8rem;font-weight:600;">Super Admin</span>'
                            : `<span style="font-size:0.85rem;padding:0.2rem 0.6rem;border-radius:10px;background:rgba(37,99,235,0.1);color:#2563eb;">${typeof LangManager !== 'undefined' ? LangManager.t(user.role) : user.role}</span>`
                        }
                    </td>
                    <td style="padding:0.875rem 0.75rem;color:var(--text-secondary);font-size:0.85rem;">${user.title || '—'}</td>
                    <td style="padding:0.875rem 0.75rem;color:var(--text-secondary);font-size:0.85rem;">${joined}</td>
                </tr>
            `;
        }).join('');
    },

    filterUsers: (query) => {
        const users = Store.get('users') || [];
        const q = query.toLowerCase();
        const filtered = q
            ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.title || '').toLowerCase().includes(q))
            : users;
        AdminPanel.renderTable(filtered);
    },

    changeRole: (userId, newRole) => {
        let users = Store.get('users') || [];
        const idx = users.findIndex(u => u.id === userId);
        if (idx > -1) {
            users[idx].role = newRole;
            Store.set('users', users);
            // Sync team
            let team = Store.get('team') || [];
            const tidx = team.findIndex(t => t.id === userId);
            if (tidx > -1) { team[tidx].role = newRole; Store.set('team', team); }
            Store.log('Admin: Role Changed', `${users[idx].name} → ${newRole}`);
            AuthManager.showToast(`✅ Role updated to ${newRole}`);
            AdminPanel.refresh();
        }
    },

    openManageModal: (userId) => {
        const users = Store.get('users') || [];
        const user = users.find(u => u.id === userId);
        if(!user) return;

        AdminPanel._manageTargetId = user.id;
        const isMe = user.id === AuthManager.currentUser?.id;
        const isSuperAdmin = user.role === 'Super Admin';

        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&bold=true&size=128`;
        document.getElementById('manage-user-avatar').src = avatarUrl;
        document.getElementById('manage-user-name').textContent = user.name;
        document.getElementById('manage-user-email').textContent = user.email;
        
        const roleSelect = document.getElementById('manage-user-role');
        roleSelect.value = user.role;
        // Only allow changing roles if it's not you, or if you are SuperAdmin managing someone else
        roleSelect.disabled = isMe;

        // Reset Options text (in case language changed)
        Array.from(roleSelect.options).forEach(opt => {
            opt.textContent = typeof LangManager !== 'undefined' ? LangManager.t(opt.value) : opt.value;
        });

        // Setup Buttons
        const chatBtn = document.getElementById('manage-btn-chat');
        const resetBtn = document.getElementById('manage-btn-reset');
        const deleteBtn = document.getElementById('manage-btn-delete');
        const banBtn = document.getElementById('manage-btn-ban');

        if (chatBtn) {
            chatBtn.onclick = () => {
                document.getElementById('admin-manage-user-modal').classList.add('hidden');
                if (typeof TeamManager !== 'undefined') TeamManager.openChat(user.id);
            };
        }

        resetBtn.onclick = () => {
            document.getElementById('admin-manage-user-modal').classList.add('hidden');
            AdminPanel.openResetModal(user.id, user.name);
        };

        if(isMe || user.email === 'mod18hk@gmail.com') {
            // Cannot delete/ban yourself or the master platform owner
            deleteBtn.style.display = 'none';
            banBtn.style.display = 'none';
        } else {
            deleteBtn.style.display = 'block';
            banBtn.style.display = 'block';
            deleteBtn.onclick = () => {
                document.getElementById('admin-manage-user-modal').classList.add('hidden');
                AdminPanel.deleteUser(user.id);
            };
            banBtn.onclick = () => {
                document.getElementById('admin-manage-user-modal').classList.add('hidden');
                AdminPanel.banUser(user.id);
            };
        }

        document.getElementById('admin-manage-user-modal').classList.remove('hidden');
    },

    openResetModal: (userId, userName) => {
        AdminPanel._resetTargetId = userId;
        document.getElementById('admin-reset-target-name').textContent = userName;
        document.getElementById('admin-new-password').value = '';
        document.getElementById('admin-reset-modal').classList.remove('hidden');
    },

    confirmReset: () => {
        const newPass = document.getElementById('admin-new-password').value.trim();
        if (!newPass || newPass.length < 4) { alert('Password must be at least 4 characters.'); return; }

        let users = Store.get('users') || [];
        const idx = users.findIndex(u => u.id === AdminPanel._resetTargetId);
        if (idx > -1) {
            users[idx].password = newPass;
            Store.set('users', users);
            document.getElementById('admin-reset-modal').classList.add('hidden');
            Store.log('Admin: Password Reset', users[idx].name);
            AuthManager.showToast(`✅ Password reset successfully for ${users[idx].name}`);
        }
    },

    deleteUser: (userId) => {
        const users = Store.get('users') || [];
        const user = users.find(u => u.id === userId);
        if (!user) return;
        if (user.email === 'mod18hk@gmail.com') { alert('Cannot delete the Master Admin.'); return; }
        if (!confirm(`Are you sure you want to permanently delete "${user.name}"?`)) return;

        Store.set('users', users.filter(u => u.id !== userId));
        let team = Store.get('team') || [];
        Store.set('team', team.filter(t => t.id !== userId));
        Store.log('Admin: User Deleted', user.name);
        AuthManager.showToast(`✅ User "${user.name}" deleted.`);
        AdminPanel.refresh();
        if (typeof TeamManager !== 'undefined') TeamManager.render();
    },

    banUser: (userId) => {
        const users = Store.get('users') || [];
        const user = users.find(u => u.id === userId);
        if (!user) return;
        if (user.email === 'mod18hk@gmail.com') { alert('Cannot ban the Master Admin.'); return; }
        if (!confirm(`Are you sure you want to PERMANENTLY BAN "${user.email}"? They will never be able to register again.`)) return;

        // Add to banned emails
        let banned = Store.get('bannedEmails') || [];
        if(!banned.includes(user.email)) {
            banned.push(user.email);
            Store.set('bannedEmails', banned);
        }

        // Delete the user data
        Store.set('users', users.filter(u => u.id !== userId));
        let team = Store.get('team') || [];
        Store.set('team', team.filter(t => t.id !== userId));
        
        Store.log('Admin: User Banned', user.email);
        AuthManager.showToast(`🚫 Email "${user.email}" has been permanently banned.`);
        AdminPanel.refresh();
        if (typeof TeamManager !== 'undefined') TeamManager.render();
    }
};

window.AdminPanel = AdminPanel;
