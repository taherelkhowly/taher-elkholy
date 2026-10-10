import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});

type ImageInput = { mimeType: string; data: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "يجب تسجيل الدخول أولًا." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!supabaseUrl || !anonKey || !geminiKey) {
      return json({ error: "إعدادات الوظيفة ناقصة. تحقق من مفاتيح Supabase وGEMINI_API_KEY." }, 500);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData.user) return json({ error: "جلسة الدخول غير صالحة. سجّل الدخول مجددًا." }, 401);

    const body = await req.json();
    const images: Array<{ side: string; image: ImageInput }> = [];
    for (const [key, side] of [["front", "وجه البطاقة"], ["back", "ظهر البطاقة"]] as const) {
      const image = body?.[key] as ImageInput | undefined;
      if (!image?.data) continue;
      if (!/^image\/(jpeg|png|webp)$/.test(image.mimeType || "")) return json({ error: "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP." }, 400);
      if (typeof image.data !== "string" || image.data.length > 7_000_000) return json({ error: "حجم الصورة كبير جدًا. قلل حجمها ثم حاول مرة أخرى." }, 413);
      images.push({ side, image });
    }
    if (!images.length) return json({ error: "لم يتم إرسال صورة بطاقة." }, 400);

    const parts: unknown[] = [{ text: `أنت نظام استخراج بيانات من صورة بطاقة رقم قومي مصرية. استخرج فقط ما يظهر بوضوح، ولا تخمّن ولا تكمل بيانات غير مقروءة. أعد JSON فقط بالمفاتيح التالية وكل قيمة نصية أو سلسلة فارغة: citizen_name (الاسم بالعربية كما يظهر)، national_id (14 رقمًا إن كانت مقروءة، مع تحويل الأرقام العربية إلى 0-9)، address (العنوان)، district (القسم/المركز إن ظهر)، governorate (المحافظة إن ظهرت)، birth_date (تاريخ الميلاد بصيغة YYYY-MM-DD فقط إذا أمكن استخراجه بثقة)، job (الوظيفة إن ظهرت)، raw_text (النص المقروء كاملًا). لا تستنتج الاسم من عنوان أو رقم. الصور التالية قد تكون وجه البطاقة أو ظهرها؛ اجمع ما يظهر فقط. كل الحقول نصوص، وأعد JSON صالحًا بلا markdown.` }];
    for (const { side, image } of images) {
      parts.push({ text: `الصورة التالية: ${side}` });
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              citizen_name: { type: "STRING" }, national_id: { type: "STRING" },
              address: { type: "STRING" }, district: { type: "STRING" },
              governorate: { type: "STRING" }, birth_date: { type: "STRING" },
              job: { type: "STRING" }, raw_text: { type: "STRING" },
            },
            required: ["citizen_name", "national_id", "address", "district", "governorate", "birth_date", "job", "raw_text"],
          },
        },
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini API error", response.status, detail.slice(0, 500));
      return json({ error: response.status === 429 ? "تم تجاوز حد الاستخدام مؤقتًا. انتظر قليلًا ثم حاول." : "تعذر على خدمة القراءة معالجة الصورة. جرّب صورة أوضح." }, 502);
    }
    const result = await response.json();
    const output = result?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
    if (!output) return json({ error: "لم يتم استخراج نص من الصورة. جرّب صورة أوضح." }, 422);
    const parsed = JSON.parse(output);
    const normalizeDigits = (value: unknown) => String(value ?? "").replace(/[٠-٩۰-۹]/g, (d) => "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) < 10 ? String("٠١٢٣٤٥٦٧٨٩".indexOf(d)) : String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    parsed.national_id = normalizeDigits(parsed.national_id).replace(/\D/g, "");
    return json({ data: parsed });
  } catch (error) {
    console.error("read-id-card error", error);
    return json({ error: "حدث خطأ أثناء قراءة البطاقة. حاول مرة أخرى." }, 500);
  }
});
