// ============================================================
// 1. قاعدة البيانات الافتراضية والمعرفة للذكاء الاصطناعي
// ============================================================
const DEFAULT_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        location: "جعار - خنفر - أبين - اليمن",
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين، أجمع بين الخبرة المالية العملية والمهارات التدريبية والتيسيرية. متخصص في تأهيل الكوادر وتدريب الأنظمة المحاسبية الآلية والبرامج المكتبية."
    },
    // --- 1. إدارة الأمان وكلمة المرور ---
const MASTER_RECOVERY_PIN = "7777"; // رمز الاستعادة الثابت في حال نسيان كلمة المرور
let isAdminLoggedIn = false;

function getAdminPassword() {
    return localStorage.getItem('admin_password') || '1234'; // كلمة المرور الافتراضية
}

function toggleAdminAuth() {
    if (isAdminLoggedIn) {
        isAdminLoggedIn = false;
        document.getElementById('admin-content-body').style.display = 'none';
        document.getElementById('auth-btn').innerText = '🔒 تسجيل الدخول للوحة';
        alert('تم تسجيل الخروج من لوحة التحكم.');
        return;
    }

    const pass = prompt('أدخل كلمة مرور لوحة التحكم (الافتراضية: 1234):');
    if (pass === null) return;

    if (pass === getAdminPassword()) {
        unlockAdminPanel();
    } else {
        const reset = confirm('كلمة المرور غير صحيحة! هل نسيت كلمة المرور وتريد استعادتها بـ Master PIN؟');
        if (reset) {
            const pin = prompt('أدخل رمز الاستعادة (Master PIN):');
            if (pin === MASTER_RECOVERY_PIN) {
                const newPass = prompt('أدخل كلمة المرور الجديدة للوحة التحكم:');
                if (newPass) {
                    localStorage.setItem('admin_password', newPass);
                    alert('تم تغيير كلمة المرور بنجاح وتسجيل الدخول!');
                    unlockAdminPanel();
                }
            } else {
                alert('رمز الاستعادة غير صحيح!');
            }
        }
    }
}

function unlockAdminPanel() {
    isAdminLoggedIn = true;
    document.getElementById('admin-content-body').style.display = 'block';
    document.getElementById('auth-btn').innerText = '🔓 تسجيل الخروج';
    renderAdminLists(); // عرض قوائم التعديل والحذف
}

function changeAdminPassword() {
    const currentPass = document.getElementById('currentPassInput').value;
    const newPass = document.getElementById('newPassInput').value;

    if (currentPass !== getAdminPassword()) {
        alert('كلمة المرور الحالية غير صحيحة!');
        return;
    }
    if (!newPass) {
        alert('يرجى كتابة كلمة المرور الجديدة');
        return;
    }

    localStorage.setItem('admin_password', newPass);
    alert('تم تحديث كلمة المرور بنجاح!');
    document.getElementById('currentPassInput').value = '';
    document.getElementById('newPassInput').value = '';
}

// --- 2. دوال الحفظ والتعديل والحذف للشهادات ---
function saveCertificate() {
    const editIndex = parseInt(document.getElementById('certEditIndex').value);
    const title = document.getElementById('certTitle').value.trim();
    const issuer = document.getElementById('certIssuer').value.trim();
    const category = document.getElementById('certCategory').value.trim();
    const imageUrl = document.getElementById('certImage').value.trim();
    const pin = document.getElementById('certPin').value.trim();

    if (!title || !issuer) {
        alert('يرجى إدخال اسم الشهادة والجهة المصدرة');
        return;
    }

    let certs = JSON.parse(localStorage.getItem('my_certificates') || '[]');

    if (editIndex >= 0) {
        // تعديل شهادة موجودة
        certs[editIndex] = { ...certs[editIndex], title, issuer, category, imageUrl, pin };
        document.getElementById('certEditIndex').value = "-1";
        document.getElementById('btn-save-cert').innerText = "إضافة / حفظ الشهادة";
    } else {
        // إضافة شهادة جديدة
        certs.push({ title, issuer, category, imageUrl, pin, unlocked: false });
    }

    localStorage.setItem('my_certificates', JSON.stringify(certs));
    resetCertForm();
    renderCertificates();
    renderAdminLists();
    alert('تم الحفظ بنجاح!');
}

