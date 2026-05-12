/**
 * Al-Raed SaaS Platform - Notifications System
 * Interactive notifications that navigate to relevant content.
 */
const NotificationManager = {
    init: () => {
        NotificationManager.bindEvents();
        NotificationManager.loadNotifications();
        
        // Request Desktop Push Permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    },

    bindEvents: () => {
        // Toggle dropdown
        document.getElementById('notif-toggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('notif-dropdown');
            dropdown.classList.toggle('hidden');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notif-dropdown');
            if (dropdown && !dropdown.contains(e.target) && !document.getElementById('notif-toggle')?.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Mark all as read
        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            NotificationManager.markAllAsRead();
        });

        // Listen for store updates
        window.addEventListener('storeUpdated', (e) => {
            if (e.detail.key === 'notifications') {
                NotificationManager.loadNotifications();
            }
        });
    },

    // Add a notification for the current user
    add: (content, icon = 'fa-bell', type = 'system', relatedId = null) => {
        const me = AuthManager?.currentUser;
        if (!me) return;
        NotificationManager.addForUser(me.id, content, type, relatedId, icon);
        NotificationManager.showToast(content, icon, type);
    },

    // Add notification for a specific user
    addForUser: (userId, content, type = 'system', relatedId = null, icon = 'fa-bell') => {
        const allNotifs = Store.get('notifications') || {};
        if (!allNotifs[userId]) allNotifs[userId] = [];
        allNotifs[userId].unshift({
            id: 'notif_' + Date.now() + Math.random(),
            content,
            type,
            relatedId,
            icon,
            read: false,
            timestamp: new Date().toISOString()
        });
        // Keep max 50
        if (allNotifs[userId].length > 50) allNotifs[userId].splice(50);
        Store.set('notifications', allNotifs);
        NotificationManager.loadNotifications();
    },

    showToast: (content, icon, type) => {
        const isRtl = document.documentElement.dir === 'rtl';
        const container = document.getElementById('toast-container') || (() => {
            const c = document.createElement('div');
            c.id = 'toast-container';
            c.style.cssText = `position:fixed; top:20px; ${isRtl ? 'left' : 'right'}:20px; z-index:10000; display:flex; flex-direction:column; gap:10px; pointer-events:none;`;
            document.body.appendChild(c);
            return c;
        })();

        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
            new Notification("تنبيه جديد - منصة الرائد", { body: content, icon: 'https://cdn-icons-png.flaticon.com/512/3649/3649460.png' });
        }

        const toast = document.createElement('div');
        toast.className = 'glass-effect';
        const offScreen = isRtl ? '-120%' : '120%';
        const borderSide = isRtl ? 'right' : 'left';
        
        toast.style.cssText = `
            pointer-events: auto; padding: 12px 20px; display: flex; align-items: center; gap: 12px;
            background: var(--bg-secondary); border-${borderSide}: 4px solid ${NotificationManager.getTypeColor(type)};
            box-shadow: var(--shadow-lg); transform: translateX(${offScreen}); transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            min-width: 300px; max-width: 450px;
        `;
        
        toast.innerHTML = `
            <div style="width:32px; height:32px; border-radius:50%; background:${NotificationManager.getTypeColor(type)}; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0;">
                <i class="fas ${icon}"></i>
            </div>
            <div style="flex:1;">
                <p style="font-size:0.9rem; font-weight:600; margin:0; line-height:1.4;">${content}</p>
            </div>
            <button style="background:none; border:none; cursor:pointer; color:var(--text-secondary);" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.style.transform = 'translateX(0)');

        setTimeout(() => {
            toast.style.transform = `translateX(${offScreen})`;
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    },

    getMyNotifs: () => {
        const me = AuthManager?.currentUser;
        if (!me) return [];
        const all = Store.get('notifications') || {};
        return all[me.id] || [];
    },

    loadNotifications: () => {
        const notifs  = NotificationManager.getMyNotifs();
        const unread  = notifs.filter(n => !n.read).length;
        const badge   = document.getElementById('notif-badge');
        const list    = document.getElementById('notif-list');

        if (badge) {
            badge.textContent = unread > 9 ? '9+' : unread;
            badge.style.display = unread > 0 ? 'inline' : 'none';
        }

        if (!list) return;

        if (notifs.length === 0) {
            list.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text-secondary)"><i class="fas fa-bell-slash" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.4;"></i>No notifications yet</div>';
            return;
        }

        list.innerHTML = '';
        notifs.slice(0, 20).forEach(n => {
            const time = new Date(n.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const div = document.createElement('div');
            div.className = 'notif-item' + (n.read ? '' : ' unread');
            div.style.cssText = `
                display:flex; align-items:flex-start; gap:0.75rem; padding:0.875rem 1rem;
                border-bottom:1px solid var(--border-color); cursor:pointer;
                background:${n.read ? 'transparent' : 'rgba(37,99,235,0.05)'};
                transition: all 0.2s;
            `;
            div.innerHTML = `
                <div style="width:36px;height:36px;border-radius:50%;background:${NotificationManager.getTypeColor(n.type)};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white;font-size:0.875rem;">
                    <i class="fas ${n.icon || NotificationManager.getTypeIcon(n.type)}"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <p style="font-size:0.875rem;font-weight:${n.read ? '400' : '600'};line-height:1.4;margin-bottom:0.25rem;">${n.content}</p>
                    <span style="font-size:0.75rem;color:var(--text-secondary);">${time}</span>
                </div>
                ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--primary-color);flex-shrink:0;margin-top:0.375rem;"></div>' : ''}
            `;

            div.addEventListener('mouseenter', () => div.style.background = 'var(--bg-primary)');
            div.addEventListener('mouseleave', () => div.style.background = n.read ? 'transparent' : 'rgba(37,99,235,0.05)');

            div.addEventListener('click', () => {
                NotificationManager.markAsRead(n.id);
                NotificationManager.navigateTo(n);
                document.getElementById('notif-dropdown').classList.add('hidden');
            });

            list.appendChild(div);
        });
    },

    getTypeColor: (type) => {
        const colors = { message: '#2563eb', task: '#10b981', event: '#f59e0b', system: '#8b5cf6' };
        return colors[type] || '#64748b';
    },

    getTypeIcon: (type) => {
        const icons = { message: 'fa-comment', task: 'fa-tasks', event: 'fa-calendar', system: 'fa-bell' };
        return icons[type] || 'fa-bell';
    },

    navigateTo: (notif) => {
        const navMap = { message: 'chat', task: 'tasks', event: 'calendar', system: 'dashboard' };
        const target = navMap[notif.type] || 'dashboard';
        const navItem = document.querySelector(`.nav-item[data-target="${target}"]`);
        if (navItem) {
            navItem.click();
            // Highlight related element after navigation
            if (notif.relatedId) {
                setTimeout(() => {
                    const el = document.querySelector(`[data-id="${notif.relatedId}"]`);
                    if (el) {
                        el.style.outline = '2px solid var(--primary-color)';
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => el.style.outline = '', 3000);
                    }
                }, 500);
            }
        }
    },

    markAsRead: (notifId) => {
        const me = AuthManager?.currentUser;
        if (!me) return;
        const all = Store.get('notifications') || {};
        const myNotifs = all[me.id] || [];
        const notif = myNotifs.find(n => n.id === notifId);
        if (notif) {
            notif.read = true;
            Store.set('notifications', all);
            NotificationManager.loadNotifications();
        }
    },

    markAllAsRead: () => {
        const me = AuthManager?.currentUser;
        if (!me) return;
        const all = Store.get('notifications') || {};
        if (all[me.id]) {
            all[me.id].forEach(n => n.read = true);
            Store.set('notifications', all);
            NotificationManager.loadNotifications();
        }
    }
};

window.NotificationManager = NotificationManager;
