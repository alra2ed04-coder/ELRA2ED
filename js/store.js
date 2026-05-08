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
     * UPDATED: Now uses Firebase Firestore for Cloud Sync
     */
    connectSync: () => {
        try {
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                console.warn('Store: Firebase not initialized or keys missing. Running in local mode.');
                return;
            }

            const db = firebase.firestore();
            console.log('Store: Connecting to Firebase Cloud Sync...');

            // ✅ Real-time Firestore Listeners for ALL collections
            const collections = ['tasks', 'team', 'finance', 'audit_logs', 'messages', 'events', 'presence', 'users', 'workspace'];
            
            collections.forEach(collectionName => {
                db.collection(collectionName).onSnapshot((snapshot) => {
                    if (Store._syncing) return; // Prevent loop

                    snapshot.docChanges().forEach((change) => {
                        const key = change.doc.id;
                        const data = change.doc.data();
                        
                        // Skip if the update came from THIS browser recently
                        if (data.updatedBy === (AuthManager.currentUser?.id || 'anonymous') && 
                            (Date.now() - data.timestamp < 2000)) return;

                        console.log(`Store: Cloud Update received for [${key}] from collection [${collectionName}]`);

                        Store._syncing = true;
                        try {
                            if (change.type === 'removed') {
                                localStorage.removeItem(key);
                            } else {
                                localStorage.setItem(key, JSON.stringify(data.value));
                            }
                        } finally {
                            Store._syncing = false;
                        }

                        // Notify the app that data changed
                        window.dispatchEvent(new CustomEvent('storeUpdated', { detail: { key, value: data.value } }));
                        // Refresh relevant UI sections
                        Store._refreshSection(key);
                    });
                }, (err) => {
                    console.error(`Store: Sync Error in [${collectionName}]:`, err);
                });
            });

            // ✅ Track online users via Firestore 'presence' collection
            db.collection('presence').onSnapshot((snapshot) => {
                Store._onlineUsers = snapshot.docs.map(doc => doc.id);
                window.dispatchEvent(new CustomEvent('onlineUsersUpdated'));
                if (typeof TeamManager !== 'undefined') TeamManager.render();
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

            // 2. Sync to Firestore (Cloud)
            const PERSONAL_KEY_PREFIXES = ['pm_', 'savedMessages_', 'currentUser', 'wsInitialized'];
            const isPersonal = PERSONAL_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
            
            if (!isPersonal && typeof firebase !== 'undefined' && firebase.apps.length && !Store._syncing) {
                const db = firebase.firestore();
                const me = AuthManager.currentUser;
                
                // Map local keys to specific Firestore collections as seen in user's DB
                const collectionMap = {
                    'tasks': 'tasks',
                    'team': 'team',
                    'finance': 'finance',
                    'auditLogs': 'audit_logs',
                    'messages': 'messages',
                    'events': 'events',
                    'presence': 'presence',
                    'users': 'users'
                };

                const collectionName = collectionMap[key] || 'workspace';

                db.collection(collectionName).doc(key).set({
                    value: value,
                    updatedBy: me ? me.id : 'anonymous',
                    userName: me ? me.name : 'Unknown',
                    timestamp: Date.now()
                }).catch(err => console.warn('Store: Cloud sync delayed...', err.message));
            }

            // 3. Dispatch local event for same-tab reactivity
            window.dispatchEvent(new CustomEvent('storeUpdated', { detail: { key, value } }));
        } catch(e) {
            console.error('Store.set error:', e);
        }
    },

    remove: (key) => {
        localStorage.removeItem(key);
        if (typeof firebase !== 'undefined' && firebase.apps.length && !Store._syncing) {
            const db = firebase.firestore();
            db.collection('workspace').doc(key).delete();
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
