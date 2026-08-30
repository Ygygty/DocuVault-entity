import React, { useState, useMemo } from 'react';
import { 
  Code2, 
  Folder, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Search, 
  Layers, 
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { LARAVEL_CODEBASE } from '../data/laravelCodebase';
import { CodeFile } from '../types';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(LARAVEL_CODEBASE[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(LARAVEL_CODEBASE.map((f) => f.category));
    return ['all', ...Array.from(set)];
  }, []);

  const phases = [
    { id: 'all', label: 'كافة المراحل (11 مرحلة)' },
    { id: 2, label: 'المرحلة 2: Migrations & Models' },
    { id: 3, label: 'المرحلة 3: Extractors & Services' },
    { id: 4, label: 'المرحلة 4: Versioning & Retention' },
    { id: 5, label: 'المرحلة 5: Scanner & Fault Tolerance' },
    { id: 6, label: 'المرحلة 6: Artisan, Scheduler & Jobs' },
    { id: 7, label: 'المرحلة 7: Controllers & Auth' },
    { id: 8, label: 'المرحلة 8: Diff & PostgreSQL FTS' },
    { id: 9, label: 'المرحلة 9: REST API Resources' },
    { id: 10, label: 'المرحلة 10: Unit & Feature Tests' },
    { id: 11, label: 'المرحلة 11: Docker Compose & README' },
  ];

  const filteredFiles = useMemo(() => {
    return LARAVEL_CODEBASE.filter((f) => {
      if (selectedPhase !== 'all' && f.phase !== selectedPhase) return false;
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.path.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedPhase, selectedCategory, searchQuery]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <h1 className="text-lg font-bold text-white">
                مستكشف شيفرة Laravel 11 & PostgreSQL الكاملة (Production-Grade Codebase)
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              جميع الملفات مكتوبة بالكامل وفق مبادئ Clean Architecture و SOLID دون أي كود تجريدي (No Pseudo-code) وقابلة للتشغيل المباشر.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-500/30 font-medium">
              {LARAVEL_CODEBASE.length} ملفاً برمجياً كاملاً
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في أسماء الملفات أو المسارات أو الكود..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'كافة التصنيفات (All Categories)' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[750px]">
        {/* Left File Tree Sidebar */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col shadow-sm overflow-hidden">
          <div className="text-xs font-bold text-slate-400 pb-2 mb-2 border-b border-slate-800 flex justify-between">
            <span>ملفات المشروع ({filteredFiles.length})</span>
            <span>Laravel Root</span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right p-2 rounded-xl transition flex items-start gap-2.5 text-xs ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div className="truncate flex-1">
                    <div className="font-mono font-medium truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{file.path}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono text-[9px]">
                        {file.category}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">{file.description}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          {/* Header of Viewer */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-300">{selectedFile.path}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono uppercase">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>

              <button
                onClick={handleDownloadSingleFile}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل الملف</span>
              </button>
            </div>
          </div>

          {/* Code Textarea / View with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 select-text">
            <pre className="whitespace-pre">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
