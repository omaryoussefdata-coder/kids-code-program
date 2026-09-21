# تشغيل المشروع على Replit

- التطبيق يعمل عبر workflow باسم `Start application`.
- أمر التشغيل: `PORT=5000 npm start`.
- تجهيز أو تحديث جداول PostgreSQL: `npm run migrate`.
- الصفحة العامة: `/`
- تسجيل دخول الإدارة: `/admin/login`
- يعتمد التشغيل على Secrets: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
- اسم البرنامج الاختياري يُقرأ من `PROGRAM_NAME` ويمكن تغييره لاحقًا من إعدادات لوحة الإدارة.