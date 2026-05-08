/**
 * Al-Raed Platform - Global Command Palette
 * Triggered by Ctrl+K or clicking the search bar.
 */
const CommandPalette = {
    isOpen: false,
    results: [],

    init: () => {
        // Global Keyboard Shortcut
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                CommandPalette.toggle();
            }
            if (e.key === 'Escape' && CommandPalette.isOpen) {
                CommandPalette.close();
            }
        });

        // Close on overlay click
        const overlay = document.getElementById('command-palette-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) CommandPalette.close();
            };
        }

        // Search Input Logic
        const input = document.getElementById('command-search-input');
        if (input) {
            input.oninput = (e) => CommandPalette.search(e.target.value);
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const firstResult = document.querySelector('.command-result-item.active');
                    if (firstResult) firstResult.click();
                }
            };
        }
    },

    toggle: () => {
        if (CommandPalette.isOpen) CommandPalette.close();
        else CommandPalette.open();
    },

    open: () => {
        const modal = document.getElementById('command-palette-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        CommandPalette.isOpen = true;
        const input = document.getElementById('command-search-input');
        input.value = '';
        input.focus();
        CommandPalette.search(''); // Load default actions
    },

    close: () => {
        const modal = document.getElementById('command-palette-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        CommandPalette.isOpen = false;
    },

    search: (query) => {
        const q = query.toLowerCase().trim();
        const results = [];

        // 1. Static Navigation Commands
        const navActions = [
            { id: 'nav-dash', title: 'Go to Dashboard', icon: 'fa-home', action: () => App.navigateTo('dashboard') },
            { id: 'nav-tasks', title: 'Manage Tasks', icon: 'fa-tasks', action: () => App.navigateTo('tasks') },
            { id: 'nav-finance', title: 'Finance & Accounts', icon: 'fa-wallet', action: () => App.navigateTo('finance') },
            { id: 'nav-team', title: 'Team Directory', icon: 'fa-users', action: () => App.navigateTo('team') },
            { id: 'cmd-backup', title: 'Download System Backup', icon: 'fa-download', action: () => QuickActions.downloadBackup() }
        ];

        navActions.forEach(a => {
            if (a.title.toLowerCase().includes(q)) results.push(a);
        });

        // 2. Dynamic Search (Tasks)
        const tasks = Store.get('tasks') || [];
        tasks.slice(0, 5).forEach(t => {
            if (t.title.toLowerCase().includes(q)) {
                results.push({
                    id: 'task-' + t.id,
                    title: `Task: ${t.title}`,
                    icon: 'fa-check-circle',
                    action: () => { App.navigateTo('tasks'); /* Focus task logic */ }
                });
            }
        });

        // 3. Dynamic Search (Clients)
        const clients = Store.get('clients') || [];
        clients.slice(0, 5).forEach(c => {
            if (c.name.toLowerCase().includes(q)) {
                results.push({
                    id: 'client-' + c.id,
                    title: `Client: ${c.name}`,
                    icon: 'fa-user',
                    action: () => App.navigateTo('clients')
                });
            }
        });

        CommandPalette.render(results);
    },

    render: (results) => {
        const list = document.getElementById('command-results-list');
        if (!list) return;

        if (results.length === 0) {
            list.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-secondary);">No results found for your search.</div>`;
            return;
        }

        list.innerHTML = results.map((r, index) => `
            <div class="command-result-item ${index === 0 ? 'active' : ''}" onclick="CommandPalette.execute('${r.id}')" id="cmd-res-${r.id}">
                <i class="fas ${r.icon}"></i>
                <span>${r.title}</span>
                <kbd>Enter</kbd>
            </div>
        `).join('');

        // Store current results for execution
        CommandPalette.currentResults = results;
    },

    execute: (id) => {
        const item = CommandPalette.currentResults.find(r => r.id === id);
        if (item) {
            item.action();
            CommandPalette.close();
        }
    }
};

window.CommandPalette = CommandPalette;
