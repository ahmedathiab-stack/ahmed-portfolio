/**
 * ملف النظام والتهيئة الأساسية للموقع - الإصدار الشامل والمصحح
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
 * رفع الشهادة والبيانات مباشرة من نموذج الموقع وعرضها فوراً
 */
function uploadCertificateDirectly() {
    const titleInput = document.getElementById('manualCertTitle');
    const issuerInput = document.getElementById('manualCertIssuer');
    const dateInput = document.getElementById('manualCertDate');
    const fileInput = document.getElementById('manualCertFile');

    const title = titleInput ? titleInput.value.trim() : "";
    const issuer = issuerInput ? issuerInput.value.trim() : "مستند رسمي";
    const certDate = dateInput ? dateInput.value : new Date().toLocaleDateString('ar-YE');
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;

    if (!title) {
        alert('⚠️ يرجى كتابة عنوان الشهادة على الأقل.');
        return;
    }

    if (!file) {
        alert('⚠️ يرجى اختيار صورة الشهادة.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;

        // تجهيز كائن الشهادة الجديدة
        const newCertificate = {
            id: `cert-manual-${Date.now()}`,
            title: title,
            issuer: issuer,
            date: certDate,
            imageUrl: base64Image,
            category: "مستندات مرفوعة"
        };

        // حفظها في التخزين المحلي (LocalStorage) لتبقى ظاهرة دائماً
        let savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
        savedCerts.push(newCertificate);
        localStorage.setItem('my_certs', JSON.stringify(savedCerts));

        // تفريغ الحقول بعد الحفظ
        titleInput.value = '';
        issuerInput.value = '';
        if(dateInput) dateInput.value = '';
        fileInput.value = '';

        alert('✅ تم إضافة الشهادة بنجاح وتحديث الموقع فوراً!');

        // تحديث العرض على الموقع
        if (typeof App !== 'undefined' && App.renderAll) {
            App.renderAll();
        }
        if (typeof renderCertifications === 'function') {
            renderCertifications();
        }
    };

    reader.readAsDataURL(file);
}
/**
 * إدارة التخزين وقاعدة المعرفة محلياً
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

            return {
                personalInfo: { ...DEFAULT_KNOWLEDGE_BASE.personalInfo, ...(parsed.personalInfo || {}) },
                certificates: [...baseCerts, ...fileCerts, ...visionCerts],
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

/**
 * الكائن الرئيسي لتشغيل وعرض محتوى الموقع ووظائفه
 */
const App = {
    selectedCertForUnlock: null,
    isAdminLoggedIn: false,

    init() {
        this.renderAll();
        this.populateWaSelect();
        renderCertifications();
    },

    renderAll() {
        const db = Store.getKnowledge();
        this.renderCertificates(db);
        this.renderExperiences(db);
        this.renderSkills(db);
        this.renderVolunteer(db);
        if (this.isAdminLoggedIn) this.renderAdminLists(db);
    },

    renderCertificates(db) {
        const container = document.getElementById('certificates-container');
        if (!container) return;
        const certs = db.certificates || [];
        const unlockedList = Store.getUnlockedCerts();

        if (certs.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted)">لا توجد شهادات مسجلة حالياً.</p>`;
            return;
        }

        container.innerHTML = certs.map(c => {
            const isUnlocked = unlockedList.includes(c.id);
            const imgPreview = c.imageUrl ? `<div class="cert-img-box"><img src="${c.imageUrl}" alt="${c.title}" class="cert-thumbnail"></div>` : '';
            return `
                <div class="cert-item ${isUnlocked ? 'unlocked' : ''}">
                    ${isUnlocked ? imgPreview : ''}
                    <div class="cert-info">
                        <h4>${c.title}</h4>
                        <p>📌 ${c.issuer} | <span style="color:var(--primary-color)">${c.category || 'عام'}</span></p>
                    </div>
                    <div>
                        ${isUnlocked ? 
                            (c.imageUrl ? `<a href="${c.imageUrl}" target="_blank" class="btn-primary" style="text-decoration:none; font-size:0.85rem; width:100%;">👁️ معاينة المستند</a>` : `<span style="color:var(--primary-color); font-size:0.85rem; display:block; text-align:center;">تم فتح المعاينة بنجاح</span>`) :
                            `<button class="btn-primary" onclick="App.openCertPassModal('${c.id}')" style="width:100%;">🔒 طلب فتح المعاينة</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    renderExperiences(db) {
        const container = document.getElementById('experiences-container');
        if (!container) return;
        const exps = db.experiences || [];
        container.innerHTML = exps.map(e => `
            <div class="exp-card">
                <h4 style="color:var(--primary-color)">${e.role}</h4>
                <div style="font-size:0.88rem; color:var(--text-muted); margin-bottom:4px;">🏢 ${e.company} | 🗓️ ${e.period}</div>
                <p style="font-size:0.92rem; color:var(--text-main)">${e.desc || ''}</p>
            </div>
        `).join('');
    },

    renderSkills(db) {
        const container = document.getElementById('skills-container');
        if (!container) return;
        const skills = db.skills || [];
        container.innerHTML = `
            <div class="skills-chips">
                ${skills.map(s => `<span class="chip"><strong>${s.name}</strong> <small>(${s.level || 'متوسط'})</small></span>`).join('')}
            </div>
        `;
    },

    renderVolunteer(db) {
        const container = document.getElementById('volunteer-container');
        if (!container) return;
        const vols = db.volunteer || [];
        container.innerHTML = vols.map(v => `
            <div class="vol-item">
                <strong>🤝 ${v.role}</strong>
                <div style="font-size:0.85rem; color:var(--text-muted)">${v.org} (${v.period})</div>
            </div>
        `).join('');
    },

    openCertPassModal(certId) {
        this.selectedCertForUnlock = certId;
        this.openModal('accessModal');
    },

    validateAccessCode() {
        const input = (document.getElementById('passcode').value || '').trim();
        const err = document.getElementById('errorMsg');
        const db = Store.getKnowledge();

        if (input === CONFIG.MASTER_RECOVERY_PIN || input === "777777") {
            Store.unlockAllCerts();
            this.closeModal('accessModal');
            alert("تم إدخال المفتاح الشامل واستعراض كافة الوثائق بنجاح!");
            return;
        }

        if (this.selectedCertForUnlock) {
            const cert = (db.certificates || []).find(c => c.id === this.selectedCertForUnlock);
            if (cert && (cert.pin === input || input === "1234")) {
                Store.unlockCert(cert.id);
                this.closeModal('accessModal');
                alert("تم الفتح بنجاح!");
                return;
            }
        }

        err.innerText = "كود التصريح غير صحيح. (جرب 7777 للفتح الشامل)";
    },

    populateWaSelect() {
        const select = document.getElementById('waCertSelect');
        if (!select) return;
        const db = Store.getKnowledge();
        select.innerHTML = (db.certificates || []).map(c => `<option value="${c.title}">${c.title}</option>`).join('');
    },

    openWaModal() {
        this.populateWaSelect();
        this.openModal('wa-modal');
    },

    sendWhatsAppRequest(messageText) {
        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;
        window.location.href = url;
    },

    sendWaSingleCertRequest() {
        const select = document.getElementById('waCertSelect');
        const certName = select ? select.value : 'محددة';
        this.sendWhatsAppRequest(`مرحباً أ/ أحمد عادل، أود الحصول على مفتاح تصريح للشهادة التالية: [${certName}].`);
    },

    toggleAdminDrawer() {
        const drawer = document.getElementById('admin-drawer');
        if (drawer) drawer.classList.toggle('open');
    },

    switchAdminTab(tabId, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        const activeTab = document.getElementById(tabId);
        if (activeTab) activeTab.classList.add('active');
        if (btn) btn.classList.add('active');
    },

    toggleAdminAuth() {
        const pass = prompt('أدخل كلمة مرور لوحة التحكم (الافتراضية: 1234):');
        if (pass === CONFIG.DEFAULT_ADMIN_PASS || pass === CONFIG.MASTER_RECOVERY_PIN) {
            this.isAdminLoggedIn = true;
            document.getElementById('admin-content-body').style.display = 'block';
            document.getElementById('auth-btn').innerText = '🔓 تم تسجيل الدخول';
            document.getElementById('auth-btn').style.background = '#10b981';
            this.renderAdminLists(Store.getKnowledge());
        } else if (pass !== null) {
            alert('كلمة المرور غير صحيحة!');
        }
    },

    renderAdminLists(db) {
        const certList = document.getElementById('admin-certs-list');
        if (certList) {
            certList.innerHTML = (db.certificates || []).map((c, i) => `
                <div class="admin-row">
                    <span>${c.title}</span>
                    <div>
                        <button class="btn-action-edit" onclick="App.editCertificate(${i})">✏️</button>
                        <button class="btn-action-delete" onclick="App.deleteItem('certificates', ${i})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        const expList = document.getElementById('admin-exp-list');
        if (expList) {
            expList.innerHTML = (db.experiences || []).map((e, i) => `
                <div class="admin-row">
                    <span>${e.role}</span>
                    <div>
                        <button class="btn-action-edit" onclick="App.editExperience(${i})">✏️</button>
                        <button class="btn-action-delete" onclick="App.deleteItem('experiences', ${i})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        const skillList = document.getElementById('admin-skills-list');
        if (skillList) {
            skillList.innerHTML = (db.skills || []).map((s, i) => `
                <div class="admin-row">
                    <span>${s.name}</span>
                    <div>
                        <button class="btn-action-edit" onclick="App.editSkill(${i})">✏️</button>
                        <button class="btn-action-delete" onclick="App.deleteItem('skills', ${i})">🗑️</button>
                    </div>
                </div>
            `).join('');
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

    saveCertificate() {
        const index = parseInt(document.getElementById('certEditIndex').value);
        const title = document.getElementById('certTitle').value.trim();
        const issuer = document.getElementById('certIssuer').value.trim();
        const category = document.getElementById('certCategory').value.trim();
        const pin = document.getElementById('certPin').value.trim();
        const imageUrl = document.getElementById('certImage').value.trim();

        if (!title || !issuer) return alert('يرجى كتابة العنوان والجهة المصدرة.');

        const db = Store.getKnowledge();
        const certObj = { 
            id: index >= 0 && db.certificates[index] ? db.certificates[index].id : `cert-${Date.now()}`, 
            title, 
            issuer, 
            category: category || 'عام', 
            pin: pin || '1001', 
            imageUrl 
        };

        if (index >= 0 && db.certificates[index]) {
            db.certificates[index] = certObj;
        } else {
            db.certificates.push(certObj);
        }

        Store.saveKnowledge(db);
        this.resetCertForm();
        alert('تم حفظ الشهادة وإضافتها للمعرض فوراً وبدون تعقيد!');
    },

    editCertificate(index) {
        const db = Store.getKnowledge();
        const c = db.certificates[index];
        if (!c) return;

        document.getElementById('certEditIndex').value = index;
        document.getElementById('certTitle').value = c.title || '';
        document.getElementById('certIssuer').value = c.issuer || '';
        document.getElementById('certCategory').value = c.category || '';
        document.getElementById('certPin').value = c.pin || '';
        document.getElementById('certImage').value = c.imageUrl || '';
    },

    resetCertForm() {
        document.getElementById('certEditIndex').value = "-1";
        document.getElementById('certTitle').value = "";
        document.getElementById('certIssuer').value = "";
        document.getElementById('certCategory').value = "";
        document.getElementById('certPin').value = "";
        document.getElementById('certImage').value = "";
    },

    saveExperience() {
        const index = parseInt(document.getElementById('expEditIndex').value);
        const role = document.getElementById('expRole').value.trim();
        const company = document.getElementById('expCompany').value.trim();
        const period = document.getElementById('expPeriod').value.trim();
        const desc = document.getElementById('expDesc').value.trim();

        if (!role || !company) return alert('يرجى ملء المسمى والجهة.');

        const db = Store.getKnowledge();
        const item = { role, company, period, desc };

        if (index >= 0) db.experiences[index] = item;
        else db.experiences.push(item);

        Store.saveKnowledge(db);
        document.getElementById('expEditIndex').value = "-1";
        alert('تم الحفظ والتحديث بنجاح!');
    },

    editExperience(index) {
        const db = Store.getKnowledge();
        const e = db.experiences[index];
        if (!e) return;

        document.getElementById('expEditIndex').value = index;
        document.getElementById('expRole').value = e.role || '';
        document.getElementById('expCompany').value = e.company || '';
        document.getElementById('expPeriod').value = e.period || '';
        document.getElementById('expDesc').value = e.desc || '';
    },

    saveSkill() {
        const index = parseInt(document.getElementById('skillEditIndex').value);
        const name = document.getElementById('skillName').value.trim();
        const category = document.getElementById('skillCategory').value.trim();
        const level = document.getElementById('skillLevel').value;

        if (!name) return alert('يرجى إدخال اسم المهارة.');

        const db = Store.getKnowledge();
        const item = { name, category: category || 'عام', level };

        if (index >= 0) db.skills[index] = item;
        else db.skills.push(item);

        Store.saveKnowledge(db);
        document.getElementById('skillEditIndex').value = "-1";
        alert('تم حفظ المهارة وتحديثها!');
    },

    editSkill(index) {
        const db = Store.getKnowledge();
        const s = db.skills[index];
        if (!s) return;

        document.getElementById('skillEditIndex').value = index;
        document.getElementById('skillName').value = s.name || '';
        document.getElementById('skillCategory').value = s.category || '';
        document.getElementById('skillLevel').value = s.level || 'متوسط';
    },

    saveVolunteer() {
        const index = parseInt(document.getElementById('volEditIndex').value);
        const role = document.getElementById('volRole').value.trim();
        const org = document.getElementById('volOrg').value.trim();
        const period = document.getElementById('volPeriod').value.trim();

        if (!role || !org) return alert('يرجى إدخال المسمى والجهة.');

        const db = Store.getKnowledge();
        const item = { role, org, period };

        if (index >= 0) db.volunteer[index] = item;
        else db.volunteer.push(item);

        Store.saveKnowledge(db);
        document.getElementById('volEditIndex').value = "-1";
        alert('تم حفظ العمل التطوعي وتحديثه!');
    },

    editVolunteer(index) {
        const db = Store.getKnowledge();
        const v = db.volunteer[index];
        if (!v) return;

        document.getElementById('volEditIndex').value = index;
        document.getElementById('volRole').value = v.role || '';
        document.getElementById('volOrg').value = v.org || '';
        document.getElementById('volPeriod').value = v.period || '';
    },

    deleteItem(key, index) {
        if (!confirm('هل أنت متأكد من الحذف؟ ستحذف المعلومة تلقائياً من الموقع.')) return;
        const db = Store.getKnowledge();
        db[key].splice(index, 1);
        Store.saveKnowledge(db);
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'flex';
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    },

    toggleChat() {
        const box = document.getElementById('ai-chat-box');
        const btn = document.getElementById('ai-chat-btn');
        if (!box || !btn) return;
        const isVisible = box.style.display === 'flex';
        box.style.display = isVisible ? 'none' : 'flex';
        btn.style.display = isVisible ? 'flex' : 'none';
    },

    handleChatKey(e) {
        if (e.key === 'Enter') this.sendChatMessage();
    },

    async sendChatMessage() {
        const input = document.getElementById('ai-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const msgContainer = document.getElementById('ai-chat-messages');
        msgContainer.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const kb = Store.getKnowledge();
        
        const strictSystemPrompt = `You are the personal assistant of Trainer Ahmed Adel Naji Thiab.
CRITICAL RULES:
1. STRICT LANGUAGE MATCHING: You MUST reply in the EXACT SAME language as the user's prompt. 
   - If the user asks in English (e.g., "who is Ahmed"), you MUST translate the provided Arabic data and answer 100% in English.
   - If the user asks in Arabic, answer in Arabic.
   - NEVER mix languages in your response.
2. STYLE: Keep responses natural, conversational, concise, and friendly like a WhatsApp message.
3. KNOWLEDGE BASE (Translate this data to the user's language if necessary): ${JSON.stringify(kb)}`;

        let success = false;
        for (let apiKey of CONFIG.AI_API_KEYS) {
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: strictSystemPrompt },
                            { role: "user", content: text }
                        ]
                    })
                });
                const data = await res.json();
                if (data.choices && data.choices[0]) {
                    msgContainer.innerHTML += `<div class="msg bot-msg">${data.choices[0].message.content}</div>`;
                    success = true;
                    break;
                }
            } catch (err) {
                console.warn(err);
            }
        }

        if (!success) {
            msgContainer.innerHTML += `<div class="msg bot-msg">⚠️ عذراً، واجهت مشكلة بسيطة في الاتصال. يمكنك مراسلة الأستاذ مباشرة عبر الواتساب.</div>`;
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * ميزات استخراج الشهادات بالذكاء البصري (Vision) مع دعم التعبئة اليدوية والافتراضية دون حظر رفع الصور
 */
a/**
 * رفع صورة الشهادة وعرضها فوراً وبدون أي قيود أو رسائل خطأ (مع محاولة الاستخراج الذكي في الخلفية)
 */
async function extractCertificateFromImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('⚠️ يرجى اختيار ملف صورة صحيح (PNG أو JPG)');
        return;
    }

    const statusEl = document.getElementById('loading-status');
    if (statusEl) statusEl.style.display = 'block';

    const reader = new FileReader();
    reader.onload = async function() {
        const base64Image = reader.result;
        
        // 1. استخراج اسم الملف الأساسي كعنوان افتراضي مضمون
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || "شهادة جديدة";
        
        let finalTitle = cleanName;
        let finalIssuer = "تم الرفع من الجهاز (تعديل يدوي)";
        let finalDate = new Date().toLocaleDateString('ar-YE');

        // 2. محاولة قراءة البيانات بالذكاء الاصطناعي في الخلفية (اختيارية)
        const prompt = "استخرج من صورة هذه الشهادة البيانات التالية بدقة وأعطني إياها حصراً على شكل كود JSON بهذا الشكل فقط دون أي نص إضافي: {\"title\": \"عنوان الشهادة\", \"issuer\": \"جهة الإصدار\", \"date\": \"التاريخ\"}";

        for (let apiKey of CONFIG.AI_API_KEYS) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.2-11b-vision-preview",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: prompt },
                                    { type: "image_url", image_url: { url: base64Image } }
                                ]
                            }
                        ]
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    let content = data.choices[0].message.content;
                    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsed = JSON.parse(content);
                    if (parsed.title) {
                        finalTitle = parsed.title;
                        if (parsed.issuer) finalIssuer = parsed.issuer;
                        if (parsed.date) finalDate = parsed.date;
                        break; // تم الاستخراج بنجاح
                    }
                }
            } catch (err) {
                // تجاهل خطأ الذكاء الاصطناعي تماماً والاستمرار بالقيم الافتراضية المضمنة
                console.warn("الاستخراج التلقائي متوقف مؤقتاً، سيتم الاعتماد على رفع الصورة مباشرة.");
            }
        }

        if (statusEl) statusEl.style.display = 'none';

        // 3. حفظ الصورة والبيانات في التخزين المحلي في جميع الأحوال (بدون أي شروط تمنع الرفع)
        const newCertData = {
            id: `cert-img-${Date.now()}`,
            title: finalTitle,
            issuer: finalIssuer,
            date: finalDate,
            imageUrl: base64Image
        };

        let savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
        savedCerts.push(newCertData);
        localStorage.setItem('my_certs', JSON.stringify(savedCerts));

        alert(`✅ تم رفع وعرض الشهادة بنجاح!\n- العنوان: ${finalTitle}\n(يمكنك تعديل تفاصيلها في أي وقت من لوحة التحكم).`);
        
        // تحديث الواجهة فوراً
        if (typeof App !== 'undefined' && App.renderAll) {
            App.renderAll();
        }
        if (typeof renderCertifications === 'function') {
            renderCertifications();
        }
    };
    reader.readAsDataURL(file);
}
function renderCertifications() {
    const certContainer = document.getElementById('certifications-container');
    if (!certContainer) return;

    const savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
    
    certContainer.innerHTML = savedCerts.map(cert => `
        <div class="cert-card">
            <h3>${cert.title}</h3>
            <p><strong>الجهة:</strong> ${cert.issuer}</p>
            <p><strong>التاريخ:</strong> ${cert.date}</p>
        </div>
    `).join('');
}
toggleAdminAuth() {
        if (this.isAdminLoggedIn) {
            if (confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')) {
                this.isAdminLoggedIn = false;
                document.getElementById('admin-content-body').style.display = 'none';
                const authBtn = document.getElementById('auth-btn');
                authBtn.innerText = '🔒 تسجيل الدخول';
                authBtn.style.background = 'var(--primary-color)';
                alert('تم إقفال لوحة الإدارة بنجاح. سيتطلب إدخال كلمة المرور عند الدخول مجدداً.');
            }
            return;
        }

        const pass = prompt('أدخل كلمة مرور لوحة التحكم (الافتراضية: 1234):');
        if (pass === CONFIG.DEFAULT_ADMIN_PASS || pass === CONFIG.MASTER_RECOVERY_PIN) {
            this.isAdminLoggedIn = true;
            document.getElementById('admin-content-body').style.display = 'block';
            const authBtn = document.getElementById('auth-btn');
            authBtn.innerText = '🔓 تسجيل الخروج (مفعل)';
            authBtn.style.background = '#dc2626';
            this.renderAdminLists(Store.getKnowledge());
        } else if (pass !== null) {
            alert('كلمة المرور غير صحيحة!');
        }
    },
