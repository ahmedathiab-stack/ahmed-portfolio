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
    // =========================================================
//  إدارة البيانات اليدوية (إضافة وتعديل وحذف) - script.js
// =========================================================

// 1️⃣ حفظ أو تعديل شهادة يدوياً
App.saveCertificate = async function() {
    const editIdx = parseInt(document.getElementById('certEditIndex').value);
    const title = document.getElementById('certTitle').value.trim();
    const issuer = document.getElementById('certIssuer').value.trim();
    const date = document.getElementById('certDate').value;
    const category = document.getElementById('certCategory').value.trim();
    const pin = document.getElementById('certPin').value.trim();
    const image = document.getElementById('certImage').value.trim();

    if (!title || !issuer) return alert("يرجى إدخال اسم الشهادة والجهة المصدرة على الأقل.");

    const certData = {
        id: editIdx >= 0 ? this.cachedDb.certificates[editIdx].id : 'cert-' + Date.now(),
        title, issuer, date, category: category || 'عام', pin: pin || '1234', imageUrl: image
    };

    if (editIdx >= 0) {
        this.cachedDb.certificates[editIdx] = certData;
    } else {
        if (!this.cachedDb.certificates) this.cachedDb.certificates = [];
        this.cachedDb.certificates.push(certData);
    }

    const saved = await Store.saveKnowledge(this.cachedDb);
    if (saved) {
        alert(editIdx >= 0 ? "تم تعديل الشهادة بنجاح! ✅" : "تمت إضافة الشهادة بنجاح! ✅");
        this.resetForm('cert');
    }
};

// 2️⃣ تعبئة حقول التعديل للشهادة
App.editCertificate = function(index) {
    const cert = this.cachedDb.certificates[index];
    if (!cert) return;
    document.getElementById('certEditIndex').value = index;
    document.getElementById('certTitle').value = cert.title || '';
    document.getElementById('certIssuer').value = cert.issuer || '';
    document.getElementById('certDate').value = cert.date || '';
    document.getElementById('certCategory').value = cert.category || '';
    document.getElementById('certPin').value = cert.pin || '';
    document.getElementById('certImage').value = cert.imageUrl || '';
    
    // التبديل لتبويب الشهادات
    this.switchAdminTab('tab-certs');
};

// 3️⃣ حفظ وتعديل الخبرات والمهارات والتطوع
App.saveExperience = async function() {
    const idx = parseInt(document.getElementById('expEditIndex').value);
    const role = document.getElementById('expRole').value.trim();
    const company = document.getElementById('expCompany').value.trim();
    const period = document.getElementById('expPeriod').value.trim();
    const desc = document.getElementById('expDesc').value.trim();

    if (!role || !company) return alert("أدخل المسمى الوظيفي والشركة.");
    const expItem = { role, company, period, desc };

    if (idx >= 0) this.cachedDb.experiences[idx] = expItem;
    else {
        if (!this.cachedDb.experiences) this.cachedDb.experiences = [];
        this.cachedDb.experiences.push(expItem);
    }

    if (await Store.saveKnowledge(this.cachedDb)) this.resetForm('exp');
};

App.editExperience = function(index) {
    const exp = this.cachedDb.experiences[index];
    document.getElementById('expEditIndex').value = index;
    document.getElementById('expRole').value = exp.role || '';
    document.getElementById('expCompany').value = exp.company || '';
    document.getElementById('expPeriod').value = exp.period || '';
    document.getElementById('expDesc').value = exp.desc || '';
    this.switchAdminTab('tab-exp');
};

// 4️⃣ تفريغ النماذج بعد الحفظ
App.resetForm = function(type) {
    if (type === 'cert') {
        document.getElementById('certEditIndex').value = "-1";
        ['certTitle', 'certIssuer', 'certDate', 'certCategory', 'certPin', 'certImage'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
    } else if (type === 'exp') {
        document.getElementById('expEditIndex').value = "-1";
        ['expRole', 'expCompany', 'expPeriod', 'expDesc'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
    }
};

// 5️⃣ تحديث عرض قوائم التحكم الإدارية لتشمل زر التعديل ✏️
App.renderAdminLists = function(db) {
    const certList = document.getElementById('admin-certs-list');
    if (certList) {
        certList.innerHTML = (db.certificates || []).map((c, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px 12px; margin-top:8px; border-radius:6px; border:1px solid #cbd5e1;">
                <div><strong>${c.title}</strong> <small style="color:#64748b">(${c.issuer})</small></div>
                <div style="display:flex; gap:6px;">
                    <button onclick="App.editCertificate(${i})" style="background:#eab308; color:#fff; padding:4px 8px; font-size:0.8rem;">✏️ تعديل</button>
                    <button onclick="App.deleteItem('certificates', ${i})" style="background:#ef4444; color:#fff; padding:4px 8px; font-size:0.8rem;">🗑️ حذف</button>
                </div>
            </div>
        `).join('');
    }

    const expList = document.getElementById('admin-exp-list');
    if (expList) {
        expList.innerHTML = (db.experiences || []).map((e, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px 12px; margin-top:8px; border-radius:6px; border:1px solid #cbd5e1;">
                <div><strong>${e.role}</strong> <small>(${e.company})</small></div>
                <div style="display:flex; gap:6px;">
                    <button onclick="App.editExperience(${i})" style="background:#eab308; color:#fff; padding:4px 8px; font-size:0.8rem;">✏️ تعديل</button>
                    <button onclick="App.deleteItem('experiences', ${i})" style="background:#ef4444; color:#fff; padding:4px 8px; font-size:0.8rem;">🗑️ حذف</button>
                </div>
            </div>
        `).join('');
    }
};

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
};

window.App = App;
window.Store = Store;
document.addEventListener('DOMContentLoaded', () => App.init());
