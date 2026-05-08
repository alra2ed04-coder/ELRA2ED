/**
 * Al-Raed SaaS Platform - Audit Log Manager (Admin Only)
 */
const AuditManager = {
    init: () => {},

    render: () => {
        const tbody = document.getElementById('audit-list');
        if (!tbody) return;
        const logs = Store.get('auditLogs') || [];

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding:2rem;text-align:center;color:var(--text-secondary);">No audit logs yet.</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:0.875rem 1rem;font-size:0.8rem;color:var(--text-secondary);">${new Date(log.timestamp).toLocaleString()}</td>
                <td style="padding:0.875rem 1rem;font-weight:600;">${log.userName}</td>
                <td style="padding:0.875rem 1rem;">${log.action}</td>
                <td style="padding:0.875rem 1rem;color:var(--text-secondary);">${log.target || '-'}</td>
            </tr>
        `).join('');
    }
};

window.AuditManager = AuditManager;
