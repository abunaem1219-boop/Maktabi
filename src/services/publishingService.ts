/**
 * KitabKhana Publishing & Moderation Engine (Phase 5)
 * Handles submission validation, review lifecycle, atomic publication projections,
 * unpublishing, audit logging, and realtime notification dispatching.
 */

import { ref, get, set, update, push } from 'firebase/database';
import { db, ADMIN_UID } from '../firebase/config';
import { Book, SubmissionRecord, AdminAuditLog, UserNotification } from '../types/book';
import { LocalBook, LocalChapter } from '../types/writer';
import { getLocalBook, saveLocalBook, getChaptersByBookId } from './indexedDbService';
import { syncOnlyMeBook } from './offlineWriter/syncService';
import { syncBookChaptersToPublic, removeBookChaptersFromPublic, getChapters } from './chapterService';
import { sanitizeHtml } from '../utils/sanitize';

/**
 * Validate that a book is complete and satisfies all publication prerequisites
 */
export function validateBookForSubmission(
  book: LocalBook | Book,
  chapters: (LocalChapter | any)[]
): { isValid: boolean; missingFields: string[]; errors: string[] } {
  const missingFields: string[] = [];
  const errors: string[] = [];

  if (!book.title || !book.title.trim()) {
    missingFields.push('কিতাবের শিরোনাম');
  }
  if (!book.authorName || !book.authorName.trim()) {
    missingFields.push('লেখকের নাম');
  }
  if (!book.categoryId || book.categoryId === 'all') {
    missingFields.push('ক্যাটাগরি বা বিভাগ');
  }
  if (!book.description || !book.description.trim()) {
    missingFields.push('কিতাবের পরিচিতি বা বিবরণ');
  }
  if (!book.coverUrl || !book.coverUrl.trim()) {
    missingFields.push('কিতাবের প্রচ্ছদ বা কভার ছবি');
  }
  if (!chapters || chapters.length === 0) {
    missingFields.push('কমপক্ষে একটি অধ্যায়');
  } else {
    const emptyChapters = chapters.filter(
      (c) => !c.content || c.content.replace(/<[^>]*>/g, '').trim().length === 0
    );
    if (emptyChapters.length > 0) {
      errors.push(`অধ্যায়ের লেখা খালি রাখা যাবে না (${emptyChapters.map((c) => c.title).join(', ')})`);
    }
  }

  // Security check: inspect for dangerous schemes in content
  for (const ch of chapters) {
    if (ch.content && /javascript:|data:text\/html/i.test(ch.content)) {
      errors.push(`অধ্যায় "${ch.title}"-এ অনিরাপদ লিঙ্ক বা কোড চিহ্নিত হয়েছে।`);
    }
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors,
  };
}

/**
 * Submit an author's book for Admin Review
 */
