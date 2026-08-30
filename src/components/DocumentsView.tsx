import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Files, 
  FileText, 
  Download, 
  History, 
  ArrowUpDown, 
  ExternalLink,
  FolderGit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Document, DocumentVersion, ScanPath } from '../types';

interface DocumentsViewProps {
  documents: Document[];
  versions: DocumentVersion[];
  scanPaths: ScanPath[];
  onSelectDocument: (doc: Document) => void;
  onOpenDiff: (vOld: DocumentVersion, vNew: DocumentVersion, doc: Document) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  versions,
  scanPaths,
  onSelectDocument,
  onOpenDiff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExtension, setSelectedExtension] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedScanPath, setSelectedScanPath] = useState<string>('all');
  const [searchInContent, setSearchInContent] = useState<boolean>(true);

  // Map of documentId to its versions
  const docVersionsMap = useMemo(() => {
    const map: Record<number, DocumentVersion[]> = {};
    versions.forEach((v) => {
      if (!map[v.document_id]) map[v.document_id] = [];
      map[v.document_id].push(v);
    });
    // Sort descending by version number
    Object.values(map).forEach((list) => list.sort((a, b) => b.version_number - a.version_number));
    return map;
  }, [versions]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Extension filter
      if (selectedExtension !== 'all' && doc.extension.toLowerCase() !== selectedExtension.toLowerCase()) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
        return false;
      }
      // Scan path filter
      if (selectedScanPath !== 'all' && doc.scan_path_id !== parseInt(selectedScanPath)) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesName = doc.filename.toLowerCase().includes(query) || doc.relative_path.toLowerCase().includes(query);
        
        if (matchesName) return true;

        if (searchInContent) {
          const docVers = docVersionsMap[doc.id] || [];
          const matchesContent = docVers.some((v) => (v.extracted_content || '').toLowerCase().includes(query));
          return matchesContent;
        }

        return false;
      }

      return true;
    });
  }, [documents, selectedExtension, selectedStatus, selectedScanPath, searchTerm, searchInContent, docVersionsMap]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const extensions = ['all', 'docx', 'txt', 'md', 'csv', 'json'];
  const statuses = ['all', 'active', 'missing', 'unsupported', 'error'];

  return (
    <div className="space-y-5">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input with PostgreSQL FTS Simulation */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              id="input-document-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، المسار النسبي، أو داخل المحتوى النصي المستخرج (Full-Text Search)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Toggle Search in Extracted Content */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <input
              type="checkbox"
              id="chk-search-content"
              checked={searchInContent}
              onChange={(e) => setSearchInContent(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="chk-search-content" className="text-slate-300 select-none cursor-pointer">
              البحث داخل النصوص المستخرجة
            </label>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>الامتداد:</span>
          </div>
          {extensions.map((ext) => (
            <button
              key={ext}
              onClick={() => setSelectedExtension(ext)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs transition ${
                selectedExtension === ext
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              {ext === 'all' ? 'الكل (All)' : ext.toUpperCase()}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>الحالة:</span>
          </div>
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                selectedStatus === st
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st === 'all' ? 'الكل' : st === 'active' ? 'نشط (Active)' : st === 'missing' ? 'مفقود (Missing)' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">قائمة الوثائق المنطقية ({filteredDocs.length})</h2>
          </div>
          <span className="text-xs text-slate-400">
            تُعرف الوثيقة بواسطة: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">scan_path_id + relative_path</code>
          </span>
        </div>

        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">اسم الملف (Filename)</th>
                  <th className="py-3 px-4">المسار النسبي (Relative Path)</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">الإصدارات</th>
                  <th className="py-3 px-4">SHA-256 File Hash</th>
                  <th className="py-3 px-4">الحجم</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">آخر فحص</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocs.map((doc) => {
                  const docVers = docVersionsMap[doc.id] || [];
                  const latestVer = docVers[0];
                  const totalVers = docVers.length;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <button
                            onClick={() => onSelectDocument(doc)}
                            className="font-mono hover:text-indigo-300 transition text-right"
                          >
                            {doc.filename}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {doc.relative_path}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {doc.extension}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-semibold">
                          <History className="w-3 h-3" />
                          <span>v{totalVers}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {latestVer ? (
                          <span title={latestVer.file_hash} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {latestVer.file_hash.substring(0, 10)}...
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {latestVer ? formatBytes(latestVer.file_size) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                          doc.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'missing'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {doc.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>نشط</span>
                            </>
                          ) : doc.status === 'missing' ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>مفقود</span>
                            </>
                          ) : (
                            doc.status
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {doc.last_seen_at?.substring(5, 16)}
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {docVers.length > 1 && (
                            <button
                              onClick={() => onOpenDiff(docVers[1], docVers[0], doc)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium transition"
                              title="مقارنة آخر إصدارين"
                            >
                              مقارنة Diff
                            </button>
                          )}
                          <button
                            onClick={() => onSelectDocument(doc)}
                            className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-medium transition flex items-center gap-1"
                          >
                            <span>الإصدارات</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <p>لا توجد وثائق تطابق معايير البحث والفلترة.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedExtension('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-indigo-400 underline"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
