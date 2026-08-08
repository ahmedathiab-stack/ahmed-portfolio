/**
 * ============================================================================
 *  الموقع المهني وشبكة إدارة المحتوى - أ/ أحمد عادل ناجي ذياب
 *  Engine Version: 3.0 (Clean Architecture & Production Ready)
 * ============================================================================
 */

// ============================================================================
// 1. الإعدادات والبيانات الافتراضية (Configuration & Constants)
// ============================================================================
/* =========================================================
   ملف الجافاسكريبت الرئيسي (script.js) - أ/ أحمد عادل ناجي ذياب
   ========================================================= */

const CONFIG = {
    WHATSAPP_NUMBER: "967770000000", // استبدل هذا برقم الواتساب الخاص بك (متبوعاً برقم الدولة بدون علامة +)
    ADMIN_PASSWORD: "1234"           // كلمة مرور لوحة التحكم (يمكنك تغييرها هنا)
};

const App = {
    init() {
        this.setupDrawer();
        this.setupTabs();
        this.setupModal();
    },

    // 1. تشغيل اللوحة الجانبية (Admin Drawer)
    setupDrawer() {
        const fabBtn = document.getElementById('toggle-drawer-btn');
        const drawer = document.getElementById('admin-drawer');
        const closeBtn = document.getElementById('close-drawer-btn');

        if (fabBtn && drawer) {
            fabBtn.addEventListener('click', () => drawer.classList.add('open'));
        }
        if (closeBtn && drawer) {
            closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
        }
    },

    // 2. نظام التبويبات داخل لوحة التحكم
    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-target');
                
                // إزالة التنشيط عن كل التبويبات والمحتويات
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
                
                // تنشيط التبويب الحالي والمحتوى المرتبط به
                tab.classList.add('active');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.style.display = 'block';
                }
            });
        });
    },

    // 3. إدارة النوافذ المنبثقة (Modals)
    setupModal() {
        const modal = document.getElementById('auth-modal');
        const closeBtn = document.getElementById('close-auth-modal');

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }

        // إغلاق النافذة عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    },

    // فتح نافذة تسجيل الدخول للإدارة
    toggleAdminAuth() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    // التحقق من كلمة المرور
    verifyPassword() {
        const passInput = document.getElementById('admin-password-input');
        const errorText = document.getElementById('auth-error');
        const contentBody = document.getElementById('admin-content-body');
        const authBtnText = document.getElementById('auth-btn-text');

        if (passInput && passInput.value === CONFIG.ADMIN_PASSWORD) {
            document.getElementById('auth-modal').style.display = 'none';
            if (contentBody) contentBody.style.display = 'block';
            if (authBtnText) authBtnText.innerText = '✅ تم تسجيل الدخول بنجاح';
            passInput.value = '';
            if (errorText) errorText.innerText = '';
        } else {
            if (errorText) errorText.innerText = 'كلمة المرور غير صحيحة، حاول مرة أخرى.';
        }
    },

    // 4. التوجيه المباشر إلى الواتساب بدون حظر
    sendWhatsAppRequest(certTitle = null) {
        let message = certTitle 
            ? `مرحباً أ/ أحمد عادل، أود الحصول على (مفتاح تصريح) للشهادة التالية: [${certTitle}].`
            : `مرحباً أ/ أحمد عادل، أود الحصول على (مفتاح تصريح شامل) للاطلاع على كافة الشهادات والوثائق.`;

        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.location.href = url;
    }
};

// تشغيل النظام فور تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', () => App.init());
static sendWhatsAppRequest(certTitle = null) {
    let message = certTitle 
        ? `مرحباً أ/ أحمد عادل، أود الحصول على (مفتاح تصريح) للشهادة التالية: [${certTitle}].`
        : `مرحباً أ/ أحمد عادل، أود الحصول على (مفتاح تصريح شامل) للاطلاع على كافة الشهادات والوثائق في موقعك المهني.`;

    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    
    // استخدام التوجيه المباشر لضمان فتح الواتساب بدون حظر من المتصفح
    window.location.href = url;
    App.closeWaModal();
}
const CONFIG = {
    WHATSAPP_NUMBER: "967779087415", // رقم الواتساب الموحد
    MASTER_RECOVERY_PIN: "7777",    // رمز استعادة لوحة التحكم
    DEFAULT_PASS: "1234",
    STORAGE_KEYS: {
        KNOWLEDGE: "ahmed_knowledge_base_v2",
        ADVANCED_KEYS: "ahmed_advanced_keys_v2",
        ADMIN_PASS: "ahmed_admin_password",
        UNLOCKED_CERTS: "ahmed_unlocked_certs_session",
        AI_STATUS: "ahmed_ai_adapt_status"
    }
};

