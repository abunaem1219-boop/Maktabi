export type BookStatus =
  | 'draft'
  | 'private'
  | 'only_me'
  | 'pending_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'unpublished'
  | 'archived';

export type BookVisibility = 'public' | 'private';

export interface Book {
  id: string;
  title: string;
  slug?: string;

  authorId?: string;
  authorName: string;
  publisher?: string;

  description: string;
  coverUrl?: string;
  coverPublicId?: string; // Non-secret Cloudinary public ID

  categoryId: string;
  categoryName?: string;

  language: string; // 'bn' | 'en' | 'ar' | 'other'
  tags: string[];

  status: BookStatus;
  visibility: BookVisibility;
  featured: boolean;

  readCount?: number;
  favoriteCount?: number;
  chapterCount?: number;
  wordCount?: number;

  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  publishedAt?: number;
  publishedBy?: string;
  publicationRevisionId?: string;
  currentRevisionId?: string;
  createdBy: string;
}

export interface SubmissionRecord {
  submissionId: string;
  bookId: string;
  ownerUid: string;
  bookTitle: string;
  authorName: string;
  publisherName?: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  coverUrl: string;
  coverPublicId?: string;
  tags?: string[];
  submittedAt: number;
  status: 'pending_review' | 'changes_requested' | 'approved' | 'rejected' | 'published';
  revisionId: string;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewNote?: string; // Internal admin note
  authorMessage?: string; // Message sent to author
  rejectionReason?: string;
  changesRequestedAt?: number;
  totalChapters: number;
  totalWords: number;
  copyrightConfirmed: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminUid: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'PUBLISH' | 'UNPUBLISH';
  bookId: string;
  submissionId?: string;
  bookTitle?: string;
  timestamp: number;
  previousStatus: string;
  newStatus: string;
  note?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'submission_received' | 'changes_requested' | 'approved' | 'rejected' | 'published' | 'unpublished';
  title: string;
  message: string;
  bookId: string;
  bookTitle: string;
  submissionId?: string;
  read: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  order: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  bookCount?: number;
}

export interface BookChapter {
  id: string;
  bookId: string;
  title: string;
  order: number;
  content: string; // sanitized HTML
  wordCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ReadingProgress {
  bookId: string;
  bookTitle?: string;
  coverUrl?: string;
  chapterId: string;
  chapterTitle?: string;
  progress: number; // 0 - 100
  position?: number;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  bookTitle: string;
  coverUrl?: string;
  chapterId: string;
  chapterTitle: string;
  position: number;
  note?: string;
  createdAt: number;
}

export interface FavoriteRecord {
  bookId: string;
  addedAt: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetId?: string;
  details?: string;
  timestamp: number;
}
