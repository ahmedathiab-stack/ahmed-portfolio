// ==========================================
//  محرك الذكاء الاصطناعي ووحدة الإدارة والمساعد العام
// ==========================================

const AI_CONFIG = {
    // مصفوفة المفاتيح المجانية (يمكنك إدخال حتى 40+ مفتاح هنا)
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

// وحدة المعالجة والتنظيف العامة
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

// تثبيت وتطعيم كائن App بالذكاء الاصطناعي
function initAIAdmin() {
    if (!window.App) {
        setTimeout(initAIAdmin, 100);
        return;
    }

    // 1. ربط دالة التنظيف الآمنة
    window.App.fixText = window.AIEngine.cleanText;

    // 2. دوال المساعد العام (شات الزوار)
    window.App.toggleChat = function() {
        const box = document.getElementById('ai-chat-box');
        const btn = document.getElementById('ai-chat-btn');
        if (!box || !btn) return;
        const isVisible = box.style.display === 'flex';
        box.style.display = isVisible ? 'none' : 'flex';
        btn.style.display = isVisible ? 'flex' : 'none';
    };

    window.App.handleChatKey = function(e) {
        if (e.key === 'Enter') this.sendChatMessage();
    };

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

    // 3. المساعد الإداري للتحكم في بيانات الموقع من لوحة الإدارة
    window.App.executeAdminAICommand = async function(commandText) {
        if (!this.isAdminLoggedIn) {
            alert("⚠️ يجب تسجيل الدخول للوحة الإدارة أولاً لتنفيذ أوامر الذكاء الاصطناعي.");
            return;
        }

        if (!commandText || !commandText.trim()) return alert("الرجاء كتابة الأمر للذكاء الاصطناعي.");

        const db = this.cachedDb || (typeof Store !== 'undefined' ? await Store.getKnowledge() : {});

        const systemPrompt = `You are the Master AI Admin Controller for the website of Trainer Ahmed Adel. 
Your job is to parse the admin's natural language command and update the database JSON structure.
Current Database JSON:
${JSON.stringify(db)}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object containing the updated database along with a short response message in Arabic explaining what you did.
2. Format your response strictly as JSON with this structure:
{
  "updatedData": { ... full or updated database ... },
  "message": "رسالة توضيحية بالعربية عما تم تنفيذه"
}
`;

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
                    await Store.saveKnowledge(content.updatedData);
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
            await this.renderAll();
        } else {
            alert("❌ عذراً، لم نتمكن من تنفيذ الأمر. تأكد من صحة مفاتيح الـ API.");
        }
    };

    console.log("✅ تم ربط وحدة الذكاء الاصطناعي والإدارة بنجاح مع App.");
}

// البدء التلقائي للتثبيت
initAIAdmin();
