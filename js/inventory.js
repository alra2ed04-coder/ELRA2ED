/**
 * Inventory Manager
 */
const InventoryManager = {
    items: [],

    init: () => {
        InventoryManager.load();
        const btnAdd = document.getElementById('btn-add-inventory');
        if (btnAdd) btnAdd.onclick = () => InventoryManager.openModal();
        
        const btnSave = document.getElementById('save-inventory');
        if (btnSave) btnSave.onclick = () => InventoryManager.saveItem();
    },

    load: () => {
        const stored = localStorage.getItem('inventory');
        if (stored) {
            InventoryManager.items = JSON.parse(stored);
        } else {
            InventoryManager.items = [
                { id: 1, name: 'لابتوب ديل XPS', category: 'Hardware', stock: 5, status: 'In Stock' },
                { id: 2, name: 'كراسي مكتبية هيدروليك', category: 'Furniture', stock: 12, status: 'In Stock' },
                { id: 3, name: 'طابعة ليزر HP', category: 'Hardware', stock: 2, status: 'Low Stock' }
            ];
            InventoryManager.saveToStorage();
        }
        InventoryManager.render();
    },

    saveToStorage: () => {
        localStorage.setItem('inventory', JSON.stringify(InventoryManager.items));
    },

    render: () => {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        grid.innerHTML = InventoryManager.items.map(item => `
            <div class="inventory-card glass-effect">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem;">
                    <div>
                        <h3 style="font-size:1rem;">${item.name}</h3>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">${item.category}</p>
                    </div>
                    <span class="priority-badge ${item.stock > 3 ? 'priority-low' : 'priority-high'}">${LangManager.t(item.stock > 3 ? 'In Stock' : 'Low Stock')}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:1.2rem; font-weight:700;">${item.stock} <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">${LangManager.t('Unit')}</span></div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-icon" style="background:var(--bg-primary);" onclick="InventoryManager.updateStock(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                        <button class="btn-icon" style="background:var(--bg-primary);" onclick="InventoryManager.updateStock(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                        <button class="btn-icon" style="color:var(--danger); margin-left:10px;" onclick="InventoryManager.deleteItem(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        const stats = document.getElementById('inventory-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="stat-card glass-effect">
                    <div class="stat-icon primary"><i class="fas fa-boxes"></i></div>
                    <div class="stat-info"><h3>${InventoryManager.items.length}</h3><p data-original="Total Items">${LangManager.t('Total Items')}</p></div>
                </div>
                <div class="stat-card glass-effect">
                    <div class="stat-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="stat-info"><h3>${InventoryManager.items.filter(i=>i.stock <= 3).length}</h3><p data-original="Low Stock">${LangManager.t('Low Stock')}</p></div>
                </div>
            `;
        }
    },

    openModal: () => {
        document.getElementById('inventory-name').value = '';
        document.getElementById('inventory-category').value = 'Hardware';
        document.getElementById('inventory-stock').value = '1';
        document.getElementById('inventory-modal').classList.remove('hidden');
    },

    saveItem: () => {
        const name = document.getElementById('inventory-name').value.trim();
        const category = document.getElementById('inventory-category').value;
        const stock = parseInt(document.getElementById('inventory-stock').value) || 0;

        if (!name) return alert('برجاء إدخال اسم القطعة');

        const newItem = {
            id: Date.now(),
            name: name,
            category: category,
            stock: stock,
            status: stock > 3 ? 'In Stock' : 'Low Stock'
        };

        InventoryManager.items.push(newItem);
        InventoryManager.saveToStorage();
        InventoryManager.render();
        document.getElementById('inventory-modal').classList.add('hidden');
    },

    updateStock: (id, change) => {
        const item = InventoryManager.items.find(i => i.id === id);
        if (item) {
            item.stock = Math.max(0, item.stock + change);
            item.status = item.stock > 3 ? 'In Stock' : 'Low Stock';
            InventoryManager.saveToStorage();
            InventoryManager.render();
        }
    },

    deleteItem: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه القطعة؟')) return;
        InventoryManager.items = InventoryManager.items.filter(i => i.id !== id);
        InventoryManager.saveToStorage();
        InventoryManager.render();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (typeof App !== 'undefined') InventoryManager.init();
});
