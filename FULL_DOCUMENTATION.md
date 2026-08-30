# التوثيق الشامل لنظام DocuVault Enterprise
## نظام أرشفة وإدارة إصدارات الملفات ومراقبة التغييرات (File Versioning & Monitoring System)

---

## 1. نظرة عامة والهدف من المشروع (Executive Summary)

**DocuVault** هو نظام مؤسسي متكامل مصمم لمراقبة المجلدات ومسارات التخزين على الأقراص الصلبة، واكتشاف أي ملفات جديدة أو معدلة أو محذوفة تلقائياً عبر فحص البصمة الثنائية **SHA-256**، ثم أرشفة الإصدارات تاريخياً مع الحفاظ على سجل زمني دقيق لكل تعديل (Audit Trail)، وتوفير مقارنة بصرية سطرية (Side-by-Side Visual Diff) وإمكانية استرجاع أي إصدار سابق بضغطة زر.

### الأهداف الجوهرية للنظام:
1. **أتمتة الفحص الدوري (Automated Monitoring)**: فحص مجلدات محددة على فترات زمنية مجدولة (عبر Artisan Command و Scheduler).
2. **منع تكرار الإصدارات المتطابقة (Zero-Redundancy via Content Hashing)**: لا يتم إنشاء إصدار جديد إلا عند تغير بصمة المحتوى الحقيقية (SHA-256).
3. **سياسة الاحتفاظ الذكية (Retention Policy)**: الحفاظ على 200 إصدار كحد أقصى لكل وثيقة تلقائياً مع حذف الإصدار الأقدم دون إعادة ترقيم أو كسر السجل التاريخي.
4. **المقارنة البصرية الفورية (Visual Diff Engine)**: مقارنة أي نسختين من أي ملف وإبراز الأسطر المضافة والمحذوفة والمعدلة.
5. **مرونة التشغيل الكاملة (Dual Deployment Modes)**:
   - **وضع الإنتاج المؤسسي (Production Mode)**: يعتمد على Laravel 11 + PostgreSQL 16 + Redis + Docker.
   - **الوضع المحلي الأوفلاين (Standalone Offline Mode)**: يعتمد على محرك Node.js / React Local-First بدون الحاجة إلى Docker أو خوادم خارجية.

---

## 2. البنية المعمارية للنظام (System Architecture)

يتكون النظام من طبقات متكاملة تضمن الأداء العالي وفصل المسؤوليات:

```
+-------------------------------------------------------------------------+
|                           User Interface (UI)                           |
|       React 18 + Tailwind CSS + Lucide Icons + Visual Diff Viewer       |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-----------------------------+             +-----------------------------+
|    Laravel Enterprise Core  |             |  Node.js Standalone Engine  |
|  - PHP 8.3 & Laravel 11     |             |  - Express REST Backend     |
|  - Storage Engine           |             |  - Native File System API   |
|  - File Scanner Service     |             |  - Local JSON / Local-First |
|  - Retention Policy Service |             |  - 100% Offline (No Docker) |
+--------------+--------------+             +-----------------------------+
               |
    +----------+----------+
    |                     |
    v                     v
+----------------+  +---------------+  +----------------------------------+
| PostgreSQL 16  |  | Redis Queue   |  | Private Storage Disk             |
| (Relational DB)|  | & Cache       |  | /storage/app/documents/{uuid}/.. |
+----------------+  +---------------+  +----------------------------------+
```

---

## 3. دورة حياة الفحص واكتشاف التعديلات (Scanning Lifecycle)

عند تشغيل أمر الفحص (سواء يدوياً أو عبر المجدول التلقائي):

