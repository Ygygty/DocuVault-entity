import React, { useState } from 'react';
import { 
  GitCompare, 
  X, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Layers, 
  HardDrive, 
  FileText, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Document, DocumentVersion, DiffLine } from '../types';
import { computeUnifiedDiff } from '../services/simulationEngine';

interface VersionDiffModalProps {
  document: Document;
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
  onClose: () => void;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  document: doc,
  oldVersion,
  newVersion,
  onClose,
}) => {
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified');

  const diffLines: DiffLine[] = computeUnifiedDiff(
    oldVersion.extracted_content || '',
    newVersion.extracted_content || ''
  );

  const isBinaryHashChanged = oldVersion.file_hash !== newVersion.file_hash;
  const isContentHashChanged = oldVersion.content_hash !== newVersion.content_hash;
  const sizeDiffBytes = newVersion.file_size - oldVersion.file_size;

  const addedLinesCount = diffLines.filter((l) => l.type === 'added').length;
  const removedLinesCount = diffLines.filter((l) => l.type === 'removed').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>مقارنة الإصدارات:</span>
                <span className="font-mono text-indigo-400">v{oldVersion.version_number}</span>
                <span className="text-slate-500">←</span>
                <span className="font-mono text-cyan-400">v{newVersion.version_number}</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">{doc.filename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs flex">
              <button
                onClick={() => setDiffMode('unified')}
                className={`px-2.5 py-1 rounded-md transition ${
                  diffMode === 'unified' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                عرض موحد (Unified)
              </button>
              <button
                onClick={() => setDiffMode('split')}
                className={`px-2.5 py-1 rounded-md transition ${
                  diffMode === 'split' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                عرض منفصل (Side-by-Side)
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Difference Cards */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* File Hash Comparison */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center justify-between">
              <span>SHA-256 File Hash:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                isBinaryHashChanged ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isBinaryHashChanged ? 'تغيّر (Changed)' : 'مطابق (Identical)'}
              </span>
            </span>
            <div className="font-mono text-[10px] text-slate-300 truncate">
              <div>v{oldVersion.version_number}: {oldVersion.file_hash.substring(0, 10)}...</div>
              <div>v{newVersion.version_number}: {newVersion.file_hash.substring(0, 10)}...</div>
            </div>
          </div>

          {/* Content Hash Comparison */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 flex items-center justify-between">
              <span>SHA-256 Text Hash:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                isContentHashChanged ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isContentHashChanged ? 'نص جديد' : 'نفس النص'}
              </span>
            </span>
            <div className="font-mono text-[10px] text-slate-300 truncate">
              <div>v{oldVersion.version_number}: {oldVersion.content_hash.substring(0, 10)}...</div>
              <div>v{newVersion.version_number}: {newVersion.content_hash.substring(0, 10)}...</div>
            </div>
          </div>

          {/* Size Difference */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 block">فارق الحجم:</span>
            <div className="font-mono text-sm font-bold text-slate-200">
              {sizeDiffBytes > 0 ? `+${sizeDiffBytes} Bytes` : sizeDiffBytes < 0 ? `${sizeDiffBytes} Bytes` : 'لا تغيير'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {oldVersion.file_size} B → {newVersion.file_size} B
            </span>
          </div>

          {/* Summary stats */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 block">تعديلات الأسطر:</span>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="text-emerald-400">+{addedLinesCount} سطر</span>
              <span className="text-rose-400">-{removedLinesCount} سطر</span>
            </div>
            <span className="text-[10px] text-slate-500 block">في المحتوى المستخرج</span>
          </div>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-slate-950">
          {diffMode === 'unified' ? (
            /* Unified Diff View */
            <div className="space-y-0.5 select-text">
              {diffLines.map((line, idx) => {
                if (line.type === 'added') {
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-emerald-950/40 text-emerald-300 px-3 py-1 rounded border-r-2 border-emerald-500"
                    >
                      <span className="text-emerald-500 font-bold select-none w-4">+</span>
                      <span className="text-slate-500 select-none text-[10px] w-6 text-left">{line.newLineNumber}</span>
                      <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
                    </div>
                  );
                }
                if (line.type === 'removed') {
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-rose-950/40 text-rose-300 px-3 py-1 rounded border-r-2 border-rose-500"
                    >
                      <span className="text-rose-500 font-bold select-none w-4">-</span>
                      <span className="text-slate-500 select-none text-[10px] w-6 text-left">{line.oldLineNumber}</span>
                      <span className="flex-1 line-through opacity-80 whitespace-pre-wrap">{line.content}</span>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="flex items-start gap-2 text-slate-400 px-3 py-0.5 hover:bg-slate-900/50">
                    <span className="text-slate-600 select-none w-4"> </span>
                    <span className="text-slate-600 select-none text-[10px] w-6 text-left">{line.newLineNumber}</span>
                    <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Split Side-by-Side View */
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                <div className="text-xs font-bold text-slate-300 pb-2 mb-2 border-b border-slate-800 flex justify-between">
                  <span>الإصدار السابق v{oldVersion.version_number}</span>
                  <span className="text-slate-500">{oldVersion.created_at}</span>
                </div>
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                  {oldVersion.extracted_content}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-3 border border-indigo-500/30">
                <div className="text-xs font-bold text-indigo-300 pb-2 mb-2 border-b border-slate-800 flex justify-between">
                  <span>الإصدار الأحدث v{newVersion.version_number}</span>
                  <span className="text-slate-500">{newVersion.created_at}</span>
                </div>
                <div className="whitespace-pre-wrap text-slate-100 leading-relaxed">
                  {newVersion.extracted_content}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              يحفظ النظام النسخة الثنائية كاملة (DOCX / CSV / JSON) كما هي دون إعادة إنشاء من النص لتجنب فقدان أي تنسيق.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
