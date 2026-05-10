/**
 * Projects Manager - Handles project grouping, stats, and rendering
 */
const ProjectsManager = {
    projects: [],

    init: () => {
        ProjectsManager.load();
        const btnAdd = document.getElementById('btn-add-project');
        if (btnAdd) btnAdd.onclick = () => ProjectsManager.openModal();
        
        const btnSave = document.getElementById('save-project');
        if (btnSave) btnSave.onclick = () => ProjectsManager.saveProject();

        window.addEventListener('storeUpdated', (e) => {
            if (e.detail.key === 'projects') {
                ProjectsManager.load();
            }
        });
    },

    load: () => {
        const stored = Store.get('projects');
        if (stored) {
            ProjectsManager.projects = stored;
        } else {
            ProjectsManager.projects = [];
            ProjectsManager.saveToStorage();
        }
        ProjectsManager.render();
    },

    saveToStorage: () => {
        Store.set('projects', ProjectsManager.projects);
    },

    render: () => {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;
        
        grid.innerHTML = ProjectsManager.projects.map(p => `
            <div class="project-card glass-effect">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem;">
                    <h3 style="font-size:1.1rem;">${p.name}</h3>
                    <span class="priority-badge ${p.status === 'Completed' ? 'priority-low' : 'priority-medium'}">${LangManager.t(p.status)}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${p.progress}%"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
                    <span>إنجاز: ${p.progress}%</span>
                    <span>${p.tasks || 0} مهمة</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <i class="fas fa-users" style="color:var(--primary-color)"></i>
                        <span style="font-size:0.8rem;">${p.team || 0} أعضاء</span>
                    </div>
                    <button class="btn-icon" style="color:var(--danger)" onclick="ProjectsManager.deleteProject(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        const stats = document.getElementById('projects-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="stat-card glass-effect">
                    <div class="stat-icon primary"><i class="fas fa-project-diagram"></i></div>
                    <div class="stat-info"><h3>${ProjectsManager.projects.length}</h3><p data-original="Total Projects">${LangManager.t('Total Projects')}</p></div>
                </div>
                <div class="stat-card glass-effect">
                    <div class="stat-icon success"><i class="fas fa-check-double"></i></div>
                    <div class="stat-info"><h3>${ProjectsManager.projects.filter(p=>p.status==='Completed' || p.progress===100).length}</h3><p data-original="Completed">${LangManager.t('Completed')}</p></div>
                </div>
            `;
        }
    },

    openModal: () => {
        document.getElementById('project-name').value = '';
        document.getElementById('project-progress').value = '0';
        document.getElementById('project-status').value = 'Planning';
        document.getElementById('project-modal').classList.remove('hidden');
    },

    saveProject: () => {
        const name = document.getElementById('project-name').value.trim();
        const progress = parseInt(document.getElementById('project-progress').value) || 0;
        const status = document.getElementById('project-status').value;

        if (!name) return alert('برجاء إدخال اسم المشروع');

        const newProject = {
            id: Date.now(),
            name: name,
            progress: progress,
            status: status,
            tasks: 0,
            team: 1
        };

        ProjectsManager.projects.push(newProject);
        ProjectsManager.saveToStorage();
        ProjectsManager.render();
        document.getElementById('project-modal').classList.add('hidden');
        if (typeof NotificationManager !== 'undefined') NotificationManager.add(`تم إضافة مشروع جديد: ${name}`, 'fa-project-diagram', 'success');
    },

    deleteProject: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
        ProjectsManager.projects = ProjectsManager.projects.filter(p => p.id !== id);
        ProjectsManager.saveToStorage();
        ProjectsManager.render();
    }
};

window.ProjectsManager = ProjectsManager;
