import React, { useState } from 'react';
import { 
  ArrowRight, 
  Files, 
  History, 
  Download, 
  RotateCcw, 
  GitCompare, 
  FileText, 
  ShieldCheck, 
  HardDrive, 
  Copy, 
  Check, 
  Eye,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Document, DocumentVersion } from '../types';

interface DocumentDetailViewProps {
  document: Document;
  versions: DocumentVersion[];
  onBack: () => void;
  onOpenDiff: (vOld: DocumentVersion, vNew: DocumentVersion, doc: Document) => void;
  onRestoreVersion: (doc: Document, targetVer: DocumentVersion) => void;
  onDownloadVersion: (doc: Document, ver: DocumentVersion) => void;
}

export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({
  document: doc,
  versions,
  onBack,
  onOpenDiff,
  onRestoreVersion,
  onDownloadVersion,
}) => {
  const [selectedVerForContent, setSelectedVerForContent] = useState<DocumentVersion | null>(null);
  const [compareV1, setCompareV1] = useState<number | null>(null);
  const [compareV2, setCompareV2] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Filter versions belonging to this document
  const docVersions = versions
    .filter((v) => v.document_id === doc.id)
    .sort((a, b) => b.version_number - a.version_number);

  const latestVersion = docVersions[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleTriggerCompare = () => {
    if (!compareV1 || !compareV2 || compareV1 === compareV2) return;
    const v1 = docVersions.find((v) => v.version_number === compareV1);
    const v2 = docVersions.find((v) => v.version_number === compareV2);
    if (v1 && v2) {
      const older = v1.version_number < v2.version_number ? v1 : v2;
      const newer = v1.version_number > v2.version_number ? v1 : v2;
      onOpenDiff(older, newer, doc);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع لقائمة الوثائق</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            doc.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            الحالة: {doc.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Document Overview Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-mono">{doc.filename}</h1>
              <span className="uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                {doc.extension}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              المسار النسبي: <span className="text-slate-200">{doc.relative_path}</span>
            </p>
          </div>

          {/* Storage Path Pattern Showcase */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-500 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>نمط التخزين الخاص (Private Storage Path Pattern):</span>
            </div>
            <p className="text-indigo-300 break-all">
              documents/{doc.uuid}/versions/{'{version_number}'}.{doc.extension}
            </p>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">UUID الوثيقة:</span>
            <span className="font-mono text-slate-200 truncate block mt-0.5" title={doc.uuid}>
              {doc.uuid}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">عدد الإصدارات الحالية:</span>
            <span className="font-bold text-white mt-0.5 block">{docVersions.length} إصدار (الحد: 200)</span>
          </div>
          <div>
            <span className="text-slate-400 block">أول فحص واكتشاف:</span>
            <span className="text-slate-300 font-mono mt-0.5 block">{doc.first_seen_at}</span>
          </div>
          <div>
            <span className="text-slate-400 block">آخر نشاط مسجل:</span>
            <span className="text-slate-300 font-mono mt-0.5 block">{doc.last_seen_at}</span>
          </div>
        </div>
      </div>

      {/* Compare Tool Box */}
      {docVersions.length > 1 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">مقارنة أي إصدارين (Visual Diff Engine):</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={compareV1 || docVersions[docVersions.length - 1]?.version_number || ''}
              onChange={(e) => setCompareV1(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
            >
              {docVersions.map((v) => (
                <option key={v.id} value={v.version_number}>
                  الإصدار v{v.version_number} ({v.created_at.substring(5, 16)})
                </option>
              ))}
            </select>

            <span className="text-slate-400">مقابل</span>

            <select
              value={compareV2 || docVersions[0]?.version_number || ''}
              onChange={(e) => setCompareV2(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
            >
              {docVersions.map((v) => (
                <option key={v.id} value={v.version_number}>
                  الإصدار v{v.version_number} ({v.created_at.substring(5, 16)})
                </option>
              ))}
            </select>

            <button
              onClick={handleTriggerCompare}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition"
            >
              تشغيل المقارنة
            </button>
          </div>
        </div>
      )}

      {/* Version Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              سجل الإصدارات غير القابلة للتعديل (Immutable Versions Timeline)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            مرتبة من الأحدث إلى الأقدم • لا يتم تعديل أي نسخة سابقة
          </span>
        </div>

        <div className="space-y-3">
          {docVersions.map((version, index) => {
            const isLatest = index === 0;
            return (
              <div
                key={version.id}
                className={`bg-slate-900 border rounded-xl p-4.5 transition shadow-sm ${
                  isLatest ? 'border-indigo-500/40 bg-indigo-950/10' : 'border-slate-800 hover:border-slate-750'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Version Header */}
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      isLatest 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      v{version.version_number}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">الإصدار رقم {version.version_number}</span>
                        {isLatest && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            الإصدار الأحدث (Current)
                          </span>
                        )}
                        {version.change_summary && (
                          <span className="text-xs text-indigo-300/90 font-medium hidden sm:inline">
                            — {version.change_summary}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>تاريخ الحفظ: {version.created_at}</span>
                        <span>•</span>
                        <span>الحجم: {formatBytes(version.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this version */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    {/* View Extracted Text */}
                    <button
                      onClick={() => setSelectedVerForContent(version)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>عرض النص</span>
                    </button>

                    {/* Download Original Binary File */}
                    <button
                      onClick={() => onDownloadVersion(doc, version)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1"
                      title="تحميل النسخة الثنائية الأصلية كما هي"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تحميل Binary</span>
                    </button>

                    {/* Restore Older Version */}
                    {!isLatest && (
                      <button
                        onClick={() => onRestoreVersion(doc, version)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1"
                        title={`استعادة الإصدار ${version.version_number} عبر إنشاء الإصدار الجديد v${latestVersion.version_number + 1}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>استعادة كـ v{latestVersion.version_number + 1}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Hashes Row (File Hash vs Content Hash) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                  {/* File Hash (Binary) */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-500 font-sans">File Hash (Binary):</span>
                      <span className="text-slate-300 truncate" title={version.file_hash}>
                        {version.file_hash}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(version.file_hash, `file_${version.id}`)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {copiedHash === `file_${version.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Content Hash (Extracted Text) */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-500 font-sans">Content Hash (Text):</span>
                      <span className="text-slate-300 truncate" title={version.content_hash}>
                        {version.content_hash}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(version.content_hash, `content_${version.id}`)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {copiedHash === `content_${version.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extracted Content Preview Modal */}
      {selectedVerForContent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  المحتوى النصي المستخرج — الإصدار v{selectedVerForContent.version_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVerForContent(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs leading-relaxed text-slate-200 bg-slate-950 whitespace-pre-wrap select-text">
              {selectedVerForContent.extracted_content || 'لا يوجد محتوى نصي مستخرج.'}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
              <span>طول النص: {selectedVerForContent.extracted_content?.length || 0} حرف</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedVerForContent.extracted_content || '');
                  alert('تم نسخ النص المستخرج!');
                }}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
              >
                نسخ النص الكامل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
