// ==========================================
//  مساعد الذكاء الاصطناعي ووحدة تنظيف النصوص
// ==========================================

window.AIEngine = {
    /**
     * دالة تنظيف آمنة 100%
     * لا تحذف النصوص ولا توقف الموقع في حال حدوث خطأ
     */
    cleanText: function (text) {
        // 1. حماية أولية: إذا كان النص فارغاً أو ليس نصاً، أرجعه كما هو فوراً
        if (text === null || text === undefined || typeof text !== 'string') {
            return text || '';
        }

        try {
            let cleaned = text;

            // 2. تصحيح أخطاء الأسماء الإنجليزية دون المساس ببقية الجملة
            cleaned = cleaned
                .replace(/\b(aden|abien)\s+university\b/gi, "Abyan University")
                .replace(/\babien\b/gi, "Abyan");

            return cleaned;
        } catch (error) {
            // في حال حدوث أي خطأ غير متوقع، يتم إرجاع النص الأصلي كاملاً دون تخريب
            console.warn("AI Engine Warning: Clean fail-safe triggered", error);
            return text;
        }
    }
};

// ربط آمن مع التطبيق الرئيسي (إذا كان App موجوداً)
if (window.App) {
    window.App.fixText = window.AIEngine.cleanText;
}
