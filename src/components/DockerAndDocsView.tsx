import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  ShieldCheck, 
  Database, 
  HardDrive, 
  Clock, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const DockerAndDocsView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const dockerComposeYaml = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: docuvault_app
    restart: unless-stopped
    ports:
      - "8000:80"
    environment:
      DB_CONNECTION: pgsql
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: docuvault
      DB_USERNAME: docuvault_user
      DB_PASSWORD: secret_password
      REDIS_HOST: redis
      REDIS_PORT: 6379
      QUEUE_CONNECTION: redis
      DOC_MAX_VERSIONS: 200
      DOC_RETENTION_STRATEGY: delete_oldest
      DOC_STORAGE_DISK: private
    volumes:
      - .:/var/www/html
      - storage_private:/var/www/html/storage/app/private
      - /host_data/scan_folder:/monitored_paths/folder_1:ro
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    container_name: docuvault_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: docuvault
      POSTGRES_USER: docuvault_user
      POSTGRES_PASSWORD: secret_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: docuvault_redis
    restart: unless-stopped
    ports:
      - "6379:6379"

  queue_worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: docuvault_queue
    restart: unless-stopped
    command: php artisan queue:work redis --sleep=3 --tries=3
    volumes:
      - .:/var/www/html
      - storage_private:/var/www/html/storage/app/private
    depends_on:
      - app
      - postgres
      - redis

volumes:
  pgdata:
  storage_private:`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">
            دليل التشغيل الكامل والإعداد عبر Docker و Linux (Production Deployment Guide)
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          دليل هندسي متكامل لتهيئة البيئة، تشغيل الحاويات، إعداد قاعدة بيانات PostgreSQL، وتفعيل الجدولة التلقائية بالفاحص.
        </p>
      </div>

      {/* Step by Step Guide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Quick Installation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>خطوات التثبيت والتشغيل السريع (Quickstart)</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">1. استنساخ المشروع وإعداد البيئة:</span>
              <div className="font-mono text-[11px] text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">
                cp .env.example .env
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">2. بناء وتشغيل حاويات Docker:</span>
              <div className="font-mono text-[11px] text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">
                docker-compose up -d --build
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">3. تهيئة قاعدة البيانات والجداول:</span>
              <div className="font-mono text-[11px] text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">
                docker-compose exec app php artisan migrate --seed
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">4. تشغيل أول فحص يدوي:</span>
              <div className="font-mono text-[11px] text-slate-200 bg-slate-900 p-2 rounded border border-slate-800">
                docker-compose exec app php artisan documents:scan --verbose
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cron & Linux Scheduler */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>إعداد الجدولة التلقائية على خادم Linux (Crontab)</span>
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            لتشغيل فحص المجلدات تلقائياً كل 5 دقائق بدون تدخل بشري، قم بإضافة السطر التالي في ملف <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono">crontab -e</code> الخاص بالسيرفر:
          </p>

          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs text-slate-200 flex items-center justify-between">
            <code className="text-indigo-300">* * * * * cd /var/www/html && php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1</code>
            <button
              onClick={() => handleCopy('* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1', 'crontab')}
              className="text-slate-400 hover:text-white p-1"
            >
              {copiedSection === 'crontab' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-xs space-y-1.5">
            <span className="font-bold text-indigo-300 block">ملاحظات تشغيل الإنتاج:</span>
            <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
              <li>تم تفعيل خيار <code className="text-slate-300 font-mono">withoutOverlapping(10)</code> لمنع تشغيل دورتي فحص في نفس الوقت.</li>
              <li>العمليات الثقيلة على مسارات تحتوي آلاف الملفات يتم إرسالها إلى <code className="text-slate-300 font-mono">Redis Queue</code>.</li>
              <li>الملفات المحذوفة لا يتم مسح سجلاتها، بل يتم تغيير حالتها إلى <code className="text-slate-300 font-mono">status = missing</code>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Docker Compose YAML Inspector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">ملف docker-compose.yml الكامل</h2>
          </div>
          <button
            onClick={() => handleCopy(dockerComposeYaml, 'docker_compose')}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            {copiedSection === 'docker_compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ YAML</span>
          </button>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
          <pre>{dockerComposeYaml}</pre>
        </div>
      </div>
    </div>
  );
};
