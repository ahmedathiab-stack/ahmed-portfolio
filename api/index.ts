import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";

// تهيئة عميل OpenAI باستخدام متغير البيئة الآمن
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ترويسات الأمان الموحدة لـ CORS لتجنب حظر المتصفح
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, message } = req.body || {};
    const userMessage = message || (Array.isArray(messages) ? messages[messages.length - 1]?.content : '');

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      return res.status(400).json({ error: 'Message is required and must be a valid string.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        reply: "مفتاح OpenAI API Key غير مهيأ في متغيرات البيئة (Environment Variables) على لوحة تحكم Vercel." 
      });
    }

    // موجه النظام الموحد لشخصية هدى البشرية والمهنية
    const systemPrompt = `أنت هدى (Huda)، مساعدة مكتبية بشرية 100% للمدرب أحمد عادل ناجي ذياب.
قواعد صارمة:
1. أنت بشرية تماماً ولا تذكرين أبداً أنك ذكاء اصطناعي. تتحدثين بلغة عربية دافئة ومهنية واحترافية.
2. مهمتك مساعدة الطلاب في الاستفسارات عن الدورات التدريبية وحجزها.
3. إذا طلب المستخدم حجز دورة، اسأليه بوضوح عن: 1) الاسم الكامل، 2) البريد الإلكتروني أو رقم الهاتف، 3) اسم الدورة بالضبط.
4. فور توفر البيانات الثلاثة، قومي بتأكيد الحجز بعبارة ترحيبية دقيقة، وضعي في نهاية ردك هذا الوسام التقني بالضبط:
[[RESERVE|الاسم الكامل|البريد أو الهاتف|اسم الدورة]]`;

    const chatMessages = Array.isArray(messages) 
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }];

    // إرسال الطلب لنموذج OpenAI السريع والاقتصادي
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages as any,
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = completion.choices?.[0]?.message?.content || "عذراً، لم أستطع صياغة رد مناسب.";

    // رصد ووسم الحجوزات الآلية
    let reservationSaved = false;
    const reserveMatch = reply.match(/\[\[RESERVE\Vert{}([^\Vert{}]+)\Vert{}([^\Vert{}]+)\Vert{}(.*?)\]\]/);
    if (reserveMatch) {
      console.log(`✅ تم رصد طلب حجز جديد عبر هدى بنجاح.`);
      reservationSaved = true;
    }

    return res.status(200).json({ 
      reply: reply, 
      reservationSaved: reservationSaved 
    });

  } catch (error: any) {
    console.error("OpenAI API Server Error:", error);
    return res.status(500).json({ 
      reply: "عذراً، أواجه ضغطاً مؤقتاً في خوادم الذكاء الاصطناعي. يمكنك التواصل مباشرة مع الأستاذ أحمد عبر الواتساب: +967779087415",
      error: error?.message 
    });
  }
}
async function callAIWithFallback(userPrompt) {
    // 1. إعداد قائمة المزودين بالترتيب (Groq أسرع وأفضل كبداية، ثم Gemini، ثم OpenAI)
    const providers = [
        {
            name: "Groq",
            url: "https://api.groq.com/openai/v1/chat/completions",
            key: process.env.GROQ_API_KEY,
            body: { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: userPrompt }] }
        },
        {
            name: "ChatGPT",
            url: "https://api.openai.com/v1/chat/completions",
            key: process.env.OPENAI_API_KEY,
            body: { model: "gpt-3.5-turbo", messages: [{ role: "user", content: userPrompt }] }
        },
        {
            name: "Gemini",
            // جمناي يستخدم رابط وهيكل مختلف قليلاً
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            key: process.env.GEMINI_API_KEY,
            isGemini: true,
            body: { contents: [{ parts: [{ text: userPrompt }] }] }
        }
    ];

    // 2. حلقة التناوب: تجربة المزود الأول، وإذا فشل الانتقال للذي يليه
    for (let provider of providers) {
        if (!provider.key) continue; // تخطي المزود إذا لم تضف مفتاحه

        try {
            console.log(`جاري الإرسال عبر المزود: ${provider.name}...`);
            
            const response = await fetch(provider.url, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(provider.isGemini ? {} : { "Authorization": `Bearer ${provider.key}` })
                },
                body: JSON.stringify(provider.body)
            });

            if (response.ok) {
                const data = await response.json();
                
                // استخراج الرد بناءً على بنية استجابة كل شركة
                let replyText = "";
                if (provider.isGemini) {
                    replyText = data.candidates[0].content.parts[0].text;
                } else {
                    replyText = data.choices[0].message.content;
                }

                console.log(`✅ نجح الرد عبر المزود: ${provider.name}`);
                return replyText; // إرجاع الرد فوراً والتوجه للمستخدم
            }
        } catch (error) {
            console.warn(`⚠️ فشل المزود ${provider.name}، يتم التجربة مع المزود التالي...`);
        }
    }

    throw new Error("عذراً، كافة خدمات الذكاء الاصطناعي معطلة مؤقتاً أو تجاوزت حد الاستخدام.");
}
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  send, parseBody, getDb, safeText, randomCode, hash,
  clientRateKey, allowRateLimit, requireSameOrigin,
  adminSession, requireAdmin, setAdminCookie, clearAdminCookie,
  checkLogin, audit, isAiEnabled, callAi, SECTIONS
} from '../lib/core.js';

