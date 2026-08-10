// =========================================================
//  محرك الذكاء الاصطناعي ووحدة الإدارة والمساعد العام (النسخة المدمجة)
// =========================================================

// 1. الإعدادات ومفاتيح الـ API
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

// 2. وحدة المعالجة والتنظيف العامة
window.AIEngine = {
    cleanText: function (text) {
        if (!text || typeof text !== 'string') return text || '';

        try {
            return text
                .replace(/\b(aden|abien)\s+university\b/gi, "Abyan University")
                .replace(/\babien\b/gi, "Abyan");
        } catch (error) {
            console.warn("AI Engine Warning:", error);
            return text;
        }
    }
};

// 3. دوال الواجهة والتبويبات المساعدة (Global Scope)
window.switchTab = (id) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(id + '-tab');
    if (targetTab) targetTab.classList.add('active');
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    if (id === 'memory' && window.App && window.App.cachedDb) {
        const memoryView = document.getElementById('memory-view');
        if (memoryView) {
            memoryView.innerText = JSON.stringify(window.App.cachedDb, null, 2);
        }
    }
};

window.trainAI = async () => {
    const trainInput = document.getElementById('train-input');
    if (!trainInput) return;
    const text = trainInput.value;
    if (!text || !text.trim()) {
        alert("الرجاء كتابة المحتوى لتدرّب الذكاء الاصطناعي عليه.");
        return;
    }
    if (window.App && typeof window.App.executeAdminAICommand === 'function') {
        await window.App.executeAdminAICommand("Learn this new content and add it to your knowledge base: " + text);
        alert("تم إرسال البيانات للذكاء الاصطناعي بنجاح!");
        trainInput.value = '';
    }
};

