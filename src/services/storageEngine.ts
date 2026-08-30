import { Document, DocumentVersion, ScanPath, ScanLog, VirtualFile } from '../types';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_VERSIONS, 
  INITIAL_SCAN_PATHS, 
  INITIAL_SCAN_LOGS, 
  INITIAL_VIRTUAL_FILES,
  sha256
} from './simulationEngine';
import JSZip from 'jszip';
import { LARAVEL_CODEBASE } from '../data/laravelCodebase';

const STORAGE_KEYS = {
  DOCS: 'docuvault_docs_v1',
  VERSIONS: 'docuvault_versions_v1',
  PATHS: 'docuvault_paths_v1',
  LOGS: 'docuvault_logs_v1',
  VFS: 'docuvault_vfs_v1',
};

export interface AppDatabaseState {
  documents: Document[];
  versions: DocumentVersion[];
  scanPaths: ScanPath[];
  scanLogs: ScanLog[];
  virtualFiles: VirtualFile[];
}

/**
 * Load initial state from browser LocalStorage or fallback to seed data
 */
export function loadPersistedState(): AppDatabaseState {
  try {
    const docsJson = localStorage.getItem(STORAGE_KEYS.DOCS);
    const versionsJson = localStorage.getItem(STORAGE_KEYS.VERSIONS);
    const pathsJson = localStorage.getItem(STORAGE_KEYS.PATHS);
    const logsJson = localStorage.getItem(STORAGE_KEYS.LOGS);
    const vfsJson = localStorage.getItem(STORAGE_KEYS.VFS);

    return {
      documents: docsJson ? JSON.parse(docsJson) : INITIAL_DOCUMENTS,
      versions: versionsJson ? JSON.parse(versionsJson) : INITIAL_VERSIONS,
      scanPaths: pathsJson ? JSON.parse(pathsJson) : INITIAL_SCAN_PATHS,
      scanLogs: logsJson ? JSON.parse(logsJson) : INITIAL_SCAN_LOGS,
      virtualFiles: vfsJson ? JSON.parse(vfsJson) : INITIAL_VIRTUAL_FILES,
    };
  } catch (err) {
    console.warn('Failed to parse localStorage, resetting to initial seed:', err);
    return {
      documents: INITIAL_DOCUMENTS,
      versions: INITIAL_VERSIONS,
      scanPaths: INITIAL_SCAN_PATHS,
      scanLogs: INITIAL_SCAN_LOGS,
      virtualFiles: INITIAL_VIRTUAL_FILES,
    };
  }
}

/**
 * Persist current state to localStorage
 */
export function persistState(state: Partial<AppDatabaseState>) {
  try {
    if (state.documents) localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(state.documents));
    if (state.versions) localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(state.versions));
    if (state.scanPaths) localStorage.setItem(STORAGE_KEYS.PATHS, JSON.stringify(state.scanPaths));
    if (state.scanLogs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.scanLogs));
    if (state.virtualFiles) localStorage.setItem(STORAGE_KEYS.VFS, JSON.stringify(state.virtualFiles));
  } catch (err) {
    console.error('Failed to persist state to localStorage:', err);
  }
}

/**
 * Clear all localStorage and reset to defaults
 */
export function resetToSeedData(): AppDatabaseState {
  try {
    localStorage.removeItem(STORAGE_KEYS.DOCS);
    localStorage.removeItem(STORAGE_KEYS.VERSIONS);
    localStorage.removeItem(STORAGE_KEYS.PATHS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.VFS);
  } catch (e) {
    console.error(e);
  }
  return {
    documents: INITIAL_DOCUMENTS,
    versions: INITIAL_VERSIONS,
    scanPaths: INITIAL_SCAN_PATHS,
    scanLogs: INITIAL_SCAN_LOGS,
    virtualFiles: INITIAL_VIRTUAL_FILES,
  };
}

/**
 * Export full DB to JSON
 */
export function exportDatabaseToJson(state: AppDatabaseState) {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `docuvault_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Real Native Folder Scanner via File System Access API (showDirectoryPicker)
 */
export async function scanNativeDirectoryHandle(dirHandle: any, pathPrefix = ''): Promise<{
  name: string;
  relativePath: string;
  size: number;
  extension: string;
  content: string;
  hash: string;
  mtime: string;
}[]> {
  const files: {
    name: string;
    relativePath: string;
    size: number;
    extension: string;
    content: string;
    hash: string;
    mtime: string;
  }[] = [];

  for await (const entry of dirHandle.values()) {
    const relPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;

    if (entry.kind === 'file') {
      const file: File = await entry.getFile();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
      
      let textContent = '';
      try {
        textContent = await file.text();
      } catch {
        textContent = `[Binary Content: ${file.name}, size: ${file.size} bytes]`;
      }

      const fileBuffer = await file.arrayBuffer();
      // compute WebCrypto sha-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      files.push({
        name: file.name,
        relativePath: relPath,
        size: file.size,
        extension: ext,
        content: textContent,
        hash: hashHex,
        mtime: new Date(file.lastModified).toISOString().replace('T', ' ').substring(0, 19),
      });
    } else if (entry.kind === 'directory') {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        const subFiles = await scanNativeDirectoryHandle(entry, relPath);
        files.push(...subFiles);
      }
    }
  }

  return files;
}

/**
 * Generate and download the Complete Standalone Offline Package (ZIP)
 * containing both the client, server, run-offline scripts, and codebase.
 */
export async function downloadCompleteOfflinePackage() {
  const zip = new JSZip();

  // 1. Add run scripts
  zip.file('run-offline.bat', `@echo off
TITLE DocuVault - Standalone Offline Server
echo ========================================================
echo   DocuVault Enterprise File Versioning (Offline Mode)
echo ========================================================
echo.
echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (version 18 or newer) from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing local offline packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo [3/3] Starting DocuVault Standalone Engine...
echo Server starting at http://localhost:3000
echo.
echo (Press Ctrl+C to stop the server)
echo.

start http://localhost:3000

call npm run dev

pause
`);

  zip.file('run-offline.sh', `#!/usr/bin/env bash
set -e
echo "========================================================"
echo "  DocuVault Enterprise File Versioning (Offline Mode)"
echo "========================================================"
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed! Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "Starting DocuVault Standalone Server..."
(sleep 2 && (open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null || true)) &
npm run dev
`);

  zip.file('README-OFFLINE.md', `# دليل التشغيل المحلي أوفلاين بالكامل بدون Docker
1. Windows: انقر مرتين على run-offline.bat
2. Mac/Linux: شغّل الأمر ./run-offline.sh
3. أو شغّل الأوامر:
   npm install
   npm run dev
ثم افتح المتصفح على: http://localhost:3000
`);

  // 2. Add Laravel Codebase reference files
  LARAVEL_CODEBASE.forEach((file) => {
    zip.file(`laravel_source/${file.path}`, file.code);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'docuvault-offline-standalone-package.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
