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

// 1. قاموس التصحيح الإجباري (الشبكة التي تصطاد أخطاء المترجم)
const strictTranslations = {
    // اصطياد أخطاء الترجمة الإنجليزية وتوحيدها
    "aden university": "Abyan University",
    "abien university": "Abyan University",
    "abien": "Abyan",
    
    // توحيد النصوص العربية لتترجم دائماً بشكل صحيح
    "جامعة ابين": "Abyan University",
    "جامعة أبين": "Abyan University"
};

// 2. دالة تنظيف وتصحيح النصوص
App.fixText = function(text) {
    if (!text || typeof text !== 'string') return text;
    let newText = text;
    
    // المرور على القاموس واستبدال أي خطأ بالكلمة الصحيحة
    for (const [wrong, correct] of Object.entries(strictTranslations)) {
        // نستخدم gi لكي يتجاهل حالة الأحرف (سواء كانت Abien أو abien أو ABIEN سيصطادها)
        const regex = new RegExp(wrong, "gi");
        newText = newText.replace(regex, correct);
    }
    
    return newText;
};
