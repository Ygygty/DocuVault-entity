import { CodeFile } from '../types';

export const LARAVEL_CODEBASE: CodeFile[] = [
  // ==========================================
  // PHASE 1 & 2: CONFIGURATION & DATABASE MIGRATIONS
  // ==========================================
  {
    phase: 2,
    category: 'Config',
    path: 'config/document_versioning.php',
    name: 'document_versioning.php',
    language: 'php',
    description: 'إعدادات نظام إدارة الإصدارات والحد الأقصى واستراتيجية الاحتفاظ',
    code: `<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Maximum Versions Per Document
    |--------------------------------------------------------------------------
    | Default limit of versions retained for each logical document record.
    | When exceeded, the configured retention strategy is applied.
    */
    'max_versions_per_document' => (int) env('DOC_MAX_VERSIONS', 200),

    /*
    |--------------------------------------------------------------------------
    | Version Retention Strategy
    |--------------------------------------------------------------------------
    | Options: 'delete_oldest', 'archive_oldest', 'unlimited'
    */
    'retention_strategy' => env('DOC_RETENTION_STRATEGY', 'delete_oldest'),

    /*
    |--------------------------------------------------------------------------
    | Storage Disk
    |--------------------------------------------------------------------------
    | Laravel storage disk used for storing binary immutable copies.
    | Must be a private disk (not accessible publicly).
    */
    'storage_disk' => env('DOC_STORAGE_DISK', 'private'),

    /*
    |--------------------------------------------------------------------------
    | Supported File Extensions
    |--------------------------------------------------------------------------
    | Extensions processed by the recursive scanner and extractors.
    */
    'supported_extensions' => [
        'txt',
        'docx',
        'md',
        'csv',
        'json',
    ],

    /*
    |--------------------------------------------------------------------------
    | Maximum Allowed File Size (Bytes)
    |--------------------------------------------------------------------------
    | Default: 50MB per file to prevent memory exhaustion during hashing.
    */
    'max_file_size' => (int) env('DOC_MAX_FILE_SIZE', 50 * 1024 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Storage Path Pattern
    |--------------------------------------------------------------------------
    | Relative path format inside the private disk.
    */
    'storage_path_pattern' => 'documents/{uuid}/versions/{version}.{extension}',
];`
  },
  {
    phase: 2,
    category: 'Migrations',
    path: 'database/migrations/2026_01_01_000001_create_scan_paths_table.php',
    name: '2026_01_01_000001_create_scan_paths_table.php',
    language: 'php',
    description: 'Migration لجدول مسارات الفحص scan_paths',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_paths', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('path', 1000);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index(['is_active', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_paths');
    }
};`
  },
  {
    phase: 2,
    category: 'Migrations',
    path: 'database/migrations/2026_01_01_000002_create_documents_table.php',
    name: '2026_01_01_000002_create_documents_table.php',
    language: 'php',
    description: 'Migration لجدول الوثائق المنطقية documents مع UUID و Unique Constraint',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('scan_path_id')->constrained('scan_paths')->cascadeOnDelete();
            $table->string('filename', 255);
            $table->string('relative_path', 1000);
            $table->string('extension', 50)->index();
            $table->string('mime_type', 150)->nullable();
            $table->enum('status', ['active', 'missing', 'error', 'unsupported'])->default('active')->index();
            $table->unsignedBigInteger('latest_version_id')->nullable()->index();
            $table->timestamp('first_seen_at')->useCurrent();
            $table->timestamp('last_seen_at')->useCurrent()->index();
            $table->timestamps();

            // Identity of Document is strictly: scan_path_id + relative_path
            $table->unique(['scan_path_id', 'relative_path'], 'idx_scan_path_relative_unique');
            $table->index(['scan_path_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};`
  },
  {
    phase: 2,
    category: 'Migrations',
    path: 'database/migrations/2026_01_01_000003_create_document_versions_table.php',
    name: '2026_01_01_000003_create_document_versions_table.php',
    language: 'php',
    description: 'Migration لإصدارات الوثائق مع File Hash و Content Hash و PostgreSQL Indexes',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;
use Illuminate\\Support\\Facades\\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('original_filename', 255);
            $table->string('extension', 50);
            $table->string('mime_type', 150)->nullable();
            $table->string('storage_disk', 50)->default('private');
            $table->string('storage_path', 1000);
            $table->unsignedBigInteger('file_size');
            $table->char('file_hash', 64)->index();      // SHA-256 for original full binary file
            $table->char('content_hash', 64)->index();   // SHA-256 for extracted text
            $table->longText('extracted_content')->nullable();
            $table->timestamp('source_modified_at')->nullable();
            $table->timestamps();

            // Unique constraint on document + version_number
            $table->unique(['document_id', 'version_number'], 'idx_doc_version_unique');
            $table->index(['document_id', 'created_at']);
        });

        // Add foreign key back to documents.latest_version_id after table is created
        Schema::table('documents', function (Blueprint $table) {
            $table->foreign('latest_version_id')
                ->references('id')
                ->on('document_versions')
                ->nullOnDelete();
        });

        // Add PostgreSQL GIN index for full-text search if using pgsql driver
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("CREATE INDEX idx_document_versions_content_fts ON document_versions USING gin(to_tsvector('simple', coalesce(extracted_content, '')))");
        }
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['latest_version_id']);
        });
        Schema::dropIfExists('document_versions');
    }
};`
  },
  {
    phase: 2,
    category: 'Migrations',
    path: 'database/migrations/2026_01_01_000004_create_scan_logs_table.php',
    name: '2026_01_01_000004_create_scan_logs_table.php',
    language: 'php',
    description: 'Migration لتسجيل عمليات الفحص وإحصائيات ScanLogs',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_path_id')->nullable()->constrained('scan_paths')->nullOnDelete();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('files_scanned')->default(0);
            $table->unsignedInteger('files_created')->default(0);
            $table->unsignedInteger('files_updated')->default(0);
            $table->unsignedInteger('files_unchanged')->default(0);
            $table->unsignedInteger('files_missing')->default(0);
            $table->unsignedInteger('errors_count')->default(0);
            $table->enum('status', ['running', 'completed', 'failed'])->default('running')->index();
            $table->timestamps();

            $table->index(['scan_path_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_logs');
    }
};`
  },
  {
    phase: 2,
    category: 'Migrations',
    path: 'database/migrations/2026_01_01_000005_create_scan_errors_table.php',
    name: '2026_01_01_000005_create_scan_errors_table.php',
    language: 'php',
    description: 'Migration لتسجيل أخطاء فحص الملفات المعزولة دون إيقاف العملية',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_errors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_log_id')->constrained('scan_logs')->cascadeOnDelete();
            $table->string('file_path', 1000);
            $table->text('error_message');
            $table->timestamps();

            $table->index(['scan_log_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_errors');
    }
};`
  },

  // ==========================================
  // PHASE 2: ELOQUENT MODELS & RELATIONSHIPS
  // ==========================================
  {
    phase: 2,
    category: 'Models',
    path: 'app/Models/ScanPath.php',
    name: 'ScanPath.php',
    language: 'php',
    description: 'Eloquent Model لمسارات الفحص مع Scopes والعلاقات',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Builder;

class ScanPath extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'path',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function scanLogs(): HasMany
    {
        return $this->hasMany(ScanLog::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}`
  },
  {
    phase: 2,
    category: 'Models',
    path: 'app/Models/Document.php',
    name: 'Document.php',
    language: 'php',
    description: 'Eloquent Model للوثيقة المنطقية مع UUID وعلاقة الإصدار الأحدث',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Support\\Str;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'scan_path_id',
        'filename',
        'relative_path',
        'extension',
        'mime_type',
        'status',
        'latest_version_id',
        'first_seen_at',
        'last_seen_at',
    ];

    protected $casts = [
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($document) {
            if (empty($document->uuid)) {
                $document->uuid = (string) Str::uuid();
            }
        });
    }

    public function scanPath(): BelongsTo
    {
        return $this->belongsTo(ScanPath::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class)->orderBy('version_number', 'desc');
    }

    public function latestVersion(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class, 'latest_version_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeMissing(Builder $query): Builder
    {
        return $query->where('status', 'missing');
    }

    public function scopeByExtension(Builder $query, string $ext): Builder
    {
        return $query->where('extension', strtolower($ext));
    }
}`
  },
  {
    phase: 2,
    category: 'Models',
    path: 'app/Models/DocumentVersion.php',
    name: 'DocumentVersion.php',
    language: 'php',
    description: 'Eloquent Model للإصدار غير القابل للتعديل Immutable Version',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Support\\Facades\\Storage;

class DocumentVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'version_number',
        'original_filename',
        'extension',
        'mime_type',
        'storage_disk',
        'storage_path',
        'file_size',
        'file_hash',
        'content_hash',
        'extracted_content',
        'source_modified_at',
    ];

    protected $casts = [
        'version_number' => 'integer',
        'file_size' => 'integer',
        'source_modified_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function getStorageFileStream()
    {
        return Storage::disk($this->storage_disk)->readStream($this->storage_path);
    }

    public function getStorageFileContents(): ?string
    {
        return Storage::disk($this->storage_disk)->get($this->storage_path);
    }

    public function existsInStorage(): bool
    {
        return Storage::disk($this->storage_disk)->exists($this->storage_path);
    }
}`
  },
  {
    phase: 2,
    category: 'Models',
    path: 'app/Models/ScanLog.php',
    name: 'ScanLog.php',
    language: 'php',
    description: 'Eloquent Model لسجلات الفحص ScanLog',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class ScanLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'scan_path_id',
        'started_at',
        'finished_at',
        'files_scanned',
        'files_created',
        'files_updated',
        'files_unchanged',
        'files_missing',
        'errors_count',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'files_scanned' => 'integer',
        'files_created' => 'integer',
        'files_updated' => 'integer',
        'files_unchanged' => 'integer',
        'files_missing' => 'integer',
        'errors_count' => 'integer',
    ];

    public function scanPath(): BelongsTo
    {
        return $this->belongsTo(ScanPath::class);
    }

    public function errors(): HasMany
    {
        return $this->hasMany(ScanError::class);
    }
}`
  },
  {
    phase: 2,
    category: 'Models',
    path: 'app/Models/ScanError.php',
    name: 'ScanError.php',
    language: 'php',
    description: 'Eloquent Model لأخطاء فحص الملفات المنفردة',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class ScanError extends Model
{
    use HasFactory;

    protected $fillable = [
        'scan_log_id',
        'file_path',
        'error_message',
    ];

    public function scanLog(): BelongsTo
    {
        return $this->belongsTo(ScanLog::class);
    }
}`
  },

  // ==========================================
  // PHASE 3: STRATEGY PATTERN CONTENT EXTRACTORS
  // ==========================================
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/Contracts/FileContentExtractorInterface.php',
    name: 'FileContentExtractorInterface.php',
    language: 'php',
    description: 'واجهة Extractor الأساسية لتطبيق Strategy Pattern واستخراج النصوص',
    code: `<?php

namespace App\\Services\\Extractors\\Contracts;

use App\\Services\\Extractors\\DTO\\ExtractedContentResult;

interface FileContentExtractorInterface
{
    /**
     * Determine if this extractor supports the given extension / mime type.
     */
    public function supports(string $extension, ?string $mimeType = null): bool;

    /**
     * Extract plain text content from the given file path.
     */
    public function extract(string $filePath): ExtractedContentResult;
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/DTO/ExtractedContentResult.php',
    name: 'ExtractedContentResult.php',
    language: 'php',
    description: 'DTO يمثل نتيجة استخراج المحتوى مع التحذيرات والـ Metadata',
    code: `<?php

