/**
 * script.js - الملف التشغيلي الأساسي للموقع
 */

const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    DEFAULT_ADMIN_PASS: "1234",
    MASTER_RECOVERY_PIN: "7777",
    ADMIN_PASSWORD: "Ahmed_Secure_2026",
    FIREBASE_URL: "https://ahmed-portfolio-stack-d1fd8-default-rtdb.firebaseio.com/data.json",
    STORAGE_KEYS: { UNLOCKED_CERTS: "ahmed_unlocked_certs_v7" }
};

const DEFAULT_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين."
    },
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", issuer: "جامعة أبين (2026)", imageUrl: "", pin: "1001" }
    ],
    experiences: [
        { role: "مدرب أنظمة محاسبية وماليات", company: "مراكز تدريبية", period: "2023 - الحالي", desc: "تدريب وإدارة تطبيقات نظام إكسترا المحاسبي الآلي." }
    ],
    skills: [{ name: "نظام إكسترا", category: "محاسبة", level: "خبير" }],
    volunteer: [{ role: "ميسر تدريب مجتمعي", org: "مبادرات محلية", period: "2022 - 2024" }]
};

class Store {
    static async getKnowledge() {
        try {
            const response = await fetch(CONFIG.FIREBASE_URL);
            const parsed = await response.json();
            if (!parsed) return DEFAULT_KNOWLEDGE_BASE;
            return {
                personalInfo: { ...DEFAULT_KNOWLEDGE_BASE.personalInfo, ...(parsed.personalInfo || {}) },
                certificates: Array.isArray(parsed.certificates) ? parsed.certificates : DEFAULT_KNOWLEDGE_BASE.certificates,
                experiences: Array.isArray(parsed.experiences) ? parsed.experiences : DEFAULT_KNOWLEDGE_BASE.experiences,
                skills: Array.isArray(parsed.skills) ? parsed.skills : DEFAULT_KNOWLEDGE_BASE.skills,
                volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer : DEFAULT_KNOWLEDGE_BASE.volunteer
            };
        } catch (e) {
            const localFallback = localStorage.getItem('ahmed_knowledge_base_fallback');
            return localFallback ? JSON.parse(localFallback) : DEFAULT_KNOWLEDGE_BASE;
        }
    }

    static async saveKnowledge(data) {
        let pass = prompt("إدخال كلمة مرور لوحة التحكم لتأكيد التعديل:");
        if (pass !== CONFIG.ADMIN_PASSWORD && pass !== CONFIG.DEFAULT_ADMIN_PASS) {
            alert("كلمة المرور غير صحيحة!");
            return false;
        }
        try {
            const res = await fetch(CONFIG.FIREBASE_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(data));
                await App.renderAll();
                return true;
            }
        } catch (e) {
            alert("خطأ في الاتصال بالشبكة.");
        }
        return false;
    }

    static getUnlockedCerts() {
        return JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS) || '[]');
    }

    static unlockCert(certId) {
        const list = Store.getUnlockedCerts();
        if (!list.includes(certId)) {
            list.push(certId);
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(list));
            App.renderAll();
        }
    }
}

