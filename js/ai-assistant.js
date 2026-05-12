/**
 * Al-Raed AI Assistant — Full UI + Voice + Wizard + Memory System
 * Powered by AICore NLU Engine
 */
const AIAssistant = {
    state: {
        wizard: { active: false, type: null, step: 0, data: {} },
        listening: false,
        recognition: null
    },

    // ─── Init ─────────────────────────────────────────────────────────────
    init: () => {
        if (!AuthManager.currentUser) return;
        AIAssistant._injectStyles();
        AIAssistant._buildUI();
        AIAssistant._bindEvents();
        AIAssistant._loadHistory();
        AIAssistant._initVoice();
        console.log('✅ Al-Raed AI Assistant V8 Initialized');
    },

    // ─── UI Builder ───────────────────────────────────────────────────────
    _buildUI: () => {
        // Remove old widget if exists
        const old = document.getElementById('ai-assistant-widget');
        if (old) old.remove();

        const isAr = document.documentElement.dir === 'rtl';
        const widget = document.createElement('div');
        widget.id = 'ai-assistant-widget';
        widget.style.cssText = `position:fixed;bottom:24px;${isAr?'left':'right'}:16px;z-index:9999;display:flex;flex-direction:column;align-items:${isAr?'flex-start':'flex-end'};gap:12px;`;

        widget.innerHTML = `
        <!-- Chat Window -->
        <div id="ai-chat-window" style="display:none;width:min(380px, calc(100vw - 32px));height:min(600px, calc(100dvh - 100px));border-radius:20px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);flex-direction:column;background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);border:1px solid rgba(99,102,241,0.3);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🤖</div>
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:0.95rem;">الرائد الذكي (Al-Raed AI)</div>
                        <div style="font-size:0.7rem;color:rgba(255,255,255,0.7);display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;animation:pulse 2s infinite;"></span> نظام الذكاء المركزي</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button id="ai-voice-btn" title="أوامر صوتية" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:0.85rem;transition:all 0.2s;">🎙️</button>
                    <button id="ai-clear-btn" title="مسح المحادثة" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:0.85rem;transition:all 0.2s;">🗑️</button>
                    <button id="ai-close-btn" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:1rem;font-weight:700;transition:all 0.2s;">✕</button>
                </div>
            </div>

            <!-- Live Status Bar -->
            <div id="ai-status-bar" style="background:rgba(79,70,229,0.15);border-bottom:1px solid rgba(99,102,241,0.2);padding:0.5rem 1rem;font-size:0.72rem;color:rgba(255,255,255,0.6);display:flex;gap:12px;flex-wrap:wrap;flex-shrink:0;"></div>

            <!-- Messages -->
            <div id="ai-messages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0;scrollbar-width:thin;scrollbar-color:rgba(99,102,241,0.3) transparent;"></div>

            <!-- Typing Indicator -->
            <div id="ai-typing" style="display:none;padding:0 1rem 0.5rem;color:rgba(255,255,255,0.5);font-size:0.8rem;flex-shrink:0;">
                <span style="display:inline-flex;gap:3px;align-items:center;">الرائد يفكر<span class="ai-dot">.</span><span class="ai-dot">.</span><span class="ai-dot">.</span></span>
            </div>

            <!-- Chips Row -->
            <div id="ai-chips" style="padding:0 1rem 0.5rem;display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;"></div>

            <!-- Input -->
            <div style="padding:0.75rem;background:rgba(0,0,0,0.2);border-top:1px solid rgba(99,102,241,0.2);display:flex;gap:8px;align-items:center;flex-shrink:0;">
                <input id="ai-input" type="text" placeholder="اكتب أي شيء... (مثلاً: مين شغال؟)" autocomplete="off"
                    style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:0.6rem 1rem;color:#fff;font-size:0.88rem;outline:none;font-family:inherit;"/>
                <button id="ai-send-btn" style="width:38px;height:38px;border-radius:12px;border:none;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;">➤</button>
            </div>
        </div>

        <!-- Toggle Button -->
        <button id="ai-toggle-btn" style="width:56px;height:56px;border-radius:50%;border:none;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:1.5rem;cursor:pointer;box-shadow:0 8px 24px rgba(79,70,229,0.5);transition:all 0.3s;position:relative;">
            🤖
            <span id="ai-notif-dot" style="display:none;position:absolute;top:2px;right:2px;width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid #1e293b;"></span>
        </button>`;

        document.body.appendChild(widget);
        AIAssistant._updateStatusBar();
        setInterval(AIAssistant._updateStatusBar, 30000);
    },

    _updateStatusBar: () => {
        const bar = document.getElementById('ai-status-bar');
        if (!bar || !window.AICore) return;
        const snap = AICore.awareness.snapshot();
        bar.innerHTML = `
            <span>🟢 ${snap.activeTeam.length} أونلاين</span>
            <span>📋 ${snap.tasks.filter(t=>t.status!=='done').length} مهمة</span>
            <span>⚠️ ${snap.overdue.length} متأخرة</span>
            <span>📅 ${snap.todayEvents.length} موعد اليوم</span>`;
    },

    // ─── Events ───────────────────────────────────────────────────────────
    _bindEvents: () => {
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const closeBtn  = document.getElementById('ai-close-btn');
        const clearBtn  = document.getElementById('ai-clear-btn');
        const sendBtn   = document.getElementById('ai-send-btn');
        const input     = document.getElementById('ai-input');
        const voiceBtn  = document.getElementById('ai-voice-btn');
        const chatWin   = document.getElementById('ai-chat-window');

        if (toggleBtn) toggleBtn.onclick = () => {
            const shown = chatWin.style.display === 'flex';
            chatWin.style.display = shown ? 'none' : 'flex';
            if (!shown) {
                document.getElementById('ai-notif-dot').style.display = 'none';
                if (!document.getElementById('ai-messages').children.length) AIAssistant._welcome();
                AIAssistant._updateStatusBar();
            }
        };

        if (closeBtn)  closeBtn.onclick  = () => { chatWin.style.display = 'none'; };
        if (clearBtn)  clearBtn.onclick  = () => {
            document.getElementById('ai-messages').innerHTML = '';
            document.getElementById('ai-chips').innerHTML = '';
            localStorage.removeItem('ai_chat_history');
            AIAssistant.state.wizard = { active:false, type:null, step:0, data:{} };
            AIAssistant._welcome();
        };
        if (sendBtn)   sendBtn.onclick   = AIAssistant._send;
        if (voiceBtn)  voiceBtn.onclick  = AIAssistant._toggleVoice;
        if (input)     input.onkeydown   = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); AIAssistant._send(); } };
    },

    _send: () => {
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        AIAssistant._addMsg(text, 'user');
        document.getElementById('ai-chips').innerHTML = '';
        AIAssistant._process(text);
    },

    _process: (text) => {
        AIAssistant._showTyping(true);
        setTimeout(() => {
            AIAssistant._showTyping(false);
            AIAssistant._think(text);
        }, 400 + Math.random() * 500);
    },

    _think: (msg) => {
        // Wizard mode active?
        if (AIAssistant.state.wizard.active) {
            AIAssistant._handleWizard(msg);
            return;
        }

        if (!window.AICore) {
            AIAssistant._addMsg('جاري تحميل النواة الذكية...', 'ai');
            return;
        }

        const { intent } = AICore.detectIntent(msg);
        const snap = AICore.awareness.snapshot();
        const result = AICore.buildResponse(intent, snap);

        AIAssistant._addMsg(result.text, 'ai');

        if (result.wizard) {
            AIAssistant.state.wizard = { active:true, ...result.wizard, data:{} };
        }
        if (result.chips && result.chips.length) {
            AIAssistant._showChips(result.chips);
        }
    },

    // ─── Wizard System ────────────────────────────────────────────────────
    _handleWizard: (input) => {
        const wiz = AIAssistant.state.wizard;
        const done = () => { AIAssistant.state.wizard = { active:false, type:null, step:0, data:{} }; };

        if (wiz.type === 'task') {
            if (wiz.step === 1) { wiz.data.title = input; wiz.step = 2; AIAssistant._addMsg('ما هو <b>وصف المهمة</b>؟ (أو اكتب "تخطي")', 'ai'); }
            else if (wiz.step === 2) { wiz.data.desc = input === 'تخطي' ? '' : input; wiz.step = 3; AIAssistant._addMsg('ما هي <b>الأولوية</b>؟ (عالية / متوسطة / منخفضة)', 'ai'); AIAssistant._showChips(['عالية','متوسطة','منخفضة']); }
            else if (wiz.step === 3) {
                wiz.data.priority = input.includes('عال') ? 'high' : input.includes('منخ') ? 'low' : 'medium';
                const task = AICore.actions.createTask(wiz.data);
                AIAssistant._addMsg(`✅ تم إنشاء المهمة "<b>${task.title}</b>" بنجاح!`, 'ai');
                AIAssistant._showChips(['مهمة أخرى','عرض المهام']);
                done();
            }
        } else if (wiz.type === 'project') {
            if (wiz.step === 1) { wiz.data.name = input; wiz.step = 2; AIAssistant._addMsg('ما هو <b>وصف المشروع</b>؟', 'ai'); }
            else if (wiz.step === 2) {
                wiz.data.desc = input;
                const proj = AICore.actions.createProject(wiz.data);
                AIAssistant._addMsg(`✅ تم إنشاء مشروع "<b>${proj.name}</b>" بنجاح!`, 'ai');
                done();
            }
        } else if (wiz.type === 'event') {
            if (wiz.step === 1) { wiz.data.title = input; wiz.step = 2; AIAssistant._addMsg('ما هو <b>تاريخ الاجتماع</b>؟ (مثلاً: 2025-06-15)', 'ai'); }
            else if (wiz.step === 2) { wiz.data.date = input; wiz.step = 3; AIAssistant._addMsg('ما هو <b>الوقت</b>؟ (مثلاً: 10:00)', 'ai'); }
            else if (wiz.step === 3) {
                wiz.data.time = input;
                const ev = AICore.actions.createEvent(wiz.data);
                AIAssistant._addMsg(`✅ تم إنشاء الاجتماع "<b>${ev.title}</b>" بتاريخ ${ev.date} الساعة ${ev.time}`, 'ai');
                done();
            }
        } else if (wiz.type === 'expense') {
            if (wiz.step === 1) { wiz.data.amount = parseFloat(input) || 0; wiz.step = 2; AIAssistant._addMsg('ما هو <b>وصف المصروف</b>؟', 'ai'); }
            else if (wiz.step === 2) {
                wiz.data.desc = input;
                AICore.actions.createExpense(wiz.data);
                AIAssistant._addMsg(`✅ تم تسجيل مصروف <b>${wiz.data.amount} جنيه</b> — "${wiz.data.desc}" 💸`, 'ai');
                done();
            }
        } else if (wiz.type === 'broadcast') {
            if (wiz.step === 1) {
                AICore.actions.sendBroadcast(input);
                AIAssistant._addMsg(`📢 تم إرسال رسالتك للفريق كله: "<b>${input}</b>"`, 'ai');
                done();
            }
        }
    },

    // ─── Voice AI ─────────────────────────────────────────────────────────
    _initVoice: () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.lang = 'ar-EG';
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            document.getElementById('ai-input').value = transcript;
            AIAssistant._addMsg(transcript, 'user');
            document.getElementById('ai-chips').innerHTML = '';
            AIAssistant._process(transcript);
        };
        rec.onend = () => {
            AIAssistant.state.listening = false;
            const btn = document.getElementById('ai-voice-btn');
            if (btn) { btn.textContent = '🎙️'; btn.style.background = 'rgba(255,255,255,0.15)'; }
        };
        rec.onerror = () => rec.onend();
        AIAssistant.state.recognition = rec;
    },

    _toggleVoice: () => {
        const rec = AIAssistant.state.recognition;
        const btn = document.getElementById('ai-voice-btn');
        if (!rec) { AIAssistant._addMsg('⚠️ المتصفح لا يدعم الأوامر الصوتية.', 'ai'); return; }
        if (AIAssistant.state.listening) {
            rec.stop();
        } else {
            AIAssistant.state.listening = true;
            if (btn) { btn.textContent = '⏹️'; btn.style.background = 'rgba(239,68,68,0.4)'; }
            rec.start();
        }
    },

    // ─── UI Helpers ───────────────────────────────────────────────────────
    _addMsg: (text, sender, save = true) => {
        const container = document.getElementById('ai-messages');
        if (!container) return;

        const isUser = sender === 'user';
        const div = document.createElement('div');
        div.style.cssText = isUser
            ? 'background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:0.7rem 1rem;border-radius:16px 16px 4px 16px;margin-bottom:0.75rem;align-self:flex-end;max-width:80%;font-size:0.88rem;animation:aiFadeIn 0.25s ease;word-break:break-word;'
            : 'background:rgba(255,255,255,0.07);border:1px solid rgba(99,102,241,0.2);color:#e2e8f0;padding:0.7rem 1rem;border-radius:16px 16px 16px 4px;margin-bottom:0.75rem;align-self:flex-start;max-width:85%;font-size:0.88rem;line-height:1.6;animation:aiFadeIn 0.25s ease;word-break:break-word;';
        div.innerHTML = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        if (save) {
            const h = JSON.parse(localStorage.getItem('ai_chat_history') || '[]');
            h.push({ text, sender });
            localStorage.setItem('ai_chat_history', JSON.stringify(h.slice(-30)));
        }

        // Show notification dot if window is closed
        const chatWin = document.getElementById('ai-chat-window');
        if (sender === 'ai' && chatWin && chatWin.style.display === 'none') {
            const dot = document.getElementById('ai-notif-dot');
            if (dot) dot.style.display = 'block';
        }
    },

    _showChips: (chips) => {
        const container = document.getElementById('ai-chips');
        if (!container) return;
        container.innerHTML = '';
        chips.forEach(c => {
            const btn = document.createElement('button');
            btn.style.cssText = 'background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;padding:0.35rem 0.8rem;border-radius:20px;font-size:0.8rem;cursor:pointer;transition:all 0.2s;font-family:inherit;white-space:nowrap;';
            btn.textContent = c;
            btn.onmouseover = () => { btn.style.background = 'rgba(99,102,241,0.3)'; btn.style.color = '#fff'; };
            btn.onmouseout  = () => { btn.style.background = 'rgba(99,102,241,0.15)'; btn.style.color = '#a5b4fc'; };
            btn.onclick = () => {
                container.innerHTML = '';
                AIAssistant._addMsg(c, 'user');
                AIAssistant._process(c);
            };
            container.appendChild(btn);
        });
    },

    _showTyping: (show) => {
        const t = document.getElementById('ai-typing');
        if (t) t.style.display = show ? 'block' : 'none';
    },

    _welcome: () => {
        const me = AuthManager.currentUser;
        const name = me?.name?.split(' ')[0] || 'مدير';
        if (window.AICore) {
            const snap = AICore.awareness.snapshot();
            AIAssistant._addMsg(`أهلاً بك يا <b>${name}</b>! 👋<br>أنا الرائد — مساعدك التنفيذي الذكي.<br>🟢 ${snap.activeTeam.length} من فريقك أونلاين | 📋 ${snap.tasks.filter(t=>t.status!=='done').length} مهمة نشطة${snap.overdue.length ? ` | ⚠️ ${snap.overdue.length} متأخرة` : ' ✅'}<br>كيف يمكنني خدمتك؟`, 'ai', false);
        } else {
            AIAssistant._addMsg(`أهلاً بك يا <b>${name}</b>! 👋 أنا مساعدك الذكي. كيف أخدمك؟`, 'ai', false);
        }
        AIAssistant._showChips(['حالة المنصة','المهام المتأخرة','مهمة جديدة','أداء الفريق']);
    },

    _loadHistory: () => {
        const h = JSON.parse(localStorage.getItem('ai_chat_history') || '[]');
        if (!h.length) return;
        h.slice(-15).forEach(m => AIAssistant._addMsg(m.text, m.sender, false));
    },

    // ─── Styles ───────────────────────────────────────────────────────────
    _injectStyles: () => {
        if (document.getElementById('ai-styles')) return;
        const s = document.createElement('style');
        s.id = 'ai-styles';
        s.textContent = `
            @keyframes aiFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
            .ai-dot { animation: pulse 1.2s infinite; }
            .ai-dot:nth-child(2) { animation-delay: .2s; }
            .ai-dot:nth-child(3) { animation-delay: .4s; }
            #ai-messages::-webkit-scrollbar { width:4px; }
            #ai-messages::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3); border-radius:4px; }
            #ai-chat-window { display:none; }
            #ai-input::placeholder { color:rgba(255,255,255,0.3); }
            #ai-send-btn:hover { transform:scale(1.1); }
            #ai-toggle-btn:hover { transform:scale(1.1); box-shadow:0 12px 32px rgba(79,70,229,0.7); }
            /* ── Mobile Responsive ── */
            @media (max-width: 480px) {
                #ai-assistant-widget {
                    bottom: 16px !important;
                    left: 0 !important;
                    right: 0 !important;
                    align-items: center !important;
                    padding: 0 12px;
                }
                #ai-chat-window {
                    width: calc(100vw - 24px) !important;
                    max-height: calc(100dvh - 90px) !important;
                    border-radius: 16px !important;
                }
                #ai-messages {
                    min-height: 200px !important;
                }
                #ai-toggle-btn {
                    position: fixed;
                    bottom: 16px;
                    right: 16px;
                    left: auto !important;
                }
            }
            @media (max-width: 360px) {
                #ai-chat-window { border-radius: 12px !important; }
                #ai-input { font-size:0.82rem !important; padding: 0.5rem 0.75rem !important; }
            }
        `;
        document.head.appendChild(s);
    }
};

window.AIAssistant = AIAssistant;
// Called from App.init()
