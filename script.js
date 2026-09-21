/**
 * script.js - الملف التشغيلي الأساسي للخدمات والموقع (محدث ومنظم)
 */
const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    FIREBASE_URL: "",
    STORAGE_KEYS: { 
        UNLOCKED_CERTS: "ahmed_unlocked_certs_v8",
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
    volunteer: []
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

    static getAdminPassword() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_PASS) || "Ahmed_Admin_2026";
    }

    static setAdminPassword(newPass) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_PASS, newPass);
    }

    static async getTempTokens() {
        try {
            const dbUrl = Store.sanitizeUrl(localStorage.getItem('db_passwords_url'));
            if (dbUrl) {
                const res = await fetch(dbUrl);
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            }
        } catch(e) {}
        try {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEMP_TOKENS) || '[]');
        } catch(err) { return []; }
    }

    static async saveTempTokens(tokens) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TEMP_TOKENS, JSON.stringify(tokens));
        try {
            const dbUrl = Store.sanitizeUrl(localStorage.getItem('db_passwords_url'));
            if (dbUrl) {
                await fetch(dbUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tokens)
                });
            }
        } catch(e) {}
    }

    static async getKnowledge() {
        try {
            const rawUrl = localStorage.getItem('db_website_url') || CONFIG.FIREBASE_URL;
            const dbUrl = Store.sanitizeUrl(rawUrl);
            if (dbUrl) {
                const response = await fetch(dbUrl);
                const parsed = await response.json();
                if (parsed) {
                    return {
                        personalInfo: { ...DEFAULT_KNOWLEDGE_BASE.personalInfo, ...(parsed.personalInfo || {}) },
                        certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
                        experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
                        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                        volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer : []
                    };
                }
            }
        } catch (e) {
            console.warn("⚠️ لم يتم الاتصال بقاعدة البيانات السحابية، جاري العمل على التخزين المحلي.");
        }
        const localFallback = localStorage.getItem('ahmed_knowledge_base_fallback');
        return localFallback ? JSON.parse(localFallback) : DEFAULT_KNOWLEDGE_BASE;
    }

    static async saveKnowledge(data) {
        localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(data));
        try {
            const rawUrl = localStorage.getItem('db_website_url') || CONFIG.FIREBASE_URL;
            const dbUrl = Store.sanitizeUrl(rawUrl);
            if (dbUrl) {
                const res = await fetch(dbUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    await App.renderAll();
                    return true;
                }
            }
        } catch (e) {
            console.warn("⚠️ تم الحفظ محلياً فقط وتعذر الاتصال بالسحابة.");
        }
        await App.renderAll();
        return true;
    }

    static getUnlockedCerts() {
        try {
            const certData = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS) || '{}');
            const now = Date.now();
            const validCerts = [];
            Object.keys(certData).forEach(certId => {
                if (certData[certId] > now) validCerts.push(certId);
            });
            return validCerts;
        } catch(e) { return []; }
    }

    static unlockCert(certId, durationMinutes = 60) {
        try {
            const certData = JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS) || '{}');
            const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
            certData[certId] = expiresAt;
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(certData));
            App.renderAll();
        } catch(e) {}
    }
}

