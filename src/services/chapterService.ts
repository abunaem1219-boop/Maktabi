import { ref, get, set, update, remove, push } from 'firebase/database';
import { db } from '../firebase/config';
import { BookChapter } from '../types/book';
import { sanitizeHtml } from '../utils/sanitize';

/**
 * Fetch all chapters for a given book
 * Reads from `publicBookContent` for public readers, or master `bookContent` for Admin preview
 */
export async function getChapters(bookId: string, isAdmin = false): Promise<BookChapter[]> {
  try {
    const contentPath = isAdmin ? `bookContent/${bookId}/chapters` : `publicBookContent/${bookId}/chapters`;
    let snap = await get(ref(db, contentPath));

    // Fallback: If not found in public projection but user is admin
    if (!snap.exists() && !isAdmin) {
      // In case admin opened preview without flag or fallback
      snap = await get(ref(db, `publicBookContent/${bookId}/chapters`));
    }

    if (!snap.exists()) {
      return [];
    }

    const val = snap.val();
    const list: BookChapter[] = Object.keys(val).map((id) => ({
      id,
      ...val[id],
    }));

    return list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch (error) {
    console.error(`Error fetching chapters for book ${bookId}:`, error);
    return [];
  }
}

/**
 * Fetch a single chapter
 */
export async function getChapterById(
  bookId: string,
  chapterId: string,
  isAdmin = false
): Promise<BookChapter | null> {
  try {
    const path = isAdmin
      ? `bookContent/${bookId}/chapters/${chapterId}`
      : `publicBookContent/${bookId}/chapters/${chapterId}`;

    let snap = await get(ref(db, path));
    if (!snap.exists() && isAdmin) {
      snap = await get(ref(db, `publicBookContent/${bookId}/chapters/${chapterId}`));
    }

    if (snap.exists()) {
      return { id: chapterId, ...snap.val() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching chapter ${chapterId}:`, error);
    return null;
  }
}

/**
 * Synchronize all master chapters of a published book to the public projection
 */
export async function syncBookChaptersToPublic(bookId: string): Promise<void> {
  try {
    const masterSnap = await get(ref(db, `bookContent/${bookId}/chapters`));
    const publicRef = ref(db, `publicBookContent/${bookId}/chapters`);

    if (masterSnap.exists()) {
      await set(publicRef, masterSnap.val());
    } else {
      await remove(ref(db, `publicBookContent/${bookId}`));
    }
  } catch (error) {
    console.error(`Error syncing chapters to public projection for book ${bookId}:`, error);
  }
}

/**
 * Remove public chapter projection when unpublishing/archiving
 */
export async function removeBookChaptersFromPublic(bookId: string): Promise<void> {
  try {
    await remove(ref(db, `publicBookContent/${bookId}`));
  } catch (error) {
    console.error(`Error removing public chapters for book ${bookId}:`, error);
  }
}

/**
 * Create a new chapter under master `bookContent/{bookId}/chapters/{chapterId}`
 */
export async function createChapter(
  bookId: string,
  data: Omit<BookChapter, 'id' | 'bookId' | 'createdAt' | 'updatedAt'>
): Promise<BookChapter> {
  try {
    const newRef = push(ref(db, `bookContent/${bookId}/chapters`));
    const chapterId = newRef.key as string;
    const now = Date.now();

    const sanitizedContent = sanitizeHtml(data.content || '');
    // Calculate approximate word count
    const words = sanitizedContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

    const chapter: BookChapter = {
      id: chapterId,
      bookId,
      title: data.title.trim(),
      order: data.order ?? 1,
      content: sanitizedContent,
      wordCount: words,
      createdAt: now,
      updatedAt: now,
    };

    await set(newRef, chapter);

    // Update chapter count on master book and publicBooks
    const chapters = await getChapters(bookId, true);
    await update(ref(db, `books/${bookId}`), {
      chapterCount: chapters.length,
      updatedAt: now,
    });
    // If book is published, sync public projection
    const bookSnap = await get(ref(db, `books/${bookId}`));
    if (bookSnap.exists() && bookSnap.val().status === 'published' && bookSnap.val().visibility === 'public') {
      await update(ref(db, `publicBooks/${bookId}`), { chapterCount: chapters.length });
      await syncBookChaptersToPublic(bookId);
    }

    return chapter;
  } catch (error) {
    console.error('Error creating chapter:', error);
    throw error;
  }
}

/**
 * Update an existing chapter's title, order, or content
 */
export async function updateChapter(
  bookId: string,
  chapterId: string,
  updates: Partial<BookChapter>
): Promise<void> {
  try {
    const chapterRef = ref(db, `bookContent/${bookId}/chapters/${chapterId}`);
    const now = Date.now();

    const payload: Partial<BookChapter> = {
      ...updates,
      updatedAt: now,
    };

    if (updates.content !== undefined) {
      payload.content = sanitizeHtml(updates.content);
      payload.wordCount = payload.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    }

    await update(chapterRef, payload);

    // Sync public projection if book is published
    const bookSnap = await get(ref(db, `books/${bookId}`));
    if (bookSnap.exists() && bookSnap.val().status === 'published' && bookSnap.val().visibility === 'public') {
      await syncBookChaptersToPublic(bookId);
    }
  } catch (error) {
    console.error(`Error updating chapter ${chapterId}:`, error);
    throw error;
  }
}

/**
 * Delete a chapter
 */
export async function deleteChapter(bookId: string, chapterId: string): Promise<void> {
  try {
    await remove(ref(db, `bookContent/${bookId}/chapters/${chapterId}`));
    await remove(ref(db, `publicBookContent/${bookId}/chapters/${chapterId}`));

    // Update book chapter count
    const remaining = await getChapters(bookId, true);
    const count = remaining.length;
    await update(ref(db, `books/${bookId}`), { chapterCount: count, updatedAt: Date.now() });

    const bookSnap = await get(ref(db, `books/${bookId}`));
    if (bookSnap.exists() && bookSnap.val().status === 'published') {
      await update(ref(db, `publicBooks/${bookId}`), { chapterCount: count });
    }
  } catch (error) {
    console.error(`Error deleting chapter ${chapterId}:`, error);
    throw error;
  }
}

/**
 * Reorder chapters sequentially
 */
export async function reorderChapters(bookId: string, orderedIds: string[]): Promise<void> {
  try {
    const updates: Record<string, any> = {};
    orderedIds.forEach((id, index) => {
      updates[`bookContent/${bookId}/chapters/${id}/order`] = index + 1;
    });

    await update(ref(db), updates);

    // Sync to public if book is published
    const bookSnap = await get(ref(db, `books/${bookId}`));
    if (bookSnap.exists() && bookSnap.val().status === 'published' && bookSnap.val().visibility === 'public') {
      await syncBookChaptersToPublic(bookId);
    }
  } catch (error) {
    console.error('Error reordering chapters:', error);
    throw error;
  }
}