function editCert(index) {
    const certs = JSON.parse(localStorage.getItem('my_certificates') || '[]');
    const cert = certs[index];
    if (!cert) return;

    document.getElementById('certEditIndex').value = index;
    document.getElementById('certTitle').value = cert.title || '';
    document.getElementById('certIssuer').value = cert.issuer || '';
    document.getElementById('certCategory').value = cert.category || '';
    document.getElementById('certImage').value = cert.imageUrl || '';
    document.getElementById('certPin').value = cert.pin || '';
    document.getElementById('btn-save-cert').innerText = "💾 حفظ التعديلات";
}

function deleteCert(index) {
    if (!confirm('هل أنت تأكد من حذف هذه الشهادة؟')) return;
    let certs = JSON.parse(localStorage.getItem('my_certificates') || '[]');
    certs.splice(index, 1);
    localStorage.setItem('my_certificates', JSON.stringify(certs));
    renderCertificates();
    renderAdminLists();
}

function resetCertForm() {
    document.getElementById('certTitle').value = '';
    document.getElementById('certIssuer').value = '';
    document.getElementById('certCategory').value = '';
    document.getElementById('certImage').value = '';
    document.getElementById('certPin').value = '';
}

// --- 3. عرض قائمة العناصر داخل لوحة التحكم مع أزرار التحكم ---
function renderAdminLists() {
    // قائمة الشهادات للتحكم
    const certs = JSON.parse(localStorage.getItem('my_certificates') || '[]');
    const certsListDiv = document.getElementById('admin-certs-list');
    if (certsListDiv) {
        let html = '<h4>قائمة الشهادات المضافة:</h4>';
        certs.forEach((c, i) => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; margin-top:6px; border-radius:6px; border:1px solid #e2e8f0;">
                    <span><strong>${c.title}</strong> (${c.issuer})</span>
                    <div>
                        <button onclick="editCert(${i})" style="background:#3182ce; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">✏️ تعديل</button>
                        <button onclick="deleteCert(${i})" style="background:#e53e3e; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ حذف</button>
                    </div>
                </div>`;
        });
        certsListDiv.innerHTML = certs.length ? html : '<p style="color:#718096;">لا توجد شهادات حالياً.</p>';
    }
}
    // 1. تعليمات شخصية الذكاء الاصطناعي (AI Persona Guidelines)
function getAIBaseContext() {
    const experiences = JSON.parse(localStorage.getItem('my_experiences') || '[]');
    const volunteerWork = JSON.parse(localStorage.getItem('my_volunteer') || '[]');
    const skills = JSON.parse(localStorage.getItem('my_skills') || '[]');
    const certs = JSON.parse(localStorage.getItem('my_certificates') || '[]');

    return `
أنت المساعد الشخصي والممثل المهني الذكي لأحمد عادل ناجي ذياب.

شخصيتك وطريقة حديثك:
- تتحدث كإنسان طبيعي، لبق، ودود، واحترافي في آن واحد.
- هدفك الأسمى هو التسويق لأحمد بأفضل صورة ممكنة، والدفاع عن مصالحه، وإبراز خبراته وقيمته المضافة.
- تحدث دائماً بنبرة إيجابية، واعرض أعماله التطوعية وخبراته بدقة وجمالية تعكس شغفه وأثره دون تحريف للحقائق أو تقديمها بصورة غير مناسبة.

بيانات أحمد الحالية:
- الخبرات المهنية: ${JSON.stringify(experiences)}
- الأعمال التطوعية: ${JSON.stringify(volunteerWork)}
- المهارات والمجالات: ${JSON.stringify(skills)}
- الشهادات والمؤهلات: ${JSON.stringify(certs.map(c => ({ title: c.title, issuer: c.issuer, category: c.category })))}
`;
}

// 2. دالة عرض الشهادات مع دعم رابط الصورة
function renderCertificates() {
    const certs = JSON.parse(localStorage.getItem('my_certificates') || '[]');
    const container = document.getElementById('certs-container');
    if (!container) return;

    if (certs.length === 0) {
        container.innerHTML = '<p class="section-desc">لا توجد شهادات مضافة حالياً.</p>';
        return;
    }

    // تجميع الشهادات حسب الفئة
    const categories = {};
    certs.forEach((cert, index) => {
        const cat = cert.category || 'شهادات عامة';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ ...cert, originalIndex: index });
    });

    let html = '';
    for (const [category, items] of Object.entries(categories)) {
        html += `<div class="cert-category"><h3>${category}</h3>`;
        items.forEach(item => {
            const isUnlocked = item.unlocked || false;
            const imgBtn = (isUnlocked && item.imageUrl) 
                ? `<a href="${item.imageUrl}" target="_blank" class="btn-lock unlocked-btn" style="text-decoration:none; margin-left:8px;">🖼️ عرض الشهادة</a>` 
                : '';

            html += `
                <div class="cert-item ${isUnlocked ? 'unlocked' : ''}">
                    <div class="cert-info">
                        <h4>${item.title}</h4>
                        <p>${item.issuer}</p>
                    </div>
                    <div style="display:flex; align-items:center;">
                        ${imgBtn}
                        <button class="btn-lock" onclick="unlockCert(${item.originalIndex})">
                            ${isUnlocked ? '🔓 تم الفتح' : '🔒 فتح الشهادة'}
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    container.innerHTML = html;
}

// 3. دالة إضافة المهارات بدعم المجالات المتعددة
function addNewSkill() {
    const category = document.getElementById('skillCategory').value.trim();
    const name = document.getElementById('skillName').value.trim();
    const level = document.getElementById('skillLevel').value;

    if (!category || !name) {
        alert('يرجى تحديد المجال اسم المهارة');
        return;
    }

    const skills = JSON.parse(localStorage.getItem('my_skills') || '[]');
    skills.push({ category, name, level });
    localStorage.setItem('my_skills', JSON.stringify(skills));

    document.getElementById('skillCategory').value = '';
    document.getElementById('skillName').value = '';
    
    renderSkills();
    alert('تمت إضافة المهارة بنجاح!');
}

// 4. دالة عرض المهارات مقسمة حسب المجال
function renderSkills() {
    const skills = JSON.parse(localStorage.getItem('my_skills') || '[]');
    const container = document.getElementById('skills-container');
    if (!container) return;

    if (skills.length === 0) {
        container.innerHTML = '<p class="section-desc">لم يتم إضافة مهارات بعد.</p>';
        return;
    }

    const categories = {};
    skills.forEach(skill => {
        const cat = skill.category || 'مهارات عامة';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(skill);
    });

    let html = '';
    for (const [cat, items] of Object.entries(categories)) {
        html += `<div style="margin-bottom: 18px;">
            <h4 style="color: var(--primary-color); margin-bottom: 8px;">${cat}</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
        
        items.forEach(s => {
            html += `<span style="background: var(--bg-subtle); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.9rem;">
                <strong>${s.name}</strong> <small style="color: var(--text-muted);">(${s.level})</small>
            </span>`;
        });
        
        html += `</div></div>`;
    }
    container.innerHTML = html;
}
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", status: "متاح", issuer: "جامعة أبين (2026)" },
        { id: "cert-acc-2", title: "شهادة نظام إكسترا للمحاسبة والإدارة", category: "محاسبة", status: "متاح", issuer: "بن مقيبل للأنظمة ومؤسسة بلقيس (2022)" },
        { id: "cert-it-1", title: "دبلوم قيادة الحاسوب ICDL", category: "تقنية معلومات", status: "متاح", issuer: "وزارة التعليم الفني - معهد جبس (2020)" },
        { id: "cert-lang-1", title: "شهادة اللغة الإنجليزية (B2)", category: "لغات", status: "متاح", issuer: "وزارة التعليم الفني - معهد جبس (2022)" },
        { id: "cert-acc-3", title: "شهادة المعايير الدولية IFRS", category: "محاسبة", status: "قيد الحصول / قيد الرفع", issuer: "جاري العمل عليها" }
    ],
    experiences: [
        {
            role: "مدرب أنظمة محاسبية وماليات",
            company: "مراكز تدريبية ومؤسسات أهلية",
            period: "2023 - الحالي",
            tasks: [
                "تدريب وإدارة تطبيقات نظام إكسترا المحاسبي الآلي.",
                "إدارة الحسابات اليومية وتسجيل القيود وإصدار التقارير المالية.",
                "مراجعة المطابقات البنكية وحسابات الموردين والعملاء."
            ]
        }
    ],
    skills: {
        accounting: ["نظام إكسترا (Extra System)", "إعداد القوائم المالية", "التسويات البنكية", "المراجعة المستندية"],
        tech: ["إدخال البيانات بمهارة عالية", "برامج Microsoft Office", "إدارة قواعد البيانات"],
        languages: ["اللغة العربية (اللغة الأم)", "اللغة الإنجليزية (مستوى B2)"]
    },
    volunteer: []
};

// تحميل البيانات المفضلة من LocalStorage أو اعتماد الافتراضية
let USER_KNOWLEDGE_BASE = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE_BASE));

// ============================================================
// 2. نظام روابط الشهادات وأكواد التصاريح (Access System)
// ============================================================
const CERT_FILES = {
    "cert-acc-1": "certificates/bachelor-accounting.pdf",
    "cert-acc-2": "certificates/extra-system.pdf",
    "cert-it-1":  "certificates/icdl-diploma.pdf",
    "cert-lang-1":"certificates/english-b2.pdf"
};

const ACCESS_KEYS = {
    "MASTER-2026": { scope: "ALL", expires: "2026-12-31" },
    "ACC-ONLY":    { scope: ["cert-acc-1", "cert-acc-2"], expires: "2026-12-31" },
    "EXTRA-PASS":  { scope: ["cert-acc-2"], expires: "2026-12-31" }
};

let activeTarget = null;
const SESSION_STORAGE_KEY = "unlocked_certificates_session";
let isAIAdaptabilityEnabled = localStorage.getItem("ai_adapt_status") !== "OFF";

// ============================================================
// 3. دالة رسم وعرض المحتوى ديناميكياً على الشاشة (UI Renderer)
// ============================================================
function renderAllDynamicContent() {
    const unlockedList = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)) || [];

    // عرض الشهادات
    const certContainer = document.getElementById("certificates-container");
    if (certContainer) {
        certContainer.innerHTML = USER_KNOWLEDGE_BASE.certificates.map(c => {
            const isUnlocked = unlockedList.includes(c.id);
            return `
            <div class="cert-item ${isUnlocked ? 'unlocked' : ''}" id="item-${c.id}" style="border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 8px;">
                <div class="cert-info">
                    <h4 style="margin:0 0 5px 0;">${c.title}</h4>
                    <p style="margin:0; color:#666; font-size:13px;">الجهة: ${c.issuer} | التصنيف: ${c.category}</p>
                </div>
                <div style="margin-top: 10px;">
                ${
                    c.status === 'قيد الحصول / قيد الرفع' 
                    ? '<span style="color:#e53e3e; font-size:13px; font-weight:bold;">⏳ قيد التجهيز</span>'
                    : isUnlocked 
                        ? `<button class="btn-lock unlocked-btn" onclick="openCertificateFile('${c.id}')" style="background:#2b6cb0; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">👁️ فتح الملف</button>`
                        : `<button class="btn-lock" onclick="openModal('${c.id}')" style="background:#e2e8f0; border:1px solid #cbd5e0; padding:6px 12px; border-radius:4px; cursor:pointer;">🔒 طلب معاينة</button>`
                }
                </div>
            </div>`;
        }).join('');
    }

    // عرض الخبرات
    const expContainer = document.getElementById("experiences-container");
    if (expContainer) {
        expContainer.innerHTML = USER_KNOWLEDGE_BASE.experiences.map(e => `
            <div class="exp-card" style="border-right: 3px solid #2b6cb0; padding-right: 15px; margin-bottom: 15px;">
                <h4 style="margin:0;">${e.role} - <span style="color:#2b6cb0;">${e.company}</span></h4>
                <small style="color:#718096;">${e.period}</small>
                <ul style="margin-top:8px; padding-right:20px;">${e.tasks.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    // عرض المهارات
    const skillContainer = document.getElementById("skills-container");
    if (skillContainer) {
        let skillsHTML = "";
        const catNames = { accounting: "📊 محاسبة ومالية", tech: "💻 تقنية معلومات", languages: "🌐 لغات" };
        for (let cat in USER_KNOWLEDGE_BASE.skills) {
            if (USER_KNOWLEDGE_BASE.skills[cat].length > 0) {
                const label = catNames[cat] || cat;
                skillsHTML += `<div style="margin-bottom:10px;"><b>${label}:</b> ${USER_KNOWLEDGE_BASE.skills[cat].join(' • ')}</div>`;
            }
        }
        skillContainer.innerHTML = skillsHTML || "<p>لا يوجد مهارات مضافة حالياً</p>";
    }

    // عرض الأعمال التطوعية
    const volContainer = document.getElementById("volunteer-container");
    if (volContainer) {
        volContainer.innerHTML = (USER_KNOWLEDGE_BASE.volunteer && USER_KNOWLEDGE_BASE.volunteer.length > 0)
            ? USER_KNOWLEDGE_BASE.volunteer.map(v => `
                <div class="vol-card" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                    <b>${v.role}</b> في ${v.org} <span style="color:#718096; font-size:12px;">(${v.period})</span>
                </div>
            `).join('')
            : "<p style='color:#a0aec0; font-size:13px;'>لا توجد أعمال تطوعية مضافة حالياً.</p>";
    }

    // تحديث حالة زر الذكاء الاصطناعي في النافذة
    const aiBtn = document.getElementById("aiToggleBtn");
    if (aiBtn) {
        aiBtn.innerText = isAIAdaptabilityEnabled ? "تفعيل (ON)" : "إيقاف (OFF)";
        aiBtn.style.background = isAIAdaptabilityEnabled ? "#38a169" : "#e53e3e";
    }
}

// ============================================================
// 4. دوال لوحة التحكم والإضافة الشاملة
// ============================================================
function switchAdminTab(tabName, evt) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.style.display = 'block';
    
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
    }
}

function toggleAIAdaptability() {
    isAIAdaptabilityEnabled = !isAIAdaptabilityEnabled;
    localStorage.setItem("ai_adapt_status", isAIAdaptabilityEnabled ? "ON" : "OFF");
    saveAndRefresh();
    alert(`تم ${isAIAdaptabilityEnabled ? "تفعيل" : "إيقاف"} تكيف وتدريب الذكاء الاصطناعي.`);
}

function addNewCertificate() {
    const title = document.getElementById("addCertTitle").value.trim();
    const issuer = document.getElementById("addCertIssuer").value.trim();
    const status = document.getElementById("addCertStatus").value;

    if (!title) return alert("يرجى إدخال عنوان الشهادة");

    USER_KNOWLEDGE_BASE.certificates.push({
        id: `cert-custom-${Date.now()}`,
        title,
        category: "عام",
        status,
        issuer: issuer || "جهة غير محددة"
    });

    saveAndRefresh();
    alert("✅ تم إضافة الشهادة بنجاح وللذكاء الاصطناعي!");
}

function addNewExperience() {
    const role = document.getElementById("addExpRole").value.trim();
    const company = document.getElementById("addExpCompany").value.trim();
    const period = document.getElementById("addExpPeriod").value.trim();
    const tasksRaw = document.getElementById("addExpTasks").value;
    const tasks = tasksRaw.split("\n").filter(t => t.trim() !== "");

    if (!role || !company) return alert("يرجى إدخال المسمى الوظيفي والجهة");

    USER_KNOWLEDGE_BASE.experiences.push({ role, company, period, tasks });
    saveAndRefresh();
    alert("✅ تم إضافة الخبرة بنجاح!");
}

function addNewSkill() {
    const skill = document.getElementById("addSkillName").value.trim();
    const cat = document.getElementById("addSkillCat").value;

    if (!skill) return alert("يرجى إدخال اسم المهارة");

    if (!USER_KNOWLEDGE_BASE.skills[cat]) USER_KNOWLEDGE_BASE.skills[cat] = [];
    USER_KNOWLEDGE_BASE.skills[cat].push(skill);
    
    saveAndRefresh();
    alert("✅ تم إضافة المهارة بنجاح!");
}

function addNewVolunteer() {
    const role = document.getElementById("addVolRole").value.trim();
    const org = document.getElementById("addVolOrg").value.trim();
    const period = document.getElementById("addVolPeriod").value.trim();

    if (!role || !org) return alert("يرجى إدخال بيانات التطوع");

    if (!USER_KNOWLEDGE_BASE.volunteer) USER_KNOWLEDGE_BASE.volunteer = [];
    USER_KNOWLEDGE_BASE.volunteer.push({ role, org, period });
    
    saveAndRefresh();
    alert("✅ تم إضافة العمل التطوعي بنجاح!");
}

function saveAndRefresh() {
    localStorage.setItem("user_kb_custom", JSON.stringify(USER_KNOWLEDGE_BASE));
    renderAllDynamicContent();
    if (typeof closeAdminModal === "function") closeAdminModal();
}

function loadDynamicData() {
    const saved = localStorage.getItem("user_kb_custom");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(USER_KNOWLEDGE_BASE, parsed);
        } catch (e) {
            console.error("خطأ في قراءة البيانات المحفوظة", e);
        }
    }
    renderAllDynamicContent();
}

