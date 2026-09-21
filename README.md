# برنامج البرمجة للأطفال - صفحة تقديم + لوحة أدمن

موقع بسيط من صفحتين:
1. **صفحة عامة** (`/`) — صفحة تعريفية بالبرنامج + فورم تقديم للأطفال من 8 لـ 16 سنة.
2. **لوحة أدمن** (`/admin`) — تسجيل دخول بحساب أدمن واحد بس (مفيش تسجيل ذاتي)، تقدر منها تشوف كل المتقدمين، تتواصل معاهم بضغطة واحدة (اتصال/واتساب)، تغيّر حالة كل طلب (جديد/تم التواصل/مسجل/مرفوض)، تكتب ملاحظات، وتصدّر الكل Excel/CSV.

## التشغيل محليًا

```
npm install
cp .env.example .env   # واملا القيم
npm run migrate
npm start
```

## الرفع على Supabase + Replit + GitHub

نفس بالظبط الخطوات اللي عملناها في مشروع Code Academy:

1. **قاعدة البيانات**: تقدر تستخدم نفس مشروع Supabase بتاع Code Academy (المشروع ده هيضيف جداوله الخاصة، كلها مبدوءة بـ `program_` عشان متتلخبطش مع جداول Code Academy)، أو تعمل مشروع Supabase جديد لو عايز تفصلهم تمامًا. في الحالتين، استخدم رابط **Session Pooler** (پورت 5432) في `DATABASE_URL`.
2. **GitHub**: اعمل ريبو جديد فاضي، وابعت له الكود بنفس أوامر git اللي استخدمناها قبل كده (`git init` / `add` / `commit` / `branch -M main` / `remote add origin` / `push -u origin main`).
3. **Replit**: Import from GitHub، حط الـ Secrets دي في **Deployment secrets** (مش الـ Secrets العادية بس):
   - `DATABASE_URL`
   - `SESSION_SECRET` (أي نص عشوائي طويل)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `PROGRAM_NAME` (اختياري، تقدر تغيره بعدين من لوحة الأدمن)
4. في Shell بتاع Replit: `npm install` ثم `npm run migrate`.
5. Publish / Deploy زي ما عملت قبل كده.
6. افتح `/admin/login` وسجل دخول بـ `ADMIN_USERNAME`/`ADMIN_PASSWORD`.

## تخصيص سريع

- **اسم البرنامج والوصف**: من `/admin/settings` بعد تسجيل الدخول (من غير ما تحتاج تعدل كود).
- **قايمة المحافظات، مدى السن (8-16)، صيغة رقم الموبايل**: في ملف `utils/constants.js`.
- **قيمة المصاريف الإدارية (400 جنيه) ونص الإقرار**: في `views/index.ejs` — دوّر على `terms_acknowledged`.
- **إضافة أدمن تاني**: `node scripts/create_admin.js <username> <password>`.

## ملاحظة أمان

مفيش أي تسجيل ذاتي لحساب أدمن — الحساب الوحيد بيتعمل تلقائي من `ADMIN_USERNAME`/`ADMIN_PASSWORD` في متغيرات البيئة أول ما السيرفر يشتغل.
