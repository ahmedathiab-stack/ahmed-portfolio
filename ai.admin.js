// =========================================================
// ai.admin.js - المحرك المتكامل للذكاء الاصطناعي ولواجهة Gemini
// =========================================================

const AI_CONFIG = {
    KEYS: ["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"],
    MODEL: "llama-3.3-70b-versatile"
};

// دالة الاتصال العام بـ Groq API
async function queryGroqAPI(systemPrompt, userPrompt, jsonMode = false) {
    for (const key of AI_CONFIG.KEYS) {
        try {
            const bodyObj = {
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            };
            if (jsonMode) {
                bodyObj.response_format = { type: "json_object" };
            }

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify(bodyObj)
            });

            if (!res.ok) continue;
            const data = await res.json();
            return data.choices[0]?.message?.content || null;
        } catch (e) {
            console.error("Groq API Error:", e);
        }
    }
    return null;
}

// دالة عالمية للرد على الزوار (يستدعيها script.js)
window.callAIForVisitor = async function(userMsg) {
    const dbData = window.App?.cachedDb ? JSON.stringify(window.App.cachedDb) : "بيانات عامة عن الموقع والمشاريع.";
    const systemPrompt = `أنت مساعد شخصي ذكي للأستاذ أحمد عادل في موقعه الشخصي. أجب باختصار وود باللغة العربية بناءً على البيانات التالية:\n${dbData}`;
    const reply = await queryGroqAPI(systemPrompt, userMsg, false);
    return reply || "أهلاً بك! يمكنك التواصل مباشرة مع الأستاذ أحمد عبر الواتساب: +967779087415";
};

// إنشاء واجهة Gemini الإدارية في الـ DOM
function createGeminiAdminUI() {
    if (document.getElementById('gemini-admin-ui')) return;
    
    const box = document.createElement('div');
    box.id = 'gemini-admin-ui';
    box.innerHTML = `
        <div class="gemini-header">
            <h2>✨ لوحة تحكم الذكاء الإداري (Master AI)</h2>
            <button onclick="toggleGeminiAdmin()" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:20px; cursor:pointer;">إغلاق ✖</button>
        </div>
        <div class="ai-tabs">
            <button class="tab-btn active" onclick="switchAdminTab('chat', event)">الدردشة الإدارية</button>
            <button class="tab-btn" onclick="switchAdminTab('train', event)">مركز التدريب</button>
            <button class="tab-btn" onclick="switchAdminTab('memory', event)">الذاكرة (JSON)</button>
        </div>
        
        <div id="admin-chat-tab" class="tab-content active">
            <div id="admin-messages" style="height: 50vh; overflow-y: auto; margin-bottom:15px; background:#1e1e20; padding:15px; border-radius:12px;"></div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="admin-command-input" placeholder="اكتب أمرك الإداري هنا لتعديل البيانات..." style="flex:1; padding:15px; border-radius:30px; background:#282a2c; border:1px solid #444; color:#fff;" onkeypress="if(event.key==='Enter') executeGeminiCommand()">
                <button class="btn-gemini" onclick="executeGeminiCommand()">تنفيذ الأمر 🚀</button>
            </div>
        </div>

        <div id="admin-train-tab" class="tab-content">
            <h3>تلقين بيانات جديدة للذكاء</h3>
            <select id="train-source-type" class="train-source-select">
                <option value="text">نص مباشر / معلومات</option>
                <option value="link">رابط موقع / مقال</option>
                <option value="document">ملف / كتاب</option>
            </select>
            <textarea id="train-content-input" class="train-textarea" placeholder="ضع المحتوى أو النص المراد حفظه هنا..."></textarea>
            <button class="btn-gemini" onclick="submitAITraining()">تلقين البيانات للذكاء 🧠</button>
        </div>

        <div id="admin-memory-tab" class="tab-content">
            <pre id="admin-memory-view" style="background:#1e1e20; padding:15px; border-radius:8px; color:#34d399; overflow:auto; max-height:50vh;"></pre>
        </div>
    `;
    document.body.appendChild(box);
}

