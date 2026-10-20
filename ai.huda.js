/* ==========================================================================
   محرك شات هدى الأمامي (Huda AI Frontend Engine) - النسخة المؤمنة الكاملة
   ========================================================================== */

const HUDA_CONFIG = { 
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

            if (data.reservationSaved && window.App && typeof window.App.renderAll === 'function') {
                await window.App.renderAll();
            }
        } catch (e) {
            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            msgBox.innerHTML += `<div class="msg bot-msg">عذراً، أواجه مشكلة في الاتصال. تواصل عبر الواتساب مباشرة: +967779087415</div>`;
        } finally {
            input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            input.focus();
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    }
};
