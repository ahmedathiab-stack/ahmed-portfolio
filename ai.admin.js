const AI_CONFIG = {
    activeModel: "llama-3.3-70b-versatile", // Gemini Mode
    masterControlEnabled: true,
    backendFiles: [],
    reports: []
};

window.AIEngine = {
    toggleMasterAI: function() {
        AI_CONFIG.masterControlEnabled = document.getElementById('ai-master-switch').checked;
        if (!AI_CONFIG.masterControlEnabled) alert("🛑 تم إيقاف الذكاء الاصطناعي عن التحكم والتعلم بشكل كامل. لا يمكنه تعديل الموقع الآن.");
        else alert("🟢 تم إعادة تفعيل صلاحيات الذكاء الاصطناعي بنجاح.");
    },

    setAITheme: function(themeName) {
        const box = document.getElementById('gemini-admin-box');
        if (!box) return;
        
        box.classList.remove('theme-gemini', 'theme-chatgpt');
        box.classList.add(`theme-${themeName}`);
        
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-theme-${themeName}`).classList.add('active');
        
        // التحول الحقيقي: تغيير الموديل والشخصية
        if (themeName === 'gemini') {
            AI_CONFIG.activeModel = "llama-3.3-70b-versatile"; 
            console.log("Switched to Creative Gemini Personality.");
        } else {
            AI_CONFIG.activeModel = "mixtral-8x7b-32768"; 
            console.log("Switched to Analytical ChatGPT Personality.");
        }
    },

    toggleGeminiAdmin: function() {
        if (!window.App || !window.App.isAdminLoggedIn) { alert("⚠️ يرجى تسجيل الدخول كمسؤول أولاً."); return; }
        const box = document.getElementById('gemini-admin-box');
        const isVis = box.style.display === 'flex';
        box.style.display = isVis ? 'none' : 'flex';
    },

    switchGeminiTab: function(tabId, btn) {
        document.querySelectorAll('.gemini-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.gemini-tab').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        btn.classList.add('active');
    },

    addAIBackendFile: function() {
        const title = document.getElementById('ai-backend-name').value;
        const content = document.getElementById('ai-backend-content').value;
        if(!title || !content) return alert("يرجى إدخال اسم ومحتوى الملف!");
        
        AI_CONFIG.backendFiles.push({ title, content });
        alert(`💾 تم حفظ ملف [${title}] في ذاكرة الذكاء الإداري المعزولة.`);
        document.getElementById('ai-backend-name').value = '';
        document.getElementById('ai-backend-content').value = '';
        this.renderBackendFiles();
    },

    renderBackendFiles: function() {
        const list = document.getElementById('ai-backend-list');
        list.innerHTML = AI_CONFIG.backendFiles.map(f => `<div style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:5px; border-radius:5px;">📁 ${f.title}</div>`).join('');
    },

    runGeminiCommand: async function() {
        if (!AI_CONFIG.masterControlEnabled) {
            return alert("🛑 الذكاء الاصطناعي مجمد حالياً بأمر المسؤول. قم بتفعيله من المفتاح الأعلى.");
        }

        const apiKey = localStorage.getItem('admin_ai_keys')?.split('\n')[0];
        if (!apiKey) return alert("لم يتم العثور على مفاتيح الذكاء الاصطناعي.");

        const command = document.getElementById('gemini-cmd-input').value;
        if (!command) return;

        document.getElementById('gemini-cmd-input').value = 'جاري التفكير والتنفيذ...';

        const extraKnowledge = AI_CONFIG.backendFiles.map(f => `FILE [${f.title}]: ${f.content}`).join('\n');
        
        const systemPrompt = `You are the Supreme AI Admin Engine. 
Database: ${JSON.stringify(window.App.cachedDb)}
Extra Backend Memory: ${extraKnowledge}
Return ONLY a JSON object: {"updatedData": { merged db }, "message": "Arabic report"}`;

        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: AI_CONFIG.activeModel,
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: command }],
                    response_format: { type: "json_object" }
                })
            });
            const data = await res.json();
            const content = JSON.parse(data.choices[0].message.content);

            if (content.updatedData) {
                await window.Store.saveKnowledge(content.updatedData);
                AI_CONFIG.reports.push({ cmd: command, res: content.message });
                alert("🤖 " + content.message);
                document.getElementById('gemini-cmd-input').value = '';
                this.renderReports();
            }
        } catch (err) {
            alert("❌ حدث خطأ أثناء تنفيذ الأمر.");
            document.getElementById('gemini-cmd-input').value = command;
        }
    },

    renderReports: function() {
        document.getElementById('gemini-reports-container').innerHTML = AI_CONFIG.reports.map(r => `
            <div style="background:rgba(255,255,255,0.1); padding:15px; margin-bottom:10px; border-radius:10px;">
                <strong style="color:var(--ai-accent);">الأمر:</strong> ${r.cmd}<br>
                <strong>النتيجة:</strong> ${r.res}
            </div>
        `).join('');
    }
};
