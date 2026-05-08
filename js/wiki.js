/**
 * Knowledge Base / Wiki Manager - Professional Version
 */
const WikiManager = {
    articles: [],
    categories: ['سياسات الشركة', 'دليل الموظف', 'التعليمات التقنية', 'الموارد البشرية'],

    init: () => {
        WikiManager.load();
        const btnAdd = document.getElementById('btn-add-wiki');
        if (btnAdd) btnAdd.onclick = () => WikiManager.openModal();
        
        const btnSave = document.getElementById('save-wiki');
        if (btnSave) btnSave.onclick = () => WikiManager.saveArticle();
    },

    load: () => {
        const stored = localStorage.getItem('wiki_articles');
        if (stored) {
            WikiManager.articles = JSON.parse(stored);
        } else {
            WikiManager.articles = [];
            WikiManager.saveToStorage();
        }
        WikiManager.render();
    },

    saveToStorage: () => {
        localStorage.setItem('wiki_articles', JSON.stringify(WikiManager.articles));
    },

    render: () => {
        const isAr = typeof LangManager !== 'undefined' && LangManager.currentLang === 'ar';
        const catList = document.getElementById('wiki-categories');
        if (catList) {
            catList.innerHTML = WikiManager.categories.map(cat => `
                <li class="wiki-cat-item" onclick="WikiManager.filterByCategory('${cat}')">
                    <i class="fas fa-folder"></i> <span>${typeof LangManager !== 'undefined' ? LangManager.t(cat) : cat}</span>
                </li>
            `).join('') + `
                <li class="wiki-cat-item all-articles" onclick="WikiManager.renderArticles(WikiManager.articles)">
                    <i class="fas fa-list"></i> <span>${isAr ? 'عرض الكل' : 'View All'}</span>
                </li>
            `;
        }
        
        WikiManager.renderArticles(WikiManager.articles);
    },

    renderArticles: (list) => {
        const content = document.getElementById('wiki-content');
        if (!content) return;

        if (list.length === 0) {
            content.innerHTML = `
                <div class="empty-state glass-effect" style="padding:4rem; text-align:center;">
                    <i class="fas fa-book-open" style="font-size:3.5rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom:1.5rem; display:block;"></i>
                    <h3 style="margin-bottom:0.5rem;">${isAr ? 'لا يوجد مقالات' : 'No Articles Found'}</h3>
                    <p style="color:var(--text-secondary);">${isAr ? 'لم يتم العثور على أي مقالات في هذا القسم حالياً.' : 'There are no articles in this category yet.'}</p>
                </div>`;
            return;
        }

        content.innerHTML = `
            <div class="wiki-grid">
                ${list.map(a => `
                    <div class="wiki-card glass-effect" onclick="WikiManager.viewArticle(${a.id})">
                        <div class="wiki-card-header">
                            <span class="wiki-tag">${a.category}</span>
                            <div class="wiki-card-actions">
                                <button class="btn-icon edit" onclick="event.stopPropagation(); WikiManager.editArticle(${a.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon delete" onclick="event.stopPropagation(); WikiManager.deleteArticle(${a.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <h3>${a.title}</h3>
                        <p>${a.content.substring(0, 80)}...</p>
                        <div class="wiki-card-footer">
                            <span><i class="far fa-clock"></i> ${new Date(a.id).toLocaleDateString()}</span>
                            <span class="read-more">${typeof LangManager !== 'undefined' ? LangManager.t('Read More') : 'Read More'} <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    filterByCategory: (cat) => {
        const filtered = WikiManager.articles.filter(a => a.category === cat);
        WikiManager.renderArticles(filtered);
    },

    viewArticle: (id) => {
        const article = WikiManager.articles.find(a => a.id === id);
        if (!article) return;

        const isAr = typeof LangManager !== 'undefined' && LangManager.currentLang === 'ar';
        const content = document.getElementById('wiki-content');
        content.innerHTML = `
            <div class="article-view-container">
                <button class="btn btn-outline back-btn" onclick="WikiManager.renderArticles(WikiManager.articles)">
                    <i class="fas fa-arrow-${isAr ? 'right' : 'left'}"></i> ${isAr ? 'رجوع' : 'Back'}
                </button>
                <article class="wiki-article-full glass-effect">
                    <header>
                        <div class="meta">
                            <span class="category-badge">${article.category}</span>
                            <span class="date"><i class="far fa-calendar-alt"></i> ${new Date(article.id).toLocaleDateString()}</span>
                        </div>
                        <h1>${article.title}</h1>
                    </header>
                    <div class="article-content">
                        ${article.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                    <footer>
                        ${(AuthManager.currentUser.role === 'Super Admin' || AuthManager.currentUser.role === 'Manager') ? `
                            <button class="btn btn-primary" onclick="WikiManager.editArticle(${article.id})">
                                <i class="fas fa-edit"></i> ${isAr ? 'تعديل المقال' : 'Edit Article'}
                            </button>
                        ` : ''}
                    </footer>
                </article>
            </div>
        `;
    },

    openModal: (article = null) => {
        const titleInput = document.getElementById('wiki-title-input');
        const catInput = document.getElementById('wiki-category-input');
        const contentInput = document.getElementById('wiki-content-textarea');
        const modalTitle = document.querySelector('#wiki-modal h2');
        const saveBtn = document.getElementById('save-wiki');

        if (article) {
            titleInput.value = article.title;
            catInput.value = article.category;
            contentInput.value = article.content;
            modalTitle.textContent = typeof LangManager !== 'undefined' ? LangManager.t('Edit Article') : 'Edit Article';
            saveBtn.innerHTML = `<i class="fas fa-save"></i> ${typeof LangManager !== 'undefined' ? LangManager.t('Update Article') : 'Update Article'}`;
            saveBtn.dataset.editId = article.id;
        } else {
            titleInput.value = '';
            catInput.value = 'سياسات الشركة';
            contentInput.value = '';
            modalTitle.textContent = typeof LangManager !== 'undefined' ? LangManager.t('New Knowledge Base Article') : 'New Knowledge Base Article';
            saveBtn.innerHTML = `<i class="fas fa-save"></i> ${typeof LangManager !== 'undefined' ? LangManager.t('Publish Article') : 'Publish Article'}`;
            delete saveBtn.dataset.editId;
        }
        document.getElementById('wiki-modal').classList.remove('hidden');
    },

    editArticle: (id) => {
        const article = WikiManager.articles.find(a => a.id === id);
        if (article) WikiManager.openModal(article);
    },

    saveArticle: () => {
        const title = document.getElementById('wiki-title-input').value.trim();
        const category = document.getElementById('wiki-category-input').value;
        const content = document.getElementById('wiki-content-textarea').value.trim();
        const saveBtn = document.getElementById('save-wiki');
        const editId = saveBtn.dataset.editId;

        if (!title || !content) {
            alert(typeof LangManager !== 'undefined' ? LangManager.t('Please fill all fields') : 'Please fill all fields');
            return;
        }

        if (editId) {
            const index = WikiManager.articles.findIndex(a => a.id == editId);
            if (index > -1) {
                WikiManager.articles[index] = { ...WikiManager.articles[index], title, category, content };
            }
        } else {
            const newArticle = { id: Date.now(), title, category, content };
            WikiManager.articles.push(newArticle);
        }

        WikiManager.saveToStorage();
        WikiManager.render();
        document.getElementById('wiki-modal').classList.add('hidden');
        
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.add(editId ? 'تم تحديث المقال' : 'تم نشر المقال بنجاح', 'fa-book', 'success');
        }
    },

    deleteArticle: (id) => {
        const isAr = typeof LangManager !== 'undefined' && LangManager.currentLang === 'ar';
        if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه المقالة؟' : 'Are you sure you want to delete this article?')) return;
        WikiManager.articles = WikiManager.articles.filter(a => a.id !== id);
        WikiManager.saveToStorage();
        WikiManager.render();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (typeof App !== 'undefined') WikiManager.init();
});