// 4. تهيئة وتطعيم كائن App بجميع الميزات
function initAIAdmin() {
    if (!window.App) {
        setTimeout(initAIAdmin, 100);
        return;
    }

    // بناء واجهة التبويبات المتقدمة داخل DOM إذا لم تكن موجودة
    if (!document.getElementById('ai-chat-box')) {
        const box = document.createElement('div');
        box.id = 'ai-chat-box';
        box.innerHTML = `
            <div class="ai-tabs">
                <button class="tab-btn active" onclick="switchTab('chat')">الدردشة</button>
                <button class="tab-btn" onclick="switchTab('train')">التدريب</button>
                <button class="tab-btn" onclick="switchTab('memory')">الذاكرة</button>
                <button class="tab-btn" onclick="switchTab('perms')">الصلاحيات</button>
                <button onclick="App.toggleChat()" style="margin-left:auto; background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">إغلاق</button>
            </div>
            <div id="chat-tab" class="tab-content active">
                <div id="ai-chat-messages"></div>
                <input id="ai-chat-input" placeholder="اكتب أمرك هنا..." onkeydown="App.handleChatKey(event)">
            </div>
            <div id="train-tab" class="tab-content">
                <textarea id="train-input" placeholder="ضع رابط الفيديو أو نص الكتاب أو المحتوى ليتعلمه الذكاء..."></textarea>
                <button onclick="trainAI()">إرسال للتعلم</button>
            </div>
            <div id="memory-tab" class="tab-content">
                <pre id="memory-view"></pre>
            </div>
            <div id="perms-tab" class="tab-content">
                <label><input type="checkbox" id="perm-edit" checked> السماح بالتعديل على البيانات</label><br>
                <label><input type="checkbox" id="perm-style"> السماح بتعديل التصميم</label>
            </div>
        `;
        document.body.appendChild(box);
    }

    // ربط دالة التنظيف
    window.App.fixText = window.AIEngine.cleanText;

    // التحكم بفتح وإغلاق النافذة
    window.App.toggleChat = function() {
        const box = document.getElementById('ai-chat-box');
        const btn = document.getElementById('ai-chat-btn');
        if (!box) return;
        
        const isVisible = box.style.display === 'flex' || getComputedStyle(box).display === 'flex';
        box.style.display = isVisible ? 'none' : 'flex';
        if (btn) btn.style.display = isVisible ? 'flex' : 'none';
    };

    window.App.handleChatKey = function(e) {
        if (e.key === 'Enter') this.sendChatMessage();
    };

    // دردشة المساعد العام (شات الزوار)
    window.App.sendChatMessage = async function() {
        const input = document.getElementById('ai-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const msgContainer = document.getElementById('ai-chat-messages');
        if (!msgContainer) return;

        msgContainer.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const kb = this.cachedDb || (typeof Store !== 'undefined' ? await Store.getKnowledge() : {});
        
        const strictSystemPrompt = `You are the personal assistant of Trainer Ahmed Adel Naji Thiab.
CRITICAL RULES:
1. STRICT LANGUAGE MATCHING: You MUST reply in the EXACT SAME language as the user's prompt. 
   - If the user asks in English, translate data and answer 100% in English.
   - If the user asks in Arabic, answer in Arabic.
2. STYLE: Keep responses natural, conversational, concise, and friendly like a WhatsApp message.
3. KNOWLEDGE BASE: ${JSON.stringify(kb)}`;

        let success = false;
        for (let i = 0; i < AI_CONFIG.KEYS.length; i++) {
            let apiKey = getNextApiKey();
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: AI_CONFIG.MODEL,
                        messages: [
                            { role: "system", content: strictSystemPrompt },
                            { role: "user", content: text }
                        ]
                    })
                });
                
                if (!res.ok) throw new Error("API Request Failed");
                
                const data = await res.json();
                if (data.choices && data.choices[0]) {
                    msgContainer.innerHTML += `<div class="msg bot-msg">${data.choices[0].message.content}</div>`;
                    success = true;
                    break;
                }
            } catch (err) {
                console.warn("API Key Failed, trying next...", err);
            }
        }

        if (!success) {
            let fallbackReply = "أهلاً بك! أنا مساعد الأستاذ أحمد عادل ناجي ذياب. يمكنك التواصل مع الأستاذ مباشرة عبر رقم الواتساب: +967779087415";
            const lowerText = text.toLowerCase();

            if (lowerText.includes('رقم') || lowerText.includes('واتس') || lowerText.includes('تواصل') || lowerText.includes('whatsapp') || lowerText.includes('phone')) {
                fallbackReply = `رقم الواتساب الخاص بالأستاذ أحمد عادل هو: +967 779087415، ويمكنك مراسلته مباشرة.`;
            } else if (lowerText.includes('شهادة') || lowerText.includes('بكالوريوس') || lowerText.includes('icdl')) {
                fallbackReply = `الأستاذ أحمد حاصل على بكالوريوس المحاسبة من جامعة أبين، ودبلوم ICDL، وشهادة اللغة الإنجليزية (B2)، بالإضافة لشهادات نظام إكسترا المحاسبي.`;
            }

            msgContainer.innerHTML += `<div class="msg bot-msg">${fallbackReply}</div>`;
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    // المساعد الإداري لتنفيذ الأوامر مع دمج الصلاحيات الإنجليزية
    window.App.executeAdminAICommand = async function(commandText) {
        if (!this.isAdminLoggedIn) {
            alert("⚠️ يجب تسجيل الدخول للوحة الإدارة أولاً لتنفيذ أوامر الذكاء الاصطناعي.");
            return;
        }

        if (!commandText || !commandText.trim()) return alert("الرجاء كتابة الأمر للذكاء الاصطناعي.");

        const db = this.cachedDb || (typeof Store !== 'undefined' ? await Store.getKnowledge() : {});
        const permEditEl = document.getElementById('perm-edit');
        const isEditAllowed = permEditEl ? permEditEl.checked : true;

        const systemPrompt = `You are now the Master Admin of the website.
Your permissions:
1. Modify data (update JSON).
2. Propose design changes.
3. Manage users.
4. Learn from any new content provided by the admin.

Rule: Any requested modification must return its result in JSON format as previously explained.
Current permissions status: ${isEditAllowed ? 'Data modification is enabled' : 'Data modification is disabled'}

Current Database JSON:
${JSON.stringify(db)}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object containing the updated database along with a short response message in Arabic explaining what you did.
2. Format your response strictly as JSON with this structure:
{
  "updatedData": { ... full or updated database ... },
  "message": "رسالة توضيحية بالعربية عما تم تنفيذه"
}`;

        let success = false;
        let resultMessage = "";

        for (let i = 0; i < AI_CONFIG.KEYS.length; i++) {
            let apiKey = getNextApiKey();
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: AI_CONFIG.MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: commandText }
                        ],
                        response_format: { type: "json_object" }
                    })
                });

                if (!res.ok) throw new Error("API Key limit or error");

                const data = await res.json();
                const content = JSON.parse(data.choices[0].message.content);

                if (content.updatedData) {
                    if (typeof Store !== 'undefined' && Store.saveKnowledge) {
                        await Store.saveKnowledge(content.updatedData);
                    }
                    this.cachedDb = content.updatedData;
                    resultMessage = content.message || "تم تنفيذ التعديل بنجاح!";
                    success = true;
                    break;
                }
            } catch (err) {
                console.warn("المفتاح الحالي استنفذ أو فشل، جاري تجربة المفتاح التالي...", err);
            }
        }

        if (success) {
            alert("🤖 " + resultMessage);
            if (typeof this.renderAll === 'function') {
                await this.renderAll();
            }
        } else {
            alert("❌ عذراً، لم نتمكن من تنفيذ الأمر. تأكد من صحة مفاتيح الـ API.");
        }
    };

    console.log("✅ تم ربط وحدة الذكاء الاصطناعي والإدارة بنجاح مع App.");
}

// بدء التشغيل التلقائي
initAIAdmin();
