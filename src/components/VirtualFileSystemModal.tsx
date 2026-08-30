import React, { useState } from 'react';
import { 
  HardDrive, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  Play,
  Palette,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { VirtualFile, ScanPath } from '../types';

interface VirtualFileSystemModalProps {
  files: VirtualFile[];
  scanPaths: ScanPath[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateFile: (updatedFile: VirtualFile) => void;
  onDeleteFile: (filePath: string) => void;
  onAddFile: (newFile: VirtualFile) => void;
  onTriggerScan: () => void;
}

export const VirtualFileSystemModal: React.FC<VirtualFileSystemModalProps> = ({
  files,
  scanPaths,
  isOpen,
  onClose,
  onUpdateFile,
  onDeleteFile,
  onAddFile,
  onTriggerScan,
}) => {
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(files[0] || null);
  const [editContent, setEditContent] = useState<string>(files[0]?.content || '');
  const [fontFamily, setFontFamily] = useState<string>(files[0]?.binary_meta?.font_family || 'Calibri');
  const [fontSize, setFontSize] = useState<number>(files[0]?.binary_meta?.font_size || 11);
  const [hasBold, setHasBold] = useState<boolean>(files[0]?.binary_meta?.has_bold || false);
  const [headerColor, setHeaderColor] = useState<string>(files[0]?.binary_meta?.header_color || '#1E3A8A');
  const [isCorrupted, setIsCorrupted] = useState<boolean>(files[0]?.is_corrupted || false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFileName, setNewFileName] = useState('new_contract.docx');
  const [newScanPathId, setNewScanPathId] = useState(scanPaths[0]?.id || 1);
  const [newContent, setNewContent] = useState('وثيقة جديدة تم إنشاؤها لاختبار الفحص...');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectFile = (file: VirtualFile) => {
    setSelectedFile(file);
    setEditContent(file.content);
    setFontFamily(file.binary_meta?.font_family || 'Calibri');
    setFontSize(file.binary_meta?.font_size || 11);
    setHasBold(file.binary_meta?.has_bold || false);
    setHeaderColor(file.binary_meta?.header_color || '#1E3A8A');
    setIsCorrupted(file.is_corrupted || false);
    setShowAddForm(false);
  };

  const handleSaveCurrentFile = () => {
    if (!selectedFile) return;

    const updated: VirtualFile = {
      ...selectedFile,
      content: editContent,
      binary_meta: {
        ...selectedFile.binary_meta,
        font_family: fontFamily,
        font_size: fontSize,
        has_bold: hasBold,
        header_color: headerColor,
        raw_bytes_tag: `MODIFIED_${Date.now()}_${fontFamily}_${fontSize}`,
      },
      size: editContent.length + 1024,
      modified_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      is_corrupted: isCorrupted,
    };

    onUpdateFile(updated);
    setSaveSuccessMsg('تم حفظ تعديلات الملف! يمكنك الآن تشغيل الفحص لاكتشاف الإصدار الجديد.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleAddNewFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = scanPaths.find((p) => p.id === Number(newScanPathId));
    if (!sp) return;

    const ext = newFileName.split('.').pop() || 'txt';
    const filePath = `${sp.path}/${newFileName}`;

    const newVirtualFile: VirtualFile = {
      path: filePath,
      name: newFileName,
      scan_path_id: sp.id,
      relative_path: newFileName,
      extension: ext,
      mime_type: ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
      content: newContent,
      binary_meta: {
        font_family: 'Arial',
        font_size: 12,
        has_bold: false,
        raw_bytes_tag: `NEW_FILE_${Date.now()}`,
      },
      size: newContent.length + 512,
      modified_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    onAddFile(newVirtualFile);
    setSelectedFile(newVirtualFile);
    setEditContent(newContent);
    setShowAddForm(false);
    setSaveSuccessMsg('تم إنشاء الملف الجديد في المجلد! قم بتشغيل الفحص لاكتشاف Document جديد.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>محرر الملفات الافتراضية على الخادم (Virtual File System Sandbox)</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                عدّل محتوى النصوص أو التنسيقات الثنائية أو احذف ملفات لاختبار آلية اكتشاف التغيير وحفظ الإصدارات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onTriggerScan();
                onClose();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>فحص فوري بعد التعديل</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Sandbox Content Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
          {/* File Tree Left Column */}
          <div className="p-4 bg-slate-950/50 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">الملفات في المسارات ({files.length})</span>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium hover:bg-indigo-600/40 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>ملف جديد</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {files.map((file) => {
                const isSelected = selectedFile?.path === file.path && !showAddForm;
                return (
                  <div
                    key={file.path}
                    onClick={() => handleSelectFile(file)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-mono truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{file.relative_path}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`هل أنت متأكد من حذف ${file.name} من الخادم؟`)) {
                          onDeleteFile(file.path);
                          if (selectedFile?.path === file.path) {
                            setSelectedFile(null);
                          }
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="حذف الملف من المجلد (لاختبار حالة missing)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Editor Right Column */}
          <div className="md:col-span-2 p-4 flex flex-col bg-slate-900 overflow-y-auto space-y-4">
            {showAddForm ? (
              /* Add New File Form */
              <form onSubmit={handleAddNewFileSubmit} className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-white">إضافة ملف جديد في أحد مسارات الفحص</h3>

                <div className="space-y-1">
                  <label className="text-slate-300">مسار المجلد المستهدف:</label>
                  <select
                    value={newScanPathId}
                    onChange={(e) => setNewScanPathId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    {scanPaths.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.path})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">اسم الملف مع الامتداد (.docx, .txt, .md, .csv, .json):</label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">المحتوى النصي الأولي:</label>
                  <textarea
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
                  >
                    حفظ الملف في المجلد
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : selectedFile ? (
              /* Edit Existing File */
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 block">الملف المحدد:</span>
                    <h3 className="font-mono text-sm font-bold text-white">{selectedFile.path}</h3>
                  </div>

                  <button
                    onClick={handleSaveCurrentFile}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 self-start"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات (Save to Disk)</span>
                  </button>
                </div>

                {/* Binary Styling Tweaks Box for DOCX/Rich files */}
                {selectedFile.extension === 'docx' && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                      <Palette className="w-3.5 h-3.5" />
                      <span>اختبار تعديل التنسيق الثنائي فقط (Binary Styling without Text change)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      إذا قمت بتغيير الخط أو اللون دون تعديل النص، سيتغير <strong className="text-white">SHA-256 File Hash</strong> وسيُنشئ النظام إصداراً جديداً v+1 رغم تطابق Content Hash!
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400 block">نوع الخط (Font):</label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="Calibri">Calibri</option>
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Cairo">Cairo (Arabic)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block">حجم الخط (Size):</label>
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block">لون الترويسة:</label>
                        <input
                          type="color"
                          value={headerColor}
                          onChange={(e) => setHeaderColor(e.target.value)}
                          className="w-full h-7 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id="chk-has-bold"
                          checked={hasBold}
                          onChange={(e) => setHasBold(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                        />
                        <label htmlFor="chk-has-bold" className="text-slate-300 text-xs cursor-pointer select-none">
                          تنسيق عريض (Bold)
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulate Corrupted File Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-slate-200 font-medium">محاكاة تلف الملف (Corrupted File):</span>
                      <p className="text-[10px] text-slate-500">
                        سيتم تسجيل الخطأ في scan_errors دون إيقاف باقي فحص الدفعة.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCorrupted}
                    onChange={(e) => setIsCorrupted(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 w-4 h-4"
                  />
                </div>

                {/* Text Content Editor */}
                <div className="space-y-1 flex-1 flex flex-col">
                  <label className="text-xs text-slate-300 font-medium">المحتوى النصي للملف:</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full min-h-[180px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-indigo-500 leading-relaxed"
                    placeholder="اكتب أو عدل محتوى الملف هنا..."
                  />
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                اختر ملفاً من القائمة الجانبية لتعديله.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
