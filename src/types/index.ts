export type ToolCategory =
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'organize'
  | 'compress'
  | 'edit'
  | 'security'
  | 'ocr'
  | 'ai';

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: ToolCategory;
  categoryLabel: string;
  iconName: string;
  badge?: 'Popular' | 'New' | 'AI' | 'Pro';
  acceptedFormats: string[]; // e.g. ['.pdf'], ['.docx', '.doc'], ['.jpg', '.png']
  outputFormat: string; // e.g. 'pdf', 'docx', 'jpg', 'zip'
  maxFiles?: number;
  maxSizeMb?: number;
  features: string[];
  faqs?: Array<{ question: string; answer: string }>;
  isImplemented: boolean;
  comingSoonMessage?: string;
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'idle' | 'uploading' | 'ready' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  previewUrl?: string;
  pageCount?: number;
  thumbnailUrls?: string[];
  processedBuffer?: ArrayBuffer | Uint8Array | Blob;
  resultUrl?: string;
  resultFileName?: string;
  resultSize?: number;
}

export interface PdfPageItem {
  id: string;
  pageIndex: number; // 0-indexed
  pageNumber: number; // 1-indexed
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  thumbnailUrl?: string;
  deleted?: boolean;
}

export type WorkflowStepType =
  | 'upload'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'ppt-to-pdf'
  | 'images-to-pdf'
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'organize-pdf'
  | 'watermark-pdf'
  | 'protect-pdf'
  | 'unlock-pdf'
  | 'page-numbers'
  | 'ocr-pdf'
  | 'ai-summarize'
  | 'ai-extract'
  | 'pdf-to-word'
  | 'pdf-to-images'
  | 'flatten-pdf'
  | 'email-prep';

export interface WorkflowStep {
  id: string;
  toolId: string;
  title: string;
  type: WorkflowStepType;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress?: number;
  errorMessage?: string;
  config: Record<string, any>;
  output?: {
    fileCount?: number;
    fileName?: string;
    fileSize?: number;
    downloadUrl?: string;
  };
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  badge?: string;
  promptExample: string;
  steps: Array<{
    type: WorkflowStepType;
    title: string;
    config?: Record<string, any>;
  }>;
}

export interface SavedWorkflow {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
  runsCount: number;
  steps: WorkflowStep[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'business';
  operationsToday: number;
  maxOperationsDaily: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  recentFiles: RecentFileRecord[];
  savedWorkflows: SavedWorkflow[];
}

export interface RecentFileRecord {
  id: string;
  name: string;
  originalSize: number;
  resultSize?: number;
  toolUsed: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'processing';
  downloadUrl?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Array<{
    pageNumber: number;
    quote: string;
    score?: number;
  }>;
}

export interface AiExtractionResult {
  documentType: string;
  confidence: number;
  fields: Array<{
    label: string;
    value: string;
    confidence: number;
  }>;
  tables?: Array<{
    headers: string[];
    rows: string[][];
  }>;
  summary?: string;
}
