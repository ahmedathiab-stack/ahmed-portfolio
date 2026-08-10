// 1. قاموس التصحيح الإجباري (يُجبر النظام على هذه الترجمات مهما حدث)
const strictTranslations = {
    "جامعة ابين": "Abyan University",
    "جامعة أبين": "Abyan University",
    "ابين": "Abyan",
    "أبين": "Abyan",
    // يمكنك إضافة أي أسماء أخرى هنا مستقبلاً (مثل اسم قريتك، أو اسم شركة محلية)
    "aden university": "Abyan University" // كخط دفاع أخير إذا تم حفظها بالخطأ
};

// 2. دالة صغيرة لتنظيف وتصحيح النصوص في الموقع
App.fixText = function(text) {
    if (!text) return text;
    let newText = text;
    
    // المرور على القاموس واستبدال أي خطأ بالكلمة الصحيحة
    for (const [wrong, correct] of Object.entries(strictTranslations)) {
        // نستخدم RegExp للبحث وتجاهل حالة الأحرف (كبيرة/صغيرة)
        const regex = new RegExp(wrong, "gi");
        newText = newText.replace(regex, correct);
    }
    
    return newText;
};
/**
 * ملف النظام والتهيئة الأساسية للموقع - الإصدار السحابي المحدث
 */

const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    DEFAULT_ADMIN_PASS: "1234",
    MASTER_RECOVERY_PIN: "7777",
    ADMIN_PASSWORD: "Ahmed_Secure_2026", // كلمة مرور الحفظ السحابي
    FIREBASE_URL: "https://ahmed-portfolio-stack-d1fd8-default-rtdb.firebaseio.com/data.json", // رابط السحابة الخاص بك
    STORAGE_KEYS: {
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
 * إدارة التخزين السحابي والمحلي
 */
class Store {
    static async getKnowledge() {
        try {
            const response = await fetch(CONFIG.FIREBASE_URL);
            const parsed = await response.json();
            
            const fileCerts = window.CERTIFICATIONS || [];

            if (!parsed) {
                return DEFAULT_KNOWLEDGE_BASE;
            }

            const baseCerts = Array.isArray(parsed.certificates) ? parsed.certificates : DEFAULT_KNOWLEDGE_BASE.certificates;
            const uniqueCertsMap = new Map();
            [...baseCerts, ...fileCerts].forEach(c => uniqueCertsMap.set(c.id || c.title, c));

            return {
                personalInfo: { ...DEFAULT_KNOWLEDGE_BASE.personalInfo, ...(parsed.personalInfo || {}) },
                certificates: Array.from(uniqueCertsMap.values()),
                experiences: Array.isArray(parsed.experiences) ? parsed.experiences : DEFAULT_KNOWLEDGE_BASE.experiences,
                skills: Array.isArray(parsed.skills) ? parsed.skills : DEFAULT_KNOWLEDGE_BASE.skills,
                volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer : DEFAULT_KNOWLEDGE_BASE.volunteer
            };
        } catch (e) {
            console.error("خطأ في الاتصال بالسحابة، التبديل للذاكرة المحلية:", e);
            const localFallback = localStorage.getItem('ahmed_knowledge_base_fallback');
            return localFallback ? JSON.parse(localFallback) : DEFAULT_KNOWLEDGE_BASE;
        }
    }

    static async saveKnowledge(data) {
        let enteredPassword = prompt("الرجاء إدخال كلمة مرور لوحة التحكم لتأكيد الحفظ والتزامن السحابي:");
        if (enteredPassword !== CONFIG.ADMIN_PASSWORD && enteredPassword !== CONFIG.DEFAULT_ADMIN_PASS) {
            alert("كلمة المرور غير صحيحة! تم إلغاء التعديل والحفظ.");
            return false;
        }

        try {
            const response = await fetch(CONFIG.FIREBASE_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(data));
                alert("✅ تم الحفظ والتزامن السحابي بنجاح على جميع الأجهزة!");
                await App.renderAll();
                return true;
            } else {
                alert("فشل الحفظ في السحابة.");
                return false;
            }
        } catch (error) {
            console.error("خطأ أثناء الحفظ السحابي:", error);
            alert("حدث خطأ في الاتصال بالشبكة.");
            return false;
        }
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

    static async unlockAllCerts() {
        const kb = await Store.getKnowledge();
        const allIds = (kb.certificates || []).map(c => c.id);
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(allIds));
        App.renderAll();
    }
}

