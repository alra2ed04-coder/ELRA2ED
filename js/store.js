/**
 * Al-Raed SaaS Platform - Serverless Firebase Cloud Store
 * 
 * This module replaces LocalStorage/Socket.io with Firebase Firestore
 * to allow fully serverless cloud synchronization.
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
     * Connect to Cloud Sync (Firestore Real-time)
     */
    connectSync: () => {
        console.log('Store: Connecting to Firebase Cloud...');
        
        // Listen to global collections for changes
        const collections = ['tasks', 'team', 'finance', 'events', 'users', 'notifications', 'chat_rooms'];
        
        collections.forEach(collectionName => {
            db.collection(collectionName).onSnapshot(snapshot => {
                if (Store._syncing) return;
                
                snapshot.docChanges().forEach(change => {
                    const data = change.doc.data();
                    const key = collectionName;
                    
                    // Update local cache for performance
                    localStorage.setItem(key, JSON.stringify(Store._getCollectionData(snapshot)));
                    
                    // Refresh UI
                    Store._refreshSection(key);
                });
            });
        });

        // Listen for private messages (Personal)
        const me = AuthManager.currentUser;
        if (me) {
            db.collection('private_chats')
              .where('participants', 'array-contains', me.id)
              .onSnapshot(snapshot => {
                  // Handle private message updates
                  if (typeof ChatManager !== 'undefined') ChatManager.render();
              });
        }
    },

    _getCollectionData: (snapshot) => {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    _triggerFullRefresh: () => {
        try {
            if (typeof TasksManager !== 'undefined') TasksManager.render();
            if (typeof TeamManager !== 'undefined') TeamManager.render();
            if (typeof ChatManager !== 'undefined') ChatManager.render();
            if (typeof AdminPanel !== 'undefined') AdminPanel.refresh();
            if (typeof App !== 'undefined') App.updateDashboardStats();
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
                case 'notifications':
                    if (typeof NotificationManager !== 'undefined') NotificationManager.updateBadge();
                    break;
            }
        } catch (e) {}
    },

    // ── CORE METHODS ──

    get: (key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : (['tasks','team','events','users'].includes(key) ? [] : null);
        } catch(e) { return null; }
    },

    // Update both Cloud and Local Cache
    set: async (key, value) => {
        try {
            // 1. Save locally for instant UI response
            localStorage.setItem(key, JSON.stringify(value));

            // 2. Sync to Firebase if it's a shared collection
            const SHARED_COLLECTIONS = ['tasks', 'team', 'finance', 'events', 'users', 'notifications', 'chat_rooms'];
            
            if (SHARED_COLLECTIONS.includes(key) && Array.isArray(value)) {
                // For simplicity in this SaaS prototype, we overwrite the collection
                // In a massive app, you'd update individual docs
                for (const item of value) {
                    if (item.id) {
                        await db.collection(key).doc(item.id.toString()).set(item, { merge: true });
                    }
                }
            }

            // 3. Dispatch local event
            window.dispatchEvent(new CustomEvent('storeUpdated', { detail: { key, value } }));
        } catch(e) {
            console.error('Store.set Cloud Error:', e);
        }
    },

    remove: async (key) => {
        localStorage.removeItem(key);
        // Add cloud removal logic if needed
    },

    initWorkspace: async () => {
        // Clear old local data to prevent conflicts if this is the first run with Firebase
        if (!localStorage.getItem('fb_synced')) {
            localStorage.clear();
            localStorage.setItem('fb_synced', 'true');
        }

        console.log('Store: Initializing workspace...');
        
        // Initial fetch from cloud to ensure local cache is ready
        const collections = ['tasks', 'team', 'finance', 'events', 'users', 'notifications', 'chat_rooms'];
        for (const col of collections) {
            const snapshot = await db.collection(col).get();
            localStorage.setItem(col, JSON.stringify(Store._getCollectionData(snapshot)));
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
        logs.unshift({
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            action,
            target,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 100) logs.splice(100);
        Store.set('auditLogs', logs);
        
        // Also log to cloud
        db.collection('audit_logs').add(logs[0]);
    }
};

window.Store = Store;
