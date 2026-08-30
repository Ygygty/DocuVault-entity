# دليل التشغيل المحلي أوفلاين بالكامل بدون Docker
# DocuVault - Standalone Offline Deployment Guide (No Docker Required)

تم تصميم هذا الدليل لتشغيل نظام **DocuVault** على جهازك المحلي (Windows / Mac / Linux) بشكل كامل **Offline وبدون الحاجة لتثبيت Docker أو PostgreSQL أو PHP**.

---

## ⚡ خيارات التشغيل المحلي السريع (Quickstart)

### الخيار 1: نظام Windows (بنقرة واحدة)
1. قم بفك ضغط الملف المضغوط على جهازك.
2. انقر نقراً مزدوجاً على ملف: **`run-offline.bat`**
3. سيقوم السكريبت بفحص وجود Node.js وتثبيت الحزم وفتح المتصفح تلقائياً على الرابط: `http://localhost:3000`.

---

### الخيار 2: أنظمة macOS و Linux
1. افتح مبدل الأوامر (Terminal) في مجلد المشروع.
2. امنح صلاحية التشغيل وشغل السكريبت:
```bash
chmod +x run-offline.sh
./run-offline.sh
```
3. سيتم تشغيل الخادم وفتح المتصفح تلقائياً على `http://localhost:3000`.

---

### الخيار 3: التشغيل اليدوي عبر npm
المتطلب الوحيد: تثبيت [Node.js](https://nodejs.org) (الإصدار 18 أو أحدث).

```bash
# 1. تثبيت الحزم (مرة واحدة فقط)
npm install

# 2. تشغيل النظام في وضع التطوير أوفلاين
npm run dev

# 3. أو بناء نسخة الإنتاج وتشغيلها
npm run build
npm start
```
افتح المتصفح على: `http://localhost:3000`

---

## 🔧 حل مشكلة "Cannot find native binding" أثناء `npm run build`
إذا ظهر لك خطأ متعلق بـ `@tailwindcss/oxide` أو `Cannot find native binding`، فهذا بسبب تثبيت ناقص للحزم الاختيارية المناسبة لنظام التشغيل الحالي. الحل البسيط:

```bash
# حذف مجلد الحزم وملف القفل وإعادة التثبيت النظيف
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🌟 ميزات الوضع المحلي الأوفلاين (Offline Capabilities)
1. **فحص المجلدات الحقيقية على القرص الصلب (Real Local Disk Scanning)**:
   - يمكنك تحديد مجلد حقيقي من جهازك (عبر File System API أو خادم Node.js) وسيقوم النظام بحساب الـ SHA-256 للملفات واكتشاف التعديلات تلقائياً.
2. **حفظ دائم محلياً (Local-First Persistence)**:
   - يتم حفظ كافة الوثائق وسجلات الفحص والإصدارات على المتصفح (IndexedDB / LocalStorage) وفي ملف `data/docuvault_local_db.json`.
3. **مقارنة التغييرات بصرياً (Side-by-Side Visual Diff)**:
   - قارن أي نسختين من أي ملف مع إبراز الأسطر المضافة والمحذوفة بدقة.
4. **تطبيق سياسة الاحتفاظ بـ 200 إصدار (Retention Policy)**:
   - الحفاظ على 200 إصدار كحد أقصى مع حذف الإصدار الأقدم تلقائياً دون إعادة الترقيم.
5. **تصدير واستيراد النسخ الاحتياطية (JSON Backup Export/Import)**:
   - حفظ نسخة من قاعدة البيانات ونقلها لأي جهاز آخر بضغطة زر.