const DEFAULT_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        location: "جعار - خنفر - أبين - اليمن",
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين، أجمع بين الخبرة المالية العملية والمهارات التدريبية والتيسيرية."
    },
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", status: "متاح", issuer: "جامعة أبين (2026)", imageUrl: "", pin: "1001", unlocked: false },
        { id: "cert-acc-2", title: "شهادة نظام إكسترا للمحاسبة والإدارة", category: "محاسبة", status: "متاح", issuer: "بن مقيبل للأنظمة ومؤسسة بلقيس (2022)", imageUrl: "", pin: "1002", unlocked: false },
        { id: "cert-it-1", title: "دبلوم قيادة الحاسوب ICDL", category: "تقنية معلومات", status: "متاح", issuer: "وزارة التعليم الفني - معهد جبس (2020)", imageUrl: "", pin: "1003", unlocked: false },
        { id: "cert-lang-1", title: "شهادة اللغة الإنجليزية (B2)", category: "لغات", status: "متاح", issuer: "وزارة التعليم الفني - معهد جبس (2022)", imageUrl: "", pin: "1004", unlocked: false },
        { id: "cert-acc-3", title: "شهادة المعايير الدولية IFRS", category: "محاسبة", status: "قيد الحصول / قيد الرفع", issuer: "جاري العمل عليها", imageUrl: "", pin: "", unlocked: false }
    ],
    experiences: [
        {
            role: "مدرب أنظمة محاسبية وماليات",
            company: "مراكز تدريبية ومؤسسات أهلية",
            period: "2023 - الحالي",
            desc: "تدريب وإدارة تطبيقات نظام إكسترا المحاسبي الآلي، وإدارة الحسابات اليومية وتسجيل القيود وإصدار التقارير المالية."
        }
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

// ============================================================================
// 2. المحرك المركزي لإدارة الحالة (State & Store Manager)
// ============================================================================
class Store {
    static getKnowledge() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.KNOWLEDGE);
        return data ? JSON.parse(data) : DEFAULT_KNOWLEDGE_BASE;
    }

    static saveKnowledge(data) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.KNOWLEDGE, JSON.stringify(data));
        App.renderAll();
    }

    static getKeys() {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ADVANCED_KEYS) || '[]');
    }

    static saveKeys(keys) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ADVANCED_KEYS, JSON.stringify(keys));
        App.renderAdminLists();
    }

    static getUnlockedCerts() {
        return JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS) || '[]');
    }

    static unlockCert(certId) {
        const unlocked = Store.getUnlockedCerts();
        if (!unlocked.includes(certId)) {
            unlocked.push(certId);
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(unlocked));
            App.renderAll();
        }
    }
}

// ============================================================================
// 3. نظام الإشعارات والتنبيهات الذكية (Toast & UI Helpers)
// ============================================================================
class UIHelper {
    static notify(message, type = 'success') {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.className = 'toast-container';
            document.body.appendChild(toast);
        }
        
        const item = document.createElement('div');
        item.className = `toast-item toast-${type}`;
        item.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
        toast.appendChild(item);

        setTimeout(() => item.classList.add('show'), 10);
        setTimeout(() => {
            item.classList.remove('show');
            setTimeout(() => item.remove(), 300);
        }, 3000);
    }
}

// ============================================================================
// 4. التطبيق الرئيسي والتحكم بالتفاعلات (Main Application Logic)
// ============================================================================
class App {
    static isAdminLoggedIn = false;

    static init() {
        document.addEventListener("DOMContentLoaded", () => {
            App.renderAll();
            App.setupEventListeners();
        });
    }

    static setupEventListeners() {
        const drawerBtn = document.getElementById('toggle-drawer-btn');
        if (drawerBtn) drawerBtn.addEventListener('click', App.toggleAdminDrawer);
    }

    // --- العرض والتحديث الشامل (UI Rendering) ---
    static renderAll() {
        App.renderCertificates();
        App.renderExperiences();
        App.renderSkills();
        App.renderVolunteer();
        if (App.isAdminLoggedIn) App.renderAdminLists();
    }