```
1. استرجاع مسارات الفحص المفعلة (Active Scan Paths) من قاعدة البيانات.
   ↓
2. مسح شجرة المجلدات بشكل تكراري (Recursive Directory Traversal).
   ↓
3. استخراج معلومات الملف (الاسم، الحجم، المسار النسبي، تاريخ التعديل).
   ↓
4. قراءة محتوى الملف وحساب بصمة SHA-256 للملف ومحتواه المستخرج.
   ↓
5. البحث عن سجل الوثيقة في جدول `documents` عبر (scan_path_id + relative_path):
   ├── أ) حالة الوثيقة جديدة (Not Found):
   │     - إنشاء سجل جديد في جدول `documents` برقم UUID فريد.
   │     - حفظ الملف في مسار التخزين المنعزل `documents/{uuid}/versions/1.{ext}`.
   │     - إنشاء سجل الإصدار رقم (1) في `document_versions`.
   │     - تحديث `latest_version_id` و `versions_count = 1`.
   │
   └── ب) حالة الوثيقة موجودة مسبقاً (Existing Document):
         - مقارنة SHA-256 الحالي مع SHA-256 لآخر إصدار (`latest_version`).
         - [المحتوى مطابق]: تحديث `last_seen_at` دون إنشاء إصدار (توفير المساحة).
         - [المحتوى مختلف]:
             * إنشاء رقم إصدار جديد `next_version = latest_version + 1`.
             * حفظ الملف في مسار التخزين `documents/{uuid}/versions/{next_version}.{ext}`.
             * تطبيق سياسة الاحتفاظ (Retention Policy): فحص عدد الإصدارات؛ إذا تجاوز 200، حذف أقدم إصدار.
             * تحديث `latest_version_id` وزيادة العداد.
   ↓
6. تسجيل إحصائيات الفحص الشاملة في جدول `scan_logs` (عدد الملفات الممسوحة، المنشأة، المحدثة، غير المتغيرة، والأخطاء).
```

---

## 4. مخطط قاعدة البيانات والعلاقات (Database Schema)

### 1. جدول مسارات الفحص (`scan_paths`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | BigInteger (PK) | المعرف الأساسي |
| `name` | String | اسم المسار التعريفي |
| `path` | String | المسار المطلق على القرص الصلب |
| `is_active` | Boolean | حالة تفعيل الفحص التلقائي |
| `scan_interval_minutes` | Integer | الفاصل الزمني بالدقائق |
| `allowed_extensions` | JSON / Text | الصيغ المسموح بفحصها (.txt, .docx, .json ..) |
| `last_scanned_at` | Timestamp | تاريخ آخر فحص ناجح |
| `created_at` / `updated_at` | Timestamp | طوابع الإنشاء والتعديل |

### 2. جدول الوثائق الرئيسية (`documents`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | BigInteger (PK) | المعرف الأساسي |
| `uuid` | UUID (Unique) | معرف عشوائي فريد لمسار التخزين الآمن |
| `scan_path_id` | Foreign Key | رابط مع جدول `scan_paths` |
| `filename` | String | اسم الملف الأصلي |
| `relative_path` | String | المسار النسبي داخل مجلد الفحص |
| `extension` | String | صيغة الملف (docx, txt, json ..) |
| `mime_type` | String | نوع وسائط MIME |
| `status` | Enum | `active` (موجود) أو `missing` (محذوف من القرص) |
| `latest_version_id` | Foreign Key | رابط لآخر إصدار مسجل |
| `versions_count` | Integer | إجمالي عدد الإصدارات المحفوظة |
| `first_seen_at` | Timestamp | أول تاريخ لاكتشاف الملف |
| `last_seen_at` | Timestamp | آخر فحص تم فيه تأكيد وجود الملف |

### 3. جدول إصدارات الوثائق (`document_versions`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | BigInteger (PK) | المعرف الأساسي |
| `document_id` | Foreign Key | رابط مع الوثيقة الأم في `documents` |
| `version_number` | Integer | رقم الإصدار التسلسلي التصاعدي (1, 2, 3, ..) |
| `original_filename` | String | اسم الملف عند أخذ النسخة |
| `storage_disk` | String | القرص التخزيني (private / local) |
| `storage_path` | String | المسار الفعلي للملف المؤرشف |
| `file_size` | BigInteger | حجم الملف بالبايت |
| `file_hash` | String(64) | بصمة SHA-256 الثنائية للملف |
| `content_hash` | String(64) | بصمة SHA-256 للنص المستخرج |
| `extracted_content` | LongText | المحتوى النصي المفهرس والمستخرج للمقارنة والبحث |
| `source_modified_at` | Timestamp | تاريخ آخر تعديل للملف على القرص الصلب |
| `change_summary` | String | وصف ملخص لسبب أو نوع التعديل |

### 4. جدول سجلات عمليات الفحص (`scan_logs`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | BigInteger (PK) | المعرف الأساسي |
| `scan_path_id` | Foreign Key | المسار المفحوص |
| `started_at` / `finished_at` | Timestamp | وقت بداية ونهاية العملية |
| `files_scanned` | Integer | عدد الملفات التي تم مسحها |
| `files_created` | Integer | عدد الوثائق الجديدة التي أضيفت |
| `files_updated` | Integer | عدد الوثائق التي تغيرت وتم تسجيل إصدار لها |
| `files_unchanged` | Integer | عدد الملفات المتطابقة بدون تغيير |
| `files_missing` | Integer | عدد الملفات التي لم تعد موجودة على القرص |
| `errors_count` | Integer | عدد الأخطاء أثناء الفحص |
| `status` | Enum | `running`, `completed`, `failed` |

