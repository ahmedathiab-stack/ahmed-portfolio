/**
 * الموقع الشخصي والمهني - أحمد عادل ناجي ذياب
 * ملف إدارة الواجهة الأمامية والتفاعل مع الخادم (Frontend Core & App Engine)
 */

const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    STORAGE_KEYS: { 
        UNLOCKED_CERTS: "ahmed_unlocked_certs_v9",
        ADMIN_PASS: "ahmed_admin_password_sec",
        TEMP_TOKENS: "ahmed_temp_passcodes_v1"
    }
};

/**
 * دالة لتطهير النصوص ومنع ثغرات XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * مخزن البيانات والتعامل مع الخادم المحلي والبعيد
 */
class Store {
    static sanitizeUrl(url) {
        if (!url) return '';
        let u = url.trim();
        if (u.includes('firebaseio.com') && !u.endsWith('.json') && !u.includes('.json?')) {
            u = u.replace(/\/+$/, '') + '.json';
        }
        return u;
    }

    static async getKnowledge() {
        try {
            const res = await fetch('/api/index?action=data');
            if (res.ok) {
                const data = await res.json();
                if (data && data.knowledge) {
                    let db = data.knowledge;
                    Store.normalizeDb(db);
                    return db;
                }
            }
        } catch (e) {
            console.warn("تعذر الاتصال بالخلفية، جاري استخدام التخزين المحلي المؤقت.", e);
        }

        const localFallback = localStorage.getItem('ahmed_knowledge_base_fallback');
        let db = localFallback ? JSON.parse(localFallback) : DEFAULT_KNOWLEDGE_BASE;
        Store.normalizeDb(db);
        return db;
    }

    static normalizeDb(db) {
        if (!db.courses) db.courses = [];
        if (!db.reservations) db.reservations = [];
        if (!db.links) db.links = [];
        if (!db.certificates) db.certificates = [];
        if (!db.experiences) db.experiences = [];
        if (!db.skills) db.skills = [];
        if (!db.volunteer) db.volunteer = [];
    }

    static async saveKnowledge(data) {
        localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(data));
        
        try {
            const res = await fetch('/api/index?action=data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveSection', section: 'all', data })
            });

            if (!res.ok) {
                throw new Error('SERVER_SAVE_FAILED');
            }
        } catch (e) {
            console.error("فشل الحفظ في الخادم:", e);
            throw e;
        }

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
    courses: [],
    reservations: [],
    links: []
};

/**
 * تطبيق إدارة الواجهة الأمامية والتحكم
 */
