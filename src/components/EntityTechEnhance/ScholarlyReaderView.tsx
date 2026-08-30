import React, { useState } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  Settings, 
  List, 
  Sun, 
  Moon, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Share2, 
  Type, 
  Sparkles,
  Layers,
  Search
} from 'lucide-react';
import { BookEntity, ScholarlyFootnote } from '../../types';

interface ScholarlyReaderViewProps {
  book: BookEntity;
  onOpenInEditor?: () => void;
  onOpenInStudio?: () => void;
}

export const ScholarlyReaderView: React.FC<ScholarlyReaderViewProps> = ({
  book,
  onOpenInEditor,
  onOpenInStudio
}) => {
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'oled' | 'paper'>('dark');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [activeFootnote, setActiveFootnote] = useState<ScholarlyFootnote | null>(null);
  const [progress, setProgress] = useState(25); // percentage
  const [searchTerm, setSearchTerm] = useState('');

  const themeClasses = {
    dark: 'bg-slate-950 text-slate-200 border-slate-800',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] border-[#d8caaf]',
    oled: 'bg-black text-slate-100 border-neutral-900',
    paper: 'bg-[#faf8f5] text-slate-900 border-stone-200',
  };

  const fontSizeClasses = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-loose',
    lg: 'text-base leading-loose',
    xl: 'text-lg leading-loose',
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white">{book.title}</h1>
            <p className="text-xs text-slate-400">تحقيق: {book.author}</p>
          </div>
        </div>

        {/* Reader Customizer & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTheme('dark')}
              className={`px-2 py-1 rounded-lg transition ${theme === 'dark' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              title="الوضع الليلي"
            >
              ليلي
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`px-2 py-1 rounded-lg transition ${theme === 'sepia' ? 'bg-[#5b4636] text-[#f4ecd8] font-bold' : 'text-slate-400'}`}
              title="ورق قديم (Sepia)"
            >
              عتيق
            </button>
            <button
              onClick={() => setTheme('paper')}
              className={`px-2 py-1 rounded-lg transition ${theme === 'paper' ? 'bg-stone-300 text-stone-900 font-bold' : 'text-slate-400'}`}
              title="ورق أبيض"
            >
              نهاري
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded-lg ${fontSize === 'sm' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 rounded-lg ${fontSize === 'base' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded-lg ${fontSize === 'lg' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xl')}
              className={`px-2 py-1 rounded-lg ${fontSize === 'xl' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              A++
            </button>
          </div>

          {onOpenInEditor && (
            <button
              onClick={onOpenInEditor}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1"
            >
              <Type className="w-3.5 h-3.5" />
              <span>فتح في المحرر</span>
            </button>
          )}

          {onOpenInStudio && (
            <button
              onClick={onOpenInStudio}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الاستوديو المزدوج</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Reading Frame */}
      <div className={`border rounded-2xl p-6 sm:p-10 shadow-lg min-h-[600px] transition-colors duration-200 ${themeClasses[theme]}`}>
        {/* Search inside text */}
        <div className="mb-6 max-w-md">
          <div className="flex items-center gap-2 bg-black/10 border border-black/20 rounded-xl px-3 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 opacity-60" />
            <input
              type="text"
              placeholder="بحث في فصول ومتن الكتاب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent w-full outline-none"
            />
          </div>
        </div>

        {/* Content Typography */}
        <div className={`space-y-6 font-serif max-w-3xl mx-auto ${fontSizeClasses[fontSize]}`}>
          <div className="text-center space-y-2 border-b pb-6 opacity-90">
            <span className="text-xs font-sans uppercase tracking-widest font-bold opacity-75">
              دار المعارف • الطبعة المحققة
            </span>
            <h2 className="text-xl sm:text-2xl font-black">{book.title}</h2>
            <p className="text-xs italic">{book.author}</p>
          </div>

          <div className="prose prose-invert max-w-none whitespace-pre-line leading-loose">
            {book.content_markdown}
          </div>

          {/* Interactive Footnotes Section at bottom */}
          {book.footnotes.length > 0 && (
            <div className="mt-12 pt-6 border-t opacity-90 space-y-2.5">
              <h3 className="text-xs font-sans font-bold flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                هوامش وتحقيقات المحقق:
              </h3>
              <div className="space-y-1.5 text-xs font-sans">
                {book.footnotes.map((fn) => (
                  <div
                    key={fn.id}
                    onClick={() => setActiveFootnote(fn)}
                    className="p-2 rounded-lg bg-black/10 hover:bg-black/20 cursor-pointer transition flex items-start gap-2"
                  >
                    <span className="font-bold text-amber-500">[{fn.number}]</span>
                    <span>{fn.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
