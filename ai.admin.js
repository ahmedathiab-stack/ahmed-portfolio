// =========================================================
//  Administrative AI Engine (AIEngine v9.0)
// =========================================================

const AI_CONFIG = {
    KEYS: [],
    MODEL: "llama-3.3-70b-versatile",
    internetLearningEnabled: true,
    geminiLearningHistory: [],
    hudaLearningHistory: [],
    hudaVisitorLogs: [],
    hudaCustomTips: "You are a professional, friendly secretary, and you strictly adhere to the official website data with utmost accuracy."
};

window.AI_CONFIG = AI_CONFIG;

function getAdminApiKey() {
    const savedKeys = localStorage.getItem('admin_ai_keys');
    const keys = savedKeys ? savedKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean) : [];
    if (!keys.length) {
        alert("⚠️ لم يتم العثور على مفاتيح API لـ Gemini. يرجى إضافتها من خزنة المفاتيح في لوحة التحكم.");
        return "";
    }
    return keys[Math.floor(Math.random() * keys.length)];
}

window.AIEngine = {
    cleanText: function(text) {
        if (!text || typeof text !== 'string') return text || '';
        return text.replace(/\b(aden|abien)\s+university\b/gi, "Abyan University").replace(/\babien\b/gi, "Abyan");
    },
    
    setAITheme: function(themeName) {
        const box = document.getElementById('gemini-admin-box');
        if (!box) return;
        
        box.classList.remove('theme-gemini', 'theme-chatgpt');
        box.classList.add(`theme-${themeName}`);
        
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-theme-${themeName}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        localStorage.setItem('preferred_ai_theme', themeName);
    },

    syncAdminDB: async function() {
        const rawUrl = localStorage.getItem('db_ai_url');
        if (!rawUrl) return;
        const url = window.Store && window.Store.sanitizeUrl ? window.Store.sanitizeUrl(rawUrl) : rawUrl;
        try { 
            await fetch(url, { 
                method: 'PUT', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify(AI_CONFIG.geminiLearningHistory) 
            }); 
        } catch(e){}
    },

    syncHudaDB: async function() {
        const rawUrl = localStorage.getItem('db_huda_url');
        if (!rawUrl) return;
        const url = window.Store && window.Store.sanitizeUrl ? window.Store.sanitizeUrl(rawUrl) : rawUrl;
        try { 
            await fetch(url, { 
                method: 'PUT', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ 
                    logs: AI_CONFIG.hudaVisitorLogs, 
                    tips: AI_CONFIG.hudaCustomTips, 
                    history: AI_CONFIG.hudaLearningHistory 
                }) 
            }); 
        } catch(e){}
    },

    toggleInternetLearning: function() {
        const checkbox = document.getElementById('internet-learning-toggle');
        AI_CONFIG.internetLearningEnabled = checkbox ? checkbox.checked : true;
        alert(AI_CONFIG.internetLearningEnabled ? "🌐 تم تفعيل التعلم والبحث المستمر من الإنترنت بنجاح." : "🛑 تم إيقاف التعلم والبحث المستمر من الإنترنت.");
    },

    saveHudaTips: function() {
        const tipsInput = document.getElementById('huda-tips-input');
        if (!tipsInput) return;
        const tips = tipsInput.value.trim();
        if (!tips) return alert("الرجاء إدخال نصيحة أو توجيه صحيح.");
        
        AI_CONFIG.hudaCustomTips = tips;
        this.syncHudaDB();
        alert("✅ تم تحديث وإرسال النصائح والتوجيهات الجديدة لهدى بنجاح لتطبيقها فوراً في إجاباتها!");
        this.updateReportsView();
    },

    toggleGeminiAdmin: function() {
        if (!window.App || !window.App.isAdminLoggedIn) {
            alert("⚠️ يرجى تسجيل الدخول إلى لوحة التحكم أولاً لفتح محرك جمناي.");
            return;
        }

        const box = document.getElementById('gemini-admin-box');
        if (!box) return;
        
        const savedTheme = localStorage.getItem('preferred_ai_theme') || 'gemini';
        this.setAITheme(savedTheme);

        const isVis = box.style.display === 'flex';
        box.style.display = isVis ? 'none' : 'flex';
        if (!isVis) this.loadMemoryView();
    },

    switchGeminiTab: function(tabId, btnElement) {
        document.querySelectorAll('.gemini-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.gemini-tab').forEach(b => b.classList.remove('active'));
        
        const target = document.getElementById(tabId);
        if (target) {
            target.style.display = 'block';
            target.classList.add('active');
        }

        if (btnElement) {
            btnElement.classList.add('active');
        }

        document.querySelectorAll('.gemini-tab-content:not(.active)').forEach(c => c.style.display = 'none');
    },

    runGeminiCommand: async function() {
        if (!window.App || !window.App.isAdminLoggedIn) {
            alert("⚠️ يرجى تسجيل الدخول إلى لوحة الإدارة أولاً لتنفيذ الأوامر.");
            return;
        }

        const apiKey = getAdminApiKey();
        if (!apiKey) return;

        const cmdInput = document.getElementById('gemini-cmd-input');
        const command = cmdInput ? cmdInput.value.trim() : '';
        if (!command) return alert("الرجاء كتابة الأمر المطلوب.");

        const currentDb = window.App.cachedDb || {};
        const systemPrompt = `You are Gemini Master Admin AI. Merge new info with existing database intelligently unless explicit deletion is requested.
CRITICAL: Return ONLY JSON object:
{
  "updatedData": { ... merged full database ... },
  "message": "Detailed Arabic report of changes made"
}
Existing Database: ${JSON.stringify(currentDb)}`;

        try {
            const res = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: AI_CONFIG.MODEL,
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: command }],
                    response_format: { type: "json_object" }
                })
            });
            const data = await res.json();
            let rawContent = data.choices[0].message.content;
            
            // تنظيف النص في حال تمت معالجته كـ Markdown
            rawContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            const content = JSON.parse(rawContent);

            if (content.updatedData && window.Store) {
                const saved = await window.Store.saveKnowledge(content.updatedData);
                if (saved) {
                    AI_CONFIG.geminiLearningHistory.unshift({
                        timestamp: new Date().toLocaleString('ar-YE'),
                        command: command,
                        report: content.message || "تم تنفيذ التعديل بنجاح"
                    });
                    this.syncAdminDB();
                    alert("🤖 " + (content.message || "تم تنفيذ التعديل بنجاح!"));
                    cmdInput.value = '';
                    this.loadMemoryView();
                }
            }
        } catch (err) {
            alert("❌ حدث خطأ أثناء تنفيذ الأمر عبر API.");
        }
    },

    trainGeminiMedia: async function() {
        const targetEntity = document.getElementById('train-target-entity').value;
        const type = document.getElementById('train-media-type').value;
        const content = document.getElementById('train-media-content').value;
        if (!content.trim()) return alert("الرجاء إدخال محتوى أو رابط المادة التدريبية.");

        const entry = {
            timestamp: new Date().toLocaleString('ar-YE'),
            type: type.toUpperCase(),
            content: content
        };

        if (targetEntity === 'huda') {
            AI_CONFIG.hudaLearningHistory.unshift(entry);
            this.syncHudaDB();
            alert("🧠 تم تدريب وتحديث ذاكرة هدى بالمحتوى الجديد بنجاح!");
        } else {
            AI_CONFIG.geminiLearningHistory.unshift({
                timestamp: entry.timestamp,
                command: `Train Media [${entry.type}]: ${content.substring(0, 50)}...`,
                report: "تم دمج محتوى الوسائط في النظام بنجاح."
            });
            this.syncAdminDB();
            const formattedCmd = `Learn and integrate this ${type} content into database without deleting old records: ${content}`;
            document.getElementById('gemini-cmd-input').value = formattedCmd;
            this.switchGeminiTab('g-cmd');
            await this.runGeminiCommand();
        }

        document.getElementById('train-media-content').value = '';
        this.updateReportsView();
    },

    loadMemoryView: function() {
        const memView = document.getElementById('gemini-memory-view');
        if (memView && window.App) {
            memView.innerText = JSON.stringify(window.App.cachedDb || {}, null, 2);
        }
        this.updateReportsView();
    },

    updateReportsView: function() {
        const reportContainer = document.getElementById('gemini-reports-container');
        if (!reportContainer) return;

        let html = `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="report-card" style="border-right-color: #4285f4;">
                    <h4 style="color:var(--ai-text-main);">📋 1. تقرير تعلم جمناي الإداري</h4>
                    ${AI_CONFIG.geminiLearningHistory.length === 0 ? '<span style="color:var(--ai-text-sec); font-size:0.9rem;">لا توجد عمليات تعلم مسجلة لجمناي بعد.</span>' : 
                        AI_CONFIG.geminiLearningHistory.map(item => `
                            <div class="report-item">
                                <span style="color:var(--ai-text-sec);">[${item.timestamp}]</span> <b style="color:var(--ai-text-main);">الأمر:</b> ${item.command}<br>
                                <span style="color:var(--ai-accent);"><b>النتيجة/التقرير:</b> ${item.report}</span>
                            </div>
                        `).join('')}
                </div>

                <div class="report-card" style="border-right-color: #25d366;">
                    <h4 style="color:var(--ai-text-main);">👩‍💼 2. تقرير تعلم هدى المستقل</h4>
                    ${AI_CONFIG.hudaLearningHistory.length === 0 ? '<span style="color:var(--ai-text-sec); font-size:0.9rem;">لا توجد مواد تدريبية مخصصة لهدى مسجلة بعد.</span>' : 
                        AI_CONFIG.hudaLearningHistory.map(item => `
                            <div class="report-item">
                                <span style="color:var(--ai-text-sec);">[${item.timestamp}]</span> <b style="color:var(--ai-text-main);">النوع [${item.type}]:</b> ${item.content}
                            </div>
                        `).join('')}
                </div>

                <div class="report-card" style="border-right-color: #f59e0b;">
                    <h4 style="color:var(--ai-text-main);">💬 3. تقرير هدى عن الزوار والمحادثات</h4>
                    <div style="background:var(--ai-bg-tertiary); padding:12px; border-radius:var(--ai-radius); margin-bottom:15px; border: 1px solid var(--ai-border);">
                        <label style="color:var(--ai-text-main); font-size:0.9rem; display:block; margin-bottom:6px;">💡 نصائح وتوجيهات لتحسين إجابات هدى:</label>
                        <textarea id="huda-tips-input" style="background:var(--ai-bg-main); color:var(--ai-text-main); border:1px solid var(--ai-border); padding:10px; border-radius:var(--ai-radius); height:80px; font-size:0.9rem; width:100%; margin-bottom:10px; font-family:inherit;">${AI_CONFIG.hudaCustomTips}</textarea>
                        <button onclick="AIEngine.saveHudaTips()" class="gemini-btn" style="width:100%; margin-top:0;">حفظ وتطبيق النصائح على هدى 🚀</button>
                    </div>

                    <div style="max-height: 250px; overflow-y: auto;">
                        ${AI_CONFIG.hudaVisitorLogs.length === 0 ? '<span style="color:var(--ai-text-sec); font-size:0.9rem;">لا توجد أسئلة من الزوار حتى الآن.</span>' : 
                            AI_CONFIG.hudaVisitorLogs.map(log => `
                                <div class="report-item">
                                    <span style="color:var(--ai-text-sec);">[${log.timestamp}]</span> <b style="color:var(--ai-text-main);">سؤال الزائر:</b> ${log.question}<br>
                                    <span style="color:var(--ai-accent);"><b>رد هدى:</b> ${log.reply || 'جاري الرد...'}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            </div>
        `;

        reportContainer.innerHTML = html;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.gemini-tab-content:not(.active)').forEach(c => c.style.display = 'none');
});