const App = {
    isAdminLoggedIn: false,
    cachedDb: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        await this.renderAll();
    },

    async renderAll() {
        this.cachedDb = await Store.getKnowledge();
        const db = this.cachedDb;
        this.renderCertificates(db);
        this.renderExperiences(db);
        this.renderSkills(db);
        this.renderCourses(db);
        this.renderLinks(db);
        if (this.isAdminLoggedIn) {
            this.renderAdminLists(db);
        }
    },

    renderCertificates(db) {
        const container = document.getElementById('certificates-container');
        if (!container) return;
        const certs = db.certificates || [];
        if (!certs.length) {
            container.innerHTML = `<p class="text-muted">لا توجد شهادات موثقة مضافة حالياً.</p>`;
            return;
        }
        const unlocked = Store.getUnlockedCerts();
        container.innerHTML = certs.map((c, i) => {
            const isUnlocked = unlocked.includes(String(i)) || unlocked.includes(c.title);
            return `
                <div class="cert-card" style="background:white; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
                    <img src="${escapeHtml(c.imageUrl || '')}" alt="${escapeHtml(c.title)}" style="width:100%; height:160px; object-fit:cover; border-radius:8px;">
                    <h4 style="margin-top:10px; color:#0f172a;">${escapeHtml(c.title)}</h4>
                    <p style="font-size:0.9rem; color:#64748b;">${escapeHtml(c.issuer)}</p>
                    <span style="display:inline-block; margin-top:8px; padding:4px 10px; font-size:0.8rem; border-radius:6px; background:${isUnlocked ? '#dcfce7; color:#166534;' : '#fee2e2; color:#991b1b;'}">
                        ${isUnlocked ? '🟢 مفعلة' : '🔒 محمية'}
                    </span>
                </div>
            `;
        }).join('');
    },

    renderExperiences(db) {
        const container = document.getElementById('experiences-container');
        if (!container) return;
        const exps = db.experiences || [];
        if (!exps.length) {
            container.innerHTML = `<p class="text-muted">لا توجد خبرات عملية مسجلة.</p>`;
            return;
        }
        container.innerHTML = exps.map(e => `
            <div class="exp-item" style="margin-bottom:15px; padding:12px; background:#f8fafc; border-radius:8px;">
                <h4 style="margin:0; color:#1e293b;">${escapeHtml(e.role)}</h4>
                <p style="margin:4px 0; font-weight:600; color:#3b82f6;">${escapeHtml(e.company)} <span style="font-weight:normal; color:#64748b; font-size:0.85rem;">(${escapeHtml(e.period)})</span></p>
                <p style="margin:6px 0 0; font-size:0.9rem; color:#475569;">${escapeHtml(e.desc)}</p>
            </div>
        `).join('');
    },

    renderSkills(db) {
        const container = document.getElementById('skills-container');
        if (!container) return;
        const skills = db.skills || [];
        if (!skills.length) {
            container.innerHTML = `<p class="text-muted">لا توجد مهارات مسجلة.</p>`;
            return;
        }
        container.innerHTML = skills.map(s => `
            <span class="skill-tag" style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:6px 12px; border-radius:20px; font-size:0.9rem; margin:4px;">
                ${escapeHtml(s.name || s)} <small style="opacity:0.8;">(${escapeHtml(s.level || '')})</small>
            </span>
        `).join('');
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
                <h4>${escapeHtml(c.name)}</h4>
                <span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:10px; font-size:0.8rem;">${escapeHtml(c.type)}</span>
                <p style="margin-top:10px; font-size:0.9rem;">${escapeHtml(c.desc || 'سجل الآن عبر التحدث مع هدى الذكية!')}</p>
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
                    <strong>📄 ${escapeHtml(l.title)}</strong>
                </div>
                <a href="${escapeHtml(l.url)}" target="_blank" class="btn-primary" style="padding: 8px 15px; font-size:0.9rem;">تحميل / عرض</a>
            </div>
        `).join('');
    },

    async saveData(collection) {
        if (!this.isAdminLoggedIn) {
            alert("⚠️ يجب تسجيل الدخول كمسؤول أولاً.");
            return;
        }
        if (!this.cachedDb[collection]) this.cachedDb[collection] = [];
        
        let newItem = {};
        if (collection === 'courses') {
            newItem = {
                name: document.getElementById('courseName')?.value || '',
                type: document.getElementById('courseType')?.value || '',
                desc: document.getElementById('courseDesc')?.value || ''
            };
        } else if (collection === 'links') {
            newItem = {
                title: document.getElementById('linkTitle')?.value || '',
                url: document.getElementById('linkUrl')?.value || ''
            };
        } else if (collection === 'certificates') {
            newItem = { 
                title: document.getElementById('certTitle')?.value || '', 
                issuer: document.getElementById('certIssuer')?.value || '', 
                imageUrl: document.getElementById('certImage')?.value || '' 
            };
        } else if (collection === 'experiences') {
            newItem = {
                role: document.getElementById('expRole')?.value || '',
                company: document.getElementById('expCompany')?.value || '',
                period: document.getElementById('expPeriod')?.value || '',
                desc: document.getElementById('expDesc')?.value || ''
            };
        } else if (collection === 'skills') {
            newItem = {
                name: document.getElementById('skillName')?.value || '',
                level: document.getElementById('skillLevel')?.value || ''
            };
        } else if (collection === 'volunteer') {
            newItem = {
                role: document.getElementById('volRole')?.value || '',
                org: document.getElementById('volOrg')?.value || ''
            };
        }
        
        if (!newItem.name && !newItem.title && !newItem.role) {
            alert("⚠️ يرجى تعبئة الحقول الأساسية على الأقل.");
            return;
        }

        this.cachedDb[collection].push(newItem);
        try {
            await Store.saveKnowledge(this.cachedDb);
            alert('✅ تم الحفظ بنجاح!');
            document.querySelectorAll('input, textarea').forEach(i => i.value = '');
        } catch (e) {
            alert('❌ فشل الحفظ في الخادم.');
        }
    },

    renderAdminLists(db) {
        const createHtml = (arr, displayKey, collectionName) => {
            return (arr || []).map((item, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
                    <span style="font-size:0.9rem; font-weight:600;">${escapeHtml(item[displayKey] || item.name || item.title || item.role)}</span>
                    <button class="btn-danger" style="padding:5px 10px;" onclick="App.deleteItem('${collectionName}', ${i})">حذف</button>
                </div>
            `).join('');
        };
        
        if(document.getElementById('admin-courses-list')) document.getElementById('admin-courses-list').innerHTML = createHtml(db.courses, 'name', 'courses');
        if(document.getElementById('admin-links-list')) document.getElementById('admin-links-list').innerHTML = createHtml(db.links, 'title', 'links');
        if(document.getElementById('admin-certs-list')) document.getElementById('admin-certs-list').innerHTML = createHtml(db.certificates, 'title', 'certificates');
        if(document.getElementById('admin-exp-list')) document.getElementById('admin-exp-list').innerHTML = createHtml(db.experiences, 'role', 'experiences');
        if(document.getElementById('admin-skills-list')) document.getElementById('admin-skills-list').innerHTML = createHtml(db.skills, 'name', 'skills');
        if(document.getElementById('admin-vol-list')) document.getElementById('admin-vol-list').innerHTML = createHtml(db.volunteer, 'role', 'volunteer');
        
        const resList = document.getElementById('admin-reservations-list');
        if (resList) {
            if(!db.reservations || !db.reservations.length) {
                resList.innerHTML = "لا توجد حجوزات بعد.";
            } else {
                resList.innerHTML = `<table>
                    <tr><th>التاريخ</th><th>الاسم</th><th>البريد</th><th>الدورة</th></tr>
                    ${db.reservations.map(r => `<tr><td>${escapeHtml(r.date \vert{}\vert{} '')}</td><td>${escapeHtml(r.name || '')}</td><td>${escapeHtml(r.email \vert{}\vert{} '')}</td><td>${escapeHtml(r.course || '')}</td></tr>`).join('')}
                </table>`;
            }
        }
    },

    async deleteItem(collection, index) {
        if (confirm('هل أنت متأكد من الحذف؟')) {
            this.cachedDb[collection].splice(index, 1);
            try {
                await Store.saveKnowledge(this.cachedDb);
                alert('✅ تم الحذف وتحديث البيانات بنجاح.');
            } catch (e) {
                alert('❌ فشل حذف العنصر من الخادم.');
            }
        }
    },

    toggleAdminDrawer() { 
        document.getElementById('admin-drawer')?.classList.toggle('open'); 
    },

    switchAdminTab(id, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
        btn?.classList.add('active');
    },

