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
        AIAssistant.showWelcome();

        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        const clearBtn = document.getElementById('ai-clear-btn');
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const closeBtn = document.getElementById('ai-close-btn');
        const chatWin = document.getElementById('ai-chat-window');
        const voiceBtn = document.createElement('button');
        voiceBtn.id = 'ai-voice-btn';
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.style.cssText = 'background:var(--bg-primary);border:1px solid var(--border-color);color:var(--primary-color);width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--transition);';
        
        // Insert voice button before send button
        if (sendBtn && sendBtn.parentNode) {
            sendBtn.parentNode.insertBefore(voiceBtn, sendBtn);
        }

        const handleSend = () => {
            const val = input.value.trim();
            if (!val) return;
            AIAssistant.appendMessage(val, 'user');
            input.value = '';
            AIAssistant.think(val);
        };

        if (toggleBtn) toggleBtn.onclick = () => chatWin.style.display === 'flex' ? chatWin.style.display = 'none' : chatWin.style.display = 'flex';
        if (closeBtn) closeBtn.onclick = () => chatWin.style.display = 'none';
        if (clearBtn) clearBtn.onclick = () => { 
            document.getElementById('ai-messages').innerHTML = ''; 
            AIAssistant.resetStates();
            AIAssistant.showWelcome(); 
        };
        if (sendBtn) sendBtn.onclick = handleSend;
        if (input) input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };
        if (voiceBtn) voiceBtn.onclick = () => AIAssistant.startListening();
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
            AIAssistant.think(transcript);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            voiceBtn.style.background = 'var(--bg-primary)';
            voiceBtn.style.color = 'var(--primary-color)';
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceBtn.style.background = 'var(--bg-primary)';
            voiceBtn.style.color = 'var(--primary-color)';
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
    },

    speak: (text) => {
        const msg = new SpeechSynthesisUtterance();
        msg.text = text.replace(/<[^>]*>/g, ''); // Strip HTML
        msg.lang = 'ar-EG';
        msg.rate = 1.0;
        msg.pitch = 1.0;
        window.speechSynthesis.speak(msg);
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

    appendMessage: (text, sender) => {
        const container = document.getElementById('ai-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.style.cssText = sender === 'user' 
            ? 'background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;padding:0.75rem 0.9rem;border-radius:18px;margin-bottom:0.6rem;align-self:flex-end;max-width:85%;word-break:break-word;'
            : 'background:var(--bg-secondary);border:1px solid var(--border-color);padding:0.75rem 0.9rem;border-radius:18px;margin-bottom:0.6rem;align-self:flex-start;max-width:85%;line-height:1.6;color:var(--text-primary);';
        div.innerHTML = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    think: (msg) => {
        const raw = msg.toLowerCase().trim();
        
        // ── WIZARD MODE (The Smart Form Filler) ──
        if (AIAssistant.wizard.active) {
            AIAssistant.handleWizard(msg);
            return;
        }

        // ── LEARNING MODE ──
        if (AIAssistant.learningTarget) {
            const learned = JSON.parse(localStorage.getItem('ai_permanent_memory')) || {};
            learned[AIAssistant.learningTarget] = msg;
            localStorage.setItem('ai_permanent_memory', JSON.stringify(learned));
            AIAssistant.appendMessage(`فهمت يا مدير! ✅ سجلت الرد ده لـ "${AIAssistant.learningTarget}".`, 'ai');
            AIAssistant.learningTarget = null;
            return;
        }

        // ── Check Permanent Memory ──
        const learned = JSON.parse(localStorage.getItem('ai_permanent_memory')) || {};
        if (learned[raw]) { AIAssistant.appendMessage(learned[raw], 'ai'); return; }

        let reply = "";
        let topic = null;
        const isAr = (localStorage.getItem('al_raed_lang') || 'ar') === 'ar';

        // ── TRIGGER WIZARD ──
        if (raw.match(/ضيف مهمة|سجل شغل|جدولة مهمة|مهمة جديدة|add task|new task/)) {
            AIAssistant.wizard = { active: true, type: 'task', step: 1, data: {} };
            reply = isAr 
                ? "من عيوني يا مدير! 🫡 خلينا نسجل المهمة دي.. <b>إيه هو عنوان المهمة؟</b>"
                : "Sure Director! 🫡 Let's record this task.. <b>What is the task title?</b>";
            AIAssistant.appendMessage(reply, 'ai');
            return;
        }

        // ── CORE LOGIC ──
        if (raw.match(/انا مين|اسمي|عارفني|وظيفتي|وظيفه|who am i|my name|my role/)) {
            const me = AuthManager.currentUser;
            reply = isAr 
                ? `إنت الباشا والمدير بتاعنا <b>${me?.name}</b>، ووظيفتك <b>${me?.title || 'مدير النظام'}</b>. 👑`
                : `You are our leader <b>${me?.name}</b>, your role is <b>${me?.title || 'System Admin'}</b>. 👑`;
        }
        else if (raw.match(/(\d+)\s*([\+\-\*\/xX])\s*(\d+)/)) {
            const m = raw.replace(/x/gi, '*').match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
            try { reply = isAr ? `الحسبة: <b>${m[0]} = ${eval(m[0])}</b>. حسبتها في ثانية! 😎` : `Result: <b>${m[0]} = ${eval(m[0])}</b>. Calculated in a second! 😎`; } catch(e){}
        }
        else if (raw.match(/فريق|اعضاء|ناس|وحوش|رجالة|team|members/) || (AIAssistant.lastTopic === 'team' && raw.match(/مين|هو|هما|who/))) {
            topic = 'team';
            const users = JSON.parse(localStorage.getItem('users')) || [];
            reply = isAr ? `الفريق فيه <b>${users.length}</b> وحوش حالياً.` : `The team has <b>${users.length}</b> members currently.`;
            if (raw.match(/مين|اسم|name|who/)) reply += isAr ? `<br>الأسماء: ` + users.map(u => u.name).join(' ، ') : `<br>Names: ` + users.map(u => u.name).join(', ');
        }
        else if (raw.match(/فلوس|مالي|ارباح|دخل|صرف|ديون|finance|money|profit|expenses/)) {
            topic = 'finance';
            const fin = JSON.parse(localStorage.getItem('finance')) || [];
            const inc = fin.filter(f=>f.type==='income').reduce((a,b)=>a+parseFloat(b.amount||0),0);
            const exp = fin.filter(f=>f.type==='expense').reduce((a,b)=>a+parseFloat(b.amount||0),0);
            reply = isAr 
                ? `الميزانية: دخل (${inc})، صرف (${exp})، والصافي <b>${inc-exp}</b>.`
                : `Finance: Income (${inc}), Expenses (${exp}), Net Profit: <b>${inc-exp}</b>.`;
        }
        else if (raw.match(/مهمة|مهام|شغل|tasks|work/)) {
            topic = 'tasks';
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            reply = isAr 
                ? `عندنا ${tasks.length} مهمة، وفاضل <b>${tasks.filter(t=>t.status!=='done').length}</b> لسه مخلصوش.`
                : `We have ${tasks.length} tasks, and <b>${tasks.filter(t=>t.status!=='done').length}</b> are still pending.`;
        }
        else if (raw.match(/ازيك|عامل|اهلا|سلام|بطمن|hi|hello|how are you/)) {
            reply = isAr ? "أنا تمام جداً يا مدير! المنصة كلها تحت أمرك، تحب أعملك إيه؟" : "I am doing great Director! The platform is at your service, what can I do for you?";
        }

        if (!reply) {
            AIAssistant.learningTarget = raw;
            reply = isAr 
                ? `الكلمة دي جديدة عليا يا مدير.. <b>تحب أرد عليك أقول إيه لما تقولي "${raw}"؟</b>`
                : `This word is new to me Director.. <b>What should I say when you say "${raw}"?</b>`;
        }

        AIAssistant.lastTopic = topic;
        AIAssistant.appendMessage(reply, 'ai');
        // AIAssistant.speak(reply); // Removed sound as per user request
    },

    // ── THE WIZARD HANDLER ──
    handleWizard: (input) => {
        const wiz = AIAssistant.wizard;
        const isAr = (localStorage.getItem('al_raed_lang') || 'ar') === 'ar';
        if (wiz.type === 'task') {
            if (wiz.step === 1) {
                wiz.data.title = input;
                wiz.step = 2;
                AIAssistant.appendMessage(isAr ? "تمام، وايه <b>الوصف</b> بتاع المهمة دي؟" : "Great, and what is the <b>description</b> for this task?", 'ai');
            } else if (wiz.step === 2) {
                wiz.data.desc = input;
                wiz.step = 3;
                AIAssistant.appendMessage(isAr ? "ماشي يا مدير، تحب تكون <b>الأولوية</b> إيه؟ (عالية، متوسطة، ضعيفة)" : "Alright Director, what should be the <b>priority</b>? (High, Medium, Low)", 'ai');
            } else if (wiz.step === 3) {
                const pMap = { 'عالية': 'high', 'متوسطة': 'medium', 'ضعيفة': 'low', 'high': 'high', 'medium': 'medium', 'low': 'low', 'High': 'high', 'Medium': 'medium', 'Low': 'low' };
                wiz.data.priority = pMap[input] || 'medium';
                
                AIAssistant.saveTaskLocally(wiz.data);
                const successMsg = isAr 
                    ? `تم بنجاح! ✅ سجلت لك المهمة بعنوان <b>"${wiz.data.title}"</b> وهي جاهزة دلوقتي في قسم المهام.`
                    : `Success! ✅ I've recorded the task titled <b>"${wiz.data.title}"</b> and it's now ready in the tasks section.`;
                AIAssistant.appendMessage(successMsg, 'ai');
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
    }
};

window.addEventListener('DOMContentLoaded', () => {
    let retries = 0;
    const starter = setInterval(() => {
        if (AuthManager && AuthManager.currentUser) { AIAssistant.init(); clearInterval(starter); }
        if (retries++ > 10) clearInterval(starter);
    }, 1000);
});
