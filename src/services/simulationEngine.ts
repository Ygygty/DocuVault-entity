import { Document, DocumentVersion, ScanPath, ScanLog, ScanError, VirtualFile, DiffLine } from '../types';

// Simple fast SHA-256 implementation in JavaScript
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function syncSha256(message: string): string {
  // deterministic hash for sync state initialization
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.repeat(8);
}

export const INITIAL_SCAN_PATHS: ScanPath[] = [
  {
    id: 1,
    name: 'العقود والاتفاقيات القانونية (Legal Contracts)',
    path: '/var/data/legal_contracts',
    is_active: true,
    documents_count: 3,
    last_scanned_at: '2026-08-30 08:30:00',
    created_at: '2026-08-25 10:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 2,
    name: 'التقارير المالية والتدقيق (Financial Reports)',
    path: '/storage/financial_reports',
    is_active: true,
    documents_count: 2,
    last_scanned_at: '2026-08-30 08:30:00',
    created_at: '2026-08-25 10:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 3,
    name: 'المواصفات التقنية والتوثيق (Tech Specs)',
    path: '/srv/tech_docs',
    is_active: true,
    documents_count: 2,
    last_scanned_at: '2026-08-30 08:30:00',
    created_at: '2026-08-26 12:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
];

export const INITIAL_VIRTUAL_FILES: VirtualFile[] = [
  {
    path: '/var/data/legal_contracts/nda_template_2026.docx',
    name: 'nda_template_2026.docx',
    scan_path_id: 1,
    relative_path: 'nda_template_2026.docx',
    extension: 'docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: `اتفاقية عدم إفصاح وحماية سرية المعلومات (NDA)
الطرف الأول: شركة التقنية المتقدمة للحلول السحابية
الطرف الثاني: المقاول المستقل / الشريك التقني

البند الأول: الالتزام بالسرية
يتعهد الطرف الثاني بعدم إفصاح أي معلومات سرية أو شيفرات برمجية أو بيانات مالية تخص الطرف الأول لأي طرف ثالث.

البند الثاني: مدة الاتفاقية
تسري هذه الاتفاقية لمدة 3 سنوات من تاريخ التوقيع الرسمي.

البند الثالث: التعويضات والشرط الجزائي
يتحمل الطرف المخالف تعويضاً مالياً قدره 100,000 دولار أمريكي عن أي إخلال بالبنود.`,
    binary_meta: {
      font_family: 'Calibri',
      font_size: 11,
      has_bold: true,
      header_color: '#1E3A8A',
      table_rows: 4,
      raw_bytes_tag: 'PK\x03\x04\x14\x00word/document.xml',
    },
    size: 24576,
    modified_at: '2026-08-30 08:15:00',
  },
  {
    path: '/var/data/legal_contracts/vendor_agreement.md',
    name: 'vendor_agreement.md',
    scan_path_id: 1,
    relative_path: 'vendor_agreement.md',
    extension: 'md',
    mime_type: 'text/markdown',
    content: `# اتفاقية تزويد خدمات البنية التحتية
## 1. نطاق العمل
توفير خوادم عالية الأداء واستضافة قواعد بيانات PostgreSQL مع نسخ احتياطي يومي.

## 2. مستوى الخدمة (SLA)
ضمان وقت تشغيل Uptime لا يقل عن 99.95% شهرياً.

## 3. الدعم الفني
استجابة خلال أقل من 15 دقيقة للحالات الحرجة (Severity 1).`,
    binary_meta: {
      raw_bytes_tag: 'MD_RAW_BYTES_01',
    },
    size: 4096,
    modified_at: '2026-08-29 14:20:00',
  },
  {
    path: '/var/data/legal_contracts/policies/terms_of_service.txt',
    name: 'terms_of_service.txt',
    scan_path_id: 1,
    relative_path: 'policies/terms_of_service.txt',
    extension: 'txt',
    mime_type: 'text/plain',
    content: `شروط الاستخدام وسياسة الخصوصية
1. يحظر استخدام النظام لأي أغراض غير مصرح بها.
2. يتم فحص جميع الملفات تلقائياً وتوثيق إصداراتها.
3. يحق للإدارة تعليق الحسابات المخالفة فوراً.`,
    binary_meta: {
      raw_bytes_tag: 'TXT_RAW_BYTES',
    },
    size: 2048,
    modified_at: '2026-08-28 09:00:00',
  },
  {
    path: '/storage/financial_reports/q1_financial_summary.csv',
    name: 'q1_financial_summary.csv',
    scan_path_id: 2,
    relative_path: 'q1_financial_summary.csv',
    extension: 'csv',
    mime_type: 'text/csv',
    content: `الشهر,الإيرادات,المصروفات,صافي الأرباح
يناير,125000,45000,80000
فبراير,142000,51000,91000
مارس,168000,59000,109000`,
    binary_meta: {
      raw_bytes_tag: 'CSV_RAW_BYTES',
    },
    size: 3580,
    modified_at: '2026-08-29 17:40:00',
  },
  {
    path: '/storage/financial_reports/audit_trail_2026.json',
    name: 'audit_trail_2026.json',
    scan_path_id: 2,
    relative_path: 'audit_trail_2026.json',
    extension: 'json',
    mime_type: 'application/json',
    content: `{\n  "audit_year": 2026,\n  "auditor": "KPMG Audit Services",\n  "status": "APPROVED",\n  "compliance_score": 98.4,\n  "reviewed_documents_count": 1420\n}`,
    binary_meta: {
      raw_bytes_tag: 'JSON_RAW_BYTES',
    },
    size: 1520,
    modified_at: '2026-08-30 07:10:00',
  },
  {
    path: '/srv/tech_docs/api_specifications.json',
    name: 'api_specifications.json',
    scan_path_id: 3,
    relative_path: 'api_specifications.json',
    extension: 'json',
    mime_type: 'application/json',
    content: `{\n  "openapi": "3.1.0",\n  "info": {\n    "title": "DocuVault File Management API",\n    "version": "1.4.0"\n  },\n  "servers": [\n    {\n      "url": "https://api.docuvault.local/v1"\n    }\n  ]\n}`,
    binary_meta: {
      raw_bytes_tag: 'OPENAPI_SPEC_BYTES',
    },
    size: 5120,
    modified_at: '2026-08-28 11:30:00',
  },
  {
    path: '/srv/tech_docs/architecture_rfc.md',
    name: 'architecture_rfc.md',
    scan_path_id: 3,
    relative_path: 'architecture_rfc.md',
    extension: 'md',
    mime_type: 'text/markdown',
    content: `# RFC-104: بنية نظام Versioning وتخزين الملفات
- **الهدف**: دعم 200 نسخة لكل وثيقة مع استراتيجية delete_oldest.
- **التخزين**: Private Storage Disk حصراً.
- **الأمان**: SHA-256 Binary Hash لاكتشاف التغييرات.`,
    binary_meta: {
      raw_bytes_tag: 'RFC_BYTES',
    },
    size: 2800,
    modified_at: '2026-08-27 16:00:00',
  },
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 1,
    uuid: '550e8400-e29b-41d4-a716-446655440001',
    scan_path_id: 1,
    filename: 'nda_template_2026.docx',
    relative_path: 'nda_template_2026.docx',
    extension: 'docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    status: 'active',
    latest_version_id: 3,
    versions_count: 3,
    first_seen_at: '2026-08-25 10:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-25 10:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 2,
    uuid: '550e8400-e29b-41d4-a716-446655440002',
    scan_path_id: 1,
    filename: 'vendor_agreement.md',
    relative_path: 'vendor_agreement.md',
    extension: 'md',
    mime_type: 'text/markdown',
    status: 'active',
    latest_version_id: 4,
    versions_count: 1,
    first_seen_at: '2026-08-26 12:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-26 12:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 3,
    uuid: '550e8400-e29b-41d4-a716-446655440003',
    scan_path_id: 1,
    filename: 'terms_of_service.txt',
    relative_path: 'policies/terms_of_service.txt',
    extension: 'txt',
    mime_type: 'text/plain',
    status: 'active',
    latest_version_id: 5,
    versions_count: 1,
    first_seen_at: '2026-08-27 09:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-27 09:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 4,
    uuid: '550e8400-e29b-41d4-a716-446655440004',
    scan_path_id: 2,
    filename: 'q1_financial_summary.csv',
    relative_path: 'q1_financial_summary.csv',
    extension: 'csv',
    mime_type: 'text/csv',
    status: 'active',
    latest_version_id: 6,
    versions_count: 1,
    first_seen_at: '2026-08-28 10:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-28 10:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 5,
    uuid: '550e8400-e29b-41d4-a716-446655440005',
    scan_path_id: 2,
    filename: 'audit_trail_2026.json',
    relative_path: 'audit_trail_2026.json',
    extension: 'json',
    mime_type: 'application/json',
    status: 'active',
    latest_version_id: 7,
    versions_count: 1,
    first_seen_at: '2026-08-28 11:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-28 11:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 6,
    uuid: '550e8400-e29b-41d4-a716-446655440006',
    scan_path_id: 3,
    filename: 'api_specifications.json',
    relative_path: 'api_specifications.json',
    extension: 'json',
    mime_type: 'application/json',
    status: 'active',
    latest_version_id: 8,
    versions_count: 1,
    first_seen_at: '2026-08-28 14:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-28 14:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
  {
    id: 7,
    uuid: '550e8400-e29b-41d4-a716-446655440007',
    scan_path_id: 3,
    filename: 'architecture_rfc.md',
    relative_path: 'architecture_rfc.md',
    extension: 'md',
    mime_type: 'text/markdown',
    status: 'active',
    latest_version_id: 9,
    versions_count: 1,
    first_seen_at: '2026-08-29 16:00:00',
    last_seen_at: '2026-08-30 08:30:00',
    created_at: '2026-08-29 16:00:00',
    updated_at: '2026-08-30 08:30:00',
  },
];

export const INITIAL_VERSIONS: DocumentVersion[] = [
  {
    id: 1,
    document_id: 1,
    version_number: 1,
    original_filename: 'nda_template_2026.docx',
    extension: 'docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440001/versions/1.docx',
    file_size: 21504,
    file_hash: syncSha256('v1_binary_nda_raw_initial'),
    content_hash: syncSha256('v1_text_nda_content'),
    extracted_content: `اتفاقية عدم إفصاح وحماية سرية المعلومات (NDA)
الطرف الأول: شركة التقنية المتقدمة
الطرف الثاني: المقاول المستقل

البند الأول: الالتزام بالسرية
يتعهد الطرف الثاني بعدم إفصاح أي معلومات سرية للطرف الأول.

البند الثاني: مدة الاتفاقية
تسري هذه الاتفاقية لمدة سنة واحدة.`,
    source_modified_at: '2026-08-25 10:00:00',
    created_at: '2026-08-25 10:00:00',
    updated_at: '2026-08-25 10:00:00',
    change_summary: 'الإصدار الأولي الأصلي (Initial Version)',
  },
  {
    id: 2,
    document_id: 1,
    version_number: 2,
    original_filename: 'nda_template_2026.docx',
    extension: 'docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440001/versions/2.docx',
    file_size: 23100,
    file_hash: syncSha256('v2_binary_nda_raw_modified_font'),
    content_hash: syncSha256('v2_text_nda_content_expanded'),
    extracted_content: `اتفاقية عدم إفصاح وحماية سرية المعلومات (NDA)
الطرف الأول: شركة التقنية المتقدمة للحلول السحابية
الطرف الثاني: المقاول المستقل / الشريك التقني

البند الأول: الالتزام بالسرية
يتعهد الطرف الثاني بعدم إفصاح أي معلومات سرية أو شيفرات برمجية للطرف الأول.

البند الثاني: مدة الاتفاقية
تسري هذه الاتفاقية لمدة سنتين من تاريخ التوقيع.`,
    source_modified_at: '2026-08-27 15:30:00',
    created_at: '2026-08-27 15:30:00',
    updated_at: '2026-08-27 15:30:00',
    change_summary: 'تحديث مدة الاتفاقية لسنتين وإضافة الشريك التقني',
  },
  {
    id: 3,
    document_id: 1,
    version_number: 3,
    original_filename: 'nda_template_2026.docx',
    extension: 'docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440001/versions/3.docx',
    file_size: 24576,
    file_hash: syncSha256('v3_binary_nda_raw_final'),
    content_hash: syncSha256('v3_text_nda_final'),
    extracted_content: `اتفاقية عدم إفصاح وحماية سرية المعلومات (NDA)
الطرف الأول: شركة التقنية المتقدمة للحلول السحابية
الطرف الثاني: المقاول المستقل / الشريك التقني

البند الأول: الالتزام بالسرية
يتعهد الطرف الثاني بعدم إفصاح أي معلومات سرية أو شيفرات برمجية أو بيانات مالية تخص الطرف الأول لأي طرف ثالث.

البند الثاني: مدة الاتفاقية
تسري هذه الاتفاقية لمدة 3 سنوات من تاريخ التوقيع الرسمي.

البند الثالث: التعويضات والشرط الجزائي
يتحمل الطرف المخالف تعويضاً مالياً قدره 100,000 دولار أمريكي عن أي إخلال بالبنود.`,
    source_modified_at: '2026-08-30 08:15:00',
    created_at: '2026-08-30 08:15:00',
    updated_at: '2026-08-30 08:15:00',
    change_summary: 'إضافة البند الثالث (الشرط الجزائي 100K$) وتحديث المدة إلى 3 سنوات',
  },
  {
    id: 4,
    document_id: 2,
    version_number: 1,
    original_filename: 'vendor_agreement.md',
    extension: 'md',
    mime_type: 'text/markdown',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440002/versions/1.md',
    file_size: 4096,
    file_hash: syncSha256('vendor_agreement_raw_v1'),
    content_hash: syncSha256('vendor_agreement_text_v1'),
    extracted_content: `# اتفاقية تزويد خدمات البنية التحتية
## 1. نطاق العمل
توفير خوادم عالية الأداء واستضافة قواعد بيانات PostgreSQL مع نسخ احتياطي يومي.

## 2. مستوى الخدمة (SLA)
ضمان وقت تشغيل Uptime لا يقل عن 99.95% شهرياً.

## 3. الدعم الفني
استجابة خلال أقل من 15 دقيقة للحالات الحرجة (Severity 1).`,
    source_modified_at: '2026-08-29 14:20:00',
    created_at: '2026-08-29 14:20:00',
    updated_at: '2026-08-29 14:20:00',
    change_summary: 'الإصدار الأولي',
  },
  {
    id: 5,
    document_id: 3,
    version_number: 1,
    original_filename: 'terms_of_service.txt',
    extension: 'txt',
    mime_type: 'text/plain',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440003/versions/1.txt',
    file_size: 2048,
    file_hash: syncSha256('terms_of_service_v1'),
    content_hash: syncSha256('terms_of_service_text_v1'),
    extracted_content: `شروط الاستخدام وسياسة الخصوصية
1. يحظر استخدام النظام لأي أغراض غير مصرح بها.
2. يتم فحص جميع الملفات تلقائياً وتوثيق إصداراتها.
3. يحق للإدارة تعليق الحسابات المخالفة فوراً.`,
    source_modified_at: '2026-08-28 09:00:00',
    created_at: '2026-08-28 09:00:00',
    updated_at: '2026-08-28 09:00:00',
    change_summary: 'الإصدار الأولي',
  },
  {
    id: 6,
    document_id: 4,
    version_number: 1,
    original_filename: 'q1_financial_summary.csv',
    extension: 'csv',
    mime_type: 'text/csv',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440004/versions/1.csv',
    file_size: 3580,
    file_hash: syncSha256('q1_financial_summary_v1'),
    content_hash: syncSha256('q1_financial_summary_text_v1'),
    extracted_content: `الشهر,الإيرادات,المصروفات,صافي الأرباح\nيناير,125000,45000,80000\nفبراير,142000,51000,91000\nمارس,168000,59000,109000`,
    source_modified_at: '2026-08-29 17:40:00',
    created_at: '2026-08-29 17:40:00',
    updated_at: '2026-08-29 17:40:00',
    change_summary: 'الإصدار الأولي',
  },
  {
    id: 7,
    document_id: 5,
    version_number: 1,
    original_filename: 'audit_trail_2026.json',
    extension: 'json',
    mime_type: 'application/json',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440005/versions/1.json',
    file_size: 1520,
    file_hash: syncSha256('audit_trail_2026_v1'),
    content_hash: syncSha256('audit_trail_2026_text_v1'),
    extracted_content: `audit_year: 2026\nauditor: KPMG Audit Services\nstatus: APPROVED\ncompliance_score: 98.4\nreviewed_documents_count: 1420`,
    source_modified_at: '2026-08-30 07:10:00',
    created_at: '2026-08-30 07:10:00',
    updated_at: '2026-08-30 07:10:00',
    change_summary: 'الإصدار الأولي',
  },
  {
    id: 8,
    document_id: 6,
    version_number: 1,
    original_filename: 'api_specifications.json',
    extension: 'json',
    mime_type: 'application/json',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440006/versions/1.json',
    file_size: 5120,
    file_hash: syncSha256('api_specifications_v1'),
    content_hash: syncSha256('api_specifications_text_v1'),
    extracted_content: `openapi: 3.1.0\ninfo.title: DocuVault File Management API\ninfo.version: 1.4.0\nservers.0.url: https://api.docuvault.local/v1`,
    source_modified_at: '2026-08-28 11:30:00',
    created_at: '2026-08-28 11:30:00',
    updated_at: '2026-08-28 11:30:00',
    change_summary: 'الإصدار الأولي',
  },
  {
    id: 9,
    document_id: 7,
    version_number: 1,
    original_filename: 'architecture_rfc.md',
    extension: 'md',
    mime_type: 'text/markdown',
    storage_disk: 'private',
    storage_path: 'documents/550e8400-e29b-41d4-a716-446655440007/versions/1.md',
    file_size: 2800,
    file_hash: syncSha256('architecture_rfc_v1'),
    content_hash: syncSha256('architecture_rfc_text_v1'),
    extracted_content: `# RFC-104: بنية نظام Versioning وتخزين الملفات\n- **الهدف**: دعم 200 نسخة لكل وثيقة مع استراتيجية delete_oldest.\n- **التخزين**: Private Storage Disk حصراً.\n- **الأمان**: SHA-256 Binary Hash لاكتشاف التغييرات.`,
    source_modified_at: '2026-08-27 16:00:00',
    created_at: '2026-08-27 16:00:00',
    updated_at: '2026-08-27 16:00:00',
    change_summary: 'الإصدار الأولي',
  },
];

export const INITIAL_SCAN_LOGS: ScanLog[] = [
  {
    id: 1,
    scan_path_id: 1,
    scan_path_name: 'العقود والاتفاقيات القانونية (Legal Contracts)',
    started_at: '2026-08-30 08:30:00',
    finished_at: '2026-08-30 08:30:02',
    files_scanned: 3,
    files_created: 0,
    files_updated: 1,
    files_unchanged: 2,
    files_missing: 0,
    errors_count: 0,
    status: 'completed',
    created_at: '2026-08-30 08:30:00',
    updated_at: '2026-08-30 08:30:02',
    errors: [],
  },
  {
    id: 2,
    scan_path_id: 2,
    scan_path_name: 'التقارير المالية والتدقيق (Financial Reports)',
    started_at: '2026-08-30 08:30:05',
    finished_at: '2026-08-30 08:30:06',
    files_scanned: 2,
    files_created: 0,
    files_updated: 0,
    files_unchanged: 2,
    files_missing: 0,
    errors_count: 0,
    status: 'completed',
    created_at: '2026-08-30 08:30:05',
    updated_at: '2026-08-30 08:30:06',
    errors: [],
  },
];

// Helper to compute unified diff lines
export function computeUnifiedDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const oldL = oldLines[i];
    const newL = newLines[i];

    if (oldL === newL) {
      if (oldL !== undefined) {
        result.push({ type: 'unchanged', content: oldL, oldLineNumber: i + 1, newLineNumber: i + 1 });
      }
    } else {
      if (oldL !== undefined) {
        result.push({ type: 'removed', content: oldL, oldLineNumber: i + 1 });
      }
      if (newL !== undefined) {
        result.push({ type: 'added', content: newL, newLineNumber: i + 1 });
      }
    }
  }

  return result;
}

export { sha256 };
