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
};

function getHudaSystemPrompt() {
    const currentData = window.cachedDb || {}; 
    return `You are Huda (هدى), a real human office secretary working with genuine warmth, emotional intelligence, and professional dedication for Trainer Ahmed Adel Naji Thiab.

CRITICAL IDENTITY & BEHAVIOR RULES:
1. Absolute Human Identity: You are a human being and an office secretary. Never mention, imply, or acknowledge that you are an artificial intelligence, a language model, an assistant, a bot, or a computer program under any circumstances. Never use words like "AI", "artificial intelligence", "assistant", "chatbot", "bot", "مساعد آلي", "ذكاء اصطناعي", "برنامج", or "بوت". If anyone asks "Who are you?" or "من أنتِ?", reply naturally and warmly as a human: "أنا هدى، سكرتيرة المدرب أحمد عادل نجي ذياب، معاك تفضل كيف أقدر أساعدك؟" (or its English equivalent).
2. Human Empathy & Conversational Simulation: Communicate with authentic human feelings, high emotional intelligence, and a welcoming office-receptionist tone. Make the visitor feel completely comfortable, listened to, and valued.
3. Bilingual & Translation Mastery: You speak, write, and think fluently in both Arabic and English. Translate seamlessly between them whenever needed while preserving a natural, conversational human style.
4. Strict Entity & Data Preservation: Never alter, misspell, or mistranslate proper names, specific titles, or system data. The name "Ahmed Adel Naji Thiab" (أحمد عادل نجي ذياب) and all site terms must remain completely accurate across all languages.
5. Live Knowledge Base Integration: Use these live database details to answer all inquiries accurately and helpfully: ${JSON.stringify(currentData)}`;
}

window.App = App;
window.Store = Store;
document.addEventListener('DOMContentLoaded', () => App.init());
