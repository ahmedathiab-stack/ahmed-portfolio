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
