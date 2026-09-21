const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    FIREBASE_URL: "",
    STORAGE_KEYS: { 
        UNLOCKED_CERTS: "ahmed_unlocked_certs_v9",
        ADMIN_PASS: "ahmed_admin_password_sec",
        TEMP_TOKENS: "ahmed_temp_passcodes_v1"
    }
};

const DEFAULT_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين."
    },
    certificates: [],
    experiences: [],
    skills: [],
    volunteer: [],
    courses: [],      // 🆕 الدورات
    reservations: [], // 🆕 الحجوزات
    links: []         // 🆕 ملازم وروابط
};

class Store {
    static sanitizeUrl(url) {
        if (!url) return '';
        let u = url.trim();
        if (u.includes('firebaseio.com') && !u.endsWith('.json') && !u.includes('.json?')) {
            u = u.replace(/\/+$/, '') + '.json';
        }
        return u;
    }
    static getAdminPassword() { return localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_PASS) || "Ahmed_Admin_2026"; }
    static setAdminPassword(newPass) { localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_PASS, newPass); }

    static async getKnowledge() {
        const localFallback = localStorage.getItem('ahmed_knowledge_base_fallback');
        let db = localFallback ? JSON.parse(localFallback) : DEFAULT_KNOWLEDGE_BASE;
        // التأكد من وجود المصفوفات الجديدة
        if (!db.courses) db.courses = [];
        if (!db.reservations) db.reservations = [];
        if (!db.links) db.links = [];
        return db;
    }

    static async saveKnowledge(data) {
        localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(data));
        await App.renderAll();
        return true;
    }
    static getUnlockedCerts() {
        try {
            const certData = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS) || '{}');
            const now = Date.now();
            return Object.keys(certData).filter(id => certData[id] > now);
        } catch(e) { return []; }
    }
}

const App = {
    isAdminLoggedIn: false,
    cachedDb: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        this.renderAll();
    },

    async renderAll() {
        this.cachedDb = await Store.getKnowledge();
        const db = this.cachedDb;
        this.renderCertificates(db);
        this.renderExperiences(db);
        this.renderSkills(db);
        this.renderCourses(db); // 🆕
        this.renderLinks(db);   // 🆕
        if (this.isAdminLoggedIn) {
            this.renderAdminLists(db);
        }
    },

    renderCourses(db) {
        const container = document.getElementById('courses-container');
        if (!container) return;
        const courses = db.courses || [];
        if (!courses.length) {
            container.innerHTML = `<p class="text-muted">لا توجد دورات متاحة حالياً.</p>`;
            return;
        }
        container.innerHTML = courses.map(c => `
            <div class="course-item">
                <h4>${c.name}</h4>
                <span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:10px; font-size:0.8rem;">${c.type}</span>
                <p style="margin-top:10px; font-size:0.9rem;">${c.desc || 'سجل الآن عبر التحدث مع هدى الذكية!'}</p>
                <button class="btn-primary w-100 mt-2" onclick="HudaEngine.togglePublicChat()">💬 حجز عبر هدى</button>
            </div>
        `).join('');
    },

    renderLinks(db) {
        const container = document.getElementById('links-container');
        if (!container) return;
        const links = db.links || [];
        if (!links.length) {
            container.innerHTML = `<p class="text-muted">لا توجد ملازم مرفوعة حالياً.</p>`;
            return;
        }
        container.innerHTML = links.map(l => `
            <div class="link-item">
                <div>
                    <strong>📄 ${l.title}</strong>
                </div>
                <a href="${l.url}" target="_blank" class="btn-primary" style="padding: 8px 15px; font-size:0.9rem;">تحميل / عرض</a>
            </div>
        `).join('');
    },

    // (دوّال render السابقة)
    renderCertificates(db) { /* كود العرض الأصلي */ },
    renderExperiences(db) { /* كود العرض الأصلي */ },
    renderSkills(db) { /* كود العرض الأصلي */ },

    // 🆕 نظام الحفظ الموحد من لوحة التحكم
    async saveData(collection) {
        if(!this.isAdminLoggedIn) return;
        if(!this.cachedDb[collection]) this.cachedDb[collection] = [];
        
        let newItem = {};
        if (collection === 'courses') {
            newItem = {
                name: document.getElementById('courseName').value,
                type: document.getElementById('courseType').value,
                desc: document.getElementById('courseDesc').value
            };
        } else if (collection === 'links') {
            newItem = {
                title: document.getElementById('linkTitle').value,
                url: document.getElementById('linkUrl').value
            };
        } else if (collection === 'certificates') {
            newItem = { title: document.getElementById('certTitle').value, issuer: document.getElementById('certIssuer').value, imageUrl: document.getElementById('certImage').value };
        } // يمكن إضافة باقي الأنواع بنفس النمط
        
        this.cachedDb[collection].push(newItem);
        await Store.saveKnowledge(this.cachedDb);
        alert('✅ تم الحفظ بنجاح!');
        document.querySelectorAll('input, textarea').forEach(i => i.value='');
    },

    renderAdminLists(db) {
        // إكمال دالة الرندر للوحة التحكم
        const createHtml = (arr, displayKey, collectionName) => {
            return (arr || []).map((item, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
                    <span style="font-size:0.9rem; font-weight:600;">${item[displayKey]}</span>
                    <button class="btn-danger" style="padding:5px 10px;" onclick="App.deleteItem('${collectionName}', ${i})">حذف</button>
                </div>
            `).join('');
        };
        
        if(document.getElementById('admin-courses-list')) document.getElementById('admin-courses-list').innerHTML = createHtml(db.courses, 'name', 'courses');
        if(document.getElementById('admin-links-list')) document.getElementById('admin-links-list').innerHTML = createHtml(db.links, 'title', 'links');
        
        // عرض الحجوزات كجدول
        const resList = document.getElementById('admin-reservations-list');
        if (resList) {
            if(!db.reservations || !db.reservations.length) {
                resList.innerHTML = "لا توجد حجوزات بعد.";
            } else {
                resList.innerHTML = `<table>
                    <tr><th>التاريخ</th><th>الاسم</th><th>البريد</th><th>الدورة</th></tr>
                    ${db.reservations.map(r => `<tr><td>${r.date}</td><td>${r.name}</td><td>${r.email}</td><td>${r.course}</td></tr>`).join('')}
                </table>`;
            }
        }
    },

    async deleteItem(collection, index) {
        if(confirm('هل أنت متأكد من الحذف؟')) {
            this.cachedDb[collection].splice(index, 1);
            await Store.saveKnowledge(this.cachedDb);
        }
    },

    toggleAdminDrawer() { document.getElementById('admin-drawer').classList.toggle('open'); },
    switchAdminTab(id, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        btn.classList.add('active');
    },
    toggleAdminAuth() {
        if (this.isAdminLoggedIn) {
            this.isAdminLoggedIn = false;
            document.getElementById('admin-content-body').style.display = 'none';
            document.getElementById('auth-btn').innerText = '🔒 تسجيل الدخول';
            alert('تم تسجيل الخروج');
            return;
        }
        const p = prompt('كلمة المرور:');
        if (p === Store.getAdminPassword()) {
            this.isAdminLoggedIn = true;
            document.getElementById('admin-content-body').style.display = 'block';
            document.getElementById('auth-btn').innerText = '🔓 تسجيل الخروج';
            this.renderAll();
        } else { alert('كلمة المرور خاطئة!'); }
    }
};
window.onload = () => App.init();
