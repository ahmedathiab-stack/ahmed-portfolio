// ============================================================
// قاعدة البيانات والمعرفة للذكاء الاصطناعي (Knowledge Base)
// ============================================================
const USER_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "محاسب ومتخصص في الأنظمة المحاسبية وتقنية المعلومات",
        location: "اليمن",
        summary: "محاسب متخصص يجمع بين الخصلة المالية واستخدام الحلول التقنية الحديثة ونظام إكسترا."
    },
    
    // الشهادات (مقسمة بين مكتملة وقيد التجهيز)
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", status: "متاح", issuer: "جامعة معتمدة" },
        { id: "cert-acc-2", title: "شهادة نظام إكسترا المحاسبي", category: "محاسبة", status: "متاح", issuer: "مركز تدريب معتمد" },
        { id: "cert-it-1", title: "دبلوم قيادة الحاسوب ICDL", category: "تقنية معلومات", status: "متاح", issuer: "ICDL Foundation" },
        { id: "cert-lang-1", title: "شهادة اللغة الإنجليزية (مستوى B2)", category: "لغات", status: "متاح", issuer: "معهد لغات" },
        // شهادات قيد التجهيز أو ناقصة (سيتعامل معها الذكاء بذكاء)
        { id: "cert-acc-3", title: "شهادة المعايير الدولية IFRS", category: "محاسبة", status: "قيد الحصول / قيد الرفع", issuer: "جاري العمل عليها" }
    ],

    // الخبرات المهنية
    experiences: [
        {
            role: "محاسب ماليات وإدخال بيانات",
            company: "جهة عمل / شركة",
            period: "2023 - الحالي",
            tasks: [
                "إدارة الحسابات اليومية وتسجيل القيود المحاسبية.",
                "استخدام نظام إكسترا المحاسبي لإصدار التقارير المالية.",
                "مراجعة المطابقات البنكية وحسابات الموردين والعملاء."
            ]
        }
    ],

    // المهارات المكتسبة
    skills: {
        accounting: ["نظام إكسترا (Extra System)", "إعداد القوائم المالية", "التسويات البنكية", "المراجعة المستندية"],
        tech: ["إدخال البيانات بمهارة عالية", "إدارة قواعد البيانات البسيطة", "استخدام برامج Microsoft Office"],
        languages: ["اللغة العربية (اللغة الأم)", "اللغة الإنجليزية (مستوى B2 - ممتاز)"]
    }
};
// ============================================================
// دالة بناء سياق الذكاء الاصطناعي من قاعدة المعرفة
// ============================================================
function getAIBaseContext() {
    const kb = USER_KNOWLEDGE_BASE;
    
    // تجميع الشهادات وحالتها
    const certsText = kb.certificates.map(c => 
        `- ${c.title} (${c.category}) - الحالة: [${c.status}]`
    ).join("\n");

    // تجميع الخبرات
    const expText = kb.experiences.map(e => 
        `- ${e.role} في ${e.company} (${e.period}):\n  * ${e.tasks.join("\n  * ")}`
    ).join("\n");

    // تجميع المهارات
    const skillsText = `
- المحاسبة: ${kb.skills.accounting.join("، ")}
- التقنية: ${kb.skills.tech.join("، ")}
- اللغات: ${kb.skills.languages.join("، ")}
    `;

    return `
أنت المساعد الذكي والممثل الشخصي لـ (${kb.personalInfo.name}).
وظيفتك الإجابة عن أسئلة زوار الموقع، مسؤولي التوظيف، والشركات بناءً على البيانات الحقيقية المرفقة فقط.

--- قواعد إجابة الذكاء الاصطناعي ---
1. التزم بالمعلومات المذكورة أدناه فقط. لا تخترع شهادات أو خبرات غير موجودة.
2. إذا سُئلت عن شهادة حالتها [قيد الحصول / قيد الرفع]، وضح بلباقة أنها "قيد التجهيز وستكون متاحة في الموقع قريباً".
3. عندما يطلب منك زائر تكييف السيرة الذاتية لوظيفة معينة (مثلاً محاسب أو مدخل بيانات)، قم بإبراز الخبرات والمهارات والشهادات المتاحة ذات الصلة بتلك الوظيفة فقط.
4. حافظ على نبرة احترافية، مادية، وواثقة.

--- البيانات المعتمدة لـ ${kb.personalInfo.name} ---
الاسم والصفة: ${kb.personalInfo.name} - ${kb.personalInfo.title}
الملخص: ${kb.personalInfo.summary}

الشهادات الموثقة والحالية:
${certsText}

الخبرات العملية:
${expText}

المهارات المكتسبة:
${skillsText}
`;
}
// ============================================================
// 1. مصفوفة روابط الشهادات والملفات
// ============================================================
const CERT_FILES = {
    "cert-acc-1": "certificates/bachelor-accounting.pdf", // رابط بكالوريوس المحاسبة
    "cert-acc-2": "certificates/extra-system.pdf",        // رابط شهادة إكسترا
    "cert-it-1":  "certificates/icdl-diploma.pdf",        // رابط ICDL
    "cert-lang-1":"certificates/english-b2.pdf"           // رابط اللغة الإنجليزية
};

// ============================================================
// 2. جدول التصاريح والأكواد المعتمدة
// ============================================================
const ACCESS_KEYS = {
    // كود تصريح شامل (Master Key) يفتح جميع الشهادات
    "MASTER-2026": { scope: "ALL", expires: "2026-12-31" },

    // كود مخصص لشهادات المحاسبة فقط
    "ACC-ONLY": { scope: ["cert-acc-1", "cert-acc-2"], expires: "2026-12-31" },

    // كود مخصص لشهادة واحدة فقط (مثال: شهادة إكسترا)
    "EXTRA-PASS": { scope: ["cert-acc-2"], expires: "2026-12-31" }
};

