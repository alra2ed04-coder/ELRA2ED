/**
 * Al-Raed Platform - Intelligent Briefing Engine
 * Generates dynamic, context-aware reports for the dashboard.
 */
const BriefingAI = {
    generate: () => {
        const tasks = Store.get('tasks') || [];
        const events = Store.get('events') || [];
        const finance = Store.get('finance') || [];
        const inventory = Store.get('inventory') || [];
        const tickets = (Store.get('support_tickets') || []);
        
        const isAr = (typeof LangManager !== 'undefined' && LangManager.currentLang === 'ar');
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Priority 1: Today's Appointments
        const todaysEvents = events.filter(e => e.date === todayStr);
        if (todaysEvents.length > 0) {
            return isAr 
                ? `📅 عندك <b>${todaysEvents.length}</b> مواعيد مهمة النهاردة (أهمهم: ${todaysEvents[0].title}).`
                : `📅 You have <b>${todaysEvents.length}</b> appointments today (Next: ${todaysEvents[0].title}).`;
        }

        // Priority 2: Urgent Task Deadlines
        const upcomingDeadlines = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline === todayStr);
        if (upcomingDeadlines.length > 0) {
            return isAr 
                ? `⚠️ تنبيه: <b>${upcomingDeadlines.length}</b> مهام لازم تخلص النهاردة ضروري.`
                : `⚠️ Alert: <b>${upcomingDeadlines.length}</b> tasks are due today.`;
        }

        // Priority 3: Finance / Debts
        const unpaidDebts = finance.filter(r => r.type === 'debt' && r.status === 'Unpaid');
        if (unpaidDebts.length > 0) {
            const totalDebt = unpaidDebts.reduce((s, d) => s + d.amount, 0);
            return isAr 
                ? `💰 محتاجين نراجع تحصيل <b>${totalDebt.toLocaleString()} جنيه</b> مبالغ متأخرة.`
                : `💰 We need to collect <b>${totalDebt.toLocaleString()} $</b> in outstanding debts.`;
        }

        // Priority 4: Support Tickets
        const openTickets = tickets.filter(t => t.status !== 'Closed');
        if (openTickets.length > 0) {
            return isAr 
                ? `🎧 في <b>${openTickets.length}</b> تذاكر دعم فني مستنيين ردك.`
                : `🎧 <b>${openTickets.length}</b> support tickets are awaiting your response.`;
        }

        // Priority 5: Low Stock
        const lowStock = inventory.filter(i => i.stock <= 3);
        if (lowStock.length > 0) {
            return isAr 
                ? `📦 المخزون منخفض في <b>${lowStock.length}</b> أصناف (زي ${lowStock[0].name}).`
                : `📦 Stock is low on <b>${lowStock.length}</b> items (e.g. ${lowStock[0].name}).`;
        }

        // Default: Short Encouragement
        const encourages = isAr ? [
            "المنصة منظيفة وجاهزة للشغل! 🚀",
            "كل شيء تحت السيطرة، يومك سعيد.. ✨",
            "مفيش مهام متأخرة، أداء ممتاز! ✅",
            "الوضع مستقر، جاهز لعمل جديد؟ 📈"
        ] : [
            "Platform is ready for work! 🚀",
            "Everything is under control, have a great day.. ✨",
            "No pending tasks, excellent performance! ✅",
            "Status is stable, ready for new projects? 📈"
        ];
        return encourages[Math.floor(Math.random() * encourages.length)];
    }
};

window.BriefingAI = BriefingAI;

window.BriefingAI = BriefingAI;
