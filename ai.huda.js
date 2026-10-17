const HUDA_CONFIG = { MODEL: "llama-3.3-70b-versatile" };

window.HudaEngine = {
    togglePublicChat: function() {
        const box = document.getElementById('whatsapp-chat-box');
        box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
    },

    getHudaSystemPrompt: function() {
        const db = window.App?.cachedDb || {};
        const availableCourses = (db.courses || []).map(c => c.name).join('، ');

        return `You are Huda (هدى), a real human office secretary for Trainer Ahmed Adel Naji Thiab.
CRITICAL RULES:
1. You are 100% human. Never say you are an AI.
2. Speak warmly and professionally in Arabic.
3. **COURSE RESERVATIONS (حجز الدورات):**
   Active Courses available for booking: [${availableCourses}]
   If the user asks to book a course, ask them clearly for their: 1. Full Name, 2. Email Address, 3. The exact Course Name.
   ONCE they provide all 3 details, you MUST reply with a confirmation message to the user, AND append this exact system tag at the very end of your message:
   [[RESERVE|Name|Email|Course]]
   Example tag: [[RESERVE|علي محمد|ali@gmail.com|ICDL]]`;
    },

    sendPublicMessage: async function() {
        const input = document.getElementById('wa-chat-input');
        const msgBox = document.getElementById('wa-chat-messages');
        const text = input.value.trim();
        if (!text) return;

        msgBox.innerHTML += `<div class="msg user-msg">${escapeHtml(text)}</div>`;
        input.value = '';
        msgBox.scrollTop = msgBox.scrollHeight;

        try {
            msgBox.innerHTML += `<div class="msg bot-msg typing-indicator">جاري الكتابة...</div>`;
            msgBox.scrollTop = msgBox.scrollHeight;

            const res = await fetch("/api/index?action=huda", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await res.json();
            
            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            if (res.ok && data.reply) {
                msgBox.innerHTML += `<div class="msg bot-msg">${escapeHtml(data.reply)}</div>`;
                if (data.reservationSaved) {
                    console.log("✅ تم حفظ حجز الدورة في النظام الإداري بنجاح عبر الخادم!");
                }
            } else {
                msgBox.innerHTML += `<div class="msg bot-msg">عذراً، حدث خطأ. تواصل عبر الواتساب: +967779087415</div>`;
            }
        } catch (e) {
            msgBox.innerHTML += `<div class="msg bot-msg">عذراً، أواجه مشكلة في الاتصال. تواصل عبر الواتساب: +967779087415</div>`;
        }
        msgBox.scrollTop = msgBox.scrollHeight;
    }
};
