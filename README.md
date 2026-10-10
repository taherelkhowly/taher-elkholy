# Taher Office — HTML/CSS/JavaScript for GitHub Pages

هذه نسخة ثابتة من واجهة Taher Office، دون Next.js أو خادم Node.js. تحتوي على صفحات HTML مستقلة وCSS وJavaScript، ويمكن نشرها مباشرة على GitHub Pages.

## الملفات
- `index.html` الصفحة الرئيسية.
- `requests.html`, `services.html`, `citizens.html`, `beneficiaries.html`, `events.html` صفحات إدارة السجلات.
- `reports.html`, `print.html`, `audit-log.html` التقارير والطباعة وسجل الحركات التأسيسي.
- `assets/style.css` التنسيقات.
- `assets/app.js` سلوك الواجهة.
- `config.js` إعدادات Supabase (فارغة افتراضيًا).
- `database-schema.sql` مخطط الجداول الأصلي لتراجعه وتطبقه في Supabase SQL Editor.

## النشر على GitHub Pages
1. أنشئ مستودع GitHub جديدًا، ويفضّل أن يكون Private أثناء التجهيز.
2. ارفع محتويات هذا المجلد إلى جذر المستودع (يجب أن يكون `index.html` في الجذر).
3. افتح **Settings → Pages**.
4. في **Build and deployment** اختر **Deploy from a branch**، ثم الفرع `main` والمجلد `/ (root)`، واضغط Save.
5. انتظر اكتمال النشر ثم افتح رابط GitHub Pages الذي يعرضه GitHub.

## ربط Supabase (اختياري)
1. أنشئ أو افتح مشروعك في Supabase.
2. افتح SQL Editor، وراجع `database-schema.sql` ثم نفّذه بعد التأكد من أنه مناسب لمشروعك.
3. من **Project Settings → API** انسخ Project URL والمفتاح العام `anon`/`publishable` فقط.
4. ضع القيم في `config.js`:
   ```js
   window.TAHER_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT.supabase.co",
     supabaseAnonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
   };
   ```
5. ارفع `config.js` بعد التعديل. تعتمد الواجهة على مكتبة Supabase JS المحمّلة من CDN، لذا يلزم اتصال إنترنت.

### أمان قاعدة البيانات
- **ممنوع وضع `service_role` أو مفاتيح سرية في `config.js` أو أي ملف يصل إلى المتصفح.**
- الموقع الثابت لا يخفي إعداداته؛ كل ما في JavaScript يمكن للزوار الاطلاع عليه.
- مخطط قاعدة البيانات يفعّل RLS ولا يفتح سياسات قراءة/كتابة عامة. لذلك قد تظهر أخطاء رفض وصول إلى أن تضيف Supabase Auth وسياسات RLS محددة للأدوار المطلوبة.
- لا ترفع بيانات مواطنين فعلية أو صور بطاقات هوية إلى GitHub. لا تفتح قاعدة البيانات للعامة ولا تسمح بعمليات الكتابة المجهولة على بيانات حقيقية.
- قبل استخدام بيانات فعلية، فعّل تسجيل الدخول، واكتب سياسات RLS مناسبة، واختبرها بحسابات مختلفة.

## سلوك التخزين
إذا تركت إعدادات Supabase فارغة، تعمل الواجهة بوضع تجريبي محلي باستخدام `localStorage` في المتصفح الحالي فقط. هذا ليس نسخًا احتياطيًا، ولا يزامن بين الأجهزة، وقد تضيع البيانات عند مسح بيانات المتصفح. لا تستخدم الوضع المحلي لبيانات العمل الحقيقية.

## ملاحظات
- كل شيء هنا واجهة HTML/CSS/JavaScript؛ لا توجد واجهة OCR السحابية الأصلية لأنها كانت تعتمد على API في خادم Next.js. لم تُضمّن مفاتيح API أو ملفات `.env`.
- استخدم HTTPS (يوفره GitHub Pages) عند ربط Supabase.
