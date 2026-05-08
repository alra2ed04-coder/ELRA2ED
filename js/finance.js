/**
 * Finance Manager - Handles Expenses and Debts for Al-Raed Platform
 */

const FinanceManager = {
    init: () => {
        FinanceManager.renderExpenses();
        FinanceManager.renderDebts();

        // Close modal buttons
        document.querySelectorAll('#finance-modal .close-modal, #finance-modal .cancel-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('finance-modal').classList.add('hidden');
            });
        });

        // Save Button
        document.getElementById('save-finance-entry')?.addEventListener('click', FinanceManager.saveEntry);
    },

    switchTab: (tabId) => {
        const expensesTab = document.getElementById('finance-expenses');
        const debtsTab = document.getElementById('finance-debts');
        
        if (tabId === 'expenses') {
            expensesTab.style.display = 'block';
            expensesTab.classList.remove('hidden');
            debtsTab.style.display = 'none';
            debtsTab.classList.add('hidden');
            
            document.getElementById('tab-expenses').className = 'btn btn-primary';
            document.getElementById('tab-debts').className = 'btn btn-outline';
        } else {
            debtsTab.style.display = 'block';
            debtsTab.classList.remove('hidden');
            expensesTab.style.display = 'none';
            expensesTab.classList.add('hidden');
            
            document.getElementById('tab-debts').className = 'btn btn-primary';
            document.getElementById('tab-expenses').className = 'btn btn-outline';
            
            FinanceManager.renderDebts();
        }
    },

    openModal: (type, id = null) => {
        document.getElementById('finance-entry-type').value = type;
        const modal = document.getElementById('finance-modal');
        const titleEl = document.getElementById('finance-modal-title');
        
        // Form fields
        const descEl = document.getElementById('finance-desc');
        const amtEl = document.getElementById('finance-amount');
        const dateEl = document.getElementById('finance-date');
        const catEl = document.getElementById('finance-category');
        const personEl = document.getElementById('finance-person-group'); 
        const personInput = document.getElementById('finance-person');
        const statusEl = document.getElementById('finance-status-group'); 
        const statusInput = document.getElementById('finance-status');
        const dueEl = document.getElementById('finance-due-group');
        const dueInput = document.getElementById('finance-due-date');

        descEl.value = '';
        amtEl.value = '';
        if (catEl) catEl.value = 'General';
        dateEl.value = new Date().toISOString().split('T')[0];
        personInput.value = '';
        statusInput.value = 'Unpaid';
        dueInput.value = '';
        document.getElementById('finance-entry-id').value = '';

        if (type === 'expense') {
            titleEl.textContent = typeof LangManager !== 'undefined' ? LangManager.t('Add Expense') : 'Add Expense';
            personEl.style.display = 'none';
            statusEl.style.display = 'none';
            dueEl.style.display = 'none';
        } else {
            titleEl.textContent = typeof LangManager !== 'undefined' ? LangManager.t('Add Debt') : 'Add Debt';
            personEl.style.display = 'block';
            statusEl.style.display = 'block';
            dueEl.style.display = 'block';
        }

        modal.classList.remove('hidden');
    },

    saveEntry: () => {
        const type = document.getElementById('finance-entry-type').value;
        const id = document.getElementById('finance-entry-id').value;
        const desc = document.getElementById('finance-desc').value.trim();
        const amt = parseFloat(document.getElementById('finance-amount').value);
        const date = document.getElementById('finance-date').value;
        const category = document.getElementById('finance-category')?.value || 'General';
        const person = document.getElementById('finance-person').value.trim();
        const status = document.getElementById('finance-status').value;
        const dueDate = document.getElementById('finance-due-date').value;

        if (!desc || isNaN(amt) || !date) {
            alert('Please fill out all required fields.');
            return;
        }

        if (type === 'debt' && !person) {
            alert('Please specify the debtor/creditor.');
            return;
        }

        const newEntry = {
            id: id || 'fin_' + Date.now().toString(36),
            type: type,
            description: desc,
            category: category,
            amount: amt,
            date: date,
            dueDate: type === 'debt' ? dueDate : null,
            person: type === 'debt' ? person : null,
            status: type === 'debt' ? status : null,
            createdAt: new Date().toISOString()
        };

        let records = Store.get('finance') || [];
        if (id) {
            const idx = records.findIndex(r => r.id === id);
            if (idx > -1) records[idx] = newEntry;
        } else {
            records.push(newEntry);
        }

        Store.set('finance', records);
        document.getElementById('finance-modal').classList.add('hidden');

        if (type === 'expense') FinanceManager.renderExpenses();
        else FinanceManager.renderDebts();
        
        if (typeof LangManager !== 'undefined') LangManager.applyTranslations();
    },

    deleteEntry: (id, type) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        let records = Store.get('finance') || [];
        Store.set('finance', records.filter(r => r.id !== id));
        
        if (type === 'expense') FinanceManager.renderExpenses();
        else FinanceManager.renderDebts();
    },

    toggleDebtStatus: (id) => {
        let records = Store.get('finance') || [];
        const idx = records.findIndex(r => r.id === id);
        if (idx > -1) {
            records[idx].status = records[idx].status === 'Paid' ? 'Unpaid' : 'Paid';
            Store.set('finance', records);
            FinanceManager.renderDebts();
            if (typeof LangManager !== 'undefined') LangManager.applyTranslations();
        }
    },

    renderExpenses: () => {
        const records = Store.get('finance') || [];
        const expenses = records.filter(r => r.type === 'expense').sort((a,b) => new Date(b.date) - new Date(a.date));
        const list = document.getElementById('finance-expenses-list');
        if(!list) return;

        const categoryIcons = {
            'Salaries': '💰',
            'Rent': '🏠',
            'Utilities': '⚡',
            'Marketing': '📢',
            'Supplies': '📦',
            'Software': '💻',
            'Travel': '✈️',
            'General': '📝',
            'Other': '🔹'
        };

        let total = 0;
        list.innerHTML = expenses.map(e => {
            total += parseFloat(e.amount);
            const icon = categoryIcons[e.category] || '📝';
            return `
                <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s;">
                    <td style="padding:1rem;">${new Date(e.date).toLocaleDateString()}</td>
                    <td style="padding:1rem;">
                        <span class="priority-badge" style="background:rgba(37,99,235,0.1);color:var(--primary-color);font-size:0.75rem;padding:4px 10px;">
                            ${icon} ${typeof LangManager !== 'undefined' ? LangManager.t(e.category) : e.category}
                        </span>
                    </td>
                    <td style="padding:1rem;font-weight:500;">${e.description}</td>
                    <td style="padding:1rem;font-weight:700;color:var(--danger);">$${parseFloat(e.amount).toLocaleString()}</td>
                    <td style="padding:1rem;">
                        <div style="display:flex;gap:0.5rem;">
                            <button onclick="App.exportToInvoice({person: 'Expense', desc: '${e.description}', amount: ${e.amount}, status: 'Paid'})" class="btn btn-icon" title="Invoice"><i class="fas fa-file-invoice"></i></button>
                            <button onclick="FinanceManager.deleteEntry('${e.id}', 'expense')" class="btn btn-icon" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if(expenses.length === 0) list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary);opacity:0.6;"><i class="fas fa-receipt" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i> No expenses recorded</td></tr>';

        document.getElementById('finance-total-expenses').textContent = '$' + total.toLocaleString();
    },

    renderDebts: () => {
        const records = Store.get('finance') || [];
        const debts = records.filter(r => r.type === 'debt').sort((a,b) => new Date(b.date) - new Date(a.date));
        const list = document.getElementById('finance-debts-list');
        if(!list) return;

        let totalUnpaid = 0;
        let totalPaid = 0;

        list.innerHTML = debts.map(d => {
            const isPaid = d.status === 'Paid';
            if (isPaid) totalPaid += parseFloat(d.amount);
            else totalUnpaid += parseFloat(d.amount);

            const statusColor = isPaid ? 'var(--success)' : '#f59e0b';
            const statusBg = isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)';
            
            const dueWarning = (!isPaid && d.dueDate && new Date(d.dueDate) < new Date()) ? 'color:var(--danger);font-weight:bold;' : '';

            return `
                <tr style="border-bottom:1px solid var(--border-color);opacity:${isPaid ? '0.7' : '1'}">
                    <td style="padding:1rem;">${new Date(d.date).toLocaleDateString()}</td>
                    <td style="padding:1rem;">
                        <div style="font-weight:700;">${d.person}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">${d.description}</div>
                    </td>
                    <td style="padding:1rem;font-weight:700;">$${parseFloat(d.amount).toLocaleString()}</td>
                    <td style="padding:1rem;${dueWarning}">${d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '-'}</td>
                    <td style="padding:1rem;">
                        <span style="background:${statusBg};color:${statusColor};padding:6px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" onclick="FinanceManager.toggleDebtStatus('${d.id}')">
                            <i class="fas ${isPaid ? 'fa-check-circle' : 'fa-clock'}"></i>
                            <span data-original="${d.status}">${typeof LangManager !== 'undefined' ? LangManager.t(d.status) : d.status}</span>
                        </span>
                    </td>
                    <td style="padding:1rem;">
                        <div style="display:flex;gap:0.5rem;">
                            <button onclick="App.exportToInvoice({person: '${d.person}', desc: '${d.description}', amount: ${d.amount}, status: '${d.status}'})" class="btn btn-icon" title="Invoice"><i class="fas fa-file-invoice"></i></button>
                            <button onclick="FinanceManager.deleteEntry('${d.id}', 'debt')" class="btn btn-icon" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if(debts.length === 0) list.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary);opacity:0.6;"><i class="fas fa-hand-holding-usd" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i> No debts recorded</td></tr>';

        document.getElementById('finance-total-debts').textContent = '$' + totalUnpaid.toLocaleString();
        document.getElementById('finance-paid-debts').textContent = '$' + totalPaid.toLocaleString();
    }
};
