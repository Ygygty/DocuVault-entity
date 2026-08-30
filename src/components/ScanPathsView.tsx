import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Play, 
  FolderSync, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  HardDrive, 
  Clock, 
  FolderCheck,
  AlertCircle
} from 'lucide-react';
import { ScanPath, ScanLog } from '../types';

interface ScanPathsViewProps {
  scanPaths: ScanPath[];
  scanLogs: ScanLog[];
  onAddScanPath: (name: string, path: string) => void;
  onToggleActive: (id: number) => void;
  onDeleteScanPath: (id: number) => void;
  onScanSinglePath: (path: ScanPath) => void;
  isScanning: boolean;
}

export const ScanPathsView: React.FC<ScanPathsViewProps> = ({
  scanPaths,
  scanLogs,
  onAddScanPath,
  onToggleActive,
  onDeleteScanPath,
  onScanSinglePath,
  isScanning,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPath.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    onAddScanPath(newName.trim(), newPath.trim());
    setNewName('');
    setNewPath('');
    setErrorMsg('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">إدارة مسارات الفحص والمراقبة (Scan Paths)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            المسارات المحددة على الخادم التي يمر عليها الفاحص بشكل تكراري (Recursive) لاكتشاف الملفات وتوثيق إصداراتها.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مسار فحص جديد</span>
        </button>
      </div>

      {/* Scan Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scanPaths.map((sp) => {
          const pathLogs = scanLogs.filter((l) => l.scan_path_id === sp.id);
          const lastLog = pathLogs[0];

          return (
            <div
              key={sp.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 transition ${
                sp.is_active ? 'border-slate-800 hover:border-slate-750' : 'border-slate-800/40 opacity-70'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 pr-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sp.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <h3 className="font-bold text-sm text-white truncate" title={sp.name}>
                      {sp.name}
                    </h3>
                  </div>
                  <div className="font-mono text-xs text-indigo-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 break-all">
                    {sp.path}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteScanPath(sp.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                  title="حذف المسار"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Last Scan info */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>حالة المراقبة:</span>
                  <button
                    onClick={() => onToggleActive(sp.id)}
                    className={`px-2 py-0.5 rounded-full font-medium text-[11px] transition ${
                      sp.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sp.is_active ? 'مفعل (Active)' : 'معطل (Disabled)'}
                  </button>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>آخر فحص:</span>
                  <span className="font-mono text-slate-300">{sp.last_scanned_at || 'لم يتم الفحص بعد'}</span>
                </div>

                {lastLog && (
                  <div className="flex justify-between text-slate-400">
                    <span>نتائج آخر دورة:</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      {lastLog.files_scanned} ملف ({lastLog.files_created} جديد, {lastLog.files_updated} معدل)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onScanSinglePath(sp)}
                disabled={isScanning || !sp.is_active}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 ${
                  isScanning || !sp.is_active
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-sm'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>تشغيل الفحص لهذا المسار</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">إضافة مسار فحص جديد (Scan Path)</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">اسم المسار الوصفي:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: وثائق العقود الرسمية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">مسار المجلد على الخادم (Absolute Path):</label>
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="مثال: /var/data/contracts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500">
                  سيتم فحص المجلد وجميع المجلدات الفرعية بشكل Recursive.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500"
                >
                  حفظ المسار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
