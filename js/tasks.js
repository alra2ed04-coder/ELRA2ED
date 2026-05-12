// Tasks Management
const TasksManager = {
    init: () => {
        TasksManager.render();
        TasksManager.bindEvents();
    },

    bindEvents: () => {
        const btnAdd = document.getElementById('btn-add-task');
        const modal = document.getElementById('task-modal');
        if (!modal || !btnAdd) {
            console.warn('TasksManager: Required DOM elements (btn-add-task or task-modal) not found.');
            return;
        }
        const btnClose = modal.querySelector('.close-modal');
        const btnCancel = modal.querySelector('.cancel-modal');

        const openModal = () => {
            document.getElementById('task-id').value = '';
            document.getElementById('task-title').value = '';
            document.getElementById('task-desc').value = '';
            document.getElementById('task-priority').value = 'medium';
            document.getElementById('task-status').value = 'todo';
            document.getElementById('task-deadline').value = '';
            document.getElementById('task-attachment').value = '';
            document.getElementById('task-modal-title').textContent = 'New Task';
            TasksManager.currentSubtasks = [];
            TasksManager.renderSubtasksEditor();
            modal.classList.remove('hidden');
        };

        const closeModal = () => modal.classList.add('hidden');
        if (btnAdd) btnAdd.addEventListener('click', openModal);
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (btnCancel) btnCancel.addEventListener('click', closeModal);

        const btnAddSubtask = document.getElementById('btn-add-subtask');
        if (btnAddSubtask) {
            btnAddSubtask.addEventListener('click', () => {
                const input = document.getElementById('new-subtask-input');
                if (!input) return;
                const title = input.value.trim();
                if(title) {
                    TasksManager.currentSubtasks.push({ title, done: false });
                    input.value = '';
                    TasksManager.renderSubtasksEditor();
                }
            });
        }
        const btnSave = document.getElementById('save-task');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const idEl = document.getElementById('task-id');
                const titleEl = document.getElementById('task-title');
                if (!titleEl) return;
                
                const id = idEl ? idEl.value : '';
                const title = titleEl.value.trim();
                if(!title) return alert('Title is required!');

                const task = {
                    id: id || Date.now().toString(),
                    title: title,
                    desc: document.getElementById('task-desc')?.value || '',
                    priority: document.getElementById('task-priority')?.value || 'medium',
                    status: document.getElementById('task-status')?.value || 'todo',
                    deadline: document.getElementById('task-deadline')?.value || '',
                    attachment: document.getElementById('task-attachment')?.value || '',
                    subtasks: TasksManager.currentSubtasks || [],
                    timeSpent: parseInt(document.getElementById('task-time')?.dataset.time || 0) || 0,
                    isRunning: false
                };

                const tasks = Store.get('tasks') || [];
                if(id) {
                    const index = tasks.findIndex(t => t.id === id);
                    if(index > -1) tasks[index] = task;
                } else {
                    tasks.push(task);
                }

                Store.set('tasks', tasks);
                closeModal();
                TasksManager.render();
                if(typeof App !== 'undefined') App.updateDashboardStats();
            });
        }


        // Setup drop zones once
        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('dragover', e => {
                e.preventDefault();
                list.style.background = 'rgba(0,0,0,0.05)';
            });
            list.addEventListener('dragleave', e => {
                list.style.background = 'transparent';
            });
            list.addEventListener('drop', e => {
                e.preventDefault();
                list.style.background = 'transparent';
                const id = e.dataTransfer.getData('text/plain');
                if(id) {
                    const newStatus = list.dataset.status;
                    TasksManager.updateTaskStatus(id, newStatus);
                }
            });
        });
    },

    currentSubtasks: [],
    timerIntervals: {},

    renderSubtasksEditor: () => {
        const container = document.getElementById('subtasks-container');
        if (!container) return;
        container.innerHTML = '';
        TasksManager.currentSubtasks.forEach((st, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.background = 'var(--bg-secondary)';
            div.style.padding = '0.5rem';
            div.style.borderRadius = 'var(--radius-sm)';
            div.innerHTML = `
                <span style="text-decoration: ${st.done ? 'line-through' : 'none'}">${st.title}</span>
                <div>
                    <button type="button" class="btn btn-icon" onclick="TasksManager.toggleSubtaskEditor(${idx})" style="color: ${st.done ? 'var(--success)' : 'var(--text-secondary)'}"><i class="fas fa-check-circle"></i></button>
                    <button type="button" class="btn btn-icon" onclick="TasksManager.removeSubtaskEditor(${idx})" style="color: var(--danger)"><i class="fas fa-trash"></i></button>
                </div>
            `;
            container.appendChild(div);
        });
    },

    toggleSubtaskEditor: (idx) => {
        TasksManager.currentSubtasks[idx].done = !TasksManager.currentSubtasks[idx].done;
        TasksManager.renderSubtasksEditor();
    },

    removeSubtaskEditor: (idx) => {
        TasksManager.currentSubtasks.splice(idx, 1);
        TasksManager.renderSubtasksEditor();
    },

    formatTime: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    },

    toggleTimer: (id) => {
        let tasks = Store.get('tasks') || [];
        const task = tasks.find(t => t.id === id);
        if(!task) return;

        task.isRunning = !task.isRunning;
        if(task.isRunning) {
            task.lastStarted = Date.now();
        } else {
            const elapsed = Math.floor((Date.now() - (task.lastStarted || Date.now())) / 1000);
            task.timeSpent = (task.timeSpent || 0) + elapsed;
        }
        Store.set('tasks', tasks);
        TasksManager.render();
    },

    toggleSubtaskInCard: (taskId, subtaskIdx) => {
        let tasks = Store.get('tasks') || [];
        const task = tasks.find(t => t.id === taskId);
        if(task && task.subtasks && task.subtasks[subtaskIdx]) {
            task.subtasks[subtaskIdx].done = !task.subtasks[subtaskIdx].done;
            Store.set('tasks', tasks);
            TasksManager.render();
        }
    },

    render: () => {
        const tasks = Store.get('tasks') || [];
        
        const todoList = document.getElementById('todo-list');
        const inprogressList = document.getElementById('inprogress-list');
        const doneList = document.getElementById('done-list');
        
        todoList.innerHTML = '';
        inprogressList.innerHTML = '';
        doneList.innerHTML = '';

        let counts = { todo: 0, inprogress: 0, done: 0 };

        tasks.forEach(task => {
            counts[task.status] = (counts[task.status] || 0) + 1;
            
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.dataset.id = task.id;
            
            card.innerHTML = `
                <h4>${task.title}</h4>
                <p>${task.desc || (typeof LangManager !== 'undefined' ? LangManager.t('No description') : 'No description')}</p>
                
                ${task.subtasks && task.subtasks.length > 0 ? `
                <div style="margin: 0.5rem 0; font-size: 0.85rem;">
                    <strong>${typeof LangManager !== 'undefined' ? LangManager.t('Sub-tasks') : 'Sub-tasks'}:</strong>
                    ${task.subtasks.map((st, i) => `
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem;">
                            <input type="checkbox" ${st.done ? 'checked' : ''} onclick="TasksManager.toggleSubtaskInCard('${task.id}', ${i})">
                            <span style="text-decoration: ${st.done ? 'line-through' : 'none'}">${st.title}</span>
                        </div>
                    `).join('')}
                </div>` : ''}

                ${task.attachment ? `
                <div style="margin: 0.5rem 0; font-size: 0.85rem;">
                    <a href="${task.attachment}" target="_blank" style="color: var(--primary-color);"><i class="fas fa-link"></i> ${typeof LangManager !== 'undefined' ? LangManager.t('View Attachment') : 'View Attachment'}</a>
                </div>` : ''}

                <div style="margin: 0.5rem 0; font-size: 0.85rem; display:flex; align-items:center; gap:0.5rem;">
                    <i class="fas fa-stopwatch"></i> ${TasksManager.formatTime(task.timeSpent || 0)}
                    <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="TasksManager.toggleTimer('${task.id}')">
                        ${task.isRunning ? `<i class="fas fa-pause text-danger"></i> ${typeof LangManager !== 'undefined' ? LangManager.t('Stop') : 'Stop'}` : `<i class="fas fa-play text-success"></i> ${typeof LangManager !== 'undefined' ? LangManager.t('Start') : 'Start'}`}
                    </button>
                </div>

                <div class="task-meta" style="margin-top: 0.5rem;">
                    <span class="priority-badge priority-${task.priority}">${typeof LangManager !== 'undefined' ? LangManager.t(task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) : task.priority}</span>
                    <div class="task-actions">
                        <button class="edit-task" onclick="TasksManager.editTask('${task.id}')"><i class="fas fa-edit"></i></button>
                        <button class="delete-task" onclick="TasksManager.deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                ${task.deadline ? `<div style="margin-top:0.5rem;font-size:0.75rem;color:var(--text-secondary)"><i class="far fa-clock"></i> ${task.deadline}</div>` : ''}
            `;

            if(task.status === 'todo') todoList.appendChild(card);
            else if(task.status === 'inprogress') inprogressList.appendChild(card);
            else doneList.appendChild(card);

            // Drag events
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
                setTimeout(() => card.style.opacity = '0.5', 0);
            });
            card.addEventListener('dragend', () => card.style.opacity = '1');
        });

        document.getElementById('count-todo').textContent = counts.todo;
        document.getElementById('count-inprogress').textContent = counts.inprogress;
        document.getElementById('count-done').textContent = counts.done;
    },

    editTask: (id) => {
        const tasks = Store.get('tasks');
        const task = tasks.find(t => t.id === id);
        if(!task) return;

        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.desc;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-deadline').value = task.deadline || '';
        document.getElementById('task-attachment').value = task.attachment || '';
        
        TasksManager.currentSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
        TasksManager.renderSubtasksEditor();

        document.getElementById('task-modal-title').textContent = 'Edit Task';
        document.getElementById('task-modal').classList.remove('hidden');
    },

    deleteTask: (id) => {
        if(confirm('Are you sure you want to delete this task?')) {
            let tasks = Store.get('tasks');
            tasks = tasks.filter(t => t.id !== id);
            Store.set('tasks', tasks);
            TasksManager.render();
            if(typeof App !== 'undefined') App.updateDashboardStats();
        }
    },

    updateTaskStatus: (id, status) => {
        let tasks = Store.get('tasks');
        const index = tasks.findIndex(t => t.id === id);
        if(index > -1) {
            tasks[index].status = status;
            Store.set('tasks', tasks);
            TasksManager.render();
            if(typeof App !== 'undefined') App.updateDashboardStats();
            
            if (status === 'done') {
                TasksManager.celebrate();
                NotificationManager.add(`🎉 Task Completed: ${tasks[index].title}`, 'fa-trophy', 'task');
            }
        }
    },

    celebrate: () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        function fire(particleRatio, opts) {
            if (typeof confetti === 'undefined') return;
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    },

    filterTasks: (query) => {
        const tasks = Store.get('tasks') || [];
        const filtered = tasks.filter(t => 
            t.title.toLowerCase().includes(query) || 
            (t.desc && t.desc.toLowerCase().includes(query))
        );
        
        // Re-render only filtered tasks
        const todoList = document.getElementById('todo-list');
        const inprogressList = document.getElementById('inprogress-list');
        const doneList = document.getElementById('done-list');
        
        todoList.innerHTML = '';
        inprogressList.innerHTML = '';
        doneList.innerHTML = '';

        filtered.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.dataset.id = task.id;
            
            card.innerHTML = `
                <h4>${task.title}</h4>
                <p>${task.desc || (typeof LangManager !== 'undefined' ? LangManager.t('No description') : 'No description')}</p>
                <div class="task-meta" style="margin-top: 0.5rem;">
                    <span class="priority-badge priority-${task.priority}">${typeof LangManager !== 'undefined' ? LangManager.t(task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) : task.priority}</span>
                    <div class="task-actions">
                        <button class="edit-task" onclick="TasksManager.editTask('${task.id}')"><i class="fas fa-edit"></i></button>
                        <button class="delete-task" onclick="TasksManager.deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;

            if(task.status === 'todo') todoList.appendChild(card);
            else if(task.status === 'inprogress') inprogressList.appendChild(card);
            else doneList.appendChild(card);
        });
    }
};