/**
 * الكائن الرئيسي لتشغيل وعرض محتوى الموقع
 */
const App = {
    selectedCertForUnlock: null,
    isAdminLoggedIn: false,
    cachedDb: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        this.renderAll();
        this.populateWaSelect();
        if (typeof renderCertifications === 'function') {
            renderCertifications();
        }
    },

    async renderAll() {
        this.cachedDb = await Store.getKnowledge();
        const db = this.cachedDb;
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

    generateTempKey() {
        const durationSelect = document.getElementById('tempKeyDuration');
        const typeVal = durationSelect ? durationSelect.value : "24h";
        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
        
        let expiryTime = 0;
        let isSingleUse = false;
        let durationText = "";

        if (typeVal === "single") {
            isSingleUse = true;
            expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            durationText = "لفتح لمرة واحدة فقط";
        } else if (typeVal === "24h") {
            expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            durationText = "صالح لمدة 24 ساعة";
        } else if (typeVal === "72h") {
            expiryTime = new Date().getTime() + (72 * 60 * 60 * 1000);
            durationText = "صالح لمدة 72 ساعة";
        }

        const tempKeyData = {
            pin: randomPin,
            expiresAt: expiryTime,
            isSingleUse: isSingleUse
        };

        sessionStorage.setItem('ahmed_temp_access_key', JSON.stringify(tempKeyData));

        const displayEl = document.getElementById('tempKeyDisplay');
        if (displayEl) {
            displayEl.innerHTML = `🔑 المفتاح المؤقت: <span style="background:#dcf8c6; padding:4px 8px; border-radius:4px; color:#111;">${randomPin}</span> (${durationText})`;
        }
        alert(`تم توليد المفتاح المؤقت بنجاح: ${randomPin}\nالنوع: ${durationText}`);
    },

    openCertPassModal(certId) {
        this.selectedCertForUnlock = certId;
        this.openModal('accessModal');
    },

    async validateAccessCode() {
        const passcodeEl = document.getElementById('passcode');
        const input = passcodeEl ? passcodeEl.value.trim() : '';
        const err = document.getElementById('errorMsg');
        const db = this.cachedDb || await Store.getKnowledge();

        if (input === CONFIG.MASTER_RECOVERY_PIN || input === "777777") {
            Store.unlockAllCerts();
            this.closeModal('accessModal');
            alert("تم إدخال المفتاح الشامل واستعراض كافة الوثائق بنجاح!");
            return;
        }

        try {
            const rawTempKey = sessionStorage.getItem('ahmed_temp_access_key');
            if (rawTempKey) {
                const tempObj = JSON.parse(rawTempKey);
                const currentTime = new Date().getTime();
                
                if (tempObj.pin === input) {
                    if (tempObj.isSingleUse) {
                        sessionStorage.removeItem('ahmed_temp_access_key');
                        Store.unlockAllCerts();
                        this.closeModal('accessModal');
                        alert("✅ تم التحقق عبر مفتاح الاستخدام لمرة واحدة بنجاح! تم استهلاك المفتاح.");
                        return;
                    } else if (currentTime <= tempObj.expiresAt) {
                        Store.unlockAllCerts();
                        this.closeModal('accessModal');
                        alert("✅ تم التحقق عبر المفتاح المؤقت بنجاح!");
                        return;
                    } else {
                        if (err) err.innerText = "⚠️ انتهت صلاحية هذا المفتاح المؤقت!";
                        return;
                    }
                }
            }
        } catch (e) {
            console.error(e);
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

        if (err) err.innerText = "كود التصريح غير صحيح أو منتهي الصلاحية.";
    },

    async populateWaSelect() {
        const select = document.getElementById('waCertSelect');
        if (!select) return;
        const db = this.cachedDb || await Store.getKnowledge();
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
        if (this.isAdminLoggedIn) {
            if (confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')) {
                this.isAdminLoggedIn = false;
                const adminBody = document.getElementById('admin-content-body');
                if (adminBody) adminBody.style.display = 'none';
                const authBtn = document.getElementById('auth-btn');
                if (authBtn) {
                    authBtn.innerText = '🔒 تسجيل الدخول';
                    authBtn.style.background = 'var(--primary-color)';
                }
                alert('تم إقفال لوحة الإدارة بنجاح.');
            }
            return;
        }

        const pass = prompt('أدخل كلمة مرور لوحة التحكم (الافتراضية: 1234):');
        if (pass === CONFIG.DEFAULT_ADMIN_PASS || pass === CONFIG.MASTER_RECOVERY_PIN) {
            this.isAdminLoggedIn = true;
            const adminBody = document.getElementById('admin-content-body');
            if (adminBody) adminBody.style.display = 'block';
            const authBtn = document.getElementById('auth-btn');
            if (authBtn) {
                authBtn.innerText = '🔓 تسجيل الخروج (مفعل)';
                authBtn.style.background = '#dc2626';
            }
            this.renderAdminLists(this.cachedDb);
        } else if (pass !== null) {
            alert('كلمة المرور غير صحيحة!');
        }
    },

    renderAdminLists(db) {
        if (!db) return;
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

    async saveCertificate() {
        const indexInput = document.getElementById('certEditIndex');
        const titleInput = document.getElementById('certTitle');
        const issuerInput = document.getElementById('certIssuer');
        const categoryInput = document.getElementById('certCategory');
        const pinInput = document.getElementById('certPin');
        const imageInput = document.getElementById('certImage');
        const fileInput = document.getElementById('certFile');
        const dateInput = document.getElementById('certDate');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const title = titleInput ? titleInput.value.trim() : '';
        let issuer = issuerInput ? issuerInput.value.trim() : '';
        const category = categoryInput ? categoryInput.value.trim() : '';
        const pin = pinInput ? pinInput.value.trim() : '';
        const imageUrlInput = imageInput ? imageInput.value.trim() : '';
        const dateVal = dateInput ? dateInput.value : '';

        if (!title || !issuer) return alert('يرجى كتابة عنوان الشهادة والجهة المصدرة.');

        if (dateVal) {
            issuer += ` (${dateVal})`;
        }

        const db = this.cachedDb || await Store.getKnowledge();
        const existingCert = index >= 0 && db.certificates[index] ? db.certificates[index] : null;

        const processSave = async (finalImageUrl) => {
            const certObj = { 
                id: existingCert ? existingCert.id : `cert-${Date.now()}`, 
                title, 
                issuer, 
                category: category || 'عام', 
                pin: pin || '1001', 
                imageUrl: finalImageUrl || (existingCert ? existingCert.imageUrl : '')
            };

            if (!Array.isArray(db.certificates)) db.certificates = [];

            if (index >= 0 && index < db.certificates.length) {
                db.certificates[index] = certObj;
            } else {
                db.certificates.push(certObj);
            }

            const success = await Store.saveKnowledge(db);
            if (success) {
                this.resetCertForm();
                if (typeof renderCertifications === 'function') renderCertifications();
            }
        };

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                await processSave(e.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            await processSave(imageUrlInput);
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

    resetCertForm() {
        const indexInput = document.getElementById('certEditIndex');
        const titleInput = document.getElementById('certTitle');
        const issuerInput = document.getElementById('certIssuer');
        const categoryInput = document.getElementById('certCategory');
        const pinInput = document.getElementById('certPin');
        const imageInput = document.getElementById('certImage');
        const fileInput = document.getElementById('certFile');
        const dateInput = document.getElementById('certDate');

        if (indexInput) indexInput.value = "-1";
        if (titleInput) titleInput.value = "";
        if (issuerInput) issuerInput.value = "";
        if (categoryInput) categoryInput.value = "";
        if (pinInput) pinInput.value = "";
        if (imageInput) imageInput.value = "";
        if (fileInput) fileInput.value = "";
        if (dateInput) dateInput.value = "";
    },

    async saveExperience() {
        const indexInput = document.getElementById('expEditIndex');
        const roleInput = document.getElementById('expRole');
        const companyInput = document.getElementById('expCompany');
        const periodInput = document.getElementById('expPeriod');
        const descInput = document.getElementById('expDesc');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const role = roleInput ? roleInput.value.trim() : '';
        const company = companyInput ? companyInput.value.trim() : '';
        const period = periodInput ? periodInput.value.trim() : '';
        const desc = descInput ? descInput.value.trim() : '';

        if (!role || !company) return alert('يرجى ملء المسمى والجهة.');

        const db = this.cachedDb || await Store.getKnowledge();
        const item = { role, company, period, desc };

        if (!Array.isArray(db.experiences)) db.experiences = [];
        if (index >= 0) db.experiences[index] = item;
        else db.experiences.push(item);

        const success = await Store.saveKnowledge(db);
        if (success && indexInput) indexInput.value = "-1";
    },

    editExperience(index) {
        const db = this.cachedDb;
        if (!db || !db.experiences[index]) return;
        const e = db.experiences[index];

        document.getElementById('expEditIndex').value = index;
        document.getElementById('expRole').value = e.role || '';
        document.getElementById('expCompany').value = e.company || '';
        document.getElementById('expPeriod').value = e.period || '';
        document.getElementById('expDesc').value = e.desc || '';
    },

    async saveSkill() {
        const indexInput = document.getElementById('skillEditIndex');
        const nameInput = document.getElementById('skillName');
        const categoryInput = document.getElementById('skillCategory');
        const levelInput = document.getElementById('skillLevel');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const name = nameInput ? nameInput.value.trim() : '';
        const category = categoryInput ? categoryInput.value.trim() : '';
        const level = levelInput ? levelInput.value : 'متوسط';

        if (!name) return alert('يرجى إدخال اسم المهارة.');

        const db = this.cachedDb || await Store.getKnowledge();
        const item = { name, category: category || 'عام', level };

        if (!Array.isArray(db.skills)) db.skills = [];
        if (index >= 0) db.skills[index] = item;
        else db.skills.push(item);

        const success = await Store.saveKnowledge(db);
        if (success && indexInput) indexInput.value = "-1";
    },

    editSkill(index) {
        const db = this.cachedDb;
        if (!db || !db.skills[index]) return;
        const s = db.skills[index];

        document.getElementById('skillEditIndex').value = index;
        document.getElementById('skillName').value = s.name || '';
        document.getElementById('skillCategory').value = s.category || '';
        document.getElementById('skillLevel').value = s.level || 'متوسط';
    },

    async saveVolunteer() {
        const indexInput = document.getElementById('volEditIndex');
        const roleInput = document.getElementById('volRole');
        const orgInput = document.getElementById('volOrg');
        const periodInput = document.getElementById('volPeriod');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const role = roleInput ? roleInput.value.trim() : '';
        const org = orgInput ? orgInput.value.trim() : '';
        const period = periodInput ? periodInput.value.trim() : '';

        if (!role || !org) return alert('يرجى إدخال المسمى والجهة.');

        const db = this.cachedDb || await Store.getKnowledge();
        const item = { role, org, period };

        if (!Array.isArray(db.volunteer)) db.volunteer = [];
        if (index >= 0) db.volunteer[index] = item;
        else db.volunteer.push(item);

        const success = await Store.saveKnowledge(db);
        if (success && indexInput) indexInput.value = "-1";
    },

    editVolunteer(index) {
        const db = this.cachedDb;
        if (!db || !db.volunteer[index]) return;
        const v = db.volunteer[index];

        document.getElementById('volEditIndex').value = index;
        document.getElementById('volRole').value = v.role || '';
        document.getElementById('volOrg').value = v.org || '';
        document.getElementById('volPeriod').value = v.period || '';
    },

    async deleteItem(key, index) {
        if (!confirm('⚠️ هل أنت متأكد من الحذف الفعلي؟ سيتم إزالة العنصر نهائياً من السحابة وتحديث كافة الأجهزة.')) return;
        
        const db = this.cachedDb || await Store.getKnowledge();
        if (db[key] && Array.isArray(db[key])) {
            db[key].splice(index, 1);
            await Store.saveKnowledge(db);
            if (typeof renderCertifications === 'function') renderCertifications();
            alert('🗑️ تم الحذف والتزامن السحابي بنجاح.');
        }
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
        if (!msgContainer) return;

        msgContainer.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const kb = this.cachedDb || await Store.getKnowledge();
        
        const strictSystemPrompt = `You are the personal assistant of Trainer Ahmed Adel Naji Thiab.
CRITICAL RULES:
1. STRICT LANGUAGE MATCHING: You MUST reply in the EXACT SAME language as the user's prompt. 
   - If the user asks in English, you MUST translate the provided Arabic data and answer 100% in English.
   - If the user asks in Arabic, answer in Arabic.
   - NEVER mix languages in your response.
2. STYLE: Keep responses natural, conversational, concise, and friendly like a WhatsApp message.
3. KNOWLEDGE BASE: ${JSON.stringify(kb)}`;

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
                
                if (!res.ok) throw new Error("API Request Failed");
                
                const data = await res.json();
                if (data.choices && data.choices[0]) {
                    msgContainer.innerHTML += `<div class="msg bot-msg">${data.choices[0].message.content}</div>`;
                    success = true;
                    break;
                }
            } catch (err) {
                console.warn("API Key Failed, trying next...", err);
            }
        }

        if (!success) {
            let fallbackReply = "أهلاً بك! أنا مساعد الأستاذ أحمد عادل ناجي ذياب. يمكنك التواصل مع الأستاذ مباشرة عبر رقم الواتساب: +967779087415";
            const lowerText = text.toLowerCase();

            if (lowerText.includes('رقم') || lowerText.includes('واتس') || lowerText.includes('تواصل') || lowerText.includes('whatsapp') || lowerText.includes('phone')) {
                fallbackReply = `رقم الواتساب الخاص بالأستاذ أحمد عادل هو: +967 ${CONFIG.WHATSAPP_NUMBER}، ويمكنك مراسلته مباشرة.`;
            } else if (lowerText.includes('اخبار') || lowerText.includes('آخر') || lowerText.includes('جديد')) {
                fallbackReply = `آخر نشاطات الأستاذ أحمد تتضمن تقديم دورات تدريبية متقدمة في الأنظمة المحاسبية (نظام إكسترا) والبرمجيات وإدارة الحسابات.`;
            } else if (lowerText.includes('شهادة') || lowerText.includes('بكالوريوس') || lowerText.includes('icdl')) {
                fallbackReply = `الأستاذ أحمد حاصل على بكالوريوس المحاسبة من جامعة أبين، ودبلوم ICDL، وشهادة اللغة الإنجليزية (B2)، بالإضافة لشهادات نظام إكسترا المحاسبي.`;
            }

            msgContainer.innerHTML += `<div class="msg bot-msg">${fallbackReply}</div>`;
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

// نظام تدوير المفاتيح التلقائي لضمان المجالية 100% (أكثر من 40 مفتاحاً)
let currentApiKeyIndex = 0;
function getNextApiKey() {
    if (!CONFIG.AI_API_KEYS || CONFIG.AI_API_KEYS.length === 0) return "";
    const key = CONFIG.AI_API_KEYS[currentApiKeyIndex];
    currentApiKeyIndex = (currentApiKeyIndex + 1) % CONFIG.AI_API_KEYS.length;
    return key;
}

// محرك الأوامر الذكي للتحكم بالموقع
App.executeAdminAICommand = async function(commandText) {
    if (!this.isAdminLoggedIn) {
        alert("⚠️ يجب تسجيل الدخول للوحة الإدارة أولاً لتنفيذ أوامر الذكاء الاصطناعي.");
        return;
    }

    if (!commandText) return alert("الرجاء كتابة الأمر للذكاء الاصطناعي.");

    const db = this.cachedDb || await Store.getKnowledge();

    const systemPrompt = `You are the Master AI Admin Controller for the website of Trainer Ahmed Adel. 
Your job is to parse the admin's natural language command and update the database JSON structure.
Current Database JSON:
${JSON.stringify(db)}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object containing the updated database (or the specific section modified) along with a short response message in Arabic explaining what you did.
2. Format your response strictly as JSON with this structure:
{
  "updatedData": { ... full or updated database ... },
  "message": "رسالة توضيحية بالعربية عما تم تنفيذه"
}
`;

    let success = false;
    let resultMessage = "";

    // تجربة المفاتيح تباعاً (نظام 40+ مفتاح)
    for (let i = 0; i < (CONFIG.AI_API_KEYS.length || 1); i++) {
        let apiKey = getNextApiKey();
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
                        { role: "system", content: systemPrompt },
                        { role: "user", content: commandText }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!res.ok) throw new Error("API Key limit or error");

            const data = await res.json();
            const content = JSON.parse(data.choices[0].message.content);

            if (content.updatedData) {
                // دمج البيانات وتحديثها سحابياً
                await Store.saveKnowledge(content.updatedData);
                resultMessage = content.message || "تم تنفيذ التعديل بنجاح!";
                success = true;
                break;
            }
        } catch (err) {
            console.warn("المفتاح الحالي استنفذ أو فشل، جاري تجربة المفتاح التالي...", err);
        }
    }

    if (success) {
        alert("🤖 " + resultMessage);
        await this.renderAll();
    } else {
        alert("❌ عذراً، لم نتمكن من تنفيذ الأمر. تأكد من صحة مفاتيح الـ API.");
    }
};
