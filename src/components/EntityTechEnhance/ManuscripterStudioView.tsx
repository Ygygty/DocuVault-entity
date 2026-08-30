import React, { useState } from 'react';
import { 
  Scroll, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Columns, 
  Eye, 
  CheckCircle2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Layers, 
  FileCheck, 
  History,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ManuscriptEntity, ManuscriptPageItem } from '../../types';

interface ManuscripterStudioViewProps {
  manuscript: ManuscriptEntity;
  onSaveTranscriptionVersion: (pageNumber: number, newTranscription: string) => void;
  onOpenInUnifiedStudio?: () => void;
}

export const ManuscripterStudioView: React.FC<ManuscripterStudioViewProps> = ({
  manuscript,
  onSaveTranscriptionVersion,
  onOpenInUnifiedStudio
}) => {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'split' | 'image_only' | 'text_only'>('split');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [transcriptionDraft, setTranscriptionDraft] = useState(
    manuscript.pages[0]?.transcription || ''
  );
  const [savedAlert, setSavedAlert] = useState(false);

  const currentPage: ManuscriptPageItem | undefined = manuscript.pages[currentPageIdx];

  const handlePageChange = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= manuscript.pages.length) return;
    setCurrentPageIdx(newIdx);
    setTranscriptionDraft(manuscript.pages[newIdx]?.transcription || '');
    setIsEditingTranscription(false);
  };

  const handleSavePage = () => {
    if (!currentPage) return;
    onSaveTranscriptionVersion(currentPage.page_number, transcriptionDraft);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Scroll className="w-3.5 h-3.5" />
              استوديو المخطوطات والتحقيق المقارن (Manuscripter Studio)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {manuscript.status === 'verified' ? 'موثق ومقابل' : 'قيد التحقيق'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white">{manuscript.title}</h1>
          <p className="text-xs text-slate-400">
            الناسخ: <span className="text-slate-200 font-medium">{manuscript.copier_name || 'غير معروف'}</span> | سنة النسخ: {manuscript.copy_year_hijri} | الخزانة: {manuscript.library_name} ({manuscript.call_number})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenInUnifiedStudio && (
            <button
              onClick={onOpenInUnifiedStudio}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>الاستوديو الموحد (Split Workspace)</span>
            </button>
          )}

          <button
            onClick={handleSavePage}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التفريغ كإصدار مؤرشف</span>
          </button>
        </div>
      </div>

      {savedAlert && (
        <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم حفظ تفريغ الصفحة {currentPage?.page_number} في DocuVault بنجاح وتوليد بصمة SHA-256!</span>
        </div>
      )}

      {/* Main Studio Controls & View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Navigation & Toolbar */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Page Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPageIdx - 1)}
              disabled={currentPageIdx === 0}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-200">
              الصفحة {currentPage ? currentPage.page_number : 1} من {manuscript.pages.length}
            </span>
            <button
              onClick={() => handlePageChange(currentPageIdx + 1)}
              disabled={currentPageIdx >= manuscript.pages.length - 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg transition ${viewMode === 'split' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              مقارنة شطرية (Split)
            </button>
            <button
              onClick={() => setViewMode('image_only')}
              className={`px-2.5 py-1 rounded-lg transition ${viewMode === 'image_only' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              صورة المخطوط فقط
            </button>
            <button
              onClick={() => setViewMode('text_only')}
              className={`px-2.5 py-1 rounded-lg transition ${viewMode === 'text_only' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              النص المحقق فقط
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 20))}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] px-1">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(250, z + 20))}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[480px]">
          {/* Left / Top: Manuscript High-Res Viewer */}
          {(viewMode === 'split' || viewMode === 'image_only') && (
            <div className={`space-y-2 ${viewMode === 'image_only' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200">اللوحة الأصلية (Folio {currentPage?.page_number})</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
                  دقة التصوير: 600 DPI
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-[450px] flex items-center justify-center relative group">
                {currentPage ? (
                  <img
                    src={currentPage.image_url}
                    alt={`Manuscript page ${currentPage.page_number}`}
                    referrerPolicy="no-referrer"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                    className="max-h-full object-contain transition-transform duration-200 select-none shadow-2xl rounded-sm"
                  />
                ) : (
                  <span className="text-xs text-slate-500">لا توجد صورة</span>
                )}
              </div>
            </div>
          )}

          {/* Right / Bottom: Transcription Layer */}
          {(viewMode === 'split' || viewMode === 'text_only') && (
            <div className={`space-y-2 ${viewMode === 'text_only' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200">طبقة التفريغ النصي والمقابلة</span>
                {currentPage?.confidence_score && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    نسبة المطابقة: {currentPage.confidence_score}%
                  </span>
                )}
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[450px] flex flex-col justify-between">
                <textarea
                  value={transcriptionDraft}
                  onChange={(e) => setTranscriptionDraft(e.target.value)}
                  className="w-full h-full bg-transparent text-slate-100 text-sm leading-loose outline-none font-serif resize-none"
                  placeholder="نص التفريغ والتحقيق لهذه الصفحة..."
                />
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{transcriptionDraft.length} حرف</span>
                  <span className="text-indigo-400">المحرر متصل بمحرك الإصدارات DocuVault</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