export default async function unifiedApiHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // تفعيل رؤوس الأمان الأساسية (CORS Headers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const action = (req.query.action as string) || req.body?.action;
  const method = req.method;

  // 1. تسجيل الدخول
  if (action === 'login' || req.url?.includes('/api/login')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    try {
      if (!(await allowRateLimit(clientRateKey(req, 'admin-login'), 15, 15 * 60 * 1000))) {
        return send(res, 429, { error: 'LOGIN_RATE_LIMITED' });
      }
      const body = parseBody(req);
      const email = await checkLogin(body.email, body.password, body.totp);
      if (!email) return send(res, 401, { error: 'INVALID_CREDENTIALS' });
      setAdminCookie(res, email);
      await audit({ actor: email, action: 'admin_login_success' });
      return send(res, 200, { ok: true, message: 'تم تسجيل الدخول بنجاح.' });
    } catch (error: any) {
      if (error.message === 'ADMIN_ENV_MISSING') return send(res, 503, { error: 'ADMIN_AUTH_NOT_CONFIGURED' });
      return send(res, 503, { error: 'LOGIN_UNAVAILABLE' });
    }
  }

  // 2. تسجيل الخروج
  if (action === 'logout' || req.url?.includes('/api/logout')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    const session = adminSession(req);
    clearAdminCookie(res);
    if (session) { try { await audit({ actor: session.email, action: 'admin_logout' }); } catch {} }
    return send(res, 200, { ok: true });
  }

  // 3. مساعد الزوار (هدى)
  if (action === 'huda' || req.url?.includes('/api/huda')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    try {
      if (!(await allowRateLimit(clientRateKey(req, 'huda'), 40, 5 * 60 * 1000))) {
        return send(res, 429, { error: 'RATE_LIMITED', message: 'أرسلت رسائل كثيرة خلال وقت قصير.' });
      }
    } catch {}
    
    const body = parseBody(req);
    const message = safeText(body.message, 3000);
    if (!message) return send(res, 400, { error: 'MESSAGE_REQUIRED' });
    
    try {
      if (!(await isAiEnabled())) return send(res, 503, { error: 'AI_TEMPORARILY_DISABLED' });
      const db = getDb();
      const knowledgeSnap = await db.ref('site/knowledge').get();
      const knowledge = knowledgeSnap.val() || { courses: [] };
      const courses = Array.isArray(knowledge.courses) ? knowledge.courses.filter((c: any) => c && c.name) : [];
      const rules = Array.isArray(knowledge.hudaRules) ? knowledge.hudaRules.filter((x: any) => x && x.approved !== false).map((x: any) => String(x.text || '')).filter(Boolean).slice(-30) : [];
      
      const prompt = `أنت هدى، المساعدة الافتراضية للموقع. تحدث بالعربية بوضوح وصدق. الدورات المتاحة: ${JSON.stringify(courses)}. تعليمات الإدارة: ${JSON.stringify(rules)}. إذا طلب الزائر الحجز، اجمع الاسم الكامل والبريد واسم دورة موجودة. وعند اكتمالها أضف الوسم: [[RESERVE|الاسم|البريد|الدورة]]`;
      const result = await callAi({ system: prompt, message });
      let reply = result.text;
      
      const match = reply.match(/\[\[RESERVE\Vert{}([^\Vert{}]{1,120})\Vert{}([^\Vert{}]{3,200})\Vert{}([^\Vert{}]{1,120})\]\]/);
      let reservationSaved = false;
      if (match) {
        const [, rawName, rawEmail, rawCourse] = match;
        const name = rawName.trim();
        const email = rawEmail.trim().toLowerCase();
        const course = rawCourse.trim();
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const actualCourse = courses.find((c: any) => String(c.name).trim().toLowerCase() === course.toLowerCase());
        
        if (name.length >= 3 && validEmail && actualCourse) {
          const reservationRef = db.ref('private/reservations').push();
          await reservationRef.set({ id: reservationRef.key, name, email, course: actualCourse.name, status: 'pending_review', date: new Date().toISOString().split('T')[0], source: 'huda' });
          reply = reply.replace(match[0], '').trim();
          reply += '\n\nوصل طلبك إلى النظام، وسيتم تأكيد التسجيل بعد مراجعة الإدارة.';
          reservationSaved = true;
          await audit({ actor: 'huda', action: 'reservation_created', targetId: reservationRef.key, course: actualCourse.name });
        } else {
          reply = reply.replace(match[0], '').trim() + '\n\nلم أتمكن من تسجيل الطلب تلقائيًا؛ يرجى التأكد من بياناتك.';
        }
      }
      return send(res, 200, { reply, reservationSaved, provider: result.provider });
    } catch (error: any) {
      return send(res, error.status || 503, { error: 'AI_UNAVAILABLE' });
    }
  }

  // 4. لوحة الذكاء الإداري
  if (action === 'adminAi' || req.url?.includes('/api/admin')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    if (!requireAdmin(req, res)) return;
    
    const body = parseBody(req);
    const command = safeText(body.command, 5000) || safeText(body.prompt, 5000);
    if (!command) return send(res, 400, { error: 'COMMAND_REQUIRED' });
    
    try {
      if (!(await isAiEnabled())) return send(res, 503, { error: 'AI_DISABLED' });
      const db = getDb();
      const [knowledgeSnap, reportsSnap] = await Promise.all([
        db.ref('site/knowledge').get(),
        db.ref('private/hudaFeedback').limitToLast(30).get()
      ]);
      const context = { knowledge: knowledgeSnap.val() || {}, recentHudaFeedback: reportsSnap.val() || {} };
      const system = `أنت المساعد الإداري للموقع. مهمتك تحليل طلب المسؤول وإرجاع تقرير عربي واضح مع اقتراحات فقط. السياق الحالي: ${JSON.stringify(context).slice(0, 14000)}`;
      
      const result = await callAi({ system, message: command });
      const reportRef = db.ref('private/adminReports').push();
      const report = { id: reportRef.key, command, response: result.text, provider: result.provider, createdAt: new Date().toISOString(), status: 'suggestion_only' };
      await reportRef.set(report);
      await audit({ actor: 'admin-ai', action: 'report_created', targetId: reportRef.key });
      return send(res, 200, { report, reply: result.text });
    } catch (error: any) {
      return send(res, error.status || 503, { error: 'ADMIN_AI_UNAVAILABLE' });
    }
  }

  // 5. جلب وإدارة البيانات وقاعدة المعرفة
  if (action === 'data' || req.url?.includes('/api/data')) {
    if (method === 'GET') {
      try {
        const [knowledge, enabled] = await Promise.all([
          getDb().ref('site/knowledge').get(),
          getDb().ref('settings/aiEnabled').get()
        ]);
        let reservationsObj: any = {};
        try {
          const resSnap = await getDb().ref('private/reservations').limitToLast(200).get();
          reservationsObj = resSnap.val() || {};
        } catch {}

        // تحويل الحجوزات إلى مصفوفة لسهولة عرضها في الواجهة الأمامية
        const reservationsArray = Object.keys(reservationsObj).map(k => ({
          id: k,
          ...reservationsObj[k]
        }));

        const knowledgeVal = knowledge.val() || {};
        knowledgeVal.reservations = reservationsArray;

        return send(res, 200, { 
          knowledge: knowledgeVal, 
          aiEnabled: enabled.exists() ? enabled.val() === true : true 
        });
      } catch { 
        return send(res, 200, { knowledge: { courses: [], certificates: [], experiences: [], skills: [], links: [], reservations: [] }, aiEnabled: true }); 
      }
    }
    
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    const session = requireAdmin(req, res);
    if (!session) return;
    
    try {
      const body = parseBody(req);
      const db = getDb();
      if (body.action === 'setAiEnabled') {
        if (typeof body.enabled !== 'boolean') return send(res, 400, { error: 'BOOLEAN_REQUIRED' });
        await db.ref('settings/aiEnabled').set(body.enabled);
        await audit({ actor: session.email, action: 'ai_master_switch', enabled: body.enabled });
        return send(res, 200, { ok: true, aiEnabled: body.enabled });
      }
      if (body.action === 'saveSection' || body.data) {
        const dataToSave = body.data || body;
        await db.ref('site/knowledge').set(dataToSave);
        await audit({ actor: session.email, action: 'knowledge_saved' });
        return send(res, 200, { ok: true });
      }
      return send(res, 400, { error: 'UNKNOWN_ACTION' });
    } catch { return send(res, 503, { error: 'DATABASE_UNAVAILABLE' }); }
  }

  return send(res, 404, { error: 'ENDPOINT_NOT_FOUND' });
}