const App = {
    // استخدام getter و setter لحفظ حالة الدخول في sessionStorage تلقائياً لمنع ضياعها عند التحديث
    get isAdminLoggedIn() {
        return sessionStorage.getItem('ahmed_admin_logged_in') === 'true';
    },
    
    set isAdminLoggedIn(val) {
        if (val) {
            sessionStorage.setItem('ahmed_admin_logged_in', 'true');
        } else {
            sessionStorage.removeItem('ahmed_admin_logged_in');
        }
    },

    cachedDb: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        // التحقق المباشر من حالة الدخول عند بدء التشغيل وتحديث واجهة التحكم تلقائياً
        if (this.isAdminLoggedIn) {
            const contentBody = document.getElementById('admin-content-body');
            if (contentBody) contentBody.style.display = 'block';
            const authBtn = document.getElementById('auth-btn');
            if (authBtn) authBtn.innerText = '🔓 تسجيل الخروج';
        }
        await this.renderAll();
    },

    async renderAll() {
        this.cachedDb = await Store.getKnowledge();
        const db = this.cachedDb;
        this.renderCertificates(db);
        this.renderExperiences(db);
        this.renderSkills(db);
        this.renderCourses(db);
        this.renderLinks(db);
        if (this.isAdminLoggedIn) {
            this.renderAdminLists(db);
        }
    },

    renderCertificates(db) {
        const container = document.getElementById('certificates-container');
        if (!container) return;
        const certs = db.certificates || [];
        if (!certs.length) {
            container.innerHTML = `<p class="text-muted">لا توجد شهادات موثقة مضافة حالياً.</p>`;
            return;
        }
        const unlocked = Store.getUnlockedCerts();
        container.innerHTML = certs.map((c, i) => {
            const isUnlocked = unlocked.includes(String(i)) || unlocked.includes(c.title);
            return `
                <div class="cert-card" style="background:white; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
                    <img src="${escapeHtml(c.imageUrl || '')}" alt="${escapeHtml(c.title)}" style="width:100%; height:160px; object-fit:cover; border-radius:8px;">
                    <h4 style="margin-top:10px; color:#0f172a;">${escapeHtml(c.title)}</h4>
                    <p style="font-size:0.9rem; color:#64748b;">${escapeHtml(c.issuer)}</p>
                    <span style="display:inline-block; margin-top:8px; padding:4px 10px; font-size:0.8rem; border-radius:6px; background:${isUnlocked ? '#dcfce7; color:#166534;' : '#fee2e2; color:#991b1b;'}">
                        ${isUnlocked ? '🟢 مفعلة' : '🔒 محمية'}
                    </span>
                </div>
            `;
        }).join('');
    },

    renderExperiences(db) {
        const container = document.getElementById('experiences-container');
        if (!container) return;
        const exps = db.experiences || [];
        if (!exps.length) {
            container.innerHTML = `<p class="text-muted">لا توجد خبرات عملية مسجلة.</p>`;
            return;
        }
        container.innerHTML = exps.map(e => `
            <div class="exp-item" style="margin-bottom:15px; padding:12px; background:#f8fafc; border-radius:8px;">
                <h4 style="margin:0; color:#1e293b;">${escapeHtml(e.role)}</h4>
                <p style="margin:4px 0; font-weight:600; color:#3b82f6;">${escapeHtml(e.company)} <span style="font-weight:normal; color:#64748b; font-size:0.85rem;">(${escapeHtml(e.period)})</span></p>
                <p style="margin:6px 0 0; font-size:0.9rem; color:#475569;">${escapeHtml(e.desc)}</p>
            </div>
        `).join('');
    },

    renderSkills(db) {
        const container = document.getElementById('skills-container');
        if (!container) return;
        const skills = db.skills || [];
        if (!skills.length) {
            container.innerHTML = `<p class="text-muted">لا توجد مهارات مسجلة.</p>`;
            return;
        }
        container.innerHTML = skills.map(s => `
            <span class="skill-tag" style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:6px 12px; border-radius:20px; font-size:0.9rem; margin:4px;">
                ${escapeHtml(s.name || s)} <small style="opacity:0.8;">(${escapeHtml(s.level || '')})</small>
            </span>
        `).join('');
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
                <h4>${escapeHtml(c.name)}</h4>
                <span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:10px; font-size:0.8rem;">${escapeHtml(c.type)}</span>
                <p style="margin-top:10px; font-size:0.9rem;">${escapeHtml(c.desc || 'سجل الآن عبر التحدث مع هدى الذكية!')}</p>
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
                    <strong>📄 ${escapeHtml(l.title)}</strong>
                </div>
                <a href="${escapeHtml(l.url)}" target="_blank" class="btn-primary" style="padding: 8px 15px; font-size:0.9rem;">تحميل / عرض</a>
            </div>
        `).join('');
    },

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
            newItem = { 
                title: document.getElementById('certTitle').value, 
                issuer: document.getElementById('certIssuer').value, 
                imageUrl: document.getElementById('certImage').value 
            };
        } else if (collection === 'experiences') {
            newItem = {
                role: document.getElementById('expRole').value,
                company: document.getElementById('expCompany').value,
                period: document.getElementById('expPeriod').value,
                desc: document.getElementById('expDesc').value
            };
        } else if (collection === 'skills') {
            newItem = {
                name: document.getElementById('skillName').value,
                level: document.getElementById('skillLevel').value
            };
        }
        
        this.cachedDb[collection].push(newItem);
        await Store.saveKnowledge(this.cachedDb);
        alert('✅ تم الحفظ بنجاح!');
        document.querySelectorAll('input, textarea').forEach(i => i.value = '');
    },

    renderAdminLists(db) {
        const createHtml = (arr, displayKey, collectionName) => {
            return (arr || []).map((item, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
                    <span style="font-size:0.9rem; font-weight:600;">${escapeHtml(item[displayKey] || item.name || item.title)}</span>
                    <button class="btn-danger" style="padding:5px 10px;" onclick="App.deleteItem('${collectionName}', ${i})">حذف</button>
                </div>
            `).join('');
        };
        
        if(document.getElementById('admin-courses-list')) document.getElementById('admin-courses-list').innerHTML = createHtml(db.courses, 'name', 'courses');
        if(document.getElementById('admin-links-list')) document.getElementById('admin-links-list').innerHTML = createHtml(db.links, 'title', 'links');
        if(document.getElementById('admin-certs-list')) document.getElementById('admin-certs-list').innerHTML = createHtml(db.certificates, 'title', 'certificates');
        if(document.getElementById('admin-exp-list')) document.getElementById('admin-exp-list').innerHTML = createHtml(db.experiences, 'role', 'experiences');
        if(document.getElementById('admin-skills-list')) document.getElementById('admin-skills-list').innerHTML = createHtml(db.skills, 'name', 'skills');
        
        const resList = document.getElementById('admin-reservations-list');
        if (resList) {
            if(!db.reservations || !db.reservations.length) {
                resList.innerHTML = "لا توجد حجوزات بعد.";
            } else {
                resList.innerHTML = `<table>
                    <tr><th>التاريخ</th><th>الاسم</th><th>البريد</th><th>الدورة</th></tr>
                    ${db.reservations.map(r => `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email)}</td><td>${escapeHtml(r.course)}</td></tr>`).join('')}
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

    toggleAdminDrawer() { 
        document.getElementById('admin-drawer')?.classList.toggle('open'); 
    },

    switchAdminTab(id, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
        btn?.classList.add('active');
    },

    /**
     * إدارة تسجيل الدخول والخروج مع غلق لوحة التحكم ولوحة الذكاء الإداري فوراً عند الخروج
     */
    toggleAdminAuth() {
        if (this.isAdminLoggedIn) {
            // تنفيذ تسجيل الخروج ومسح الجلسة
            this.isAdminLoggedIn = false;
            const contentBody = document.getElementById('admin-content-body');
            if (contentBody) contentBody.style.display = 'none';
            
            const authBtn = document.getElementById('auth-btn');
            if (authBtn) authBtn.innerText = '🔒 تسجيل الدخول';
            
            // إغلاق لوحة التحكم الجانبية فوراً
            const drawer = document.getElementById('admin-drawer');
            if (drawer) drawer.classList.remove('open');

            // إغلاق لوحة الذكاء الاصطناعي الإداري إذا كانت مفتوحة
            const geminiBox = document.getElementById('gemini-admin-box');
            if (geminiBox) geminiBox.style.display = 'none';

            alert('🔒 تم تسجيل الخروج وإغلاق لوحة التحكم بأمان.');
            return;
        }

        const p = prompt('أدخل كلمة المرور للإدارة:');
        const correctPass = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_PASS) || "Ahmed_Admin_2026";
        
        if (p === correctPass) {
            this.isAdminLoggedIn = true; // يتم تخزينها تلقائياً في sessionStorage
            const contentBody = document.getElementById('admin-content-body');
            if (contentBody) contentBody.style.display = 'block';
            
            const authBtn = document.getElementById('auth-btn');
            if (authBtn) authBtn.innerText = '🔓 تسجيل الخروج';
            
            this.renderAll();
            alert('🟢 أهلاً بك يا أحمد، تم تسجيل الدخول بنجاح!');
        } else if (p !== null) {
            alert('❌ كلمة المرور خاطئة!');
        }
    }
};

    openModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.style.display = 'flex';
    },

    closeModal(modalId) {
        const m = document.getElementById(modalId);
        if (m) m.style.display = 'none';
    }
};

/**
 * دوال لوحة التحكم الإضافية (المفاتيح، الأمان، والتصاريح)
 */
App.saveApiKeys = async function() {
    if (!this.isAdminLoggedIn) return alert("⚠️ يجب تسجيل الدخول كمسؤول أولاً.");
    const adminKeys = document.getElementById('admin-ai-keys-input')?.value || '';
    const hudaKeys = document.getElementById('huda-ai-keys-input')?.value || '';
    
    try {
        const res = await fetch('/api/index?action=data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'saveSection', 
                section: 'aiKeys', 
                data: { adminKeys, hudaKeys, updatedAt: new Date().toISOString() } 
            })
        });
        if (res.ok) {
            alert('✅ تم حفظ وتحديث مفاتيح الـ API في الخلفية بنجاح!');
        } else {
            alert('❌ فشل حفظ المفاتيح في الخادم.');
        }
    } catch (e) {
        alert('❌ حدث خطأ في الاتصال بالخادم.');
    }
};

App.changeAdminPassword = async function() {
    if (!this.isAdminLoggedIn) return alert("⚠️ يجب تسجيل الدخول كمسؤول أولاً.");
    const currentPass = document.getElementById('current-admin-pass')?.value || '';
    const newPass = document.getElementById('new-admin-pass')?.value || '';
    
    if (!currentPass || !newPass) {
        return alert('⚠️ يرجى إدخال كلمة المرور الحالية والجديدة.');
    }

    try {
        const res = await fetch('/api/index?action=data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'changePassword', currentPass, newPass })
        });
        if (res.ok) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_PASS, newPass);
            alert('🔒 تم تحديث كلمة المرور وحفظها بنجاح!');
            document.getElementById('current-admin-pass').value = '';
            document.getElementById('new-admin-pass').value = '';
        } else {
            alert('❌ كلمة المرور الحالية غير صحيحة أو حدث خطأ.');
        }
    } catch (e) {
        // تحديث محلي احتياطي للتأمين
        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_PASS, newPass);
        alert('🔒 تم تحديث كلمة المرور محلياً بنجاح!');
    }
};

App.generateTempPasscode = async function() {
    if (!this.isAdminLoggedIn) return alert("⚠️ يجب تسجيل الدخول كمسؤول أولاً.");
    try {
        const res = await fetch('/api/index?action=issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ certificateId: "general_pass", recipientEmail: "admin@temp.com", validMinutes: 1440 })
        });
        const data = await res.json();
        if (res.ok && data.code) {
            alert(`⚡ تم توليد الكود بنجاح: ${data.code}`);
            const list = document.getElementById('temp-tokens-list');
            if (list) {
                list.innerHTML += `<div style="background:#f1f5f9; padding:8px; margin-top:5px; border-radius:6px; font-weight:bold;">🔑 الكود: ${escapeHtml(data.code)} (صالح لـ 24 ساعة)</div>`;
            }
        } else {
            // توليد كود محلي بديل في حال عدم تفعيل نقطة الإصدار
            const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            alert(`⚡ تم توليد الكود محلياً: ${randomCode}`);
            const list = document.getElementById('temp-tokens-list');
            if (list) {
                list.innerHTML += `<div style="background:#f1f5f9; padding:8px; margin-top:5px; border-radius:6px; font-weight:bold;">🔑 الكود: ${randomCode}</div>`;
            }
        }
    } catch (e) {
        alert('❌ خطأ في الاتصال بالخادم.');
    }
};

// تهيئة التطبيق عند اكتمال تحميل الصفحة
window.onload = () => App.init();
