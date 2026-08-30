import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database file path for local persistence in standalone mode
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'docuvault_local_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

// Initial DB template
interface LocalDbState {
  documents: any[];
  versions: any[];
  scanPaths: any[];
  scanLogs: any[];
}

function loadLocalDb(): LocalDbState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading DB file, fallback to empty state:', e);
  }
  return {
    documents: [],
    versions: [],
    scanPaths: [],
    scanLogs: [],
  };
}

function saveLocalDb(state: LocalDbState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local DB file:', e);
  }
}

// Helper: Calculate SHA-256 for string or buffer
function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ==========================================
// REST API ENDPOINTS (Offline & Standalone)
// ==========================================

// 1. Health & Server Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: 'standalone-offline',
    system: 'DocuVault Enterprise Versioning',
    engine: 'Node.js Express (No Docker Required)',
    timestamp: new Date().toISOString(),
  });
});

// 2. System Status & Config
app.get('/api/status', (req: Request, res: Response) => {
  const db = loadLocalDb();
  res.json({
    version: '1.4.0',
    mode: 'offline-standalone',
    docker_required: false,
    database: 'Local JSON / In-Memory / IndexedDB Engine',
    storage_disk: 'local_disk',
    max_versions_limit: 200,
    retention_strategy: 'delete_oldest',
    counts: {
      documents: db.documents.length,
      versions: db.versions.length,
      scan_paths: db.scanPaths.length,
      scan_logs: db.scanLogs.length,
    },
  });
});

// 3. Get all documents
app.get('/api/documents', (req: Request, res: Response) => {
  const db = loadLocalDb();
  res.json({
    success: true,
    data: db.documents,
    meta: { total: db.documents.length },
  });
});

// 4. Get single document + versions
app.get('/api/documents/:id', (req: Request, res: Response) => {
  const db = loadLocalDb();
  const docId = Number(req.params.id);
  const doc = db.documents.find((d: any) => d.id === docId);

  if (!doc) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const docVersions = db.versions
    .filter((v: any) => v.document_id === docId)
    .sort((a: any, b: any) => b.version_number - a.version_number);

  res.json({
    success: true,
    data: {
      ...doc,
      versions: docVersions,
    },
  });
});

// 5. Scan Real Local Directory on Host Machine (Node.js recursive scanner)
app.post('/api/scan-local-dir', (req: Request, res: Response) => {
  const { targetPath } = req.body;
  if (!targetPath || typeof targetPath !== 'string') {
    return res.status(400).json({ success: false, message: 'Target directory path is required' });
  }

  const resolvedPath = path.resolve(targetPath);
  if (!fs.existsSync(resolvedPath)) {
    return res.status(400).json({
      success: false,
      message: `Path does not exist on disk: ${resolvedPath}`,
    });
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isDirectory()) {
    return res.status(400).json({
      success: false,
      message: `Specified path is not a directory: ${resolvedPath}`,
    });
  }

  const allowedExtensions = ['.txt', '.docx', '.md', '.csv', '.json', '.html', '.js', '.ts', '.py'];
  const scannedFiles: {
    name: string;
    relativePath: string;
    fullPath: string;
    size: number;
    extension: string;
    hash: string;
    content: string;
    mtime: string;
  }[] = [];

  function scanRecursive(dir: string, base: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(base, full).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
          scanRecursive(full, base);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExtensions.includes(ext) || ext === '') {
          try {
            const fileStat = fs.statSync(full);
            // Read first 50KB or full file for text content & sha256
            const buf = fs.readFileSync(full);
            const hash = computeSha256(buf);
            let content = '';
            try {
              content = buf.toString('utf-8', 0, Math.min(buf.length, 64 * 1024));
            } catch {
              content = `[Binary file: ${entry.name}, size: ${fileStat.size} bytes]`;
            }

            scannedFiles.push({
              name: entry.name,
              relativePath: rel,
              fullPath: full,
              size: fileStat.size,
              extension: ext.replace('.', '') || 'txt',
              hash,
              content,
              mtime: fileStat.mtime.toISOString().replace('T', ' ').substring(0, 19),
            });
          } catch (err) {
            console.error(`Could not read file ${full}:`, err);
          }
        }
      }
    }
  }

  try {
    scanRecursive(resolvedPath, resolvedPath);
    res.json({
      success: true,
      scanned_directory: resolvedPath,
      total_files: scannedFiles.length,
      files: scannedFiles,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to scan directory',
      error: err.message,
    });
  }
});

// 6. Backup & Restore Database endpoints
app.get('/api/backup-db', (req: Request, res: Response) => {
  const db = loadLocalDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="docuvault_backup.json"');
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/restore-db', (req: Request, res: Response) => {
  try {
    const newState = req.body;
    if (!newState || !Array.isArray(newState.documents)) {
      return res.status(400).json({ success: false, message: 'Invalid DB backup format' });
    }
    saveLocalDb(newState);
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// VITE OR STATIC SERVING
// ==========================================
async function start() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 DocuVault Standalone Offline Engine is RUNNING!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⚡ Mode: Standalone (100% Offline, No Docker Required)`);
    console.log(`====================================================`);
  });
}

start();
