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
    // ============================================================
// 1. قاعدة البيانات والذاكرة
// ============================================================
const USER_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "محاسب ومتخصص في الأنظمة المحاسبية وتقنية المعلومات"
    },
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", status: "متاح", issuer: "جامعة معتمدة" },
        { id: "cert-acc-2", title: "شهادة نظام إكسترا المحاسبي", category: "محاسبة", status: "متاح", issuer: "مركز تدريب" },
        { id: "cert-it-1", title: "دبلوم ICDL", category: "تقنية", status: "متاح", issuer: "ICDL" },
        { id: "cert-lang-1", title: "شهادة إنجليزي B2", category: "لغات", status: "متاح", issuer: "معهد لغات" }
    ],
    experiences: [],
    skills: { accounting: [], tech: [], languages: [] },
    volunteer: []
};

// ============================================================
// 2. دالة رسم وعرض المحتوى ديناميكياً على الشاشة (UI Renderer)
// ============================================================
function renderAllDynamicContent() {
    // عرض الشهادات
    const certContainer = document.getElementById("certificates-container");
    if (certContainer) {
        certContainer.innerHTML = USER_KNOWLEDGE_BASE.certificates.map(c => `
            <div class="cert-card" id="item-${c.id}">
                <h4>${c.title}</h4>
                <p>الجهة: ${c.issuer} | الحالة: <b>${c.status}</b></p>
                ${c.status === 'متاح' ? `<button class="btn-lock" onclick="openModal('${c.id}')">🔒 طلب معاينة</button>` : '<span style="color:#e53e3e;">قيد التجهيز</span>'}
            </div>
        `).join('');
    }

    // عرض الخبرات
    const expContainer = document.getElementById("experiences-container");
    if (expContainer) {
        expContainer.innerHTML = USER_KNOWLEDGE_BASE.experiences.map(e => `
            <div class="exp-card">
                <h4>${e.role} - <span>${e.company}</span></h4>
                <small>${e.period}</small>
                <ul>${e.tasks.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    // عرض المهارات
    const skillContainer = document.getElementById("skills-container");
    if (skillContainer) {
        let skillsHTML = "";
        for (let cat in USER_KNOWLEDGE_BASE.skills) {
            if (USER_KNOWLEDGE_BASE.skills[cat].length > 0) {
                skillsHTML += `<div><b>${cat}:</b> ${USER_KNOWLEDGE_BASE.skills[cat].join(', ')}</div>`;
            }
        }
        skillContainer.innerHTML = skillsHTML;
    }

    // عرض الأعمال التطوعية
    const volContainer = document.getElementById("volunteer-container");
    if (volContainer && USER_KNOWLEDGE_BASE.volunteer) {
        volContainer.innerHTML = USER_KNOWLEDGE_BASE.volunteer.map(v => `
            <div class="vol-card">
                <b>${v.role}</b> في ${v.org} (${v.period})
            </div>
        `).join('');
    }
}

// ============================================================
// 3. دوال لوحة التحكم والإضافة
// ============================================================
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tab}`).style.display = 'block';
    event.currentTarget.classList.add('active');
}

function addNewCertificate() {
    const title = document.getElementById("addCertTitle").value.trim();
    const issuer = document.getElementById("addCertIssuer").value.trim();
    const status = document.getElementById("addCertStatus").value;

    if (!title) return alert("يرجى إدخال عنوان الشهادة");

    const newId = `cert-custom-${Date.now()}`;
    USER_KNOWLEDGE_BASE.certificates.push({
        id: newId, title, category: "عام", status, issuer: issuer || "غير محدد"
    });

    saveAndRefresh();
    alert("✅ تم إضافة الشهادة بنجاح وللذكاء الاصطناعي!");
}

function addNewExperience() {
    const role = document.getElementById("addExpRole").value.trim();
    const company = document.getElementById("addExpCompany").value.trim();
    const period = document.getElementById("addExpPeriod").value.trim();
    const tasks = document.getElementById("addExpTasks").value.split("\n").filter(t => t.trim() !== "");

    if (!role || !company) return alert("يرجى إدخال البيانات الأساسية");

    USER_KNOWLEDGE_BASE.experiences.push({ role, company, period, tasks });
    saveAndRefresh();
    alert("✅ تم إضافة الخبرة!");
}

function addNewSkill() {
    const skill = document.getElementById("addSkillName").value.trim();
    const cat = document.getElementById("addSkillCat").value;

    if (!skill) return alert("أدخل اسم المهارة");

    if (!USER_KNOWLEDGE_BASE.skills[cat]) USER_KNOWLEDGE_BASE.skills[cat] = [];
    USER_KNOWLEDGE_BASE.skills[cat].push(skill);
    
    saveAndRefresh();
    alert("✅ تم إضافة المهارة!");
}

function addNewVolunteer() {
    const role = document.getElementById("addVolRole").value.trim();
    const org = document.getElementById("addVolOrg").value.trim();
    const period = document.getElementById("addVolPeriod").value.trim();

    if (!USER_KNOWLEDGE_BASE.volunteer) USER_KNOWLEDGE_BASE.volunteer = [];
    USER_KNOWLEDGE_BASE.volunteer.push({ role, org, period });
    
    saveAndRefresh();
    alert("✅ تم إضافة العمل التطوعي!");
}

// حفظ البيانات وتحديث الشاشة والنافذة
function saveAndRefresh() {
    localStorage.setItem("user_kb_custom", JSON.stringify(USER_KNOWLEDGE_BASE));
    renderAllDynamicContent(); // تحديث عناصر الصفحة فوراً
    closeAdminModal();
}

function loadDynamicData() {
    const saved = localStorage.getItem("user_kb_custom");
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(USER_KNOWLEDGE_BASE, parsed);
    }
    renderAllDynamicContent(); // رسم المحتوى عند فتح الموقع
}

