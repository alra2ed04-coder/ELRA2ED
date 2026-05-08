// Reports & Export Logic
const ReportsManager = {
    init: () => {
        const btnExportTasks = document.getElementById('btn-export-tasks');
        const btnExportTeam = document.getElementById('btn-export-team');
        
        if (btnExportTasks) {
            btnExportTasks.addEventListener('click', ReportsManager.exportTasksToExcel);
        }
        if (btnExportTeam) {
            btnExportTeam.addEventListener('click', ReportsManager.exportTeamToExcel);
        }
    },

    exportToExcel: (data, filename, sheetName = 'Sheet1') => {
        if (!window.XLSX) {
            alert('Excel export library is not loaded properly.');
            return;
        }

        // Convert data to worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Calculate auto-width for columns
        const colWidths = [];
        data.forEach(row => {
            Object.keys(row).forEach((key, i) => {
                const val = row[key] ? row[key].toString() : '';
                const width = Math.max(val.length, key.length) + 2;
                if (!colWidths[i] || width > colWidths[i].wch) {
                    colWidths[i] = { wch: width > 50 ? 50 : width }; // max width 50
                }
            });
        });
        ws['!cols'] = colWidths;

        // Create workbook and add worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Trigger download
        XLSX.writeFile(wb, filename);
    },

    exportTasksToExcel: () => {
        const tasks = Store.get('tasks') || [];
        if (tasks.length === 0) return alert('No tasks to export.');

        const data = tasks.map(t => ({
            'Task ID': t.id,
            'Title': t.title,
            'Description': t.desc || '',
            'Priority': t.priority.toUpperCase(),
            'Status': t.status.toUpperCase(),
            'Deadline': t.deadline || 'No Deadline'
        }));

        ReportsManager.exportToExcel(data, `AlRaed_Tasks_${new Date().getTime()}.xlsx`, 'Tasks');
    },

    exportTeamToExcel: () => {
        const team = Store.get('team') || [];
        if (team.length === 0) return alert('No team members to export.');

        const data = team.map(m => ({
            'Member ID': m.id,
            'Full Name': m.name,
            'Role / Position': m.role,
            'Email Address': m.email || 'N/A'
        }));

        ReportsManager.exportToExcel(data, `AlRaed_Team_${new Date().getTime()}.xlsx`, 'Team Members');
    }
};
