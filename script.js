/**
 * ملف النظام والتهيئة الأساسية للموقع - الإصدار الشامل، الموحد والمصحح نهائياً
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
        "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",
        "gsk_KEY_NUMBER_2_HERE",
        "gsk_KEY_NUMBER_3_HERE"
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
 * إدارة التخزين وقاعدة المعرفة محلياً مع دمج آمن لمنع التكرار
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

            const fileCerts = window.CERTIFICATIONS || [];

            if (!raw) {
                const uniqueMap = new Map();
                [...DEFAULT_KNOWLEDGE_BASE.certificates, ...fileCerts, ...visionCerts].forEach(c => uniqueMap.set(c.id || c.title, c));
                return {
                    ...DEFAULT_KNOWLEDGE_BASE,
                    certificates: Array.from(uniqueMap.values())
                };
            }

            const parsed = JSON.parse(raw);
            const baseCerts = Array.isArray(parsed.certificates) ? parsed.certificates : DEFAULT_KNOWLEDGE_BASE.certificates;
            
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

/**
 * الكائن الرئيسي لتشغيل وعرض محتوى الموقع ووظائفه - الإصدار المدمج والمصحح نهائياً
 */
const App = {
    selectedCertForUnlock: null,
    isAdminLoggedIn: false,

    init() {
        this.renderAll();
        this.populateWaSelect();
        if (typeof renderCertifications === 'function') {
            renderCertifications();
        }
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

    validateAccessCode() {
        const passcodeEl = document.getElementById('passcode');
        const input = passcodeEl ? passcodeEl.value.trim() : '';
        const err = document.getElementById('errorMsg');
        const db = Store.getKnowledge();

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
        const indexInput = document.getElementById('certEditIndex');
        const titleInput = document.getElementById('certTitle');
        const issuerInput = document.getElementById('certIssuer');
        const categoryInput = document.getElementById('certCategory');
        const pinInput = document.getElementById('certPin');
        const imageInput = document.getElementById('certImage');
        const fileInput = document.getElementById('certFile');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const title = titleInput ? titleInput.value.trim() : '';
        const issuer = issuerInput ? issuerInput.value.trim() : '';
        const category = categoryInput ? categoryInput.value.trim() : '';
        const pin = pinInput ? pinInput.value.trim() : '';
        const imageUrlInput = imageInput ? imageInput.value.trim() : '';

        if (!title || !issuer) return alert('يرجى كتابة عنوان الشهادة والجهة المصدرة.');

        const db = Store.getKnowledge();
        const existingCert = index >= 0 && db.certificates[index] ? db.certificates[index] : null;

        const processSave = (finalImageUrl) => {
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

            Store.saveKnowledge(db);
            this.resetCertForm();
            this.renderAdminLists(db);
            if (typeof renderCertifications === 'function') renderCertifications();
            alert('✅ تم حفظ وتحديث الشهادة بنجاح بدون تكرار!');
        };

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                processSave(e.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            processSave(imageUrlInput);
        }
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

        if (indexInput) indexInput.value = "-1";
        if (titleInput) titleInput.value = "";
        if (issuerInput) issuerInput.value = "";
        if (categoryInput) categoryInput.value = "";
        if (pinInput) pinInput.value = "";
        if (imageInput) imageInput.value = "";
        if (fileInput) fileInput.value = "";
    },

    saveExperience() {
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

        const db = Store.getKnowledge();
        const item = { role, company, period, desc };

        if (!Array.isArray(db.experiences)) db.experiences = [];
        if (index >= 0) db.experiences[index] = item;
        else db.experiences.push(item);

        Store.saveKnowledge(db);
        if (indexInput) indexInput.value = "-1";
        this.renderAdminLists(db);
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
        const indexInput = document.getElementById('skillEditIndex');
        const nameInput = document.getElementById('skillName');
        const categoryInput = document.getElementById('skillCategory');
        const levelInput = document.getElementById('skillLevel');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const name = nameInput ? nameInput.value.trim() : '';
        const category = categoryInput ? categoryInput.value.trim() : '';
        const level = levelInput ? levelInput.value : 'متوسط';

        if (!name) return alert('يرجى إدخال اسم المهارة.');

        const db = Store.getKnowledge();
        const item = { name, category: category || 'عام', level };

        if (!Array.isArray(db.skills)) db.skills = [];
        if (index >= 0) db.skills[index] = item;
        else db.skills.push(item);

        Store.saveKnowledge(db);
        if (indexInput) indexInput.value = "-1";
        this.renderAdminLists(db);
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
        const indexInput = document.getElementById('volEditIndex');
        const roleInput = document.getElementById('volRole');
        const orgInput = document.getElementById('volOrg');
        const periodInput = document.getElementById('volPeriod');

        const index = indexInput ? parseInt(indexInput.value) : -1;
        const role = roleInput ? roleInput.value.trim() : '';
        const org = orgInput ? orgInput.value.trim() : '';
        const period = periodInput ? periodInput.value.trim() : '';

        if (!role || !org) return alert('يرجى إدخال المسمى والجهة.');

        const db = Store.getKnowledge();
        const item = { role, org, period };

        if (!Array.isArray(db.volunteer)) db.volunteer = [];
        if (index >= 0) db.volunteer[index] = item;
        else db.volunteer.push(item);

        Store.saveKnowledge(db);
        if (indexInput) indexInput.value = "-1";
        this.renderAdminLists(db);
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
        if (!confirm('⚠️ هل أنت متأكد من الحذف الفعلي؟ سيتم إزالة العنصر وبياناته نهائياً من الموقع وتحديث كافة العروض.')) return;
        
        const db = Store.getKnowledge();
        if (db[key] && Array.isArray(db[key])) {
            const itemToDelete = db[key][index];
            
            db[key].splice(index, 1);
            Store.saveKnowledge(db);
            
            if (key === 'certificates' && itemToDelete) {
                try {
                    let savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
                    savedCerts = savedCerts.filter(c => c.title !== itemToDelete.title);
                    localStorage.setItem('my_certs', JSON.stringify(savedCerts));
                } catch(e) {}
            }

            this.renderAdminLists(db);
            this.renderAll();
            if (typeof renderCertifications === 'function') renderCertifications();
            
            alert('🗑️ تم الحذف الفعلي وإصدار الأمر للموقع بحذف كافة البيانات المتعلقة بهذا العنصر بنجاح.');
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

        // عرض رسالة المستخدم في الشات فوراً
        msgContainer.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const kb = Store.getKnowledge();
        
        // برومبت محسن وأكثر ذكاءً وتفاعلية لزيادة التفاعل واحترافية الردود
        const strictSystemPrompt = `You are the highly intelligent, professional, and friendly personal AI assistant of Trainer and Accountant Ahmed Adel Naji Thiab.
CRITICAL RULES:
1. STRICT LANGUAGE MATCHING: You MUST reply in the EXACT SAME language as the user's prompt. 
   - If the user asks in English, translate data and answer 100% in English.
   - If the user asks in Arabic, answer in Arabic.
   - NEVER mix languages.
2. STYLE & INTERACTIVITY: Be extremely helpful, conversational, engaging, and professional like an expert executive assistant. Offer proactive details about Ahmed's accounting systems training (Extra System), ICDL, English B2, and university degree at University of Abyan. Guide clients to contact via WhatsApp (+967779087415) when booking training or requesting consultation.
3. KNOWLEDGE BASE: ${JSON.stringify(kb)}`;

        let success = false;
        let aiResponseText = "";

        for (let apiKey of CONFIG.AI_API_KEYS) {
            // تخطي المفاتيح الوهمية أو غير المكتملة لتسريع الاستجابة وعدم حدوث أخطاء
            if (!apiKey || apiKey.includes("KEY_NUMBER")) continue;
            
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
                        ],
                        temperature: 0.7,
                        max_tokens: 1000
                    })
                });

                const data = await res.json();
                
                // التحقق من صحة الاستجابة وحالة السيرفر لمنع الأخطاء الصامتة
                if (res.ok && data.choices && data.choices[0] && data.choices[0].message) {
                    aiResponseText = data.choices[0].message.content;
                    success = true;
                    break;
                } else if (data.error) {
                    console.warn("API Error response:", data.error.message);
                }
            } catch (err) {
                console.warn("Fetch connection error:", err);
            }
        }

        if (success && aiResponseText) {
            msgContainer.innerHTML += `<div class="msg bot-msg">${aiResponseText}</div>`;
        } else {
            // نظام الرد الذكي الاحتياطي المحسن لتغطية كافة الاستفسارات بذكاء فوري
            let fallbackReply = "أهلاً بك! أنا مساعد الأستاذ أحمد عادل ناجي ذياب. يسعدني جداً تواصلك. يمكنك الاستفسار عن الدورات المحاسبية (نظام إكسترا)، أو مراسلة الأستاذ مباشرة عبر الواتساب: +967779087415";
            const lowerText = text.toLowerCase();

            if (lowerText.includes('رقم') || lowerText.includes('واتس') || lowerText.includes('تواصل') || lowerText.includes('whatsapp') || lowerText.includes('phone') || lowerText.includes('اتصال')) {
                fallbackReply = `📞 رقم الواتساب الرسمي للتواصل المباشر مع الأستاذ أحمد عادل ناجي ذياب هو: +967 ${CONFIG.WHATSAPP_NUMBER}، وهو متواجد دائماً للرد على الاستفسارات التدريبية والمالية.`;
            } else if (lowerText.includes('اخبار') || lowerText.includes('آخر') || lowerText.includes('جديد') || lowerText.includes('دورات') || lowerText.includes('دورة')) {
                fallbackReply = `🚀 يقدم الأستاذ أحمد أحدث الدورات التدريبية المتقدمة في الأنظمة المحاسبية وتطبيق (نظام إكسترا المحاسبي)، بالإضافة لتطوير المهارات المالية والإدارية وبرامج الحاسوب.`;
            } else if (lowerText.includes('شهادة') || lowerText.includes('بكالوريوس') || lowerText.includes('icdl') || lowerText.includes('تعليم') || lowerText.includes('جامعة')) {
                fallbackReply = `🎓 المؤهلات والشهادات الموثقة للأستاذ أحمد:\n- بكالوريوس المحاسبة (جامعة أبين)\n- دبلوم قيادة الحاسوب ICDL\n- شهادة اللغة الإنجليزية المستوى B2\n- شهادة معتمدة في نظام إكسترا للمحاسبة والإدارة.`;
            } else if (lowerText.includes('السعر') || lowerText.includes('تكلفة') || lowerText.includes('حجز') || lowerText.includes('تسجيل')) {
                fallbackReply = `💡 لحجز الدورات أو الاستفسار عن المواعيد والأسعار، يرجى التنسيق المباشر مع الأستاذ أحمد عبر الواتساب على الرقم: +967 ${CONFIG.WHATSAPP_NUMBER}.`;
            }

            msgContainer.innerHTML += `<div class="msg bot-msg">${fallbackReply}</div>`;
        }
        
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
 * دوال معالجة ورفع الشهادات الخارجية وعرضها
 */
