import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { DocumentDetailView } from './components/DocumentDetailView';
import { ScanPathsView } from './components/ScanPathsView';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { ArchitectureDiagramView } from './components/ArchitectureDiagramView';
import { ApiSandboxView } from './components/ApiSandboxView';
import { TerminalView } from './components/TerminalView';
import { DockerAndDocsView } from './components/DockerAndDocsView';
import { OfflineRunnerView } from './components/OfflineRunnerView';
import { ScholarlyEditorView } from './components/EntityTechEnhance/ScholarlyEditorView';
import { ManuscripterStudioView } from './components/EntityTechEnhance/ManuscripterStudioView';
import { MediaSegmentsStudioView } from './components/EntityTechEnhance/MediaSegmentsStudioView';
import { ScholarlyReaderView } from './components/EntityTechEnhance/ScholarlyReaderView';
import { UnifiedStudioLayoutView } from './components/EntityTechEnhance/UnifiedStudioLayoutView';
import { VersionDiffModal } from './components/VersionDiffModal';
import { VirtualFileSystemModal } from './components/VirtualFileSystemModal';
import { 
  Document, 
  DocumentVersion, 
  ScanPath, 
  ScanLog, 
  ScanError, 
  VirtualFile 
} from './types';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_VERSIONS, 
  INITIAL_SCAN_PATHS, 
  INITIAL_SCAN_LOGS, 
  INITIAL_VIRTUAL_FILES,
  sha256
} from './services/simulationEngine';
import { 
  INITIAL_BOOKS,
  INITIAL_MANUSCRIPTS,
  INITIAL_MEDIA
} from './data/entityTechData';
import { 
  loadPersistedState, 
  persistState, 
  AppDatabaseState 
} from './services/storageEngine';