namespace App\\Services\\Extractors\\DTO;

class ExtractedContentResult
{
    public function __construct(
        public readonly string $content,
        public readonly bool $isSuccess = true,
        public readonly array $metadata = [],
        public readonly array $warnings = []
    ) {}

    public static function success(string $content, array $metadata = []): self
    {
        return new self($content, true, $metadata);
    }

    public static function failure(string $reason, array $warnings = []): self
    {
        return new self('', false, [], array_merge([$reason], $warnings));
    }
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/TxtContentExtractor.php',
    name: 'TxtContentExtractor.php',
    language: 'php',
    description: 'مستخرج النصوص للملفات النصية البسيطة TXT',
    code: `<?php

namespace App\\Services\\Extractors;

use App\\Services\\Extractors\\Contracts\\FileContentExtractorInterface;
use App\\Services\\Extractors\\DTO\\ExtractedContentResult;
use Exception;

class TxtContentExtractor implements FileContentExtractorInterface
{
    public function supports(string $extension, ?string $mimeType = null): bool
    {
        return strtolower($extension) === 'txt' || $mimeType === 'text/plain';
    }

    public function extract(string $filePath): ExtractedContentResult
    {
        try {
            $content = file_get_contents($filePath);
            if ($content === false) {
                return ExtractedContentResult::failure("Unable to read file: {$filePath}");
            }

            // Convert character encoding to UTF-8 cleanly if needed
            $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'WINDOWS-1256', 'ASCII'], true);
            if ($encoding && $encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            return ExtractedContentResult::success(trim($content), [
                'encoding' => $encoding ?: 'UTF-8',
                'line_count' => substr_count($content, "\\n") + 1,
            ]);
        } catch (Exception $e) {
            return ExtractedContentResult::failure($e->getMessage());
        }
    }
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/DocxContentExtractor.php',
    name: 'DocxContentExtractor.php',
    language: 'php',
    description: 'مستخرج محتوى Word DOCX عبر قراءة XML داخلي دون المساس بالملف الثنائي الأصلي',
    code: `<?php

namespace App\\Services\\Extractors;

use App\\Services\\Extractors\\Contracts\\FileContentExtractorInterface;
use App\\Services\\Extractors\\DTO\\ExtractedContentResult;
use ZipArchive;
use DOMDocument;
use Exception;

class DocxContentExtractor implements FileContentExtractorInterface
{
    public function supports(string $extension, ?string $mimeType = null): bool
    {
        return strtolower($extension) === 'docx' ||
               $mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    public function extract(string $filePath): ExtractedContentResult
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return ExtractedContentResult::failure("Cannot open DOCX archive: {$filePath}");
        }

        try {
            $xmlIndex = $zip->locateName('word/document.xml');
            if ($xmlIndex === false) {
                $zip->close();
                return ExtractedContentResult::failure("Missing word/document.xml inside DOCX package");
            }

            $xmlContent = $zip->getFromIndex($xmlIndex);
            $zip->close();

            if (empty($xmlContent)) {
                return ExtractedContentResult::success('');
            }

            $dom = new DOMDocument();
            // Prevent XXE entity injection attacks
            $dom->loadXML($xmlContent, LIBXML_NOENT | LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);

            $paragraphs = $dom->getElementsByTagName('p');
            $extractedLines = [];

            foreach ($paragraphs as $p) {
                $text = $p->textContent;
                if (!empty(trim($text))) {
                    $extractedLines[] = trim($text);
                }
            }

            $fullText = implode("\\n", $extractedLines);

            return ExtractedContentResult::success($fullText, [
                'paragraph_count' => count($extractedLines),
            ]);
        } catch (Exception $e) {
            if (isset($zip)) {
                @$zip->close();
            }
            return ExtractedContentResult::failure("DOCX parsing error: " . $e->getMessage());
        }
    }
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/MarkdownContentExtractor.php',
    name: 'MarkdownContentExtractor.php',
    language: 'php',
    description: 'مستخرج نصوص Markdown للملفات .md',
    code: `<?php

namespace App\\Services\\Extractors;

use App\\Services\\Extractors\\Contracts\\FileContentExtractorInterface;
use App\\Services\\Extractors\\DTO\\ExtractedContentResult;
use Exception;

class MarkdownContentExtractor implements FileContentExtractorInterface
{
    public function supports(string $extension, ?string $mimeType = null): bool
    {
        return in_array(strtolower($extension), ['md', 'markdown']) || $mimeType === 'text/markdown';
    }

    public function extract(string $filePath): ExtractedContentResult
    {
        try {
            $content = file_get_contents($filePath);
            if ($content === false) {
                return ExtractedContentResult::failure("Unable to read markdown file: {$filePath}");
            }

            return ExtractedContentResult::success(trim($content), [
                'format' => 'markdown',
            ]);
        } catch (Exception $e) {
            return ExtractedContentResult::failure($e->getMessage());
        }
    }
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/CsvContentExtractor.php',
    name: 'CsvContentExtractor.php',
    language: 'php',
    description: 'مستخرج محتوى CSV المنظم وجعله قابلاً للبحث',
    code: `<?php

namespace App\\Services\\Extractors;

use App\\Services\\Extractors\\Contracts\\FileContentExtractorInterface;
use App\\Services\\Extractors\\DTO\\ExtractedContentResult;
use Exception;

class CsvContentExtractor implements FileContentExtractorInterface
{
    public function supports(string $extension, ?string $mimeType = null): bool
    {
        return strtolower($extension) === 'csv' || $mimeType === 'text/csv';
    }

