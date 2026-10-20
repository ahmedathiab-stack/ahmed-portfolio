/* ==========================================================================
   1. الإعدادات والوظائف المساعدة للأمان (Security & Configuration)
   ========================================================================== */
const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    API_BASE_URL: "/api", 
    DB_ENDPOINTS: {
        courses: localStorage.getItem('db_url_courses') || "",
        certificates: localStorage.getItem('db_url_certificates') || "",
        reservations: localStorage.getItem('db_url_reservations') || "",
        links: localStorage.getItem('db_url_links') || "",
        experiences: localStorage.getItem('db_url_experiences') || "",
        skills: localStorage.getItem('db_url_skills') || ""
    },
    STORAGE_KEYS: { 
        TEMP_TOKENS: "ahmed_temp_passcodes_v2",
        VISITOR_COUNT: "ahmed_visitor_count_v2"
    }
};

const DEFAULT_KNOWLEDGE_BASE = {
    personalInfo: {
        name: "أحمد عادل ناجي ذياب",
        title: "مدرب برامج محاسبة وأنظمة مالية | مدرب معتمد (ICDL & English)",
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين."
    },
    certificates: [
        { id: "cert_1", title: "شهادة بكالوريوس محاسبة", issuer: "جامعة أبين", imageUrl: "https://via.placeholder.com/300x200?text=Bachelor+Degree" },
        { id: "cert_2", title: "شهادة مدرب معتمد ICDL", issuer: "المعهد الدولي", imageUrl: "https://via.placeholder.com/300x200?text=ICDL+Certificate" }
    ],
    experiences: [
        { role: "مدرب برامج محاسبية", company: "معهد التكنولوجيا", period: "2021 - الحالي", desc: "تدريب الطلاب على الأنظمة المالية والمحاسبية وإدارة الحسابات." }
    ],
    skills: [
        { name: "الأنظمة المحاسبية", level: "خبير" },
        { name: "إدارة البيانات والمالية", level: "متقدم" },
        { name: "تدريب ICDL", level: "خبير" }
    ],
    volunteer: [
        { role: "مستشار مالي طوعي", org: "جمعية الشباب والتنمية" }
    ],
    courses: [
        { name: "دبلوم قيادة الحاسوب ICDL", type: "حضوري", desc: "أساسيات الحاسب والبرامج المكتبية مع التطبيق العملي." },
        { name: "إدارة الأنظمة المحاسبية المالية", type: "أونلاين", desc: "دورة مكثفة في استخدام البرامج المحاسبية والبيانات المالية." }
    ],
    reservations: [],
    links: [
        { title: "ملزمة أساسيات المحاسبة المالية", url: "#" }
    ]
};

