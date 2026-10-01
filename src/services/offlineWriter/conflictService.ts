/**
 * Offline Writer Conflict Service
 * Detects discrepancies between local IndexedDB and Firebase remote copies.
 * Prevents silent overwriting and preserves user work safely.
 */

import { LocalBook, LocalChapter } from '../../types/writer';
import { getBookById } from '../bookService';
import { getChapters } from '../chapterService';
import { saveLocalBook, saveLocalChapter } from '../indexedDbService';

export interface ConflictCheckResult {
  hasConflict: boolean;
  remoteBook?: any;
  remoteUpdatedAt?: number;
  localUpdatedAt?: number;
}

/**
 * Check if the remote Firebase book has been updated elsewhere after the local copy
 */
export async function checkBookConflict(localBook: LocalBook): Promise<ConflictCheckResult> {
  // If the book is purely local draft with no remote sync yet, no conflict
  if (localBook.syncStatus === 'local' || !localBook.id) {
    return { hasConflict: false };
  }

  try {
    const remote = await getBookById(localBook.id, true);
    if (!remote) {
      return { hasConflict: false };
    }

    // If remote has a newer updatedAt timestamp than local
    if (remote.updatedAt && localBook.updatedAt && remote.updatedAt > localBook.updatedAt + 1000) {
      return {
        hasConflict: true,
        remoteBook: remote,
        remoteUpdatedAt: remote.updatedAt,
        localUpdatedAt: localBook.updatedAt,
      };
    }

    return { hasConflict: false };
  } catch {
    // Network or permission failure, assume no conflict
    return { hasConflict: false };
  }
}

/**
 * Resolve conflict by accepting remote version into local IndexedDB
 */
export async function resolveConflictUseRemote(localBookId: string): Promise<void> {
  const remoteBook = await getBookById(localBookId, true);
  if (!remoteBook) {
    throw new Error('অনলাইন কিতাব পাওয়া যায়নি।');
  }

  const remoteChapters = await getChapters(localBookId, true);

  const localUpdated: LocalBook = {
    id: remoteBook.id,
    ownerUid: remoteBook.createdBy,
    title: remoteBook.title,
    authorName: remoteBook.authorName,
    publisherName: remoteBook.publisher,
    description: remoteBook.description,
    categoryId: remoteBook.categoryId,
    tags: remoteBook.tags || [],
    coverUrl: remoteBook.coverUrl,
    coverPublicId: remoteBook.coverPublicId,
    status: remoteBook.status as any,
    createdAt: remoteBook.createdAt,
    updatedAt: remoteBook.updatedAt,
    lastOpenedAt: Date.now(),
    syncStatus: 'synced',
  };

  await saveLocalBook(localUpdated);

  for (const ch of remoteChapters) {
    const localCh: LocalChapter = {
      id: ch.id,
      bookId: localBookId,
      title: ch.title,
      order: ch.order,
      content: ch.content,
      createdAt: ch.createdAt,
      updatedAt: ch.updatedAt,
      wordCount: ch.wordCount || 0,
      characterCount: ch.content.length,
      syncStatus: 'synced',
    };
    await saveLocalChapter(localCh);
  }
}

/**
 * Resolve conflict by forking local version as a duplicate copy
 */
export async function resolveConflictForkLocal(localBook: LocalBook, localChapters: LocalChapter[]): Promise<LocalBook> {
  const now = Date.now();
  const forkedId = `book_fork_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const forkedBook: LocalBook = {
    ...localBook,
    id: forkedId,
    title: `${localBook.title} (ডিভাইস কপি)`,
    syncStatus: 'local',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  await saveLocalBook(forkedBook);

  for (let i = 0; i < localChapters.length; i++) {
    const ch = localChapters[i];
    const forkedChapter: LocalChapter = {
      ...ch,
      id: `ch_fork_${now}_${i + 1}`,
      bookId: forkedId,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await saveLocalChapter(forkedChapter);
  }

  return forkedBook;
}
