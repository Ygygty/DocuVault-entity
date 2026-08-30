import React, { useState } from 'react';
import { 
  FolderGit2, 
  LayoutDashboard, 
  Files, 
  FolderTree, 
  Code2, 
  Layers, 
  Terminal, 
  FileText, 
  Download, 
  Play, 
  HardDrive,
  CheckCircle2,
  Sparkles,
  Server,
  Zap,
  Feather,
  Scroll,
  Headphones,
  BookOpen
} from 'lucide-react';
import JSZip from 'jszip';
import { LARAVEL_CODEBASE } from '../data/laravelCodebase';
import { downloadCompleteOfflinePackage } from '../services/storageEngine';

export type ActiveTab = 
  | 'dashboard'
  | 'documents'
  | 'scholarly_editor'
  | 'manuscripter_studio'
  | 'media_studio'
  | 'scholarly_reader'
  | 'unified_studio'
  | 'paths'
  | 'vfs_editor'
  | 'codebase'
  | 'architecture'
  | 'api_sandbox'
  | 'terminal'
  | 'docker_docs'
  | 'offline_runner';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onRunScan: () => void;
  isScanning: boolean;
  onOpenVFSEditor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRunScan,
  isScanning,
  onOpenVFSEditor,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await downloadCompleteOfflinePackage();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (e) {
      console.error('Failed to export package ZIP:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'documents', label: 'الوثائق والإصدارات', icon: Files },
    { id: 'scholarly_editor', label: 'المحرر التحقيقي', icon: Feather, badge: 'جديد' },
    { id: 'manuscripter_studio', label: 'استوديو المخطوطات', icon: Scroll, badge: 'جديد' },
    { id: 'media_studio', label: 'الصوتيات والمقاطع', icon: Headphones },
    { id: 'scholarly_reader', label: 'القارئ المتزامن', icon: BookOpen },
    { id: 'unified_studio', label: 'الاستوديو الموحد', icon: Layers, badge: 'Split' },
    { id: 'offline_runner', label: 'التشغيل المحلي أوفلاين (بدون Docker)', icon: Zap, badge: 'جاهز أوفلاين' },
    { id: 'paths', label: 'مسارات الفحص', icon: FolderTree },
    { id: 'codebase', label: 'شيفرة Laravel الكاملة', icon: Code2 },
    { id: 'architecture', label: 'البنية المعمارية & DB', icon: Layers },
    { id: 'api_sandbox', label: 'REST API Sandbox', icon: Server },
    { id: 'terminal', label: 'Artisan & CLI', icon: Terminal },
    { id: 'docker_docs', label: 'دليل Docker والإنتاج', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <FolderGit2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">DocuVault</span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                  Laravel 11 + PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                نظام مراقبة وتوثيق إصدارات الملفات وحفظ النسخ الثنائية (Binary Copies)
              </p>
            </div>
          </div>

          {/* Quick Simulation & Export Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Virtual File System Modifier */}
            <button
              id="btn-open-vfs"
              onClick={onOpenVFSEditor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-medium transition shadow-sm"
              title="تعديل الملفات في المجلدات لاختبار استجابة الفاحص"
            >
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">محرر الملفات الافتراضية (Live Files)</span>
              <span className="md:hidden">الملفات</span>
            </button>

            {/* Run Scan Button */}
            <button
              id="btn-run-global-scan"
              onClick={onRunScan}
              disabled={isScanning}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium text-xs transition shadow-md ${
                isScanning
                  ? 'bg-indigo-700/50 text-indigo-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'جاري الفحص...' : 'تشغيل الفحص الآن'}</span>
            </button>

            {/* Export Laravel Project ZIP */}
            <button
              id="btn-export-laravel-zip"
              onClick={handleExportZip}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/40 text-xs font-medium transition shadow-sm shadow-emerald-900/30 active:scale-95"
              title="تنزيل المشروع الكامل بصيغة ZIP يحتوي على كامل ملفات Laravel و Docker و Tests"
            >
              {exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>تم التنزيل بنجاح!</span>
                </>
              ) : isExporting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>جاري تجهيز الـ ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">تحميل مشروع Laravel (ZIP)</span>
                  <span className="sm:hidden">ZIP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto py-1 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-normal">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