    public function extract(string $filePath): ExtractedContentResult
    {
        if (!is_readable($filePath)) {
            return ExtractedContentResult::failure("CSV file is not readable: {$filePath}");
        }

        try {
            $handle = fopen($filePath, 'r');
            if ($handle === false) {
                return ExtractedContentResult::failure("Failed to open CSV file stream");
            }

            $rows = [];
            $rowCount = 0;

            while (($data = fgetcsv($handle)) !== false) {
                $rowCount++;
                // Filter and clean row values
                $cleaned = array_filter(array_map('trim', $data));
                if (!empty($cleaned)) {
                    $rows[] = implode(' | ', $cleaned);
                }
            }
            fclose($handle);

            $content = implode("\\n", $rows);

            return ExtractedContentResult::success($content, [
                'total_rows' => $rowCount,
            ]);
        } catch (Exception $e) {
            if (isset($handle) && is_resource($handle)) {
                fclose($handle);
            }
            return ExtractedContentResult::failure("CSV extraction error: " . $e->getMessage());
        }
    }
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/JsonContentExtractor.php',
    name: 'JsonContentExtractor.php',
    language: 'php',
    description: 'مستخرج وتحويل ملفات JSON إلى نصوص مهيكلة للبحث والمقارنة',
    code: `<?php

namespace App\\Services\\Extractors;

use App\\Services\\Extractors\\Contracts\\FileContentExtractorInterface;
use App\\Services\\Extractors\\DTO\\ExtractedContentResult;
use Exception;

class JsonContentExtractor implements FileContentExtractorInterface
{
    public function supports(string $extension, ?string $mimeType = null): bool
    {
        return strtolower($extension) === 'json' || $mimeType === 'application/json';
    }

    public function extract(string $filePath): ExtractedContentResult
    {
        try {
            $raw = file_get_contents($filePath);
            if ($raw === false) {
                return ExtractedContentResult::failure("Unable to read JSON file: {$filePath}");
            }

            $decoded = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                // If invalid JSON, still retain raw string for fallback extraction
                return ExtractedContentResult::success(trim($raw), [
                    'valid_json' => false,
                    'json_error' => json_last_error_msg(),
                ]);
            }

            // Flatten structure for searchable text
            $searchableText = $this->flattenToString($decoded);

            return ExtractedContentResult::success($searchableText, [
                'valid_json' => true,
                'keys_count' => is_array($decoded) ? count($decoded) : 1,
            ]);
        } catch (Exception $e) {
            return ExtractedContentResult::failure($e->getMessage());
        }
    }

    private function flattenToString(mixed $data): string
    {
        if (is_array($data)) {
            $lines = [];
            foreach ($data as $key => $val) {
                $lines[] = "{$key}: " . $this->flattenToString($val);
            }
            return implode("\\n", $lines);
        }

        return (string) $data;
    }
}`
  },
  {
    phase: 3,
    category: 'Extractors',
    path: 'app/Services/Extractors/ContentExtractionManager.php',
    name: 'ContentExtractionManager.php',
    language: 'php',
    description: 'مدير Strategy Pattern لاختيار المستخرج المناسب تلقائياً',
    code: `<?php

namespace App\\Services\\Extractors;

use App\\Services\\Extractors\\Contracts\\FileContentExtractorInterface;
use App\\Services\\Extractors\\DTO\\ExtractedContentResult;

class ContentExtractionManager
{
    /** @var FileContentExtractorInterface[] */
    protected array $extractors = [];

    public function __construct(
        TxtContentExtractor $txtExtractor,
        DocxContentExtractor $docxExtractor,
        MarkdownContentExtractor $mdExtractor,
        CsvContentExtractor $csvExtractor,
        JsonContentExtractor $jsonExtractor
    ) {
        $this->extractors = [
            $txtExtractor,
            $docxExtractor,
            $mdExtractor,
            $csvExtractor,
            $jsonExtractor,
        ];
    }

    /**
     * Register an additional extractor (e.g. for PDF, XLSX, OCR)
     */
    public function registerExtractor(FileContentExtractorInterface $extractor): void
    {
        array_unshift($this->extractors, $extractor);
    }

    /**
     * Extract content using the first matching strategy.
     */
    public function extract(string $filePath, string $extension, ?string $mimeType = null): ExtractedContentResult
    {
        foreach ($this->extractors as $extractor) {
            if ($extractor->supports($extension, $mimeType)) {
                return $extractor->extract($filePath);
            }
        }

        return ExtractedContentResult::failure("No extractor available for extension [{$extension}]");
    }

    public function isSupported(string $extension, ?string $mimeType = null): bool
    {
        foreach ($this->extractors as $extractor) {
            if ($extractor->supports($extension, $mimeType)) {
                return true;
            }
        }
        return false;
    }
}`
  },