const App = {
    isAdminLoggedIn: false,
    cachedDb: null,
    selectedCert: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        this.renderAll();
        this.populateWaSelect();
        this.populateTempCertSelect();
        this.updateSyncStatusUI();
        setInterval(() => this.checkExpirations(), 10000);
    },

    checkExpirations() {
        this.renderCertificates(this.cachedDb);
    },

    async renderAll() {
        this.cachedDb = await Store.getKnowledge();
        const db = this.cachedDb;
        this.renderCertificates(db);
        this.renderExperiences(db);
        this.renderSkills(db);
        this.renderVolunteer(db);
        if (this.isAdminLoggedIn) {
            this.renderAdminLists(db);
            this.renderTempTokensList();
        }
    },

    fixText(txt) {
        return (window.HudaEngine && typeof window.HudaEngine.cleanText === 'function') ? window.HudaEngine.cleanText(txt) : txt;
    },

    renderCertificates(db) {
        const container = document.getElementById('certificates-container');
        if (!container) return;
        const certs = db.certificates || [];
        const unlocked = Store.getUnlockedCerts();

        if (!certs.length) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">لا توجد شهادات مضافة حالياً.</p>`;
            return;
        }

        // التعديل: إضافة زر فتح وعرض الصورة (Lightbox) بدلاً من النص فقط
        container.innerHTML = certs.map(c => {
            const isUnlocked = unlocked.includes(c.id);
            const title = this.fixText(c.title);
            const issuer = this.fixText(c.issuer);
            return `
                <div class="cert-item ${isUnlocked ? 'unlocked' : ''}">
                    <h4>${title}</h4>
                    <p>📌 ${issuer}</p>
                    <div style="margin-top: 12px;">
                        ${isUnlocked ? 
                            `<div style="display: flex; flex-direction: column; gap: 8px;">
                                <span style="color:var(--primary-color); font-weight:bold;">🟢 تم فتح المعاينة (مؤقت)</span>
                                ${c.imageUrl ? `<button class="btn-primary" style="background: #3b82f6;" onclick="App.viewCertImage('${c.imageUrl}')">👁️ عرض المستند الأصلي</button>` : `<span style="font-size:0.85rem; color:var(--text-muted);">لا توجد صورة متوفرة لعرضها</span>`}
                            </div>` :
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
        const list = db.experiences || [];
        if (!list.length) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">لا توجد خبرات مضافة حالياً.</p>`;
            return;
        }
        container.innerHTML = list.map(e => `
            <div style="background:var(--bg-subtle); padding:12px; margin-bottom:10px; border-radius:8px;">
                <h4>${e.role}</h4>
                <small>${this.fixText(e.company)} (${e.period})</small>
                <p style="margin-top:6px; font-size:0.9rem;">${e.desc || ''}</p>
            </div>
        `).join('');
    },

    renderSkills(db) {
        const container = document.getElementById('skills-container');
        if (!container) return;
        const list = db.skills || [];
        if (!list.length) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">لا توجد مهارات مضافة حالياً.</p>`;
            return;
        }
        container.innerHTML = list.map(s => `<span style="display:inline-block; background:var(--bg-subtle); padding:6px 12px; margin:4px; border-radius:15px; font-size:0.9rem;">${s.name} (${s.level})</span>`).join('');
    },

    renderVolunteer(db) {
        const container = document.getElementById('volunteer-container');
        if (!container) return;
        const list = db.volunteer || [];
        if (!list.length) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">لا توجد أنشطة تطوعية مضافة حالياً.</p>`;
            return;
        }
        container.innerHTML = list.map(v => `<div style="padding:8px; border-bottom:1px solid var(--border-color);"><strong>${v.role}</strong> - ${v.org} (${v.period})</div>`).join('');
    },

    toggleAdminDrawer() {
        const drawer = document.getElementById('admin-drawer');
        if (drawer) drawer.classList.toggle('open');
    },

    switchAdminTab(tabId, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
        if (btn) btn.classList.add('active');
    },

