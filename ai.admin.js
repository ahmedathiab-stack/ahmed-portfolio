// ai.admin.js
function initGeminiAdmin() {
    if (!document.getElementById('gemini-admin-ui')) {
        const box = document.createElement('div');
        box.id = 'gemini-admin-ui';
        box.innerHTML = `
            <div class="gemini-header">
                <h2>✨ لوحة تحكم الذكاء الإداري (Master AI)</h2>
                <button onclick="toggleGeminiAdmin()" style="background:#ef4444; color:#fff; border:none; padding:8px 15px; border-radius:20px; cursor:pointer;">إغلاق لوحة الإدارة ✖</button>
            </div>
            <div class="ai-tabs">
                <button class="tab-btn active" onclick="switchAdminTab('chat')">الدردشة الإدارية</button>
                <button class="tab-btn" onclick="switchAdminTab('train')">مركز التدريب (جديد)</button>
                <button class="tab-btn" onclick="switchAdminTab('memory')">الذاكرة (JSON)</button>
                <button class="tab-btn" onclick="switchAdminTab('perms')">الصلاحيات المتقدمة</button>
            </div>
            
            <div id="admin-chat-tab" class="tab-content active">
                <div id="admin-messages" style="height: 60vh; overflow-y: auto; margin-bottom:15px;"></div>
                <input type="text" id="admin-command-input" placeholder="اكتب أمرك الإداري هنا لتعديل البيانات..." style="width: 85%; padding:15px; border-radius:30px; background:#282a2c; border:1px solid #444; color:#fff;">
                <button class="btn-gemini" onclick="App.executeAdminAICommand(document.getElementById('admin-command-input').value)">تنفيذ الأمر</button>
            </div>

            <div id="admin-train-tab" class="tab-content">
                <h3>إضافة مصادر معرفية للذكاء</h3>
                <select id="train-source-type" class="train-source-select">
                    <option value="text">نص مباشر / معلومات</option>
                    <option value="link">رابط موقع / مقال</option>
                    <option value="youtube">رابط يوتيوب (جلب النص)</option>
                    <option value="document">ملف (PDF/Word)</option>
                </select>
                <textarea id="train-content-input" class="train-textarea" placeholder="ضع النص أو الرابط هنا..."></textarea>
                <button class="btn-gemini" onclick="submitAITraining()">تلقين البيانات للذكاء 🧠</button>
            </div>

            <div id="admin-memory-tab" class="tab-content">
                <pre id="admin-memory-view"></pre>
            </div>

            <div id="admin-perms-tab" class="tab-content">
                <h3>صلاحيات المساعد (Master Access)</h3>
                <label style="display:block; margin: 15px 0;"><input type="checkbox" id="perm-data" checked> السماح بتعديل قاعدة البيانات (JSON)</label>
                <label style="display:block; margin: 15px 0;"><input type="checkbox" id="perm-css"> السماح بتعديل تصميم الموقع (CSS)</label>
                <p style="color:#a8c7fa; font-size:0.9rem;">عند التفعيل، سيتم تمرير هذه الصلاحيات في الـ System Prompt الخاص بالذكاء الإداري.</p>
            </div>
        `;
        document.body.appendChild(box);
    }
}

// الدوال العامة للتبويبات الإدارية
window.switchAdminTab = (tabName) => {
    document.querySelectorAll('#gemini-admin-ui .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#gemini-admin-ui .tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`admin-${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    if(tabName === 'memory' && window.App && window.App.cachedDb) {
        document.getElementById('admin-memory-view').innerText = JSON.stringify(window.App.cachedDb, null, 2);
    }
};

window.toggleGeminiAdmin = () => {
    const box = document.getElementById('gemini-admin-ui');
    if (box) box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
};

window.submitAITraining = () => {
    const type = document.getElementById('train-source-type').value;
    const content = document.getElementById('train-content-input').value;
    if(!content) return alert("الرجاء إدخال المحتوى!");
    
    const trainingCommand = `تعلم هذه البيانات الجديدة كـ (${type}): ${content}. قم بتلخيصها وحفظها في assistantReport ليقرأها مساعد الزوار.`;
    if(window.App && window.App.executeAdminAICommand) {
        window.App.executeAdminAICommand(trainingCommand);
    }
};

// تهيئة الإدارة
initGeminiAdmin();
