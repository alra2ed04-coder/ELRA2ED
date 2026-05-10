/**
 * CRM / Clients Manager
 */
const ClientsManager = {
    clients: [],

    init: () => {
        ClientsManager.load();
        const btnAdd = document.getElementById('btn-add-client');
        if (btnAdd) btnAdd.onclick = () => ClientsManager.openModal();
        
        const btnSave = document.getElementById('save-client');
        if (btnSave) btnSave.onclick = () => ClientsManager.saveClient();

        window.addEventListener('storeUpdated', (e) => {
            if (e.detail.key === 'clients') {
                ClientsManager.load();
            }
        });
    },

    load: () => {
        const stored = Store.get('clients');
        if (stored) {
            ClientsManager.clients = stored;
        } else {
            ClientsManager.clients = [];
            ClientsManager.saveToStorage();
        }
        ClientsManager.render();
    },

    saveToStorage: () => {
        Store.set('clients', ClientsManager.clients);
    },

    render: () => {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;

        tbody.innerHTML = ClientsManager.clients.map(c => `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:1rem;">
                    <div style="font-weight:600;">${c.name}</div>
                </td>
                <td style="padding:1rem;">
                    <div>${c.contact}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">${c.phone}</div>
                </td>
                <td style="padding:1rem;">
                    <span class="priority-badge ${c.status === 'Active' ? 'priority-low' : 'priority-medium'}">${c.status}</span>
                </td>
                <td style="padding:1rem; text-align:center;">${c.deals || 0}</td>
                <td style="padding:1rem;">
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-icon" style="color:var(--primary-color)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" style="color:var(--danger)" onclick="ClientsManager.deleteClient(${c.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    openModal: () => {
        document.getElementById('client-name').value = '';
        document.getElementById('client-contact').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-modal').classList.remove('hidden');
    },

    saveClient: () => {
        const name = document.getElementById('client-name').value.trim();
        const contact = document.getElementById('client-contact').value.trim();
        const phone = document.getElementById('client-phone').value.trim();

        if (!name) return alert('برجاء إدخال اسم العميل');

        const newClient = {
            id: Date.now(),
            name: name,
            contact: contact,
            phone: phone,
            status: 'Lead',
            deals: 0
        };

        ClientsManager.clients.push(newClient);
        ClientsManager.saveToStorage();
        ClientsManager.render();
        document.getElementById('client-modal').classList.add('hidden');
    },

    deleteClient: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
        ClientsManager.clients = ClientsManager.clients.filter(c => c.id !== id);
        ClientsManager.saveToStorage();
        ClientsManager.render();
    }
};

window.ClientsManager = ClientsManager;
