// ============================================================
// 1. مصفوفة روابط الشهادات (سنضع الروابط هنا عند تجهيز الملفات)
// ============================================================
const CERT_FILES = {
    "cert-acc-1": "certificates/bachelor-accounting.pdf", // رابط بكالوريوس المحاسبة
    "cert-acc-2": "certificates/extra-system.pdf",        // رابط شهادة إكسترا
    "cert-it-1":  "certificates/icdl-diploma.pdf",        // رابط ICDL
    "cert-lang-1":"certificates/english-b2.pdf"           // رابط اللغة الإنجليزية
};

// ============================================================
// 2. جدول التصاريح والأكواد (يمكن تعديله أو ربطه بالسيرفر مستقبلاً)
// ============================================================
const ACCESS_KEYS = {
    // كود تصريح شامل (Master Key) يفتح كل شيء
    "MASTER-2026": { scope: "ALL", expires: "2026-12-31" },

    // كود مخصص لشهادات المحاسبة فقط (مثل إرساله لمنظمة تطلب مؤهل محاسبي)
    "ACC-ONLY": { scope: ["cert-acc-1", "cert-acc-2"], expires: "2026-12-31" },

    // كود مخصص لشهادة واحدة فقط (مثال: شهادة إكسترا فقط)
    "EXTRA-PASS": { scope: ["cert-acc-2"], expires: "2026-12-31" }
};

let activeTarget = null; // Target certificate ID or 'ALL'

function openModal(targetId) {
    activeTarget = targetId;
    document.getElementById("errorMsg").innerText = "";
    document.getElementById("passcode").value = "";
    
    if (targetId === "ALL") {
        document.getElementById("modalTitle").innerText = "التصريح الشامل";
        document.getElementById("modalDesc").innerText = "أدخل الكود الشامل لفتح جميع الوثائق والشهادات:";
    } else {
        document.getElementById("modalTitle").innerText = "طلب معاينة وثيقة";
        document.getElementById("modalDesc").innerText = "أدخل الرمز الخاص بهذه الوثيقة أو الرمز الشامل:";
    }
    
    document.getElementById("accessModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("accessModal").style.display = "none";
}

function validateCode() {
    const inputCode = document.getElementById("passcode").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    const keyData = ACCESS_KEYS[inputCode];

    if (!keyData) {
        errorMsg.innerText = "❌ رمز التصريح غير صحيح!";
        return;
    }

    // التحقق من صلاحية التاريخ
    const today = new Date().toISOString().split('T')[0];
    if (keyData.expires < today) {
        errorMsg.innerText = "⚠️ عفواً، انتهت صلاحية هذا التصريح!";
        return;
    }

    // التثبت من النطاق المسموح للرمز (Scope Validation)
    if (keyData.scope === "ALL") {
        alert("🔓 تم تفعيل التصريح الشامل! يمكنك الآن معاينة جميع الوثائق.");
        unlockCertificates(Object.keys(CERT_FILES));
        closeModal();
    } 
    else if (Array.isArray(keyData.scope)) {
        if (activeTarget === "ALL" || keyData.scope.includes(activeTarget)) {
            alert("🔓 تم التأكد من التصريح بنجاح!");
            unlockCertificates(keyData.scope);
            closeModal();
        } else {
            errorMsg.innerText = "⚠️ هذا الرمز غير مصرح له بفتح هذه الوثيقة المحددة.";
        }
    }
}

// دالة فتح المعاينة وتحويل الزر لفتح الملف
function unlockCertificates(allowedCertIds) {
    allowedCertIds.forEach(id => {
        const itemBtn = document.querySelector(`#item-${id} .btn-lock`);
        if (itemBtn) {
            itemBtn.innerText = "👁️ فتح الملف";
            itemBtn.style.background = "#38a169";
            itemBtn.onclick = function() {
                const filePath = CERT_FILES[id];
                if (filePath && !filePath.includes("undefined")) {
                    window.open(filePath, "_blank");
                } else {
                    alert("📄 هذه الشهادة مفعّلة في النظام، وسيكون ملفها متاحاً فور رفعه مجلداً للموقع!");
                }
            };
        }
    });
}