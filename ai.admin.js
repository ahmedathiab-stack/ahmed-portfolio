const AI_CONFIG = {
    activeModel: "llama-3.3-70b-versatile",
    masterControlEnabled: true,
    backendFiles: [],
    reports: []
};

window.AIEngine = {
    toggleMasterAI: function() {
        AI_CONFIG.masterControlEnabled = document.getElementById('ai-master-switch').checked;
        if (!AI_CONFIG.masterControlEnabled) alert("🛑 تم إيقاف الذكاء الاصطناعي عن التحكم والتعلم بشكل كامل.");
        else alert("🟢 تم إعادة تفعيل صلاحيات الذكاء الاصطناعي بنجاح.");
    },

    setAITheme: function(themeName) {
        const box = document.getElementById('gemini-admin-box');
        if (!box) return;
        
        box.classList.remove('theme-gemini', 'theme-chatgpt');
        box.classList.add(`theme-${themeName}`);
        
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-theme-${themeName}`).classList.add('active');
        
        if (themeName === 'gemini') {
            AI_CONFIG.activeModel = "llama-3.3-70b-versatile"; 
        } else {
            AI_CONFIG.activeModel = "mixtral-8x7b-32768"; 
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
        list.innerHTML = AI_CONFIG.backendFiles.map(f => `<div style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:5px; border-radius:5px;">📁 ${escapeHtml(f.title)}</div>`).join('');
    },

    runGeminiCommand: async function() {
        if (!AI_CONFIG.masterControlEnabled) return alert("🛑 الذكاء الاصطناعي مجمد حالياً.");
        
        const command = document.getElementById('gemini-cmd-input').value;
        if (!command) return;

        document.getElementById('gemini-cmd-input').value = 'جاري المعالجة عبر الخادم الآمن...';

        try {
            const res = await fetch('/api/index?action=adminAi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            const data = await res.json();
            if (res.ok && data.report) {
                AI_CONFIG.reports.push({ cmd: command, res: data.report.response });
                alert("🤖 " + data.report.response);
                document.getElementById('gemini-cmd-input').value = '';
                this.renderReports();
                await window.App.renderAll();
            } else {
                alert("❌ خطأ: " + (data.error || 'فشل تنفيذ الأمر'));
                document.getElementById('gemini-cmd-input').value = command;
            }
        } catch (err) {
            alert("❌ حدث خطأ في الاتصال بالخادم.");
            document.getElementById('gemini-cmd-input').value = command;
        }
    },

    renderReports: function() {
        document.getElementById('gemini-reports-container').innerHTML = AI_CONFIG.reports.map(r => `
            <div style="background:rgba(255,255,255,0.1); padding:15px; margin-bottom:10px; border-radius:10px;">
                <strong style="color:var(--ai-accent);">الأمر:</strong> ${escapeHtml(r.cmd)}<br>
                <strong>النتيجة:</strong> ${escapeHtml(r.res)}
            </div>
        `).join('');
    }
};
