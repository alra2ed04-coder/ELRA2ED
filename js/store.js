/**
 * Al-Raed SaaS Platform - Serverless Firebase Cloud Store
 * 
 * Real-time sync via Firestore — every module updates instantly
 * without page refresh across all connected clients.
 */

// ── FIREBASE CONFIGURATION ──
const firebaseConfig = {
    apiKey: "AIzaSyAOtDkZA0gC0Ct7AaAoZIS-volT9XKnnrc",
    authDomain: "alraed-e4d2f.firebaseapp.com",
    projectId: "alraed-e4d2f",
    storageBucket: "alraed-e4d2f.firebasestorage.app",
    messagingSenderId: "1020246695771",
    appId: "1:1020246695771:web:ad4e35b67130ded1ba047e",
    measurementId: "G-L6QZKV6M0E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const Store = {
    _syncing: false,
    _onlineUsers: [],

    /**
     * Connect real-time Firestore listeners for ALL shared collections.
     * When any client writes data, all other clients receive it instantly.
     */
    connectSync: () => {
        console.log('Store: Connecting to Firebase Cloud...');

        // All collections that need real-time sync across clients
        const collections = [
            'tasks', 'team', 'finance', 'events', 'users',
            'notifications', 'chat_rooms', 'chat_invitations',
            'messages', 'support_tickets', 'projects', 'clients',
            'inventory', 'wiki', 'drive'
        ];

        collections.forEach(collectionName => {
            db.collection(collectionName).onSnapshot(snapshot => {
                if (Store._syncing) return;

                // Update local cache with cloud data
                const data = Store._getCollectionData(snapshot);
                localStorage.setItem(collectionName, JSON.stringify(data));

                // Fire storeUpdated event so all module listeners react
                window.dispatchEvent(new CustomEvent('storeUpdated', {
                    detail: { key: collectionName, value: data }
                }));

                // Directly call the matching UI refresh function
                Store._refreshSection(collectionName);

            }, err => {
                console.warn(`Store: Sync error for "${collectionName}":`, err.message);
            });
        });

        // Private chat listener — filtered to current user's conversations
        const me = (typeof AuthManager !== 'undefined') ? AuthManager.currentUser : null;
        if (me && me.id) {
            db.collection('private_chats')
                .where('participants', 'array-contains', me.id)
                .onSnapshot(snapshot => {
                    const data = Store._getCollectionData(snapshot);
                    localStorage.setItem('private_chats', JSON.stringify(data));
                    window.dispatchEvent(new CustomEvent('storeUpdated', {
                        detail: { key: 'private_chats', value: data }
                    }));
                    if (typeof ChatManager !== 'undefined') ChatManager.renderMessages();
                }, err => {
                    console.warn('Store: Private chat sync error:', err.message);
                });
        }
    },

    _getCollectionData: (snapshot) => {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Route Firestore updates to the correct UI module.
     * Every module has a case — none are left out.
     */
    _refreshSection: (key) => {
        try {
            switch (key) {
                case 'tasks':
                    if (typeof TasksManager !== 'undefined') TasksManager.render();
                    if (typeof App !== 'undefined') App.updateDashboardStats();
                    break;

                case 'team':
                    if (typeof TeamManager !== 'undefined') TeamManager.render();
                    if (typeof AdminPanel !== 'undefined') AdminPanel.refresh();
                    if (typeof App !== 'undefined') App.updateDashboardStats();
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
                    if (typeof App !== 'undefined') App.updateDashboardStats();
                    break;

                case 'notifications':
                    if (typeof NotificationManager !== 'undefined') NotificationManager.loadNotifications();
                    break;

                case 'messages':
                case 'private_chats':
                case 'chat_rooms':
                case 'chat_invitations':
                    if (typeof ChatManager !== 'undefined') ChatManager.render();
                    break;

                case 'support_tickets':
                    if (typeof SupportManager !== 'undefined') SupportManager.renderTickets();
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

                case 'wiki':
                    if (typeof WikiManager !== 'undefined') WikiManager.render();
                    break;

                case 'drive':
                    if (typeof DriveManager !== 'undefined') DriveManager.render();
                    break;

                case 'auditLogs':
                    if (typeof AuditManager !== 'undefined') AuditManager.render();
                    break;
            }
        } catch (e) {
            console.warn('Store._refreshSection error:', e);
        }
    },

    // ── CORE DATA METHODS ─────────────────────────────────────────────

    get: (key) => {
        try {
            const raw = localStorage.getItem(key);
            const arrayKeys = [
                'tasks', 'team', 'events', 'users', 'messages',
                'support_tickets', 'projects', 'clients', 'inventory',
                'wiki', 'drive', 'chat_rooms', 'chat_invitations', 'finance'
            ];
            return raw ? JSON.parse(raw) : (arrayKeys.includes(key) ? [] : null);
        } catch(e) { return null; }
    },

    /**
     * Write flow:
     * 1. Save to localStorage → instant local UI response
     * 2. Dispatch storeUpdated event → all storeUpdated listeners update
     * 3. Batch-write to Firestore → other clients receive real-time update
     */
    set: async (key, value) => {
        try {
            // Instant local save
            localStorage.setItem(key, JSON.stringify(value));

            // Immediate UI event (doesn't wait for Firebase)
            window.dispatchEvent(new CustomEvent('storeUpdated', { detail: { key, value } }));

            // Async Firebase sync
            const SHARED_COLLECTIONS = [
                'tasks', 'team', 'finance', 'events', 'users',
                'notifications', 'chat_rooms', 'chat_invitations',
                'messages', 'private_chats', 'support_tickets',
                'projects', 'clients', 'inventory', 'wiki', 'drive'
            ];

            if (SHARED_COLLECTIONS.includes(key) && Array.isArray(value)) {
                const batch = db.batch();
                value.forEach(item => {
                    if (item && item.id) {
                        const ref = db.collection(key).doc(item.id.toString());
                        batch.set(ref, item, { merge: true });
                    }
                });
                // Non-blocking — UI already responded above
                batch.commit().catch(e => console.warn('Store.set batch error:', e));
            }
        } catch(e) {
            console.error('Store.set Error:', e);
        }
    },

    remove: async (key) => {
        localStorage.removeItem(key);
    },

    initWorkspace: async () => {
        if (!localStorage.getItem('fb_synced')) {
            localStorage.clear();
            localStorage.setItem('fb_synced', 'true');
        }

        console.log('Store: Initializing workspace from cloud...');

        const collections = [
            'tasks', 'team', 'finance', 'events', 'users',
            'notifications', 'chat_rooms', 'chat_invitations',
            'messages', 'support_tickets', 'projects', 'clients',
            'inventory', 'wiki', 'drive'
        ];

        try {
            for (const col of collections) {
                const snapshot = await db.collection(col).get();
                localStorage.setItem(col, JSON.stringify(Store._getCollectionData(snapshot)));
            }
        } catch(e) {
            console.warn('Store.initWorkspace: Cloud fetch failed, using cached data.', e.message);
        }

        Store.connectSync();

        if (!localStorage.getItem('wsInitialized')) {
            localStorage.setItem('wsInitialized', 'true');
        }
    },

    log: (action, target) => {
        const user = AuthManager && AuthManager.currentUser;
        if (!user) return;
        const logs = Store.get('auditLogs') || [];
        const entry = {
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            action,
            target,
            timestamp: new Date().toISOString()
        };
        logs.unshift(entry);
        if (logs.length > 100) logs.splice(100);
        Store.set('auditLogs', logs);

        // Push to Firestore audit trail (non-blocking)
        db.collection('audit_logs').add(entry).catch(() => {});

        // Refresh audit log in admin panel
        if (typeof AuditManager !== 'undefined') AuditManager.render();
    }
};

window.Store = Store;
