/**
 * Al-Raed AI Assistant - Rebuilt From Scratch (V7 - High Stability)
 * A clean, fast, and robust assistant for administrative automation.
 */

const AIAssistant = {
    // --- Configuration & State ---
    config: {
        isAr: () => (localStorage.getItem('al_raed_lang') || 'ar') === 'ar',
        user: () => AuthManager.currentUser
    },
    state: {
        wizard: { active: false, type: null, step: 0, data: {} },
        memory: JSON.parse(localStorage.getItem('ai_permanent_memory')) || {}
    },

    // --- Core Initialization ---
    init: () => {
        const user = AIAssistant.config.user();
        if (!user) return;

        // Ensure UI elements exist
        AIAssistant.setupUI();
        AIAssistant.bindEvents();
        AIAssistant.loadHistory();
        
        console.log("✅ Al-Raed AI Assistant Rebuilt & Initialized.");
    },

    setupUI: () => {
        const widget = document.getElementById('ai-assistant-widget');
        if (widget) {
            widget.style.display = 'block';
            AIAssistant.applyThemeAndDirection();
        }
    },

    bindEvents: () => {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const closeBtn = document.getElementById('ai-close-btn');
        const clearBtn = document.getElementById('ai-clear-btn');
        const chatWin = document.getElementById('ai-chat-window');

        if (toggleBtn) toggleBtn.onclick = () => {
            const show = chatWin.style.display !== 'flex';
            chatWin.style.display = show ? 'flex' : 'none';
            if (show && document.getElementById('ai-messages').innerHTML === '') AIAssistant.showWelcome();
        };

        if (closeBtn) closeBtn.onclick = () => chatWin.style.display = 'none';
        
        if (clearBtn) clearBtn.onclick = () => {
            document.getElementById('ai-messages').innerHTML = '';
            localStorage.removeItem('ai_chat_history');
            AIAssistant.resetWizard();
            AIAssistant.showWelcome();
        };

        if (sendBtn) sendBtn.onclick = AIAssistant.handleSend;
        if (input) {
            input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); AIAssistant.handleSend(); } };
        }
    },

    // --- Interaction Logic ---
    handleSend: () => {
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;

        AIAssistant.appendMessage(text, 'user');
        input.value = '';
        AIAssistant.process(text);
    },

    process: (text) => {
        AIAssistant.showTyping(true);
        setTimeout(() => {
            AIAssistant.showTyping(false);
            AIAssistant.think(text);
        }, 600 + Math.random() * 600);
    },

    think: (msg) => {
        const raw = msg.toLowerCase().trim();
        const isAr = AIAssistant.config.isAr();
        
        // 1. Wizard Handling (Multi-step forms)
        if (AIAssistant.state.wizard.active) {
            AIAssistant.handleWizard(msg);
            return;
        }

        let reply = "";
        let chips = [];

        // 2. Navigation Commands
        if (raw.match(/افتح المهام|المهام|tasks|work/)) {
            App.navigateTo('tasks');
            reply = isAr ? "تحت أمرك يا مدير، فتحت لك قسم المهام. تحب أضيف مهمة جديدة؟" : "Tasks section opened. Want to add a new task?";
            chips = isAr ? [{text:"إضافة مهمة جديدة"}] : [{text:"Add task"}];
        } 
        else if (raw.match(/الحسابات|المصاريف|finance|money/)) {
            App.navigateTo('finance');
            reply = isAr ? "قسم الحسابات جاهز. حابب تسجل مصروف جديد؟" : "Finance section ready. Record an expense?";
            chips = isAr ? [{text:"سجل مصروف"}] : [{text:"Record expense"}];
        }
        else if (raw.match(/العملاء|عميل|clients/)) {
            App.navigateTo('clients');
            reply = isAr ? "قائمة العملاء مفتوحة قدامك. حابب أضيف عميل جديد؟" : "Clients list opened. Add a new client?";
        }

        // 3. Wizard Triggers
        else if (raw.match(/اضافة مهمة|مهمة جديدة|add task/)) {
            AIAssistant.state.wizard = { active: true, type: 'task', step: 1, data: {} };
            reply = isAr ? "تمام، إيه هو <b>عنوان المهمة</b>؟" : "Sure, what is the <b>task title</b>?";
        }
        else if (raw.match(/سجل مصروف|اضافة مصروف|add expense/)) {
            AIAssistant.state.wizard = { active: true, type: 'expense', step: 1, data: {} };
            reply = isAr ? "ماشي يا مدير، <b>المبلغ</b> كام؟" : "Alright, what is the <b>amount</b>?";
        }

        // 4. General Queries
        else if (raw.match(/اهلا|ازيك|hi|hello/)) {
            reply = isAr ? "أهلاً بك! أنا الرائد، مساعدك الذكي. جاهز لمساعدتك في أي وقت." : "Hello! I am Al-Raed, your smart assistant. Ready to help anytime.";
            chips = isAr ? [{text:"ملخص المهام"}, {text:"المصاريف اليومية"}] : [{text:"Task Summary"}, {text:"Daily Expenses"}];
        }
        else if (raw.match(/مين انا|اسمي|who am i/)) {
            const me = AIAssistant.config.user();
            reply = isAr ? `إنت الباشا <b>${me?.name}</b>، المدير المسؤول هنا. 👑` : `You are <b>${me?.name}</b>, the leader here. 👑`;
        }

        // 5. Default Response
        if (!reply) {
            reply = isAr ? "فهمتك يا مدير، بس الكلمة دي جديدة عليا. اقدر اساعدك في تنظيم المهام والحسابات حالياً." : "Understood, but I'm still learning that. I can help with tasks and finance for now.";
        }

        AIAssistant.appendMessage(reply, 'ai');
        if (chips.length > 0) AIAssistant.showChips(chips);
    },

    // --- Wizard Logic ---
    handleWizard: (input) => {
        const wiz = AIAssistant.state.wizard;
        const isAr = AIAssistant.config.isAr();

        if (wiz.type === 'task') {
            if (wiz.step === 1) {
                wiz.data.title = input;
                wiz.step = 2;
                AIAssistant.appendMessage(isAr ? "تمام، وايه <b>الوصف</b>؟" : "Great, what is the <b>description</b>?", 'ai');
            } else if (wiz.step === 2) {
                wiz.data.desc = input;
                AIAssistant.saveTask(wiz.data);
                AIAssistant.appendMessage(isAr ? "تم حفظ المهمة بنجاح! ✅" : "Task saved successfully! ✅", 'ai');
                AIAssistant.resetWizard();
            }
        } else if (wiz.type === 'expense') {
            if (wiz.step === 1) {
                wiz.data.amount = parseFloat(input) || 0;
                wiz.step = 2;
                AIAssistant.appendMessage(isAr ? "ماشي، <b>الوصف</b> إيه؟" : "Okay, what is the <b>description</b>?", 'ai');
            } else if (wiz.step === 2) {
                wiz.data.desc = input;
                AIAssistant.saveExpense(wiz.data);
                AIAssistant.appendMessage(isAr ? "سجلت لك المصروف، ميزانيتك في أمان! 💸" : "Expense recorded, budget is safe! 💸", 'ai');
                AIAssistant.resetWizard();
            }
        }
    },

    // --- Data Persistence ---
    saveTask: (data) => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.unshift({
            id: 'task_' + Date.now(),
            title: data.title,
            description: data.desc,
            status: 'todo',
            priority: 'medium',
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        if (typeof TasksManager !== 'undefined') TasksManager.render();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    },

    saveExpense: (data) => {
        const finance = JSON.parse(localStorage.getItem('finance')) || [];
        finance.unshift({
            id: 'fin_' + Date.now(),
            type: 'expense',
            amount: data.amount,
            description: data.desc,
            date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('finance', JSON.stringify(finance));
        if (typeof FinanceManager !== 'undefined') FinanceManager.renderExpenses();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    },

    // --- UI Helpers ---
    appendMessage: (text, sender, save = true) => {
        const container = document.getElementById('ai-messages');
        if (!container) return;

        const div = document.createElement('div');
        const isUser = sender === 'user';
        
        div.className = 'ai-msg-bubble ' + (isUser ? 'user' : 'ai');
        div.style.cssText = isUser 
            ? 'background:linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color:white; padding:0.8rem 1.1rem; border-radius:1.2rem 1.2rem 0.2rem 1.2rem; margin-bottom:1rem; align-self:flex-end; max-width:85%; box-shadow:var(--shadow-sm); animation:slideInRight 0.3s ease; font-size:0.95rem;'
            : 'background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-primary); padding:0.8rem 1.1rem; border-radius:1.2rem 1.2rem 1.2rem 0.2rem; margin-bottom:1rem; align-self:flex-start; max-width:85%; box-shadow:var(--shadow-sm); animation:slideInLeft 0.3s ease; font-size:0.95rem; line-height:1.5;';
        
        div.innerHTML = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        if (save) {
            const history = JSON.parse(localStorage.getItem('ai_chat_history')) || [];
            history.push({ text, sender });
            localStorage.setItem('ai_chat_history', JSON.stringify(history.slice(-20)));
        }
    },

    showChips: (chips) => {
        const container = document.getElementById('ai-messages');
        const chipContainer = document.createElement('div');
        chipContainer.style.cssText = 'display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;';
        
        chips.forEach(c => {
            const btn = document.createElement('button');
            btn.style.cssText = 'background:var(--bg-secondary); border:1px solid var(--primary-color); color:var(--primary-color); padding:0.4rem 0.8rem; border-radius:2rem; font-size:0.85rem; cursor:pointer; transition:0.2s;';
            btn.innerText = c.text;
            btn.onclick = () => {
                AIAssistant.appendMessage(c.text, 'user');
                chipContainer.remove();
                AIAssistant.process(c.text);
            };
            btn.onmouseover = () => btn.style.background = 'var(--primary-color)1a';
            btn.onmouseout = () => btn.style.background = 'var(--bg-secondary)';
            chipContainer.appendChild(btn);
        });
        container.appendChild(chipContainer);
        container.scrollTop = container.scrollHeight;
    },

    showWelcome: () => {
        const isAr = AIAssistant.config.isAr();
        const msg = isAr ? "أهلاً بك يا مدير! 👋 أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟" : "Welcome back, Leader! 👋 How can I help you today?";
        AIAssistant.appendMessage(msg, 'ai', false);
    },

    showTyping: (show) => {
        const typing = document.getElementById('ai-typing');
        if (typing) typing.style.display = show ? 'block' : 'none';
    },

    loadHistory: () => {
        const history = JSON.parse(localStorage.getItem('ai_chat_history')) || [];
        history.forEach(m => AIAssistant.appendMessage(m.text, m.sender, false));
    },

    resetWizard: () => {
        AIAssistant.state.wizard = { active: false, type: null, step: 0, data: {} };
    },

    applyThemeAndDirection: () => {
        const isAr = AIAssistant.config.isAr();
        const widget = document.getElementById('ai-assistant-widget');
        const chatWin = document.getElementById('ai-chat-window');
        if (widget) {
            widget.style.left = isAr ? '20px' : 'auto';
            widget.style.right = isAr ? 'auto' : '20px';
        }
        if (chatWin) {
            chatWin.style.left = isAr ? '0' : 'auto';
            chatWin.style.right = isAr ? 'auto' : '0';
        }
    }
};

// Global Exposure
window.AIAssistant = AIAssistant;

// AIAssistant.init is called from App.init()