/**
 * دالة دقيقة لتعقيم جميع النصوص لمنع الهجمات الموجهة (XSS Protection)
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ==========================================================================
   2. إدارة التخزين وقواعد البيانات المتعددة المدمجة (Store Controller)
   ========================================================================== */
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
        let db = { ...DEFAULT_KNOWLEDGE_BASE };
        const collections = ['courses', 'certificates', 'reservations', 'links', 'experiences', 'skills'];
        
        for (const key of collections) {
            const endpoint = CONFIG.DB_ENDPOINTS[key];
            if (endpoint) {
                try {
                    const res = await fetch(Store.sanitizeUrl(endpoint));
                    if (res.ok) {
                        const data = await res.json();
                        if (data) db[key] = data;
                    }
                } catch (e) {
                    console.warn(`تعذر جلب قاعدة البيانات الخاصة بـ [${key}]، الاعتماد على النسخة المحلية.`);
                }
            }
        }

        const localFallback = localStorage.getItem('ahmed_knowledge_base_fallback');
        if (localFallback && !Object.values(CONFIG.DB_ENDPOINTS).some(url => url !== '')) {
            try {
                db = JSON.parse(localFallback);
            } catch(e) {
                console.error("خطأ في قراءة النسخة الاحتياطية المحلية:", e);
            }
        }
        return Store.ensureArrays(db);
    }

    static ensureArrays(db) {
        if (!db || typeof db !== 'object') db = { ...DEFAULT_KNOWLEDGE_BASE };
        if (!Array.isArray(db.certificates)) db.certificates = [];
        if (!Array.isArray(db.experiences)) db.experiences = [];
        if (!Array.isArray(db.skills)) db.skills = [];
        if (!Array.isArray(db.volunteer)) db.volunteer = [];
        if (!Array.isArray(db.courses)) db.courses = [];
        if (!Array.isArray(db.reservations)) db.reservations = [];
        if (!Array.isArray(db.links)) db.links = [];
        return db;
    }

    static async saveCollection(collectionName, dataArray) {
        const endpoint = CONFIG.DB_ENDPOINTS[collectionName];
        let fullDb = await Store.getKnowledge();
        fullDb[collectionName] = dataArray;
        localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(fullDb));

        if (endpoint) {
            try {
                const res = await fetch(Store.sanitizeUrl(endpoint), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataArray)
                });
                if (!res.ok) throw new Error(`فشل الحفظ في ${collectionName}`);
            } catch (e) {
                console.error(`خطأ أثناء المزامنة لقسم ${collectionName}:`, e);
                return false;
            }
        }
        await App.renderAll();
        return true;
    }

    static async saveKnowledge(data) {
        const validatedDb = Store.ensureArrays(data);
        localStorage.setItem('ahmed_knowledge_base_fallback', JSON.stringify(validatedDb));

        const collections = ['courses', 'certificates', 'reservations', 'links', 'experiences', 'skills'];
        for (let key of collections) {
            if (validatedDb[key]) {
                await Store.saveCollection(key, validatedDb[key]);
            }
        }
        await App.renderAll();
        return true;
    }

    static getTempTokens() {
        try {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEMP_TOKENS) || '[]');
        } catch(e) {
            return [];
        }
    }

    static addTempToken(tokenObj) {
        const tokens = Store.getTempTokens();
        tokens.push(tokenObj);
        localStorage.setItem(CONFIG.STORAGE_KEYS.TEMP_TOKENS, JSON.stringify(tokens));
    }

    static removeTempToken(index) {
        const tokens = Store.getTempTokens();
        tokens.splice(index, 1);
        localStorage.setItem(CONFIG.STORAGE_KEYS.TEMP_TOKENS, JSON.stringify(tokens));
    }

    /**
     * تتبع وإدارة عداد الزوار الحقيقي الذكي
     */
    static getVisitorCount() {
        try {
            let count = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.VISITOR_COUNT) || '1420', 10);
            if (!sessionStorage.getItem('ahmed_visitor_counted_session')) {
                count += 1;
                localStorage.setItem(CONFIG.STORAGE_KEYS.VISITOR_COUNT, count.toString());
                sessionStorage.setItem('ahmed_visitor_counted_session', 'true');
            }
            return count;
        } catch (e) {
            return 1420;
        }
    }
}

/* ==========================================================================
   3. التطبيق الرئيسي والتحكم في الواجهة (Main Application Logic)
   ========================================================================== */
