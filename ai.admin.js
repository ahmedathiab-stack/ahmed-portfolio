runGeminiCommand: async function() {
        if (!AI_CONFIG.masterControlEnabled) {
            return alert("🛑 الذكاء الاصطناعي مجمد حالياً بأمر المسؤول. قم بتفعيله من المفتاح الأعلى.");
        }
        
        const command = document.getElementById('gemini-cmd-input').value;
        if (!command) return;

        document.getElementById('gemini-cmd-input').value = 'جاري المعالجة عبر الخادم الآمن...';

        try {
            const res = await fetch('/api/index?action=adminAi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            const data = await res.json();
            if (res.ok && data.report) {
                AI_CONFIG.reports.push({ cmd: command, res: data.report.response });
                alert("🤖 " + data.report.response);
                document.getElementById('gemini-cmd-input').value = '';
                this.renderReports();
                await App.renderAll();
            } else {
                alert("❌ خطأ: " + (data.error || 'فشل تنفيذ الأمر'));
                document.getElementById('gemini-cmd-input').value = command;
            }
        } catch (err) {
            alert("❌ حدث خطأ في الاتصال بالخادم.");
            document.getElementById('gemini-cmd-input').value = command;
        }
    }
