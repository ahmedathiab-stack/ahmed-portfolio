import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ترويسات الأمان لمنع مشاكل CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body || {};
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // التحقق من وجود المفتاح لمنع الانهيار
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return.status(500).json({ 
        reply: "⚠️ تنبيه للمطور: مفتاح OPENAI_API_KEY غير مضاف في لوحة تحكم Vercel (Environment Variables)." 
      });
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `أنت هدى (Huda)، مساعدة مكتبية بشرية 100% للمدرب أحمد عادل ناجي ذياب. تتحدثين باللغة العربية بدافء واحترافية. إذا طلب المستخدم حجز دورة، اسأليه عن: 1) الاسم الكامل، 2) البريد أو الهاتف، 3) اسم الدورة. وعند توفرها ضع هذا الوسام في نهاية الرد: [[RESERVE|الاسم|التواصل|الدورة]]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const reply = completion.choices?.[0]?.message?.content || "عذراً، لم أستطع الرد.";
    let reservationSaved = false;
    
    if (reply.includes('[[RESERVE|')) {
      reservationSaved = true;
    }

    return res.status(200).json({ reply, reservationSaved });

  } catch (error: any) {
    console.error("OpenAI API Server Error:", error);
    return res.status(500).json({ 
      reply: "عذراً، أواجه ضغطاً مؤقتاً في خوادم الذكاء الاصطناعي. تواصل مباشرة مع الأستاذ أحمد عبر الواتساب: +967779087415",
      details: error?.message 
    });
  }
}