  // ==========================================
  // PHASE 3 & 4: SERVICES (HASHING, STORAGE, VERSIONING)
  // ==========================================
  {
    phase: 3,
    category: 'Services',
    path: 'app/Services/FileHashService.php',
    name: 'FileHashService.php',
    language: 'php',
    description: 'خدمة حساب SHA-256 للملفات الثنائية الكبيرة والنصوص بكفاءة',
    code: `<?php

namespace App\\Services;

use RuntimeException;

class FileHashService
{
    /**
     * Calculate SHA-256 for the complete original binary file stream.
     * Uses hash_file to avoid loading entire large files into memory.
     */
    public function calculateFileHash(string $filePath): string
    {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            throw new RuntimeException("File cannot be accessed for hashing: {$filePath}");
        }

        $hash = hash_file('sha256', $filePath);
        if ($hash === false) {
            throw new RuntimeException("Failed to compute SHA-256 hash for file: {$filePath}");
        }

        return $hash;
    }

    /**
     * Calculate SHA-256 hash for extracted text content.
     */
    public function calculateContentHash(?string $content): string
    {
        return hash('sha256', $content ?? '');
    }
}`
  },
  {
    phase: 3,
    category: 'Services',
    path: 'app/Services/DocumentStorageService.php',
    name: 'DocumentStorageService.php',
    language: 'php',
    description: 'إدارة التخزين الخاص مع آلية التراجع والتعويض Compensation Logic',
    code: `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Storage;
use Illuminate\\Support\\Facades\\Log;
use RuntimeException;

class DocumentStorageService
{
    protected string $disk;

    public function __construct()
    {
        $this->disk = config('document_versioning.storage_disk', 'private');
    }

    /**
     * Generate storage path: documents/{uuid}/versions/{version_number}.{extension}
     */
    public function getVersionStoragePath(string $uuid, int $versionNumber, string $extension): string
    {
        $ext = strtolower(ltrim($extension, '.'));
        return "documents/{$uuid}/versions/{$versionNumber}.{$ext}";
    }

    /**
     * Store exact binary copy of original file to private storage.
     */
    public function storeBinaryVersion(string $sourceFilePath, string $targetStoragePath): void
    {
        $stream = fopen($sourceFilePath, 'r');
        if ($stream === false) {
            throw new RuntimeException("Failed to open source file stream: {$sourceFilePath}");
        }

        try {
            $success = Storage::disk($this->disk)->put($targetStoragePath, $stream);
            if (!$success) {
                throw new RuntimeException("Storage::put failed for path: {$targetStoragePath}");
            }
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }

    /**
     * Safe compensation delete if database transaction fails after file write.
     */
    public function deleteStoredVersionFile(string $targetStoragePath): bool
    {
        try {
            if (Storage::disk($this->disk)->exists($targetStoragePath)) {
                return Storage::disk($this->disk)->delete($targetStoragePath);
            }
            return true;
        } catch (\\Throwable $e) {
            Log::error("Failed to delete orphaned version file [{$targetStoragePath}]: " . $e->getMessage());
            return false;
        }
    }
}`
  },
  {
    phase: 4,
    category: 'Services',
    path: 'app/Services/DocumentVersionService.php',
    name: 'DocumentVersionService.php',
    language: 'php',
    description: 'إدارة إنشاء الإصدارات وتطبيق سياسة الحد الأقصى 200 نسخة delete_oldest بأمان',
    code: `<?php

namespace App\\Services;

use App\\Models\\Document;
use App\\Models\\DocumentVersion;
use App\\Services\\Extractors\\ContentExtractionManager;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Log;
use Exception;
use Throwable;

class DocumentVersionService
{
    public function __construct(
        protected FileHashService $hashService,
        protected DocumentStorageService $storageService,
        protected ContentExtractionManager $extractionManager
    ) {}

    /**
     * Create a new immutable version for a document with compensation safety.
     */
    public function createVersion(Document $document, string $sourceFilePath, string $fileHash): DocumentVersion
    {
        $maxVersion = (int) $document->versions()->max('version_number');
        $nextVersionNumber = $maxVersion > 0 ? $maxVersion + 1 : 1;

        $extension = pathinfo($sourceFilePath, PATHINFO_EXTENSION);
        $fileSize = filesize($sourceFilePath);
        $mimeType = @mime_content_type($sourceFilePath) ?: 'application/octet-stream';
        $sourceModifiedAt = date('Y-m-d H:i:s', filemtime($sourceFilePath));

        // 1. Extract content safely
        $extractResult = $this->extractionManager->extract($sourceFilePath, $extension, $mimeType);
        $extractedContent = $extractResult->content;
        $contentHash = $this->hashService->calculateContentHash($extractedContent);

        // 2. Determine target storage path
        $storagePath = $this->storageService->getVersionStoragePath(
            $document->uuid,
            $nextVersionNumber,
            $extension
        );

        $fileUploaded = false;

        try {
            // 3. Store binary original copy first
            $this->storageService->storeBinaryVersion($sourceFilePath, $storagePath);
            $fileUploaded = true;

            // 4. Wrap Database Record creation in DB Transaction
            $version = DB::transaction(function () use (
                $document,
                $nextVersionNumber,
                $sourceFilePath,
                $extension,
                $mimeType,
                $storagePath,
                $fileSize,
                $fileHash,
                $contentHash,
                $extractedContent,
                $sourceModifiedAt
            ) {
                $newVersion = DocumentVersion::create([
                    'document_id' => $document->id,
                    'version_number' => $nextVersionNumber,
                    'original_filename' => basename($sourceFilePath),
                    'extension' => strtolower($extension),
                    'mime_type' => $mimeType,
                    'storage_disk' => config('document_versioning.storage_disk', 'private'),
                    'storage_path' => $storagePath,
                    'file_size' => $fileSize,
                    'file_hash' => $fileHash,
                    'content_hash' => $contentHash,
                    'extracted_content' => $extractedContent,
                    'source_modified_at' => $sourceModifiedAt,
                ]);

                // Update document state
                $document->update([
                    'latest_version_id' => $newVersion->id,
                    'status' => 'active',
                    'last_seen_at' => now(),
                ]);

                return $newVersion;
            });

            // 5. Apply Retention Policy (e.g. limit to 200 versions)
            $this->applyRetentionPolicy($document);

            Log::info("Version [{$nextVersionNumber}] created for Document #{$document->id} ({$document->filename})");

            return $version;
        } catch (Throwable $e) {
            // Compensation logic: remove binary file if DB transaction failed
            if ($fileUploaded) {
                $this->storageService->deleteStoredVersionFile($storagePath);
            }
            Log::error("Failed to create version for Document #{$document->id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Enforce maximum versions per document (default: 200) without renumbering versions.
     */
    public function applyRetentionPolicy(Document $document): void
    {
        $maxAllowed = (int) config('document_versioning.max_versions_per_document', 200);
        $strategy = config('document_versioning.retention_strategy', 'delete_oldest');

        if ($strategy !== 'delete_oldest' || $maxAllowed <= 0) {
            return;
        }

        $totalVersions = $document->versions()->count();
        if ($totalVersions <= $maxAllowed) {
            return;
        }

        $excessCount = $totalVersions - $maxAllowed;

        // Fetch oldest versions that exceed the limit
        $oldestVersions = $document->versions()
            ->orderBy('version_number', 'asc')
            ->take($excessCount)
            ->get();

        foreach ($oldestVersions as $oldVersion) {
            // Never delete the latest version
            if ($oldVersion->id === $document->latest_version_id) {
                continue;
            }

            try {
                // Delete physical storage copy first
                $this->storageService->deleteStoredVersionFile($oldVersion->storage_path);
                // Delete DB record
                $oldVersion->delete();

                Log::info("Retention pruned Version #{$oldVersion->version_number} of Document #{$document->id}");
            } catch (Exception $e) {
                Log::error("Failed to prune old Version #{$oldVersion->version_number}: " . $e->getMessage());
            }
        }
    }
}`
  },
  {
    phase: 4,
    category: 'Actions',
    path: 'app/Actions/RestoreVersionAction.php',
    name: 'RestoreVersionAction.php',
    language: 'php',
    description: 'استعادة إصدار سابق عبر إنشاء إصدار جديد N+1 مطابق دون تعديل التاريخ',
    code: `<?php

namespace App\\Actions;

use App\\Models\\Document;
use App\\Models\\DocumentVersion;
use App\\Services\\DocumentVersionService;
use App\\Services\\DocumentStorageService;
use Illuminate\\Support\\Facades\\Storage;
use RuntimeException;

class RestoreVersionAction
{
    public function __construct(
        protected DocumentVersionService $versionService,
        protected DocumentStorageService $storageService
    ) {}

    /**
     * Restore an older version by creating a brand-new version N+1 replicating its exact binary & content.
     */
    public function execute(Document $document, DocumentVersion $targetVersion): DocumentVersion
    {
        if ($targetVersion->document_id !== $document->id) {
            throw new RuntimeException("Target version does not belong to this document.");
        }

        // Create a temporary stream or file from the target version's private storage
        $disk = Storage::disk($targetVersion->storage_disk);
        if (!$disk->exists($targetVersion->storage_path)) {
            throw new RuntimeException("Target version binary file does not exist in storage.");
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'restore_doc_');
        file_put_contents($tempPath, $disk->get($targetVersion->storage_path));

        try {
            $newVersion = $this->versionService->createVersion(
                $document,
                $tempPath,
                $targetVersion->file_hash
            );

            return $newVersion;
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }
    }
}`
  },

