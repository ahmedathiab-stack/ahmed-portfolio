// ==========================================
//  محرك الذكاء الاصطناعي ووحدة الإدارة الذكية (النسخة الآمنة)
// ==========================================

window.AIEngine = {
    // دالة تنظيف النصوص الآمنة (تعالج مشاكل الترجمة مثل جامعة أبين)
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

// دالة لضمان ربط الدوال بكائن App حتى لو تأخر تحميله
function initAIAdmin() {
    if (window.App) {
        window.App.fixText = window.AIEngine.cleanText;

        window.App.executeAdminAICommand = async function (commandText) {
            if (!commandText || !commandText.trim()) {
                alert("يرجى كتابة الأمر أولاً!");
                return;
            }
            console.log("جاري معالجة الأمر الذكي:", commandText);
            // سيتم إضافة منطق معالجة الأوامر هنا مستقبلاً
        };
        console.log("تم تفعيل وتثبيت مساعد الذكاء الاصطناعي بنجاح في App.");
    } else {
        // محاولة إعادة الربط بعد أجزاء من الثانية إذا كان ملف script.js يحمل ببطء
        setTimeout(initAIAdmin, 100);
    }
}

// تشغيل عملية التثبيت فوراً
initAIAdmin();
 },
    AI_API_KEYS: [
        "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"
    ]
}
const volList = document.getElementById('admin-vol-list');
        if (volList) {
            volList.innerHTML = (db.volunteer || []).map((v, i) => `
                <div class="admin-row">
                    <span>${v.role}</span>
                    <div>
                        <button class="btn-action-edit" onclick="App.editVolunteer(${i})">✏️</button>
                        <button class="btn-action-delete" onclick="App.deleteItem('volunteer', ${i})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    },
    editCertificate(index) {
        const db = this.cachedDb;
        if (!db || !db.certificates[index]) return;
        const c = db.certificates[index];

        document.getElementById('certEditIndex').value = index;
        document.getElementById('certTitle').value = c.title || '';
        document.getElementById('certIssuer').value = c.issuer || '';
        document.getElementById('certCategory').value = c.category || '';
        document.getElementById('certPin').value = c.pin || '';
        document.getElementById('certImage').value = c.imageUrl && !c.imageUrl.startsWith('data:') ? c.imageUrl : '';
        if (document.getElementById('certFile')) document.getElementById('certFile').value = '';
    },