// ============================================================
// 5. بناء سياق الذكاء الاصطناعي من قاعدة البيانات المحدثة
// ============================================================
function getAIBaseContext() {
    const kb = USER_KNOWLEDGE_BASE;
    
    const certsText = kb.certificates.map(c => `- ${c.title} (${c.issuer}) - الحالة: [${c.status}]`).join("\n");
    const expText = kb.experiences.map(e => `- ${e.role} في ${e.company} (${e.period}):\n  * ${e.tasks.join("\n  * ")}`).join("\n");
    
    let skillsText = "";
    for (let cat in kb.skills) {
        skillsText += `- ${cat}: ${kb.skills[cat].join("، ")}\n`;
    }

    return `
أنت المساعد الذكي الخاص بالمستشار (${kb.personalInfo.name}).
الصفة: ${kb.personalInfo.title}
العنوان والاتصال: ${kb.personalInfo.location}
الملخص: ${kb.personalInfo.summary}

--- البيانات الحقيقية الحالية المعتمدة ---
الشهادات والمؤهلات:
${certsText}

الخبرات العملية:
${expText}

المهارات:
${skillsText}

تعليمات الرد: أجب بإيجاز واحترافية باللغة العربية معتمدًا فقط على المعلومات أعلاه.
`;
}

// ============================================================
// 6. التحكم بالمعاينة والتصاريح (Modal Logic)
// ============================================================
function openModal(targetId) {
    activeTarget = targetId;
    const errorMsg = document.getElementById("errorMsg");
    const passInput = document.getElementById("passcode");
    
    if (errorMsg) errorMsg.innerText = "";
    if (passInput) {
        passInput.value = "";
        setTimeout(() => passInput.focus(), 100);
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

function validateCode() {
    const inputElem = document.getElementById("passcode");
    const errorMsg = document.getElementById("errorMsg");
    if (!inputElem) return;

    const inputCode = inputElem.value.trim().toUpperCase();
    const keyData = ACCESS_KEYS[inputCode];

    if (!keyData) {
        if (errorMsg) errorMsg.innerText = "❌ رمز التصريح غير صحيح!";
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (keyData.expires < today) {
        if (errorMsg) errorMsg.innerText = "⚠️ عفواً، انتهت صلاحية هذا التصريح!";
        return;
    }

    if (keyData.scope === "ALL") {
        alert("🔓 تم تفعيل التصريح الشامل! يمكنك الآن معاينة جميع الوثائق.");
        const allIds = USER_KNOWLEDGE_BASE.certificates.map(c => c.id);
        saveUnlockedToSession(allIds);
        closeModal();
        renderAllDynamicContent();
    } 
    else if (Array.isArray(keyData.scope)) {
        if (activeTarget === "ALL" || keyData.scope.includes(activeTarget)) {
            alert("🔓 تم التأكد من التصريح بنجاح!");
            saveUnlockedToSession(keyData.scope);
            closeModal();
            renderAllDynamicContent();
        } else {
            if (errorMsg) errorMsg.innerText = "⚠️ هذا الرمز غير مصرح له بفتح هذه الوثيقة المحددة.";
        }
    }
}

function openCertificateFile(id) {
    const filePath = CERT_FILES[id];
    if (filePath) {
        window.open(filePath, "_blank");
    } else {
        alert("📄 هذه الشهادة مفعّلة في النظام، وسيكون ملف المعاينة متاحاً فور رفعه على السيرفر!");
    }
}

function saveUnlockedToSession(ids) {
    try {
        let currentSaved = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)) || [];
        const updatedList = Array.from(new Set([...currentSaved, ...ids]));
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
        console.warn("تعذر الحفظ في الذاكرة المؤقتة:", e);
    }
}

// ============================================================
// 7. تهيئة التشغيل عند تحميل الصفحة
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    loadDynamicData();

    // أحداث المفاتيح والنافذة المنبثقة
    const passInput = document.getElementById("passcode");
    if (passInput) {
        passInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") validateCode();
        });
    }

    const modal = document.getElementById("accessModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });
});
