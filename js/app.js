/**
 * Al-Raed SaaS Platform - Main App Controller
 * Orchestrates all modules and manages navigation, settings, and dashboard.
 */
const App = {
    init: () => {
        // FORCE DB UPGRADE & CLEANUP FOR ADMIN EMAIL
        try {
            let users = Store.get('users') || [];
            
            // CLEANUP DUPLICATES: Remove duplicates if they have the exact same email or ID
            let emailGroups = {};
            users.forEach(u => {
                let e = u.email ? u.email.trim().toLowerCase() : 'unknown';
                if(!emailGroups[e]) emailGroups[e] = [];
                emailGroups[e].push(u);
            });

            for (let e in emailGroups) {
                if (emailGroups[e].length > 1) {
                    // Keep the one with an avatar, or the first one if neither has an avatar
                    const keepUser = emailGroups[e].find(u => u.avatar) || emailGroups[e][0];
                    // Keep this exact user object, and discard other objects with same email
                    users = users.filter(u => {
                        let currentEmail = u.email ? u.email.trim().toLowerCase() : 'unknown';
                        if (currentEmail === e) {
                            return u === keepUser;
                        }
                        return true;
                    });
                }
            }
            Store.set('users', users);

            let updated = false;
            users.forEach(u => {
                if (u.email && u.email.trim().toLowerCase() === 'mod18hk@gmail.com' && u.role !== 'Super Admin') {
                    u.role = 'Super Admin';
                    updated = true;
                }
            });
            if(updated) Store.set('users', users);

            let team = Store.get('team') || [];
            
            // CLEANUP DUPLICATES in Team
            let teamGroups = {};
            team.forEach(t => {
                let e = t.email ? t.email.trim().toLowerCase() : 'unknown';
                if(!teamGroups[e]) teamGroups[e] = [];
                teamGroups[e].push(t);
            });

            for (let e in teamGroups) {
                if (teamGroups[e].length > 1) {
                    const keepTeam = teamGroups[e].find(t => t.avatar) || teamGroups[e][0];
                    team = team.filter(t => {
                        let currentEmail = t.email ? t.email.trim().toLowerCase() : 'unknown';
                        if (currentEmail === e) {
                            return t === keepTeam;
                        }
                        return true;
                    });
                }
            }
            Store.set('team', team);

            let tUpdated = false;
            team.forEach(t => {
                if (t.email && t.email.trim().toLowerCase() === 'mod18hk@gmail.com' && t.role !== 'Super Admin') {
                    t.role = 'Super Admin';
                    tUpdated = true;
                }
            });
            if(tUpdated) Store.set('team', team);
        } catch(e) {}

        // Connect to real-time sync server AFTER user data is ready
        Store.connectSync();

        ThemeManager.init();
        NotificationManager.init();
        App.initNavigation();
        App.initSettings();
        App.initMobileMenu();

        TasksManager.init();
        TeamManager.init();
        ChatManager.init();
        CalendarManager.init();
        ReportsManager.init();
        AdminPanel.init();

        if (typeof AuditManager !== 'undefined') AuditManager.init();
        if (typeof FinanceManager !== 'undefined') FinanceManager.init();
        
        // Initialize New Modules
        if (typeof ProjectsManager !== 'undefined') ProjectsManager.init();
        if (typeof ClientsManager !== 'undefined') ClientsManager.init();
        if (typeof InventoryManager !== 'undefined') InventoryManager.init();
        if (typeof WikiManager !== 'undefined') WikiManager.init();

        App.startDashboardClock();
        App.updateDashboardStats();
        setTimeout(App.checkUpcomingEvents, 1500);

        // Apply role-based UI
        AuthManager.applyRoleUI();

        // Populate profile section on load
        AuthManager.updateUserUI();

        if (typeof SupportManager !== 'undefined') SupportManager.init();

        // Cross-tab real-time sync for LocalStorage
        window.addEventListener('storage', (e) => {
            if (!e.key || e.key === 'users' || e.key === 'team') {
                if (typeof TeamManager !== 'undefined') TeamManager.render();
                if (typeof ChatManager !== 'undefined') ChatManager.loadUsers();
                if (typeof AdminPanel !== 'undefined') AdminPanel.refresh();
            }
            if (!e.key || e.key === 'tasks') {
                if (typeof TasksManager !== 'undefined') TasksManager.render();
                App.updateDashboardStats();
            }
        });

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('[PWA] Service Worker Registered'))
                .catch(err => console.error('[PWA] Registration Failed', err));
        }
    },

    initNavigation: () => {
        const navItems  = document.querySelectorAll('.nav-item');
        const sections  = document.querySelectorAll('.view-section');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                navItems.forEach(n => n.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                item.classList.add('active');
                const target = item.getAttribute('data-target');
                const section = document.getElementById(target);
                if (section) section.classList.add('active');

                // Toggle edge-to-edge mode for chat
                const contentWrapper = document.querySelector('.content-wrapper');
                if (contentWrapper) {
                    if (target === 'chat-section') {
                        contentWrapper.style.padding = '0';
                        contentWrapper.style.overflow = 'hidden';
                    } else {
                        contentWrapper.style.padding = '';
                        contentWrapper.style.overflow = '';
                    }
                }

                // Section-specific refresh
                if (target === 'calendar')   CalendarManager.render();
                if (target === 'dashboard')  App.updateDashboardStats();
                if (target === 'chat-section') {
                    ChatManager.render();
                    // Re-reveal UI if a chat was already selected
                    if (ChatManager.currentReceiverId) {
                        const h = document.querySelector('.chat-main-header');
                        const inp = document.querySelector('.chat-input-wrapper');
                        if (h) { h.style.opacity='1'; h.style.pointerEvents='auto'; }
                        if (inp) { inp.style.opacity='1'; inp.style.pointerEvents='auto'; }
                    }
                }
                if (target === 'team')       TeamManager.render();
                if (target === 'audit')      { if (typeof AuditManager !== 'undefined') AuditManager.render(); }
                if (target === 'profile')    AuthManager.updateUserUI();
                if (target === 'admin-panel') { 
                    AdminPanel.refresh();
                    if (typeof SupportManager !== 'undefined') SupportManager.render();
                    if (typeof AuditManager !== 'undefined') AuditManager.render();
                }
                if (target === 'support')    { if (typeof SupportManager !== 'undefined') SupportManager.render(); }
                if (target === 'drive')      { if (typeof DriveManager !== 'undefined') DriveManager.render(); }
                if (target === 'projects')   { if (typeof ProjectsManager !== 'undefined') ProjectsManager.render(); }
                if (target === 'clients')    { if (typeof ClientsManager !== 'undefined') ClientsManager.render(); }
                if (target === 'inventory')  { if (typeof InventoryManager !== 'undefined') InventoryManager.render(); }
                if (target === 'wiki')       { if (typeof WikiManager !== 'undefined') WikiManager.render(); }
                if (target === 'finance')    { if (typeof FinanceManager !== 'undefined') { FinanceManager.renderExpenses(); FinanceManager.renderDebts(); } }

                // ── AI Widget: hide in chat to avoid button conflicts ──
                const aiWidget = document.getElementById('ai-assistant-widget');
                const toggleBtn = document.getElementById('ai-toggle-btn');
                if (aiWidget) {
                    const hiddenSections = ['chat-section'];
                    if (hiddenSections.includes(target)) {
                        // Slide out then hide
                        if (toggleBtn) {
                            toggleBtn.style.transform = 'scale(0) rotate(45deg)';
                            toggleBtn.style.opacity = '0';
                        }
                        // Also close chat window if open
                        const chatWin = document.getElementById('ai-chat-window');
                        if (chatWin) chatWin.style.display = 'none';
                        setTimeout(() => { aiWidget.style.pointerEvents = 'none'; }, 300);
                    } else {
                        // Slide back in
                        aiWidget.style.pointerEvents = 'auto';
                        if (toggleBtn) {
                            toggleBtn.style.transform = 'scale(1) rotate(0deg)';
                            toggleBtn.style.opacity = '1';
                        }
                    }
                }

                // Close mobile sidebar
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('open');
                }
            });
        });
    },

    initMobileMenu: () => {
        const toggle  = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (!toggle || !sidebar) return;

        toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    },

    initSettings: () => {
        // Language - delegate to LangManager
        document.getElementById('setting-lang')?.addEventListener('change', (e) => {
            if (typeof LangManager !== 'undefined') {
                LangManager.currentLang = e.target.value;
                localStorage.setItem('al_raed_lang', e.target.value);
                LangManager.applyLanguage();
            }
        });

        // Theme - delegate to ThemeManager
        document.getElementById('setting-theme')?.addEventListener('change', (e) => {
            if (typeof ThemeManager !== 'undefined') ThemeManager.apply(e.target.value);
        });

        // Profile save
        document.getElementById('btn-save-profile')?.addEventListener('click', AuthManager.saveProfile);

        // Password change
        document.getElementById('btn-save-pass')?.addEventListener('click', AuthManager.changePassword);

        // Global: close all modals via .close-modal / .cancel-modal buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal') || e.target.closest('.cancel-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            }
            // Click outside modal content closes it
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });

        // ESC key closes top-most open modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) openModal.classList.add('hidden');
            }
        });

        // Logout buttons (there can be multiple)
        document.querySelectorAll('[id="btn-logout"]').forEach(btn => {
            btn.addEventListener('click', AuthManager.logout);
        });
    },

    updateDashboardStats: () => {
        const tasks  = Store.get('tasks') || [];
        const team   = Store.get('team')  || [];
        const events = Store.get('events')|| [];

        const activeTasks = tasks.filter(t => t.status !== 'done').length;
        const doneTasks   = tasks.filter(t => t.status === 'done').length;
        const totalTasks  = tasks.length;
        const progress    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        const todayStr = new Date().toISOString().slice(0, 10);
        const upcoming = events.filter(e => e.date >= todayStr).length + tasks.filter(t => t.deadline >= todayStr && t.status !== 'done').length;

        // AI Briefing
        const briefingCard = document.getElementById('ai-briefing-card');
        const briefingText = document.getElementById('ai-briefing-text');
        if (briefingCard && briefingText) {
            briefingCard.style.display = 'block';
            const isAr = document.documentElement.dir === 'rtl';
            
            let msg = "";
            if (isAr) {
                msg = `يا مدير، عندك <b>${activeTasks}</b> ${LangManager.t('open tasks currently')}. `;
                if (upcoming > 0) msg += `وفي <b>${upcoming}</b> ${LangManager.t('items need your attention today/tomorrow')}. `;
                if (progress > 50) msg += LangManager.t('Great job! You finished more than half the work') + ` 🚀`;
                else msg += LangManager.t('Let us get to work and finish what we have') + ` 💪`;
            } else {
                msg = `Director, you have <b>${activeTasks}</b> open tasks. `;
                if (upcoming > 0) msg += `And <b>${upcoming}</b> items need your attention soon. `;
                if (progress > 50) msg += `Great job! You've finished more than half. 🚀`;
                else msg += `Let's get to work! 💪`;
            }
            briefingText.innerHTML = msg;
        }

        if (document.getElementById('stat-tasks'))  document.getElementById('stat-tasks').textContent  = activeTasks;
        if (document.getElementById('stat-team'))   document.getElementById('stat-team').textContent   = team.length;
        if (document.getElementById('stat-events')) document.getElementById('stat-events').textContent = upcoming;

        const todoTasks = tasks.filter(t => t.status === 'todo').length;
        const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;

        // Render Chart
        const ctx = document.getElementById('tasks-chart');
        if (ctx && typeof Chart !== 'undefined') {
            if (window.tasksChartInstance) {
                window.tasksChartInstance.destroy();
            }
            window.tasksChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['To Do', 'In Progress', 'Done'],
                    datasets: [{
                        data: [todoTasks, inProgressTasks, doneTasks],
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: 'var(--text-secondary)' } }
                    },
                    cutout: '70%'
                }
            });
        }

        // Recent activity from audit logs
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            const logs = (Store.get('auditLogs') || []).slice(0, 5);
            const iconMap = {
                'Created Task': 'fa-plus-circle', 'Deleted Task': 'fa-trash',
                'Updated Task': 'fa-edit', 'Added Team Member': 'fa-user-plus',
                'Removed Team Member': 'fa-user-minus', 'Role Changed': 'fa-shield-alt',
                'Profile Updated': 'fa-user-edit', 'User Registered': 'fa-user-check',
                'Password Changed': 'fa-key', 'Sent group message': 'fa-comment',
                'Created Calendar Event': 'fa-calendar-plus',
            };
            activityList.innerHTML = logs.length === 0
                ? '<li style="color:var(--text-secondary);text-align:center;padding:1rem;">No recent activity</li>'
                : logs.map(log => `
                    <li>
                        <div class="activity-icon"><i class="fas ${iconMap[log.action] || 'fa-circle'}"></i></div>
                        <div class="activity-details">
                            <p><strong>${log.userName}</strong> ${log.action.toLowerCase()}: <em>${log.target || ''}</em></p>
                            <span class="activity-time">${new Date(log.timestamp).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                    </li>
                `).join('');
        }
    },

    checkUpcomingEvents: () => {
        const tasks  = Store.get('tasks')  || [];
        const events = Store.get('events') || [];
        const todayStr    = new Date().toISOString().slice(0,10);
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0,10);

        const combined = [
            ...tasks.map(t => ({ title: t.title, date: t.deadline })),
            ...events.map(e => ({ title: e.title, date: e.date }))
        ];

        const todayItems    = combined.filter(i => i.date === todayStr);
        const tomorrowItems = combined.filter(i => i.date === tomorrowStr);

        if (todayItems.length > 0) {
            NotificationManager.add(`🗓️ You have ${todayItems.length} item(s) due TODAY!`, 'fa-calendar-day', 'event');
        }
        if (tomorrowItems.length > 0) {
            NotificationManager.add(`⏰ You have ${tomorrowItems.length} item(s) due TOMORROW.`, 'fa-calendar-alt', 'event');
        }
    },

    // ── Invoice PDF Generation (Professional HTML Print) ──────
    exportToInvoice: (data) => {
        const win = window.open('', '_blank');
        const now = new Date().toLocaleDateString('ar-EG');
        const html = `
            <html dir="rtl">
            <head>
                <title>فاتورة - الرائد</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: 800; color: #2563eb; }
                    .details { margin: 40px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; text-align: right; padding: 12px; border: 1px solid #e2e8f0; }
                    td { padding: 12px; border: 1px solid #e2e8f0; }
                    .total { margin-top: 30px; text-align: left; font-size: 20px; font-weight: 700; color: #2563eb; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">الرائد - منصة الإدارة الذكية</div>
                    <div>تاريخ الفاتورة: ${now}</div>
                </div>
                <div class="details">
                    <h3>بيان مالي لـ: ${data.person || 'عميل خارجي'}</h3>
                    <p>الوصف: ${data.desc || 'لا يوجد وصف'}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>البند</th>
                            <th>المبلغ</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${data.desc}</td>
                            <td>$${data.amount}</td>
                            <td>${data.status}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="total">الإجمالي: $${data.amount}</div>
                <div style="margin-top: 50px; text-align: center;" class="no-print">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer;">طباعة الفاتورة</button>
                </div>
            </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
    },

    startDashboardClock: () => {
        const update = () => {
            const now = new Date();
            const timeEl = document.getElementById('widget-time');
            const dateEl = document.getElementById('widget-date');
            const greetingEl = document.getElementById('greeting-text');

            if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

            if (greetingEl) {
                const hour = now.getHours();
                let greetKey = "Hello, Director";
                if (hour < 12) greetKey = "Good morning, Director";
                else if (hour < 18) greetKey = "Good afternoon, Director";
                else greetKey = "Good evening, Director";
                
                greetingEl.textContent = LangManager.t(greetKey) + (document.documentElement.dir === 'rtl' ? '!' : '!');
            }
        };
        update();
        setInterval(update, 60000); // Update every minute
        App.initSearch();
    },

    initSearch: () => {
        const searchInput = document.querySelector('.search-bar input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                // If on specific views, reset their filters
                const activeView = document.querySelector('.view-section.active').id;
                if (activeView === 'tasks') TasksManager.render();
                if (activeView === 'team') TeamManager.render();
                return;
            }

            // Simple global search across Tasks and Team
            if (document.getElementById('tasks').classList.contains('active')) {
                TasksManager.filterTasks(query);
            } else if (document.getElementById('team').classList.contains('active')) {
                TeamManager.filterTeam(query);
            } else if (document.getElementById('chat-section').classList.contains('active')) {
                ChatManager.filterSidebar(query);
            }
        });
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    // App starts ONLY after successful auth (called from auth.js login)
    // AuthManager.init() calls App.init() after login
});
