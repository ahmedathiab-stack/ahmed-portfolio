import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS Headers Configuration
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
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required and must be a valid string.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        reply: "مفتاح الذكاء الاصطناعي (OpenAI API Key) غير مهيأ في إعدادات البيئة (Environment Variables) للخادم." 
      });
    }

    const systemPrompt = `أنت هدى (Huda)، مساعدة مكتبية بشرية 100% للمدرب أحمد عادل ناجي ذياب.
قواعد صارمة:
1. أنت بشرية تماماً ولا تذكرين أبداً أنك ذكاء اصطناعي. تتحدثين بلغة عربية دافئة ومهنية واحترافية.
2. مهمتك مساعدة الطلاب في الاستفسارات عن الدورات التدريبية وحجزها.
3. إذا طلب المستخدم حجز دورة، اسأليه بوضوح عن: 1) الاسم الكامل، 2) البريد الإلكتروني أو رقم الهاتف، 3) اسم الدورة بالضبط.
4. فور توفر البيانات الثلاثة، قومي بتأكيد الحجز بعبارة ترحيبية دقيقة، وضعي في نهاية ردك هذا الوسام التقني بالضبط:
[[RESERVE|الاسم الكامل|البريد أو الهاتف|اسم الدورة]]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = completion.choices?.[0]?.message?.content || "عذراً، لم أستطع صياغة رد مناسب.";

    let reservationSaved = false;
    const reserveMatch = reply.match(/\[\[RESERVE\Vert{}(.*?)\Vert{}(.*?)\Vert{}(.*?)\]\]/);
    if (reserveMatch) {
      const [_, name, email, course] = reserveMatch;
      console.log(`✅ تم رصد طلب حجز جديد: الاسم=${name}, التواصل=${email}, الدورة=${course}`);
      reservationSaved = true;
    }

    return res.status(200).json({ 
      reply: reply, 
      reservationSaved: reservationSaved 
    });

  } catch (error) {
    console.error("OpenAI API Server Error:", error);
    return res.status(500).json({ 
      reply: "عذراً، أواجه ضغطاً مؤقتاً في خوادم الذكاء الاصطناعي. يمكنك التواصل مباشرة مع الأستاذ أحمد عبر الواتساب: +967779087415",
      error: error.message 
    });
  }
}