export default function App() {
  const initial = loadPersistedState();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [documents, setDocuments] = useState<Document[]>(initial.documents);
  const [versions, setVersions] = useState<DocumentVersion[]>(initial.versions);
  const [scanPaths, setScanPaths] = useState<ScanPath[]>(initial.scanPaths);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>(initial.scanLogs);
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>(initial.virtualFiles);

  // Sync to Local-First storage on change
  useEffect(() => {
    persistState({
      documents,
      versions,
      scanPaths,
      scanLogs,
      virtualFiles,
    });
  }, [documents, versions, scanPaths, scanLogs, virtualFiles]);

  // Modals & Navigation state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [diffModalData, setDiffModalData] = useState<{
    doc: Document;
    oldVer: DocumentVersion;
    newVer: DocumentVersion;
  } | null>(null);
  const [isVFSModalOpen, setIsVFSModalOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // ==========================================
  // SIMULATION ENGINE: FULL SCAN EXECUTION
  // ==========================================
  const runScanEngine = async (targetScanPathId?: number) => {
    setIsScanning(true);

    // Filter paths to scan
    const pathsToScan = scanPaths.filter((p) => 
      p.is_active && (targetScanPathId ? p.id === targetScanPathId : true)
    );

    let updatedDocs = [...documents];
    let updatedVersions = [...versions];
    let newScanLogs: ScanLog[] = [];

    for (const scanPath of pathsToScan) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      const filesInPath = virtualFiles.filter((f) => f.scan_path_id === scanPath.id);
      let filesScanned = 0;
      let filesCreated = 0;
      let filesUpdated = 0;
      let filesUnchanged = 0;
      let errorsCount = 0;
      let errorsList: ScanError[] = [];
      let scannedRelativePaths: string[] = [];

      for (const vFile of filesInPath) {
        filesScanned++;
        scannedRelativePaths.push(vFile.relative_path);

        // Check if file is simulated as corrupted
        if (vFile.is_corrupted) {
          errorsCount++;
          errorsList.push({
            id: Date.now() + Math.random(),
            scan_log_id: Date.now(),
            file_path: vFile.path,
            error_message: `CRC / Header Parse Error: Corrupted stream inside ${vFile.name}`,
            created_at: nowStr,
            updated_at: nowStr,
          });
          continue; // Fault tolerant: continue scanning other files
        }

        // Calculate binary hash & content hash
        const binarySeed = `${vFile.path}_${vFile.content}_${JSON.stringify(vFile.binary_meta)}_${vFile.size}`;
        const currentFileHash = await sha256(binarySeed);
        const currentContentHash = await sha256(vFile.content);

        // Match document by UNIQUE identity: scan_path_id + relative_path
        let docIndex = updatedDocs.findIndex(
          (d) => d.scan_path_id === scanPath.id && d.relative_path === vFile.relative_path
        );

        if (docIndex === -1) {
          // Document does not exist: Create Document + Version 1
          const newDocId = updatedDocs.length > 0 ? Math.max(...updatedDocs.map((d) => d.id)) + 1 : 1;
          const newDocUuid = `550e8400-e29b-41d4-a716-${String(newDocId).padStart(12, '0')}`;
          const newVersionId = updatedVersions.length > 0 ? Math.max(...updatedVersions.map((v) => v.id)) + 1 : 1;

          const newVersion: DocumentVersion = {
            id: newVersionId,
            document_id: newDocId,
            version_number: 1,
            original_filename: vFile.name,
            extension: vFile.extension,
            mime_type: vFile.mime_type,
            storage_disk: 'private',
            storage_path: `documents/${newDocUuid}/versions/1.${vFile.extension}`,
            file_size: vFile.size,
            file_hash: currentFileHash,
            content_hash: currentContentHash,
            extracted_content: vFile.content,
            source_modified_at: vFile.modified_at,
            created_at: nowStr,
            updated_at: nowStr,
            change_summary: 'الإصدار الأولي الأصلي (Initial Version)',
          };

          const newDoc: Document = {
            id: newDocId,
            uuid: newDocUuid,
            scan_path_id: scanPath.id,
            filename: vFile.name,
            relative_path: vFile.relative_path,
            extension: vFile.extension,
            mime_type: vFile.mime_type,
            status: 'active',
            latest_version_id: newVersionId,
            versions_count: 1,
            first_seen_at: nowStr,
            last_seen_at: nowStr,
            created_at: nowStr,
            updated_at: nowStr,
          };

          updatedDocs.push(newDoc);
          updatedVersions.push(newVersion);
          filesCreated++;
        } else {
          // Document exists: compare with latest version
          const existingDoc = updatedDocs[docIndex];
          const docVersions = updatedVersions
            .filter((v) => v.document_id === existingDoc.id)
            .sort((a, b) => b.version_number - a.version_number);
          
          const latestVer = docVersions[0];

          if (latestVer && latestVer.file_hash === currentFileHash) {
            // No binary change! Just update last_seen_at & status: active
            updatedDocs[docIndex] = {
              ...existingDoc,
              status: 'active',
              last_seen_at: nowStr,
            };
            filesUnchanged++;
          } else {
            // Binary or content changed! Create next version N+1
            const maxVerNumber = Math.max(...docVersions.map((v) => v.version_number), 0);
            const nextVerNumber = maxVerNumber + 1;
            const newVersionId = Math.max(...updatedVersions.map((v) => v.id), 0) + 1;

            const isOnlyFormattingChanged = latestVer && latestVer.content_hash === currentContentHash;

            const newVersion: DocumentVersion = {
              id: newVersionId,
              document_id: existingDoc.id,
              version_number: nextVerNumber,
              original_filename: vFile.name,
              extension: vFile.extension,
              mime_type: vFile.mime_type,
              storage_disk: 'private',
              storage_path: `documents/${existingDoc.uuid}/versions/${nextVerNumber}.${vFile.extension}`,
              file_size: vFile.size,
              file_hash: currentFileHash,
              content_hash: currentContentHash,
              extracted_content: vFile.content,
              source_modified_at: vFile.modified_at,
              created_at: nowStr,
              updated_at: nowStr,
              change_summary: isOnlyFormattingChanged 
                ? 'تعديل التنسيق الثنائي/الخطوط فقط (Binary Formatting Change)' 
                : 'تحديث المحتوى النصي للوثيقة',
            };

            updatedVersions.push(newVersion);

            // Apply 200 Max Versions Retention policy (delete_oldest)
            const allDocVersions = [...docVersions, newVersion];
            if (allDocVersions.length > 200) {
              // Prune oldest versions exceeding 200 limit without renumbering
              const excess = allDocVersions.length - 200;
              const oldestToPrune = allDocVersions
                .sort((a, b) => a.version_number - b.version_number)
                .slice(0, excess);

              const pruneIds = new Set(oldestToPrune.map((v) => v.id));
              updatedVersions = updatedVersions.filter((v) => !pruneIds.has(v.id));
            }

            const currentCount = updatedVersions.filter((v) => v.document_id === existingDoc.id).length;

            updatedDocs[docIndex] = {
              ...existingDoc,
              status: 'active',
              latest_version_id: newVersionId,
              versions_count: currentCount,
              last_seen_at: nowStr,
            };

            filesUpdated++;
          }
        }
      }

      // Missing documents detector: files in DB for this path not found in virtual filesystem
      let missingCount = 0;
      updatedDocs.forEach((doc, idx) => {
        if (doc.scan_path_id === scanPath.id && doc.status === 'active') {
          if (!scannedRelativePaths.includes(doc.relative_path)) {
            updatedDocs[idx] = {
              ...doc,
              status: 'missing',
            };
            missingCount++;
          }
        }
      });

      // Update scan path last scanned at
      setScanPaths((prev) =>
        prev.map((sp) => (sp.id === scanPath.id ? { ...sp, last_scanned_at: nowStr } : sp))
      );

      // Create ScanLog record
      const scanLogId = Date.now() + Math.floor(Math.random() * 1000);
      newScanLogs.push({
        id: scanLogId,
        scan_path_id: scanPath.id,
        scan_path_name: scanPath.name,
        started_at: nowStr,
        finished_at: nowStr,
        files_scanned: filesScanned,
        files_created: filesCreated,
        files_updated: filesUpdated,
        files_unchanged: filesUnchanged,
        files_missing: missingCount,
        errors_count: errorsCount,
        status: errorsCount > 0 && filesScanned === 0 ? 'failed' : 'completed',
        created_at: nowStr,
        updated_at: nowStr,
        errors: errorsList,
      });
    }

    setDocuments(updatedDocs);
    setVersions(updatedVersions);
    setScanLogs((prev) => [...newScanLogs, ...prev]);

    // If a document detail view is currently open, refresh it
    if (selectedDocument) {
      const refreshed = updatedDocs.find((d) => d.id === selectedDocument.id);
      if (refreshed) setSelectedDocument(refreshed);
    }

    setIsScanning(false);
  };

  // ==========================================
  // SIMULATE 200 VERSIONS RETENTION
  // ==========================================
  const handleSimulate200Versions = async () => {
    setIsScanning(true);
    const targetDoc = documents[0];
    if (!targetDoc) return;

    let newVersionsList = versions.filter((v) => v.document_id !== targetDoc.id);
    const now = new Date();

    // Create versions 1 to 205 for this document
    for (let i = 1; i <= 205; i++) {
      const vNum = i;
      newVersionsList.push({
        id: 1000 + vNum,
        document_id: targetDoc.id,
        version_number: vNum,
        original_filename: targetDoc.filename,
        extension: targetDoc.extension,
        mime_type: targetDoc.mime_type,
        storage_disk: 'private',
        storage_path: `documents/${targetDoc.uuid}/versions/${vNum}.${targetDoc.extension}`,
        file_size: 20000 + vNum * 10,
        file_hash: await sha256(`simulated_v${vNum}_hash`),
        content_hash: await sha256(`simulated_v${vNum}_content`),
        extracted_content: `محتوى الإصدار التجريبي رقم ${vNum} لتأكيد تطبيق الحد الأقصى 200 إصدار مع استراتيجية delete_oldest.`,
        source_modified_at: new Date(now.getTime() - (205 - i) * 60000).toISOString().replace('T', ' ').substring(0, 19),
        created_at: new Date(now.getTime() - (205 - i) * 60000).toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date(now.getTime() - (205 - i) * 60000).toISOString().replace('T', ' ').substring(0, 19),
        change_summary: `إصدار تسلسلي رقم v${vNum}`,
      });
    }

    // Apply retention: retain only latest 200 (versions 6..205) and prune 1..5
    const docVers = newVersionsList.filter((v) => v.document_id === targetDoc.id);
    const sorted = docVers.sort((a, b) => b.version_number - a.version_number);
    const retained = sorted.slice(0, 200);

    const otherVers = newVersionsList.filter((v) => v.document_id !== targetDoc.id);
    const finalVersions = [...otherVers, ...retained];

    const updatedTargetDoc: Document = {
      ...targetDoc,
      latest_version_id: 1000 + 205,
      versions_count: 200,
    };

    setVersions(finalVersions);
    setDocuments((prev) => prev.map((d) => (d.id === targetDoc.id ? updatedTargetDoc : d)));
    setSelectedDocument(updatedTargetDoc);
    setActiveTab('documents');
    setIsScanning(false);
    alert('تمت المحاكاة بنجاح! تم إنشاء 205 إصدار، وتم حذف الإصدارات 1..5 تلقائياً وبقاء الإصدارات 200 (من v6 حتى v205) دون إعادة ترقيم.');
  };

  // ==========================================
  // RESTORE OLDER VERSION AS VERSION N+1
  // ==========================================
  const handleRestoreVersion = async (doc: Document, targetVersion: DocumentVersion) => {
    const docVersions = versions.filter((v) => v.document_id === doc.id);
    const maxVerNumber = Math.max(...docVersions.map((v) => v.version_number), 0);
    const nextVerNumber = maxVerNumber + 1;
    const newVersionId = Math.max(...versions.map((v) => v.id), 0) + 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRestoredVersion: DocumentVersion = {
      id: newVersionId,
      document_id: doc.id,
      version_number: nextVerNumber,
      original_filename: targetVersion.original_filename,
      extension: targetVersion.extension,
      mime_type: targetVersion.mime_type,
      storage_disk: 'private',
      storage_path: `documents/${doc.uuid}/versions/${nextVerNumber}.${targetVersion.extension}`,
      file_size: targetVersion.file_size,
      file_hash: targetVersion.file_hash,
      content_hash: targetVersion.content_hash,
      extracted_content: targetVersion.extracted_content,
      source_modified_at: nowStr,
      created_at: nowStr,
      updated_at: nowStr,
      change_summary: `استعادة مطابقة للإصدار v${targetVersion.version_number} (Restored as v${nextVerNumber})`,
      is_restored: true,
      restored_from_version: targetVersion.version_number,
    };

    const updatedVersions = [...versions, newRestoredVersion];
    const updatedDocs = documents.map((d) =>
      d.id === doc.id
        ? {
            ...d,
            latest_version_id: newVersionId,
            versions_count: (d.versions_count || 1) + 1,
            last_seen_at: nowStr,
          }
        : d
    );

    setVersions(updatedVersions);
    setDocuments(updatedDocs);

    if (selectedDocument && selectedDocument.id === doc.id) {
      setSelectedDocument({
        ...selectedDocument,
        latest_version_id: newVersionId,
        versions_count: (selectedDocument.versions_count || 1) + 1,
        last_seen_at: nowStr,
      });
    }

    alert(`تمت استعادة الإصدار v${targetVersion.version_number} بنجاح كإصدار جديد برقم v${nextVerNumber}! تم الحفاظ على الإصدارات السابقة كنسخ غير قابلة للتعديل.`);
  };

  // ==========================================
  // DOWNLOAD SIMULATED BINARY FILE
  // ==========================================
  const handleDownloadVersion = (doc: Document, ver: DocumentVersion) => {
    const blob = new Blob([ver.extracted_content || 'BINARY_STREAM'], { type: ver.mime_type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `v${ver.version_number}_${doc.filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // SCAN PATHS MANAGEMENT
  // ==========================================
  const handleAddScanPath = (name: string, path: string) => {
    const newId = scanPaths.length > 0 ? Math.max(...scanPaths.map((p) => p.id)) + 1 : 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newPath: ScanPath = {
      id: newId,
      name,
      path,
      is_active: true,
      documents_count: 0,
      last_scanned_at: null,
      created_at: nowStr,
      updated_at: nowStr,
    };
    setScanPaths((prev) => [...prev, newPath]);
  };

  const handleToggleActiveScanPath = (id: number) => {
    setScanPaths((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleDeleteScanPath = (id: number) => {
    if (confirm('هل أنت متأكد من حذف مسار الفحص هذا؟')) {
      setScanPaths((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // ==========================================
  // VIRTUAL FILE SYSTEM HANDLERS
  // ==========================================
  const handleUpdateVirtualFile = (updated: VirtualFile) => {
    setVirtualFiles((prev) =>
      prev.map((f) => (f.path === updated.path ? updated : f))
    );
  };

  const handleDeleteVirtualFile = (filePath: string) => {
    setVirtualFiles((prev) => prev.filter((f) => f.path !== filePath));
  };

  const handleAddVirtualFile = (newFile: VirtualFile) => {
    setVirtualFiles((prev) => [...prev, newFile]);
  };

  const [selectedBook, setSelectedBook] = useState(INITIAL_BOOKS[0]);
  const [selectedManuscript, setSelectedManuscript] = useState(INITIAL_MANUSCRIPTS[0]);
  const [selectedMedia, setSelectedMedia] = useState(INITIAL_MEDIA[0]);

  const handleSaveEntityToDocuVault = async (title: string, contentText: string, changeSummary: string) => {
    const filename = `${title.replace(/[\s/\\:]+/g, '_').toLowerCase().slice(0, 35)}.md`;
    const existingDoc = documents.find((d) => d.filename === filename || d.relative_path === filename);
    const now = new Date().toISOString();
    const contentHash = await sha256(contentText);
    const fileHash = await sha256(contentText + '_raw_binary');

    if (!existingDoc) {
      const newDocId = Date.now();
      const newVerId = Date.now() + 1;
      const newDoc: Document = {
        id: newDocId,
        uuid: `doc-${Date.now()}-uuid`,
        scan_path_id: scanPaths[0]?.id || 1,
        filename,
        relative_path: filename,
        extension: 'md',
        mime_type: 'text/markdown',
        status: 'active',
        latest_version_id: newVerId,
        versions_count: 1,
        first_seen_at: now,
        last_seen_at: now,
        created_at: now,
        updated_at: now,
      };

      const newVer: DocumentVersion = {
        id: newVerId,
        document_id: newDocId,
        version_number: 1,
        original_filename: filename,
        extension: 'md',
        mime_type: 'text/markdown',
        storage_disk: 'private',
        storage_path: `documents/${newDoc.uuid}/versions/1.md`,
        file_size: new Blob([contentText]).size,
        file_hash: fileHash,
        content_hash: contentHash,
        extracted_content: contentText,
        source_modified_at: now,
        created_at: now,
        updated_at: now,
        change_summary: changeSummary || 'الإصدار الأولي المحقق من استوديو DocuVault'
      };

      newDoc.latest_version = newVer;
      setDocuments((prev) => [newDoc, ...prev]);
      setVersions((prev) => [newVer, ...prev]);
    } else {
      const nextVerNum = (existingDoc.versions_count || 1) + 1;
      const newVerId = Date.now() + 1;
      const verFileHash = await sha256(contentText + '_raw_binary_' + nextVerNum);
      const newVer: DocumentVersion = {
        id: newVerId,
        document_id: existingDoc.id,
        version_number: nextVerNum,
        original_filename: existingDoc.filename,
        extension: 'md',
        mime_type: 'text/markdown',
        storage_disk: 'private',
        storage_path: `documents/${existingDoc.uuid}/versions/${nextVerNum}.md`,
        file_size: new Blob([contentText]).size,
        file_hash: verFileHash,
        content_hash: contentHash,
        extracted_content: contentText,
        source_modified_at: now,
        created_at: now,
        updated_at: now,
        change_summary: changeSummary || `إصدار #${nextVerNum}: تعديل من الاستوديو`
      };

      setVersions((prev) => [newVer, ...prev]);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === existingDoc.id
            ? {
                ...d,
                latest_version_id: newVerId,
                latest_version: newVer,
                versions_count: nextVerNum,
                last_seen_at: now,
                updated_at: now
              }
            : d
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'documents') {
            setSelectedDocument(null);
          }
        }}
        onRunScan={() => runScanEngine()}
        isScanning={isScanning}
        onOpenVFSEditor={() => setIsVFSModalOpen(true)}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            documents={documents}
            versions={versions}
            scanPaths={scanPaths}
            scanLogs={scanLogs}
            onSelectDocument={(doc) => {
              setSelectedDocument(doc);
              setActiveTab('documents');
            }}
            onRunScan={() => runScanEngine()}
            isScanning={isScanning}
            onOpenVFSEditor={() => setIsVFSModalOpen(true)}
            onSimulate200Versions={handleSimulate200Versions}
            onNavigateToOffline={() => setActiveTab('offline_runner')}
          />
        )}

        {activeTab === 'documents' && (
          selectedDocument ? (
            <DocumentDetailView
              document={selectedDocument}
              versions={versions}
              onBack={() => setSelectedDocument(null)}
              onOpenDiff={(vOld, vNew, doc) => {
                setDiffModalData({ doc, oldVer: vOld, newVer: vNew });
              }}
              onRestoreVersion={handleRestoreVersion}
              onDownloadVersion={handleDownloadVersion}
            />
          ) : (
            <DocumentsView
              documents={documents}
              versions={versions}
              scanPaths={scanPaths}
              onSelectDocument={(doc) => setSelectedDocument(doc)}
              onOpenDiff={(vOld, vNew, doc) => {
                setDiffModalData({ doc, oldVer: vOld, newVer: vNew });
              }}
            />
          )
        )}

        {activeTab === 'scholarly_editor' && (
          <ScholarlyEditorView
            book={selectedBook}
            onSaveNewVersionToDocuVault={(title, content, summary) => {
              handleSaveEntityToDocuVault(title, content, summary);
            }}
            onOpenInSplitStudio={() => setActiveTab('unified_studio')}
          />
        )}

        {activeTab === 'manuscripter_studio' && (
          <ManuscripterStudioView
            manuscript={selectedManuscript}
            onSaveTranscriptionVersion={(pageNum, transcription) => {
              handleSaveEntityToDocuVault(
                `مخطوطة_${selectedManuscript.title}_صفحة_${pageNum}`,
                transcription,
                `تفريغ لوحة مخطوطة صفحة #${pageNum}`
              );
            }}
            onOpenInUnifiedStudio={() => setActiveTab('unified_studio')}
          />
        )}

        {activeTab === 'media_studio' && (
          <MediaSegmentsStudioView
            media={selectedMedia}
            onSaveSegmentsVersion={(segs) => {
              const textContent = segs
                .map((s) => `### ${s.title} (${Math.floor(s.start_time / 60)}:${s.start_time % 60})\n${s.text_transcript}`)
                .join('\n\n');
              handleSaveEntityToDocuVault(
                `تفريغ_صوتي_${selectedMedia.title}`,
                textContent,
                `تحديث وتفريغ المقاطع الصوتية (${segs.length} مقطع)`
              );
            }}
          />
        )}

        {activeTab === 'scholarly_reader' && (
          <ScholarlyReaderView
            book={selectedBook}
            onOpenInEditor={() => setActiveTab('scholarly_editor')}
            onOpenInStudio={() => setActiveTab('unified_studio')}
          />
        )}

        {activeTab === 'unified_studio' && (
          <UnifiedStudioLayoutView
            book={selectedBook}
            manuscript={selectedManuscript}
            media={selectedMedia}
            onSaveToDocuVault={(title, content, summary) => {
              handleSaveEntityToDocuVault(title, content, summary);
            }}
          />
        )}

        {activeTab === 'paths' && (
          <ScanPathsView
            scanPaths={scanPaths}
            scanLogs={scanLogs}
            onAddScanPath={handleAddScanPath}
            onToggleActive={handleToggleActiveScanPath}
            onDeleteScanPath={handleDeleteScanPath}
            onScanSinglePath={(sp) => runScanEngine(sp.id)}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'codebase' && <CodebaseExplorer />}

        {activeTab === 'architecture' && <ArchitectureDiagramView />}

        {activeTab === 'api_sandbox' && (
          <ApiSandboxView
            documents={documents}
            versions={versions}
            scanPaths={scanPaths}
            scanLogs={scanLogs}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalView
            onRunScan={() => runScanEngine()}
            isScanning={isScanning}
            scanLogs={scanLogs}
          />
        )}

        {activeTab === 'offline_runner' && (
          <OfflineRunnerView
            documents={documents}
            versions={versions}
            scanPaths={scanPaths}
            scanLogs={scanLogs}
            virtualFiles={virtualFiles}
            onDatabaseRestored={(state) => {
              setDocuments(state.documents);
              setVersions(state.versions);
              setScanPaths(state.scanPaths);
              setScanLogs(state.scanLogs);
              setVirtualFiles(state.virtualFiles);
            }}
            onRealFilesScanned={(newDocs, newVers, newLog) => {
              setDocuments(newDocs);
              setVersions(newVers);
              setScanLogs((prev) => [newLog, ...prev]);
            }}
          />
        )}

        {activeTab === 'docker_docs' && <DockerAndDocsView />}
      </main>

      {/* Visual Side-by-Side Diff Modal */}
      {diffModalData && (
        <VersionDiffModal
          document={diffModalData.doc}
          oldVersion={diffModalData.oldVer}
          newVersion={diffModalData.newVer}
          onClose={() => setDiffModalData(null)}
        />
      )}

      {/* Virtual Filesystem Sandbox Modal */}
      <VirtualFileSystemModal
        files={virtualFiles}
        scanPaths={scanPaths}
        isOpen={isVFSModalOpen}
        onClose={() => setIsVFSModalOpen(false)}
        onUpdateFile={handleUpdateVirtualFile}
        onDeleteFile={handleDeleteVirtualFile}
        onAddFile={handleAddVirtualFile}
        onTriggerScan={() => runScanEngine()}
      />

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 font-semibold">DocuVault Engine v1.4</span>
            <span>•</span>
            <span>Laravel 11 + PHP 8.3 + PostgreSQL 16 + Tailwind CSS</span>
          </div>
          <div>
            معمارية حفظ النسخ الثنائية الدقيقة (True Binary Copies) مع استخراج النصوص وفهرستها حتى 200 إصدار
          </div>
        </div>
      </footer>
    </div>
  );
}