  // ==========================================
  // PHASE 5: FILE SCANNER & MISSING DETECTOR
  // ==========================================
  {
    phase: 5,
    category: 'Services',
    path: 'app/Services/MissingDocumentDetector.php',
    name: 'MissingDocumentDetector.php',
    language: 'php',
    description: 'اكتشاف الملفات المحذوفة من المسارات وتغيير حالتها إلى missing دون حذف السجلات',
    code: `<?php

namespace App\\Services;

use App\\Models\\ScanPath;
use App\\Models\\Document;
use Illuminate\\Support\\Facades\\Log;

class MissingDocumentDetector
{
    /**
     * Mark documents as missing if they were not seen in the current scan run.
     */
    public function detectAndMark(ScanPath $scanPath, array $scannedRelativePaths): int
    {
        $query = Document::where('scan_path_id', $scanPath->id)
            ->where('status', 'active');

        if (!empty($scannedRelativePaths)) {
            $query->whereNotIn('relative_path', $scannedRelativePaths);
        }

        $missingDocuments = $query->get();
        $count = 0;

        foreach ($missingDocuments as $doc) {
            $doc->update(['status' => 'missing']);
            $count++;
            Log::warning("Document marked missing: [{$doc->relative_path}] in ScanPath #{$scanPath->id}");
        }

        return $count;
    }
}`
  },
  {
    phase: 5,
    category: 'Services',
    path: 'app/Services/FileScannerService.php',
    name: 'FileScannerService.php',
    language: 'php',
    description: 'المحرك الرئيسي لفحص الملفات بشكل Recursive مع عزل الأخطاء وتحديث الإصدارات',
    code: `<?php

namespace App\\Services;

use App\\Models\\ScanPath;
use App\\Models\\ScanLog;
use App\\Models\\ScanError;
use App\\Models\\Document;
use App\\Services\\Extractors\\ContentExtractionManager;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use FilesystemIterator;
use SplFileInfo;
use Throwable;
use Illuminate\\Support\\Facades\\Log;

class FileScannerService
{
    public function __construct(
        protected FileHashService $hashService,
        protected DocumentVersionService $versionService,
        protected MissingDocumentDetector $missingDetector,
        protected ContentExtractionManager $extractionManager
    ) {}

    /**
     * Execute full scan for a single scan path or all active scan paths.
     */
    public function scanPath(ScanPath $scanPath): ScanLog
    {
        $scanLog = ScanLog::create([
            'scan_path_id' => $scanPath->id,
            'started_at' => now(),
            'status' => 'running',
        ]);

        $baseDir = rtrim($scanPath->path, DIRECTORY_SEPARATOR);
        $scannedRelativePaths = [];

        if (!is_dir($baseDir) || !is_readable($baseDir)) {
            ScanError::create([
                'scan_log_id' => $scanLog->id,
                'file_path' => $baseDir,
                'error_message' => "Base directory is not readable or does not exist: {$baseDir}",
            ]);

            $scanLog->update([
                'finished_at' => now(),
                'status' => 'failed',
                'errors_count' => 1,
            ]);

            return $scanLog;
        }

        $filesScanned = 0;
        $filesCreated = 0;
        $filesUpdated = 0;
        $filesUnchanged = 0;
        $errorsCount = 0;

        $dirIterator = new RecursiveDirectoryIterator(
            $baseDir,
            FilesystemIterator::SKIP_DOTS | FilesystemIterator::FOLLOW_SYMLINKS
        );
        $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

        /** @var SplFileInfo $fileInfo */
        foreach ($iterator as $fileInfo) {
            if (!$fileInfo->isFile()) {
                continue;
            }

            $filesScanned++;
            $realPath = $fileInfo->getRealPath();
            $relativePath = ltrim(substr($realPath, strlen($baseDir)), DIRECTORY_SEPARATOR);
            $scannedRelativePaths[] = $relativePath;

            try {
                $result = $this->processFile($scanPath, $realPath, $relativePath, $fileInfo);

                match ($result) {
                    'created' => $filesCreated++,
                    'updated' => $filesUpdated++,
                    'unchanged' => $filesUnchanged++,
                    default => null,
                };
            } catch (Throwable $e) {
                $errorsCount++;
                Log::error("Scan error on file [{$realPath}]: " . $e->getMessage());

                ScanError::create([
                    'scan_log_id' => $scanLog->id,
                    'file_path' => $realPath,
                    'error_message' => $e->getMessage(),
                ]);
            }
        }

        // Detect missing files
        $missingCount = $this->missingDetector->detectAndMark($scanPath, $scannedRelativePaths);

        $scanLog->update([
            'finished_at' => now(),
            'files_scanned' => $filesScanned,
            'files_created' => $filesCreated,
            'files_updated' => $filesUpdated,
            'files_unchanged' => $filesUnchanged,
            'files_missing' => $missingCount,
            'errors_count' => $errorsCount,
            'status' => 'completed',
        ]);

        return $scanLog;
    }

    /**
     * Process an individual file: calculate hash, compare with latest version, create version if modified.
     */
    protected function processFile(
        ScanPath $scanPath,
        string $realPath,
        string $relativePath,
        SplFileInfo $fileInfo
    ): string {
        $extension = strtolower($fileInfo->getExtension());
        $mimeType = @mime_content_type($realPath) ?: 'application/octet-stream';
        $filename = $fileInfo->getFilename();

        // Check if supported
        $isSupported = $this->extractionManager->isSupported($extension, $mimeType);

        // Find or instantiate Document by unique: scan_path_id + relative_path
        $document = Document::firstOrCreate(
            [
                'scan_path_id' => $scanPath->id,
                'relative_path' => $relativePath,
            ],
            [
                'filename' => $filename,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'status' => $isSupported ? 'active' : 'unsupported',
                'first_seen_at' => now(),
                'last_seen_at' => now(),
            ]
        );

        if (!$isSupported) {
            $document->update([
                'status' => 'unsupported',
                'last_seen_at' => now(),
            ]);
            return 'unchanged';
        }

        // Calculate binary file SHA-256 hash
        $currentFileHash = $this->hashService->calculateFileHash($realPath);

        // If newly created Document (no latest version)
        if (!$document->latest_version_id) {
            $this->versionService->createVersion($document, $realPath, $currentFileHash);
            return 'created';
        }

        // Load latest version to compare binary hash
        $latestVersion = $document->latestVersion;

        if ($latestVersion && $latestVersion->file_hash === $currentFileHash) {
            // No binary change! Just update last_seen_at & status
            $document->update([
                'status' => 'active',
                'last_seen_at' => now(),
            ]);
            return 'unchanged';
        }

        // File changed (content or binary styling)! Create next version
        $this->versionService->createVersion($document, $realPath, $currentFileHash);
        return 'updated';
    }
}`
  },

  // ==========================================
  // PHASE 6: ARTISAN COMMAND, SCHEDULER & QUEUES
  // ==========================================
  {
    phase: 6,
    category: 'Console',
    path: 'app/Console/Commands/ScanDocumentsCommand.php',
    name: 'ScanDocumentsCommand.php',
    language: 'php',
    description: 'Artisan Command لتشغيل الفحص عبر Terminal مع خيارات التفاصيل',
    code: `<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\ScanPath;
use App\\Services\\FileScannerService;

class ScanDocumentsCommand extends Command
{
    protected $signature = 'documents:scan 
                            {--path= : Scan specific ScanPath ID} 
                            {--queue : Dispatch scan jobs to queue}';

    protected $description = 'Scan configured paths recursively for new and updated documents';

    public function handle(FileScannerService $scannerService): int
    {
        $pathId = $this->option('path');
        $query = ScanPath::query()->where('is_active', true);

        if ($pathId) {
            $query->where('id', $pathId);
        }

        $scanPaths = $query->get();

        if ($scanPaths->isEmpty()) {
            $this->warn('No active scan paths found to scan.');
            return self::SUCCESS;
        }

        $this->info("Starting document scan across [{$scanPaths->count()}] path(s)...");

        foreach ($scanPaths as $scanPath) {
            $this->line("--------------------------------------------------");
            $this->info("Scanning: [{$scanPath->name}] => {$scanPath->path}");

            $log = $scannerService->scanPath($scanPath);

            $this->table(
                ['Metric', 'Count'],
                [
                    ['Files Scanned', $log->files_scanned],
                    ['New Documents', "<info>{$log->files_created}</info>"],
                    ['Updated Documents', "<comment>{$log->files_updated}</comment>"],
                    ['Unchanged Documents', $log->files_unchanged],
                    ['Missing Documents', "<error>{$log->files_missing}</error>"],
                    ['Errors', $log->errors_count > 0 ? "<error>{$log->errors_count}</error>" : 0],
                    ['Status', $log->status],
                ]
            );
        }

        $this->info('Document scan completed successfully.');
        return self::SUCCESS;
    }
}`
  },
  {
    phase: 6,
    category: 'Jobs',
    path: 'app/Jobs/ScanPathJob.php',
    name: 'ScanPathJob.php',
    language: 'php',
    description: 'Job غير تزامني لمعالجة فحص المسارات عبر Laravel Queues',
    code: `<?php

namespace App\\Jobs;

use App\\Models\\ScanPath;
use App\\Services\\FileScannerService;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Contracts\\Queue\\ShouldQueue;
use Illuminate\\Foundation\\Bus\\Dispatchable;
use Illuminate\\Queue\\InteractsWithQueue;
use Illuminate\\Queue\\SerializesModels;

class ScanPathJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public function __construct(public ScanPath $scanPath) {}

    public function handle(FileScannerService $scannerService): void
    {
        $scannerService->scanPath($this->scanPath);
    }
}`
  },
  {
    phase: 6,
    category: 'Scheduler',
    path: 'routes/console.php',
    name: 'console.php',
    language: 'php',
    description: 'جدولة فحص الملفات كل 5 دقائق عبر Laravel Scheduler',
    code: `<?php

use Illuminate\\Support\\Facades\\Schedule;

// Run document scanner every 5 minutes in background without overlapping
Schedule::command('documents:scan')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/scanner-cron.log'));`
  },