const App = {
    isAdminLoggedIn: false,
    cachedDb: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        this.renderAll();
        this.populateWaSelect();
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

    fixText(txt) {
        return (window.AIEngine && typeof window.AIEngine.cleanText === 'function') ? window.AIEngine.cleanText(txt) : txt;
    },

    renderCertificates(db) {
        const container = document.getElementById('certificates-container');
        if (!container) return;
        const certs = db.certificates || [];
        const unlocked = Store.getUnlockedCerts();

        container.innerHTML = certs.map(c => {
            const isUnlocked = unlocked.includes(c.id);
            const title = this.fixText(c.title);
            const issuer = this.fixText(c.issuer);
            return `
                <div class="cert-item ${isUnlocked ? 'unlocked' : ''}">
                    <h4>${title}</h4>
                    <p>📌 ${issuer}</p>
                    <div>
                        ${isUnlocked ? 
                            `<span style="color:var(--primary-color)">تم فتح المعاينة</span>` :
                            `<button class="btn-primary" onclick="App.openCertPassModal('${c.id}')">🔒 فتح المعاينة</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    renderExperiences(db) {
        const container = document.getElementById('experiences-container');
        if (!container) return;
        container.innerHTML = (db.experiences || []).map(e => `
            <div style="background:var(--bg-subtle); padding:12px; margin-bottom:10px; border-radius:8px;">
                <h4>${e.role}</h4>
                <small>${this.fixText(e.company)} (${e.period})</small>
            </div>
        `).join('');
    },

    renderSkills(db) {
        const container = document.getElementById('skills-container');
        if (!container) return;
        container.innerHTML = (db.skills || []).map(s => `<span style="display:inline-block; background:var(--bg-subtle); padding:6px 12px; margin:4px; border-radius:15px;">${s.name} (${s.level})</span>`).join('');
    },

    renderVolunteer(db) {
        const container = document.getElementById('volunteer-container');
        if (!container) return;
        container.innerHTML = (db.volunteer || []).map(v => `<div style="padding:8px;"><strong>${v.role}</strong> - ${v.org}</div>`).join('');
    },

    toggleAdminDrawer() {
        const drawer = document.getElementById('admin-drawer');
        if (drawer) drawer.classList.toggle('open');
    },

    switchAdminTab(tabId, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId)?.classList.add('active');
        if (btn) btn.classList.add('active');
    },

    toggleAdminAuth() {
        if (this.isAdminLoggedIn) {
            this.isAdminLoggedIn = false;
            document.getElementById('admin-content-body').style.display = 'none';
            document.getElementById('auth-btn').innerText = '🔒 تسجيل الدخول';
            return;
        }
        const pass = prompt('كلمة مرور لوحة التحكم:');
        if (pass === CONFIG.DEFAULT_ADMIN_PASS || pass === CONFIG.MASTER_RECOVERY_PIN) {
            this.isAdminLoggedIn = true;
            document.getElementById('admin-content-body').style.display = 'block';
            document.getElementById('auth-btn').innerText = '🔓 تسجيل الخروج';
            this.renderAdminLists(this.cachedDb);
        }
    },

    renderAdminLists(db) {
        const certList = document.getElementById('admin-certs-list');
        if (certList) {
            certList.innerHTML = (db.certificates || []).map((c, i) => `
                <div style="display:flex; justify-content:space-between; margin-top:5px; background:#f1f5f9; padding:5px 10px;">
                    <span>${c.title}</span>
                    <button onclick="App.deleteItem('certificates', ${i})">🗑️</button>
                </div>
            `).join('');
        }
    },

    async deleteItem(key, index) {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const db = this.cachedDb;
        db[key].splice(index, 1);
        await Store.saveKnowledge(db);
    },

    openModal(id) { document.getElementById(id).style.display = 'flex'; },
    closeModal(id) { document.getElementById(id).style.display = 'none'; },
    openWaModal() { this.openModal('wa-modal'); },
    populateWaSelect() {
        const sel = document.getElementById('waCertSelect');
        if (sel && this.cachedDb) {
            sel.innerHTML = (this.cachedDb.certificates || []).map(c => `<option value="${c.title}">${c.title}</option>`).join('');
        }
    },
    sendWaSingleCertRequest() {
        const val = document.getElementById('waCertSelect')?.value || '';
        window.location.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('طلب تصريح: ' + val)}`;
    },
    openCertPassModal(id) {
        this.selectedCert = id;
        this.openModal('accessModal');
    },
    async validateAccessCode() {
        const code = document.getElementById('passcode')?.value.trim();
        if (code === CONFIG.MASTER_RECOVERY_PIN) {
            (this.cachedDb.certificates || []).forEach(c => Store.unlockCert(c.id));
            this.closeModal('accessModal');
            alert("تم إدخال المفتاح الشامل بنجاح!");
        } else if (this.selectedCert) {
            Store.unlockCert(this.selectedCert);
            this.closeModal('accessModal');
        }
    }
    // =========================================================
//  دوال الإضافة والتعديل اليدوي الآمنة (script.js)
// =========================================================

// 1️⃣ تفريغ الحقول بأمان
App.resetForm = function(type) {
    const fields = {
        cert: ['certEditIndex', 'certTitle', 'certIssuer', 'certDate', 'certCategory', 'certPin', 'certImage'],
        exp: ['expEditIndex', 'expRole', 'expCompany', 'expPeriod', 'expDesc'],
        skill: ['skillEditIndex', 'skillName', 'skillCategory'],
        vol: ['volEditIndex', 'volRole', 'volOrg', 'volPeriod']
    };
    (fields[type] || []).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id.includes('EditIndex') ? "-1" : "");
    });
};

// 2️⃣ إدارة الشهادات (حفظ وتعديل)
App.saveCertificate = async function() {
    const editIdx = parseInt(document.getElementById('certEditIndex')?.value || "-1");
    const title = document.getElementById('certTitle')?.value?.trim();
    const issuer = document.getElementById('certIssuer')?.value?.trim();
    if (!title || !issuer) return alert("يرجى كتابة اسم الشهادة والجهة المصدرة.");

    const item = {
        id: editIdx >= 0 ? (this.cachedDb.certificates[editIdx]?.id || 'cert-' + Date.now()) : 'cert-' + Date.now(),
        title, issuer,
        date: document.getElementById('certDate')?.value || '',
        category: document.getElementById('certCategory')?.value?.trim() || 'عام',
        pin: document.getElementById('certPin')?.value?.trim() || '1234',
        imageUrl: document.getElementById('certImage')?.value?.trim() || ''
    };

    if (!this.cachedDb.certificates) this.cachedDb.certificates = [];
    if (editIdx >= 0) this.cachedDb.certificates[editIdx] = item;
    else this.cachedDb.certificates.push(item);

    if (await Store.saveKnowledge(this.cachedDb)) this.resetForm('cert');
};

App.editCertificate = function(index) {
    const item = this.cachedDb?.certificates?.[index];
    if (!item) return;
    if (document.getElementById('certEditIndex')) document.getElementById('certEditIndex').value = index;
    if (document.getElementById('certTitle')) document.getElementById('certTitle').value = item.title || '';
    if (document.getElementById('certIssuer')) document.getElementById('certIssuer').value = item.issuer || '';
    if (document.getElementById('certDate')) document.getElementById('certDate').value = item.date || '';
    if (document.getElementById('certCategory')) document.getElementById('certCategory').value = item.category || '';
    if (document.getElementById('certPin')) document.getElementById('certPin').value = item.pin || '';
    if (document.getElementById('certImage')) document.getElementById('certImage').value = item.imageUrl || '';
    this.switchAdminTab('tab-certs');
};

// 3️⃣ إدارة الخبرات (حفظ وتعديل)
App.saveExperience = async function() {
    const editIdx = parseInt(document.getElementById('expEditIndex')?.value || "-1");
    const role = document.getElementById('expRole')?.value?.trim();
    const company = document.getElementById('expCompany')?.value?.trim();
    if (!role || !company) return alert("أدخل المسمى الوظيفي والجهة.");

    const item = {
        role, company,
        period: document.getElementById('expPeriod')?.value?.trim() || '',
        desc: document.getElementById('expDesc')?.value?.trim() || ''
    };

    if (!this.cachedDb.experiences) this.cachedDb.experiences = [];
    if (editIdx >= 0) this.cachedDb.experiences[editIdx] = item;
    else this.cachedDb.experiences.push(item);

    if (await Store.saveKnowledge(this.cachedDb)) this.resetForm('exp');
};

App.editExperience = function(index) {
    const item = this.cachedDb?.experiences?.[index];
    if (!item) return;
    if (document.getElementById('expEditIndex')) document.getElementById('expEditIndex').value = index;
    if (document.getElementById('expRole')) document.getElementById('expRole').value = item.role || '';
    if (document.getElementById('expCompany')) document.getElementById('expCompany').value = item.company || '';
    if (document.getElementById('expPeriod')) document.getElementById('expPeriod').value = item.period || '';
    if (document.getElementById('expDesc')) document.getElementById('expDesc').value = item.desc || '';
    this.switchAdminTab('tab-exp');
};

// 4️⃣ إدارة المهارات (حفظ وتعديل)
App.saveSkill = async function() {
    const editIdx = parseInt(document.getElementById('skillEditIndex')?.value || "-1");
    const name = document.getElementById('skillName')?.value?.trim();
    if (!name) return alert("أدخل اسم المهارة.");

    const item = {
        name,
        category: document.getElementById('skillCategory')?.value?.trim() || 'عام',
        level: document.getElementById('skillLevel')?.value || 'متوسط'
    };

    if (!this.cachedDb.skills) this.cachedDb.skills = [];
    if (editIdx >= 0) this.cachedDb.skills[editIdx] = item;
    else this.cachedDb.skills.push(item);

    if (await Store.saveKnowledge(this.cachedDb)) this.resetForm('skill');
};

App.editSkill = function(index) {
    const item = this.cachedDb?.skills?.[index];
    if (!item) return;
    if (document.getElementById('skillEditIndex')) document.getElementById('skillEditIndex').value = index;
    if (document.getElementById('skillName')) document.getElementById('skillName').value = item.name || '';
    if (document.getElementById('skillCategory')) document.getElementById('skillCategory').value = item.category || '';
    if (document.getElementById('skillLevel')) document.getElementById('skillLevel').value = item.level || 'متوسط';
    this.switchAdminTab('tab-skills');
};

// 5️⃣ إدارة التطوع (حفظ وتعديل)
App.saveVolunteer = async function() {
    const editIdx = parseInt(document.getElementById('volEditIndex')?.value || "-1");
    const role = document.getElementById('volRole')?.value?.trim();
    if (!role) return alert("أدخل الدور التطوعي.");

    const item = {
        role,
        org: document.getElementById('volOrg')?.value?.trim() || '',
        period: document.getElementById('volPeriod')?.value?.trim() || ''
    };

    if (!this.cachedDb.volunteer) this.cachedDb.volunteer = [];
    if (editIdx >= 0) this.cachedDb.volunteer[editIdx] = item;
    else this.cachedDb.volunteer.push(item);

    if (await Store.saveKnowledge(this.cachedDb)) this.resetForm('vol');
};

App.editVolunteer = function(index) {
    const item = this.cachedDb?.volunteer?.[index];
    if (!item) return;
    if (document.getElementById('volEditIndex')) document.getElementById('volEditIndex').value = index;
    if (document.getElementById('volRole')) document.getElementById('volRole').value = item.role || '';
    if (document.getElementById('volOrg')) document.getElementById('volOrg').value = item.org || '';
    if (document.getElementById('volPeriod')) document.getElementById('volPeriod').value = item.period || '';
    this.switchAdminTab('tab-vol');
};

// 6️⃣ تحديث عرض القوائم مع أزرار التعديل ✏️ والحذف 🗑️ لكل الأقسام
App.renderAdminLists = function(db) {
    const renderSection = (containerId, key, titleField, editFn) => {
        const el = document.getElementById(containerId);
        if (!el) return;
        const list = db[key] || [];
        el.innerHTML = list.map((item, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:6px 10px; margin-top:6px; border-radius:6px; font-size:0.85rem;">
                <span>${item[titleField] || item.name || item.role}</span>
                <div style="display:flex; gap:4px;">
                    <button onclick="App.${editFn}(${i})" style="background:#eab308; color:#fff; padding:2px 6px; font-size:0.75rem;">✏️</button>
                    <button onclick="App.deleteItem('${key}', ${i})" style="background:#ef4444; color:#fff; padding:2px 6px; font-size:0.75rem;">🗑️</button>
                </div>
            </div>
        `).join('');
    };

    renderSection('admin-certs-list', 'certificates', 'title', 'editCertificate');
    renderSection('admin-exp-list', 'experiences', 'role', 'editExperience');
    renderSection('admin-skills-list', 'skills', 'name', 'editSkill');
    renderSection('admin-vol-list', 'volunteer', 'role', 'editVolunteer');
};
};

window.App = App;
window.Store = Store;
document.addEventListener('DOMContentLoaded', () => App.init());
