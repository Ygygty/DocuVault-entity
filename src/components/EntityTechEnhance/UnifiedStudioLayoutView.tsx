import React, { useState } from 'react';
import { 
  Layers, 
  Scroll, 
  FileEdit, 
  Headphones, 
  Save, 
  CheckCircle2, 
  Maximize2, 
  Columns, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  History
} from 'lucide-react';
import { BookEntity, ManuscriptEntity, MediaEntity } from '../../types';

interface UnifiedStudioLayoutViewProps {
  book: BookEntity;
  manuscript: ManuscriptEntity;
  media: MediaEntity;
  onSaveToDocuVault: (title: string, content: string, changeSummary: string) => void;
}

export const UnifiedStudioLayoutView: React.FC<UnifiedStudioLayoutViewProps> = ({
  book,
  manuscript,
  media,
  onSaveToDocuVault
}) => {
  const [activeLeftTab, setActiveLeftTab] = useState<'manuscript' | 'media'>('manuscript');
  const [editorText, setEditorText] = useState(book.content_markdown);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [changeMsg, setChangeMsg] = useState('مطابقة نص التحقيق مع لوحة المخطوط رقم 1');

  const currentPage = manuscript.pages[currentPageIdx];

  const handleSaveSnapshot = () => {
    onSaveToDocuVault(
      `استوديو التحقيق المزدوج: ${book.title}`,
      editorText,
      changeMsg
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              الاستوديو الموحد للتحقيق المزدوج (Unified Split Workspace)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              مخطوط + محرر + شروح صوتية
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white">
            بيئة العمل المتزامنة: {book.title}
          </h1>
          <p className="text-xs text-slate-400">
            مربوط بمخطوطة: <span className="text-slate-200">{manuscript.title}</span> | الشرح الصوتي: {media.speaker}
          </p>
        </div>

        <button
          onClick={handleSaveSnapshot}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 active:scale-95 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>أرشفة النسخة في DocuVault</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم حفظ النسخة المشتركة وتوليد بصمة SHA-256 وأرشفتها في DocuVault بنجاح!</span>
        </div>
      )}

      {/* Two-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Left Pane: Reference Manuscript or Media */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Pane Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveLeftTab('manuscript')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${activeLeftTab === 'manuscript' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>لوحة المخطوط</span>
              </button>
              <button
                onClick={() => setActiveLeftTab('media')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${activeLeftTab === 'media' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>الشرح الصوتي</span>
              </button>
            </div>

            {activeLeftTab === 'manuscript' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <button
                  onClick={() => setCurrentPageIdx(Math.max(0, currentPageIdx - 1))}
                  disabled={currentPageIdx === 0}
                  className="p-1 rounded bg-slate-900 disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px]">
                  {currentPage?.page_number || 1} / {manuscript.pages.length}
                </span>
                <button
                  onClick={() => setCurrentPageIdx(Math.min(manuscript.pages.length - 1, currentPageIdx + 1))}
                  disabled={currentPageIdx >= manuscript.pages.length - 1}
                  className="p-1 rounded bg-slate-900 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Left Pane Body */}
          <div className="p-4 flex-1 flex flex-col justify-center items-center bg-slate-950/60 overflow-hidden">
            {activeLeftTab === 'manuscript' && (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {currentPage && (
                  <img
                    src={currentPage.image_url}
                    alt="Manuscript Folio"
                    referrerPolicy="no-referrer"
                    className="max-h-[460px] object-contain rounded-lg shadow-xl"
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  خزانة {manuscript.library_name} — لوحة رقم {currentPage?.page_number}
                </p>
              </div>
            )}

            {activeLeftTab === 'media' && (
              <div className="w-full space-y-4 p-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-xl border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>{media.title}</span>
                    <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">صوت متزامن</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{media.speaker}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-300 text-xs">مقاطع الفهرسة المتزامنة:</h4>
                  {media.segments.map((s) => (
                    <div key={s.id} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] space-y-1">
                      <div className="font-bold text-slate-200">{s.title}</div>
                      <div className="text-slate-400 font-serif leading-relaxed">{s.text_transcript}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Live Scholarly Transcription & Editing */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <FileEdit className="w-4 h-4 text-emerald-400" />
              <span>محرر المتن والتحقيق المباشر (Tiptap Scholarly Core)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {editorText.length} حرف
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between bg-slate-950">
            <textarea
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              className="w-full h-[420px] bg-transparent text-slate-100 text-sm leading-loose outline-none font-serif resize-none"
              placeholder="اكتب تفريغ النص وحقق المتن بمطابقته مع لوحة المخطوط على اليسار..."
            />

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <input
                type="text"
                value={changeMsg}
                onChange={(e) => setChangeMsg(e.target.value)}
                placeholder="ملخص التعديلات لتسجيله في سجل الإصدارات..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
