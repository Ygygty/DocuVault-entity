import React from 'react';
import { 
  Files, 
  History, 
  CheckCircle, 
  AlertTriangle, 
  FolderSync, 
  ShieldCheck, 
  Database, 
  HardDrive, 
  ArrowUpRight,
  Clock,
  Sparkles,
  FileCode,
  Layers,
  Flame,
  Zap,
  Download
} from 'lucide-react';
import { Document, DocumentVersion, ScanPath, ScanLog } from '../types';

interface DashboardViewProps {
  documents: Document[];
  versions: DocumentVersion[];
  scanPaths: ScanPath[];
  scanLogs: ScanLog[];
  onSelectDocument: (doc: Document) => void;
  onRunScan: () => void;
  isScanning: boolean;
  onOpenVFSEditor: () => void;
  onSimulate200Versions: () => void;
  onNavigateToOffline?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  versions,
  scanPaths,
  scanLogs,
  onSelectDocument,
  onRunScan,
  isScanning,
  onOpenVFSEditor,
  onSimulate200Versions,
  onNavigateToOffline,
}) => {
  const totalDocs = documents.length;
  const totalVersions = versions.length;
  const activeDocs = documents.filter((d) => d.status === 'active').length;
  const missingDocs = documents.filter((d) => d.status === 'missing').length;
  const errorDocs = documents.filter((d) => d.status === 'error').length;
  const unsupportedDocs = documents.filter((d) => d.status === 'unsupported').length;

  const latestScan = scanLogs.length > 0 ? scanLogs[0] : null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalStorageSize = versions.reduce((acc, v) => acc + (v.file_size || 0), 0);

  return (
    <div className="space-y-6">
      {/* System Architecture & Principles Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مبدأ الحفظ الثنائي الدقيق (True Binary Retention)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              نظام إدارة ومراقبة الملفات وحفظ تاريخ الإصدارات
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              يقوم النظام بحفظ <span className="text-indigo-300 font-semibold">نسخة ثنائية أصلية مطابقة (Binary Copy)</span> لكل ملف في Private Storage دون المساس بالتنسيقات والخطوط، مع استخراج النصوص وفهرستها في PostgreSQL وحساب SHA-256 File Hash و Content Hash وتطبيق حد 200 إصدار.
            </p>
          </div>

          {/* Quick Sandbox Simulation Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:self-start lg:self-center">
            {onNavigateToOffline && (
              <button
                onClick={onNavigateToOffline}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition shadow flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>التشغيل المحلي أوفلاين (بدون Docker)</span>
              </button>
            )}
            <button
              onClick={onOpenVFSEditor}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium transition shadow flex items-center gap-1.5"
            >
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>تعديل الملفات الحية (VFS)</span>
            </button>
            <button
              onClick={onSimulate200Versions}
              className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition shadow flex items-center gap-1.5"
              title="تجربة تلقائية لإنشاء أكثر من 200 إصدار والتأكد من حذف الإصدار 1 وبقاء 2..201"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>اختبار 200+ إصدار</span>
            </button>
          </div>
        </div>

        {/* Engine Specs Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>قاعدة البيانات: <strong className="text-white">PostgreSQL (GIN FTS)</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>التخزين: <strong className="text-white">Private Disk (UUID Paths)</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>حد الإصدارات: <strong className="text-white">200 (delete_oldest)</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>كشف التغيير: <strong className="text-white">SHA-256 Dual Hash</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">إجمالي الوثائق</span>
            <Files className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{totalDocs}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Logical Documents</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">إجمالي الإصدارات</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{totalVersions}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Immutable Versions</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">الملفات النشطة</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{activeDocs}</p>
          <span className="text-[11px] text-emerald-500/70 mt-1 block">Active On Disk</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">الملفات المفقودة</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2 font-mono">{missingDocs}</p>
          <span className="text-[11px] text-rose-500/70 mt-1 block">Deleted from source</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">مسارات الفحص</span>
            <FolderSync className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{scanPaths.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Recursive Watchers</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">حجم التخزين الخاص</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2 font-mono">{formatBytes(totalStorageSize)}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Private Binary Copies</span>
        </div>
      </div>

      {/* Two Column Layout: Latest Scan + System Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Scan Result Summary Card */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">آخر عملية فحص (Latest Scan)</h2>
            </div>
            <button
              onClick={onRunScan}
              disabled={isScanning}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>فحص الآن</span>
            </button>
          </div>

          {latestScan ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>المسار:</span>
                  <span className="text-slate-200 font-medium">{latestScan.scan_path_name || 'كافة المسارات'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                  <span>التوقيت:</span>
                  <span className="text-slate-300 font-mono">{latestScan.started_at}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                  <span>الحالة:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold font-mono">
                    {latestScan.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Scan Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">ملفات تم فحصها:</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">{latestScan.files_scanned}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">ملفات جديدة:</span>
                  <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">+{latestScan.files_created}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">إصدارات مستحدثة:</span>
                  <span className="text-base font-bold text-indigo-400 font-mono mt-0.5 block">+{latestScan.files_updated}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">ملفات دون تغيير:</span>
                  <span className="text-base font-bold text-slate-300 font-mono mt-0.5 block">{latestScan.files_unchanged}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">ملفات مفقودة:</span>
                  <span className="text-base font-bold text-rose-400 font-mono mt-0.5 block">{latestScan.files_missing}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400 block">أخطاء الفحص:</span>
                  <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">{latestScan.errors_count}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">لم يتم تسجيل أي عملية فحص حتى الآن.</p>
          )}
        </div>

        {/* Recently Modified Documents Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">آخر الوثائق المحدثة (Recently Modified Documents)</h2>
            </div>
            <span className="text-xs text-slate-400">مرتبة حسب تاريخ التعديل</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2.5">اسم الملف (Filename)</th>
                  <th className="pb-2.5">المسار النسبي</th>
                  <th className="pb-2.5">النوع</th>
                  <th className="pb-2.5">أحدث إصدار</th>
                  <th className="pb-2.5">الحالة</th>
                  <th className="pb-2.5 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.slice(0, 6).map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-mono truncate max-w-[150px]">
                      {doc.relative_path}
                    </td>
                    <td className="py-3">
                      <span className="uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {doc.extension}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold text-[11px]">
                        v{doc.versions_count || 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        doc.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : doc.status === 'missing'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {doc.status === 'active' ? 'نشط' : doc.status === 'missing' ? 'مفقود' : doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-left">
                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 text-xs"
                      >
                        <span>تفاصيل</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
