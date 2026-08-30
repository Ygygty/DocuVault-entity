import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  Download, 
  Terminal, 
  FolderSearch, 
  FileCheck2, 
  CheckCircle2, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Copy, 
  Check, 
  FolderPlus,
  Server,
  FileCode,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  downloadCompleteOfflinePackage, 
  exportDatabaseToJson, 
  scanNativeDirectoryHandle, 
  AppDatabaseState,
  resetToSeedData
} from '../services/storageEngine';
import { Document, DocumentVersion, ScanPath, ScanLog } from '../types';
import { sha256 } from '../services/simulationEngine';

interface OfflineRunnerViewProps {
  documents: Document[];
  versions: DocumentVersion[];
  scanPaths: ScanPath[];
  scanLogs: ScanLog[];
  virtualFiles: any[];
  onDatabaseRestored: (state: AppDatabaseState) => void;
  onRealFilesScanned: (newDocs: Document[], newVersions: DocumentVersion[], log: ScanLog) => void;
}

export const OfflineRunnerView: React.FC<OfflineRunnerViewProps> = ({
  documents,
  versions,
  scanPaths,
  scanLogs,
  virtualFiles,
  onDatabaseRestored,
  onRealFilesScanned,
}) => {
  const [activeOsTab, setActiveOsTab] = useState<'windows' | 'mac_linux' | 'manual'>('windows');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isScanningNative, setIsScanningNative] = useState(false);
  const [nativeScanReport, setNativeScanReport] = useState<string | null>(null);
  const [serverHealth, setServerHealth] = useState<{ status: string; mode: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if local express backend is active
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setServerHealth(data))
      .catch(() => setServerHealth({ status: 'browser_offline', mode: 'Client Local-First (Browser Mode)' }));
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadCompleteOfflinePackage();
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleExportBackup = () => {
    exportDatabaseToJson({
      documents,
      versions,
      scanPaths,
      scanLogs,
      virtualFiles,
    });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.documents)) {
          onDatabaseRestored(parsed);
          alert('تم استيراد قاعدة البيانات المحلية بنجاح!');
        } else {
          alert('الملف المحدد لا يحتوي على بنية قاعدة بيانات DocuVault صالحة.');
        }
      } catch (err) {
        alert('خطأ أثناء قراءة ملف الـ JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى الحالة التجريبية الأصلية؟')) {
      const resetState = resetToSeedData();
      onDatabaseRestored(resetState);
      alert('تمت إعادة الضبط بنجاح.');
    }
  };

  // Real directory scanner using Native Browser File System Access API
  const handlePickAndScanRealFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('المتصفح الحالي لا يدعم showDirectoryPicker. يرجى استخدام متصفح يدعم File System Access API مثل Chrome أو Edge أو Brave أو استخدام خادم Node.js المحلي.');
      return;
    }

    try {
      setIsScanningNative(true);
      setNativeScanReport('جاري طلب إذن المجلد من المستخدم...');
      const dirHandle = await (window as any).showDirectoryPicker();

      setNativeScanReport(`جاري الفحص وحساب SHA-256 للملفات في مجلد: ${dirHandle.name}...`);
      const files = await scanNativeDirectoryHandle(dirHandle);

      if (files.length === 0) {
        setNativeScanReport('لم يتم العثور على ملفات متوافقة في المجلد المختار.');
        setIsScanningNative(false);
        return;
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      let updatedDocs = [...documents];
      let updatedVersions = [...versions];
      let filesCreated = 0;
      let filesUpdated = 0;
      let filesUnchanged = 0;

      // Ensure a scan path exists for this folder
      let pathRecord = scanPaths.find((p) => p.name === `Local: ${dirHandle.name}`);
      let pathId = pathRecord ? pathRecord.id : Date.now();

      for (const f of files) {
        let docIndex = updatedDocs.findIndex(
          (d) => d.scan_path_id === pathId && d.relative_path === f.relativePath
        );

        const contentHash = await sha256(f.content);

        if (docIndex === -1) {
          const newDocId = updatedDocs.length > 0 ? Math.max(...updatedDocs.map((d) => d.id)) + 1 : 1;
          const newDocUuid = `local-${newDocId}-${Date.now().toString(36)}`;
          const newVerId = updatedVersions.length > 0 ? Math.max(...updatedVersions.map((v) => v.id)) + 1 : 1;

          const newVer: DocumentVersion = {
            id: newVerId,
            document_id: newDocId,
            version_number: 1,
            original_filename: f.name,
            extension: f.extension,
            mime_type: f.extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
            storage_disk: 'local_disk',
            storage_path: `documents/${newDocUuid}/versions/1.${f.extension}`,
            file_size: f.size,
            file_hash: f.hash,
            content_hash: contentHash,
            extracted_content: f.content,
            source_modified_at: f.mtime,
            created_at: nowStr,
            updated_at: nowStr,
            change_summary: 'الإصدار الأولي - تم فحصه محلياً من القرص الصلب',
          };

          const newDoc: Document = {
            id: newDocId,
            uuid: newDocUuid,
            scan_path_id: pathId,
            filename: f.name,
            relative_path: f.relativePath,
            extension: f.extension,
            mime_type: newVer.mime_type,
            status: 'active',
            latest_version_id: newVerId,
            versions_count: 1,
            first_seen_at: nowStr,
            last_seen_at: nowStr,
            created_at: nowStr,
            updated_at: nowStr,
          };

          updatedDocs.push(newDoc);
          updatedVersions.push(newVer);
          filesCreated++;
        } else {
          const existingDoc = updatedDocs[docIndex];
          const docVersions = updatedVersions
            .filter((v) => v.document_id === existingDoc.id)
            .sort((a, b) => b.version_number - a.version_number);
          const latestVer = docVersions[0];

          if (latestVer && latestVer.file_hash === f.hash) {
            updatedDocs[docIndex] = { ...existingDoc, status: 'active', last_seen_at: nowStr };
            filesUnchanged++;
          } else {
            const nextVerNum = (latestVer ? latestVer.version_number : 0) + 1;
            const newVerId = Math.max(...updatedVersions.map((v) => v.id), 0) + 1;

            const newVer: DocumentVersion = {
              id: newVerId,
              document_id: existingDoc.id,
              version_number: nextVerNum,
              original_filename: f.name,
              extension: f.extension,
              mime_type: existingDoc.mime_type,
              storage_disk: 'local_disk',
              storage_path: `documents/${existingDoc.uuid}/versions/${nextVerNum}.${f.extension}`,
              file_size: f.size,
              file_hash: f.hash,
              content_hash: contentHash,
              extracted_content: f.content,
              source_modified_at: f.mtime,
              created_at: nowStr,
              updated_at: nowStr,
              change_summary: 'تحديث تم اكتشافه أثناء الفحص المحلي من القرص الصلب',
            };

            updatedVersions.push(newVer);
            updatedDocs[docIndex] = {
              ...existingDoc,
              status: 'active',
              latest_version_id: newVerId,
              versions_count: (existingDoc.versions_count || 1) + 1,
              last_seen_at: nowStr,
            };
            filesUpdated++;
          }
        }
      }

      const log: ScanLog = {
        id: Date.now(),
        scan_path_id: pathId,
        scan_path_name: `Local Folder: ${dirHandle.name}`,
        started_at: nowStr,
        finished_at: nowStr,
        files_scanned: files.length,
        files_created: filesCreated,
        files_updated: filesUpdated,
        files_unchanged: filesUnchanged,
        files_missing: 0,
        errors_count: 0,
        status: 'completed',
        created_at: nowStr,
        updated_at: nowStr,
      };

      onRealFilesScanned(updatedDocs, updatedVersions, log);
      setNativeScanReport(`اكتمل الفحص بنجاح! تم مسح ${files.length} ملف، إنشاء ${filesCreated} وثيقة جديدة، وتحديث ${filesUpdated} وثيقة معدلة.`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setNativeScanReport(`خطأ أثناء الفحص: ${err.message}`);
      } else {
        setNativeScanReport('تم إلغاء اختيار المجلد من قِبل المستخدم.');
      }
    } finally {
      setIsScanningNative(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Offline & Standalone (بدون Docker)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Node.js Native Engine
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              تشغيل النظام محلياً بدون Docker وبدون خوادم خارجية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              يعمل DocuVault بشكل مستقل تماماً على جهازك بواسطة محرك Node.js خفيف وسريع، أو مباشرة عبر المتصفح بتقنية Local-First لتسجيل الإصدارات، وحساب SHA-256، وحفظ النسخ الاحتياطية أوفلاين.
            </p>
          </div>

          {/* Quick 1-Click ZIP Download */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="btn-download-full-offline-pkg"
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 transition"
            >
              {isDownloadingZip ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>جاري تجهيز الحزمة...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>تحميل حزمة التشغيل المستقلة (ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Real Local Scanner + DB Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Local Directory Scanner (Browser Native) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <FolderSearch className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">فاحص المجلدات الحقيقية على القرص الصلب (Real Local Disk Scanner)</h2>
                <p className="text-[11px] text-slate-400">اختر أي مجلد من حاسوبك وسيقوم DocuVault بمسحه، استخراج محتواه، وحفظ إصداراته محلياً أوفلاين</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-pick-real-directory"
                onClick={handlePickAndScanRealFolder}
                disabled={isScanningNative}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-900/30 active:scale-95 disabled:opacity-50"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{isScanningNative ? 'جاري الفحص المباشر...' : 'اختيار مجلد من القرص الصلب وفحصه الآن'}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                يدعم صيغ <code className="text-indigo-300">.txt, .docx, .md, .csv, .json</code> مع حساب SHA-256 دقيق.
              </span>
            </div>

            {nativeScanReport && (
              <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-500/30 text-xs text-slate-200 flex items-center gap-2 animate-fadeIn">
                <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{nativeScanReport}</span>
              </div>
            )}
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-200 block">بدون خوادم سحابية</span>
                <span className="text-[10px] text-slate-400">ملفاتك تبقى على جهازك 100%</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-slate-200 block">اكتشاف التعديلات الذكي</span>
                <span className="text-[10px] text-slate-400">مقارنة ثنائية عبر SHA-256</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-bold text-slate-200 block">200 إصدار كحد أقصى</span>
                <span className="text-[10px] text-slate-400">حذف الأقدم تلقائياً دون تضارب</span>
              </div>
            </div>
          </div>
        </div>

        {/* Local Storage & DB Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">إدارة التخزين المحلي (Local Persistence)</h2>
                <p className="text-[11px] text-slate-400">النسخ الاحتياطي والاستعادة لقاعدة البيانات</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">عدد الوثائق المخزنة:</span>
                <span className="font-bold text-white font-mono">{documents.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">عدد الإصدارات المؤرشفة:</span>
                <span className="font-bold text-indigo-300 font-mono">{versions.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">حالة الخادم المحلي:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {serverHealth ? serverHealth.mode : 'Online Offline Mode'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              id="btn-export-db-json"
              onClick={handleExportBackup}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition border border-slate-700 hover:border-slate-600"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير نسخة احتياطية (JSON Backup)</span>
            </button>

            <button
              id="btn-import-db-json"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition border border-slate-700 hover:border-slate-600"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>استيراد قاعدة بيانات من JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            <button
              id="btn-reset-db-seed"
              onClick={handleResetData}
              className="w-full py-1.5 px-3 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 font-medium text-[11px] flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة الضبط إلى البيانات التجريبية الأصلية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step by Step Local Running Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">طريقة التشغيل محلياً على جهازك بخطوة واحدة (Step-by-Step)</h2>
          </div>

          {/* OS Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveOsTab('windows')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeOsTab === 'windows' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ويندوز (Windows .bat)
            </button>
            <button
              onClick={() => setActiveOsTab('mac_linux')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeOsTab === 'mac_linux' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ماك ولينكس (Mac / Linux .sh)
            </button>
            <button
              onClick={() => setActiveOsTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeOsTab === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              أوامر npm اليدوية
            </button>
          </div>
        </div>

        {/* Windows Content */}
        {activeOsTab === 'windows' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">1</span>
                <span>تأكد من وجود Node.js على جهازك:</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pr-7">
                قم بتحميل وتثبيت Node.js (الإصدار 18 أو 20 أو 22) من الموقع الرسمي مجاناً: <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-cyan-400 underline">nodejs.org</a>.
              </p>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 pt-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">2</span>
                <span>تشغيل النظام بنقرة واحدة:</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pr-7">
                افتح مجلد المشروع وانقر نقراً مزدوجاً على الملف: <code className="bg-slate-900 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">run-offline.bat</code>.
              </p>
              <div className="pr-7">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-between">
                  <code>run-offline.bat</code>
                  <button
                    onClick={() => handleCopy('run-offline.bat', 'win_cmd')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedId === 'win_cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-emerald-400 pr-7 font-medium">
                ✓ سيقوم السكريبت بتثبيت المكتبات تلقائياً وتشغيل السيرفر وفتح المتصفح فوراً على الرابط <code className="text-white">http://localhost:3000</code>.
              </p>
            </div>
          </div>
        )}

        {/* Mac / Linux Content */}
        {activeOsTab === 'mac_linux' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">1</span>
                <span>افتح التيرمينال داخل مجلد المشروع وشغّل سكريبت الإطلاق:</span>
              </div>
              
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-between">
                <code className="text-cyan-300">chmod +x run-offline.sh && ./run-offline.sh</code>
                <button
                  onClick={() => handleCopy('chmod +x run-offline.sh && ./run-offline.sh', 'sh_cmd')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedId === 'sh_cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-xs text-emerald-400 font-medium">
                ✓ سيعمل الخادم المحلي ويفتح نافذة المتصفح مباشرة على <code className="text-white">http://localhost:3000</code>.
              </p>
            </div>
          </div>
        )}

        {/* Manual npm Commands */}
        {activeOsTab === 'manual' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-200 block">أوامر التثبيت والتشغيل المباشر:</span>
              
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-slate-300 flex items-center justify-between">
                  <code>npm install</code>
                  <button onClick={() => handleCopy('npm install', 'npm_i')} className="text-slate-400 hover:text-white p-1">
                    {copiedId === 'npm_i' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-indigo-300 flex items-center justify-between">
                  <code>npm run dev</code>
                  <button onClick={() => handleCopy('npm run dev', 'npm_dev')} className="text-slate-400 hover:text-white p-1">
                    {copiedId === 'npm_dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-emerald-300 flex items-center justify-between">
                  <code>npm run build && npm start</code>
                  <button onClick={() => handleCopy('npm run build && npm start', 'npm_start')} className="text-slate-400 hover:text-white p-1">
                    {copiedId === 'npm_start' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison: Docker vs Standalone Offline Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-purple-400" />
          <span>مقارنة أوضاع التشغيل (Docker vs Standalone Offline)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="p-3">الميزة / المتطلب</th>
                <th className="p-3 text-emerald-400 font-bold">النسخة المستقلة أوفلاين (الحالية)</th>
                <th className="p-3 text-slate-300">نسخة Docker & Laravel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-3 font-medium text-slate-200">الحاجة لتثبيت Docker أو Docker Desktop</td>
                <td className="p-3 text-emerald-400 font-bold">لا يحتاج نهائياً (0% Docker)</td>
                <td className="p-3 text-slate-400">يتطلب Docker Engine & Compose</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">الحاجة لخادم قاعدة بيانات PostgreSQL خارجي</td>
                <td className="p-3 text-emerald-400 font-bold">مدمجة محلياً (In-Memory / JSON / LocalDB)</td>
                <td className="p-3 text-slate-400">يتطلب حاوية PostgreSQL 16</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">التشغيل بدون اتصال بالإنترنت (Offline)</td>
                <td className="p-3 text-emerald-400 font-bold">يعمل أوفلاين بنسبة 100% بدون إنترنت</td>
                <td className="p-3 text-slate-400">يعمل أوفلاين بعد بناء الحاويات</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">فحص الملفات الحقيقية على القرص</td>
                <td className="p-3 text-emerald-400 font-bold">مدعوم (File System API + Node.js Scanner)</td>
                <td className="p-3 text-slate-400">مدعوم (Artisan Command)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">سرعة الإقلاع والاستهلاك</td>
                <td className="p-3 text-emerald-400 font-bold">فوري (أقل من ثانية واحدة، استهلاك خفيف)</td>
                <td className="p-3 text-slate-400">يحتاج دقائق لبناء الحاويات واستهلاك RAM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
