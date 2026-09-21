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

        msgBox.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgBox.scrollTop = msgBox.scrollHeight;

        const apiKey = localStorage.getItem('huda_ai_keys')?.split('\n')[0];
        if (!apiKey) {
            msgBox.innerHTML += `<div class="msg bot-msg">أهلاً بك! يمكنك التواصل المباشر عبر الواتساب: +967779087415</div>`;
            return;
        }

        try {
            msgBox.innerHTML += `<div class="msg bot-msg typing-indicator">جاري الكتابة...</div>`;
            msgBox.scrollTop = msgBox.scrollHeight;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: HUDA_CONFIG.MODEL,
                    messages: [
                        { role: "system", content: this.getHudaSystemPrompt() },
                        { role: "user", content: text }
                    ]
                })
            });

            const data = await res.json();
            let botReply = data.choices[0].message.content;

            // إزالة مؤشر الكتابة
            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            // 🆕 التقاط كود الحجز من هدى وحفظه في قاعدة البيانات صمتاً!
            const reserveRegex = /\[\[RESERVE\Vert{}(.*?)\Vert{}(.*?)\Vert{}(.*?)\]\]/;
            const match = botReply.match(reserveRegex);
            if (match) {
                const [_, name, email, course] = match;
                botReply = botReply.replace(reserveRegex, '').trim(); // إخفاء الكود عن الزائر

                // حفظ الحجز في اللوحة الإدارية
                if (!window.App.cachedDb.reservations) window.App.cachedDb.reservations = [];
                window.App.cachedDb.reservations.push({
                    date: new Date().toLocaleString('ar-YE'),
                    name: name.trim(), email: email.trim(), course: course.trim()
                });
                window.Store.saveKnowledge(window.App.cachedDb);
                console.log("✅ تم التقاط حجز الدورة وحفظه في النظام الإداري بنجاح!");
            }

            msgBox.innerHTML += `<div class="msg bot-msg">${botReply}</div>`;
        } catch (e) {
            msgBox.innerHTML += `<div class="msg bot-msg">عذراً، أواجه مشكلة. تواصل عبر الواتساب: +967779087415</div>`;
        }
        msgBox.scrollTop = msgBox.scrollHeight;
    }
};