  // ==========================================
  // PHASE 8: DIFF & SEARCH SERVICES
  // ==========================================
  {
    phase: 8,
    category: 'Services',
    path: 'app/Services/VersionComparisonService.php',
    name: 'VersionComparisonService.php',
    language: 'php',
    description: 'مقارنة الإصدارات واحتساب الفروقات النصية والبيانات الوصفية للـ Binary',
    code: `<?php

namespace App\\Services;

use App\\Models\\DocumentVersion;

class VersionComparisonService
{
    /**
     * Compare two versions: calculates text line diff and binary metadata differences.
     */
    public function compare(DocumentVersion $vOld, DocumentVersion $vNew): array
    {
        $textDiff = $this->computeLineDiff(
            $vOld->extracted_content ?? '',
            $vNew->extracted_content ?? ''
        );

        $metadataDiff = [
            'file_hash' => [
                'old' => $vOld->file_hash,
                'new' => $vNew->file_hash,
                'changed' => $vOld->file_hash !== $vNew->file_hash,
            ],
            'content_hash' => [
                'old' => $vOld->content_hash,
                'new' => $vNew->content_hash,
                'changed' => $vOld->content_hash !== $vNew->content_hash,
            ],
            'file_size' => [
                'old' => $vOld->file_size,
                'new' => $vNew->file_size,
                'diff_bytes' => $vNew->file_size - $vOld->file_size,
            ],
            'source_modified_at' => [
                'old' => $vOld->source_modified_at?->toIso8601String(),
                'new' => $vNew->source_modified_at?->toIso8601String(),
            ],
        ];

        return [
            'version_old' => $vOld->version_number,
            'version_new' => $vNew->version_number,
            'metadata' => $metadataDiff,
            'diff_lines' => $textDiff,
        ];
    }

    protected function computeLineDiff(string $oldText, string $newText): array
    {
        $oldLines = explode("\\n", $oldText);
        $newLines = explode("\\n", $newText);

        $diff = [];
        $max = max(count($oldLines), count($newLines));

        for ($i = 0; $i < $max; $i++) {
            $oldL = $oldLines[$i] ?? null;
            $newL = $newLines[$i] ?? null;

            if ($oldL === $newL) {
                if ($oldL !== null) {
                    $diff[] = ['type' => 'unchanged', 'content' => $oldL, 'old_line' => $i + 1, 'new_line' => $i + 1];
                }
            } else {
                if ($oldL !== null) {
                    $diff[] = ['type' => 'removed', 'content' => $oldL, 'old_line' => $i + 1];
                }
                if ($newL !== null) {
                    $diff[] = ['type' => 'added', 'content' => $newL, 'new_line' => $i + 1];
                }
            }
        }

        return $diff;
    }
}`
  },
  {
    phase: 8,
    category: 'Services',
    path: 'app/Services/ContentSearchService.php',
    name: 'ContentSearchService.php',
    language: 'php',
    description: 'البحث في المحتوى النصي باستخدام PostgreSQL Full-Text Search',
    code: `<?php

namespace App\\Services;

use App\\Models\\Document;
use App\\Models\\DocumentVersion;
use Illuminate\\Support\\Facades\\DB;

class ContentSearchService
{
    /**
     * Search within extracted text across latest versions or all versions.
     */
    public function search(string $term, bool $latestOnly = true, int $perPage = 15)
    {
        $isPostgres = DB::getDriverName() === 'pgsql';

        if ($latestOnly) {
            $query = Document::query()
                ->join('document_versions', 'documents.latest_version_id', '=', 'document_versions.id')
                ->select('documents.*', 'document_versions.extracted_content', 'document_versions.version_number');

            if ($isPostgres) {
                $query->whereRaw("to_tsvector('simple', coalesce(document_versions.extracted_content, '')) @@ plainto_tsquery('simple', ?)", [$term]);
            } else {
                $query->where('document_versions.extracted_content', 'LIKE', "%{$term}%");
            }

            return $query->paginate($perPage);
        }

        $query = DocumentVersion::with('document');

        if ($isPostgres) {
            $query->whereRaw("to_tsvector('simple', coalesce(extracted_content, '')) @@ plainto_tsquery('simple', ?)", [$term]);
        } else {
            $query->where('extracted_content', 'LIKE', "%{$term}%");
        }

        return $query->paginate($perPage);
    }
}`
  },

