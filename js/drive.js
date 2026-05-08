/**
 * Al-Raed Platform - Cloud Drive Manager
 */
const DriveManager = {
    init: () => {
        window.addEventListener('storeUpdated', (e) => {
            if (e.detail?.key === 'cloud_drive') {
                DriveManager.render();
            }
        });

        const uploadInput = document.getElementById('drive-upload-input');
        if (uploadInput) {
            uploadInput.addEventListener('change', DriveManager.handleUpload);
        }
    },

    getFiles: () => {
        return Store.get('cloud_drive') || [];
    },

    handleUpload: (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let processed = 0;
        files.forEach(file => {
            // Check size (max 5MB for local storage prototype)
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Max 5MB.`);
                processed++;
                if (processed === files.length) e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const me = AuthManager.currentUser;
                const newFile = {
                    id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    dataUrl: event.target.result,
                    uploadedBy: me.name,
                    uploadDate: new Date().toISOString()
                };

                const currentFiles = DriveManager.getFiles();
                currentFiles.push(newFile);
                Store.set('cloud_drive', currentFiles);

                NotificationManager.add(`File uploaded: ${file.name}`, 'fa-check-circle', 'system');
                
                processed++;
                if (processed === files.length) {
                    e.target.value = '';
                    DriveManager.render();
                }
            };
            reader.readAsDataURL(file);
        });
    },

    deleteFile: (id) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        const currentFiles = DriveManager.getFiles().filter(f => f.id !== id);
        Store.set('cloud_drive', currentFiles);
        DriveManager.render();
    },

    downloadFile: (id) => {
        const file = DriveManager.getFiles().find(f => f.id === id);
        if (!file) return;

        const a = document.createElement('a');
        a.href = file.dataUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    render: () => {
        const grid = document.getElementById('drive-grid');
        const usageEl = document.getElementById('drive-usage');
        if (!grid) return;

        const files = DriveManager.getFiles();
        
        let totalBytes = 0;
        grid.innerHTML = '';

        if (files.length === 0) {
            grid.style.display = 'block';
            grid.innerHTML = `
                <div style="text-align:center;color:var(--text-secondary);padding:3rem;opacity:0.6;">
                    <i class="fas fa-cloud-upload-alt" style="font-size:4rem;margin-bottom:1rem;"></i>
                    <p data-original="Your drive is empty.">Your drive is empty.</p>
                </div>
            `;
            if (usageEl) usageEl.textContent = '0 MB used';
            return;
        }

        grid.style.display = 'grid';

        files.forEach(file => {
            totalBytes += file.size;
            
            const isImage = file.type.startsWith('image/');
            const icon = isImage ? 'fa-image' : 
                         file.type.includes('pdf') ? 'fa-file-pdf' :
                         file.type.includes('video') ? 'fa-file-video' : 'fa-file-alt';
            const iconColor = isImage ? '#3b82f6' : 
                              file.type.includes('pdf') ? '#ef4444' : '#10b981';

            const card = document.createElement('div');
            card.style.background = 'var(--bg-primary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.padding = '1rem';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '0.75rem';
            card.style.position = 'relative';
            card.style.overflow = 'hidden';

            const preview = isImage 
                ? `<div style="height:100px;border-radius:var(--radius-sm);background-image:url(${file.dataUrl});background-size:cover;background-position:center;margin-bottom:0.5rem;"></div>`
                : `<div style="height:100px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.02);border-radius:var(--radius-sm);margin-bottom:0.5rem;"><i class="fas ${icon}" style="font-size:3rem;color:${iconColor};opacity:0.8;"></i></div>`;

            card.innerHTML = `
                ${preview}
                <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${file.name}">${file.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);display:flex;justify-content:space-between;">
                    <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>${new Date(file.uploadDate).toLocaleDateString()}</span>
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                    <button class="btn btn-primary" style="flex:1;padding:0.4rem;font-size:0.8rem;" onclick="DriveManager.downloadFile('${file.id}')"><i class="fas fa-download"></i></button>
                    <button class="btn btn-secondary" style="flex:1;padding:0.4rem;font-size:0.8rem;background:rgba(239,68,68,0.1);color:var(--danger);border-color:rgba(239,68,68,0.2);" onclick="DriveManager.deleteFile('${file.id}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
            grid.appendChild(card);
        });

        if (usageEl) usageEl.textContent = `${(totalBytes / 1024 / 1024).toFixed(2)} MB used`;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    DriveManager.init();
});