---

## 5. خوارزمية سياسة الاحتفاظ بـ 200 إصدار (Retention Engine)

```php
// منطق تطبيق سياسة الـ 200 إصدار في Laravel
public function applyRetentionPolicy(Document $document, int $maxVersions = 200): int
{
    $totalVersions = $document->versions()->count();
    
    if ($totalVersions <= $maxVersions) {
        return 0;
    }
    
    $excessCount = $totalVersions - $maxVersions;
    
    // جلب أقدم الإصدارات مع استثناء الإصدار الأخير النشط
    $oldestVersions = $document->versions()
        ->where('id', '!=', $document->latest_version_id)
        ->orderBy('version_number', 'asc')
        ->limit($excessCount)
        ->get();
        
    $deletedCount = 0;
    foreach ($oldestVersions as $version) {
        // 1. حذف الملف الفعلي من قرص التخزين
        if (Storage::disk($version->storage_disk)->exists($version->storage_path)) {
            Storage::disk($version->storage_disk)->delete($version->storage_path);
        }
        // 2. حذف السجل من قاعدة البيانات
        $version->delete();
        $deletedCount++;
    }
    
    $document->update(['versions_count' => $document->versions()->count()]);
    return $deletedCount;
}
```

---

## 6. واجهة برمجة التطبيقات (REST API Endpoints)

| المسار (Endpoint) | الطريقة (Method) | الوصف | المعاملات (Parameters) |
| :--- | :--- | :--- | :--- |
| `/api/documents` | `GET` | استرجاع قائمة الوثائق | `search`, `status`, `scan_path_id`, `page` |
| `/api/documents/{id}` | `GET` | استرجاع تفاصيل وثيقة مع كامل إصداراتها | المعرف `id` |
| `/api/documents/{id}/versions` | `GET` | استرجاع كافة إصدارات وثيقة معينة | المعرف `id` |
| `/api/documents/{id}/versions/{v1}/diff/{v2}` | `GET` | مقارنة برمجية بين نسختين من الوثيقة | `id`, `v1`, `v2` |
| `/api/documents/{id}/versions/{versionId}/download` | `GET` | تحميل الملف المؤرشف لإصدار معين | `id`, `versionId` |
| `/api/scan-paths` | `GET` / `POST` | استرجاع أو إضافة مسار فحص جديد | `name`, `path`, `allowed_extensions` |
| `/api/scan-paths/{id}/trigger` | `POST` | تشغيل فحص فوري للمسار المحدد | المعرف `id` |
| `/api/scan-logs` | `GET` | استرجاع سجلات الفحص التاريخية | `scan_path_id`, `limit` |
| `/api/system/status` | `GET` | حالة النظام والإحصائيات التخزينية | - |

---

## 7. أوامر سطر الأوامر (Artisan CLI & Automation)

1. **فحص مسارات المجلدات فوراً**:
   ```bash
   # فحص كافة المسارات المفعلة
   php artisan docuvault:scan-paths

   # فحص مسار محدد بواسطة المعرف
   php artisan docuvault:scan-paths --path-id=1

   # فحص مجلد مخصص مع إنشاء وثائقه فوراً
   php artisan docuvault:scan-paths --custom-path=/var/data/shared_docs
   ```

2. **تشغيل المجدول الزمني التلقائي (Background Scheduler)**:
   ```bash
   php artisan schedule:work
   ```

3. **تشغيل طابور معالجة فحص الملفات (Queue Worker)**:
   ```bash
   php artisan queue:work --queue=document-scanning,default
   ```

---

## 8. خيارات التشغيل والنشر (Deployment Guide)

### الخيار أ: التشغيل المحلي المستقل بدون Docker (100% Offline Standalone)
- **لمستخدمي Windows**: انقر مرتين على ملف `run-offline.bat`.
- **لمستخدمي Mac / Linux**: نفذ الأمر `./run-offline.sh`.
- **عبر npm**:
  ```bash
  npm install
  npm run dev
  ```
- **المتصفح**: يفتح تلقائياً على `http://localhost:3000`.

---

### الخيار ب: تشغيل بيئة الإنتاج الكاملة مع Docker & Laravel
```bash
# 1. بناء وتشغيل الحاويات في الخلفية
docker compose up -d --build

# 2. تشغيل هجرات قاعدة البيانات
docker compose exec app php artisan migrate --seed

# 3. فتح لوحة التحكم
http://localhost:8000
```
