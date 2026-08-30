import React, { useState, useRef } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Clock, 
  Volume2, 
  Save, 
  ListMusic, 
  FileText, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { MediaEntity, MediaSegment } from '../../types';

interface MediaSegmentsStudioViewProps {
  media: MediaEntity;
  onSaveSegmentsVersion: (segments: MediaSegment[]) => void;
}

export const MediaSegmentsStudioView: React.FC<MediaSegmentsStudioViewProps> = ({
  media,
  onSaveSegmentsVersion
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState<MediaSegment[]>(media.segments);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(1);
  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegTitle, setNewSegTitle] = useState('');
  const [newSegTranscript, setNewSegTranscript] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (time: number, segmentId?: number) => {
    setCurrentTime(time);
    if (segmentId) setActiveSegmentId(segmentId);
  };

  const handleAddSegment = () => {
    if (!newSegTitle.trim()) return;
    const newSeg: MediaSegment = {
      id: Date.now(),
      title: newSegTitle,
      start_time: Math.floor(currentTime),
      end_time: Math.min(media.duration, Math.floor(currentTime) + 60),
      text_transcript: newSegTranscript,
      speaker: 'المحاضر'
    };
    const updated = [...segments, newSeg].sort((a, b) => a.start_time - b.start_time);
    setSegments(updated);
    setNewSegTitle('');
    setNewSegTranscript('');
    setIsAddingSegment(false);
  };

  const handleSaveToDocuVault = () => {
    onSaveSegmentsVersion(segments);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5" />
              مشغل واستوديو تفريغ المقاطع الصوتية (Media & Segments Studio)
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white">{media.title}</h1>
          <p className="text-xs text-slate-400">
            الملقي: <span className="text-slate-200 font-medium">{media.speaker}</span> | المدة: {formatTime(media.duration)} | عدد المقاطع المفهرسة: {segments.length}
          </p>
        </div>

        <button
          onClick={handleSaveToDocuVault}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>حفظ تفريغ المقاطع كإصدار جديد</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم حفظ الفهرسة والمقاطع الزمنية في DocuVault بنجاح!</span>
        </div>
      )}

      {/* Main Grid: Player + Segments Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Top: Interactive Player & Waveform (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                المشغل التزامني
              </span>
              <span className="font-mono text-indigo-300">
                {formatTime(currentTime)} / {formatTime(media.duration)}
              </span>
            </div>

            {/* Waveform Visualization */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-end justify-between h-24 gap-1">
              {(media.waveform_data || [20, 40, 60, 80, 50, 90, 70, 40, 80, 100, 60, 30, 75, 85, 95, 45, 30, 60, 80, 50]).map((h, i) => {
                const isActive = (currentTime / media.duration) >= (i / 20);
                return (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    onClick={() => handleSeek((i / 20) * media.duration)}
                    className={`w-full rounded-full cursor-pointer transition-colors duration-150 ${isActive ? 'bg-purple-500 hover:bg-purple-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                  />
                );
              })}
            </div>

            {/* Progress Slider */}
            <input
              type="range"
              min={0}
              max={media.duration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="تراجع 10 ثواني"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-950/40 active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={() => setIsAddingSegment(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
                title="إضافة علامة مقطع زمني عند هذه اللحظة"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>مقطع جديد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Segments & Text Transcripts List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <span>المقاطع المفهرسة المتزامنة مع النص ({segments.length})</span>
              </div>
              <button
                onClick={() => setIsAddingSegment(true)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة تجزئة زمنية</span>
              </button>
            </div>

            {/* Inserter Form */}
            {isAddingSegment && (
              <div className="p-4 bg-slate-950 border border-purple-500/40 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                  <span>إضافة تجزئة زمنية عند التوقيت: {formatTime(currentTime)}</span>
                  <button onClick={() => setIsAddingSegment(false)} className="text-slate-400">✕</button>
                </div>
                <input
                  type="text"
                  placeholder="عنوان المقطع أو الفكرة الرئيسية..."
                  value={newSegTitle}
                  onChange={(e) => setNewSegTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
                <textarea
                  placeholder="تفريغ النص المنطوق في هذا المقطع..."
                  value={newSegTranscript}
                  onChange={(e) => setNewSegTranscript(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingSegment(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddSegment}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    حفظ المقطع
                  </button>
                </div>
              </div>
            )}

            {/* Segments Cards */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {segments.map((seg) => {
                const isActive = activeSegmentId === seg.id;
                return (
                  <div
                    key={seg.id}
                    onClick={() => handleSeek(seg.start_time, seg.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${isActive ? 'bg-purple-950/40 border-purple-500/50 shadow-md' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        {seg.title}
                      </h3>
                      <span className="text-[11px] font-mono text-purple-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-serif">
                      {seg.text_transcript}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
