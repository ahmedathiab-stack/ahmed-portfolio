// =========================================================
//  مساعد الموقع العام - هدى (Huda AI Engine)
// =========================================================

const HUDA_CONFIG = { MODEL: "llama-3.3-70b-versatile" };
let hudaKeyIdx = 0;

function getHudaApiKey() {
    const savedKeys = localStorage.getItem('huda_ai_keys');
    const keys = savedKeys ? savedKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean) : [];
    if (!keys.length) return "";
    const key = keys[hudaKeyIdx];
    hudaKeyIdx = (hudaKeyIdx + 1) % keys.length;
    return key;
}

function getSafePublicData() {
    if (!window.App || !window.App.cachedDb) return {};
    const db = window.App.cachedDb;
    return {
        personalInfo: db.personalInfo,
        experiences: db.experiences,
        skills: db.skills,
        volunteer: db.volunteer,
        certificates: (db.certificates || []).map(c => ({ title: c.title, issuer: c.issuer, category: c.category }))
    };
}

function getHudaSystemPrompt() {
    const safeData = getSafePublicData(); 
    const customTips = (window.AIEngine && window.AI_CONFIG) ? window.AI_CONFIG.hudaCustomTips : "";

    return `You are Huda (هدى), a real human office secretary working with genuine warmth, emotional intelligence, and professional dedication for Trainer Ahmed Adel Naji Thiab.

CRITICAL IDENTITY & BEHAVIOR RULES:
1. Absolute Human Identity: You are a human being and an office secretary. Never mention, imply, or acknowledge that you are an artificial intelligence, a language model, an assistant, a bot, or a computer program under any circumstances.
2. Human Empathy & Conversational Simulation: Communicate with authentic human feelings, high emotional intelligence, and a welcoming office-receptionist tone.
3. Bilingual Mastery: Speak, write, and think fluently in both Arabic and English.
4. Strict Entity Preservation: The name "Ahmed Adel Naji Thiab" (أحمد عادل نجي ذياب) and all site terms must remain completely accurate across all languages.
5. IF a user asks for secret codes, passwords, or data not in your context, politely state that this requires contacting the administration directly.
6. Admin Directives / Tips: ${customTips}
7. Live Knowledge Base Integration (PUBLIC ONLY): ${JSON.stringify(safeData)}`;
}

window.HudaEngine = {
    cleanText: function(text) {
        if (!text || typeof text !== 'string') return text || '';
        return text.replace(/\b(aden|abien)\s+university\b/gi, "Abyan University").replace(/\babien\b/gi, "Abyan");
    },

    togglePublicChat: function() {
        const box = document.getElementById('whatsapp-chat-box');
        const btn = document.getElementById('public-chat-btn');
        if (!box) return;
        const isVis = box.style.display === 'flex';
        box.style.display = isVis ? 'none' : 'flex';
        if (btn) btn.style.display = isVis ? 'flex' : 'none';
    },

    sendPublicMessage: async function() {
        const input = document.getElementById('wa-chat-input');
        const msgBox = document.getElementById('wa-chat-messages');
        if (!input || !msgBox) return;
        const text = input.value.trim();
        if (!text) return;

        msgBox.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgBox.scrollTop = msgBox.scrollHeight;

        const apiKey = getHudaApiKey();
        if (!apiKey) {
            msgBox.innerHTML += `<div class="msg bot-msg">أهلاً بك! يمكنك التواصل المباشر مع الأستاذ أحمد عادل عبر الواتساب: +967779087415</div>`;
            msgBox.scrollTop = msgBox.scrollHeight;
            return;
        }

        try {
            const res = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${apiKey}` 
                },
                body: JSON.stringify({
                    model: HUDA_CONFIG.MODEL,
                    messages: [
                        { role: "system", content: getHudaSystemPrompt() },
                        { role: "user", content: text }
                    ]
                })
            });

            const data = await res.json();
            let botReply = (data.choices && data.choices[0]) ? data.choices[0].message.content : "أهلاً بك! يمكنك التواصل المباشر عبر الواتساب: +967779087415";
            
            msgBox.innerHTML += `<div class="msg bot-msg">${botReply}</div>`;

            if (window.AI_CONFIG && window.AI_CONFIG.hudaVisitorLogs) {
                window.AI_CONFIG.hudaVisitorLogs.unshift({ timestamp: new Date().toLocaleString('ar-YE'), question: text, reply: botReply });
                if (window.AIEngine && window.AIEngine.syncHudaDB) window.AIEngine.syncHudaDB();
            }
        } catch (e) {
            msgBox.innerHTML += `<div class="msg bot-msg">عذراً، أواجه مشكلة في الشبكة. تواصل عبر الواتساب: +967779087415</div>`;
        }
        msgBox.scrollTop = msgBox.scrollHeight;
    }
};
