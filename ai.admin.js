// =========================================================
//  محرك الذكاء الاصطناعي المنفصل (AIEngine)
// =========================================================

const AI_CONFIG = {
    KEYS: ["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"],
    MODEL: "llama-3.3-70b-versatile"
};

let currentKeyIdx = 0;
function getApiKey() {
    if (!AI_CONFIG.KEYS.length) return "";
    const key = AI_CONFIG.KEYS[currentKeyIdx];
    currentKeyIdx = (currentKeyIdx + 1) % AI_CONFIG.KEYS.length;
    return key;
}

// =========================================================
//  حلقة التعلم والربط التفاعلي بين المساعد وجمناي الإداري
// =========================================================

window.AIEngine.sendPublicMessage = async function() {
    const input = document.getElementById('wa-chat-input');
    const msgBox = document.getElementById('wa-chat-messages');
    if (!input || !msgBox) return;
    const text = input.value.trim();
    if (!text) return;

    msgBox.innerHTML += `<div class="msg user-msg">${text}</div>`;
    input.value = '';
    msgBox.scrollTop = msgBox.scrollHeight;

    // 1️⃣ حفظ السؤال في سجل استفسارات الزوار المعلقة للتحليل
    if (window.App && window.App.cachedDb) {
        if (!window.App.cachedDb.visitor_queries) window.App.cachedDb.visitor_queries = [];
        window.App.cachedDb.visitor_queries.push({
            question: text,
            date: new Date().toISOString(),
            status: "pending"
        });
    }

    const kb = (window.App && window.App.cachedDb) ? window.App.cachedDb : {};
    const prompt = `You are the WhatsApp AI assistant for Trainer Ahmed Adel Naji Thiab. Reply in exact language of user query (Arabic/English). Be friendly, short, accurate. Knowledge Base: ${JSON.stringify(kb)}`;

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApiKey()}` },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [{ role: "system", content: prompt }, { role: "user", content: text }]
            })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]) {
            msgBox.innerHTML += `<div class="msg bot-msg">${data.choices[0].message.content}</div>`;
        }
    } catch (e) {
        msgBox.innerHTML += `<div class="msg bot-msg">أهلاً بك! يمكنك التواصل المباشر مع الأستاذ أحمد عادل عبر الواتساب: +967779087415</div>`;
    }
    msgBox.scrollTop = msgBox.scrollHeight;
};

// 2️⃣ تحليل أسئلة الزوار وتلقين المساعد الإجابات النموذجية مستقبلاً
window.AIEngine.analyzeAndTrainVisitorQueries = async function() {
    if (!window.App || !window.App.isAdminLoggedIn) return alert("⚠️ يرجى تسجيل الدخول للوحة الإدارة أولاً.");
    
    const db = window.App.cachedDb || {};
    const queries = db.visitor_queries || [];
    const pendingQueries = queries.filter(q => q.status === "pending");

    if (pendingQueries.length === 0) {
        return alert("ℹ️ لا توجد أسئلة جديدة غير محللة من الزوار في الوقت الحالي.");
    }

    const systemPrompt = `You are the Gemini Admin Learning Engine. 
Analyze these user questions asked to the WhatsApp Bot: ${JSON.stringify(pendingQueries)}.
Generate comprehensive Q&A/Knowledge updates for trainer Ahmed Adel Naji Thiab to train the public bot.

