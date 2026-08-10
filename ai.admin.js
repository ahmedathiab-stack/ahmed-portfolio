// =========================================================
//  محرك الذكاء الاصطناعي (API Engine) + واجهة Gemini الإدارية
// =========================================================

const AI_CONFIG = {
    KEYS: [
        "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"
    ],
    MODEL: "llama-3.3-70b-versatile"
};

let currentApiKeyIndex = 0;
function getNextApiKey() {
    if (!AI_CONFIG.KEYS || AI_CONFIG.KEYS.length === 0) return "";
    const key = AI_CONFIG.KEYS[currentApiKeyIndex];
    currentApiKeyIndex = (currentApiKeyIndex + 1) % AI_CONFIG.KEYS.length;
    return key;
}

// بناء واجهة Gemini الإدارية بملء الشاشة
function initGeminiAdmin() {
    if (!document.getElementById('gemini-admin-ui')) {
        const box = document.createElement('div');
        box.id = 'gemini-admin-ui';
        box.innerHTML = `
            <div class="gemini-header">
                <h2>✨ لوحة تحكم الذكاء الإداري (Master AI)</h2>
                <button onclick="toggleGeminiAdmin()" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:20px; cursor:pointer;">إغلاق لوحة الإدارة ✖</button>
            </div>
            <div class="ai-tabs">
                <button class="tab-btn active" onclick="switchAdminTab('chat')">الدردشة الإدارية</button>
                <button class="tab-btn" onclick="switchAdminTab('train')">مركز التدريب</button>
                <button class="tab-btn" onclick="switchAdminTab('memory')">الذاكرة (JSON)</button>
                <button class="tab-btn" onclick="switchAdminTab('perms')">الصلاحيات المتقدمة</button>
            </div>
            
            <div id="admin-chat-tab" class="tab-content active">
                <div id="admin-messages" style="height: 55vh; overflow-y: auto; margin-bottom:15px; background:#1e1e20; padding:15px; border-radius:12px;"></div>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="admin-command-input" placeholder="اكتب أمرك الإداري هنا لتعديل البيانات أو الموقع..." style="flex:1; padding:15px; border-radius:30px; background:#282a2c; border:1px solid #444; color:#fff;" onkeypress="if(event.key==='Enter') executeGeminiCommand()">
                    <button class="btn-gemini" onclick="executeGeminiCommand()">تنفيذ الأمر 🚀</button>
                </div>
            </div>

            <div id="admin-train-tab" class="tab-content">
                <h3>إضافة مصادر معرفية للذكاء</h3>
                <select id="train-source-type" class="train-source-select">
                    <option value="text">نص مباشر / معلومات</option>
                    <option value="link">رابط موقع / مقال</option>
                    <option value="youtube">رابط يوتيوب (جلب النص)</option>
                    <option value="document">كتاب / وثيقة</option>
                </select>
                <textarea id="train-content-input" class="train-textarea" placeholder="ضع النص أو الرابط هنا..."></textarea>
                <button class="btn-gemini" onclick="submitAITraining()">تلقين البيانات للذكاء 🧠</button>
            </div>

            <div id="admin-memory-tab" class="tab-content">
                <pre id="admin-memory-view"></pre>
            </div>

            <div id="admin-perms-tab" class="tab-content">
                <h3>صلاحيات المساعد (Master Access)</h3>
                <label style="display:block; margin: 15px 0;"><input type="checkbox" id="perm-data" checked> السماح بتعديل قاعدة البيانات (JSON)</label>
                <label style="display:block; margin: 15px 0;"><input type="checkbox" id="perm-css"> السماح بتعديل تصميم الموقع (CSS)</label>
            </div>
        `;
        document.body.appendChild(box);
    }
}

window.switchAdminTab = (tabName) => {
    document.querySelectorAll('#gemini-admin-ui .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#gemini-admin-ui .tab-btn').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(`admin-${tabName}-tab`);
    if(target) target.classList.add('active');
    if(event && event.target) event.target.classList.add('active');

    if(tabName === 'memory' && window.App && window.App.cachedDb) {
        document.getElementById('admin-memory-view').innerText = JSON.stringify(window.App.cachedDb, null, 2);
    }
};

