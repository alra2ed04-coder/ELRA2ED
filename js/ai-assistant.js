/**
 * Al-Raed Platform — Interactive Wizard Brain (V6)
 * Multi-step Task Creation - Auto-Saving - Zero API
 */
const AIAssistant = {
    lastTopic: null,
    learningTarget: null,
    wizard: {
        active: false,
        type: null, // 'task', 'expense', etc.
        step: 0,
        data: {}
    },

    init: () => {
        const user = AuthManager.currentUser;
        if (!user) return;
        const widget = document.getElementById('ai-assistant-widget');
        if (widget) widget.style.display = (user.role === 'Super Admin' || user.role === 'Manager') ? 'block' : 'none';
        
        AIAssistant.applyDirection();
        AIAssistant.loadHistory();

        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        const clearBtn = document.getElementById('ai-clear-btn');
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const closeBtn = document.getElementById('ai-close-btn');
        const chatWin = document.getElementById('ai-chat-window');
        
        // Add voice button if not exists
        if (!document.getElementById('ai-voice-btn')) {
            const voiceBtn = document.createElement('button');
            voiceBtn.id = 'ai-voice-btn';
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid var(--border-color);color:var(--primary-color);width:38px;height:38px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--transition);flex-shrink:0;';
            if (sendBtn && sendBtn.parentNode) sendBtn.parentNode.insertBefore(voiceBtn, sendBtn);
            voiceBtn.onclick = () => AIAssistant.startListening();
        }

        const handleSend = () => {
            const val = input.value.trim();
            if (!val) return;
            AIAssistant.appendMessage(val, 'user');
            input.value = '';
            AIAssistant.processRequest(val);
        };

        if (toggleBtn) toggleBtn.onclick = () => {
            const isVisible = chatWin.style.display === 'flex';
            chatWin.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible && document.getElementById('ai-messages').innerHTML === '') {
                AIAssistant.showWelcome();
            }
        };
        
        if (closeBtn) closeBtn.onclick = () => chatWin.style.display = 'none';
        if (clearBtn) clearBtn.onclick = () => { 
            document.getElementById('ai-messages').innerHTML = ''; 
            localStorage.removeItem('ai_chat_history');
            AIAssistant.resetStates();
            AIAssistant.showWelcome(); 
        };
        if (sendBtn) sendBtn.onclick = handleSend;
        if (input) {
            input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
            // Auto-resize
            input.oninput = () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            };
        }
    },

    loadHistory: () => {
        const history = JSON.parse(localStorage.getItem('ai_chat_history')) || [];
        if (history.length > 0) {
            history.forEach(m => AIAssistant.appendMessage(m.text, m.sender, false));
        }
    },

    saveHistory: (text, sender) => {
        const history = JSON.parse(localStorage.getItem('ai_chat_history')) || [];
        history.push({ text, sender });
        if (history.length > 20) history.shift();
        localStorage.setItem('ai_chat_history', JSON.stringify(history));
    },

    showTyping: (show) => {
        const typing = document.getElementById('ai-typing');
        if (typing) typing.style.display = show ? 'block' : 'none';
        const msgs = document.getElementById('ai-messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
    },

    processRequest: (msg) => {
        AIAssistant.showTyping(true);
        setTimeout(() => {
            AIAssistant.showTyping(false);
            AIAssistant.think(msg);
        }, 800 + Math.random() * 1000);
    },

    startListening: () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("عذراً، متصفحك لا يدعم التعرف على الصوت.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-EG';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const voiceBtn = document.getElementById('ai-voice-btn');
        voiceBtn.style.background = 'var(--danger)';
        voiceBtn.style.color = 'white';
        voiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('ai-input').value = transcript;
            AIAssistant.appendMessage(transcript, 'user');
            AIAssistant.processRequest(transcript);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            voiceBtn.style.background = 'rgba(255,255,255,0.05)';
            voiceBtn.style.color = 'var(--primary-color)';
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceBtn.style.background = 'rgba(255,255,255,0.05)';
            voiceBtn.style.color = 'var(--primary-color)';
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
    },

    resetStates: () => {
        AIAssistant.learningTarget = null;
        AIAssistant.wizard = { active: false, type: null, step: 0, data: {} };
    },

    applyDirection: () => {
        const isAr = (localStorage.getItem('al_raed_lang') || 'ar') === 'ar';
        const widget = document.getElementById('ai-assistant-widget');
        const win = document.getElementById('ai-chat-window');
        if (widget && win) {
            widget.style.right = isAr ? 'auto' : '24px';
            widget.style.left  = isAr ? '24px'  : 'auto';
            win.style.right = isAr ? 'auto' : '0';
            win.style.left = isAr ? '0' : 'auto';
        }
    },

    showWelcome: () => {
        const msgs = document.getElementById('ai-messages');
        const isAr = (localStorage.getItem('al_raed_lang') || 'ar') === 'ar';
        const welcome = isAr 
            ? "يا هلا يا مدير! 👋 أنا الرائد، اقدر اساعدك في إضافة مهام أو متابعة حساباتك.. اطلب مني أي حاجة."
            : "Hello Director! 👋 I am Al-Raed, I can help you manage tasks, track finance, and more. How can I help?";
        if (msgs && msgs.innerHTML === '') AIAssistant.appendMessage(welcome, 'ai');
    },

    appendMessage: (text, sender, save = true) => {
        const container = document.getElementById('ai-messages');
        if (!container) return;
        
        const div = document.createElement('div');
        const isUser = sender === 'user';
        
        div.style.cssText = isUser 
            ? 'background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;padding:0.8rem 1rem;border-radius:18px 18px 4px 18px;margin-bottom:0.8rem;align-self:flex-end;max-width:85%;word-break:break-word;box-shadow:0 4px 12px rgba(37,99,235,0.2);font-size:0.92rem;animation:slideInRight 0.3s ease;'
            : 'background:var(--bg-secondary);border:1px solid var(--border-color);padding:0.8rem 1rem;border-radius:18px 18px 18px 4px;margin-bottom:0.8rem;align-self:flex-start;max-width:85%;line-height:1.6;color:var(--text-primary);box-shadow:0 4px 12px rgba(0,0,0,0.1);font-size:0.92rem;animation:slideInLeft 0.3s ease;';
        
        div.innerHTML = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        
        if (save) AIAssistant.saveHistory(text, sender);
    },

    showChips: (chips) => {
        const container = document.getElementById('ai-messages');
        if (!container) return;
        
        const chipContainer = document.createElement('div');
        chipContainer.className = 'ai-chip-container';
        chipContainer.style.cssText = 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;padding:0 0.5rem;animation:fadeIn 0.5s ease;';
        
        chips.forEach(c => {
            const button = document.createElement('button');
            button.className = 'ai-chip';
            button.innerText = c.text;
            button.onclick = () => {
                AIAssistant.appendMessage(c.text, 'user');
                chipContainer.remove();
                AIAssistant.processRequest(c.text);
            };
            chipContainer.appendChild(button);
        });
        
        container.appendChild(chipContainer);
        container.scrollTop = container.scrollHeight;
    },

    think: (msg) => {
        const raw = msg.toLowerCase().trim();
        const isAr = (localStorage.getItem('al_raed_lang') || 'ar') === 'ar';
        
        if (AIAssistant.wizard.active) {
            AIAssistant.handleWizard(msg);
            return;
        }

        if (AIAssistant.learningTarget) {
            const learned = JSON.parse(localStorage.getItem('ai_permanent_memory')) || {};
            learned[AIAssistant.learningTarget] = msg;
            localStorage.setItem('ai_permanent_memory', JSON.stringify(learned));
            AIAssistant.appendMessage(isAr ? `فهمت يا مدير! ✅ سجلت الرد ده لـ "${AIAssistant.learningTarget}".` : `Understood! ✅ Saved response for "${AIAssistant.learningTarget}".`, 'ai');
            AIAssistant.learningTarget = null;
            return;
        }

        const learned = JSON.parse(localStorage.getItem('ai_permanent_memory')) || {};
        if (learned[raw]) { AIAssistant.appendMessage(learned[raw], 'ai'); return; }

        let reply = "";
        let topic = null;
        let chips = [];

        // ── NAVIGATION & VIEWS ──
        if (raw.match(/افتح المهام|المهام|tasks|work/)) {
            App.navigateTo('tasks');
            reply = isAr ? "فتحت لك قسم المهام يا مدير. تحب أضيف لك حاجة جديدة؟" : "Opened tasks section. Want me to add something new?";
            chips = isAr ? [{text: "ضيف مهمة جديدة"}, {text: "عرض المهام المتأخرة"}] : [{text: "Add new task"}, {text: "Show late tasks"}];
        }
        else if (raw.match(/المصاريف|الحسابات|فلوس|finance|money|expense/)) {
            App.navigateTo('finance');
            reply = isAr ? "قسم الحسابات والمصاريف جاهز. تحب تسجل مصروف جديد؟" : "Finance section ready. Record a new expense?";
            chips = isAr ? [{text: "سجل مصروف جديد"}, {text: "عرض الأرباح"}] : [{text: "Record expense"}, {text: "Show profits"}];
        }
        else if (raw.match(/العملاء|عميل|clients/)) {
            App.navigateTo('clients');
            reply = isAr ? "فتحت لك قائمة العملاء. تحب أضيف عميل جديد للفريق؟" : "Opened clients list. Add a new client?";
            chips = isAr ? [{text: "ضيف عميل جديد"}] : [{text: "Add new client"}];
        }

        // ── WIZARD TRIGGERS ──
        else if (raw.match(/ضيف مهمة|سجل شغل|مهمة جديدة|add task|new task/)) {
            AIAssistant.wizard = { active: true, type: 'task', step: 1, data: {} };
            reply = isAr ? "من عيوني! 🫡 إيه هو <b>عنوان المهمة</b>؟" : "Sure! 🫡 What is the <b>task title</b>?";
        }
        else if (raw.match(/سجل مصروف|اضافة مصروف|add expense|new expense/)) {
            AIAssistant.wizard = { active: true, type: 'expense', step: 1, data: {} };
            reply = isAr ? "ماشي يا مدير، <b>المبلغ</b> كام؟" : "Alright, what is the <b>amount</b>?";
        }
        else if (raw.match(/ضيف عميل|عميل جديد|add client|new client/)) {
            AIAssistant.wizard = { active: true, type: 'client', step: 1, data: {} };
            reply = isAr ? "تمام، إيه هو <b>اسم العميل</b>؟" : "Okay, what is the <b>client name</b>?";
        }

        // ── PERSONAL & TEAM ──
        else if (raw.match(/انا مين|اسمي|who am i/)) {
            const me = AuthManager.currentUser;
            reply = isAr ? `إنت الباشا <b>${me?.name}</b>، ووظيفتك <b>${me?.title || 'المدير العام'}</b>. 👑` : `You are <b>${me?.name}</b>, role: <b>${me?.title || 'General Manager'}</b>. 👑`;
        }
        else if (raw.match(/الفريق|team/)) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            reply = isAr ? `الفريق فيه <b>${users.length}</b> أعضاء حالياً.` : `The team has <b>${users.length}</b> members.`;
            chips = isAr ? [{text: "عرض أسماء الفريق"}] : [{text: "Show names"}];
        }
        else if (raw.match(/ازيك|اهلا|hi|hello/)) {
            reply = isAr ? "أنا الرائد، مساعدك الذكي. كله تمام والمنصة شغالة زي الفل! تحب تتابع إيه النهادرية؟" : "I am Al-Raed, your AI. Everything is running smooth! What do you want to track today?";
            chips = isAr ? [{text: "ملخص الحسابات"}, {text: "حالة المهام"}] : [{text: "Finance Summary"}, {text: "Task Status"}];
        }

        if (!reply) {
            AIAssistant.learningTarget = raw;
            reply = isAr 
                ? `الكلمة دي جديدة عليا.. <b>تحب أرد عليك أقول إيه لما تقولي "${raw}"؟</b>`
                : `This is new to me.. <b>What should I say when you say "${raw}"?</b>`;
        }

        AIAssistant.appendMessage(reply, 'ai');
        if (chips.length > 0) AIAssistant.showChips(chips);
    },

    handleWizard: (input) => {
        const wiz = AIAssistant.wizard;
        const isAr = (localStorage.getItem('al_raed_lang') || 'ar') === 'ar';
        
        // --- TASK WIZARD ---
        if (wiz.type === 'task') {
            if (wiz.step === 1) {
                wiz.data.title = input;
                wiz.step = 2;
                AIAssistant.appendMessage(isAr ? "تمام، وايه <b>الوصف</b>؟" : "Great, and the <b>description</b>?", 'ai');
            } else if (wiz.step === 2) {
                wiz.data.desc = input;
                wiz.step = 3;
                AIAssistant.appendMessage(isAr ? "الأولوية إيه؟" : "Priority?", 'ai');
                AIAssistant.showChips(isAr ? [{text:"عالية"},{text:"متوسطة"},{text:"ضعيفة"}] : [{text:"High"},{text:"Medium"},{text:"Low"}]);
            } else if (wiz.step === 3) {
                const pMap = { 'عالية': 'high', 'متوسطة': 'medium', 'ضعيفة': 'low', 'high': 'high', 'medium': 'medium', 'low': 'low' };
                wiz.data.priority = pMap[input] || 'medium';
                AIAssistant.saveTaskLocally(wiz.data);
                AIAssistant.appendMessage(isAr ? `تم بنجاح! ✅ سجلت المهمة: <b>"${wiz.data.title}"</b>.` : `Done! ✅ Recorded: <b>"${wiz.data.title}"</b>.`, 'ai');
                AIAssistant.resetStates();
            }
        }
        // --- EXPENSE WIZARD ---
        else if (wiz.type === 'expense') {
            if (wiz.step === 1) {
                wiz.data.amount = parseFloat(input) || 0;
                wiz.step = 2;
                AIAssistant.appendMessage(isAr ? "تمام، <b>الوصف</b> إيه؟" : "Okay, <b>description</b>?", 'ai');
            } else if (wiz.step === 2) {
                wiz.data.description = input;
                wiz.step = 3;
                AIAssistant.appendMessage(isAr ? "التصنيف إيه؟" : "Category?", 'ai');
                AIAssistant.showChips(isAr ? [{text:"رواتب"},{text:"إيجار"},{text:"مشتريات"},{text:"أخرى"}] : [{text:"Salaries"},{text:"Rent"},{text:"Purchases"},{text:"Other"}]);
            } else if (wiz.step === 3) {
                wiz.data.category = input;
                AIAssistant.saveExpenseLocally(wiz.data);
                AIAssistant.appendMessage(isAr ? `تم تسجيل المصروف بقيمة <b>${wiz.data.amount}</b> بنجاح! 💸` : `Expense of <b>${wiz.data.amount}</b> recorded successfully! 💸`, 'ai');
                AIAssistant.resetStates();
            }
        }
        // --- CLIENT WIZARD ---
        else if (wiz.type === 'client') {
            if (wiz.step === 1) {
                wiz.data.name = input;
                wiz.step = 2;
                AIAssistant.appendMessage(isAr ? "الشركة إيه؟" : "Which company?", 'ai');
            } else if (wiz.step === 2) {
                wiz.data.company = input;
                wiz.step = 3;
                AIAssistant.appendMessage(isAr ? "الإيميل إيه؟" : "What is the email?", 'ai');
            } else if (wiz.step === 3) {
                wiz.data.email = input;
                AIAssistant.saveClientLocally(wiz.data);
                AIAssistant.appendMessage(isAr ? `تم إضافة العميل <b>${wiz.data.name}</b> بنجاح! 🤝` : `Client <b>${wiz.data.name}</b> added successfully! 🤝`, 'ai');
                AIAssistant.resetStates();
            }
        }
    },

    saveTaskLocally: (data) => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const newTask = {
            id: 'task_' + Date.now(),
            title: data.title,
            description: data.desc,
            priority: data.priority,
            status: 'todo',
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        if (typeof TasksManager !== 'undefined') TasksManager.render();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    },

    saveExpenseLocally: (data) => {
        const finance = JSON.parse(localStorage.getItem('finance')) || [];
        const newExpense = {
            id: 'fin_' + Date.now(),
            type: 'expense',
            amount: data.amount,
            description: data.description,
            category: data.category,
            date: new Date().toISOString().split('T')[0]
        };
        finance.push(newExpense);
        localStorage.setItem('finance', JSON.stringify(finance));
        if (typeof FinanceManager !== 'undefined') FinanceManager.renderExpenses();
        if (typeof App !== 'undefined') App.updateDashboardStats();
    },

    saveClientLocally: (data) => {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        const newClient = {
            id: 'client_' + Date.now(),
            name: data.name,
            company: data.company,
            email: data.email,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        clients.push(newClient);
        localStorage.setItem('clients', JSON.stringify(clients));
        if (typeof ClientsManager !== 'undefined') ClientsManager.render();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    let retries = 0;
    const starter = setInterval(() => {
        if (typeof AuthManager !== 'undefined' && AuthManager.currentUser) { AIAssistant.init(); clearInterval(starter); }
        if (retries++ > 10) clearInterval(starter);
    }, 1000);
});