// التحكم بفتح وإغلاق الواجهة
window.toggleGeminiAdmin = () => {
    let box = document.getElementById('gemini-admin-ui');
    if (!box) {
        createGeminiAdminUI();
        box = document.getElementById('gemini-admin-ui');
    }
    if (box) {
        const isHidden = getComputedStyle(box).display === 'none';
        box.style.display = isHidden ? 'flex' : 'none';
    }
};

// التنقل بين التبويبات
window.switchAdminTab = (tabName, evt) => {
    document.querySelectorAll('#gemini-admin-ui .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#gemini-admin-ui .tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`admin-${tabName}-tab`);
    if (targetTab) targetTab.classList.add('active');
    if (evt && evt.target) evt.target.classList.add('active');

    if (tabName === 'memory' && window.App?.cachedDb) {
        const memView = document.getElementById('admin-memory-view');
        if (memView) memView.innerText = JSON.stringify(window.App.cachedDb, null, 2);
    }
};

// تنفيذ الأوامر الإدارية والتعديل على البيانات
window.executeGeminiCommand = async () => {
    const input = document.getElementById('admin-command-input');
    if (!input || !input.value.trim()) return;
    const cmd = input.value.trim();
    const msgContainer = document.getElementById('admin-messages');
    
    msgContainer.innerHTML += `<div style="margin-bottom:10px; color:#c2e7ff;"><strong>أنت:</strong> ${cmd}</div>`;
    input.value = '';
    msgContainer.scrollTop = msgContainer.scrollHeight;

    const db = window.App?.cachedDb || (typeof Store !== 'undefined' ? await Store.getKnowledge() : {});
    const systemPrompt = `You are the Master Admin AI. Return ONLY a valid JSON object matching this structure:
{
  "updatedData": { ... full updated database JSON ... },
  "message": "رسالة توضيحية باللغة العربية تمثل ما تم تعديله"
}
Current Database JSON:
${JSON.stringify(db)}`;

    const rawResponse = await queryGroqAPI(systemPrompt, cmd, true);
    if (!rawResponse) {
        msgContainer.innerHTML += `<div style="margin-bottom:15px; color:#f87171;"><strong>خطأ:</strong> تعذر الاتصال بالذكاء الاصطناعي. تحقق من مفتاح الـ API.</div>`;
        return;
    }

    try {
        const parsed = JSON.parse(rawResponse);
        if (parsed.updatedData) {
            if (typeof Store !== 'undefined' && Store.saveKnowledge) {
                await Store.saveKnowledge(parsed.updatedData);
            }
            if (window.App) {
                window.App.cachedDb = parsed.updatedData;
                if (typeof window.App.renderAll === 'function') await window.App.renderAll();
            }
        }
        msgContainer.innerHTML += `<div style="margin-bottom:15px; color:#a8c7fa;"><strong>Gemini Admin:</strong> ${parsed.message || 'تم تحديث البيانات بنجاح!'}</div>`;
    } catch (e) {
        msgContainer.innerHTML += `<div style="margin-bottom:15px; color:#a8c7fa;"><strong>Gemini Admin:</strong> ${rawResponse}</div>`;
    }
    msgContainer.scrollTop = msgContainer.scrollHeight;
};

// تلقين البيانات للذكاء
window.submitAITraining = () => {
    const type = document.getElementById('train-source-type').value;
    const content = document.getElementById('train-content-input').value;
    if (!content.trim()) return alert("الرجاء إدخال المحتوى!");
    
    const trainingCommand = `تعلم وحفظ المعرفة التالية نوع (${type}):\n${content}\nقم بتحديث البيانات وإضافة ملخص في قاعدة البيانات.`;
    
    switchAdminTab('chat');
    const input = document.getElementById('admin-command-input');
    if (input) {
        input.value = trainingCommand;
        executeGeminiCommand();
    }
};

// التهيئة عند جاهزية العناصر
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createGeminiAdminUI);
} else {
    createGeminiAdminUI();
}
