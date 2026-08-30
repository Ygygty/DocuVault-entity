import React, { useState } from 'react';
import { 
  Layers, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  GitBranch, 
  Cpu, 
  FileCode, 
  CheckCircle2, 
  ArrowDown, 
  ArrowLeft,
  Key,
  FolderTree,
  Server,
  Zap
} from 'lucide-react';

export const ArchitectureDiagramView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: '1. الفحص المتكرر (Recursive Scan)',
      desc: 'قراءة المجلدات الفرعية بشكل تكراري، وتحديد نوع الملف عبر FileTypeResolver وتجاهل المجلدات الفارغة.',
      badge: 'Filesystem Iterator',
    },
    {
      id: 2,
      title: '2. التجزئة المزدوجة (Dual Hashing)',
      desc: 'حساب SHA-256 للملف الكامل Binary Copy كعامل أساسي، وحساب SHA-256 للنص المستخرج للبحث والمقارنة.',
      badge: 'SHA-256 Engine',
    },
    {
      id: 3,
      title: '3. اكتشاف التغيير (Change Detection)',
      desc: 'مقارنة File Hash مع آخر Version. إذا تطابقا يتم فقط تحديث last_seen_at. إذا اختلفا يُنشأ Version جديد.',
      badge: 'Hash Matcher',
    },
    {
      id: 4,
      title: '4. الحفظ غير القابل للتعديل (Immutable Storage)',
      desc: 'حفظ النسخة الأصلية كما هي في Private Storage بالمسار: documents/{uuid}/versions/{n}.{ext} مع Compensation Logic.',
      badge: 'Private Storage',
    },
    {
      id: 5,
      title: '5. سياسة الحد الأقصى 200 إصدار (Retention)',
      desc: 'عند تجاوز 200 إصدار، يتم حذف الإصدار الأقدم تلقائياً دون إعادة ترقيم الإصدارات المتبقية.',
      badge: 'Pruning Engine',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">
            المعمارية التقنية ومخطط تدفق البيانات (System Architecture & ERD)
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          تصميم معماري نظيف (Clean Architecture) يعتمد على Strategy Pattern لمعالجة الملفات، وسياسة عدم التعديل (Immutability)، والتخزين الخاص (Private Disk).
        </p>
      </div>

      {/* Visual Architectural Layers Diagram */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>المخطط المعماري متعدد الطبقات (Multi-Layer Architecture)</span>
        </h2>

        {/* 4 Interactive Horizontal Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Layer 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="font-bold text-sm text-white">مسارات الفحص (Monitored Paths)</h3>
            <p className="text-xs text-slate-400">
              مسارات متعددة على الخادم، فحص Recursive تكراري بدون تحميل الملفات كاملة في الذاكرة.
            </p>
            <div className="pt-2 text-[11px] font-mono text-indigo-300">
              /var/data/legal_contracts<br/>
              /storage/financial_reports
            </div>
          </div>

          {/* Layer 2 */}
          <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 space-y-2 relative shadow-md shadow-indigo-500/5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="font-bold text-sm text-white">Strategy Extractors & Hasher</h3>
            <p className="text-xs text-slate-400">
              استخراج النصوص (DOCX, TXT, MD, CSV, JSON) وحساب SHA-256 للملف الكامل والنص بشكل منفصل.
            </p>
            <div className="pt-2 text-[11px] font-mono text-cyan-300">
              FileContentExtractorInterface<br/>
              FileHashService (hash_file)
            </div>
          </div>

          {/* Layer 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="font-bold text-sm text-white">Private Storage Engine</h3>
            <p className="text-xs text-slate-400">
              حفظ النسخ الثنائية الأصلية في Private Disk مشفر خارج مجلد public مع Compensation Logic.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-300">
              documents/&#123;uuid&#125;/versions/&#123;v&#125;.ext
            </div>
          </div>

          {/* Layer 4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="font-bold text-sm text-white">PostgreSQL & GIN Search</h3>
            <p className="text-xs text-slate-400">
              توثيق السجلات، وفهرسة Full-Text Search للبحث السريع، وتطبيق حد 200 إصدار delete_oldest.
            </p>
            <div className="pt-2 text-[11px] font-mono text-purple-300">
              GIN Index on extracted_content<br/>
              UUID Unique Constraints
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Workflow Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>خطوات معالجة الملف واكتشاف الإصدارات (Lifecycle Stepper)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {steps.map((step) => {
            const isSelected = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-xl border text-right transition ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block text-indigo-400">
                  {step.badge}
                </span>
                <span className="font-bold text-xs block mt-1">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Details Card */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            {activeStep}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{steps[activeStep - 1].title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{steps[activeStep - 1].desc}</p>
          </div>
        </div>
      </div>

      {/* Database Schema ERD Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">هيكل جداول قاعدة البيانات (PostgreSQL Schema ERD)</h2>
          </div>
          <span className="text-xs text-slate-400">5 جداول مهيكلة مع القيود والفهارس</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          {/* Table 1: scan_paths */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-indigo-950/60 p-2.5 border-b border-slate-800 font-bold text-indigo-300 flex items-center justify-between">
              <span>scan_paths</span>
              <span className="text-[10px] text-slate-400 font-sans">المسارات المراقبة</span>
            </div>
            <div className="p-3 space-y-1 text-slate-300 text-[11px]">
              <div className="text-indigo-400 font-bold">PK: id (bigint)</div>
              <div>name (varchar 150)</div>
              <div>path (varchar 1000)</div>
              <div>is_active (boolean)</div>
              <div className="text-slate-500">timestamps</div>
            </div>
          </div>

          {/* Table 2: documents */}
          <div className="bg-slate-950 rounded-xl border border-indigo-500/40 overflow-hidden shadow-sm">
            <div className="bg-indigo-950/80 p-2.5 border-b border-indigo-500/40 font-bold text-white flex items-center justify-between">
              <span>documents</span>
              <span className="text-[10px] text-indigo-300 font-sans">الوثيقة المنطقية</span>
            </div>
            <div className="p-3 space-y-1 text-slate-300 text-[11px]">
              <div className="text-indigo-400 font-bold">PK: id (bigint)</div>
              <div className="text-cyan-400">UQ: uuid (uuid)</div>
              <div>FK: scan_path_id &rarr; scan_paths</div>
              <div>filename (varchar 255)</div>
              <div>relative_path (varchar 1000)</div>
              <div>extension (varchar 50)</div>
              <div>mime_type (varchar 150)</div>
              <div>status (enum: active, missing, error, unsupported)</div>
              <div>FK: latest_version_id &rarr; document_versions</div>
              <div className="text-amber-300">UQ_IDX: (scan_path_id, relative_path)</div>
            </div>
          </div>

          {/* Table 3: document_versions */}
          <div className="bg-slate-950 rounded-xl border border-indigo-500/40 overflow-hidden shadow-sm">
            <div className="bg-indigo-950/80 p-2.5 border-b border-indigo-500/40 font-bold text-white flex items-center justify-between">
              <span>document_versions</span>
              <span className="text-[10px] text-indigo-300 font-sans">الإصدارات غير القابلة للتعديل</span>
            </div>
            <div className="p-3 space-y-1 text-slate-300 text-[11px]">
              <div className="text-indigo-400 font-bold">PK: id (bigint)</div>
              <div>FK: document_id &rarr; documents</div>
              <div className="text-amber-300">version_number (unsigned int)</div>
              <div>original_filename (varchar 255)</div>
              <div>storage_disk (varchar 50: private)</div>
              <div>storage_path (varchar 1000)</div>
              <div>file_size (bigint)</div>
              <div className="text-cyan-300">file_hash (char 64: SHA-256 Binary)</div>
              <div className="text-emerald-300">content_hash (char 64: SHA-256 Text)</div>
              <div>extracted_content (longText / GIN FTS)</div>
              <div className="text-amber-300">UQ_IDX: (document_id, version_number)</div>
            </div>
          </div>

          {/* Table 4: scan_logs */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900 p-2.5 border-b border-slate-800 font-bold text-slate-300 flex items-center justify-between">
              <span>scan_logs</span>
              <span className="text-[10px] text-slate-400 font-sans">سجل الفحص</span>
            </div>
            <div className="p-3 space-y-1 text-slate-300 text-[11px]">
              <div className="text-indigo-400 font-bold">PK: id (bigint)</div>
              <div>FK: scan_path_id &rarr; scan_paths</div>
              <div>started_at / finished_at</div>
              <div>files_scanned / files_created</div>
              <div>files_updated / files_unchanged</div>
              <div>files_missing / errors_count</div>
              <div>status (running, completed, failed)</div>
            </div>
          </div>

          {/* Table 5: scan_errors */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900 p-2.5 border-b border-slate-800 font-bold text-slate-300 flex items-center justify-between">
              <span>scan_errors</span>
              <span className="text-[10px] text-slate-400 font-sans">أخطاء الملفات المنعزلة</span>
            </div>
            <div className="p-3 space-y-1 text-slate-300 text-[11px]">
              <div className="text-indigo-400 font-bold">PK: id (bigint)</div>
              <div>FK: scan_log_id &rarr; scan_logs</div>
              <div>file_path (varchar 1000)</div>
              <div>error_message (text)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
