/**
 * Al-Raed SaaS Platform - Full Calendar Manager
 * Supports: Add, Edit, Delete events. Visual calendar with tasks + events.
 */
const CalendarManager = {
    currentDate: new Date(),
    editingId: null,

    monthNames: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ],
    monthNamesAr: [
        'يناير','فبراير','مارس','أبريل','مايو','يونيو',
        'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
    ],

    init: () => {
        document.getElementById('prev-month')?.addEventListener('click', () => {
            CalendarManager.currentDate.setMonth(CalendarManager.currentDate.getMonth() - 1);
            CalendarManager.render();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            CalendarManager.currentDate.setMonth(CalendarManager.currentDate.getMonth() + 1);
            CalendarManager.render();
        });

        document.getElementById('btn-add-event')?.addEventListener('click', () => {
            CalendarManager.openModal();
        });

        document.getElementById('save-event')?.addEventListener('click', CalendarManager.saveEvent);

        // Close modal
        document.querySelectorAll('#event-modal .close-modal, #event-modal .cancel-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('event-modal').classList.add('hidden');
                CalendarManager.editingId = null;
            });
        });

        CalendarManager.render();
    },

    openModal: (event = null) => {
        const modal = document.getElementById('event-modal');
        const titleInput = document.getElementById('event-title');
        const dateInput  = document.getElementById('event-date');
        const timeInput  = document.getElementById('event-time');
        const descInput  = document.getElementById('event-desc');
        const heading    = modal?.querySelector('.modal-header h2');

        if (event) {
            CalendarManager.editingId = event.id;
            if (titleInput) titleInput.value = event.title || '';
            if (dateInput)  dateInput.value  = event.date  || '';
            if (timeInput)  timeInput.value  = event.time  || '';
            if (descInput)  descInput.value  = event.desc  || '';
            if (heading)    heading.innerHTML = '<i class="fas fa-edit" style="color:var(--primary-color)"></i> Edit Event';
        } else {
            CalendarManager.editingId = null;
            if (titleInput) titleInput.value = '';
            if (dateInput)  dateInput.value  = '';
            if (timeInput)  timeInput.value  = '';
            if (descInput)  descInput.value  = '';
            if (heading)    heading.innerHTML = '<i class="fas fa-calendar-plus" style="color:var(--primary-color)"></i> New Event';
        }

        modal?.classList.remove('hidden');
    },

    saveEvent: () => {
        const title = document.getElementById('event-title')?.value.trim();
        const date  = document.getElementById('event-date')?.value;
        const time  = document.getElementById('event-time')?.value || '';
        const desc  = document.getElementById('event-desc')?.value.trim() || '';

        if (!title || !date) {
            AuthManager.showToast('Please fill in the event title and date.', 'error');
            return;
        }

        let events = Store.get('events') || [];

        if (CalendarManager.editingId) {
            const idx = events.findIndex(e => e.id === CalendarManager.editingId);
            if (idx > -1) {
                events[idx] = { ...events[idx], title, date, time, desc };
                Store.log('Updated Calendar Event', title);
                AuthManager.showToast('✅ Event updated!');
            }
        } else {
            events.push({
                id: 'evt_' + Date.now(),
                title, date, time, desc,
                createdBy: AuthManager.currentUser?.name || 'Unknown',
                createdAt: new Date().toISOString()
            });
            Store.log('Created Calendar Event', title);
            NotificationManager.add(`📅 New event added: ${title}`, 'fa-calendar-plus', 'event');
            AuthManager.showToast('✅ Event added!');
        }

        Store.set('events', events);
        document.getElementById('event-modal').classList.add('hidden');
        CalendarManager.editingId = null;
        CalendarManager.render();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    },

    deleteEvent: (id) => {
        if (!confirm('Delete this event?')) return;
        let events = Store.get('events') || [];
        const evt = events.find(e => e.id === id);
        events = events.filter(e => e.id !== id);
        Store.set('events', events);
        if (evt) Store.log('Deleted Calendar Event', evt.title);
        CalendarManager.render();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    },

    render: () => {
        const year  = CalendarManager.currentDate.getFullYear();
        const month = CalendarManager.currentDate.getMonth();
        const isAr  = document.documentElement.dir === 'rtl';

        const monthLabel = isAr ? CalendarManager.monthNamesAr[month] : CalendarManager.monthNames[month];
        const monthYearEl = document.getElementById('month-year');
        if (monthYearEl) monthYearEl.textContent = `${monthLabel} ${year}`;

        const daysContainer = document.getElementById('calendar-days');
        if (!daysContainer) return;
        daysContainer.innerHTML = '';

        const tasks  = Store.get('tasks')  || [];
        const events = Store.get('events') || [];

        const firstDay   = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today      = new Date();

        // Empty prefix cells
        for (let i = 0; i < firstDay; i++) {
            daysContainer.innerHTML += '<div class="calendar-day empty"></div>';
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const mStr   = String(month + 1).padStart(2, '0');
            const dStr   = String(i).padStart(2, '0');
            const dateStr = `${year}-${mStr}-${dStr}`;
            const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            const dayEvents = events.filter(e => e.date === dateStr);
            const dayTasks  = tasks.filter(t => t.deadline === dateStr);

            let html = '';
            dayEvents.forEach(e => {
                html += `<div class="cal-task" style="background:var(--primary-color);color:white;cursor:pointer;" title="${e.title}" onclick="CalendarManager.openModal(${JSON.stringify(e).replace(/"/g, '&quot;')})">
                    <i class="fas fa-calendar"></i> ${e.title.length > 12 ? e.title.substring(0,12)+'…' : e.title}
                </div>`;
            });
            dayTasks.forEach(t => {
                const color = t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#10b981';
                html += `<div class="cal-task" style="background:${color}20;color:${color};border-left:2px solid ${color};" title="${t.title}">
                    <i class="fas fa-tasks"></i> ${t.title.length > 12 ? t.title.substring(0,12)+'…' : t.title}
                </div>`;
            });

            daysContainer.innerHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <span class="date">${i}</span>
                    ${html}
                </div>
            `;
        }

        // Render events list below calendar
        CalendarManager.renderEventsList(events);
    },

    renderEventsList: (events) => {
        const listEl = document.getElementById('events-list');
        if (!listEl) return;

        // Sort by date
        const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
        const todayStr = new Date().toISOString().slice(0, 10);
        const upcoming = sorted.filter(e => e.date >= todayStr);

        if (upcoming.length === 0) {
            listEl.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:1rem;font-size:0.875rem;">${LangManager.t('No upcoming events.')}</p>`;
            return;
        }

        listEl.innerHTML = upcoming.map(e => {
            const dateObj = new Date(e.date + 'T00:00:00');
            const formatted = dateObj.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
            return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="width:40px;height:40px;border-radius:var(--radius-md);background:rgba(37,99,235,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="fas fa-calendar" style="color:var(--primary-color);"></i>
                        </div>
                        <div>
                            <p style="font-weight:600;margin-bottom:0.1rem;">${e.title}</p>
                            <span style="font-size:0.78rem;color:var(--text-secondary);">${formatted}${e.time ? ' at ' + e.time : ''}${e.desc ? ' — ' + e.desc.substring(0,40) : ''}</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:0.5rem;flex-shrink:0;">
                        <button onclick="CalendarManager.openModal(${JSON.stringify(e).replace(/"/g, '&quot;')})"
                            style="background:rgba(37,99,235,0.1);color:var(--primary-color);border:none;padding:0.4rem 0.7rem;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="CalendarManager.deleteEvent('${e.id}')"
                            style="background:rgba(239,68,68,0.1);color:var(--danger);border:none;padding:0.4rem 0.7rem;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
};

window.CalendarManager = CalendarManager;