// متغير لتحديد الهدف الحالي ('ALL' أو معرف شهادة معين)
let activeTarget = null;
const SESSION_STORAGE_KEY = "unlocked_certificates_session";

// ============================================================
// 3. تهيئة الأحداث واستعادة الحالة عند تحميل الصفحة
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    restoreUnlockedCertificates();
    setupEventListeners();
});

function setupEventListeners() {
    // تشغيل الفحص عند الضغط على Enter في حقل الإدخال
    const passInput = document.getElementById("passcode");
    if (passInput) {
        passInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                validateCode();
            }
        });
    }

    // إغلاق النافذة المنبثقة عند النقر خارجها
    const modal = document.getElementById("accessModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // إغلاق النافذة عند الضغط على زر Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });
}

// ============================================================
// 4. دمج وتطوير دوال النافذة المنبثقة (Modal Control)
// ============================================================
function openModal(targetId) {
    activeTarget = targetId;
    const errorMsg = document.getElementById("errorMsg");
    const passInput = document.getElementById("passcode");
    
    if (errorMsg) errorMsg.innerText = "";
    if (passInput) {
        passInput.value = "";
        setTimeout(() => passInput.focus(), 100); // التركيز على الحقل تلقائياً
    }

    const titleElem = document.getElementById("modalTitle");
    const descElem = document.getElementById("modalDesc");

    if (targetId === "ALL") {
        if (titleElem) titleElem.innerText = "التصريح الشامل";
        if (descElem) descElem.innerText = "أدخل الكود الشامل لفتح جميع الوثائق والشهادات:";
    } else {
        if (titleElem) titleElem.innerText = "طلب معاينة وثيقة";
        if (descElem) descElem.innerText = "أدخل الرمز الخاص بهذه الوثيقة أو الرمز الشامل:";
    }

    const modal = document.getElementById("accessModal");
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("accessModal");
    if (modal) modal.style.display = "none";
}

// ============================================================
// 5. دالة فحص وتأكيد كود التصريح (Code Validation)
// ============================================================
function validateCode() {
    const inputElem = document.getElementById("passcode");
    const errorMsg = document.getElementById("errorMsg");
    
    if (!inputElem) return;

    // تحويل المدخلات لأحرف كبيرة وإزالة الفراغات
    const inputCode = inputElem.value.trim().toUpperCase();
    const keyData = ACCESS_KEYS[inputCode];

    if (!keyData) {
        if (errorMsg) errorMsg.innerText = "❌ رمز التصريح غير صحيح!";
        return;
    }

    // التحقق من تاريخ الصلاحية
    const today = new Date().toISOString().split('T')[0];
    if (keyData.expires < today) {
        if (errorMsg) errorMsg.innerText = "⚠️ عفواً، انتهت صلاحية هذا التصريح!";
        return;
    }

    // التحقق من نطاق التصريح المسموح (Scope Validation)
    if (keyData.scope === "ALL") {
        alert("🔓 تم تفعيل التصريح الشامل! يمكنك الآن معاينة جميع الوثائق.");
        const allIds = Object.keys(CERT_FILES);
        unlockCertificates(allIds);
        saveUnlockedToSession(allIds);
        closeModal();
    } 
    else if (Array.isArray(keyData.scope)) {
        if (activeTarget === "ALL" || keyData.scope.includes(activeTarget)) {
            alert("🔓 تم التأكد من التصريح بنجاح!");
            unlockCertificates(keyData.scope);
            saveUnlockedToSession(keyData.scope);
            closeModal();
        } else {
            if (errorMsg) errorMsg.innerText = "⚠️ هذا الرمز غير مصرح له بفتح هذه الوثيقة المحددة.";
        }
    }
}

// ============================================================
// 6. دالة فتح الشهادات وتحديث الواجهة (Unlock UI Logic)
// ============================================================
function unlockCertificates(allowedCertIds) {
    allowedCertIds.forEach(id => {
        const certContainer = document.getElementById(`item-${id}`);
        const itemBtn = document.querySelector(`#item-${id} .btn-lock`);

        if (certContainer) {
            certContainer.classList.add("unlocked"); // إضافة كلاس التمييز البصري
        }

        if (itemBtn) {
            itemBtn.innerText = "👁️ فتح الملف";
            itemBtn.classList.add("unlocked-btn");
            itemBtn.onclick = function () {
                const filePath = CERT_FILES[id];
                if (filePath && !filePath.includes("undefined")) {
                    window.open(filePath, "_blank");
                } else {
                    alert("📄 هذه الشهادة مفعّلة في النظام، وسيكون ملفها متاحاً فور رفعه على السيرفر!");
                }
            };
        }
    });
}

// ============================================================
// 7. إدارة الذاكرة المؤقتة للشهادات المفتوحة (Session Storage)
// ============================================================
function saveUnlockedToSession(ids) {
    try {
        let currentSaved = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)) || [];
        const updatedList = Array.from(new Set([...currentSaved, ...ids]));
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
        console.warn("تعذر الحفظ في الذاكرة المؤقتة:", e);
    }
}

function restoreUnlockedCertificates() {
    try {
        const saved = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
        if (saved && Array.isArray(saved) && saved.length > 0) {
            unlockCertificates(saved);
        }
    } catch (e) {
        console.warn("تعذر استعادة الشهادات المفتوحة:", e);
    }
}
