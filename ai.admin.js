// ==========================================
//  محرك الذكاء الاصطناعي ووحدة الإدارة الذكية
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

// ربط المحرك بكائن التطبيق الرئيسي App
if (window.App) {
    window.App.fixText = window.AIEngine.cleanText;

    window.App.executeAdminAICommand = async function (commandText) {
        if (!commandText || !commandText.trim()) {
            alert("يرجى كتابة الأمر أولاً!");
            return;
        }
        console.log("جاري معالجة الأمر الذكي:", commandText);
    };
}