document.addEventListener("DOMContentLoaded", () => {
    loadDynamicData();
});
    // ============================================================
// إدارة الإضافات والتحكم التكيّفي للذكاء الاصطناعي
// ============================================================

// حالة تكيّف الذكاء الاصطناعي (مفتاح التشغيل والإيقاف)
let isAIAdaptabilityEnabled = localStorage.getItem("ai_adapt_status") !== "OFF";

function toggleAIAdaptability() {
    isAIAdaptabilityEnabled = !isAIAdaptabilityEnabled;
    localStorage.setItem("ai_adapt_status", isAIAdaptabilityEnabled ? "ON" : "OFF");
    
    const btn = document.getElementById("aiToggleBtn");
    if (btn) {
        btn.innerText = isAIAdaptabilityEnabled ? "تفعيل (ON)" : "إيقاف (OFF)";
        btn.style.background = isAIAdaptabilityEnabled ? "#38a169" : "#e53e3e";
    }
    alert(`تم ${isAIAdaptabilityEnabled ? "تفعيل" : "إيقاف"} حرية الذكاء الاصطناعي في التكيف والتعديل.`);
}

// التنقل بين تبويبات لوحة التحكم
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

// دالة إضافة شهادة جديدة وتحديث القاعدة والذكاء فوراً
function addNewCertificate() {
    const title = document.getElementById("addCertTitle").value.trim();
    const issuer = document.getElementById("addCertIssuer").value.trim();
    const status = document.getElementById("addCertStatus").value;

    if (!title) return alert("يرجى إدخال عنوان الشهادة");

    const newCert = {
        id: `cert-custom-${Date.now()}`,
        title: title,
        category: "عام",
        status: status,
        issuer: issuer || "غير محدد"
    };

    USER_KNOWLEDGE_BASE.certificates.push(newCert);
    saveDynamicData();
    alert("✅ تم إضافة الشهادة بنجاح، وتكيف الذكاء الاصطناعي معها فوراً!");
    closeAdminModal();
}

// دالة إضافة خبرة جديدة
function addNewExperience() {
    const role = document.getElementById("addExpRole").value.trim();
    const company = document.getElementById("addExpCompany").value.trim();
    const period = document.getElementById("addExpPeriod").value.trim();
    const tasks = document.getElementById("addExpTasks").value.split("\n").filter(t => t.trim() !== "");

    if (!role || !company) return alert("يرجى إدخال البيانات الأساسية للخبرة");

    USER_KNOWLEDGE_BASE.experiences.push({ role, company, period, tasks });
    saveDynamicData();
    alert("✅ تم إضافة الخبرة وتحديث قاعدة بيانات الذكاء الاصطناعي!");
    closeAdminModal();
}

// دالة إضافة مهارة جديدة
function addNewSkill() {
    const skill = document.getElementById("addSkillName").value.trim();
    const cat = document.getElementById("addSkillCat").value;

    if (!skill) return alert("أدخل اسم المهارة");

    if (!USER_KNOWLEDGE_BASE.skills[cat]) USER_KNOWLEDGE_BASE.skills[cat] = [];
    USER_KNOWLEDGE_BASE.skills[cat].push(skill);
    saveDynamicData();
    alert("✅ تم إضافة المهارة بنجاح!");
    closeAdminModal();
}

// دالة إضافة عمل تطوعي
function addNewVolunteer() {
    const role = document.getElementById("addVolRole").value.trim();
    const org = document.getElementById("addVolOrg").value.trim();
    const period = document.getElementById("addVolPeriod").value.trim();

    if (!USER_KNOWLEDGE_BASE.volunteer) USER_KNOWLEDGE_BASE.volunteer = [];
    USER_KNOWLEDGE_BASE.volunteer.push({ role, org, period });
    saveDynamicData();
    alert("✅ تم إضافة العمل التطوعي بنجاح!");
    closeAdminModal();
}

// حفظ البيانات في المتصفح لاستعادتها دائماً
function saveDynamicData() {
    localStorage.setItem("user_kb_custom", JSON.stringify(USER_KNOWLEDGE_BASE));
}

// استعادة البيانات المضافة عند تحميل الصفحة
function loadDynamicData() {
    const saved = localStorage.getItem("user_kb_custom");
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(USER_KNOWLEDGE_BASE, parsed);
    }
}

// تشغيل الاستعادة تلقائياً عند الفتح
document.addEventListener("DOMContentLoaded", () => {
    loadDynamicData();
});
    
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