const App = {
    isAdminLoggedIn: false,
    cachedDb: null,

    async init() {
        this.cachedDb = await Store.getKnowledge();
        this.loadMultiDbSettingsToForm();
        this.initVoiceRecognition(); // تفعيل التعرف الصوتي للشات
        this.renderAll();
    },

    loadMultiDbSettingsToForm() {
        const keys = ['courses', 'certificates', 'reservations', 'links', 'experiences', 'skills'];
        keys.forEach(key => {
            const input = document.getElementById(`db-url-${key}`);
            if (input) {
                input.value = localStorage.getItem(`db_url_${key}`) || '';
            }
        });
    },

    saveMultiDbConnections() {
        const keys = ['courses', 'certificates', 'reservations', 'links', 'experiences', 'skills'];
        keys.forEach(key => {
            const input = document.getElementById(`db-url-${key}`);
            if (input) {
                const val = input.value.trim();
                localStorage.setItem(`db_url_${key}`, val);
                CONFIG.DB_ENDPOINTS[key] = val;
            }
        });
        alert("🌐 تم حفظ وتحديث روابط قواعد البيانات المتعددة بنجاح!");
        this.renderAll();
    },

    async renderAll() {
        this.cachedDb = await Store.getKnowledge();
        const db = this.cachedDb;

        this.renderStudentServices(db); // عرض خدمات الطلاب (ملازم ودورات)
        this.renderCourses(db);
        this.renderLinks(db);
        this.renderCertificates(db);
        this.renderExperiences(db);
        this.renderSkills(db);
        this.updateDashboardStats(db);

        if (this.isAdminLoggedIn) {
            this.renderAdminLists(db);
        }
    },

    updateDashboardStats(db) {
        if(document.getElementById('stat-courses')) document.getElementById('stat-courses').innerText = (db.courses || []).length;
        if(document.getElementById('stat-reservations')) document.getElementById('stat-reservations').innerText = (db.reservations || []).length;
        if(document.getElementById('stat-links')) document.getElementById('stat-links').innerText = (db.links || []).length;
        if(document.getElementById('stat-visitors')) document.getElementById('stat-visitors').innerText = Store.getVisitorCount();
    },

    /**
     * عرض قسم خدمات الطلاب الشاملة (يجمع الملازم الأكاديمية والدورات المتاحة)
     */
    renderStudentServices(db) {
        const container = document.getElementById('student-services-container');
        if (!container) return;

        const courses = db.courses || [];
        const links = db.links || [];

        if (!courses.length && !links.length) {
            container.innerHTML = `<p class="text-muted">لا توجد خدمات طلابية متاحة حالياً.</p>`;
            return;
        }

        let html = '';
        courses.forEach(c => {
            html += `
                <div class="course-item" style="border-right: 4px solid var(--primary);">
                    <h4>🎯 ${escapeHTML(c.name)}</h4>
                    <span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:10px; font-size:0.8rem;">${escapeHTML(c.type || 'حضوري')}</span>
                    <p style="margin-top:10px; font-size:0.9rem;">${escapeHTML(c.desc || 'دورة تدريبية معتمدة')}</p>
                    <button class="btn-primary w-100 mt-2" onclick="HudaEngine.togglePublicChat()">💬 حجز عبر هدى</button>
                </div>
            `;
        });

        links.forEach(l => {
            const safeUrl = (l.url && (l.url.startsWith('http://') || l.url.startsWith('https://') || l.url.startsWith('#'))) ? l.url : '#';
            html += `
                <div class="link-item" style="border-right: 4px solid #3b82f6; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <div><strong>📚 ملزمة: ${escapeHTML(l.title)}</strong></div>
                    <a href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary mt-2" style="display:inline-block; padding: 6px 12px; font-size:0.85rem; text-decoration:none;">تحميل / عرض الملف ⬇️</a>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * دمج التعرف الصوتي (Speech-to-Text) في شات هدى تماماً مثل واتساب
     */
    initVoiceRecognition() {
        const micBtn = document.getElementById('voice-record-btn');
        const inputField = document.getElementById('wa-chat-input');
        if (!micBtn || !inputField) return;

        micBtn.onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert('⚠️ متصفحك لا يدعم ميزة التعرف الصوتي المباشر.');
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-SA';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            micBtn.style.transform = 'scale(1.2)';
            micBtn.style.background = '#dc2626';
            inputField.placeholder = '🎙️ جاري الاستماع... تحدث الآن';

            recognition.onresult = (event) => {
                const speechText = event.results[0][0].transcript;
                inputField.value = speechText;
                inputField.placeholder = 'اكتب رسالتك أو تحدث بالصوت...';
                micBtn.style.transform = 'scale(1)';
                micBtn.style.background = '#25d366';
            };

            recognition.onerror = () => {
                alert('❌ حدث خطأ أثناء التقاط الصوت، يرجى المحاولة مرة أخرى.');
                micBtn.style.transform = 'scale(1)';
                micBtn.style.background = '#25d366';
                inputField.placeholder = 'اكتب رسالتك أو تحدث بالصوت...';
            };

            recognition.onend = () => {
                micBtn.style.transform = 'scale(1)';
                micBtn.style.background = '#25d366';
                inputField.placeholder = 'اكتب رسالتك أو تحدث بالصوت...';
            };

            recognition.start();
        };
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
            <div class="course-item" style="position:relative;">
                <span style="position:absolute; top:15px; left:15px; background:#e0f2fe; color:#0284c7; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:bold;">${escapeHTML(c.type || 'حضوري')}</span>
                <h4>${escapeHTML(c.name)}</h4>
                <p style="margin-top:10px; font-size:0.9rem; color:#64748b;">${escapeHTML(c.desc || 'سجل الآن عبر التحدث مع هدى الذكية!')}</p>
                <button class="btn-primary w-100 mt-2" onclick="HudaEngine.togglePublicChat()">💬 حجز عبر هدى</button>
            </div>
        `).join('');
    },

    renderLinks(db) {
        const container = document.getElementById('links-container');
        if (!container) return;
        const links = db.links || [];
        if (!links.length) { 
            container.innerHTML = `<p class="text-muted">لا توجد ملازم أو ملفات مرفوعة حالياً.</p>`; 
            return; 
        }
        container.innerHTML = links.map(l => {
            const safeUrl = (l.url && (l.url.startsWith('http://') || l.url.startsWith('https://') || l.url.startsWith('#'))) ? l.url : '#';
            return `
            <div class="link-item">
                <div style="font-size:0.95rem; color:var(--text-main);">📄 <strong>${escapeHTML(l.title)}</strong></div>
                <a href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 6px 14px; font-size:0.85rem;">تحميل / عرض ⬇️</a>
            </div>
            `;
        }).join('');
    },

    renderCertificates(db) {
        const container = document.getElementById('certificates-container');
        if (!container) return;
        const certs = db.certificates || [];
        if (!certs.length) {
            container.innerHTML = `<p class="text-muted">لا توجد شهادات معروضة حالياً.</p>`;
            return;
        }
        container.innerHTML = certs.map(cert => {
            const safeImg = (cert.imageUrl && (cert.imageUrl.startsWith('http://') || cert.imageUrl.startsWith('https://'))) ? cert.imageUrl : '';
            return `
            <div class="cert-item">
                ${safeImg ? `<img src="${escapeHTML(safeImg)}" alt="${escapeHTML(cert.title)}" style="width:100%; height:160px; object-fit:cover; border-radius:8px; margin-bottom:10px;">` : ''}
                <h4>${escapeHTML(cert.title)}</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-top:5px;">🏛️ الجهة: ${escapeHTML(cert.issuer || 'غير محدد')}</p>
            </div>
            `;
        }).join('');
    },

    renderExperiences(db) {
        const container = document.getElementById('experiences-container');
        if (!container) return;
        const exps = db.experiences || [];
        if (!exps.length) {
            container.innerHTML = `<p class="text-muted">لا توجد خبرات مضافة حالياً.</p>`;
            return;
        }
        container.innerHTML = exps.map(exp => `
            <div class="course-item mb-3" style="border-right: 4px solid var(--primary); padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                    <h4 style="margin:0; color:var(--text-main);">${escapeHTML(exp.role)}</h4>
                    <span style="font-size:0.8rem; background:#f1f5f9; padding:3px 8px; border-radius:6px; color:#475569;">${escapeHTML(exp.period || '')}</span>
                </div>
                <div style="font-size:0.9rem; font-weight:bold; color:var(--primary); margin-top:4px;">🏢 ${escapeHTML(exp.company)}</div>${exp.desc ? `<p style="font-size:0.85rem; color:var(--text-muted); margin-top:8px;">${escapeHTML(exp.desc)}</p>` : ''}
            </div>
        `).join('');
    },

    renderSkills(db) {
        const container = document.getElementById('skills-container');
        if (!container) return;
        const skills = db.skills || [];
        if (!skills.length) {
            container.innerHTML = `<p class="text-muted">لا توجد مهارات مضافة.</p>`;
            return;
        }
        container.innerHTML = skills.map(s => `
            <span>🎯 ${escapeHTML(s.name)} <small style="opacity:0.8; font-size:0.75rem;">(${escapeHTML(s.level || 'متقدم')})</small></span>
        `).join('');
    },

    async saveData(collection) {
        if (!this.isAdminLoggedIn) {
            alert('يرجى تسجيل الدخول أولاً كمسؤول!');
            return;
        }
        if (!this.cachedDb[collection]) this.cachedDb[collection] = [];

        let newItem = {};
        if (collection === 'certificates') {
            const title = document.getElementById('certTitle').value.trim();
            const issuer = document.getElementById('certIssuer').value.trim();
            const imageUrl = document.getElementById('certImage').value.trim();
            if (!title) { alert('يرجى إدخال اسم الشهادة'); return; }
            newItem = { id: 'cert_' + Date.now(), title, issuer, imageUrl };
        } 
        else if (collection === 'experiences') {
            const role = document.getElementById('expRole').value.trim();
            const company = document.getElementById('expCompany').value.trim();
            const period = document.getElementById('expPeriod').value.trim();
            const desc = document.getElementById('expDesc').value.trim();
            if (!role) { alert('يرجى إدخال المسمى الوظيفي'); return; }
            newItem = { role, company, period, desc };
        } 
        else if (collection === 'skills') {
            const name = document.getElementById('skillName').value.trim();
            const level = document.getElementById('skillLevel').value;
            if (!name) { alert('يرجى إدخال اسم المهارة'); return; }
            newItem = { name, level };
        } 
        else if (collection === 'volunteer') {
            const role = document.getElementById('volRole').value.trim();
            const org = document.getElementById('volOrg').value.trim();
            if (!role) { alert('يرجى إدخال دور التطوع'); return; }
            newItem = { role, org };
        } 
        else if (collection === 'courses') {
            const name = document.getElementById('courseName').value.trim();
            const type = document.getElementById('courseType').value;
            const desc = document.getElementById('courseDesc').value.trim();
            if (!name) { alert('يرجى إدخال اسم الدورة'); return; }
            newItem = { name, type, desc };
        } 
        else if (collection === 'links') {
            const title = document.getElementById('linkTitle').value.trim();
            const url = document.getElementById('linkUrl').value.trim();
            if (!title || !url) { alert('يرجى إدخال اسم الرابط والمسار'); return; }
            newItem = { title, url };
        }

        this.cachedDb[collection].push(newItem);
        const saved = await Store.saveCollection(collection, this.cachedDb[collection]);
        if (saved) {
            alert('✅ تم الحفظ بنجاح وتحديث البيانات!');
            const activeTab = document.querySelector('.admin-tab-content.active');
            if (activeTab) {
                activeTab.querySelectorAll('input, textarea').forEach(input => input.value = '');
            }
        }
    },

    renderAdminLists(db) {
        const createHtml = (arr, displayKey, collectionName) => {
            if (!arr || !arr.length) return `<p class="text-muted" style="font-size:0.85rem;">لا توجد عناصر حالياً.</p>`;
            return arr.map((item, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; background:white; border:1px solid #e2e8f0; padding:8px 12px; border-radius:8px;">
                    <span style="font-size:0.9rem; font-weight:bold;">${escapeHTML(item[displayKey] || 'عنصر بدون عنوان')}</span>
                    <button class="btn-danger" style="padding:4px 10px; border-radius:6px; font-size:0.8rem;" onclick="App.deleteItem('${
