/**
 * Al-Raed SaaS Platform - Theme Manager
 * Handles Dark/Light mode with icon update.
 */
const ThemeManager = {
    init: () => {
        const saved = localStorage.getItem('al_raed_theme') || 'dark';
        ThemeManager.apply(saved);

        // Legacy toggle (checkbox)
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.checked = saved === 'dark';
            toggle.addEventListener('change', (e) => {
                ThemeManager.apply(e.target.checked ? 'dark' : 'light');
            });
        }

        // Setting select
        const settingTheme = document.getElementById('setting-theme');
        if (settingTheme) {
            settingTheme.value = saved;
            settingTheme.addEventListener('change', (e) => {
                ThemeManager.apply(e.target.value);
            });
        }
    },

    apply: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('al_raed_theme', theme);

        // Update topbar button icon
        const btn = document.getElementById('topbar-theme-toggle');
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';

        // Sync setting-theme select
        const sel = document.getElementById('setting-theme');
        if (sel && sel.value !== theme) sel.value = theme;

        // Sync checkbox
        const cb = document.getElementById('theme-toggle');
        if (cb) cb.checked = theme === 'dark';
    },

    toggle: () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        ThemeManager.apply(current === 'dark' ? 'light' : 'dark');
    }
};

window.ThemeManager = ThemeManager;
