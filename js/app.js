/**
 * Al-Raed SaaS Platform - Main App Controller
 * Orchestrates all modules and manages navigation, settings, and dashboard.
 */
const App = {
    init: () => {
        if (App._initialized) return;
        App._initialized = true;
        // FORCE DB UPGRADE & CLEANUP FOR ADMIN EMAIL
        try {
            let users = Store.get('users') || [];

            // CLEANUP DUPLICATES by email — keep record with avatar, else keep first
            const emailSeenUsers = {};
            users = users.filter(u => {
                const e = u.email ? u.email.trim().toLowerCase() : u.id;
                if (emailSeenUsers[e]) return false;
                emailSeenUsers[e] = true;
                return true;
            });

            // Ensure admin email always has Super Admin role
            let updated = false;
            users.forEach(u => {
                if (u.email && u.email.trim().toLowerCase() === 'mod18hk@gmail.com' && u.role !== 'Super Admin') {
                    u.role = 'Super Admin';
                    updated = true;
                }
            });
            if (updated) Store.set('users', users);

            let team = Store.get('team') || [];

            // CLEANUP DUPLICATES in Team by email
            const emailSeenTeam = {};
            team = team.filter(t => {
                const e = t.email ? t.email.trim().toLowerCase() : t.id;
                if (emailSeenTeam[e]) return false;
                emailSeenTeam[e] = true;
                return true;
            });

            let tUpdated = false;
            team.forEach(t => {
                if (t.email && t.email.trim().toLowerCase() === 'mod18hk@gmail.com' && t.role !== 'Super Admin') {
                    t.role = 'Super Admin';
                    tUpdated = true;
                }
            });
            if (tUpdated) Store.set('team', team);

        } catch (e) { console.warn('App.init DB upgrade error:', e); }

        // ✅ Connect to real-time sync server FIRST
        Store.connectSync();

        ThemeManager.init();
        NotificationManager.init();
        App.initNavigation();
        App.initSettings();
        App.initMobileMenu();

        // ── Core Modules ──
        try { TasksManager.init(); } catch (e) { console.error('TasksManager init failed:', e); }
        try { TeamManager.init(); } catch (e) { console.error('TeamManager init failed:', e); }
        try { ChatManager.init(); } catch (e) { console.error('ChatManager init failed:', e); }
        try { CalendarManager.init(); } catch (e) { console.error('CalendarManager init failed:', e); }
        try { ReportsManager.init(); } catch (e) { console.error('ReportsManager init failed:', e); }
        try { AdminPanel.init(); } catch (e) { console.error('AdminPanel init failed:', e); }

        // ── Optional Modules ──
        try { if (typeof AuditManager !== 'undefined') AuditManager.init(); } catch (e) { console.error('AuditManager init failed:', e); }
        try { if (typeof FinanceManager !== 'undefined') FinanceManager.init(); } catch (e) { console.error('FinanceManager init failed:', e); }
        try { if (typeof SupportManager !== 'undefined') SupportManager.init(); } catch (e) { console.error('SupportManager init failed:', e); }
        try { if (typeof InventoryManager !== 'undefined') InventoryManager.init(); } catch (e) { console.error('InventoryManager init failed:', e); }
        try { if (typeof DriveManager !== 'undefined') DriveManager.init(); } catch (e) { console.error('DriveManager init failed:', e); }
        try { if (typeof ProjectsManager !== 'undefined') ProjectsManager.init(); } catch (e) { console.error('ProjectsManager init failed:', e); }
        try { if (typeof ClientsManager !== 'undefined') ClientsManager.init(); } catch (e) { console.error('ClientsManager init failed:', e); }
        try { if (typeof WikiManager !== 'undefined') WikiManager.init(); } catch (e) { console.error('WikiManager init failed:', e); }
        try { if (typeof CommandPalette !== 'undefined') CommandPalette.init(); } catch (e) { console.error('CommandPalette init failed:', e); }
        try { if (typeof AIAssistant !== 'undefined') AIAssistant.init(); } catch (e) { console.error('AIAssistant init failed:', e); }

        App.startDashboardClock();
        App.updateDashboardStats();
        setTimeout(App.updateDashboardStats, 2000); // Second pass to catch cloud sync
        setTimeout(App.checkUpcomingEvents, 1500);

        // Apply role-based UI
        AuthManager.applyRoleUI();

        // Populate profile section on load
        AuthManager.updateUserUI();

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

    navigateTo: (target) => {
        const navLink = document.querySelector(`.nav-item[data-target="${target}"]`);
        if (navLink) {
            navLink.click();
        } else {
            const sections = document.querySelectorAll('.view-section');
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(target);
            if (targetSection) targetSection.classList.add('active');
        }
    },

    initNavigation: () => {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.view-section');

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
                if (target === 'calendar') CalendarManager.render();
                if (target === 'dashboard') App.updateDashboardStats();
                if (target === 'chat-section') {
                    ChatManager.render();
                    // Re-reveal UI if a chat was already selected
                    if (ChatManager.currentReceiverId) {
                        const h = document.querySelector('.chat-main-header');
                        const inp = document.querySelector('.chat-input-wrapper');
                        if (h) { h.style.opacity = '1'; h.style.pointerEvents = 'auto'; }
                        if (inp) { inp.style.opacity = '1'; inp.style.pointerEvents = 'auto'; }
                    }
                }
                if (target === 'team') TeamManager.render();
                if (target === 'audit') { if (typeof AuditManager !== 'undefined') AuditManager.render(); }
                if (target === 'profile') AuthManager.updateUserUI();
                if (target === 'admin-panel') {
                    AdminPanel.refresh();
                    if (typeof SupportManager !== 'undefined') SupportManager.render();
                    if (typeof AuditManager !== 'undefined') AuditManager.render();
                }
                if (target === 'support') { if (typeof SupportManager !== 'undefined') SupportManager.render(); }
                if (target === 'drive') { if (typeof DriveManager !== 'undefined') DriveManager.render(); }
                if (target === 'projects') { if (typeof ProjectsManager !== 'undefined') ProjectsManager.render(); }
                if (target === 'clients') { if (typeof ClientsManager !== 'undefined') ClientsManager.render(); }
                if (target === 'inventory') { if (typeof InventoryManager !== 'undefined') InventoryManager.render(); }
                if (target === 'wiki') { if (typeof WikiManager !== 'undefined') WikiManager.render(); }
                if (target === 'finance') { if (typeof FinanceManager !== 'undefined') { FinanceManager.renderExpenses(); FinanceManager.renderDebts(); } }

                // ── AI Widget: hide in chat to avoid button conflicts ──
                const aiWidget = document.getElementById('ai-assistant-widget');
                if (aiWidget && aiWidget.style.display !== 'none') {
                    const hiddenSections = ['chat-section'];
                    const toggleBtn = document.getElementById('ai-toggle-btn');
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
        const toggle = document.getElementById('menu-toggle');
        const moreBtn = document.getElementById('mobile-more-btn');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const bottomNavItems = document.querySelectorAll('.mobile-nav-item');

        if (!sidebar) return;

        const openSidebar = () => {
            sidebar.classList.add('open');
            if (overlay) overlay.style.display = 'block';
        };

        const closeSidebar = () => {
            sidebar.classList.remove('open');
            if (overlay) overlay.style.display = 'none';
        };

        toggle?.addEventListener('click', () => {
            const isOpen = sidebar.classList.toggle('open');
            if (overlay) overlay.style.display = isOpen ? 'block' : 'none';
        });

        moreBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            openSidebar();
        });

        if (overlay) overlay.addEventListener('click', closeSidebar);

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !toggle?.contains(e.target) && !moreBtn?.contains(e.target)) {
                    closeSidebar();
                }
            }
        });

        // Bottom nav switching logic
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = item.getAttribute('data-target');
                if (target) {
                    bottomNavItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    // Sync with sidebar navigation
                    const sidebarLink = sidebar.querySelector(`.nav-item[data-target="${target}"]`);
                    if (sidebarLink) sidebarLink.click();
                    closeSidebar();
                }
            });
        });

        sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-target');
                if (target) {
                    bottomNavItems.forEach(i => {
                        i.classList.toggle('active', i.getAttribute('data-target') === target);
                    });
                }
                if (window.innerWidth <= 1024) closeSidebar();
            });
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
        const tasks = Store.get('tasks') || [];
        const team = Store.get('team') || [];
        const events = Store.get('events') || [];

        const activeTasks = tasks.filter(t => t.status !== 'done').length;
        const doneTasks = tasks.filter(t => t.status === 'done').length;
        const totalTasks = tasks.length;
        const todayStr = new Date().toISOString().slice(0, 10);
        const upcoming = events.filter(e => e.date >= todayStr).length + tasks.filter(t => t.deadline >= todayStr && t.status !== 'done').length;

        // AI Briefing
        const briefingCard = document.getElementById('ai-briefing-card');
        const briefingText = document.getElementById('ai-briefing-text');
        if (briefingCard && briefingText) {
            briefingCard.style.display = 'block';
            try {
                // Ensure BriefingAI is loaded and functioning
                if (typeof BriefingAI !== 'undefined') {
                    briefingText.innerHTML = BriefingAI.generate();
                } else {
                    briefingText.innerHTML = document.documentElement.dir === 'rtl' ? "جاري تجهيز الملخص..." : "Preparing insights...";
                }
            } catch (err) {
                console.error("AI Briefing Error:", err);
                briefingText.innerHTML = document.documentElement.dir === 'rtl' ? "المنصة جاهزة للعمل! 🚀" : "Platform is ready for work! 🚀";
            }
        }

        if (document.getElementById('stat-tasks')) document.getElementById('stat-tasks').textContent = activeTasks;
        if (document.getElementById('stat-team')) document.getElementById('stat-team').textContent = team.length;
        if (document.getElementById('stat-events')) document.getElementById('stat-events').textContent = upcoming;

        // Recent activity from audit logs
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            const logs = (Store.get('auditLogs') || []).slice(0, 8);
            const isAr = document.documentElement.dir === 'rtl';

            const iconMap = {
                'Created Task': 'fa-plus-circle', 'Deleted Task': 'fa-trash',
                'Updated Task': 'fa-edit', 'Added Team Member': 'fa-user-plus',
                'Removed Team Member': 'fa-user-minus', 'Role Changed': 'fa-shield-alt',
                'Profile Updated': 'fa-user-edit', 'User Registered': 'fa-user-check',
                'Password Changed': 'fa-key', 'Sent group message': 'fa-comment',
                'Created Calendar Event': 'fa-calendar-plus',
                'Added Project': 'fa-project-diagram', 'Deleted Project': 'fa-folder-minus',
                'Added Client': 'fa-user-tie', 'Added Inventory Item': 'fa-box'
            };

            const actionTranslations = {
                'Created Task': isAr ? 'أنشأ مهمة' : 'created a task',
                'Deleted Task': isAr ? 'حذف مهمة' : 'deleted a task',
                'Updated Task': isAr ? 'حدث مهمة' : 'updated a task',
                'Added Team Member': isAr ? 'أضاف عضواً جديداً' : 'added a team member',
                'Removed Team Member': isAr ? 'حذف عضواً من الفريق' : 'removed a team member',
                'Role Changed': isAr ? 'غير الرتبة' : 'changed role',
                'Profile Updated': isAr ? 'حدث الملف الشخصي' : 'updated profile',
                'User Registered': isAr ? 'سجل حساباً جديداً' : 'registered a new account',
                'Sent group message': isAr ? 'أرسل رسالة جماعية' : 'sent a group message',
                'Created Calendar Event': isAr ? 'أضاف موعداً جديداً' : 'created a calendar event',
                'Added Project': isAr ? 'بدأ مشروعاً جديداً' : 'started a new project',
                'Added Client': isAr ? 'أضاف عميلاً جديداً' : 'added a new client',
                'Added Inventory Item': isAr ? 'أضاف صنفاً للمخزن' : 'added an inventory item'
            };

            const colorMap = {
                'Created Task': '#3b82f6', 'Deleted Task': '#ef4444',
                'Added Team Member': '#10b981', 'Role Changed': '#8b5cf6',
                'Sent group message': '#6366f1'
            };

            activityList.innerHTML = logs.length === 0
                ? `<li style="color:var(--text-secondary);text-align:center;padding:2rem;"><i class="fas fa-history" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.2;"></i>${LangManager.t('No recent activity')}</li>`
                : logs.map(log => `
                    <li style="display:flex; gap:1rem; padding:1rem; border-bottom:1px solid var(--border-color); transition:var(--transition); border-radius:var(--radius-md);" onmouseenter="this.style.background='rgba(59,130,246,0.03)'" onmouseleave="this.style.background='transparent'">
                        <div class="activity-icon" style="width:36px; height:36px; border-radius:50%; background:${colorMap[log.action] || 'var(--bg-primary)'}20; color:${colorMap[log.action] || 'var(--text-secondary)'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <i class="fas ${iconMap[log.action] || 'fa-circle'}"></i>
                        </div>
                        <div class="activity-details" style="flex:1;">
                            <p style="margin:0; font-size:0.9rem;"><strong>${log.userName}</strong> ${actionTranslations[log.action] || log.action.toLowerCase()}${log.target ? ': <em style="color:var(--primary-color)">' + log.target + '</em>' : ''}</p>
                            <span class="activity-time" style="font-size:0.75rem; color:var(--text-secondary); opacity:0.7;">${new Date(log.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </li>
                `).join('');
        }

        // Financial Forecast Simulation (Dynamic AI Calculation)
        const forecastEl = document.getElementById('finance-forecast-chart');
        if (forecastEl) {
            const records = Store.get('finance') || [];
            const projects = Store.get('projects') || [];
            const tasks = Store.get('tasks') || [];
            const doneTasks = tasks.filter(t => t.status === 'done').length;
            const expenses = records.filter(r => r.type === 'expense');
            const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);

            let finalForecast = 0;
            if (totalExp > 0 || projects.length > 0 || tasks.length > 0) {
                const baseEst = totalExp > 0 ? (totalExp * 1.6) : 500;
                const projectEst = projects.length * 1200;
                finalForecast = Math.round(baseEst + projectEst);
            }

            const isAr = document.documentElement.dir === 'rtl';
            const currency = isAr ? 'جنيه' : '$';
            const growthRate = tasks.length > 0 ? (doneTasks / tasks.length * 40).toFixed(0) : 0;

            forecastEl.innerHTML = `
                <div style="text-align:center; width:100%;">
                    <div style="font-size:1.5rem; font-weight:800; color:var(--success); margin-bottom:0.5rem;">+${finalForecast.toLocaleString()} ${currency}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); opacity:0.8;">${LangManager.t('Growth forecast for next month')}: <span style="color:var(--success); font-weight:700;">+${growthRate > 0 ? growthRate : (finalForecast > 0 ? 5 : 0)}%</span></div>
                    <div style="margin-top:1.5rem; height:8px; background:rgba(0,0,0,0.05); border-radius:10px; overflow:hidden;">
                        <div style="width:${finalForecast > 0 ? Math.min(100, 20 + parseInt(growthRate)) : 0}%; height:100%; background:var(--success-gradient); border-radius:10px; transition: width 1s ease-out;"></div>
                    </div>
                    <p style="font-size:0.7rem; margin-top:0.5rem; color:var(--text-secondary);">${LangManager.t('Based on recent activity and current workload')}</p>
                </div>
            `;
        }
        App.renderTasksChart();
        App.renderFinanceTrendChart();
    },

    checkUpcomingEvents: () => {
        const tasks = Store.get('tasks') || [];
        const events = Store.get('events') || [];
        const todayStr = new Date().toISOString().slice(0, 10);
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

        const combined = [
            ...tasks.map(t => ({ title: t.title, date: t.deadline })),
            ...events.map(e => ({ title: e.title, date: e.date }))
        ];

        const todayItems = combined.filter(i => i.date === todayStr);
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

    renderTasksChart: () => {
        const ctx = document.getElementById('tasks-chart');
        if (!ctx) return;

        const tasks = Store.get('tasks') || [];
        const todo = tasks.filter(t => t.status === 'todo').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const done = tasks.filter(t => t.status === 'done').length;

        if (window.myTasksChart) window.myTasksChart.destroy();

        window.myTasksChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Completed'],
                datasets: [{
                    data: [todo, inProgress, done],
                    backgroundColor: ['#94a3b8', '#3b82f6', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: '600' } } }
                },
                cutout: '70%'
            }
        });
    },

    renderFinanceTrendChart: () => {
        const ctx = document.getElementById('finance-trend-chart');
        if (!ctx) return;

        const records = Store.get('finance') || [];
        const incomes = records.filter(r => r.type === 'income');
        const expenses = records.filter(r => r.type === 'expense');

        // Group by month (last 6 months)
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthLabel = d.toLocaleString('default', { month: 'short' });
            labels.push(monthLabel);

            const m = d.getMonth();
            const y = d.getFullYear();

            const monthIncomes = incomes.filter(r => {
                const rd = new Date(r.timestamp);
                return rd.getMonth() === m && rd.getFullYear() === y;
            }).reduce((sum, r) => sum + r.amount, 0);

            const monthExpenses = expenses.filter(r => {
                const rd = new Date(r.timestamp);
                return rd.getMonth() === m && rd.getFullYear() === y;
            }).reduce((sum, r) => sum + r.amount, 0);

            incomeData.push(monthIncomes);
            expenseData.push(monthExpenses);
        }

        if (window.myFinanceChart) window.myFinanceChart.destroy();

        window.myFinanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#94a3b8' } }
                },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    },

    initSearch: () => {
        // Obsolete: Search handled by Command Palette (Ctrl+K)
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    // App starts ONLY after successful auth (called from auth.js login)
    // AuthManager.init() calls App.init() after login
});
