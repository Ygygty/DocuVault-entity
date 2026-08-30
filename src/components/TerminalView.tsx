import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Trash2, 
  RotateCcw, 
  Clock, 
  Layers, 
  CheckCircle2, 
  FolderSync,
  Sparkles
} from 'lucide-react';
import { Document, DocumentVersion, ScanPath, ScanLog } from '../types';

interface TerminalViewProps {
  onRunScan: () => void;
  isScanning: boolean;
  scanLogs: ScanLog[];
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  onRunScan,
  isScanning,
  scanLogs,
}) => {
  const [commandInput, setCommandInput] = useState('php artisan documents:scan --verbose');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'DocuVault CLI Environment [PHP 8.3.4 - Laravel 11.2.0 - PostgreSQL 16]',
    'Type commands below or click preset buttons to execute Artisan actions.',
    '----------------------------------------------------------------------',
  ]);

  const addLog = (lines: string[]) => {
    setTerminalLogs((prev) => [...prev, ...lines]);
  };

  const handleExecute = (cmd?: string) => {
    const toRun = cmd || commandInput;

    if (toRun.trim() === 'clear' || toRun.trim() === 'cls') {
      setTerminalLogs([]);
      return;
    }

    addLog([`$ ${toRun}`]);

    if (toRun.includes('documents:scan')) {
      addLog([
        '[SCAN-ENGINE] Initializing FileScannerService across active paths...',
        '--------------------------------------------------',
        'Scanning: [العقود والاتفاقيات القانونية] => /var/data/legal_contracts',
        '+ Checked: nda_template_2026.docx (SHA-256 binary hash verified)',
        '+ Checked: vendor_agreement.md (Unchanged)',
        '+ Checked: policies/terms_of_service.txt (Unchanged)',
        '--------------------------------------------------',
        '+--------------------+-------+',
        '| Metric             | Count |',
        '+--------------------+-------+',
        '| Files Scanned      | 3     |',
        '| New Documents      | 0     |',
        '| Updated Documents  | 1     |',
        '| Unchanged Files    | 2     |',
        '| Missing Documents  | 0     |',
        '| Errors             | 0     |',
        '| Status             | OK    |',
        '+--------------------+-------+',
        'Scan completed successfully in 0.048s. Database & Storage synced.',
      ]);
      onRunScan();
    } else if (toRun.includes('queue:work')) {
      addLog([
        '[2026-08-30 08:30:00] Processing: App\\Jobs\\ScanPathJob',
        '[2026-08-30 08:30:01] Processed:  App\\Jobs\\ScanPathJob (52.14ms)',
        'Worker idle, waiting for queued jobs on redis connection...',
      ]);
    } else if (toRun.includes('schedule:list')) {
      addLog([
        '+-----------------------+------------------+-----------------------------+--------------------+',
        '| Command               | Interval         | Description                 | Next Run           |',
        '+-----------------------+------------------+-----------------------------+--------------------+',
        '| documents:scan        | */5 * * * *      | Recursive Folder Scan       | in 3 minutes       |',
        '+-----------------------+------------------+-----------------------------+--------------------+',
      ]);
    } else if (toRun.includes('test')) {
      addLog([
        '   PASS  Tests\\Unit\\FileHashServiceTest',
        '  ✓ it calculates correct sha256 hash for binary file (0.02s)',
        '  ✓ it detects hash difference when formatting or binary changes (0.01s)',
        '',
        '   PASS  Tests\\Unit\\VersionRetentionTest',
        '  ✓ it retains max versions and deletes oldest without renumbering (0.08s)',
        '',
        '   PASS  Tests\\Feature\\FileScannerFeatureTest',
        '  ✓ it creates document and version 1 on first discovery (0.04s)',
        '  ✓ it detects missing files without deleting historical records (0.03s)',
        '',
        '  Tests:    5 passed (14 assertions)',
        '  Duration: 0.18s',
      ]);
    } else {
      addLog([
        `Command executed: ${toRun}`,
        'Finished with exit code 0.',
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">
            وحدة التحكم التفاعلية بالأوامر (Artisan CLI & Scheduler Terminal)
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          تشغيل أوامر Artisan للفحص اليدوي، تشغيل طابور المعالجة (Queues)، واختبار الجدولة التلقائية (Cron Schedule).
        </p>
      </div>

      {/* Preset Command Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => {
            setCommandInput('php artisan documents:scan --verbose');
            handleExecute('php artisan documents:scan --verbose');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-300 font-mono flex items-center gap-1.5"
        >
          <Play className="w-3 h-3 text-indigo-400" />
          <span>php artisan documents:scan</span>
        </button>

        <button
          onClick={() => {
            setCommandInput('php artisan queue:work redis');
            handleExecute('php artisan queue:work redis');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-cyan-300 font-mono flex items-center gap-1.5"
        >
          <Play className="w-3 h-3 text-cyan-400" />
          <span>php artisan queue:work</span>
        </button>

        <button
          onClick={() => {
            setCommandInput('php artisan schedule:list');
            handleExecute('php artisan schedule:list');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-300 font-mono flex items-center gap-1.5"
        >
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>php artisan schedule:list</span>
        </button>

        <button
          onClick={() => {
            setCommandInput('php artisan test');
            handleExecute('php artisan test');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-purple-300 font-mono flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3 h-3 text-purple-400" />
          <span>php artisan test</span>
        </button>

        <button
          onClick={() => setTerminalLogs([])}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-400 text-xs flex items-center gap-1 mr-auto"
        >
          <Trash2 className="w-3 h-3" />
          <span>مسح الشاشة</span>
        </button>
      </div>

      {/* Terminal Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Terminal Titlebar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs text-slate-400 font-mono mr-2">bash - docuvault_app:/var/www/html</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">PHP 8.3.4 (cli)</span>
        </div>

        {/* Terminal Output */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 space-y-1 select-text bg-slate-950">
          {terminalLogs.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.startsWith('$')
                  ? 'text-cyan-400 font-bold'
                  : log.includes('PASS') || log.includes('passed') || log.includes('OK')
                  ? 'text-emerald-400'
                  : log.includes('error') || log.includes('Missing')
                  ? 'text-rose-400'
                  : log.includes('Updated')
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {/* Terminal Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute();
          }}
          className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-mono text-xs font-bold">$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            className="flex-1 bg-transparent font-mono text-xs text-white outline-none"
            placeholder="اكتب أمر Artisan..."
          />
          <button
            type="submit"
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
          >
            تنفيذ
          </button>
        </form>
      </div>
    </div>
  );
};
