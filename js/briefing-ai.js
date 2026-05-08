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
        const projects = Store.get('projects') || [];
        
        const isAr = (typeof LangManager !== 'undefined' && LangManager.currentLang === 'ar');
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Priority: Today's Appointments
        const todaysEvents = events.filter(e => e.date === todayStr);
        if (todaysEvents.length > 0) {
            return isAr 
                ? `📅 عندك <b>${todaysEvents.length}</b> مواعيد مهمة النهاردة.`
                : `📅 You have <b>${todaysEvents.length}</b> events today.`;
        }

        // 2. Priority: Urgent Task Deadlines
        const upcomingDeadlines = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline === todayStr);
        if (upcomingDeadlines.length > 0) {
            return isAr 
                ? `⚠️ في <b>${upcomingDeadlines.length}</b> مهام لازم تخلص النهاردة.`
                : `⚠️ <b>${upcomingDeadlines.length}</b> tasks are due today.`;
        }

        // 3. Priority: Financial Alerts
        const unpaidDebts = finance.filter(r => r.type === 'debt' && r.status === 'Unpaid');
        if (unpaidDebts.length > 0) {
            const totalDebt = unpaidDebts.reduce((s, d) => s + d.amount, 0);
            return isAr 
                ? `💰 محتاجين نراجع تحصيل <b>${totalDebt.toLocaleString()} جنيه</b>.`
                : `💰 Need to collect <b>${totalDebt.toLocaleString()}</b> in debts.`;
        }

        // Default: Random Encouragement (Like in the image)
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
