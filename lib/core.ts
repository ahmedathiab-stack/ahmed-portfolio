export function requireSameOrigin(req: VercelRequest, res: VercelResponse): boolean {
  // السماح بطلبات القراءة وتجاوز الفحص في بيئة التطوير المحلي
  if (req.method === 'GET' || process.env.NODE_ENV === 'development') return true;

  const expected = process.env.APP_ORIGIN;
  const origin = req.headers.origin;
  if (!expected || !origin || origin !== expected) {
    send(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
    return false;
  }
  return true;
}
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE = 'huda_admin_session';
const SESSION_SECONDS = 60 * 60 * 4;

export const SECTIONS = new Set([
  'personalInfo', 'certificates', 'experiences', 'skills', 
  'volunteer', 'courses', 'links', 'hudaRules', 'hudaFeedback'
]);

export function send(res: VercelResponse, status: number, body: Record<string, any>): void {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function parseBody(req: VercelRequest): any {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export function getDb(): admin.database.Database {
  if (!process.env.FIREBASE_DATABASE_URL || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('FIREBASE_ENV_MISSING');
  }
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  return admin.database();
}

export function hash(value: string): string {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function safeText(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function randomCode(bytes = 18): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function clientRateKey(req: VercelRequest, scope: string): string {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = String(req.headers['x-real-ip'] || forwarded || 'unknown').slice(0, 100);
  return `${scope}:${hash(ip)}`;
}

export async function allowRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const ref = getDb().ref(`private/rateLimits/${hash(key)}`);
  const tx = await ref.transaction((current: any) => {
    const now = Date.now();
    if (!current || !Number.isFinite(current.startedAt) || now - current.startedAt >= windowMs) {
      return { startedAt: now, count: 1, blocked: false };
    }
    if (current.blocked || current.count >= maxRequests) {
      return { ...current, blocked: true };
    }
    return { ...current, count: current.count + 1, blocked: false };
  });
  const value = tx.snapshot.val();
  return Boolean(tx.committed && value && !value.blocked && value.count <= maxRequests);
}

export function requireSameOrigin(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.APP_ORIGIN;
  const origin = req.headers.origin;
  if (!expected || !origin || origin !== expected) {
    send(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
    return false;
  }
  return true;
}

export function adminSession(req: VercelRequest): { role: 'admin'; email: string } | null {
  const cookieHeader = req.headers.cookie || '';
  const raw = cookieHeader.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw || !process.env.ADMIN_SESSION_SECRET) return null;
  try {
    const payload = jwt.verify(decodeURIComponent(raw), process.env.ADMIN_SESSION_SECRET) as any;
    return payload?.role === 'admin' ? payload : null;
  } catch { return null; }
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): any | null {
  const session = adminSession(req);
  if (!session) {
    send(res, 401, { error: 'ADMIN_LOGIN_REQUIRED' });
    return null;
  }
  return session;
}

export function setAdminCookie(res: VercelResponse, email: string): void {
  const token = jwt.sign({ role: 'admin', email }, process.env.ADMIN_SESSION_SECRET!, { expiresIn: SESSION_SECONDS });
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`);
}

export function clearAdminCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

export async function checkLogin(email?: string, password?: string, totp?: string): Promise<string | null> {
  const expectedEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const hashValue = process.env.ADMIN_PASSWORD_HASH || '';
  const secret = process.env.ADMIN_TOTP_SECRET || '';
  if (!expectedEmail || !hashValue || !secret || !process.env.ADMIN_SESSION_SECRET) throw new Error('ADMIN_ENV_MISSING');
  const emailOk = String(email || '').trim().toLowerCase() === expectedEmail;
  const passOk = await bcrypt.compare(String(password || ''), hashValue);
  const totpOk = /^\d{6}$/.test(String(totp || '')) && authenticator.check(String(totp), secret);
  return emailOk && passOk && totpOk ? expectedEmail : null;
}

export async function audit(event: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.ref('private/auditLog').push({ ...event, at: new Date().toISOString() });
}

export async function isAiEnabled(): Promise<boolean> {
  const snap = await getDb().ref('settings/aiEnabled').get();
  return snap.exists() ? snap.val() === true : true;
}

export async function callAi({ system, message, modelHint }: { system: string; message: string; modelHint?: string }): Promise<{ text: string; provider: string }> {
  let providers: any[];
  try { providers = JSON.parse(process.env.AI_PROVIDERS_JSON || '[]'); } catch { throw new Error('AI_PROVIDERS_JSON_INVALID'); }
  const candidates = Array.isArray(providers) ? providers.filter(p => p && p.baseUrl && p.model && Array.isArray(p.keys) && p.keys.some(k => typeof k === 'string' && k.trim())) : [];
  if (!candidates.length) throw new Error('AI_PROVIDERS_NOT_CONFIGURED');
  
  const attempts: { provider: any; key: string }[] = [];
  for (const provider of candidates) {
    for (const key of provider.keys.filter((k: any) => typeof k === 'string' && k.trim())) {
      attempts.push({ provider, key: key.trim() });
    }
  }
  
  const start = Math.floor(Math.random() * attempts.length);
  const ordered = attempts.slice(start).concat(attempts.slice(0, start));
  let lastStatus = 502;
  
  for (const item of ordered) {
    try {
      const response = await fetch(item.provider.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${item.key}` },
        body: JSON.stringify({
          model: modelHint || item.provider.model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: message }],
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) return { text: content, provider: item.provider.name || 'configured-provider' };
        lastStatus = 502;
        continue;
      }
      lastStatus = response.status;
      if ([400, 401, 403, 408, 409, 429, 500, 502, 503, 504].includes(response.status)) continue;
      break;
    } catch {
      lastStatus = 502;
    }
  }
  export function requireSameOrigin(req: VercelRequest, res: VercelResponse): boolean {
  // السماح لطلبات القراءة GET بالمرور فوراً لتجنب مشاكل المتصفح
  if (req.method === 'GET') return true;

  const expected = process.env.APP_ORIGIN;
  const origin = req.headers.origin;
  if (!expected || !origin || origin !== expected) {
    send(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
    return false;
  }
  return true;
}
  const error: any = new Error('ALL_AI_KEYS_FAILED');
  error.status = lastStatus === 429 ? 503 : 502;
  throw error;
}