window.toggleGeminiAdmin = () => {
    const box = document.getElementById('gemini-admin-ui');
    if (box) box.style.display = (box.style.display === 'flex' ? 'none' : 'flex');
};

window.executeGeminiCommand = async () => {
    const input = document.getElementById('admin-command-input');
    if(!input || !input.value.trim()) return;
    const cmd = input.value.trim();
    const msgContainer = document.getElementById('admin-messages');
    
    msgContainer.innerHTML += `<div style="margin-bottom:10px; color:#c2e7ff;"><strong>أنت:</strong> ${cmd}</div>`;
    input.value = '';
    
    if (window.App && typeof window.App.executeAdminAICommand === 'function') {
        const res = await window.App.executeAdminAICommand(cmd);
        msgContainer.innerHTML += `<div style="margin-bottom:15px; color:#a8c7fa;"><strong>Gemini Admin:</strong> ${res || 'تم تنفيذ الأمر.'}</div>`;
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
};

window.submitAITraining = () => {
    const type = document.getElementById('train-source-type').value;
    const content = document.getElementById('train-content-input').value;
    if(!content.trim()) return alert("الرجاء إدخال المحتوى!");
    
    const trainingCommand = `تعلم هذه البيانات الجديدة كـ (${type}): ${content}. قم بتحديث البيانات وإنشاء تقرير ملخص في assistantReport ليقرأه مساعد الزوار.`;
    document.getElementById('admin-command-input').value = trainingCommand;
    window.executeGeminiCommand();
    window.switchAdminTab('chat');
};

// ربط محرك API مع تطبيق الموقع
function setupAppEngine() {
    if (!window.App) {
        setTimeout(setupAppEngine, 100);
        return;
    }

    window.App.executeAdminAICommand = async function(commandText) {
        if (!this.isAdminLoggedIn) {
            alert("⚠️ يجب تسجيل الدخول للوحة الإدارة أولاً لتنفيذ أوامر الذكاء الاصطناعي.");
            return "يجب تسجيل الدخول أولاً.";
        }

        const db = this.cachedDb || (typeof Store !== 'undefined' ? await Store.getKnowledge() : {});
        const permData = document.getElementById('perm-data')?.checked ?? true;
        
        const systemPrompt = `You are the Master Admin AI of the website.
Permissions: Data modification enabled: ${permData}.
Current Database JSON:
${JSON.stringify(db)}

CRITICAL INSTRUCTIONS:
Return ONLY a valid JSON object:
{
  "updatedData": { ... full or updated database ... },
  "message": "رسالة توضيحية بالعربية عما تم تنفيذه"
}`;

        for (let i = 0; i < AI_CONFIG.KEYS.length; i++) {
            let apiKey = getNextApiKey();
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: AI_CONFIG.MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: commandText }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!res.ok) throw new Error("API Limit");
                const data = await res.json();
                const content = JSON.parse(data.choices[0].message.content);

                if (content.updatedData) {
                    if (typeof Store !== 'undefined' && Store.saveKnowledge) {
                        await Store.saveKnowledge(content.updatedData);
                    }
                    this.cachedDb = content.updatedData;
                    if (typeof this.renderAll === 'function') await this.renderAll();
                    return content.message || "تم تنفيذ التعديل بنجاح!";
                }
            } catch (err) {
                console.warn("جاري تجربة المفتاح التالي...", err);
            }
        }
        return "❌ فشل الاتصال بمحرك الذكاء الاصطناعي.";
    };

    // دالة المساعد الموجهة للزوار لتستخدم الـ API والرد الذكي
    window.App.callAIForVisitor = async function(userMsg) {
        const db = this.cachedDb || {};
        const systemPrompt = `You are Ahmed Adel's assistant. Respond concisely in the same language. Knowledge Base: ${JSON.stringify(db)}`;
        
        for (let i = 0; i < AI_CONFIG.KEYS.length; i++) {
            let apiKey = getNextApiKey();
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: AI_CONFIG.MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userMsg }
                        ]
                    })
                });
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                return data.choices[0].message.content;
            } catch (e) {
                console.warn(e);
            }
        }
        return "أهلاً بك! يمكن التواصل مع الأستاذ أحمد مباشرة عبر الواتساب: +967779087415";
    };
}

initGeminiAdmin();
setupAppEngine();
