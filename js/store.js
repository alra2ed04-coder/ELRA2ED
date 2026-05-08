/**
 * Al-Raed SaaS Platform - Real-time Shared Data Store
 * 
 * HOW IT WORKS:
 * - localStorage is used as a LOCAL CACHE for offline access and fast reads.
 * - Socket.IO is used to SYNC every change to the server AND all other browsers.
 * - When a client connects, it receives the full latest state from the server.
 * - Any Store.set() call is broadcast to all connected browsers instantly.
 */
const Store = {
    _socket: null,
    _syncing: false, // Flag to prevent infinite loop when receiving updates

    /**
     * Connect to the real-time sync server.
     * Called once at startup.
     */
    connectSync: () => {
        try {
            if (typeof io === 'undefined') {
                console.warn('Store: Socket.IO not loaded, running in local-only mode.');
                return;
            }

            Store._socket = io(window.location.origin, {
                transports: ['websocket', 'polling']
            });

            Store._socket.on('connect', () => {
                console.log('Store: Connected to sync server. Socket ID:', Store._socket.id);
                // Join the shared platform room and request full state
                Store._socket.emit('joinPlatform');
            });

            Store._socket.on('connect_error', (err) => {
                console.warn('Store: Sync server unavailable. Running in local-only mode.', err.message);
            });

            // ✅ Receive the full state snapshot when first connecting
            Store._socket.on('storeFullSync', (fullState) => {
                console.log('Store: Received full state from server');
                // Keys that are PERSONAL per-user - never overwrite with server state
                const PERSONAL_KEY_PREFIXES = ['pm_', 'savedMessages_', 'currentUser'];
                Store._syncing = true;
                try {
                    Object.entries(fullState).forEach(([key, value]) => {
                        // Skip personal/private keys - they belong to THIS browser only
                        const isPersonal = PERSONAL_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
                        if (!isPersonal && value !== null) {
                            localStorage.setItem(key, JSON.stringify(value));
                        }
                    });
                } finally {
                    Store._syncing = false;
                }
                // Trigger a full UI refresh (only if logged in)
                if (localStorage.getItem('currentUser')) {
                    Store._triggerFullRefresh();
                }
            });

            // ✅ Track online users
            Store._onlineUsers = [];
            Store._socket.on('onlineUsersList', (userIds) => {
                Store._onlineUsers = userIds || [];
                window.dispatchEvent(new CustomEvent('onlineUsersUpdated'));
                if (typeof TeamManager !== 'undefined') TeamManager.render();
            });

            // ✅ Receive individual updates from other clients
            Store._socket.on('storeUpdate', ({ key, value, userName, userId }) => {
                // Never accept server updates for personal keys
                const PERSONAL_KEY_PREFIXES = ['pm_', 'savedMessages_', 'currentUser'];
                const isPersonal = PERSONAL_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
                if (isPersonal) return;

                Store._syncing = true;
                try {
                    if (value === null) {
                        localStorage.removeItem(key);
                    } else {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                } finally {
                    Store._syncing = false;
                }

                // Show notification for important changes
                if (value !== null && !Store._syncing) {
                    Store._notifyUserOfChange(key, userName);
                }

                // Notify the app that data changed
                window.dispatchEvent(new CustomEvent('storeUpdated', { detail: { key, value } }));
                // Refresh relevant UI sections
                Store._refreshSection(key);
            });

            // ✅ Handle System Notifications
            Store._socket.on('systemNotification', (notif) => {
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.add(notif.content, notif.icon, notif.type);
                }
            });

        } catch (err) {
            console.error('Store.connectSync error:', err);
        }
    },

    _triggerFullRefresh: () => {
        try {
            if (typeof TasksManager !== 'undefined') TasksManager.render();
            if (typeof TeamManager !== 'undefined') TeamManager.render();
            if (typeof ChatManager !== 'undefined') ChatManager.render();
            if (typeof AdminPanel !== 'undefined') AdminPanel.refresh();
            if (typeof FinanceManager !== 'undefined') {
                FinanceManager.renderExpenses();
                FinanceManager.renderDebts();
            }
            if (typeof App !== 'undefined') App.updateDashboardStats();
            if (typeof LangManager !== 'undefined') LangManager.applyTranslations();
        } catch (e) {}
    },

    _refreshSection: (key) => {
        try {
            switch(key) {
                case 'tasks': 
                    if (typeof TasksManager !== 'undefined') TasksManager.render();
                    if (typeof App !== 'undefined') App.updateDashboardStats();
                    break;
                case 'team':
                    if (typeof TeamManager !== 'undefined') TeamManager.render();
                    if (typeof App !== 'undefined') App.updateDashboardStats();
                    break;
                case 'messages':
                    if (typeof ChatManager !== 'undefined') ChatManager.render();
                    break;
                case 'users':
                    if (typeof AdminPanel !== 'undefined') AdminPanel.refresh();
                    break;
                case 'finance':
                    if (typeof FinanceManager !== 'undefined') {
                        FinanceManager.renderExpenses();
                        FinanceManager.renderDebts();
                    }
                    break;
                case 'events':
                    if (typeof CalendarManager !== 'undefined') CalendarManager.render();
                    break;
                case 'auditLogs':
                    if (typeof AuditManager !== 'undefined') AuditManager.render();
                    break;
                case 'notifications':
                    if (typeof NotificationManager !== 'undefined') NotificationManager.loadNotifications();
                    break;
                case 'projects':
                    if (typeof ProjectsManager !== 'undefined') ProjectsManager.render();
                    break;
                case 'clients':
                    if (typeof ClientsManager !== 'undefined') ClientsManager.render();
                    break;
                case 'inventory':
                    if (typeof InventoryManager !== 'undefined') InventoryManager.render();
                    break;
                default:
                    // If it's a room message, refresh chat
                    if (key.startsWith('room_msgs_')) {
                        if (typeof ChatManager !== 'undefined') ChatManager.render();
                    }
                    break;
            }
        } catch (e) {}
    },

    _notifyUserOfChange: (key, userName) => {
        if (typeof NotificationManager === 'undefined') return;
        
        let content = '';
        let icon = 'fa-sync';
        let type = 'system';

        switch(key) {
            case 'tasks': content = `قام ${userName} بتحديث المهام`; icon = 'fa-tasks'; type = 'task'; break;
            case 'team': content = `تم تحديث بيانات الفريق بواسطة ${userName}`; icon = 'fa-users'; type = 'system'; break;
            case 'finance': content = `تحديث مالي جديد بواسطة ${userName}`; icon = 'fa-wallet'; type = 'event'; break;
            case 'events': content = `موعد جديد أضيف بواسطة ${userName}`; icon = 'fa-calendar-alt'; type = 'event'; break;
            case 'announcements': content = `إعلان جديد من ${userName}`; icon = 'fa-bullhorn'; type = 'system'; break;
        }

        if (content) {
            NotificationManager.add(content, icon, type);
        }
    },

    get: (key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch(e) {
            return null;
        }
    },

    set: (key, value) => {
        try {
            // 1. Always save locally first (fast cache)
            localStorage.setItem(key, JSON.stringify(value));

            // 2. If connected, broadcast ONLY non-personal data to other browsers
            const PERSONAL_KEY_PREFIXES = ['pm_', 'savedMessages_', 'currentUser'];
            const isPersonal = PERSONAL_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
            if (!isPersonal && Store._socket && Store._socket.connected && !Store._syncing) {
                const me = typeof AuthManager !== 'undefined' ? AuthManager.currentUser : null;
                Store._socket.emit('storeSync', { 
                    key, 
                    value, 
                    userName: me ? me.name : 'Unknown',
                    userId: me ? me.id : null
                });
            }

            // 3. Dispatch local event for same-tab reactivity
            window.dispatchEvent(new CustomEvent('storeUpdated', { detail: { key, value } }));
        } catch(e) {
            console.error('Store.set error:', e);
        }
    },

    remove: (key) => {
        localStorage.removeItem(key);
        if (Store._socket && Store._socket.connected && !Store._syncing) {
            Store._socket.emit('storeSync', { key, value: null });
        }
    },

    // Initialize default workspace data if not exists
    initWorkspace: () => {
        if (!Store.get('wsInitialized')) {
            Store.set('tasks', []);
            Store.set('team', []);
            Store.set('events', []);
            Store.set('finance', []);
            Store.set('inventory', []);
            Store.set('projects', []);
            Store.set('clients', []);
            Store.set('cloud_drive', []);
            Store.set('messages', []);
            Store.set('privateMessages', {});
            Store.set('announcements', []);
            Store.set('chat_rooms', []);
            Store.set('chat_invitations', []);
            Store.set('auditLogs', []);
            Store.set('wsInitialized', true);
        }
    },

    // Log an action to audit log
    log: (action, target) => {
        const user = AuthManager && AuthManager.currentUser;
        if (!user) return;
        const logs = Store.get('auditLogs') || [];
        logs.unshift({
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            action,
            target,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 200) logs.splice(200);
        Store.set('auditLogs', logs);
    }
};

window.Store = Store;