toggleAdminAuth() {
    // 1. حالة تسجيل الخروج
    if (this.isAdminLoggedIn) {
        this.isAdminLoggedIn = false;
        const contentBody = document.getElementById('admin-content-body');
        const authBtn = document.getElementById('auth-btn');
        if (contentBody) contentBody.style.display = 'none';
        if (authBtn) authBtn.innerText = '🔒 تسجيل الدخول';
        
        const geminiBox = document.getElementById('gemini-admin-box');
        if (geminiBox) geminiBox.style.display = 'none';

        const drawer = document.getElementById('admin-drawer');
        if (drawer) drawer.classList.remove('open');
        alert("🔒 تم تسجيل الخروج بنجاح.");
        return;
    }

    // 2. حالة تسجيل الدخول
    const pass = prompt('كلمة مرور لوحة التحكم:');
    
    // التحقق من صحة كلمة المرور (مع التأكد أن القيمة ليست فارغة/إلغاء)
    if (pass && pass === Store.getAdminPassword()) {
        this.isAdminLoggedIn = true;
        const contentBody = document.getElementById('admin-content-body');
        const authBtn = document.getElementById('auth-btn');
        if (contentBody) contentBody.style.display = 'block';
        if (authBtn) authBtn.innerText = '🔓 تسجيل الخروج';
        
        // استدعاء الوظائف السابقة دون أي حذف
        this.renderAdminLists(this.cachedDb);
        this.loadAdminSettings();
        this.renderTempTokensList();
        
        alert("🔓 تم تسجيل الدخول بنجاح!");
    } else {
        // إذا كانت كلمة المرور خاطئة (وليس إلغاء للأمر)
        if (pass !== null) {
            alert("❌ كلمة المرور غير صحيحة!");
        }
        // إغلاق لوحة التحكم تلقائياً لمنع التأثير على شاشة الموقع عند إدخال خاطئ أو إلغاء
        const drawer = document.getElementById('admin-drawer');
        if (drawer) drawer.classList.remove('open');
    }
},
    saveApiKeys() {
        const adminKeys = document.getElementById('admin-ai-keys-input')?.value.trim();
        const hudaKeys = document.getElementById('huda-ai-keys-input')?.value.trim();
        if (adminKeys !== undefined) localStorage.setItem('admin_ai_keys', adminKeys);
        if (hudaKeys !== undefined) localStorage.setItem('huda_ai_keys', hudaKeys);
        alert("✅ تم حفظ جميع المفاتيح السرية بنجاح!");
    },

    async testApiKeys() {
        const adminKeysStr = document.getElementById('admin-ai-keys-input')?.value.trim() || localStorage.getItem('admin_ai_keys') || '';
        const hudaKeysStr = document.getElementById('huda-ai-keys-input')?.value.trim() || localStorage.getItem('huda_ai_keys') || '';
        
        const parseKeys = (str) => str.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
        const adminKeys = parseKeys(adminKeysStr);
        const hudaKeys = parseKeys(hudaKeysStr);

        if (!adminKeys.length && !hudaKeys.length) {
            alert("⚠️ لا توجد مفاتيح مدخلة أو مخزنة لفحصها!");
            return;
        }

        const verifyKey = async (key) => {
            try {
                const res = await fetch("https://api.groq.com/openai/v1/models", {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${key}` }
                });
                if (res.ok) return "نشط وسليم ✅";
                if (res.status === 401) return "غير صالح / مرفوض (401) ❌";
                if (res.status === 429) return "تجاوز حد الاستخدام (Rate Limit 429) ⚠️";
                return `خطأ في الاستجابة (${res.status}) ❌`;
            } catch (e) {
                return "تعذر الاتصال بالشبكة 🌐";
            }
        };

        let report = "🔍 نتائج فحص مفاتيح API عبر خوادم Groq:\n\n";

        if (adminKeys.length) {
            report += "🤖 مفاتيح الذكاء الإداري (Admin / Gemini):\n";
            for (let i = 0; i < adminKeys.length; i++) {
                const status = await verifyKey(adminKeys[i]);
                report += `  • مفتاح [${i + 1}]: ${status}\n`;
            }
            report += "\n";
        }

        if (hudaKeys.length) {
            report += "👩‍💼 مفاتيح هدى (Huda AI):\n";
            for (let i = 0; i < hudaKeys.length; i++) {
                const status = await verifyKey(hudaKeys[i]);
                report += `  • مفتاح [${i + 1}]: ${status}\n`;
            }
        }

        alert(report);
    },

    saveDbConnections() {
        const dbWeb = document.getElementById('db-website-url')?.value.trim() || '';
        const dbHuda = document.getElementById('db-huda-url')?.value.trim() || '';
        const dbAi = document.getElementById('db-ai-url')?.value.trim() || '';
        const dbPass = document.getElementById('db-passwords-url')?.value.trim() || '';

        localStorage.setItem('db_website_url', dbWeb);
        localStorage.setItem('db_huda_url', dbHuda);
        localStorage.setItem('db_ai_url', dbAi);
        localStorage.setItem('db_passwords_url', dbPass);

        this.updateSyncStatusUI();
        alert("✅ تم حفظ وتحديث رابط القواعد الأربع بنجاح!");
    },

    async testDbConnections() {
        const dbs = [
            { name: "قاعدة بيانات الموقع", key: "db_website_url" },
            { name: "قاعدة سكرتيرة هدى", key: "db_huda_url" },
            { name: "قاعدة الذكاء الاصطناعي", key: "db_ai_url" },
            { name: "قاعدة التصاريح والكلمات", key: "db_passwords_url" }
        ];

        let report = "🔍 نتيجة الفحص الحي والفعلي للقواعد الأربع:\n\n";

        for (const db of dbs) {
            const rawUrl = localStorage.getItem(db.key) || '';
            const url = Store.sanitizeUrl(rawUrl);

            if (!url) {
                report += `⚪ ${db.name}: غير مضافة (يعمل محلياً)\n`;
                continue;
            }

            try {
                const res = await fetch(url, { method: 'GET' });
                if (res.ok) {
                    report += `✅ ${db.name}: الاتصال متصل وسليم (200 OK)\n`;
                } else {
                    report += `⚠️ ${db.name}: يوجد خطأ في الاستجابة (رمز: ${res.status})\n`;
                }
            } catch (e) {
                report += `❌ ${db.name}: تعذر الوصول (تحقق من الإنترنت أو الرابط)\n`;
            }
        }

        alert(report);
    },

    updateSyncStatusUI() {
        const statusEl = document.getElementById('cloud-sync-status');
        if (!statusEl) return;

        const dbKeys = ['db_website_url', 'db_huda_url', 'db_ai_url', 'db_passwords_url'];
        const activeCount = dbKeys.filter(key => (localStorage.getItem(key) || '').trim() !== '').length;

        if (activeCount === 4) {
            statusEl.innerText = "حالة المزامنة: مكتملة لجميع القواعد السحابية (4/4) ✅";
            statusEl.style.color = "#059669";
        } else if (activeCount > 0) {
            statusEl.innerText = `حالة المزامنة: الربط جزئي (${activeCount}/4 قواعد مضافة) ⚠️`;
            statusEl.style.color = "#d97706";
        } else {
            statusEl.innerText = "حالة المزامنة: وضع محلي بالكامل (على الجهاز فقط) ⚠️";
            statusEl.style.color = "#6b7280";
        }
    },

    changeAdminPassword() {
        const currentPass = document.getElementById('current-admin-pass')?.value.trim();
        const newPass = document.getElementById('new-admin-pass')?.value.trim();
        const confirmPass = document.getElementById('confirm-admin-pass')?.value.trim();

        if (currentPass !== Store.getAdminPassword()) return alert("❌ كلمة المرور الحالية غير صحيحة!");
        if (!newPass || newPass.length < 4) return alert("⚠️ أدخل كلمة مرور قوية.");
        if (newPass !== confirmPass) return alert("❌ كلمتا المرور غير متطابقتين!");

        Store.setAdminPassword(newPass);
        alert("🔒 تم تغيير كلمة مرور لوحة التحكم بنجاح!");

        if (document.getElementById('current-admin-pass')) document.getElementById('current-admin-pass').value = '';
        if (document.getElementById('new-admin-pass')) document.getElementById('new-admin-pass').value = '';
        if (document.getElementById('confirm-admin-pass')) document.getElementById('confirm-admin-pass').value = '';
    },

    loadAdminSettings() {
        try {
            const adminKeysInput = document.getElementById('admin-ai-keys-input');
            const hudaKeysInput = document.getElementById('huda-ai-keys-input');
            if (adminKeysInput) adminKeysInput.value = localStorage.getItem('admin_ai_keys') || '';
            if (hudaKeysInput) hudaKeysInput.value = localStorage.getItem('huda_ai_keys') || '';

            const dbWeb = document.getElementById('db-website-url');
            const dbHuda = document.getElementById('db-huda-url');
            const dbAi = document.getElementById('db-ai-url');
            const dbPass = document.getElementById('db-passwords-url');
            if (dbWeb) dbWeb.value = localStorage.getItem('db_website_url') || '';
            if (dbHuda) dbHuda.value = localStorage.getItem('db_huda_url') || '';
            if (dbAi) dbAi.value = localStorage.getItem('db_ai_url') || '';
            if (dbPass) dbPass.value = localStorage.getItem('db_passwords_url') || '';
        } catch (e) {}
    },

    renderAdminLists(db) {
        const renderList = (id, key, titleField) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = (db[key] || []).map((item, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
                        <span style="font-size:0.9rem; font-weight:600;">${item[titleField]}</span>
                        <div style="display:flex; gap:6px;">
                            <button onclick="App.editItem('${key}', ${i})" style="padding:4px 8px; background:#3b82f6; color:#fff; border-radius:4px; font-size:0.8rem; border:none; cursor:pointer;">✏️ تعديل</button>
                            <button onclick="App.deleteItem('${key}', ${i})" style="padding:4px 8px; background:#ef4444; color:#fff; border-radius:4px; font-size:0.8rem; border:none; cursor:pointer;">🗑️ حذف</button>
                        </div>
                    </div>
                `).join('');
            }
        };
        renderList('admin-certs-list', 'certificates', 'title');
        renderList('admin-exp-list', 'experiences', 'role');
        renderList('admin-skills-list', 'skills', 'name');
        renderList('admin-vol-list', 'volunteer', 'role');
    },

    async deleteItem(key, index) {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        this.cachedDb[key].splice(index, 1);
        await Store.saveKnowledge(this.cachedDb);
    },

    editItem(type, index) {
        const item = this.cachedDb[type][index];
        if (!item) return;

        if (type === 'certificates') {
            document.getElementById('certEditIndex').value = index;
            document.getElementById('certTitle').value = item.title || '';
            document.getElementById('certIssuer').value = item.issuer || '';
            document.getElementById('certCategory').value = item.category || '';
            document.getElementById('certImage').value = item.imageUrl || '';
            this.switchAdminTab('tab-certs', document.querySelector('.admin-tab'));
        } else if (type === 'experiences') {
            document.getElementById('expEditIndex').value = index;
            document.getElementById('expRole').value = item.role || '';
            document.getElementById('expCompany').value = item.company || '';
            document.getElementById('expPeriod').value = item.period || '';
            document.getElementById('expDesc').value = item.desc || '';
            this.switchAdminTab('tab-exp', document.querySelectorAll('.admin-tab')[1]);
        } else if (type === 'skills') {
            document.getElementById('skillEditIndex').value = index;
            document.getElementById('skillName').value = item.name || '';
            document.getElementById('skillCategory').value = item.category || '';
            document.getElementById('skillLevel').value = item.level || 'خبير';
            this.switchAdminTab('tab-skills', document.querySelectorAll('.admin-tab')[2]);
        } else if (type === 'volunteer') {
            document.getElementById('volEditIndex').value = index;
            document.getElementById('volRole').value = item.role || '';
            document.getElementById('volOrg').value = item.org || '';
            document.getElementById('volPeriod').value = item.period || '';
            this.switchAdminTab('tab-vol', document.querySelectorAll('.admin-tab')[3]);
        }
    },

    async saveItemGeneric(type, newItem, indexId, successMsg) {
        const index = parseInt(document.getElementById(indexId).value);
        if (!this.cachedDb[type]) this.cachedDb[type] = [];
        if (index >= 0) this.cachedDb[type][index] = newItem;
        else this.cachedDb[type].push(newItem);

        if (await Store.saveKnowledge(this.cachedDb)) {
            alert(successMsg);
            this.resetForm(type);
        }
    },

    saveCertificate() {
        const title = document.getElementById('certTitle').value.trim();
        if (!title) return alert("الرجاء إدخال اسم الشهادة.");
        this.saveItemGeneric('certificates', {
            id: 'cert-' + Date.now(),
            title: title,
            issuer: document.getElementById('certIssuer').value,
            category: document.getElementById('certCategory').value,
            imageUrl: document.getElementById('certImage').value
        }, 'certEditIndex', "✅ تم حفظ وتحديث الشهادة!");
    },

    saveExperience() {
        const role = document.getElementById('expRole').value.trim();
        if (!role) return alert("الرجاء إدخال المسمى الوظيفي.");
        this.saveItemGeneric('experiences', {
            role: role,
            company: document.getElementById('expCompany').value,
            period: document.getElementById('expPeriod').value,
            desc: document.getElementById('expDesc').value
        }, 'expEditIndex', "✅ تم حفظ الخبرة!");
    },

    saveSkill() {
        const name = document.getElementById('skillName').value.trim();
        if (!name) return alert("الرجاء إدخال اسم المهارة.");
        this.saveItemGeneric('skills', {
            name: name,
            category: document.getElementById('skillCategory').value,
            level: document.getElementById('skillLevel').value
        }, 'skillEditIndex', "✅ تم حفظ المهارة!");
    },

    saveVolunteer() {
        const role = document.getElementById('volRole').value.trim();
        if (!role) return alert("الرجاء إدخال دور التطوع.");
        this.saveItemGeneric('volunteer', {
            role: role,
            org: document.getElementById('volOrg').value,
            period: document.getElementById('volPeriod').value
        }, 'volEditIndex', "✅ تم حفظ التطوع!");
    },

    resetForm(type) {
        if (type === 'certificates' || type === 'cert') {
            document.getElementById('certEditIndex').value = "-1";
            document.getElementById('certTitle').value = "";
            document.getElementById('certIssuer').value = "";
            document.getElementById('certCategory').value = "";
            document.getElementById('certImage').value = "";
        } else if (type === 'experiences' || type === 'exp') {
            document.getElementById('expEditIndex').value = "-1";
            document.getElementById('expRole').value = "";
            document.getElementById('expCompany').value = "";
            document.getElementById('expPeriod').value = "";
            document.getElementById('expDesc').value = "";
        } else if (type === 'skills' || type === 'skill') {
            document.getElementById('skillEditIndex').value = "-1";
            document.getElementById('skillName').value = "";
            document.getElementById('skillCategory').value = "";
        } else if (type === 'volunteer' || type === 'vol') {
            document.getElementById('volEditIndex').value = "-1";
            document.getElementById('volRole').value = "";
            document.getElementById('volOrg').value = "";
            document.getElementById('volPeriod').value = "";
        }
    },

    openModal(id) { document.getElementById(id).style.display = 'flex'; },
    closeModal(id) { document.getElementById(id).style.display = 'none'; },
    openWaModal() { this.openModal('wa-modal'); },

    // الدالة المضافة لعرض الصور (Lightbox)
    viewCertImage(url) {
        const img = document.getElementById('certViewerImage');
        if (img) img.src = url;
        this.openModal('imageViewerModal');
    },

    populateWaSelect() {
        const container = document.getElementById('waCertListContainer');
        if (container && this.cachedDb) {
            const certs = this.cachedDb.certificates || [];
            if (!certs.length) {
                container.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted);">لا توجد شهادات متاحة حالياً.</p>';
            } else {
                container.innerHTML = certs.map(c => `
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-weight:normal; cursor:pointer;">
                        <input type="checkbox" class="wa-cert-cb" value="${c.title}" style="width:auto; margin:0;" onchange="App.syncWaSelectAllState()">
                        <span>${c.title}</span>
                    </label>
                `).join('');
            }
        }
    },

    toggleWaSelectAll(masterCb) {
        document.querySelectorAll('.wa-cert-cb').forEach(cb => cb.checked = masterCb.checked);
    },

    syncWaSelectAllState() {
        const all = document.querySelectorAll('.wa-cert-cb');
        const checked = document.querySelectorAll('.wa-cert-cb:checked');
        const master = document.getElementById('waSelectAll');
        if (master) master.checked = (all.length > 0 && all.length === checked.length);
    },

    sendWaCertRequest() {
        const checked = Array.from(document.querySelectorAll('.wa-cert-cb:checked')).map(cb => cb.value);
        if (!checked.length) {
            return alert("⚠️ الرجاء تحديد شهادة واحدة على الأقل أو اختيار تحديد الكل!");
        }
        
        let text = "";
        const totalCerts = (this.cachedDb.certificates || []).length;

        if (checked.length === totalCerts) {
            text = "طلب تصريح معاينة: لجميع الشهادات الموثقة";
        } else if (checked.length === 1) {
            text = "طلب تصريح معاينة للشهادة: " + checked[0];
        } else {
            text = "طلب تصريح معاينة للشهادات التالية:\n" + checked.map((t, idx) => `${idx + 1}. ${t}`).join('\n');
        }
        window.location.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    },

    populateTempCertSelect() {
        const sel = document.getElementById('tempCertSelect');
        if (sel && this.cachedDb) {
            sel.innerHTML = `<option value="ALL">🌟 كافة الشهادات</option>` + (this.cachedDb.certificates || []).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
    },

    async generateTempPasscode() {
        const certSelect = document.getElementById('tempCertSelect');
        const durationSelect = document.getElementById('tempDurationSelect');
        const certId = certSelect ? certSelect.value : 'ALL';
        const minutes = parseInt(durationSelect ? durationSelect.value : '60');
        const randomCode = 'TMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const tokens = await Store.getTempTokens();
        tokens.unshift({
            code: randomCode,
            certId: certId,
            minutes: minutes,
            createdAt: new Date().toLocaleString('ar-YE'),
            expiresAt: Date.now() + (minutes * 60 * 1000)
        });

        await Store.saveTempTokens(tokens);
        this.renderTempTokensList();
        alert(`✅ تم التوليد بنجاح:\nالرمز: ${randomCode}\nالمدة: ${minutes} دقيقة`);
    },

    async renderTempTokensList() {
        const container = document.getElementById('temp-tokens-list');
        if (!container) return;
        const tokens = await Store.getTempTokens();
        const now = Date.now();

        if (tokens.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">لا توجد كلمات مرور مؤقتة حالياً.</p>';
            return;
        }

        container.innerHTML = tokens.map((t, idx) => {
            const isExpired = now > t.expiresAt;
            const usageStatus = t.isUsed 
                ? `<span style="color:#2563eb; font-weight:bold;">✅ تم استخدامه (${t.usedAt || 'وقت غير محدد'})</span>` 
                : `<span style="color:#d97706;">⏳ لم يُستخدم بعد</span>`;

            let certLabel = 'جميع الشهادات';
            if (Array.isArray(t.certId)) {
                certLabel = `${t.certId.length} شهادة محدودة`;
            } else if (t.certId && t.certId !== 'ALL') {
                certLabel = t.certId;
            }

            return `
                <div style="background:${isExpired ? '#fee2e2' : '#ecfdf5'}; border:1px solid ${isExpired ? '#fca5a5' : '#6ee7b7'}; padding:10px; border-radius:8px; margin-bottom:8px; font-size:0.85rem;">
                    <div style="display:flex; justify-content:space-between; font-weight:bold;">
                        <span>🔑 ${t.code}</span>
                        <span style="color:${isExpired ? '#dc2626' : '#059669'};">${isExpired ? 'مُنتهية' : 'نشطة'}</span>
                    </div>
                    <div style="margin-top:4px;">الشهادة: <strong>${certLabel}</strong></div>
                    <div style="margin-top:4px;">الحالة: ${usageStatus}</div>
                    <button onclick="App.deleteTempToken(${idx})" style="margin-top:6px; background:#ef4444; color:#fff; padding:3px 8px; border-radius:4px; font-size:0.75rem; border:none; cursor:pointer;">🗑️ حذف</button>
                </div>
            `;
        }).join('');
    },

    async deleteTempToken(index) {
        const tokens = await Store.getTempTokens();
        tokens.splice(index, 1);
        await Store.saveTempTokens(tokens);
        this.renderTempTokensList();
    },

    openCertPassModal(id) {
        this.selectedCert = id;
        this.openModal('accessModal');
    },

    async validateAccessCode() {
        const codeInput = document.getElementById('passcode');
        const code = codeInput ? codeInput.value.trim() : '';
        const now = Date.now();

        if (!code) return alert("الرجاء إدخال كود التصريح.");
        const tokens = await Store.getTempTokens();
        const matchedToken = tokens.find(t => t.code === code);

        if (!matchedToken) return alert("❌ كود التصريح غير صحيح.");

        let myDeviceId = localStorage.getItem('my_device_id');
        if (!myDeviceId) {
            myDeviceId = 'DEV-' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('my_device_id', myDeviceId);
        }

        if (matchedToken.isUsed && matchedToken.usedByDevice !== myDeviceId) {
            return alert("⚠️ هذا الكود تم استخدامه من قبل جهاز آخر!");
        }

        if (!matchedToken.isUsed) {
            matchedToken.isUsed = true;
            matchedToken.usedByDevice = myDeviceId;
            matchedToken.usedAt = new Date().toLocaleString('ar-YE');
            matchedToken.expiresAt = now + (matchedToken.minutes * 60 * 1000);
            await Store.saveTempTokens(tokens);
        }

        if (now >= matchedToken.expiresAt) {
            return alert("❌ انتهت صلاحية الوقت المتاح لهذا الكود!");
        }

        const remainingMinutes = Math.ceil((matchedToken.expiresAt - now) / (1000 * 60));

        if (matchedToken.certId === 'ALL') {
            (this.cachedDb.certificates || []).forEach(c => Store.unlockCert(c.id, remainingMinutes));
        } else if (Array.isArray(matchedToken.certId)) {
            matchedToken.certId.forEach(id => Store.unlockCert(id, remainingMinutes));
        } else {
            Store.unlockCert(matchedToken.certId, remainingMinutes);
        }

        this.closeModal('accessModal');
        if (codeInput) codeInput.value = '';
        alert(`🔓 تم الفتح بنجاح! الوقت المتبقي لديك: ${remainingMinutes} دقيقة.`);
    }
};

