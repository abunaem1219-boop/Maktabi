export type LocalBookStatus =
  | 'draft'
  | 'only_me'
  | 'pending_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'unpublished';

export type LocalSyncStatus = 'local' | 'pending' | 'synced' | 'failed';

export interface LocalBook {
  id: string;
  ownerUid: string;
  title: string;
  authorName: string;
  publisherName?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  coverLocalId?: string;
  coverUrl?: string;
  coverPublicId?: string;
  status: LocalBookStatus;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  syncStatus: LocalSyncStatus;
  syncError?: string;
  totalChapters?: number;
  totalWords?: number;
}

export interface LocalChapter {
  id: string;
  bookId: string;
  title: string;
  order: number;
  content: string; // Sanitized HTML
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  characterCount: number;
  syncStatus?: 'local' | 'synced';
}

export interface LocalAsset {
  id: string;
  bookId: string;
  chapterId?: string;
  type: 'image';
  blob: Blob;
  fileName: string;
  mimeType: string;
  createdAt: number;
  uploadStatus: 'local' | 'uploading' | 'uploaded' | 'failed';
  remoteUrl?: string;
  remotePublicId?: string;
}

export type SyncActionType = 'UPLOAD_IMAGE' | 'SYNC_BOOK' | 'SYNC_CHAPTER' | 'SUBMIT_BOOK';

export interface SyncQueueItem {
  id: string;
  action: SyncActionType;
  bookId: string;
  chapterId?: string;
  assetId?: string;
  payload?: any;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
  retryCount: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EditorStateRecord {
  bookId: string;
  activeChapterId: string;
  cursorPosition?: number;
  scrollPosition?: number;
  updatedAt: number;
}

export interface WriterSettings {
  paperMode: boolean;
  focusMode: boolean;
  spellCheck: boolean;
  fontSize: number;
  fontFamily: string;
}

export interface StorageEstimateResult {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
  usageFormatted: string;
  quotaFormatted: string;
  isLow: boolean;
}
