import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  send, parseBody, getDb, safeText, randomCode, hash,
  clientRateKey, allowRateLimit, requireSameOrigin,
  adminSession, requireAdmin, setAdminCookie, clearAdminCookie,
  checkLogin, audit, isAiEnabled, callAi, SECTIONS
} from '../lib/core.js';

export default async function unifiedApiHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const action = (req.query.action as string) || req.body?.action;
  const method = req.method;

  // 1. تسجيل الدخول
  if (action === 'login' || req.url?.includes('/api/login')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    try {
      if (!(await allowRateLimit(clientRateKey(req, 'admin-login'), 8, 15 * 60 * 1000))) {
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
    if (req.headers.origin && process.env.APP_ORIGIN && req.headers.origin !== process.env.APP_ORIGIN) {
      return send(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
    }
    try {
      if (!(await allowRateLimit(clientRateKey(req, 'huda'), 30, 5 * 60 * 1000))) {
        return send(res, 429, { error: 'RATE_LIMITED', message: 'أرسلت رسائل كثيرة خلال وقت قصير.' });
      }
    } catch { return send(res, 503, { error: 'RATE_LIMIT_SERVICE_UNAVAILABLE' }); }
    
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
      
      const prompt = `أنت هدى، المساعدة الافتراضية للموقع. تحدث بالعربية بوضوح وصدق. الدورات المتاحة: ${JSON.stringify(courses)}. تعليمات الإدارة: ${JSON.stringify(rules)}. إذا طلب الزائر الحجز، اجمع الاسم الكامل والبريد واسم دورة موجودة.`;
      const result = await callAi({ system: prompt, message });
      let reply = result.text;
      
      const match = reply.match(/\[\[RESERVE\Vert{}([^\vert{}]{1,120})\Vert{}([^\vert{}]{3,200})\Vert{}([^\vert{}]{1,120})\]\]/);
      if (match) {
        const [, rawName, rawEmail, rawCourse] = match;
        const name = rawName.trim();
        const email = rawEmail.trim().toLowerCase();
        const course = rawCourse.trim();
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const actualCourse = courses.find((c: any) => String(c.name).trim().toLowerCase() === course.toLowerCase());
        
        if (name.length >= 3 && validEmail && actualCourse) {
          const reservationRef = db.ref('private/reservations').push();
          await reservationRef.set({ id: reservationRef.key, name, email, course: actualCourse.name, status: 'pending_review', createdAt: new Date().toISOString(), source: 'huda' });
          reply = reply.replace(match[0], '').trim();
          reply += '\n\nوصل طلبك إلى النظام، وسيتم تأكيد التسجيل بعد مراجعة الإدارة.';
          await audit({ actor: 'huda', action: 'reservation_created', targetId: reservationRef.key, course: actualCourse.name });
        } else {
          reply = reply.replace(match[0], '').trim() + '\n\nلم أتمكن من تسجيل الطلب تلقائيًا؛ يرجى التأكد من بياناتك.';
        }
      }
      return send(res, 200, { reply, provider: result.provider });
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
    const command = safeText(body.command, 5000);
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
      return send(res, 200, { report });
    } catch (error: any) {
      return send(res, error.status || 503, { error: 'ADMIN_AI_UNAVAILABLE' });
    }
  }

  // 5. جلب وإدارة البيانات وقاعدة المعرفة
  if (action === 'data' || req.url?.includes('/api/data')) {
    const session = requireAdmin(req, res);
    if (!session) return;
    
    if (method === 'GET') {
      try {
        const [knowledge, reservations, reports, auditLog, enabled] = await Promise.all([
          getDb().ref('site/knowledge').get(),
          getDb().ref('private/reservations').limitToLast(200).get(),
          getDb().ref('private/adminReports').limitToLast(100).get(),
          getDb().ref('private/auditLog').limitToLast(100).get(),
          getDb().ref('settings/aiEnabled').get()
        ]);
        return send(res, 200, { 
          knowledge: knowledge.val() || {}, 
          reservations: reservations.val() || {}, 
          reports: reports.val() || {}, 
          auditLog: auditLog.val() || {}, 
          aiEnabled: enabled.exists() ? enabled.val() === true : true 
        });
      } catch { return send(res, 503, { error: 'DATABASE_UNAVAILABLE' }); }
    }
    
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    
    try {
      const body = parseBody(req);
      const db = getDb();
      if (body.action === 'setAiEnabled') {
        if (typeof body.enabled !== 'boolean') return send(res, 400, { error: 'BOOLEAN_REQUIRED' });
        await db.ref('settings/aiEnabled').set(body.enabled);
        await audit({ actor: session.email, action: 'ai_master_switch', enabled: body.enabled });
        return send(res, 200, { ok: true, aiEnabled: body.enabled });
      }
      if (body.action === 'saveSection') {
        const section = safeText(body.section, 80);
        if (!SECTIONS.has(section)) return send(res, 400, { error: 'SECTION_NOT_ALLOWED' });
        if (body.data === undefined) return send(res, 400, { error: 'DATA_REQUIRED' });
        await db.ref(`site/knowledge/${section}`).set(body.data);
        await audit({ actor: session.email, action: 'section_saved', section });
        return send(res, 200, { ok: true, section });
      }
      if (body.action === 'deleteReservation') {
        const id = safeText(body.id, 120);
        if (!/^[A-Za-z0-9_-]{5,120}$/.test(id)) return send(res, 400, { error: 'INVALID_ID' });
        await db.ref(`private/reservations/${id}`).remove();
        await audit({ actor: session.email, action: 'reservation_deleted', targetId: id });
        return send(res, 200, { ok: true });
      }
      return send(res, 400, { error: 'UNKNOWN_ACTION' });
    } catch { return send(res, 503, { error: 'DATABASE_UNAVAILABLE' }); }
  }

  // 6. تقييمات وتصحيحات هدى
  if (action === 'feedback' || req.url?.includes('/api/feedback')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    const session = requireAdmin(req, res);
    if (!session) return;
    
    const body = parseBody(req);
    const question = safeText(body.question, 3000);
    const hudaReply = safeText(body.hudaReply, 4000);
    const correction = safeText(body.correction, 3000);
    const verdict = body.verdict === 'correct' ? 'correct' : body.verdict === 'incorrect' ? 'incorrect' : '';
    
    if (!question || !hudaReply || !verdict || (verdict === 'incorrect' && !correction)) {
      return send(res, 400, { error: 'QUESTION_REPLY_VERDICT_AND_CORRECTION_REQUIRED' });
    }
    try {
      const db = getDb();
      const ref = db.ref('private/hudaFeedback').push();
      const item = { id: ref.key, question, hudaReply, verdict, correction: verdict === 'incorrect' ? correction : '', createdAt: new Date().toISOString(), createdBy: session.email };
      await ref.set(item);
      if (verdict === 'incorrect') {
        const rulesRef = db.ref('site/knowledge/hudaRules');
        const snap = await rulesRef.get();
        const rules = Array.isArray(snap.val()) ? snap.val() : [];
        rules.push({ id: ref.key, text: correction, approved: true, sourceFeedbackId: ref.key, createdAt: item.createdAt });
        await rulesRef.set(rules.slice(-100));
      }
      await audit({ actor: session.email, action: 'huda_feedback_saved', targetId: ref.key, verdict });
      return send(res, 200, { ok: true, feedbackId: ref.key, message: verdict === 'incorrect' ? 'تم حفظ التصحيح وسيُستخدم كتوجيه لهدى.' : 'تم حفظ التقييم.' });
    } catch { return send(res, 503, { error: 'FEEDBACK_SAVE_FAILED' }); }
  }

  // 7. إصدار رموز الشهادات
  if (action === 'issue' || req.url?.includes('/api/issue')) {
    if (method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (!requireSameOrigin(req, res)) return;
    const session = requireAdmin(req, res);
    if (!session) return;
    
    try {
      const body = parseBody(req);
      const certificateId = safeText(body.certificateId, 120);
      const recipientEmail = safeText(body.recipientEmail, 200).toLowerCase();
      const minutes = Number(body.validMinutes);
      
      if (!certificateId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        return send(res, 400, { error: 'CERTIFICATE_AND_RECIPIENT_REQUIRED' });
      }
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
        return send(res, 400, { error: 'VALID_MINUTES_MUST_BE_1_TO_10080' });
      }
      
      const db = getDb();
      const certSnap = await db.ref('site/knowledge/certificates').get();
      const certValue = certSnap.val();
      const certificateFound = certValue && (certValue[certificateId] || Object.values(certValue).some((c: any) => c && String(c.id || c.certificateId || '') === certificateId));
      
      if (!certificateFound) return send(res, 404, { error: 'CERTIFICATE_NOT_FOUND' });
      
      const code = randomCode(12);
      const ref = db.ref('private/certificateTokens').push();
      await ref.set({ codeHash: hash(code), certificateId, recipientEmail, expiresAt: Date.now() + minutes * 60000, usedAt: null, createdAt: new Date().toISOString(), createdBy: session.email });
      await audit({ actor: session.email, action: 'certificate_token_issued', targetId: ref.key, certificateId, recipientEmail, validMinutes: minutes });
      
      return send(res, 200, { tokenId: ref.key, code, expiresAt: Date.now() + minutes * 60000 });
    } catch { return send(res, 503, { error: 'CERTIFICATE_SERVICE_UNAVAILABLE' }); }
  }

  return send(res, 404, { error: 'ENDPOINT_NOT_FOUND' });
}
