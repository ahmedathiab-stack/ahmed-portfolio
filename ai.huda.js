/* ==========================================================================
   محرك شات هدى الأمامي (Huda AI Frontend Engine) - النسخة المصححة والمؤمنة
   ========================================================================== */

const HUDA_CONFIG = { 
    MODEL: "gpt-4o-mini",
    // مسارات خادم هدى المتوافقة مع Vercel Serverless Functions
    API_ENDPOINTS: [
        "/api/huda",
        "/api/index?action=huda"
    ]
};

window.HudaEngine = {
    togglePublicChat: function() {
        const box = document.getElementById('whatsapp-chat-box');
        if (box) {
            box.style.display = (box.style.display === 'flex') ? 'none' : 'flex';
            if (box.style.display === 'flex') {
                const input = document.getElementById('wa-chat-input');
                if (input) input.focus();
            }
        }
    },

    getHudaSystemPrompt: function() {
        const db = window.App?.cachedDb || {};
        const availableCourses = (db.courses || []).map(c => c.name).join('، ');

        return `You are Huda (هدى), a real human office secretary for Trainer Ahmed Adel Naji Thiab.
CRITICAL RULES:
1. You are 100% human. Never say you are an AI.
2. Speak warmly and professionally in Arabic.
3. **COURSE RESERVATIONS (حجز الدورات):**
   Active Courses available for booking: [${availableCourses || 'الدورات المتاحة'}]
   If the user asks to book a course, ask them clearly for their: 1. Full Name, 2. Email Address or Phone, 3. The exact Course Name.
   ONCE they provide all 3 details, you MUST reply with a confirmation message to the user, AND append this exact system tag at the very end of your message:
   [[RESERVE|Name|Email|Course]]
   Example tag: [[RESERVE|علي محمد|ali@gmail.com|ICDL]]`;
    },

    sendPublicMessage: async function() {
        const input = document.getElementById('wa-chat-input');
        const msgBox = document.getElementById('wa-chat-messages');
        const sendBtn = document.getElementById('wa-chat-send');

        if (!input || !msgBox) return;

        const text = input.value.trim();
        if (!text) return;

        const safeUserText = typeof escapeHTML === 'function' ? escapeHTML(text) : text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        msgBox.innerHTML += `<div class="msg user-msg">${safeUserText}</div>`;
        input.value = '';
        msgBox.scrollTop = msgBox.scrollHeight;

        input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;

        msgBox.innerHTML += `<div class="msg bot-msg typing-indicator">جاري الكتابة...</div>`;
        msgBox.scrollTop = msgBox.scrollHeight;

        let responseReceived = false;
        let lastError = null;

        // محاولة الاتصال بالمسارات المتاحة بالتناوب لضمان أعلى استقرار
        for (const endpoint of HUDA_CONFIG.API_ENDPOINTS) {
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                if (res.ok) {
                    const data = await res.json();
                    const indicators = document.querySelectorAll('.typing-indicator');
                    indicators.forEach(i => i.remove());

                    const botReply = data.reply || data.choices?.[0]?.message?.content || "عذراً، لم أستقبل رداً صحافياً.";
                    const safeBotReply = (typeof escapeHTML === 'function' ? escapeHTML(botReply) : botReply.replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/\n/g, '<br>');
                    
                    msgBox.innerHTML += `<div class="msg bot-msg">${safeBotReply}</div>`;

                    if (data.reservationSaved && window.App && typeof window.App.renderAll === 'function') {
                        await window.App.renderAll();
                    }

                    responseReceived = true;
                    break;
                }
            } catch (e) {
                lastError = e;
            }
        }

        // في حال فشل كافة المسارات
        if (!responseReceived) {
            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            console.error("خطأ في محرك هدى:", lastError);
            msgBox.innerHTML += `<div class="msg bot-msg">عذراً، أواجه مشكلة في الاتصال. تواصل عبر الواتساب مباشرة: +967779087415</div>`;
        }

        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
        msgBox.scrollTop = msgBox.scrollHeight;
    }
};
