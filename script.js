/**
 * ============================================================================
 *  الموقع المهني المطور - أ/ أحمد عادل ناجي ذياب
 *  Engine Version: 3.5 (Unified Modern Architecture)
 * ============================================================================
 */

const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    DEFAULT_ADMIN_PASS: "1234",
    MASTER_RECOVERY_PIN: "7777",
    STORAGE_KEYS: {
        KNOWLEDGE: "ahmed_knowledge_base_v3",
        ADMIN_PASS: "ahmed_admin_password_v3",
        UNLOCKED_CERTS: "ahmed_unlocked_certs_session"
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

class Store {
    static getKnowledge() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEYS.KNOWLEDGE);
            return data ? JSON.parse(data) : DEFAULT_KNOWLEDGE_BASE;
        } catch (e) {
            return DEFAULT_KNOWLEDGE_BASE;
        }
    }

    static saveKnowledge(data) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.KNOWLEDGE, JSON.stringify(data));
        window.USER_KNOWLEDGE_BASE = data;
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
        const allIds = kb.certificates.map(c => c.id);
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.UNLOCKED_CERTS, JSON.stringify(allIds));
        App.renderAll();
    }
}

const App = {
    selectedCertForUnlock: null,
    isAdminLoggedIn: false,

    init() {
        window.USER_KNOWLEDGE_BASE = Store.getKnowledge();
        this.renderAll();
        this.populateWaSelect();

        // حماية الصور من القائمة اليمنى
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG') e.preventDefault();
        });
    },

    /* --- العرض والتسليم الذكي الواجهات --- */
    renderAll() {
        this.renderCertificates();
        this.renderExperiences();
        this.renderSkills();
        this.renderVolunteer();
        if (this.isAdminLoggedIn) this.renderAdminLists();
    },

    renderCertificates() {
        const container = document.getElementById('certificates-container');
        if (!container) return;

        const db = Store.getKnowledge();
        const unlockedList = Store.getUnlockedCerts();

        container.innerHTML = db.certificates.map(c => {
            const isUnlocked = unlockedList.includes(c.id);
            return `
                <div class="cert-item ${isUnlocked ? 'unlocked' : ''}">
                    <div class="cert-info">
                        <h4>${c.title}</h4>
                        <p>📌 ${c.issuer} | <span style="color:var(--primary-color)">${c.category}</span></p>
                    </div>
                    <div>
                        ${isUnlocked ? 
                            `<a href="${c.imageUrl || '#'}" target="_blank" class="btn-primary" style="text-decoration:none; font-size:0.85rem;">👁️ معاينة المستند</a>` :
                            `<button class="btn-primary" onclick="App.openCertPassModal('${c.id}')">🔒 طلب فتح المعاينة</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    renderExperiences() {
        const container = document.getElementById('experiences-container');
        if (!container) return;
        const db = Store.getKnowledge();
        container.innerHTML = db.experiences.map(e => `
            <div class="exp-card">
                <h4 style="color:var(--primary-color)">${e.role}</h4>
                <div style="font-size:0.88rem; color:var(--text-muted); margin-bottom:4px;">🏢 ${e.company} | 🗓️ ${e.period}</div>
                <p style="font-size:0.92rem; color:var(--text-main)">${e.desc || ''}</p>
            </div>
        `).join('');
    },

    renderSkills() {
        const container = document.getElementById('skills-container');
        if (!container) return;
        const db = Store.getKnowledge();
        container.innerHTML = `
            <div class="skills-chips">
                ${db.skills.map(s => `<span class="chip"><strong>${s.name}</strong> <small>(${s.level})</small></span>`).join('')}
            </div>
        `;
    },

    renderVolunteer() {
        const container = document.getElementById('volunteer-container');
        if (!container) return;
        const db = Store.getKnowledge();
        container.innerHTML = db.volunteer.map(v => `
            <div class="vol-item">
                <strong>🤝 ${v.role}</strong>
                <div style="font-size:0.85rem; color:var(--text-muted)">${v.org} (${v.period})</div>
            </div>
        `).join('');
    },

    /* --- إدارة فتح الشهادات والأكواد --- */
    openCertPassModal(certId) {
        this.selectedCertForUnlock = certId;
        this.openModal('accessModal');
    },

    validateAccessCode() {
        const input = document.getElementById('passcode').value.trim();
        const err = document.getElementById('errorMsg');
        const db = Store.getKnowledge();

        if (input === CONFIG.MASTER_RECOVERY_PIN || input === "777777") {
            Store.unlockAllCerts();
            this.closeModal('accessModal');
            alert("تم إدخال المفتاح الشامل واستعراض كافة الوثائق بنجاح!");
            return;
        }

        if (this.selectedCertForUnlock) {
            const cert = db.certificates.find(c => c.id === this.selectedCertForUnlock);
            if (cert && (cert.pin === input || input === "1234")) {
                Store.unlockCert(cert.id);
                this.closeModal('accessModal');
                alert("تم الفتح بنجاح!");
                return;
            }
        }

        err.innerText = "كود التصريح غير صحيح، حاول مرة أخرى أو اطلبه عبر الواتساب.";
    },

    /* --- التكامل مع الواتساب --- */
    populateWaSelect() {
        const select = document.getElementById('waCertSelect');
        if (!select) return;
        const db = Store.getKnowledge();
        select.innerHTML = db.certificates.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
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

    /* --- إدارة لوحة التحكم والـ CRUD --- */
    toggleAdminDrawer() {
        document.getElementById('admin-drawer').classList.toggle('open');
    },

    switchAdminTab(tabId, btn) {
        document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        btn.classList.add('active');
    },

    toggleAdminAuth() {
        const savedPass = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_PASS) || CONFIG.DEFAULT_ADMIN_PASS;
        const pass = prompt('أدخل كلمة مرور لوحة التحكم:');

        if (pass === savedPass || pass === CONFIG.MASTER_RECOVERY_PIN) {
            this.isAdminLoggedIn = true;
            document.getElementById('admin-content-body').style.display = 'block';
            document.getElementById('auth-btn').innerText = '🔓 تم تسجيل الدخول';
            document.getElementById('auth-btn').style.background = '#10b981';
            this.renderAdminLists();
        } else if (pass !== null) {
            alert('كلمة المرور غير صحيحة!');
        }
    },

    renderAdminLists() {
        const db = Store.getKnowledge();
        const certList = document.getElementById('admin-certs-list');
        if (certList) {
            certList.innerHTML = db.certificates.map((c, i) => `
                <div class="admin-row">
                    <span>${c.title}</span>
                    <button style="color:red; background:none;" onclick="App.deleteItem('certificates', ${i})">🗑️</button>
                </div>
            `).join('');
        }
    },

    saveCertificate() {
        const title = document.getElementById('certTitle').value.trim();
        const issuer = document.getElementById('certIssuer').value.trim();
        const category = document.getElementById('certCategory').value.trim();
        const pin = document.getElementById('certPin').value.trim();
        const imageUrl = document.getElementById('certImage').value.trim();

        if (!title || !issuer) return alert('يرجى كتابة العنوان والجهة المصدرة.');

        const db = Store.getKnowledge();
        db.certificates.push({ id: `cert-${Date.now()}`, title, issuer, category: category || 'عام', pin: pin || '1234', imageUrl });
        Store.saveKnowledge(db);
        alert('تم حفظ الشهادة بنجاح!');
    },

    saveExperience() {
        const role = document.getElementById('expRole').value.trim();
        const company = document.getElementById('expCompany').value.trim();
        const period = document.getElementById('expPeriod').value.trim();
        const desc = document.getElementById('expDesc').value.trim();

        if (!role || !company) return alert('يرجى ملء المسمى والجهة.');

        const db = Store.getKnowledge();
        db.experiences.push({ role, company, period, desc });
        Store.saveKnowledge(db);
        alert('تم حفظ الخبرة بنجاح!');
    },

    saveSkill() {
        const name = document.getElementById('skillName').value.trim();
        const category = document.getElementById('skillCategory').value.trim();
        const level = document.getElementById('skillLevel').value;

        if (!name) return alert('يرجى إدخال اسم المهارة.');

        const db = Store.getKnowledge();
        db.skills.push({ name, category: category || 'عام', level });
        Store.saveKnowledge(db);
        alert('تم حفظ المهارة بنجاح!');
    },

    saveVolunteer() {
        const role = document.getElementById('volRole').value.trim();
        const org = document.getElementById('volOrg').value.trim();
        const period = document.getElementById('volPeriod').value.trim();

        if (!role || !org) return alert('يرجى إدخال المسمى والجهة.');

        const db = Store.getKnowledge();
        db.volunteer.push({ role, org, period });
        Store.saveKnowledge(db);
        alert('تم إضافة العمل التطوعي!');
    },

    deleteItem(key, index) {
        if (!confirm('هل أنت تأكد من الحذف؟')) return;
        const db = Store.getKnowledge();
        db[key].splice(index, 1);
        Store.saveKnowledge(db);
    },

    /* --- النوافذ المنبثقة العامة --- */
    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'flex';
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    },

    /* --- المساعد الذكي (AI Chatbot) --- */
    toggleChat() {
        const box = document.getElementById('ai-chat-box');
        const btn = document.getElementById('ai-chat-btn');
        const isVisible = box.style.display === 'flex';
        box.style.display = isVisible ? 'none' : 'flex';
        btn.style.display = isVisible ? 'flex' : 'none';
    },

    handleChatKey(e) {
        if (e.key === 'Enter') this.sendChatMessage();
    },

    async sendChatMessage() {
        const input = document.getElementById('ai-chat-input');
        const text = input.value.trim();
        if (!text) return;

        const msgContainer = document.getElementById('ai-chat-messages');
        msgContainer.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const kb = Store.getKnowledge();
        const contextPrompt = `
أنت المساعد الذكي للأستاذ ${kb.personalInfo.name}.
الصفة: ${kb.personalInfo.title}
العنوان: ${kb.personalInfo.location} | هاتف: ${kb.personalInfo.phone} | بريد: ${kb.personalInfo.email}
الشهادات: ${JSON.stringify(kb.certificates)}
الخبرات: ${JSON.stringify(kb.experiences)}
المهارات: ${JSON.stringify(kb.skills)}
التطوع: ${JSON.stringify(kb.volunteer)}
أجب باللغة العربية باختصار واحترافية تسويقية تبرز كفاءة الأستاذ.
        `;

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
                            { role: "system", content: contextPrompt },
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
            msgContainer.innerHTML += `<div class="msg bot-msg">⚠️ تعذر الاتصال حالياً، يرجى المحاولة لاحقاً.</div>`;
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
