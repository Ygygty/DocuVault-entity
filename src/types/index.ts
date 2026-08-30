export interface ScanPath {
  id: number;
  name: string;
  path: string;
  is_active: boolean;
  documents_count?: number;
  last_scanned_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus = 'active' | 'missing' | 'error' | 'unsupported';

export interface Document {
  id: number;
  uuid: string;
  scan_path_id: number;
  scan_path?: ScanPath;
  filename: string;
  relative_path: string;
  extension: string;
  mime_type: string;
  status: DocumentStatus;
  latest_version_id?: number | null;
  latest_version?: DocumentVersion | null;
  versions_count?: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  original_filename: string;
  extension: string;
  mime_type: string;
  storage_disk: string;
  storage_path: string;
  file_size: number;
  file_hash: string;       // SHA-256 for original full binary
  content_hash: string;    // SHA-256 for extracted text content
  extracted_content: string;
  source_modified_at: string;
  created_at: string;
  updated_at: string;
  // Visual diff / changes tag
  change_summary?: string;
  is_restored?: boolean;
  restored_from_version?: number;
}

export type ScanStatus = 'running' | 'completed' | 'failed';

export interface ScanLog {
  id: number;
  scan_path_id: number;
  scan_path_name?: string;
  started_at: string;
  finished_at: string | null;
  files_scanned: number;
  files_created: number;
  files_updated: number;
  files_unchanged: number;
  files_missing: number;
  errors_count: number;
  status: ScanStatus;
  created_at: string;
  updated_at: string;
  errors?: ScanError[];
}

export interface ScanError {
  id: number;
  scan_log_id: number;
  file_path: string;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface VirtualFile {
  path: string; // e.g. "/storage/contracts/client_agreement.docx"
  name: string;
  scan_path_id: number;
  relative_path: string;
  extension: string;
  mime_type: string;
  content: string; // Text representation or extracted content
  binary_meta: {
    font_family?: string;
    font_size?: number;
    has_bold?: boolean;
    header_color?: string;
    table_rows?: number;
    raw_bytes_tag?: string;
  };
  size: number;
  modified_at: string;
  is_corrupted?: boolean;
}

export interface CodeFile {
  phase: number;
  category: string;
  path: string;
  name: string;
  description: string;
  code: string;
  language: string;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// ==========================================
// ENTITY-TECHENHANCE ECOSYSTEM TYPES
// ==========================================

export type EnhancedEntityType = 'book' | 'manuscript' | 'audio' | 'video' | 'article';

export interface EnhancedAuthor {
  id: number;
  name: string;
  bio?: string;
  death_year?: string;
  nationality?: string;
  books_count?: number;
}

export interface EnhancedPublisher {
  id: number;
  name: string;
  country?: string;
  city?: string;
}

export interface EnhancedCategory {
  id: number;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

export interface EnhancedTag {
  id: number;
  name: string;
  slug: string;
}

export interface ScholarlyFootnote {
  id: string;
  number: number;
  type: 'tahqeeq' | 'sharh' | 'takhreej' | 'lugha' | 'general';
  content: string;
  pageNumber?: number;
}

export interface PoetryVerse {
  id: string;
  shatrA: string;
  shatrB: string;
  bahr?: string; // بحر الشعر (الطويل، البسيط، الكامل، الوافر، الخفيف...)
  rawiy?: string;
}

export interface QuranicVerseCitation {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  textUthmani: string;
  translation?: string;
}

export interface ManuscriptPageItem {
  id: number;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  transcription: string;
  notes_count: number;
  confidence_score?: number;
}

export interface ManuscriptEntity {
  id: number;
  title: string;
  author: string;
  copier_name?: string;
  copy_year_hijri?: string;
  library_name: string;
  call_number: string;
  total_pages: number;
  status: 'transcribing' | 'verified' | 'in_review';
  pages: ManuscriptPageItem[];
  versions_count: number;
}

export interface MediaSegment {
  id: number;
  title: string;
  start_time: number; // in seconds
  end_time: number;
  text_transcript: string;
  speaker?: string;
}

export interface MediaEntity {
  id: number;
  title: string;
  type: 'audio' | 'video';
  duration: number; // in seconds
  speaker: string;
  media_url: string;
  waveform_data?: number[];
  segments: MediaSegment[];
}

export interface BookEntity {
  id: number;
  title: string;
  author: string;
  category: string;
  publisher?: string;
  edition_number?: number;
  total_pages: number;
  content_markdown: string;
  footnotes: ScholarlyFootnote[];
  poetry_verses: PoetryVerse[];
  quran_citations: QuranicVerseCitation[];
  audio_sync_id?: number;
  manuscript_ref_id?: number;
}

export interface ReadingPositionState {
  entity_id: number;
  entity_type: string;
  progress_percent: number;
  current_page: number;
  current_audio_time?: number;
  last_read_at: string;
}

