/**
 * Al-Raed SaaS Platform - Authentication System
 * Handles registration (with job title), login, logout, profile management, and RBAC.
 */
const AuthManager = {
    currentUser: null,

    init: () => {
        Store.initWorkspace();
        AuthManager.bindEvents();
        AuthManager.checkAuth();
    },

    bindEvents: () => {
        // Form switches
        document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.remove('hidden');
            document.querySelector('.auth-header p').textContent = 'Create your account to get started';
        });

        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
            document.querySelector('.auth-header p').textContent = 'Login to access your workspace';
        });

        // Login
        document.getElementById('btn-login')?.addEventListener('click', AuthManager.handleLogin);
        document.getElementById('login-password')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') AuthManager.handleLogin();
        });

        // Register
        document.getElementById('btn-register')?.addEventListener('click', AuthManager.handleRegister);

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', AuthManager.logout);

        // Profile section
        document.getElementById('btn-save-profile')?.addEventListener('click', AuthManager.saveProfile);
        document.getElementById('btn-save-pass')?.addEventListener('click', AuthManager.changePassword);

        // Avatar preview
        document.getElementById('setting-avatar-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('avatar-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    handleLogin: () => {
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-error');

        if (!email || !pass) {
            errEl.textContent = 'Please fill in all fields.';
            errEl.classList.remove('hidden');
            return;
        }

        const users = Store.get('users') || [];
        const user = users.find(u => u.email === email && u.password === pass);

        if (user) {
            errEl.classList.add('hidden');
            AuthManager.login(user);
        } else {
            errEl.textContent = 'Invalid email or password.';
            errEl.classList.remove('hidden');
        }
    },

    handleRegister: () => {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value;
        const title = document.getElementById('reg-title').value.trim();
        const errEl = document.getElementById('register-error');

        if (!name || !email || !pass) {
            errEl.textContent = 'Please fill in all required fields.';
            errEl.classList.remove('hidden');
            return;
        }

        const users = Store.get('users') || [];
        if (users.find(u => u.email === email)) {
            errEl.textContent = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو التواصل مع الإدارة لحذف الحساب القديم.';
            errEl.classList.remove('hidden');
            return;
        }

        const banned = Store.get('bannedEmails') || [];
        if (banned.includes(email)) {
            errEl.textContent = 'This email has been permanently banned from the platform.';
            errEl.classList.remove('hidden');
            return;
        }

        // First user is Super Admin
        const isFirst = users.length === 0;
        const newUser = {
            id: 'user_' + Date.now(),
            name,
            email,
            password: pass,
            title: title || (isFirst ? 'Platform Owner' : 'Team Member'),
            role: isFirst ? 'Super Admin' : 'Member',
            avatar: null,
            joinedAt: new Date().toISOString()
        };

        users.push(newUser);
        Store.set('users', users);

        // Add to team list (shared workspace)
        const team = Store.get('team') || [];
        team.push({ id: newUser.id, name, email, title: newUser.title, role: newUser.role, avatar: null });
        Store.set('team', team);

        Store.log('User Registered', `${name} (${email})`);
        errEl.classList.add('hidden');
        AuthManager.login(newUser);
    },

    login: (user) => {
        // Always load fresh user data from store to get updates
        let users = Store.get('users') || [];
        let freshUser = users.find(u => u.id === user.id) || user;

        // Force this specific user to ALWAYS be Super Admin
        if (freshUser.email && freshUser.email.trim().toLowerCase() === 'mod18hk@gmail.com' && freshUser.role !== 'Super Admin') {
            freshUser.role = 'Super Admin';

            // Update in Users store
            const idx = users.findIndex(u => u.id === freshUser.id);
            if (idx > -1) {
                users[idx].role = 'Super Admin';
                Store.set('users', users);
            }

            // Update in Team store
            let team = Store.get('team') || [];
            const tIdx = team.findIndex(t => t.id === freshUser.id);
            if (tIdx > -1) {
                team[tIdx].role = 'Super Admin';
                Store.set('team', team);
            }
        }

        AuthManager.currentUser = { ...freshUser };
        localStorage.setItem('currentUser', JSON.stringify(freshUser));

        document.getElementById('auth-wrapper').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');

        AuthManager.updateUserUI();
        AuthManager.applyRoleUI();

        // Init app modules after login
        if (typeof App !== 'undefined') App.init();

        // Announce online presence to all other clients
        if (Store._socket && Store._socket.connected) {
            Store._socket.emit('userPresence', { userId: freshUser.id, name: freshUser.name });
        }

        // Notify welcome
        NotificationManager.add(`مرحباً بك، ${freshUser.name}! 👋`, 'fa-hand-wave', 'system');
    },

    logout: () => {
        localStorage.removeItem('currentUser');
        AuthManager.currentUser = null;
        document.getElementById('auth-wrapper').classList.remove('hidden');
        document.getElementById('app-wrapper').classList.add('hidden');
        // Reset login form
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    },

    checkAuth: () => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                const user = JSON.parse(saved);
                // Try to refresh user data from the store (in case role/avatar changed)
                const users = Store.get('users') || [];
                const fresh = users.find(u => u.id === user.id);

                if (fresh) {
                    // User still exists — restore session silently (no full App.init loop)
                    AuthManager.currentUser = { ...fresh };
                    // Update stored session with fresh data
                    localStorage.setItem('currentUser', JSON.stringify(fresh));
                    // Show app
                    document.getElementById('auth-wrapper').classList.add('hidden');
                    document.getElementById('app-wrapper').classList.remove('hidden');
                    AuthManager.updateUserUI();
                    AuthManager.applyRoleUI();
                    if (typeof App !== 'undefined') App.init();
                } else if (user.email && user.email.trim().toLowerCase() === 'mod18hk@gmail.com') {
                    // Master admin might not be in store yet (first run) - still allow login
                    AuthManager.login(user);
                } else {
                    // User was deleted or not found
                    AuthManager.showLoginScreen();
                }
            } catch (e) {
                AuthManager.showLoginScreen();
            }
        } else {
            AuthManager.showLoginScreen();
        }
    },

    showLoginScreen: () => {
        document.getElementById('auth-wrapper').classList.remove('hidden');
        document.getElementById('app-wrapper').classList.add('hidden');
    },

    updateUserUI: () => {
        const user = AuthManager.currentUser;
        if (!user) return;

        // Always load fresh avatar from store to handle persistence across refresh
        const users = Store.get('users') || [];
        const freshUser = users.find(u => u.id === user.id);
        const avatar = (freshUser?.avatar || user.avatar) || null;
        const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&bold=true&size=128`;

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const setSrc = (id, src) => { const el = document.getElementById(id); if (el) el.src = src; };
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

        setSrc('current-user-avatar', avatarUrl);
        setSrc('profile-display-avatar', avatarUrl);
        setSrc('avatar-preview', avatarUrl);
        setEl('current-user-name', user.name);
        setEl('current-user-role', typeof LangManager !== 'undefined' ? LangManager.t(user.role) : user.role);
        setEl('dash-user-name', user.name);
        setEl('dash-user-title', typeof LangManager !== 'undefined' ? LangManager.t(user.title || '') : (user.title || ''));
        setEl('profile-display-name', user.name);
        setEl('profile-display-title', typeof LangManager !== 'undefined' ? LangManager.t(user.title || 'No title set') : (user.title || 'No title set'));
        setEl('profile-display-role', typeof LangManager !== 'undefined' ? LangManager.t(user.role) : user.role);
        setVal('setting-name', user.name);
        setVal('setting-email', user.email);
        setVal('setting-title', user.title || '');

        // Sync fresh avatar into current session if different
        if (freshUser?.avatar && freshUser.avatar !== AuthManager.currentUser.avatar) {
            AuthManager.currentUser.avatar = freshUser.avatar;
            localStorage.setItem('currentUser', JSON.stringify(AuthManager.currentUser));
        }
    },

    applyRoleUI: () => {
        const role = AuthManager.currentUser?.role;
        const isAdmin = role === 'Super Admin' || role === 'Manager';
        const isSuperAdmin = role === 'Super Admin';

        // Show/hide admin-only elements (visible to Super Admin AND Manager)
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? '' : 'none';
        });

        // Show/hide super-admin-only elements (ONLY Super Admin)
        document.querySelectorAll('.superadmin-only').forEach(el => {
            el.style.display = isSuperAdmin ? '' : 'none';
        });

        // Show/hide non-admin elements
        document.querySelectorAll('.member-only').forEach(el => {
            el.style.display = isAdmin ? 'none' : '';
        });
    },

    saveProfile: () => {
        const name = document.getElementById('setting-name')?.value.trim();
        const title = document.getElementById('setting-title')?.value.trim();
        const email = document.getElementById('setting-email')?.value.trim();
        const fileInput = document.getElementById('setting-avatar-file');

        if (!name) { AuthManager.showToast('Name cannot be empty.', 'error'); return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            AuthManager.showToast('Invalid email address.', 'error'); return;
        }

        // Check email uniqueness if changed
        if (email && email !== AuthManager.currentUser.email) {
            const users = Store.get('users') || [];
            if (users.find(u => u.email === email && u.id !== AuthManager.currentUser.id)) {
                AuthManager.showToast('This email is already in use.', 'error'); return;
            }
        }

        const processUpdate = (avatarDataUrl) => {
            let users = Store.get('users') || [];
            const idx = users.findIndex(u => u.id === AuthManager.currentUser.id);
            if (idx > -1) {
                users[idx].name = name;
                users[idx].title = title || users[idx].title;
                if (email) users[idx].email = email;
                if (avatarDataUrl) users[idx].avatar = avatarDataUrl;
                Store.set('users', users);

                // Update team member too
                let team = Store.get('team') || [];
                const tidx = team.findIndex(t => t.id === AuthManager.currentUser.id);
                if (tidx > -1) {
                    team[tidx].name = name;
                    team[tidx].title = title || team[tidx].title;
                    if (email) team[tidx].email = email;
                    if (avatarDataUrl) team[tidx].avatar = avatarDataUrl;
                    Store.set('team', team);
                }

                // Update session
                AuthManager.currentUser = { ...users[idx] };
                localStorage.setItem('currentUser', JSON.stringify(AuthManager.currentUser));

                AuthManager.updateUserUI();
                if (typeof TeamManager !== 'undefined') TeamManager.render();
                if (typeof ChatManager !== 'undefined') ChatManager.render();
                Store.log('Profile Updated', name);
                AuthManager.showToast('✅ Profile updated successfully!');
            }
        };

        if (fileInput?.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 256;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    processUpdate(resizedDataUrl);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            processUpdate(null);
        }
    },

    changePassword: () => {
        const curr = document.getElementById('setting-curr-pass').value;
        const newP = document.getElementById('setting-new-pass').value;
        const confirm = document.getElementById('setting-confirm-pass')?.value;

        if (!curr || !newP) { alert('Please fill both password fields.'); return; }
        if (confirm && newP !== confirm) { alert('New passwords do not match.'); return; }

        let users = Store.get('users') || [];
        const idx = users.findIndex(u => u.id === AuthManager.currentUser.id);
        if (idx > -1) {
            if (users[idx].password !== curr) { alert('Current password is incorrect.'); return; }
            users[idx].password = newP;
            Store.set('users', users);
            AuthManager.currentUser.password = newP;
            localStorage.setItem('currentUser', JSON.stringify(AuthManager.currentUser));
            document.getElementById('setting-curr-pass').value = '';
            document.getElementById('setting-new-pass').value = '';
            if (document.getElementById('setting-confirm-pass')) document.getElementById('setting-confirm-pass').value = '';
            Store.log('Password Changed', AuthManager.currentUser.name);
            AuthManager.showToast('✅ Password changed successfully!');
        }
    },

    showToast: (msg, type = 'success') => {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.style.cssText = `
                position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
                background: ${type === 'success' ? '#10b981' : '#ef4444'};
                color: white; padding: 1rem 1.5rem; border-radius: 0.75rem;
                font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                transform: translateY(100px); opacity: 0;
                transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
                font-size: 0.95rem;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 3500);
    }
};

window.AuthManager = AuthManager;

document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});
