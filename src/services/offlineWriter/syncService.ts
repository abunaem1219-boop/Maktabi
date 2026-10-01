/**
 * Offline Writer Sync Engine
 * Manages network detection, background queue processing, "Only Me" private cloud syncing,
 * and pending submission queues.
 */

import { ref, get, set, update } from 'firebase/database';
import { db } from '../../firebase/config';
import { LocalBook, LocalChapter, SyncQueueItem } from '../../types/writer';
import {
  getLocalBook,
  saveLocalBook,
  getChaptersByBookId,
  saveLocalChapter,
  getPendingSyncQueue,
  updateSyncQueueItem,
  enqueueSync,
  getAssetsByBookId,
  getLocalAsset,
} from '../indexedDbService';
import { uploadAssetToCloudinary } from './assetService';
import { sanitizeHtml } from '../../utils/sanitize';

type SyncStatusListener = (isOnline: boolean, pendingCount: number) => void;
const listeners = new Set<SyncStatusListener>();

let isSyncing = false;

/**
 * Check if the browser currently has network connectivity
 */
export function isNetworkOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

/**
 * Subscribe to online/offline and sync queue count changes
 */
export function subscribeToSyncStatus(listener: SyncStatusListener): () => void {
  listeners.add(listener);

  const handleOnline = () => {
    notifyListeners();
    processSyncQueue();
  };
  const handleOffline = () => {
    notifyListeners();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial call
  notifyListeners();

  return () => {
    listeners.delete(listener);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

async function notifyListeners() {
  const online = isNetworkOnline();
  let pendingCount = 0;
  try {
    const queue = await getPendingSyncQueue();
    pendingCount = queue.length;
  } catch {
    // Ignore during DB init
  }

  listeners.forEach((fn) => fn(online, pendingCount));
}

/**
 * Upload a book and its chapters to Firebase as "Only Me" (Private cloud draft)
 */
export async function syncOnlyMeBook(
  bookId: string,
  userUid: string,
  userDisplayName?: string
): Promise<{ success: boolean; message: string }> {
  const localBook = await getLocalBook(bookId);
  if (!localBook) {
    throw new Error('কিতাবটি পাওয়া যায়নি।');
  }

  const chapters = await getChaptersByBookId(bookId);
  if (chapters.length === 0) {
    throw new Error('কমপক্ষে একটি অধ্যায় যোগ করা আবশ্যক।');
  }

  // 1. If currently offline, queue sync for later
  if (!isNetworkOnline()) {
    await enqueueSync({
      action: 'SYNC_BOOK',
      bookId,
      payload: { userUid, visibility: 'private', status: 'only_me' },
    });

    localBook.syncStatus = 'pending';
    localBook.status = 'only_me';
    await saveLocalBook(localBook);

    notifyListeners();
    return {
      success: true,
      message: 'ইন্টারনেট সংযোগ নেই। কিতাবটি ডিভাইসে সংরক্ষিত হয়েছে এবং সংযোগ পেলে সিঙ্ক হবে।',
    };
  }

  // 2. Online — Process assets first
  localBook.syncStatus = 'pending';
  await saveLocalBook(localBook);

  try {
    // Check if cover needs Cloudinary upload
    if (localBook.coverLocalId && !localBook.coverUrl?.startsWith('http')) {
      try {
        const uploaded = await uploadAssetToCloudinary(localBook.coverLocalId);
        localBook.coverUrl = uploaded.remoteUrl;
        localBook.coverPublicId = uploaded.remotePublicId;
      } catch (e) {
        console.warn('Cover upload failed, continuing with metadata:', e);
      }
    }

    // Check chapters for local asset references
    const localAssets = await getAssetsByBookId(bookId);
    for (const chapter of chapters) {
      let content = chapter.content;
      for (const asset of localAssets) {
        if (asset.uploadStatus === 'local' && content.includes(asset.id)) {
          try {
            const uploaded = await uploadAssetToCloudinary(asset.id);
            // Replace local asset reference with remote URL
            content = content.split(`data-asset-id="${asset.id}"`).join(`src="${uploaded.remoteUrl}"`);
            chapter.content = sanitizeHtml(content);
            await saveLocalChapter(chapter);
          } catch (e) {
            console.warn(`Failed to upload asset ${asset.id}:`, e);
          }
        }
      }
    }

    const now = Date.now();
    const finalOwnerUid = userUid || localBook.ownerUid;

    // 3. Prepare master book payload
    const bookPayload = {
      id: localBook.id,
      title: localBook.title.trim(),
      authorName: localBook.authorName.trim() || userDisplayName || 'লেখক',
      publisher: localBook.publisherName?.trim() || '',
      description: localBook.description?.trim() || '',
      categoryId: localBook.categoryId || 'other',
      tags: localBook.tags || [],
      coverUrl: localBook.coverUrl || '',
      coverPublicId: localBook.coverPublicId || '',
      status: 'private', // Firebase BookStatus uses 'private'
      visibility: 'private',
      featured: false,
      readCount: 0,
      favoriteCount: 0,
      chapterCount: chapters.length,
      createdAt: localBook.createdAt || now,
      updatedAt: now,
      createdBy: finalOwnerUid,
    };

    // Save to master `books/{bookId}`
    await set(ref(db, `books/${localBook.id}`), bookPayload);

    // Save to `userBooks/{uid}/{bookId}` index
    await set(ref(db, `userBooks/${finalOwnerUid}/${localBook.id}`), {
      id: localBook.id,
      title: localBook.title,
      status: 'private',
      visibility: 'private',
      updatedAt: now,
    });

    // Save all chapters under `bookContent/{bookId}/chapters/{chapterId}`
    const chapterUpdates: Record<string, any> = {};
    for (const ch of chapters) {
      chapterUpdates[`bookContent/${localBook.id}/chapters/${ch.id}`] = {
        id: ch.id,
        bookId: localBook.id,
        title: ch.title,
        order: ch.order,
        content: sanitizeHtml(ch.content),
        wordCount: ch.wordCount || 0,
        createdAt: ch.createdAt || now,
        updatedAt: ch.updatedAt || now,
      };
      ch.syncStatus = 'synced';
      await saveLocalChapter(ch);
    }
    await update(ref(db), chapterUpdates);

    // 4. Update local book state
    localBook.ownerUid = finalOwnerUid;
    localBook.status = 'only_me';
    localBook.syncStatus = 'synced';
    localBook.updatedAt = now;
    localBook.syncError = undefined;
    await saveLocalBook(localBook);

    notifyListeners();
    return {
      success: true,
      message: 'কিতাবটি সফলভাবে আপনার অ্যাকাউন্টে ("শুধু আমি") ক্লাউডে সিঙ্ক হয়েছে।',
    };
  } catch (error: any) {
    console.error('Only Me sync failed:', error);
    localBook.syncStatus = 'failed';
    localBook.syncError = error.message || 'সিঙ্ক ব্যর্থ হয়েছে';
    await saveLocalBook(localBook);
    notifyListeners();
    throw error;
  }
}

/**
 * Submit book for admin review
 */
export async function submitBookForReview(
  bookId: string,
  userUid: string
): Promise<{ success: boolean; message: string }> {
  const localBook = await getLocalBook(bookId);
  if (!localBook) {
    throw new Error('কিতাবটি পাওয়া যায়নি।');
  }

  const chapters = await getChaptersByBookId(bookId);
  if (chapters.length === 0) {
    throw new Error('পর্যালোচনায় পাঠানোর আগে কমপক্ষে একটি অধ্যায় যোগ করুন।');
  }

  if (!isNetworkOnline()) {
    await enqueueSync({
      action: 'SUBMIT_BOOK',
      bookId,
      payload: { userUid },
    });

    localBook.status = 'pending_review';
    localBook.syncStatus = 'pending';
    await saveLocalBook(localBook);

    notifyListeners();
    return {
      success: true,
      message: 'ইন্টারনেট সংযোগ নেই। সংযোগ ফিরলে স্বয়ংক্রিয়ভাবে রিভিউয়ের জন্য পাঠানো হবে।',
    };
  }

  // First sync the latest book and chapters to Firebase
  await syncOnlyMeBook(bookId, userUid);

  // Update status to pending_review
  const now = Date.now();
  await update(ref(db, `books/${bookId}`), {
    status: 'pending_review',
    submittedAt: now,
    updatedAt: now,
  });

  await update(ref(db, `userBooks/${userUid}/${bookId}`), {
    status: 'pending_review',
    updatedAt: now,
  });

  localBook.status = 'pending_review';
  localBook.syncStatus = 'synced';
  localBook.updatedAt = now;
  await saveLocalBook(localBook);

  notifyListeners();
  return {
    success: true,
    message: 'কিতাবটি সফলভাবে অ্যাডমিন পর্যালোচনার জন্য জমা দেওয়া হয়েছে।',
  };
}

/**
 * Process all items currently queued in `syncQueue`
 */
export async function processSyncQueue(): Promise<void> {
  if (isSyncing || !isNetworkOnline()) return;

  isSyncing = true;
  try {
    const queue = await getPendingSyncQueue();
    for (const item of queue) {
      if (item.retryCount >= 3) {
        await updateSyncQueueItem(item.id, { status: 'failed', error: 'সর্বোচ্চ ৩ বার চেষ্টা করার পরেও ব্যর্থ।' });
        continue;
      }

      await updateSyncQueueItem(item.id, { status: 'in_progress' });

      try {
        if (item.action === 'SYNC_BOOK') {
          await syncOnlyMeBook(item.bookId, item.payload?.userUid);
          await updateSyncQueueItem(item.id, { status: 'completed' });
        } else if (item.action === 'SUBMIT_BOOK') {
          await submitBookForReview(item.bookId, item.payload?.userUid);
          await updateSyncQueueItem(item.id, { status: 'completed' });
        } else if (item.action === 'UPLOAD_IMAGE' && item.assetId) {
          await uploadAssetToCloudinary(item.assetId);
          await updateSyncQueueItem(item.id, { status: 'completed' });
        }
      } catch (err: any) {
        console.error(`Sync item ${item.id} execution failed:`, err);
        await updateSyncQueueItem(item.id, {
          status: 'pending',
          retryCount: item.retryCount + 1,
          error: err.message || 'সিঙ্ক ত্রুটি',
        });
      }
    }
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}