Return ONLY JSON:
{
  "faq_updates": [
    {"question": "سؤال الزائر", "learned_answer": "الإجابة النموذجية المعتمدة"}
  ],
  "updatedData": { ... full database incorporating new learned FAQs into 'faq' array ... },
  "report": "ملخص بالأسئلة التي تم تحليلها وتدريب المساعد عليها"
}`;

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApiKey()}` },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "حلل الأسئلة ودرّب المساعد" }],
                response_format: { type: "json_object" }
            })
        });

        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);

        if (content.updatedData) {
            // تحديث حالة الأسئلة إلى "منفذة ومحللة"
            content.updatedData.visitor_queries = queries.map(q => ({ ...q, status: "analyzed" }));
            
            const saved = await window.Store.saveKnowledge(content.updatedData);
            if (saved) {
                alert("🧠 " + (content.report || "تمت تحليل الأسئلة وتلقين المساعد بنجاح!"));
                this.loadMemoryView();
            }
        }
    } catch (e) {
        alert("❌ حدث خطأ أثناء تحليل بيانات الشات.");
    }
};    // 3. التحكم بشاشة جمناي الإدارية
    toggleGeminiAdmin: function() {
        const box = document.getElementById('gemini-admin-box');
        if (!box) return;
        const isVis = box.style.display === 'flex';
        box.style.display = isVis ? 'none' : 'flex';
        if (!isVis) this.loadMemoryView();
    },

    switchGeminiTab: function(tabId) {
        document.querySelectorAll('.gemini-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.gemini-tab').forEach(b => b.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
        if (event && event.target) event.target.classList.add('active');
    },

    // 4. تنفيذ أوامر الذكاء الاصطناعي والتحقق من الصلاحيات
    runGeminiCommand: async function() {
        if (!window.App || !window.App.isAdminLoggedIn) {
            alert("⚠️ يرجى تسجيل الدخول للوحة الإدارة أولاً لتنفيذ الأوامر.");
            return;
        }

        const cmdInput = document.getElementById('gemini-cmd-input');
        const command = cmdInput ? cmdInput.value.trim() : '';
        if (!command) return alert("الرجاء كتابة الأمر المطلوب.");

        const perms = {
            data: document.getElementById('perm-data')?.checked ?? true,
            design: document.getElementById('perm-design')?.checked ?? true,
            info: document.getElementById('perm-info')?.checked ?? true,
            keys: document.getElementById('perm-keys')?.checked ?? true
        };

        const db = window.App.cachedDb || {};
        const systemPrompt = `You are Gemini Master Admin AI.
Permissions Status:
- Data Modification: ${perms.data}
- Design Modification: ${perms.design}
- Personal Info Modification: ${perms.info}
- Key Management: ${perms.keys}

CRITICAL: Return ONLY JSON object:
{
  "updatedData": { ... full database ... },
  "message": "رسالة التقرير بالتفصيل عما تم تعديله"
}
Database: ${JSON.stringify(db)}`;

        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApiKey()}` },
                body: JSON.stringify({
                    model: AI_CONFIG.MODEL,
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: command }],
                    response_format: { type: "json_object" }
                })
            });
            const data = await res.json();
            const content = JSON.parse(data.choices[0].message.content);

            if (content.updatedData && window.Store) {
                const saved = await window.Store.saveKnowledge(content.updatedData);
                if (saved) {
                    alert("🤖 " + (content.message || "تم تنفيذ التعديل بنجاح!"));
                    cmdInput.value = '';
                    this.loadMemoryView();
                }
            }
        } catch (err) {
            alert("❌ حدث خطأ أثناء تنفيذ الأمر عبر API.");
        }
    },

    // 5. تدريب وسائط الذكاء الاصطناعي
    trainGeminiMedia: async function() {
        const type = document.getElementById('train-media-type').value;
        const content = document.getElementById('train-media-content').value;
        if (!content.trim()) return alert("الرجاء إدخال محتوى أو رابط المادة التدريبية.");

        const formattedCmd = `Learn this content [Type: ${type.toUpperCase()}]: ${content}`;
        document.getElementById('gemini-cmd-input').value = formattedCmd;
        this.switchGeminiTab('g-cmd');
        await this.runGeminiCommand();
    },

    loadMemoryView: function() {
        const memView = document.getElementById('gemini-memory-view');
        if (memView && window.App) {
            memView.innerText = JSON.stringify(window.App.cachedDb || {}, null, 2);
        }
    }
};
