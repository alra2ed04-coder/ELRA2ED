/**
 * Al-Raed Platform - Quick Actions Controller
 * Handles global shortcuts and platform backup functionality.
 */
const QuickActions = {
    init: () => {
        console.log('QuickActions: Initialized.');
    },

    // 1. Navigation & Modal Helpers
    openTask: () => {
        App.navigateTo('tasks');
        setTimeout(() => {
            if (typeof TasksManager !== 'undefined') TasksManager.showModal();
        }, 100);
    },

    openProject: () => {
        App.navigateTo('projects');
        setTimeout(() => {
            if (typeof ProjectsManager !== 'undefined') ProjectsManager.openModal();
        }, 100);
    },

    openExpense: () => {
        if (typeof FinanceManager !== 'undefined') {
            App.navigateTo('finance');
            setTimeout(() => {
                FinanceManager.openModal('expense');
            }, 100);
        }
    },

    openClient: () => {
        App.navigateTo('clients');
        setTimeout(() => {
            if (typeof ClientsManager !== 'undefined') ClientsManager.openModal();
        }, 100);
    },

    openTicket: () => {
        if (typeof SupportManager !== 'undefined') {
            SupportManager.showNewTicketModal();
        }
    },

    // 2. Platform Backup (JSON Export)
    downloadBackup: () => {
        try {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            
            a.href = url;
            a.download = `Al-Raed-Backup-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.add('تم تحميل النسخة الاحتياطية بنجاح 💾', 'fa-save', 'success');
            }
        } catch (e) {
            console.error('Backup failed:', e);
            alert('حدث خطأ أثناء تحميل النسخة الاحتياطية');
        }
    }
};

window.QuickActions = QuickActions;