export async function submitBookForModeration(
  bookId: string,
  userUid: string,
  copyrightConfirmed: boolean
): Promise<SubmissionRecord> {
  if (!copyrightConfirmed) {
    throw new Error('অনুগ্রহ করে কিতাবের প্রকাশনার অধিকার ও দায়িত্বের ঘোষণাটি নিশ্চিত করুন।');
  }

  const localBook = await getLocalBook(bookId);
  if (!localBook) {
    throw new Error('কিতাবটি লোকাল স্টোরেজে পাওয়া যায়নি।');
  }

  const chapters = await getChaptersByBookId(bookId);
  const validation = validateBookForSubmission(localBook, chapters);
  if (!validation.isValid) {
    const missing = validation.missingFields.length > 0
      ? `প্রয়োজনীয় তথ্য অনুপস্থিত: ${validation.missingFields.join(', ')}। `
      : '';
    const errs = validation.errors.join(' ');
    throw new Error(`${missing}${errs}`);
  }

  // 1. First ensure all assets and metadata are synced to Firebase
  await syncOnlyMeBook(bookId, userUid);

  // 2. Fetch existing submissions for this book to check duplicates and calculate revision
  const existingSubmissions = await getSubmissionsByBookId(bookId);
  const activePending = existingSubmissions.find(
    (s) => s.status === 'pending_review'
  );
  if (activePending) {
    throw new Error('এই কিতাবটি বর্তমানে অ্যাডমিন রিভিউয়ের অপেক্ষায় রয়েছে। নতুন করে জমা দেওয়ার প্রয়োজন নেই।');
  }

  const revisionCount = existingSubmissions.length + 1;
  const revisionId = `rev_${revisionCount}_${Date.now()}`;
  const now = Date.now();

  const totalWords = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);

  // 3. Create Submission Record
  const submissionRef = push(ref(db, 'submissions'));
  const submissionId = submissionRef.key as string;

  const submission: SubmissionRecord = {
    submissionId,
    bookId,
    ownerUid: userUid,
    bookTitle: localBook.title.trim(),
    authorName: localBook.authorName.trim(),
    publisherName: localBook.publisherName?.trim() || '',
    categoryId: localBook.categoryId || 'other',
    categoryName: localBook.categoryId || 'অন্যান্য',
    description: localBook.description?.trim() || '',
    coverUrl: localBook.coverUrl || '',
    coverPublicId: localBook.coverPublicId || '',
    tags: localBook.tags || [],
    submittedAt: now,
    status: 'pending_review',
    revisionId,
    totalChapters: chapters.length,
    totalWords,
    copyrightConfirmed: true,
  };

  await set(submissionRef, submission);

  // 4. Update master book record and userBooks index
  await update(ref(db, `books/${bookId}`), {
    status: 'pending_review',
    submittedAt: now,
    currentRevisionId: revisionId,
    updatedAt: now,
  });

  await update(ref(db, `userBooks/${userUid}/${bookId}`), {
    status: 'pending_review',
    updatedAt: now,
  });

  // 5. Update local book status
  localBook.status = 'pending_review';
  localBook.syncStatus = 'synced';
  localBook.updatedAt = now;
  await saveLocalBook(localBook);

  // 6. Notify user of successful submission
  await sendNotification(userUid, {
    type: 'submission_received',
    title: 'রিভিউয়ের জন্য জমা গ্রহণ করা হয়েছে',
    message: `আপনার কিতাব "${localBook.title}" অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে। অনুমোদনের পর তা লাইব্রেরিতে উন্মুক্ত হবে।`,
    bookId,
    bookTitle: localBook.title,
    submissionId,
  });

  return submission;
}

/**
 * Fetch all submissions for a given book
 */