// ק قاموس الترجمات (أضف نصوص موقعك هنا)
const translations = {
    ar: {
        heroTitle: "مرحباً بك في المنصة",
        heroSubtitle: "دورة اللغة الإنجليزية والأنظمة المالية",
        navHome: "الرئيسية",
        navCourses: "الدورات"
    },
    en: {
        heroTitle: "Welcome to the Platform",
        heroSubtitle: "English Language & Financial Systems Course",
        navHome: "Home",
        navCourses: "Courses"
    },
    fr: {
        heroTitle: "Bienvenue sur la plateforme",
        heroSubtitle: "Cours d'anglais et de systèmes financiers",
        navHome: "Accueil",
        navCourses: "Cours"
    }
};
const translations = {
    ar: {
        heroName: "أحمد عادل ناجي ذياب",
        heroTitle: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        contactLocation: "📍 جعار - خنفر - أبين - اليمن"
    },
    en: {
        heroName: "Ahmed Adel Naji Thiab",
        heroTitle: "Accounting & Financial Systems Trainer | Certified Trainer (ICDL & English)",
        contactLocation: "📍 Ja'ar - Khanfar - Abyan - Yemen"
    },
    fr: {
        heroName: "Ahmed Adel Naji Thiab",
        heroTitle: "Formateur en systèmes comptables et financiers | Formateur certifié (ICDL & Anglais)",
        contactLocation: "📍 Ja'ar - Khanfar - Abyan - Yémen"
    }
};

// دالة تغيير اللغة
function switchLanguage(lang) {
    // 1. تغيير اتجاه الصفحة وقيمة اللغة
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    // 2. تحديث كافة النصوص التي تحتوي على data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // 3. حفظ تفضيل المستخدم في المتصفح
    localStorage.setItem('selectedLanguage', lang);
}

// تشغيل اللغة المحفوظة تلقائياً عند فتح الموقع
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLanguage') || 'ar';
    const langSelect = document.getElementById('langSelect');
    
    if (langSelect) {
        langSelect.value = savedLang;
    }
    switchLanguage(savedLang);
});
window.App = App;
window.Store = Store;
document.addEventListener('DOMContentLoaded', () => App.init());
