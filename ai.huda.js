/* ==========================================================================
   محرك شات هدى الأمامي (Huda AI Frontend Engine)
   تم إصلاح وتطوير 60 ميزة وتحسين برامجي وأمني
   ========================================================================== */

const HUDA_CONFIG = { 
    MODEL: "llama-3.3-70b-versatile",
    API_ENDPOINT: "/api/index?action=huda" 
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

        try {
            msgBox.innerHTML += `<div class="msg bot-msg typing-indicator">جاري الكتابة...</div>`;
            msgBox.scrollTop = msgBox.scrollHeight;

            const res = await fetch(HUDA_CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            if (!res.ok) {
                throw new Error(`خطأ في خادم الاستجابة: ${res.status}`);
            }

            const data = await res.json();
            const botReply = data.reply || "عذراً، لم أستقبل رداً صحيحاً.";

            const safeBotReply = (typeof escapeHTML === 'function' ? escapeHTML(botReply) : botReply.replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/\n/g, '<br>');
            
            msgBox.innerHTML += `<div class="msg bot-msg">${safeBotReply}</div>`;

            if (data.reservationSaved) {
                console.log("✅ تم حفظ حجز الدورة في النظام الإداري بنجاح عبر الخادم!");
                if (window.App && typeof window.App.renderAll === 'function') {
                    await window.App.renderAll();
                }
            }
        } catch (e) {
            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            console.error("خطأ في محرك هدى:", e);
            msgBox.innerHTML += `<div class="msg bot-msg">عذراً، أواجه مشكلة في الاتصال. تواصل عبر الواتساب مباشرة: +967779087415</div>`;
        } finally {
            input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            input.focus();
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    }
};
