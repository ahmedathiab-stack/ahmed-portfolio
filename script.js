const CONFIG = {
    WHATSAPP_NUMBER: "967779087415",
    DEFAULT_ADMIN_PASS: "1234",
    MASTER_RECOVERY_PIN: "7777",
    STORAGE_KEYS: {
        KNOWLEDGE: "ahmed_knowledge_base_v6",
        UNLOCKED_CERTS: "ahmed_unlocked_certs_v6"
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
        summary: "مدرب معتمد ومحاسب أكاديمي حاصل على بكالوريوس المحاسبة من جامعة أبين."
    },
    certificates: [
        { id: "cert-acc-1", title: "بكالوريوس المحاسبة", category: "محاسبة", issuer: "جامعة أبين (2026)", imageUrl: "", pin: "1001" },
        { id: "cert-acc-2", title: "شهادة نظام إكسترا للمحاسبة والإدارة", category: "محاسبة", issuer: "بن مقيبل للأنظمة ومؤسسة بلقيس (2022)", imageUrl: "", pin: "1002" }
    ]
};

class Store {
    static getKnowledge() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.KNOWLEDGE);
            if (!raw) return DEFAULT_KNOWLEDGE_BASE;
            const parsed = JSON.parse(raw);
            return {
                personalInfo: { ...DEFAULT_KNOWLEDGE_BASE.personalInfo, ...(parsed.personalInfo || {}) },
                certificates: Array.isArray(parsed.certificates) ? parsed.certificates : DEFAULT_KNOWLEDGE_BASE.certificates
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

const App = {
    selectedCertForUnlock: null,
    isAdminLoggedIn: false,

    init() {
        this.renderAll();
    },

    renderAll() {
        const db = Store.getKnowledge();
        this.renderCertificates(db);
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
                            `<a href="${c.imageUrl || '#'}" target="_blank" class="btn-primary" style="text-decoration:none; font-size:0.85rem; width:100%;">👁️ معاينة المستند</a>` :
                            `<button class="btn-primary" onclick="App.openCertPassModal('${c.id}')" style="width:100%;">🔒 طلب فتح المعاينة</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    openCertPassModal(certId) {
        this.selectedCertForUnlock = certId;
        this.openModal('accessModal');
    },

    validateAccessCode() {
        const input = (document.getElementById('passcode').value || '').trim();
        const err = document.getElementById('errorMsg');
        const db = Store.getKnowledge();

        if (input === CONFIG.MASTER_RECOVERY_PIN || input === "777777") {
            Store.unlockAllCerts();
            this.closeModal('accessModal');
            alert("تم إدخال المفتاح الشامل واستعراض كافة الوثائق بنجاح!");
            return;
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

        err.innerText = "كود التصريح غير صحيح. (جرب 7777 للفتح الشامل)";
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
        const pass = prompt('أدخل كلمة مرور لوحة التحكم (الافتراضية: 1234):');
        if (pass === CONFIG.DEFAULT_ADMIN_PASS || pass === CONFIG.MASTER_RECOVERY_PIN) {
            this.isAdminLoggedIn = true;
            document.getElementById('admin-content-body').style.display = 'block';
            document.getElementById('auth-btn').innerText = '🔓 تم تسجيل الدخول';
            document.getElementById('auth-btn').style.background = '#10b981';
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
    },

    saveCertificate() {
        const index = parseInt(document.getElementById('certEditIndex').value);
        const title = document.getElementById('certTitle').value.trim();
        const issuer = document.getElementById('certIssuer').value.trim();
        const category = document.getElementById('certCategory').value.trim();
        const pin = document.getElementById('certPin').value.trim();
        const imageUrl = document.getElementById('certImage').value.trim();

        if (!title || !issuer) return alert('يرجى كتابة العنوان والجهة المصدرة.');

        const db = Store.getKnowledge();
        const certObj = { 
            id: index >= 0 ? db.certificates[index].id : `cert-${Date.now()}`, 
            title, 
            issuer, 
            category: category || 'عام', 
            pin: pin || '1001', 
            imageUrl 
        };

        if (index >= 0) {
            db.certificates[index] = certObj;
        } else {
            db.certificates.push(certObj);
        }

        Store.saveKnowledge(db);
        this.resetCertForm();
        alert('تم حفظ الشهادة وإضافتها للمعرض فوراً وبدون تعقيد!');
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
        document.getElementById('certImage').value = c.imageUrl || '';
    },

    resetCertForm() {
        document.getElementById('certEditIndex').value = "-1";
        document.getElementById('certTitle').value = "";
        document.getElementById('certIssuer').value = "";
        document.getElementById('certCategory').value = "";
        document.getElementById('certPin').value = "";
        document.getElementById('certImage').value = "";
    },

    deleteItem(key, index) {
        if (!confirm('هل أنت تأكد من الحذف؟ ستحذف المعلومة تلقائياً من المعرض.')) return;
        const db = Store.getKnowledge();
        db[key].splice(index, 1);
        Store.saveKnowledge(db);
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
        msgContainer.innerHTML += `<div class="msg user-msg">${text}</div>`;
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const kb = Store.getKnowledge();
        
        // توجيه صارم لمنع الحشو والخلط اللغوي والصيني، وتحديد الرد بلغة السائل حصراً بشكل بشري طبيعي
        const strictSystemPrompt = `أنت المساعد الشخصي للمدرب أحمد عادل ناجي ذياب. 
قواعد صارمة جداً:
1. التزم بالرد حصراً ونهائياً **بلغة السائل** التي استخدمها في سؤاله (إذا سأل بالعربية أجب بالعربية وحدها تماماً، وإذا سأل بالإنجليزية أجب بالإنجليزية وحدها).
2. ممنوع نهائياً خلط اللغات أو إدخال لغات غريبة (كالصينية أو غيرها).
3. تحدث بطريقة طبيعية ومحاكاة تامة للبشر مثل أسلوب المراسلة عبر تطبيق واتساب (مختصر، ودود، وخالٍ من الحشو والتكرار الممل).
بيانات الموقع المتوفرة لديك: ${JSON.stringify(kb)}`;

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
                            { role: "system", content: strictSystemPrompt },
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
            msgContainer.innerHTML += `<div class="msg bot-msg">⚠️ عذراً، واجهت مشكلة بسيطة في الاتصال. يمكنك مراسلة الأستاذ مباشرة عبر الواتساب.</div>`;
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
