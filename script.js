/**
 * ملف الإعدادات وقاعدة المعرفة الأساسية للموقع - الإصدار الشامل والمصحح
 */

const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    DEFAULT_ADMIN_PASS: "1234",
    MASTER_RECOVERY_PIN: "7777",
    STORAGE_KEYS: {
        KNOWLEDGE: "ahmed_knowledge_base_v7",
        UNLOCKED_CERTS: "ahmed_unlocked_certs_v7"
    },
    AI_API_KEYS: [
        "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"
    ]
};

const DEFAULT_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        location: "جعار - خنفر - أبين - اليمن",
        phone: "+967 779087415",
        email: "Ahmed.a.n.thiab@gmail.com",
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين، أجمع بين الخبرة المالية العملية والمهارات التدريبية والتيسيرية."
    },
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", issuer: "جامعة أبين (2026)", imageUrl: "", pin: "1001" },
        { id: "cert-acc-2", title: "شهادة نظام إكسترا للمحاسبة والإدارة", category: "محاسبة", issuer: "بن مقيبل للأنظمة ومؤسسة بلقيس (2022)", imageUrl: "", pin: "1002" },
        { id: "cert-it-1", title: "دبلوم قيادة الحاسوب ICDL", category: "تقنية معلومات", issuer: "وزارة التعليم الفني - معهد جبس (2020)", imageUrl: "", pin: "1003" },
        { id: "cert-lang-1", title: "شهادة اللغة الإنجليزية (B2)", category: "لغات", issuer: "وزارة التعليم الفني - معهد جبس (2022)", imageUrl: "", pin: "1004" }
    ],
    experiences: [
        { role: "مدرب أنظمة محاسبية وماليات", company: "مراكز تدريبية ومؤسسات أهلية", period: "2023 - الحالي", desc: "تدريب وإدارة تطبيقات نظام إكسترا المحاسبي الآلي، وإدارة الحسابات اليومية وتسجيل القيود وإصدار التقارير المالية." }
    ],
    skills: [
        { name: "نظام إكسترا (Extra System)", category: "محاسبة ومالية", level: "خبير" },
        { name: "إعداد القوائم المالية والتسويات", category: "محاسبة ومالية", level: "متقدم" },
        { name: "برامج Microsoft Office & ICDL", category: "تقنية معلومات", level: "خبير" },
        { name: "اللغة الإنجليزية", category: "لغات", level: "B2 (متقدم)" }
    ],
    volunteer: [
        { role: "ميسر وأخصائي تدريب مجتمعي", org: "مبادرات محلية - أبين", period: "2022 - 2024" }
    ]
};

/**
 * إدارة التخزين وقاعدة المعرفة محلياً - الإصدار المصحح
 */
class Store {
    static getKnowledge() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.KNOWLEDGE);
            const savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
            const visionCerts = savedCerts.map((c, idx) => ({
                id: `vision-cert-${idx}`,
                title: c.title,
                category: "مستندات مرفوعة",
                issuer: c.issuer + (c.date ? ` (${c.date})` : ''),
                imageUrl: c.imageUrl || '',
                pin: "1001"
            }));

            if (!raw) {
                return {
                    ...DEFAULT_KNOWLEDGE_BASE,
                    certificates: [...DEFAULT_KNOWLEDGE_BASE.certificates, ...visionCerts],
                    ...(window.CERTIFICATIONS ? { certificates: [...DEFAULT_KNOWLEDGE_BASE.certificates, ...(window.CERTIFICATIONS || []), ...visionCerts] } : {})
                };
            }

            const parsed = JSON.parse(raw);
            const baseCerts = Array.isArray(parsed.certificates) ? parsed.certificates : DEFAULT_KNOWLEDGE_BASE.certificates;
            const fileCerts = window.CERTIFICATIONS || [];

            // دمج دقيق بدون تكرار للشهادات
            const uniqueCertsMap = new Map();
            [...baseCerts, ...fileCerts, ...visionCerts].forEach(c => uniqueCertsMap.set(c.id || c.title, c));

            return {
                personalInfo: { ...DEFAULT_KNOWLEDGE_BASE.personalInfo, ...(parsed.personalInfo || {}) },
                certificates: Array.from(uniqueCertsMap.values()),
                experiences: Array.isArray(parsed.experiences) ? parsed.experiences : DEFAULT_KNOWLEDGE_BASE.experiences,
                skills: Array.isArray(parsed.skills) ? parsed.skills : DEFAULT_KNOWLEDGE_BASE.skills,
                volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer : DEFAULT_KNOWLEDGE_BASE.volunteer
            };
        } catch (e) {
            return DEFAULT_KNOWLEDGE_BASE;
        }
    }

    static saveKnowledge(data) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.KNOWLEDGE, JSON.stringify(data));
        App.renderAll();
    }

    static getUnlockedCerts() {
        try {
            return JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS) || '[]');
        } catch (e) {
            return [];
        }
    }

    static unlockCert(certId) {
        const unlocked = Store.getUnlockedCerts();
        if (!unlocked.includes(certId)) {
            unlocked.push(certId);
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(unlocked));
            App.renderAll();
        }
    }

    static unlockAllCerts() {
        const kb = Store.getKnowledge();
        const allIds = (kb.certificates || []).map(c => c.id);
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(allIds));
        App.renderAll();
    }
}