export async function getSubmissionsByBookId(bookId: string): Promise<SubmissionRecord[]> {
  try {
    const snap = await get(ref(db, 'submissions'));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: SubmissionRecord[] = Object.keys(val)
      .map((k) => ({ submissionId: k, ...val[k] }))
      .filter((s) => s.bookId === bookId);

    return list.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (error) {
    console.error('Error fetching submissions for book:', error);
    return [];
  }
}

/**
 * Fetch author's own submissions
 */
export async function getAuthorSubmissions(authorUid: string): Promise<SubmissionRecord[]> {
  try {
    const snap = await get(ref(db, 'submissions'));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: SubmissionRecord[] = Object.keys(val)
      .map((k) => ({ submissionId: k, ...val[k] }))
      .filter((s) => s.ownerUid === authorUid);

    return list.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (error) {
    console.error('Error fetching author submissions:', error);
    return [];
  }
}

/**
 * Fetch all submissions (Admin View)
 */
export async function getAllSubmissionsAdmin(): Promise<SubmissionRecord[]> {
  try {
    const snap = await get(ref(db, 'submissions'));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: SubmissionRecord[] = Object.keys(val).map((k) => ({
      submissionId: k,
      ...val[k],
    }));

    return list.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (error) {
    console.error('Error fetching all submissions for admin:', error);
    return [];
  }
}

/**
 * Fetch single submission by ID
 */
export async function getSubmissionById(submissionId: string): Promise<SubmissionRecord | null> {
  try {
    const snap = await get(ref(db, `submissions/${submissionId}`));
    if (!snap.exists()) return null;
    return { submissionId, ...snap.val() };
  } catch (error) {
    console.error('Error fetching submission:', error);
    return null;
  }
}

/**
 * ADMIN: Approve and Publish Book
 * Atomically validates, projects metadata to publicBooks and chapters to publicBookContent,
 * sets status to published, logs audit trail, and notifies author.
 */
export async function approveAndPublishBook(
  submissionId: string,
  adminUid: string,
  internalNote?: string,
  authorMessage?: string
): Promise<void> {
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new Error('সাবমিশন রেকর্ড পাওয়া যায়নি।');
  }

  const bookId = submission.bookId;
  const bookSnap = await get(ref(db, `books/${bookId}`));
  if (!bookSnap.exists()) {
    throw new Error('মূল কিতাব খুঁজে পাওয়া যায়নি।');
  }
  const masterBook: Book = bookSnap.val();

  // Validate master chapters exist
  const masterChapters = await getChapters(bookId, true);
  if (masterChapters.length === 0) {
    throw new Error('কিতাবে কোনো অধ্যায় নেই। প্রকাশনা বাতিল করা হলো।');
  }

  const now = Date.now();
  const previousStatus = masterBook.status;

  // 1. Prepare Public Book Payload
  const publicBookPayload: Book = {
    ...masterBook,
    id: bookId,
    status: 'published',
    visibility: 'public',
    publishedAt: now,
    publishedBy: adminUid,
    publicationRevisionId: submission.revisionId,
    chapterCount: masterChapters.length,
    updatedAt: now,
  };

  // 2. Perform Atomic Multi-Path Updates
  const updates: Record<string, any> = {};

  // Submission record update
  updates[`submissions/${submissionId}/status`] = 'published';
  updates[`submissions/${submissionId}/reviewedAt`] = now;
  updates[`submissions/${submissionId}/reviewedBy`] = adminUid;
  if (internalNote) updates[`submissions/${submissionId}/reviewNote`] = internalNote;
  if (authorMessage) updates[`submissions/${submissionId}/authorMessage`] = authorMessage;

  // Master book update
  updates[`books/${bookId}/status`] = 'published';
  updates[`books/${bookId}/visibility`] = 'public';
  updates[`books/${bookId}/publishedAt`] = now;
  updates[`books/${bookId}/publishedBy`] = adminUid;
  updates[`books/${bookId}/publicationRevisionId`] = submission.revisionId;
  updates[`books/${bookId}/chapterCount`] = masterChapters.length;
  updates[`books/${bookId}/updatedAt`] = now;

  // Author userBooks index update
  updates[`userBooks/${submission.ownerUid}/${bookId}/status`] = 'published';
  updates[`userBooks/${submission.ownerUid}/${bookId}/visibility`] = 'public';
  updates[`userBooks/${submission.ownerUid}/${bookId}/updatedAt`] = now;

  // Public book projection
  updates[`publicBooks/${bookId}`] = publicBookPayload;

  await update(ref(db), updates);

  // 3. Project Chapters to `publicBookContent/{bookId}/chapters`
  await syncBookChaptersToPublic(bookId);

  // 4. Update local IndexedDB book if author is on this device
  const localBook = await getLocalBook(bookId);
  if (localBook) {
    localBook.status = 'published';
    localBook.syncStatus = 'synced';
    localBook.updatedAt = now;
    await saveLocalBook(localBook);
  }

  // 5. Record Admin Audit Log
  await logAdminAudit({
    adminUid,
    action: 'APPROVE',
    bookId,
    submissionId,
    bookTitle: submission.bookTitle,
    timestamp: now,
    previousStatus,
    newStatus: 'published',
    note: internalNote || 'অনুমোদিত ও সফলভাবে প্রকাশিত হয়েছে।',
  });

  // 6. Send Author Notification
  await sendNotification(submission.ownerUid, {
    type: 'approved',
    title: 'কিতাব অনুমোদিত ও প্রকাশিত হয়েছে! 🎉',
    message: authorMessage || `অভিনন্দন! আপনার কিতাব "${submission.bookTitle}" সফলভাবে অনুমোদিত হয়েছে এবং লাইব্রেরিতে সকল পাঠকের জন্য প্রকাশিত হয়েছে।`,
    bookId,
    bookTitle: submission.bookTitle,
    submissionId,
  });
}

/**
 * ADMIN: Request Changes from Author
 */
export async function requestChangesBook(
  submissionId: string,
  adminUid: string,
  authorMessage: string,
  internalNote?: string
): Promise<void> {
  if (!authorMessage || !authorMessage.trim()) {
    throw new Error('লেখককে পরিবর্তনের কারণ ও নির্দেশনা জানাতে হবে (রিভিউ নোট আবশ্যক)।');
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new Error('সাবমিশন রেকর্ড পাওয়া যায়নি।');
  }

  const bookId = submission.bookId;
  const now = Date.now();

  const updates: Record<string, any> = {};
  updates[`submissions/${submissionId}/status`] = 'changes_requested';
  updates[`submissions/${submissionId}/reviewedAt`] = now;
  updates[`submissions/${submissionId}/reviewedBy`] = adminUid;
  updates[`submissions/${submissionId}/changesRequestedAt`] = now;
  updates[`submissions/${submissionId}/authorMessage`] = authorMessage.trim();
  if (internalNote) updates[`submissions/${submissionId}/reviewNote`] = internalNote.trim();

  updates[`books/${bookId}/status`] = 'changes_requested';
  updates[`books/${bookId}/updatedAt`] = now;

  updates[`userBooks/${submission.ownerUid}/${bookId}/status`] = 'changes_requested';
  updates[`userBooks/${submission.ownerUid}/${bookId}/updatedAt`] = now;

  await update(ref(db), updates);

  // Update local IndexedDB if present
  const localBook = await getLocalBook(bookId);
  if (localBook) {
    localBook.status = 'changes_requested';
    localBook.updatedAt = now;
    await saveLocalBook(localBook);
  }

  // Audit log
  await logAdminAudit({
    adminUid,
    action: 'REQUEST_CHANGES',
    bookId,
    submissionId,
    bookTitle: submission.bookTitle,
    timestamp: now,
    previousStatus: submission.status,
    newStatus: 'changes_requested',
    note: authorMessage.trim(),
  });

  // Notify author
  await sendNotification(submission.ownerUid, {
    type: 'changes_requested',
    title: 'কিতাবে কিছু পরিবর্তন প্রয়োজন',
    message: authorMessage.trim(),
    bookId,
    bookTitle: submission.bookTitle,
    submissionId,
  });
}

/**
 * ADMIN: Reject Submission
 */
export async function rejectSubmissionBook(
  submissionId: string,
  adminUid: string,
  rejectionReason: string,
  internalNote?: string
): Promise<void> {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('প্রত্যাখ্যান করার জন্য কারণ উল্লেখ করা আবশ্যক।');
  }

  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new Error('সাবমিশন রেকর্ড পাওয়া যায়নি।');
  }

  const bookId = submission.bookId;
  const now = Date.now();

  const updates: Record<string, any> = {};
  updates[`submissions/${submissionId}/status`] = 'rejected';
  updates[`submissions/${submissionId}/reviewedAt`] = now;
  updates[`submissions/${submissionId}/reviewedBy`] = adminUid;
  updates[`submissions/${submissionId}/rejectionReason`] = rejectionReason.trim();
  if (internalNote) updates[`submissions/${submissionId}/reviewNote`] = internalNote.trim();

  updates[`books/${bookId}/status`] = 'rejected';
  updates[`books/${bookId}/updatedAt`] = now;

  updates[`userBooks/${submission.ownerUid}/${bookId}/status`] = 'rejected';
  updates[`userBooks/${submission.ownerUid}/${bookId}/updatedAt`] = now;

  await update(ref(db), updates);

  // Update local book
  const localBook = await getLocalBook(bookId);
  if (localBook) {
    localBook.status = 'rejected';
    localBook.updatedAt = now;
    await saveLocalBook(localBook);
  }

  // Audit log
  await logAdminAudit({
    adminUid,
    action: 'REJECT',
    bookId,
    submissionId,
    bookTitle: submission.bookTitle,
    timestamp: now,
    previousStatus: submission.status,
    newStatus: 'rejected',
    note: rejectionReason.trim(),
  });

  // Notify author
  await sendNotification(submission.ownerUid, {
    type: 'rejected',
    title: 'কিতাব প্রকাশনা প্রত্যাখ্যান করা হয়েছে',
    message: `আপনার কিতাব "${submission.bookTitle}" প্রত্যাখ্যাত হয়েছে। কারণ: ${rejectionReason.trim()}`,
    bookId,
    bookTitle: submission.bookTitle,
    submissionId,
  });
}