async function extractCertificateFromImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('⚠️ يرجى اختيار ملف صورة صحيح (PNG أو JPG)');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function() {
        const base64Image = reader.result;
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || "شهادة جديدة";
        
        let finalTitle = cleanName;
        let finalIssuer = "تم الرفع من الجهاز (تعديل يدوي)";

        const newCertData = {
            id: `cert-img-${Date.now()}`,
            title: finalTitle,
            issuer: finalIssuer,
            category: "مستندات مرفوعة",
            imageUrl: base64Image,
            pin: "1001"
        };

        const db = Store.getKnowledge();
        if (!Array.isArray(db.certificates)) db.certificates = [];
        db.certificates.push(newCertData);
        Store.saveKnowledge(db);

        alert(`✅ تم رفع وعرض الشهادة بنجاح!\n- العنوان: ${finalTitle}`);
        App.renderAll();
        if (typeof renderCertifications === 'function') renderCertifications();
    };
    reader.readAsDataURL(file);
}

function uploadCertificateDirectly() {
    const titleInput = document.getElementById('manualCertTitle');
    const issuerInput = document.getElementById('manualCertIssuer');
    const dateInput = document.getElementById('manualCertDate');
    const fileInput = document.getElementById('manualCertFile');

    const title = titleInput ? titleInput.value.trim() : "";
    const issuer = issuerInput ? issuerInput.value.trim() : "مستند رسمي";
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;

    if (!title || !file) {
        alert('⚠️ يرجى كتابة عنوان الشهادة واختيار ملف الصورة.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;

        const newCertificate = {
            id: `cert-manual-${Date.now()}`,
            title: title,
            issuer: issuer,
            category: "مستندات مرفوعة",
            imageUrl: base64Image,
            pin: "1001"
        };

        const db = Store.getKnowledge();
        if (!Array.isArray(db.certificates)) db.certificates = [];
        db.certificates.push(newCertificate);
        Store.saveKnowledge(db);

        try {
            let savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
            savedCerts.push({ title, issuer, date: dateInput ? dateInput.value : '', imageUrl: base64Image });
            localStorage.setItem('my_certs', JSON.stringify(savedCerts));
        } catch(err){}

        if (titleInput) titleInput.value = '';
        if (issuerInput) issuerInput.value = '';
        if (dateInput) dateInput.value = '';
        if (fileInput) fileInput.value = '';

        alert('✅ تم إضافة الشهادة المرفوعة وتحديث الموقع فوراً!');
        App.renderAll();
        if (typeof renderCertifications === 'function') renderCertifications();
    };

    reader.readAsDataURL(file);
}

function renderCertifications() {
    const certContainer = document.getElementById('certificates-container');
    if (!certContainer) return;

    const savedCerts = JSON.parse(localStorage.getItem('my_certs') || '[]');
    const unlockedList = Store.getUnlockedCerts();
    
    if (savedCerts.length === 0) {
        App.renderCertificates(Store.getKnowledge());
        return;
    }

    certContainer.innerHTML = savedCerts.map((cert, idx) => {
        const certId = `vision-cert-${idx}`;
        const isUnlocked = unlockedList.includes(certId);
        const imgPreview = cert.imageUrl ? `<div class="cert-img-box"><img src="${cert.imageUrl}" alt="${cert.title}" class="cert-thumbnail"></div>` : '';
        
        return `
            <div class="cert-item ${isUnlocked ? 'unlocked' : ''}">
                ${isUnlocked ? imgPreview : ''}
                <div class="cert-info">
                    <h4>${cert.title}</h4>
                    <p>📌 ${cert.issuer} | 🗓️ ${cert.date || ''}</p>
                </div>
                <div>
                    ${isUnlocked ? 
                        (cert.imageUrl ? `<a href="${cert.imageUrl}" target="_blank" class="btn-primary" style="text-decoration:none; font-size:0.85rem; width:100%;">👁️ معاينة المستند</a>` : `<span style="color:var(--primary-color); font-size:0.85rem; display:block; text-align:center;">تم فتح المعاينة بنجاح</span>`) :
                        `<button class="btn-primary" onclick="App.openCertPassModal('${certId}')" style="width:100%;">🔒 طلب فتح المعاينة</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
