sendPublicMessage: async function() {
        const input = document.getElementById('wa-chat-input');
        const msgBox = document.getElementById('wa-chat-messages');
        const text = input.value.trim();
        if (!text) return;

        msgBox.innerHTML += `<div class="msg user-msg">${text}</div>`;
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
            
            // إزالة مؤشر الكتابة
            const indicators = document.querySelectorAll('.typing-indicator');
            indicators.forEach(i => i.remove());

            if (res.ok && data.reply) {
                msgBox.innerHTML += `<div class="msg bot-msg">${data.reply}</div>`;
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
