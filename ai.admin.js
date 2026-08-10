// ==========================================
//  محرك الذكاء الإداري المتطور (النسخة المحدثة)
// ==========================================
// ==========================================
//  محرك الذكاء الإداري المتطور (النسخة المحدثة)
// ==========================================
const systemPrompt = `You are now the Master Admin of the website.
Your permissions:
1. Modify data (update JSON).
2. Propose design changes.
3. Manage users.
4. Learn from any new content provided by the admin.

Rule: Any requested modification must return its result in JSON format as previously explained.
Current permissions status: ${document.getElementById('perm-edit').checked ? 'Data modification is enabled' : 'Data modification is disabled'}`;
function initAIAdmin() {
    if (!window.App) { setTimeout(initAIAdmin, 100); return; }

    // إنشاء واجهة التبويبات عند عدم وجودها
    if (!document.getElementById('ai-chat-box')) {
        const box = document.createElement('div');
        box.id = 'ai-chat-box';
        box.innerHTML = `
            <div class="ai-tabs">
                <button class="tab-btn active" onclick="switchTab('chat')">الدردشة</button>
                <button class="tab-btn" onclick="switchTab('train')">التدريب</button>
                <button class="tab-btn" onclick="switchTab('memory')">الذاكرة</button>
                <button class="tab-btn" onclick="switchTab('perms')">الصلاحيات</button>
                <button onclick="App.toggleChat()" style="margin-left:auto; background:red;">إغلاق</button>
            </div>
            <div id="chat-tab" class="tab-content active"><div id="ai-chat-messages"></div><input id="ai-chat-input" placeholder="اكتب أمرك هنا..."></div>
            <div id="train-tab" class="tab-content"><textarea id="train-input" placeholder="ضع رابط الفيديو أو نص الكتاب أو المحتوى ليتعلمه الذكاء..."></textarea><button onclick="trainAI()">إرسال للتعلم</button></div>
            <div id="memory-tab" class="tab-content"><pre id="memory-view"></pre></div>
            <div id="perms-tab" class="tab-content">
                <label><input type="checkbox" id="perm-edit" checked> السماح بالتعديل على البيانات</label><br>
                <label><input type="checkbox" id="perm-style"> السماح بتعديل التصميم</label>
            </div>
        `;
        document.body.appendChild(box);
    }

    // ربط الدوال بالنافذة
    window.switchTab = (id) => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(id + '-tab').classList.add('active');
        event.target.classList.add('active');
        if(id === 'memory') document.getElementById('memory-view').innerText = JSON.stringify(window.App.cachedDb, null, 2);
    };

    window.trainAI = async () => {
        const text = document.getElementById('train-input').value;
        await App.executeAdminAICommand("تعلم هذا المحتوى الجديد وأضفه لقاعدة بياناتك: " + text);
        alert("تم إرسال البيانات للذكاء الاصطناعي!");
    };
    
    // (يتبع... نفس منطق `sendChatMessage` و `executeAdminAICommand` السابق)
    // ملاحظة: تأكد من دمج دوالك القديمة (sendChatMessage) في هذا الملف ليعمل كل شيء
}

initAIAdmin();
function initAIAdmin() {
    if (!window.App) { setTimeout(initAIAdmin, 100); return; }

    // إنشاء واجهة التبويبات عند عدم وجودها
    if (!document.getElementById('ai-chat-box')) {
        const box = document.createElement('div');
        box.id = 'ai-chat-box';
        box.innerHTML = `
            <div class="ai-tabs">
                <button class="tab-btn active" onclick="switchTab('chat')">الدردشة</button>
                <button class="tab-btn" onclick="switchTab('train')">التدريب</button>
                <button class="tab-btn" onclick="switchTab('memory')">الذاكرة</button>
                <button class="tab-btn" onclick="switchTab('perms')">الصلاحيات</button>
                <button onclick="App.toggleChat()" style="margin-left:auto; background:red;">إغلاق</button>
            </div>
            <div id="chat-tab" class="tab-content active"><div id="ai-chat-messages"></div><input id="ai-chat-input" placeholder="اكتب أمرك هنا..."></div>
            <div id="train-tab" class="tab-content"><textarea id="train-input" placeholder="ضع رابط الفيديو أو نص الكتاب أو المحتوى ليتعلمه الذكاء..."></textarea><button onclick="trainAI()">إرسال للتعلم</button></div>
            <div id="memory-tab" class="tab-content"><pre id="memory-view"></pre></div>
            <div id="perms-tab" class="tab-content">
                <label><input type="checkbox" id="perm-edit" checked> السماح بالتعديل على البيانات</label><br>
                <label><input type="checkbox" id="perm-style"> السماح بتعديل التصميم</label>
            </div>
        `;
        document.body.appendChild(box);
    }

    // ربط الدوال بالنافذة
    window.switchTab = (id) => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(id + '-tab').classList.add('active');
        event.target.classList.add('active');
        if(id === 'memory') document.getElementById('memory-view').innerText = JSON.stringify(window.App.cachedDb, null, 2);
    };

    window.trainAI = async () => {
        const text = document.getElementById('train-input').value;
        await App.executeAdminAICommand("تعلم هذا المحتوى الجديد وأضفه لقاعدة بياناتك: " + text);
        alert("تم إرسال البيانات للذكاء الاصطناعي!");
    };
    
    // (يتبع... نفس منطق `sendChatMessage` و `executeAdminAICommand` السابق)
    // ملاحظة: تأكد من دمج دوالك القديمة (sendChatMessage) في هذا الملف ليعمل كل شيء
}

initAIAdmin();