/**
 * ADMIN: Unpublish a published book safely
 * Removes public projection without deleting author's master content.
 */
export async function unpublishBookAdmin(
  bookId: string,
  adminUid: string,
  reason?: string
): Promise<void> {
  const bookSnap = await get(ref(db, `books/${bookId}`));
  if (!bookSnap.exists()) {
    throw new Error('কিতাবটি খুঁজে পাওয়া যায়নি।');
  }
  const book: Book = bookSnap.val();
  const now = Date.now();

  // 1. Remove public projection atomically
  const updates: Record<string, any> = {
    [`publicBooks/${bookId}`]: null,
    [`books/${bookId}/status`]: 'unpublished',
    [`books/${bookId}/visibility`]: 'private',
    [`books/${bookId}/updatedAt`]: now,
  };

  if (book.createdBy) {
    updates[`userBooks/${book.createdBy}/${bookId}/status`] = 'unpublished';
    updates[`userBooks/${book.createdBy}/${bookId}/visibility`] = 'private';
    updates[`userBooks/${book.createdBy}/${bookId}/updatedAt`] = now;
  }

  await update(ref(db), updates);
  await removeBookChaptersFromPublic(bookId);

  // 2. Audit log
  await logAdminAudit({
    adminUid,
    action: 'UNPUBLISH',
    bookId,
    bookTitle: book.title,
    timestamp: now,
    previousStatus: book.status,
    newStatus: 'unpublished',
    note: reason || 'অ্যাডমিন কর্তৃক লাইব্রেরি থেকে সরানো হয়েছে।',
  });

  // 3. Notify author if known
  if (book.createdBy) {
    await sendNotification(book.createdBy, {
      type: 'unpublished',
      title: 'কিতাব আনপাবলিশ করা হয়েছে',
      message: `আপনার কিতাব "${book.title}" লাইব্রেরি থেকে অপ্রকাশিত (Unpublished) করা হয়েছে। ${reason ? `কারণ: ${reason}` : ''}`,
      bookId,
      bookTitle: book.title,
    });
  }
}

