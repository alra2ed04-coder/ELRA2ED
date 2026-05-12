/**
 * Al-Raed AI Core System - نواة الذكاء الاصطناعي
 * NLU + Platform Awareness + Analytics + Action Engine
 */
const AICore = {

    // ─── NLU: Normalize Arabic text ───────────────────────────────────────
    normalize: (t) => t.toLowerCase()
        .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
        .replace(/[^\u0600-\u06FFa-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(),

    // ─── Intent Detection ────────────────────────────────────────────────
    detectIntent: (raw) => {
        const t = AICore.normalize(raw);
        const match = (patterns) => patterns.some(p => t.includes(p) || new RegExp(p).test(t));

        // Navigation
        if (match(['المهام','مهمه','مهام','task','شغل','اعمال','عمل']))          return {intent:'nav_tasks'};
        if (match(['مشروع','مشاريع','project']))                                  return {intent:'nav_projects'};
        if (match(['فريق','موظف','اعضاء','team','member']))                       return {intent:'nav_team'};
        if (match(['محادث','رسال','شات','chat','message','ابعت']))               return {intent:'nav_chat'};
        if (match(['تقويم','اجتماع','موعد','calendar','meeting','schedule']))    return {intent:'nav_calendar'};
        if (match(['مصاريف','حسابات','ماليه','finance','money','مالي']))         return {intent:'nav_finance'};
        if (match(['تقرير','report','احصاء','احصائيات']))                        return {intent:'nav_reports'};
        if (match(['معرفه','ويكي','wiki','knowledge']))                          return {intent:'nav_wiki'};
        if (match(['ملف','درايف','drive','cloud']))                              return {intent:'nav_drive'};

        // Create actions
        if (match(['اضف مهمه','مهمه جديده','اعمل مهمه','add task','new task','ضيف مهمة'])) return {intent:'create_task'};
        if (match(['اضف مشروع','مشروع جديد','new project']))                    return {intent:'create_project'};
        if (match(['سجل مصروف','اضف مصروف','add expense','مصروف جديد']))       return {intent:'create_expense'};
        if (match(['اضف موعد','اجتماع جديد','حجز موعد','new meeting']))         return {intent:'create_event'};

        // Analytics & Awareness
        if (match(['مين شغال','مين نشط','مين اونلاين','who is online','who active','داخل دلوقتي'])) return {intent:'who_online'};
        if (match(['مين متاخر','متاخرين','overdue','who late']))                return {intent:'who_overdue'};
        if (match(['كام مهمه','عدد المهام','how many task','ملخص المهام']))     return {intent:'tasks_summary'};
        if (match(['حاله المشروع','ايه المشاريع','project status']))            return {intent:'projects_status'};
        if (match(['ادا الفريق','تقييم الفريق','team performance']))            return {intent:'team_performance'};
        if (match(['ايه اللي حاصل','النظام','الوضع','dashboard','status','ظبط الدنيا'])) return {intent:'platform_status'};
        if (match(['اجتماعات','مواعيد اليوم','today meeting','عندي كام'])) return {intent:'today_schedule'};
        if (match(['مهام متاخره','deadlines','المتاخر','ناقص'])) return {intent:'overdue_tasks'};
        if (match(['تقرير الاداء','تحليل','analytics','performance report']))   return {intent:'analytics_report'};
        if (match(['ضغط العمل','workload','مشغول']))                            return {intent:'workload'};

        // Commands
        if (match(['ابعت للكل','send all','broadcast','ابعت رسالة']))           return {intent:'broadcast_msg'};
        if (match(['رتب','نظم','organize','arrange']))                           return {intent:'organize'};
        if (match(['تابع','follow up','متابعه']))                               return {intent:'followup'};
        if (match(['اعمل اللي ناقص','كمل','اكمل المهام']))                     return {intent:'complete_pending'};

        // Greetings
        if (match(['اهلا','مرحبا','صباح','مساء','hi','hello','hey']))          return {intent:'greeting'};
        if (match(['مين انا','اسمي','who am i']))                              return {intent:'who_am_i'};
        if (match(['شكرا','thanks','ممتاز','برافو']))                          return {intent:'thanks'};
        if (match(['مساعده','help','ايه تقدر','قدراتك']))                      return {intent:'help'};

        return {intent:'unknown', raw};
    },

    // ─── Platform Awareness ───────────────────────────────────────────────
    awareness: {
        snapshot: () => {
            const tasks    = Store.get('tasks') || [];
            const team     = Store.get('team') || [];
            const projects = Store.get('projects') || [];
            const events   = Store.get('events') || [];
            const finance  = Store.get('finance') || [];
            const onlineIds = Store._onlineUsers || [];
            const today = new Date().toISOString().split('T')[0];

            const overdue = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < today);
            const doneToday = tasks.filter(t => t.status === 'done' && (t.updatedAt||'').startsWith(today));
            const todayEvents = events.filter(e => e.date === today);
            const activeTeam = team.filter(m => onlineIds.includes(m.id));
            const unpaidDebts = finance.filter(f => f.type === 'debt' && f.status === 'Unpaid');
            const activeProjects = projects.filter(p => p.status !== 'completed');

            return { tasks, team, projects, events, finance, onlineIds, today,
                     overdue, doneToday, todayEvents, activeTeam, unpaidDebts, activeProjects };
        },

        workload: () => {
            const { tasks, team } = AICore.awareness.snapshot();
            return team.map(m => ({
                name: m.name,
                count: tasks.filter(t => t.assignee === m.id && t.status !== 'done').length
            })).sort((a,b) => b.count - a.count);
        },

        teamPerformance: () => {
            const { tasks, team } = AICore.awareness.snapshot();
            return team.map(m => {
                const mine = tasks.filter(t => t.assignee === m.id);
                const done = mine.filter(t => t.status === 'done').length;
                const rate = mine.length ? Math.round(done/mine.length*100) : 0;
                return { name: m.name, total: mine.length, done, rate };
            }).sort((a,b) => b.rate - a.rate);
        }
    },

    // ─── Action Executors ─────────────────────────────────────────────────
    actions: {
        createTask: (data) => {
            const tasks = Store.get('tasks') || [];
            const me = AuthManager.currentUser;
            const task = {
                id: 'task_' + Date.now(),
                title: data.title || 'مهمة جديدة',
                description: data.desc || '',
                status: 'todo',
                priority: data.priority || 'medium',
                assignee: data.assignee || me?.id,
                createdBy: me?.id,
                createdAt: new Date().toISOString(),
                deadline: data.deadline || ''
            };
            tasks.unshift(task);
            Store.set('tasks', tasks);
            if (typeof TasksManager !== 'undefined') TasksManager.render();
            if (typeof App !== 'undefined') App.updateDashboardStats();
            return task;
        },

        createProject: (data) => {
            const projects = Store.get('projects') || [];
            const me = AuthManager.currentUser;
            const proj = {
                id: 'proj_' + Date.now(),
                name: data.name || 'مشروع جديد',
                description: data.desc || '',
                status: 'active',
                createdBy: me?.id,
                createdAt: new Date().toISOString()
            };
            projects.unshift(proj);
            Store.set('projects', projects);
            if (typeof ProjectsManager !== 'undefined') ProjectsManager.render();
            return proj;
        },

        createEvent: (data) => {
            const events = Store.get('events') || [];
            const today = new Date().toISOString().split('T')[0];
            const ev = {
                id: 'ev_' + Date.now(),
                title: data.title || 'اجتماع',
                date: data.date || today,
                time: data.time || '10:00',
                description: data.desc || '',
                createdAt: new Date().toISOString()
            };
            events.unshift(ev);
            Store.set('events', events);
            if (typeof CalendarManager !== 'undefined') CalendarManager.render();
            return ev;
        },

        createExpense: (data) => {
            const finance = Store.get('finance') || [];
            const today = new Date().toISOString().split('T')[0];
            const exp = {
                id: 'fin_' + Date.now(),
                type: 'expense',
                amount: data.amount || 0,
                description: data.desc || '',
                category: data.category || 'عام',
                date: today
            };
            finance.unshift(exp);
            Store.set('finance', finance);
            if (typeof FinanceManager !== 'undefined') FinanceManager.renderExpenses();
            return exp;
        },

        sendBroadcast: (msg) => {
            const team = Store.get('team') || [];
            const me = AuthManager.currentUser;
            if (!me) return;
            team.filter(m => m.id !== me.id).forEach(m => {
                const key = `pm_${[me.id, m.id].sort().join('_')}`;
                const msgs = Store.get(key) || [];
                msgs.push({
                    id: 'msg_' + Date.now() + '_' + m.id,
                    senderId: me.id, senderName: me.name,
                    content: msg, timestamp: new Date().toISOString()
                });
                Store.set(key, msgs);
            });
            if (typeof NotificationManager !== 'undefined')
                NotificationManager.add('تم إرسال الرسالة للفريق', 'fa-paper-plane', 'ai');
        }
    },

    // ─── Response Generator ───────────────────────────────────────────────
    buildResponse: (intent, snap) => {
        const me = AuthManager.currentUser;
        const name = me?.name?.split(' ')[0] || 'مدير';

        switch(intent) {
            case 'greeting':
                return { text: `أهلاً بك يا ${name}! 👋 أنا الرائد، مساعدك الذكي. الآن عندي اطلاع كامل على المنصة — ${snap.tasks.length} مهمة، ${snap.activeProjects.length} مشروع نشط، ${snap.activeTeam.length} عضو أونلاين. كيف أخدمك؟`, chips: ['حالة المنصة','المهام المتأخرة','أداء الفريق','مهمة جديدة'] };
            case 'who_am_i':
                return { text: `أنت الباشا <b>${me?.name}</b> 👑 — صلاحياتك: <b>${me?.role}</b>` };
            case 'thanks':
                return { text: `على الرحب والسعة يا ${name}! 🌟 دايماً في خدمتك.` };
            case 'help':
                return { text: `قادر أساعدك في:<br>📋 إضافة وإدارة المهام<br>📊 تحليل أداء الفريق<br>📅 إنشاء الاجتماعات<br>💬 إرسال رسائل للفريق<br>💰 تسجيل المصاريف<br>🔍 حالة المنصة الآن<br>Just speak naturally!`, chips: ['حالة المنصة','مهمة جديدة','أداء الفريق'] };
            case 'nav_tasks':
                if (typeof App !== 'undefined') App.navigateTo('tasks');
                return { text: `✅ فتحت قسم المهام. عندك <b>${snap.tasks.filter(t=>t.status!=='done').length}</b> مهمة نشطة و<b>${snap.overdue.length}</b> متأخرة.`, chips: ['مهمة جديدة','المهام المتأخرة'] };
            case 'nav_projects':
                if (typeof App !== 'undefined') App.navigateTo('projects');
                return { text: `📂 قسم المشاريع جاهز. عندك <b>${snap.activeProjects.length}</b> مشروع نشط.`, chips: ['مشروع جديد','حالة المشاريع'] };
            case 'nav_team':
                if (typeof App !== 'undefined') App.navigateTo('team');
                return { text: `👥 فريقك: <b>${snap.team.length}</b> عضو، منهم <b>${snap.activeTeam.length}</b> أونلاين الآن.` };
            case 'nav_chat':
                if (typeof App !== 'undefined') App.navigateTo('chat-section');
                return { text: `💬 فتحت المحادثات. تبعت رسالة لحد معين؟`, chips: ['ابعت للكل'] };
            case 'nav_calendar':
                if (typeof App !== 'undefined') App.navigateTo('calendar');
                return { text: `📅 التقويم جاهز. عندك <b>${snap.todayEvents.length}</b> موعد اليوم.`, chips: ['اجتماع جديد'] };
            case 'nav_finance':
                if (typeof App !== 'undefined') App.navigateTo('finance');
                return { text: `💰 قسم الحسابات. ديون غير محصلة: <b>${snap.unpaidDebts.length}</b>`, chips: ['سجل مصروف'] };
            case 'nav_reports':
                if (typeof App !== 'undefined') App.navigateTo('reports');
                return { text: `📊 قسم التقارير والتحليلات جاهز.` };
            case 'nav_wiki':
                if (typeof App !== 'undefined') App.navigateTo('wiki');
                return { text: `📚 قاعدة المعرفة مفتوحة.` };
            case 'nav_drive':
                if (typeof App !== 'undefined') App.navigateTo('drive');
                return { text: `☁️ السحابة جاهزة لرفع الملفات.` };
            case 'who_online': {
                if (!snap.activeTeam.length) return { text: `😴 مفيش أعضاء أونلاين دلوقتي.` };
                const names = snap.activeTeam.map(m=>`<b>${m.name}</b>`).join('، ');
                return { text: `🟢 الأعضاء النشطين الآن (${snap.activeTeam.length}): ${names}` };
            }
            case 'tasks_summary':
                return { text: `📋 ملخص المهام:<br>• المهام النشطة: <b>${snap.tasks.filter(t=>t.status!=='done').length}</b><br>• تم اليوم: <b>${snap.doneToday.length}</b><br>• متأخرة: <b>${snap.overdue.length}</b><br>• الإجمالي: <b>${snap.tasks.length}</b>`, chips: ['المهام المتأخرة','مهمة جديدة'] };
            case 'overdue_tasks':
            case 'who_overdue': {
                if (!snap.overdue.length) return { text: `✅ ممتاز! مفيش مهام متأخرة.` };
                const list = snap.overdue.slice(0,5).map(t=>`• <b>${t.title}</b> (${t.deadline})`).join('<br>');
                return { text: `⚠️ المهام المتأخرة (${snap.overdue.length}):<br>${list}` };
            }
            case 'projects_status': {
                if (!snap.activeProjects.length) return { text: `مفيش مشاريع نشطة حالياً.` };
                const list = snap.activeProjects.slice(0,5).map(p=>`• <b>${p.name}</b>`).join('<br>');
                return { text: `📁 المشاريع النشطة (${snap.activeProjects.length}):<br>${list}` };
            }
            case 'today_schedule': {
                if (!snap.todayEvents.length) return { text: `📅 مفيش اجتماعات أو مواعيد مجدولة اليوم.`, chips: ['اجتماع جديد'] };
                const list = snap.todayEvents.map(e=>`• <b>${e.title}</b> ${e.time||''}`).join('<br>');
                return { text: `📅 مواعيد اليوم (${snap.todayEvents.length}):<br>${list}` };
            }
            case 'team_performance': {
                const perf = AICore.awareness.teamPerformance();
                if (!perf.length) return { text: `لا يوجد بيانات أداء متاحة.` };
                const list = perf.slice(0,5).map(p=>`• <b>${p.name}</b>: ${p.rate}% إنجاز (${p.done}/${p.total})`).join('<br>');
                return { text: `📊 أداء الفريق:<br>${list}` };
            }
            case 'workload': {
                const wl = AICore.awareness.workload();
                const list = wl.slice(0,5).map(w=>`• <b>${w.name}</b>: ${w.count} مهمة`).join('<br>');
                return { text: `⚖️ توزيع ضغط العمل:<br>${list}` };
            }
            case 'platform_status': {
                const issues = [];
                if (snap.overdue.length) issues.push(`⚠️ ${snap.overdue.length} مهمة متأخرة`);
                if (snap.unpaidDebts.length) issues.push(`💰 ${snap.unpaidDebts.length} ديون غير محصلة`);
                const statusLine = issues.length ? issues.join(' — ') : '✅ كل شيء تمام';
                return { text: `🌐 حالة المنصة الآن:<br>• الفريق: <b>${snap.team.length}</b> عضو (<b>${snap.activeTeam.length}</b> أونلاين)<br>• المهام: <b>${snap.tasks.filter(t=>t.status!=='done').length}</b> نشطة<br>• المشاريع: <b>${snap.activeProjects.length}</b> جارية<br>• المواعيد اليوم: <b>${snap.todayEvents.length}</b><br>${statusLine}`, chips: ['أداء الفريق','المهام المتأخرة','ضغط العمل'] };
            }
            case 'analytics_report': {
                const perf = AICore.awareness.teamPerformance();
                const top = perf[0];
                return { text: `📈 تقرير الأداء التحليلي:<br>• إجمالي المهام: <b>${snap.tasks.length}</b><br>• نسبة الإنجاز: <b>${snap.tasks.length ? Math.round(snap.tasks.filter(t=>t.status==='done').length/snap.tasks.length*100) : 0}%</b><br>• أفضل أداء: <b>${top?.name || 'غير متاح'}</b> (${top?.rate || 0}%)<br>• مشاريع نشطة: <b>${snap.activeProjects.length}</b>` };
            }
            case 'create_task':
                return { text: `📝 تمام، ما هو <b>عنوان المهمة</b>؟`, wizard: {type:'task', step:1} };
            case 'create_project':
                return { text: `📁 تمام، ما هو <b>اسم المشروع</b>؟`, wizard: {type:'project', step:1} };
            case 'create_event':
                return { text: `📅 تمام، ما هو <b>عنوان الاجتماع</b>؟`, wizard: {type:'event', step:1} };
            case 'create_expense':
                return { text: `💰 تمام يا مدير، <b>المبلغ</b> كام؟`, wizard: {type:'expense', step:1} };
            case 'broadcast_msg':
                return { text: `📢 اكتب الرسالة اللي عايز تبعتها للفريق كله:`, wizard: {type:'broadcast', step:1} };
            case 'organize':
                return { text: `🗂️ حسناً! المهام مرتبة. اختار ما تريد تنظيمه:`, chips: ['رتب المهام حسب الأولوية','رتب المشاريع','رتب مواعيد اليوم'] };
            case 'followup': {
                const overdue = snap.overdue.slice(0,3);
                if (!overdue.length) return { text: `✅ كل المهام سارت بشكل ممتاز!` };
                return { text: `🔔 المتابعة مطلوبة على:<br>${overdue.map(t=>`• <b>${t.title}</b>`).join('<br>')}` };
            }
            case 'complete_pending': {
                const pending = snap.tasks.filter(t=>t.status==='todo').slice(0,3);
                if (!pending.length) return { text: `✅ مفيش مهام معلقة!` };
                return { text: `📋 المهام اللي محتاجة تنفيذ:<br>${pending.map(t=>`• <b>${t.title}</b>`).join('<br>')}`, chips: ['إضافة مهمة جديدة'] };
            }
            default:
                return { text: `فاهمك يا ${name} — دي أوامر أقدر أساعدك فيها:<br>📋 مهام • 📁 مشاريع • 👥 فريق • 📅 مواعيد • 💰 مالية • 📊 تقارير<br>بس قولي اللي محتاجه بطريقتك!`, chips: ['حالة المنصة','أداء الفريق','مهمة جديدة'] };
        }
    }
};

window.AICore = AICore;