    static renderCertificates() {
        const container = document.getElementById("certificates-container");
        if (!container) return;

        const db = Store.getKnowledge();
        const unlockedList = Store.getUnlockedCerts();

        if (!db.certificates.length) {
            container.innerHTML = '<p class="empty-msg">لا توجد شهادات مضافة حالياً.</p>';
            return;
        }

        container.innerHTML = db.certificates.map((c, index) => {
            const isUnlocked = unlockedList.includes(c.id) || c.unlocked;
            const isPending = c.status === 'قيد الحصول / قيد الرفع';

            return `
                <div class="cert-card ${isUnlocked ? 'unlocked' : ''}">
                    <div class="cert-details">
                        <h4>${c.title}</h4>
                        <p class="cert-meta">📌 ${c.issuer} | <span class="badge">${c.category}</span></p>
                    </div>
                    <div class="cert-actions">
                        ${isPending ? 
                            '<span class="status-badge pending">⏳ قيد التجهيز</span>' :
                            isUnlocked ? 
                                `<a href="${c.imageUrl || '#'}" target="_blank" class="btn btn-view">👁️ عرض المستند</a>` :
                                `<button class="btn btn-lock" onclick="App.openModal('${c.title}')">🔒 طلب تصريح</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    static renderExperiences() {
        const container = document.getElementById("experiences-container");
        if (!container) return;

        const db = Store.getKnowledge();
        container.innerHTML = db.experiences.map(e => `
            <div class="timeline-card">
                <div class="timeline-header">
                    <h4>${e.role}</h4>
                    <span class="company-tag">${e.company}</span>
                </div>
                <span class="period-tag">🗓️ ${e.period}</span>
                <p class="desc">${e.desc || ''}</p>
            </div>
        `).join('');
    }

    static renderSkills() {
        const container = document.getElementById("skills-container");
        if (!container) return;

        const db = Store.getKnowledge();
        const grouped = db.skills.reduce((acc, skill) => {
            const cat = skill.category || 'مهارات عامة';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(skill);
            return acc;
        }, {});

        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            html += `
                <div class="skill-group">
                    <h5>${category}</h5>
                    <div class="skills-chips">
                        ${items.map(s => `<span class="chip"><strong>${s.name}</strong> <small>(${s.level})</small></span>`).join('')}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html || '<p class="empty-msg">لا توجد مهارات مسجلة.</p>';
    }

    static renderVolunteer() {
        const container = document.getElementById("volunteer-container");
        if (!container) return;

        const db = Store.getKnowledge();
        container.innerHTML = db.volunteer.length ? db.volunteer.map(v => `
            <div class="vol-item">
                <div class="vol-title">🤝 ${v.role}</div>
                <div class="vol-org">${v.org} <small>(${v.period})</small></div>
            </div>
        `).join('') : '<p class="empty-msg">لا توجد أعمال تطوعية مضافة حالياً.</p>';
    }

    // --- الواتساب والتواصل (WhatsApp Requests) ---
    static sendWhatsAppRequest(certTitle = null) {
        let message = certTitle 
            ? `مرحباً أ/ أحمد عادل، أود الحصول على (مفتاح تصريح) للشهادة التالية: [${certTitle}].`
            : `مرحباً أ/ أحمد عادل، أود الحصول على (مفتاح تصريح شامل) للاطلاع على كافة الشهادات والوثائق في موقعك المهني.`;

        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        App.closeWaModal();
    }

    static openModal(certTitle) {
        const modal = document.getElementById('wa-modal');
        const select = document.getElementById('waCertSelect');
        
        if (select) {
            const db = Store.getKnowledge();
            select.innerHTML = db.certificates.map(c => `<option value="${c.title}">${c.title} - (${c.issuer})</option>`).join('');
            if (certTitle) select.value = certTitle;
        }

        if (modal) modal.style.display = 'flex';
    }

    static closeWaModal() {
        const modal = document.getElementById('wa-modal');
        if (modal) modal.style.display = 'none';
    }

    // --- إدارة الأمان ولوحة التحكم (Admin Panel & Security) ---
    static toggleAdminDrawer() {
        const drawer = document.getElementById('admin-drawer');
        if (drawer) drawer.classList.toggle('open');
    }

    static toggleAdminAuth() {
        if (App.isAdminLoggedIn) {
            App.isAdminLoggedIn = false;
            document.getElementById('admin-content-body').style.display = 'none';
            document.getElementById('auth-btn').innerText = '🔒 تسجيل الدخول للوحة';
            UIHelper.notify('تم تسجيل الخروج بنجاح.', 'warning');
            return;
        }

        const savedPass = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_PASS) || CONFIG.DEFAULT_PASS;
        const pass = prompt('أدخل كلمة مرور لوحة التحكم:');
        
        if (pass === savedPass) {
            App.unlockAdminPanel();
        } else if (pass !== null) {
            if (confirm('كلمة المرور غير صحيحة! هل ترغب في استعادتها بواسطة Master PIN؟')) {
                const pin = prompt('أدخل رمز الاستعادة (Master PIN):');
                if (pin === CONFIG.MASTER_RECOVERY_PIN) {
                    const newPass = prompt('أدخل كلمة المرور الجديدة:');
                    if (newPass) {
                        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_PASS, newPass);
                        UIHelper.notify('تم تغيير كلمة المرور وتسجيل الدخول بنجاح!');
                        App.unlockAdminPanel();
                    }
                } else {
                    UIHelper.notify('رمز الاستعادة غير صحيح!', 'warning');
                }
            }
        }
    }

    static unlockAdminPanel() {
        App.isAdminLoggedIn = true;
        document.getElementById('admin-content-body').style.display = 'block';
        document.getElementById('auth-btn').innerText = '🔓 تسجيل الخروج';
        App.renderAdminLists();
        UIHelper.notify('مرحباً بك في لوحة التحكم الإدارية.');
    }

    static renderAdminLists() {
        const db = Store.getKnowledge();

        // 1. قائمة الشهادات
        const certList = document.getElementById('admin-certs-list');
        if (certList) {
            certList.innerHTML = db.certificates.map((c, i) => `
                <div class="admin-row">
                    <span><strong>${c.title}</strong> <small>(${c.issuer})</small></span>
                    <div>
                        <button class="btn-sm btn-edit" onclick="App.editCert(${i})">✏️ تعديل</button>
                        <button class="btn-sm btn-delete" onclick="App.deleteCert(${i})">🗑️ حذف</button>
                    </div>
                </div>
            `).join('') || '<p class="empty-msg">لا توجد شهادات.</p>';
        }

        // 2. قائمة الخبرات
        const expList = document.getElementById('admin-exp-list');
        if (expList) {
            expList.innerHTML = db.experiences.map((e, i) => `
                <div class="admin-row">
                    <span><strong>${e.role}</strong> - ${e.company}</span>
                    <div>
                        <button class="btn-sm btn-delete" onclick="App.deleteExp(${i})">🗑️ حذف</button>
                    </div>
                </div>
            `).join('') || '<p class="empty-msg">لا توجد خبرات.</p>';
        }

        // 3. عرض تاريخ المفاتيح
        App.renderKeysHistory();
    }

    // --- العمليات الشاملة للإضافة والحذف (CRUD Operations) ---
    static saveCertificate() {
        const title = document.getElementById('certTitle').value.trim();
        const issuer = document.getElementById('certIssuer').value.trim();
        const category = document.getElementById('certCategory').value.trim();
        const imageUrl = document.getElementById('certImage').value.trim();
        const editIndex = parseInt(document.getElementById('certEditIndex').value);

        if (!title || !issuer) return UIHelper.notify('يرجى كتابة اسم الشهادة والجهة المصدرة', 'warning');

        const db = Store.getKnowledge();
        const certData = { id: `cert-${Date.now()}`, title, issuer, category: category || 'عام', imageUrl, status: 'متاح' };

        if (editIndex >= 0) {
            db.certificates[editIndex] = { ...db.certificates[editIndex], ...certData };
            document.getElementById('certEditIndex').value = "-1";
        } else {
            db.certificates.push(certData);
        }

        Store.saveKnowledge(db);
        App.resetForm(['certTitle', 'certIssuer', 'certCategory', 'certImage']);
        UIHelper.notify('تم حفظ الشهادة بنجاح!');
    }

    static editCert(index) {
        const db = Store.getKnowledge();
        const c = db.certificates[index];
        if (!c) return;

        document.getElementById('certEditIndex').value = index;
        document.getElementById('certTitle').value = c.title;
        document.getElementById('certIssuer').value = c.issuer;
        document.getElementById('certCategory').value = c.category;
        document.getElementById('certImage').value = c.imageUrl || '';
    }

    static deleteCert(index) {
        if (!confirm('تأكيد حذف الشهادة؟')) return;
        const db = Store.getKnowledge();
        db.certificates.splice(index, 1);
        Store.saveKnowledge(db);
        UIHelper.notify('تم حذف الشهادة.');
    }

    static saveExperience() {
        const role = document.getElementById('expRole').value.trim();
        const company = document.getElementById('expCompany').value.trim();
        const period = document.getElementById('expPeriod').value.trim();
        const desc = document.getElementById('expDesc').value.trim();

        if (!role || !company) return UIHelper.notify('يرجى ملء المسمى الوظيفي والجهة', 'warning');

        const db = Store.getKnowledge();
        db.experiences.push({ role, company, period, desc });
        Store.saveKnowledge(db);

        App.resetForm(['expRole', 'expCompany', 'expPeriod', 'expDesc']);
        UIHelper.notify('تم إضافة الخبرة بنجاح!');
    }

    static deleteExp(index) {
        if (!confirm('تأكيد حذف الخبرة؟')) return;
        const db = Store.getKnowledge();
        db.experiences.splice(index, 1);
        Store.saveKnowledge(db);
        UIHelper.notify('تم حذف الخبرة.');
    }

    static saveSkill() {
        const name = document.getElementById('skillName').value.trim();
        const category = document.getElementById('skillCategory').value.trim();
        const level = document.getElementById('skillLevel').value;

        if (!name) return UIHelper.notify('يرجى إدخال اسم المهارة', 'warning');

        const db = Store.getKnowledge();
        db.skills.push({ name, category: category || 'عام', level });
        Store.saveKnowledge(db);

        App.resetForm(['skillName', 'skillCategory']);
        UIHelper.notify('تمت إضافة المهارة بنجاح!');
    }

    static saveVolunteer() {
        const role = document.getElementById('volRole').value.trim();
        const org = document.getElementById('volOrg').value.trim();
        const period = document.getElementById('volPeriod').value.trim();

        if (!role || !org) return UIHelper.notify('يرجى إدخال كافة البيانات', 'warning');

        const db = Store.getKnowledge();
        db.volunteer.push({ role, org, period });
        Store.saveKnowledge(db);

        App.resetForm(['volRole', 'volOrg', 'volPeriod']);
        UIHelper.notify('تم إضافة العمل التطوعي بنجاح!');
    }

    // --- توليد وإدارة المفاتيح المتقدمة (Advanced Key Generator) ---
    static generateAdvancedKey() {
        const type = document.getElementById('keyType').value;
        const duration = document.getElementById('keyDuration').value;
        const keyCode = 'KEY-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const keys = Store.getKeys();
        keys.push({
            code: keyCode,
            type: type,
            duration: duration,
            createdAt: new Date().toLocaleDateString('ar-EG'),
            usedCount: 0,
            active: true
        });

        Store.saveKeys(keys);
        UIHelper.notify(`تم إنشاء المفتاح بنجاح: ${keyCode}`);
    }

    static revokeKey(index) {
        const keys = Store.getKeys();
        keys[index].active = false;
        Store.saveKeys(keys);
    }

    static deleteKey(index) {
        const keys = Store.getKeys();
        keys.splice(index, 1);
        Store.saveKeys(keys);
    }

    static renderKeysHistory() {
        const keys = Store.getKeys();
        const container = document.getElementById('keys-history-list');
        if (!container) return;

        container.innerHTML = keys.length ? keys.map((k, i) => `
            <div class="admin-row">
                <div>
                    <strong>${k.code}</strong> <small>(${k.duration === 'once' ? 'مرة واحدة' : k.duration + ' أيام'})</small>
                    <br><small class="sub-text">${k.active ? '🟢 نشط' : '🔴 ملغى'} | الاستخدام: ${k.usedCount}</small>
                </div>
                <div>
                    ${k.active ? `<button class="btn-sm btn-warning" onclick="App.revokeKey(${i})">إلغاء</button>` : ''}
                    <button class="btn-sm btn-delete" onclick="App.deleteKey(${i})">حذف</button>
                </div>
            </div>
        `).join('') : '<p class="empty-msg">لا توجد مفاتيح منشأة.</p>';
    }

    // --- أدوات مساعدة (Utility Methods) ---
    static resetForm(fields) {
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    static getAIBaseContext() {
        const db = Store.getKnowledge();
        return `
أنت المساعد الشخصي والممثل المهني للخبر الأكاديمي والمدرب / ${db.personalInfo.name}.
المؤهلات والخبرات الحالية:
- الخبرات: ${JSON.stringify(db.experiences)}
- المهارات: ${JSON.stringify(db.skills)}
- الشهادات: ${JSON.stringify(db.certificates.map(c => ({ title: c.title, issuer: c.issuer })))}
- التطوع: ${JSON.stringify(db.volunteer)}
المطلوب منك الإجابة باحترافية ولباؤة تسويقية عالية تبرز كفاءته وحضوره المهني.`;
    }
}

// بدء تشغيل التطبيق
App.init();
