import React, { useState } from 'react';
import { 
  Server, 
  Play, 
  Copy, 
  Check, 
  Send, 
  Code2, 
  ShieldCheck, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Document, DocumentVersion, ScanPath, ScanLog } from '../types';

interface ApiSandboxViewProps {
  documents: Document[];
  versions: DocumentVersion[];
  scanPaths: ScanPath[];
  scanLogs: ScanLog[];
}

export const ApiSandboxView: React.FC<ApiSandboxViewProps> = ({
  documents,
  versions,
  scanPaths,
  scanLogs,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('get_documents');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [urlPath, setUrlPath] = useState<string>('/api/documents');
  const [requestBody, setRequestBody] = useState<string>('');
  const [responseCode, setResponseCode] = useState<number>(200);
  const [responseJson, setResponseJson] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoints = [
    {
      id: 'get_documents',
      name: 'GET /api/documents',
      method: 'GET' as const,
      path: '/api/documents',
      desc: 'قائمة الوثائق مع التصفية والصفحات (Pagination & Status/Extension Filters)',
      body: '',
    },
    {
      id: 'get_single_document',
      name: 'GET /api/documents/1',
      method: 'GET' as const,
      path: '/api/documents/1',
      desc: 'تفاصيل وثيقة معينة مع أحدث إصدار ومسار الفحص',
      body: '',
    },
    {
      id: 'get_versions',
      name: 'GET /api/documents/1/versions',
      method: 'GET' as const,
      path: '/api/documents/1/versions',
      desc: 'قائمة كافة الإصدارات السابقة للوثيقة',
      body: '',
    },
    {
      id: 'get_version_content',
      name: 'GET /api/document-versions/1/content',
      method: 'GET' as const,
      path: '/api/document-versions/1/content',
      desc: 'عرض المحتوى النصي المستخرج والـ Content Hash لإصدار معين',
      body: '',
    },
    {
      id: 'restore_version',
      name: 'POST /api/documents/1/versions/1/restore',
      method: 'POST' as const,
      path: '/api/documents/1/versions/1/restore',
      desc: 'استعادة إصدار سابق عبر إنشاء إصدار جديد N+1 مطابق',
      body: '{}',
    },
    {
      id: 'get_scan_paths',
      name: 'GET /api/scan-paths',
      method: 'GET' as const,
      path: '/api/scan-paths',
      desc: 'قائمة مسارات الفحص المراقبة مع عدد الوثائق',
      body: '',
    },
    {
      id: 'trigger_path_scan',
      name: 'POST /api/scan-paths/1/scan',
      method: 'POST' as const,
      path: '/api/scan-paths/1/scan',
      desc: 'تشغيل فحص فوري لمسار محدد وإرجاع سجل الفحص ScanLog',
      body: '{}',
    },
  ];

  const handleSelectEndpoint = (ep: typeof endpoints[0]) => {
    setSelectedEndpoint(ep.id);
    setHttpMethod(ep.method);
    setUrlPath(ep.path);
    setRequestBody(ep.body);
    setResponseJson('');
  };

  const handleSendRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      let data: any = {};
      let status = 200;

      if (selectedEndpoint === 'get_documents') {
        status = 200;
        data = {
          data: documents.map((d) => ({
            id: d.id,
            uuid: d.uuid,
            filename: d.filename,
            relative_path: d.relative_path,
            extension: d.extension,
            status: d.status,
            versions_count: d.versions_count,
            last_seen_at: d.last_seen_at,
          })),
          meta: {
            current_page: 1,
            per_page: 15,
            total: documents.length,
          },
        };
      } else if (selectedEndpoint === 'get_single_document') {
        const doc = documents[0];
        status = 200;
        data = {
          data: {
            ...doc,
            latest_version: versions.find((v) => v.id === doc.latest_version_id),
            scan_path: scanPaths.find((p) => p.id === doc.scan_path_id),
          },
        };
      } else if (selectedEndpoint === 'get_versions') {
        const docVers = versions.filter((v) => v.document_id === 1);
        status = 200;
        data = {
          data: docVers,
          meta: { total: docVers.length },
        };
      } else if (selectedEndpoint === 'get_version_content') {
        const v = versions[0];
        status = 200;
        data = {
          version_number: v.version_number,
          content_hash: v.content_hash,
          extracted_content: v.extracted_content,
        };
      } else if (selectedEndpoint === 'restore_version') {
        status = 201;
        data = {
          message: 'Successfully restored Version 1 as Version 4 (New Immutable Version Created)',
          new_version: {
            id: 99,
            document_id: 1,
            version_number: 4,
            file_hash: versions[0].file_hash,
            content_hash: versions[0].content_hash,
            storage_path: 'documents/550e8400-e29b-41d4-a716-446655440001/versions/4.docx',
            created_at: new Date().toISOString(),
          },
        };
      } else if (selectedEndpoint === 'get_scan_paths') {
        status = 200;
        data = scanPaths;
      } else if (selectedEndpoint === 'trigger_path_scan') {
        status = 200;
        data = {
          message: 'Scan completed successfully',
          log: scanLogs[0] || {
            status: 'completed',
            files_scanned: 3,
            files_created: 0,
            files_updated: 1,
            files_unchanged: 2,
            files_missing: 0,
            errors_count: 0,
          },
        };
      }

      setResponseCode(status);
      setResponseJson(JSON.stringify(data, null, 2));
      setIsLoading(false);
    }, 250);
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">
            منصة تجربة واجهات البرمجة التفاعلية (REST API Sandbox)
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          اختبار مباشر لجميع Endpoints المصممة باستخدام Laravel API Resources و Form Requests مع كود الاستجابة الحية.
        </p>
      </div>

      {/* Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Endpoint Selector Left Sidebar */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
          <h2 className="text-xs font-bold text-slate-400">قائمة مسارات الـ API المدعومة</h2>

          <div className="space-y-1.5">
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-right p-3 rounded-xl border transition text-xs space-y-1 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{ep.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                        ep.method === 'GET'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{ep.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Request / Response Console */}
        <div className="lg:col-span-8 space-y-4">
          {/* Request Header Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  httpMethod === 'GET'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {httpMethod}
              </span>
              <input
                type="text"
                value={urlPath}
                readOnly
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-white outline-none"
              />
              <button
                onClick={handleSendRequest}
                disabled={isLoading}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5"
              >
                <Send className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>إرسال الطلب</span>
              </button>
            </div>

            {/* Auth Token Header Indicator */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorization: Bearer <code className="text-slate-200">1|laravel_sanctum_token_secret...</code></span>
            </div>
          </div>

          {/* Response Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[500px]">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">الاستجابة الحية (JSON Response):</span>
                {responseJson && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      responseCode === 200 || responseCode === 201
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    HTTP {responseCode} OK
                  </span>
                )}
              </div>

              {responseJson && (
                <button
                  onClick={handleCopyResponse}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ JSON'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 select-text bg-slate-950">
              {responseJson ? (
                <pre className="whitespace-pre">
                  <code>{responseJson}</code>
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                  <Server className="w-8 h-8 opacity-40 text-indigo-400" />
                  <p>اضغط على زر "إرسال الطلب" لتنفيذ الـ API وعرض الاستجابة.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