  // ==========================================
  // PHASE 7 & 9: HTTP CONTROLLERS & API
  // ==========================================
  {
    phase: 7,
    category: 'Controllers',
    path: 'app/Http/Controllers/DashboardController.php',
    name: 'DashboardController.php',
    language: 'php',
    description: 'Controller للوحة التحكم والإحصائيات الحية الفعالة',
    code: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Document;
use App\\Models\\DocumentVersion;
use App\\Models\\ScanLog;
use App\\Models\\ScanPath;
use Illuminate\\Http\\Request;
use Illuminate\\View\\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        $stats = [
            'total_documents' => Document::count(),
            'total_versions' => DocumentVersion::count(),
            'active_documents' => Document::where('status', 'active')->count(),
            'missing_documents' => Document::where('status', 'missing')->count(),
            'error_documents' => Document::where('status', 'error')->count(),
            'unsupported_documents' => Document::where('status', 'unsupported')->count(),
            'active_paths' => ScanPath::where('is_active', true)->count(),
        ];

        $latestScan = ScanLog::with('scanPath')->latest()->first();
        $recentModifiedDocuments = Document::with(['latestVersion', 'scanPath'])
            ->where('status', 'active')
            ->orderBy('last_seen_at', 'desc')
            ->take(8)
            ->get();

        return view('dashboard', compact('stats', 'latestScan', 'recentModifiedDocuments'));
    }
}`
  },
  {
    phase: 9,
    category: 'API Controllers',
    path: 'app/Http/Controllers/Api/DocumentApiController.php',
    name: 'DocumentApiController.php',
    language: 'php',
    description: 'REST API Controller للوثائق والإصدارات والتحميل والتنزيل',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Document;
use App\\Models\\DocumentVersion;
use App\\Http\\Resources\\DocumentResource;
use App\\Http\\Resources\\DocumentVersionResource;
use App\\Actions\\RestoreVersionAction;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\StreamedResponse;
use Illuminate\\Support\\Facades\\Storage;

class DocumentApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Document::with('latestVersion');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('extension')) {
            $query->where('extension', $request->query('extension'));
        }

        $documents = $query->paginate($request->query('per_page', 20));

        return DocumentResource::collection($documents)->response();
    }

    public function show(Document $document): DocumentResource
    {
        $document->load(['latestVersion', 'scanPath']);
        return new DocumentResource($document);
    }

    public function versions(Document $document): JsonResponse
    {
        $versions = $document->versions()->paginate(20);
        return DocumentVersionResource::collection($versions)->response();
    }

    public function showVersion(DocumentVersion $version): DocumentVersionResource
    {
        return new DocumentVersionResource($version);
    }

    public function versionContent(DocumentVersion $version): JsonResponse
    {
        return response()->json([
            'version_number' => $version->version_number,
            'content_hash' => $version->content_hash,
            'extracted_content' => $version->extracted_content,
        ]);
    }

    public function downloadVersion(Document $document, DocumentVersion $version): StreamedResponse
    {
        if ($version->document_id !== $document->id) {
            abort(404, 'Version does not belong to document');
        }

        $disk = Storage::disk($version->storage_disk);
        if (!$disk->exists($version->storage_path)) {
            abort(404, 'Binary file not found in storage');
        }

        return $disk->download($version->storage_path, "v{$version->version_number}_{$version->original_filename}");
    }

    public function restoreVersion(Document $document, DocumentVersion $version, RestoreVersionAction $restoreAction): JsonResponse
    {
        $newVersion = $restoreAction->execute($document, $version);

        return response()->json([
            'message' => "Successfully restored Version {$version->version_number} as Version {$newVersion->version_number}",
            'new_version' => new DocumentVersionResource($newVersion),
        ], 201);
    }
}`
  },
  {
    phase: 9,
    category: 'API Controllers',
    path: 'app/Http/Controllers/Api/ScanPathApiController.php',
    name: 'ScanPathApiController.php',
    language: 'php',
    description: 'REST API Controller لإدارة مسارات الفحص وتشغيل Scan فوري',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\ScanPath;
use App\\Services\\FileScannerService;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class ScanPathApiController extends Controller
{
    public function index(): JsonResponse
    {
        $paths = ScanPath::withCount('documents')->get();
        return response()->json($paths);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'path' => 'required|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $scanPath = ScanPath::create($validated);
        return response()->json($scanPath, 201);
    }

    public function scan(ScanPath $scanPath, FileScannerService $scannerService): JsonResponse
    {
        $log = $scannerService->scanPath($scanPath);
        return response()->json([
            'message' => 'Scan completed successfully',
            'log' => $log->load('errors'),
        ]);
    }
}`
  },
  {
    phase: 9,
    category: 'API Routes',
    path: 'routes/api.php',
    name: 'api.php',
    language: 'php',
    description: 'تعريف مسارات الـ REST API الكاملة',
    code: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\DocumentApiController;
use App\\Http\\Controllers\\Api\\ScanPathApiController;

Route::middleware('auth:sanctum')->group(function () {
    // Document APIs
    Route::get('/documents', [DocumentApiController::class, 'index']);
    Route::get('/documents/{document}', [DocumentApiController::class, 'show']);
    Route::get('/documents/{document}/versions', [DocumentApiController::class, 'versions']);
    Route::get('/document-versions/{version}', [DocumentApiController::class, 'showVersion']);
    Route::get('/document-versions/{version}/content', [DocumentApiController::class, 'versionContent']);
    Route::get('/documents/{document}/versions/{version}/download', [DocumentApiController::class, 'downloadVersion']);
    Route::post('/documents/{document}/versions/{version}/restore', [DocumentApiController::class, 'restoreVersion']);

    // Scan Paths APIs
    Route::apiResource('scan-paths', ScanPathApiController::class);
    Route::post('/scan-paths/{scan_path}/scan', [ScanPathApiController::class, 'scan']);
});`
  },

  // ==========================================
  // PHASE 10: AUTOMATED TESTS
  // ==========================================
  {
    phase: 10,
    category: 'Tests',
    path: 'tests/Unit/FileHashServiceTest.php',
    name: 'FileHashServiceTest.php',
    language: 'php',
    description: 'اختبارات الوحدة لحساب SHA-256 للملفات الثنائية والمحتوى',
    code: `<?php

namespace Tests\\Unit;

use Tests\\TestCase;
use App\\Services\\FileHashService;

class FileHashServiceTest extends TestCase
{
    public function test_it_calculates_correct_sha256_hash_for_binary_file(): void
    {
        $service = new FileHashService();
        $tmp = tempnam(sys_get_temp_dir(), 'test_hash_');
        file_put_contents($tmp, 'Hello DocuVault Versioning!');

        $hash = $service->calculateFileHash($tmp);
        $expected = hash('sha256', 'Hello DocuVault Versioning!');

        $this->assertEquals($expected, $hash);
        @unlink($tmp);
    }

    public function test_it_detects_hash_difference_when_formatting_or_binary_changes(): void
    {
        $service = new FileHashService();
        $tmp = tempnam(sys_get_temp_dir(), 'test_hash_');
        file_put_contents($tmp, 'Initial Text');
        $hash1 = $service->calculateFileHash($tmp);

        file_put_contents($tmp, 'Initial Text with bold bytes');
        $hash2 = $service->calculateFileHash($tmp);

        $this->assertNotEquals($hash1, $hash2);
        @unlink($tmp);
    }
}`
  },
  {
    phase: 10,
    category: 'Tests',
    path: 'tests/Unit/VersionRetentionTest.php',
    name: 'VersionRetentionTest.php',
    language: 'php',
    description: 'اختبار تطبيق حد 200 إصدار وحذف الإصدار الأقدم دون إعادة الترقيم',
    code: `<?php

namespace Tests\\Unit;

use Tests\\TestCase;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use App\\Models\\Document;
use App\\Models\\DocumentVersion;
use App\\Models\\ScanPath;
use App\\Services\\DocumentVersionService;

class VersionRetentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_retains_max_versions_and_deletes_oldest_without_renumbering(): void
    {
        config(['document_versioning.max_versions_per_document' => 200]);
        config(['document_versioning.retention_strategy' => 'delete_oldest']);

        $path = ScanPath::create(['name' => 'Docs', 'path' => '/tmp/docs']);
        $doc = Document::create([
            'scan_path_id' => $path->id,
            'filename' => 'report.docx',
            'relative_path' => 'report.docx',
            'extension' => 'docx',
            'status' => 'active',
        ]);

        // Seed 200 versions
        for ($i = 1; $i <= 200; $i++) {
            DocumentVersion::create([
                'document_id' => $doc->id,
                'version_number' => $i,
                'original_filename' => 'report.docx',
                'extension' => 'docx',
                'storage_disk' => 'private',
                'storage_path' => "documents/{$doc->uuid}/versions/{$i}.docx",
                'file_size' => 1024,
                'file_hash' => hash('sha256', "v{$i}"),
                'content_hash' => hash('sha256', "text{$i}"),
            ]);
        }

        $this->assertEquals(200, $doc->versions()->count());

        // Create version 201
        $versionService = app(DocumentVersionService::class);
        $tmp = tempnam(sys_get_temp_dir(), 'v201_');
        file_put_contents($tmp, 'Version 201 content');

        $v201 = $versionService->createVersion($doc, $tmp, hash_file('sha256', $tmp));

        $this->assertEquals(201, $v201->version_number);
        $this->assertEquals(200, $doc->versions()->count());
        
        // Assert version 1 was pruned, but version 2 through 201 remain intact
        $this->assertDatabaseMissing('document_versions', [
            'document_id' => $doc->id,
            'version_number' => 1,
        ]);
        $this->assertDatabaseHas('document_versions', [
            'document_id' => $doc->id,
            'version_number' => 2,
        ]);
        $this->assertDatabaseHas('document_versions', [
            'document_id' => $doc->id,
            'version_number' => 201,
        ]);

        @unlink($tmp);
    }
}`
  },

  // ==========================================
  // PHASE 11: DOCKER & DEPLOYMENT
  // ==========================================
  {
    phase: 11,
    category: 'Docker',
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    language: 'yaml',
    description: 'إعداد Docker Compose لبيئة Laravel و PostgreSQL 16 و Redis والـ Queue Worker',
    code: `version: '3.8'

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
  storage_private:`
  },
  {
    phase: 11,
    category: 'Docker',
    path: 'Dockerfile',
    name: 'Dockerfile',
    language: 'dockerfile',
    description: 'Dockerfile مخصص للإنتاج يدعم PHP 8.3 و PostgreSQL و ZipArchive و Cron',
    code: `FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \\
    postgresql-dev \\
    libzip-dev \\
    zip \\
    unzip \\
    git \\
    curl \\
    libpng-dev \\
    oniguruma-dev \\
    icu-dev \\
    nginx \\
    supervisor

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring zip bcmath intl opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy app files
COPY . .

# Set storage permissions
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 80

CMD ["php-fpm"]`
  },
  {
    phase: 11,
    category: 'Documentation',
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    description: 'دليل التشغيل الكامل وتوثيق البنية المعمارية وأوامر التشغيل',
    code: `# DocuVault - Enterprise Laravel File Versioning & Monitoring System

نظام متكامل ومؤسسي لإدارة ومراقبة الملفات في مسارات محددة مع حفظ النسخ الثنائية الأصلية (Binary Copies) واستخراج النصوص وحفظ تاريخ الإصدارات (Versioning) حتى 200 إصدار تلقائياً.

---

## 🌟 أبرز المزايا المعمارية (Key Architecture)
1. **حفظ النسخة الثنائية الكاملة (Binary Copy)**: يتم حفظ نسخة طبق الأصل من الملف الأصلي (DOCX, TXT, MD, CSV, JSON) في Private Storage المشفر دون المساس بالتنسيقات أو الخطوط.
2. **نوعين من التجزئة (Dual Hashing)**:
   - \`file_hash\`: SHA-256 للملف الكامل لاكتشاف أي تغيير حتى لو كان في الخطوط أو التنسيق فقط.
   - \`content_hash\`: SHA-256 للنص المستخرج لأغراض المقارنة والبحث السريع.
3. **سياسة الحد الأقصى 200 إصدار**: عند الوصول إلى Version 201 يتم تطبيق \`delete_oldest\` لحذف Version 1 دون إعادة ترقيم الإصدارات.
4. **Strategy Pattern للـ Extractors**: بنية قابلة للتوسع لإضافة PDF, XLSX, OCR بسهولة عبر \`FileContentExtractorInterface\`.
5. **عزل الأخطاء (Fault Tolerant)**: في حال تلف ملف واحد، يتم تسجيل الخطأ في \`scan_errors\` وتستمر معالجة باقي المسار.
6. **دعم PostgreSQL Full-Text Search**: فهرس GIN للبحث السريع داخل محتوى الوثائق.
7. **استعادة الإصدارات (Restore as N+1)**: استعادة Version 10 ينشئ Version 21 دون تعديل النسخ السابقة (Immutability).

---

## 🚀 التشغيل عبر Docker Compose
\`\`\`bash
# 1. نسخ الإعدادات
cp .env.example .env

# 2. تشغيل الحاويات
docker-compose up -d --build

# 3. تشغيل الـ Migrations
docker-compose exec app php artisan migrate --seed

# 4. تشغيل أمر الفحص اليدوي
docker-compose exec app php artisan documents:scan --verbose
\`\`\`

---

## ⏰ إعداد الجدولة التلقائية على خادم Linux (Cron)
أضف السطر التالي في \`crontab -e\`:
\`\`\`bash
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
\`\`\`
`
  },
  // ==========================================
  // PHASE 8: ENTITY-TECHENHANCE POLYMORPHIC ARCHITECTURE & SCHOLARLY STUDIOS
  // ==========================================
  {
    phase: 8,
    category: 'Entity Models',
    path: 'app/Models/Entity.php',
    name: 'Entity.php',
    language: 'php',
    description: 'النموذج المتعدد الأشكال الأساسي (Polymorphic Entity Model) الرابط بين الكتب والمخطوطات والصوتيات والمرئيات',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\MorphTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;
use App\\Traits\\HasPolymorphicRelations;
use App\\Traits\\HasCommonScopes;

class Entity extends Model
{
    use HasPolymorphicRelations, HasCommonScopes;

    protected $fillable = [
        'title',
        'slug',
        'entity_type',
        'entityable_id',
        'entityable_type',
        'category_id',
        'author_id',
        'publisher_id',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function entityable(): MorphTo
    {
        return $this->morphTo();
    }

    public function versions(): HasMany
    {
        return $this->hasMany(Version::class)->orderBy('version_number', 'desc');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->latest();
    }

    public function tags(): BelongsToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}`
  },
  {
    phase: 8,
    category: 'Entity Models',
    path: 'app/Models/Manuscript.php',
    name: 'Manuscript.php',
    language: 'php',
    description: 'نموذج المخطوطات واللوحات التاريخية والتفريغ النصي المتزامن',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\MorphOne;

class Manuscript extends Model
{
    protected $fillable = [
        'title',
        'copier_name',
        'copy_year_hijri',
        'library_name',
        'call_number',
        'total_folios',
        'script_type',
        'dimensions',
        'status',
    ];

    public function entity(): MorphOne
    {
        return $this->morphOne(Entity::class, 'entityable');
    }

    public function pages(): HasMany
    {
        return $this->hasMany(ManuscriptPage::class)->orderBy('page_number', 'asc');
    }
}`
  },
  {
    phase: 8,
    category: 'Services',
    path: 'app/Services/EntityManagerService.php',
    name: 'EntityManagerService.php',
    language: 'php',
    description: 'خدمة إدارة الكيانات المتعددة الأشكال والتنسيق بين التخزين والأرشفة والـ Audit Trail',
    code: `<?php

namespace App\\Services;

use App\\Models\\Entity;
use App\\Models\\Version;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Str;

class EntityManagerService
{
    public function createEntity(string $type, array $data, $modelInstance): Entity
    {
        return DB::transaction(function () use ($type, $data, $modelInstance) {
            $entity = Entity::create([
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'entity_type' => $type,
                'entityable_id' => $modelInstance->id,
                'entityable_type' => get_class($modelInstance),
                'category_id' => $data['category_id'] ?? null,
                'author_id' => $data['author_id'] ?? null,
                'publisher_id' => $data['publisher_id'] ?? null,
                'status' => 'active',
                'metadata' => $data['metadata'] ?? [],
            ]);

            return $entity;
        });
    }

    public function snapshotVersion(Entity $entity, string $content, string $summary = ''): Version
    {
        $lastVersion = $entity->versions()->first();
        $versionNumber = $lastVersion ? $lastVersion->version_number + 1 : 1;

        return Version::create([
            'entity_id' => $entity->id,
            'version_number' => $versionNumber,
            'title' => $entity->title,
            'content' => $content,
            'content_hash' => hash('sha256', $content),
            'change_summary' => $summary,
        ]);
    }
}`
  },
  {
    phase: 8,
    category: 'Services',
    path: 'app/Services/Book/MarkdownStructureParser.php',
    name: 'MarkdownStructureParser.php',
    language: 'php',
    description: 'محلل بنيوي لتحويل نصوص Markdown ومستندات Word إلى فصول وأبواب وهوامش وأبيات شعرية مفهرسة',
    code: `<?php

namespace App\\Services\\Book;

class MarkdownStructureParser
{
    public function parse(string $markdown): array
    {
        $lines = explode("\\n", $markdown);
        $chapters = [];
        $currentChapter = null;

        foreach ($lines as $line) {
            if (preg_match('/^#\\s+(.+)$/', $line, $matches)) {
                if ($currentChapter) {
                    $chapters[] = $currentChapter;
                }
                $currentChapter = [
                    'title' => trim($matches[1]),
                    'level' => 1,
                    'sections' => [],
                    'content' => '',
                ];
            } elseif (preg_match('/^##\\s+(.+)$/', $line, $matches)) {
                if ($currentChapter) {
                    $currentChapter['sections'][] = [
                        'title' => trim($matches[1]),
                        'level' => 2,
                    ];
                }
            } else {
                if ($currentChapter) {
                    $currentChapter['content'] .= $line . "\\n";
                }
            }
        }

        if ($currentChapter) {
            $chapters[] = $currentChapter;
        }

        return $chapters;
    }
}`
  },
  {
    phase: 8,
    category: 'Controllers',
    path: 'app/Http/Controllers/UnifiedEditorController.php',
    name: 'UnifiedEditorController.php',
    language: 'php',
    description: 'وحدة التحكم في المحرر التزامني الموحد مع التخزين المباشر في قاعدة البيانات ونظام النسخ',
    code: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Entity;
use App\\Services\\EntityManagerService;
use Illuminate\\Http\\Request;
use Inertia\\Inertia;

class UnifiedEditorController extends Controller
{
    protected EntityManagerService $entityManager;

    public function __construct(EntityManagerService $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function show(Entity $entity)
    {
        $entity->load(['versions', 'activities']);

        return Inertia::render('Editor/UnifiedEditor', [
            'entity' => $entity,
            'latestVersion' => $entity->versions()->first(),
        ]);
    }

    public function saveVersion(Request $request, Entity $entity)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'change_summary' => 'nullable|string|max:500',
        ]);

        $version = $this->entityManager->snapshotVersion(
            $entity,
            $validated['content'],
            $validated['change_summary'] ?? ''
        );

        return response()->json([
            'status' => 'success',
            'version' => $version,
        ]);
    }
}`
  }
];
