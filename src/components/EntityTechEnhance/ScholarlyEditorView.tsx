import React, { useState } from 'react';
import { 
  FileEdit, 
  Save, 
  Download, 
  BookOpen, 
  Quote, 
  Sparkles, 
  Heading1, 
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Bookmark, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink,
  Layers,
  FileText,
  Clock,
  Feather,
  Info
} from 'lucide-react';
import { BookEntity, ScholarlyFootnote, PoetryVerse, QuranicVerseCitation } from '../../types';

interface ScholarlyEditorViewProps {
  book: BookEntity;
  onSaveNewVersionToDocuVault: (title: string, content: string, changeSummary: string) => void;
  onOpenInSplitStudio?: () => void;
}

export const ScholarlyEditorView: React.FC<ScholarlyEditorViewProps> = ({
  book,
  onSaveNewVersionToDocuVault,
  onOpenInSplitStudio
}) => {
  const [content, setContent] = useState<string>(book.content_markdown);
  const [footnotes, setFootnotes] = useState<ScholarlyFootnote[]>(book.footnotes);
  const [poetryVerses, setPoetryVerses] = useState<PoetryVerse[]>(book.poetry_verses);
  const [isAddingFootnote, setIsAddingFootnote] = useState(false);
  const [isAddingPoetry, setIsAddingPoetry] = useState(false);
  const [isAddingQuran, setIsAddingQuran] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Footnote form state
  const [newFnType, setNewFnType] = useState<ScholarlyFootnote['type']>('tahqeeq');
  const [newFnContent, setNewFnContent] = useState('');

  // New Poetry form state
  const [newShatrA, setNewShatrA] = useState('');
  const [newShatrB, setNewShatrB] = useState('');
  const [newBahr, setNewBahr] = useState('البحر الكامل');

  // Change summary for versioning
  const [changeSummary, setChangeSummary] = useState('تعديل في هوامش وشواهد المتن');

  const handleAddFootnote = () => {
    if (!newFnContent.trim()) return;
    const nextNum = footnotes.length + 1;
    const newFn: ScholarlyFootnote = {
      id: `fn-${Date.now()}`,
      number: nextNum,
      type: newFnType,
      content: newFnContent,
      pageNumber: 1
    };
    setFootnotes([...footnotes, newFn]);
    // Insert footnote marker [^n] into content at cursor or end
    setContent((prev) => prev + ` [^${nextNum}]`);
    setNewFnContent('');
    setIsAddingFootnote(false);
  };

  const handleAddPoetry = () => {
    if (!newShatrA.trim() || !newShatrB.trim()) return;
    const newVerse: PoetryVerse = {
      id: `pv-${Date.now()}`,
      shatrA: newShatrA,
      shatrB: newShatrB,
      bahr: newBahr
    };
    setPoetryVerses([...poetryVerses, newVerse]);
    setContent((prev) => prev + `\n\n> *${newShatrA}* ... *${newShatrB}* (${newBahr})`);
    setNewShatrA('');
    setNewShatrB('');
    setIsAddingPoetry(false);
  };

  const handleSaveToDocuVault = () => {
    onSaveNewVersionToDocuVault(book.title, content, changeSummary);
    setSaveSuccessMsg('تم حفظ التعديلات كإصدار جديد ومؤرشف في DocuVault بنجاح!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Feather className="w-3.5 h-3.5" />
              المحرر العلمي والتحقيقي (Scholarly Tiptap Editor)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
              {book.category}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white">{book.title}</h1>
          <p className="text-xs text-slate-400">
            المؤلف: <span className="text-slate-200 font-medium">{book.author}</span> | الناشر: {book.publisher} | عدد الهوامش: {footnotes.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenInSplitStudio && (
            <button
              onClick={onOpenInSplitStudio}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>فتح في استوديو المقارنة (Split Studio)</span>
            </button>
          )}

          <button
            onClick={handleSaveToDocuVault}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ كإصدار جديد في DocuVault</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Editor & Toolbar + Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor Area (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Rich Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 text-slate-300 text-xs">
              <button
                onClick={() => setContent((c) => c + '\n## ')}
                className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition flex items-center gap-1"
                title="عنوان رئيسي"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setContent((c) => c + '\n### ')}
                className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition flex items-center gap-1"
                title="عنوان فرعي"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-slate-800 mx-1"></span>

              <button
                onClick={() => setContent((c) => c + '**نص عريض**')}
                className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition font-bold"
                title="نص عريض"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => setContent((c) => c + '*نص مائل*')}
                className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition italic"
                title="نص مائل"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => setContent((c) => c + '\n> اقتباس تحقيقي أو قول مأثور')}
                className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition"
                title="اقتباس"
              >
                <Quote className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-slate-800 mx-1"></span>

              {/* Special Scholarly Inserters */}
              <button
                onClick={() => setIsAddingFootnote(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center gap-1 transition"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>إدراج هامش تحقيقي</span>
              </button>

              <button
                onClick={() => setIsAddingPoetry(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs flex items-center gap-1 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>إدراج بيت شعري</span>
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>{wordCount} كلمة</span>
              <span>•</span>
              <span>{charCount} حرف</span>
            </div>
          </div>

          {/* New Footnote Inserter Modal / Drawer */}
          {isAddingFootnote && (
            <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" />
                  إضافة هامش علمي / تحقيقي جديد
                </span>
                <button
                  onClick={() => setIsAddingFootnote(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newFnType}
                  onChange={(e) => setNewFnType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="tahqeeq">تحقيق ومقابلة نسخ</option>
                  <option value="sharh">شرح وبيان المعنى</option>
                  <option value="takhreej">تخريج أثر أو حديث</option>
                  <option value="lugha">لغة وغريب</option>
                  <option value="general">فائدة عامة</option>
                </select>

                <input
                  type="text"
                  placeholder="نص الهامش التحقيقي..."
                  value={newFnContent}
                  onChange={(e) => setNewFnContent(e.target.value)}
                  className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingFootnote(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddFootnote}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  تأكيد الإدراج في المتن
                </button>
              </div>
            </div>
          )}

          {/* New Poetry Inserter Modal */}
          {isAddingPoetry && (
            <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  إضافة بيت شعري بشطرين متوازيين
                </span>
                <button
                  onClick={() => setIsAddingPoetry(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="الشطر الأول (الصدر)..."
                  value={newShatrA}
                  onChange={(e) => setNewShatrA(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
                <input
                  type="text"
                  placeholder="الشطر الثاني (العجز)..."
                  value={newShatrB}
                  onChange={(e) => setNewShatrB(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <select
                  value={newBahr}
                  onChange={(e) => setNewBahr(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300"
                >
                  <option value="البحر الكامل">البحر الكامل</option>
                  <option value="البحر الطويل">البحر الطويل</option>
                  <option value="البحر البسيط">البحر البسيط</option>
                  <option value="البحر الوافر">البحر الوافر</option>
                  <option value="البحر الخفيف">البحر الخفيف</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddingPoetry(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddPoetry}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    إدراج البيت
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Text Editor Area */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="w-full bg-transparent text-slate-200 text-sm leading-loose outline-none font-sans resize-y placeholder-slate-600"
              placeholder="اكتب أو عدّل المتن العلمي هنا..."
            />
          </div>

          {/* Change Summary Field for Versioning */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>سبب التعديل وملخص الإصدار (Change Summary):</span>
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="مثال: ضبط أبيات الشعر ومقابلة السقط في الصفحة 2..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Side Panels: Footnotes & Heritage Verse Explorer (1 col) */}
        <div className="space-y-4">
          {/* Footnotes List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Bookmark className="w-4 h-4" />
                <span>الهوامش والتحقيقات ({footnotes.length})</span>
              </div>
              <button
                onClick={() => setIsAddingFootnote(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                + إضافة
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {footnotes.map((fn) => (
                <div
                  key={fn.id}
                  className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 font-mono">[{fn.number}]</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {fn.type === 'tahqeeq' ? 'تحقيق' : fn.type === 'lugha' ? 'لغة' : fn.type === 'takhreej' ? 'تخريج' : 'شرح'}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{fn.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Poetry Verses Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>الشواهد الشعرية ({poetryVerses.length})</span>
              </div>
              <button
                onClick={() => setIsAddingPoetry(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                + إضافة
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {poetryVerses.map((pv) => (
                <div
                  key={pv.id}
                  className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1.5"
                >
                  <div className="text-center text-slate-200 font-serif leading-relaxed text-[11px]">
                    <div>{pv.shatrA}</div>
                    <div className="text-slate-400 text-[10px]">...</div>
                    <div>{pv.shatrB}</div>
                  </div>
                  {pv.bahr && (
                    <div className="text-[10px] text-indigo-400 text-left font-mono">
                      بحر: {pv.bahr}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