/**
 * Record an entry in `adminAuditLogs`
 */
export async function logAdminAudit(log: Omit<AdminAuditLog, 'id'>): Promise<void> {
  try {
    const logRef = push(ref(db, 'adminAuditLogs'));
    await set(logRef, {
      id: logRef.key,
      ...log,
    });
  } catch (error) {
    console.error('Failed to write admin audit log:', error);
  }
}

/**
 * Fetch all admin audit logs
 */
export async function getAdminAuditLogs(limitCount = 100): Promise<AdminAuditLog[]> {
  try {
    const snap = await get(ref(db, 'adminAuditLogs'));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: AdminAuditLog[] = Object.keys(val).map((k) => ({
      id: k,
      ...val[k],
    }));

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching admin audit logs:', error);
    return [];
  }
}

/**
 * Dispatch an in-app notification to a user
 */
export async function sendNotification(
  userId: string,
  notification: Omit<UserNotification, 'id' | 'userId' | 'read' | 'createdAt'>
): Promise<void> {
  try {
    const notifRef = push(ref(db, `userNotifications/${userId}`));
    const payload: UserNotification = {
      id: notifRef.key as string,
      userId,
      ...notification,
      read: false,
      createdAt: Date.now(),
    };
    await set(notifRef, payload);
  } catch (error) {
    console.error('Failed to send user notification:', error);
  }
}

/**
 * Fetch user notifications
 */
export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
  try {
    const snap = await get(ref(db, `userNotifications/${userId}`));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: UserNotification[] = Object.keys(val).map((k) => ({
      id: k,
      ...val[k],
    }));

    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
}

/**
 * Mark a user notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    await update(ref(db, `userNotifications/${userId}/${notificationId}`), {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}
