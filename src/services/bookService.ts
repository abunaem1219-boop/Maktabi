import { ref, get, set, update, remove, push } from 'firebase/database';
import { db, ADMIN_UID } from '../firebase/config';
import { Book, BookStatus, BookVisibility } from '../types/book';
import { syncBookChaptersToPublic, removeBookChaptersFromPublic, getChapters } from './chapterService';
import { calculateSearchMatchScore, normalizeSearchText } from '../utils/searchUtils';

// In-memory caching for published books (TTL: 20 seconds)
let cachedPublishedBooks: Book[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20_000;

export function clearBooksCache(): void {
  cachedPublishedBooks = null;
  lastCacheTime = 0;
}

/**
 * Helper to sync a book to the public projection if published + public,
 * or remove it from publicBooks if not published or private.
 */
async function syncPublicProjection(book: Book): Promise<void> {
  clearBooksCache();
  const publicRef = ref(db, `publicBooks/${book.id}`);
  if (book.status === 'published' && book.visibility === 'public') {
    await set(publicRef, book);
    await syncBookChaptersToPublic(book.id);
  } else {
    // Remove from public projection
    await remove(publicRef);
    await removeBookChaptersFromPublic(book.id);
  }
}

/**
 * Fetch all publicly available books (status: published, visibility: public)
 */
export async function getPublishedBooks(limitCount = 50, forceRefresh = false): Promise<Book[]> {
  try {
    const now = Date.now();
    if (!forceRefresh && cachedPublishedBooks && now - lastCacheTime < CACHE_TTL_MS) {
      return cachedPublishedBooks.slice(0, limitCount);
    }

    const publicRef = ref(db, 'publicBooks');
    const snapshot = await get(publicRef);

    if (!snapshot.exists()) {
      cachedPublishedBooks = [];
      lastCacheTime = now;
      return [];
    }

    const val = snapshot.val();
    const books: Book[] = Object.keys(val).map((key) => ({
      id: key,
      ...val[key],
    }));

    // Cache the list sorted by publication timestamp
    cachedPublishedBooks = books.sort(
      (a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt)
    );
    lastCacheTime = now;

    return cachedPublishedBooks.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching published books:', error);
    return [];
  }
}

/**
 * Fetch featured books from publicBooks projection
 */
export async function getFeaturedBooks(limitCount = 10): Promise<Book[]> {
  try {
    const all = await getPublishedBooks(50);
    return all.filter((b) => b.featured === true).slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching featured books:', error);
    return [];
  }
}

/**
 * Fetch latest new releases
 */
export async function getLatestBooks(limitCount = 10): Promise<Book[]> {
  try {
    const all = await getPublishedBooks(limitCount);
    return all.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching latest books:', error);
    return [];
  }
}

/**
 * Fetch books belonging to a specific category
 */
export async function getBooksByCategory(categoryId: string): Promise<Book[]> {
  try {
    const all = await getPublishedBooks(100);
    return all.filter((b) => b.categoryId === categoryId);
  } catch (error) {
    console.error(`Error fetching books for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Fetch a single book by ID
 * If isAdmin is true, checks master `books/{id}`. Otherwise checks `publicBooks/{id}`.
 */
export async function getBookById(bookId: string, isAdmin = false): Promise<Book | null> {
  try {
    if (isAdmin) {
      const snap = await get(ref(db, `books/${bookId}`));
      if (snap.exists()) {
        return { id: bookId, ...snap.val() };
      }
    }

    // Default: Check public projection
    const publicSnap = await get(ref(db, `publicBooks/${bookId}`));
    if (publicSnap.exists()) {
      return { id: bookId, ...publicSnap.val() };
    }

    // Fallback: If admin opened an unpublished book
    if (!isAdmin) {
      const masterSnap = await get(ref(db, `books/${bookId}`));
      if (masterSnap.exists()) {
        const val = masterSnap.val();
        if (val.status === 'published' && val.visibility === 'public') {
          return { id: bookId, ...val };
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching book ${bookId}:`, error);
    return null;
  }
}

/**
 * Related books from same category (excluding current book)
 */
export async function getRelatedBooks(
  categoryId: string,
  currentBookId: string,
  limitCount = 6
): Promise<Book[]> {
  try {
    const categoryBooks = await getBooksByCategory(categoryId);
    return categoryBooks.filter((b) => b.id !== currentBookId).slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching related books:', error);
    return [];
  }
}

export type SearchSortOption =
  | 'newest'
  | 'updated'
  | 'popular'
  | 'favorites'
  | 'oldest'
  | 'title_asc'
  | 'title_desc';

export interface BookSearchOptions {
  query?: string;
  categoryId?: string;
  authorIdOrName?: string;
  tag?: string;
  sortOption?: SearchSortOption;
}

/**
 * Increment real read count for a book when opened by a reader
 */
export async function incrementBookReadCount(bookId: string): Promise<void> {
  if (!bookId) return;
  try {
    const bookSnap = await get(ref(db, `books/${bookId}`));
    if (!bookSnap.exists()) return;

    const currentReads = Number(bookSnap.val().readCount) || 0;
    const newReads = currentReads + 1;

    const updates: Record<string, any> = {
      [`books/${bookId}/readCount`]: newReads,
      [`publicBooks/${bookId}/readCount`]: newReads,
    };
    await update(ref(db), updates);
  } catch (err) {
    // Non-fatal background metric increment
    console.debug('Metric increment error:', err);
  }
}

/**
 * Search public books by title, author, publisher, tags, and category with ranking
 */
export async function searchBooks(
  queryOrOptions: string | BookSearchOptions,
  legacyCategoryId?: string,
  legacySortOption: SearchSortOption = 'newest'
): Promise<Book[]> {
  try {
    let query = '';
    let categoryId = 'all';
    let authorIdOrName = '';
    let tag = '';
    let sortOption: SearchSortOption = 'newest';

    if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
      query = queryOrOptions.query || '';
      categoryId = queryOrOptions.categoryId || 'all';
      authorIdOrName = queryOrOptions.authorIdOrName || '';
      tag = queryOrOptions.tag || '';
      sortOption = queryOrOptions.sortOption || 'newest';
    } else {
      query = queryOrOptions || '';
      categoryId = legacyCategoryId || 'all';
      sortOption = legacySortOption;
    }

    let books = await getPublishedBooks(300);

    // 1. Category filter
    if (categoryId && categoryId !== 'all') {
      books = books.filter((b) => b.categoryId === categoryId);
    }

    // 2. Author filter
    if (authorIdOrName && authorIdOrName !== 'all') {
      const targetNorm = normalizeSearchText(authorIdOrName);
      books = books.filter((b) => {
        const bAuthorNorm = normalizeSearchText(b.authorName || '');
        const bCreatedBy = (b.createdBy || '').toLowerCase();
        const bAuthorId = (b.authorId || '').toLowerCase();
        return (
          bAuthorNorm === targetNorm ||
          bCreatedBy === authorIdOrName.toLowerCase() ||
          bAuthorId === authorIdOrName.toLowerCase()
        );
      });
    }

    // 3. Tag filter
    if (tag && tag.trim()) {
      const tagNorm = normalizeSearchText(tag);
      books = books.filter((b) =>
        b.tags?.some((t) => normalizeSearchText(t).includes(tagNorm))
      );
    }

    // 4. Text query search with scoring
    if (query.trim()) {
      const scoredBooks = books
        .map((b) => ({ book: b, score: calculateSearchMatchScore(b, query) }))
        .filter((item) => item.score > 0);

      // If user specified custom sort, respect it; otherwise sort by match score
      if (sortOption === 'newest') {
        return scoredBooks
          .sort((a, b) => b.score - a.score || (b.book.publishedAt || 0) - (a.book.publishedAt || 0))
          .map((item) => item.book);
      } else {
        books = scoredBooks.map((item) => item.book);
      }
    }

    // 5. Sort options
    switch (sortOption) {
      case 'updated':
        return books.sort(
          (a, b) =>
            (b.updatedAt || b.publishedAt || b.createdAt) -
            (a.updatedAt || a.publishedAt || a.createdAt)
        );
      case 'popular':
        return books.sort((a, b) => {
          const scoreA = (Number(a.readCount) || 0) * 1 + (Number(a.favoriteCount) || 0) * 3;
          const scoreB = (Number(b.readCount) || 0) * 1 + (Number(b.favoriteCount) || 0) * 3;
          return scoreB - scoreA || (b.publishedAt || 0) - (a.publishedAt || 0);
        });
      case 'favorites':
        return books.sort(
          (a, b) => (Number(b.favoriteCount) || 0) - (Number(a.favoriteCount) || 0)
        );
      case 'oldest':
        return books.sort(
          (a, b) => (a.publishedAt || a.createdAt) - (b.publishedAt || b.createdAt)
        );
      case 'title_asc':
        return books.sort((a, b) => a.title.localeCompare(b.title, 'bn'));
      case 'title_desc':
        return books.sort((a, b) => b.title.localeCompare(a.title, 'bn'));
      case 'newest':
      default:
        return books.sort(
          (a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt)
        );
    }
  } catch (error) {
    console.error('Error during book search:', error);
    return [];
  }
}

/**
 * Fetch all books authored by a specific user from `userBooks/{uid}` index
 */
export async function getUserAuthorBooks(authorUid: string): Promise<any[]> {
  try {
    const userBooksRef = ref(db, `userBooks/${authorUid}`);
    const snapshot = await get(userBooksRef);
    if (!snapshot.exists()) return [];

    const val = snapshot.val();
    return Object.keys(val).map((k) => ({ id: k, ...val[k] }));
  } catch (error) {
    console.error('Error fetching user author books:', error);
    return [];
  }
}

/* ==========================================================================
   ADMIN OPERATIONS
   ========================================================================== */

/**
 * Fetch all books from master `books` node (Admin view)
 */
export async function getAllBooksAdmin(): Promise<Book[]> {
  try {
    const booksRef = ref(db, 'books');
    const snapshot = await get(booksRef);

    if (!snapshot.exists()) {
      return [];
    }

    const val = snapshot.val();
    return Object.keys(val).map((key) => ({
      id: key,
      ...val[key],
    }));
  } catch (error) {
    console.error('Error fetching admin books:', error);
    return [];
  }
}

/**
 * Create a new book record
 */
export async function createBook(
  data: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { createdBy?: string }
): Promise<Book> {
  try {
    const newBookRef = push(ref(db, 'books'));
    const id = newBookRef.key as string;
    const now = Date.now();

    const book: Book = {
      ...data,
      id,
      title: data.title.trim(),
      authorName: data.authorName.trim(),
      publisher: data.publisher?.trim() || '',
      description: data.description.trim(),
      coverUrl: data.coverUrl?.trim() || '',
      tags: data.tags || [],
      status: data.status || 'draft',
      visibility: data.visibility || 'public',
      featured: Boolean(data.featured),
      readCount: 0,
      favoriteCount: 0,
      chapterCount: data.chapterCount || 1,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === 'published' ? (data.publishedAt || now) : undefined,
      createdBy: data.createdBy || ADMIN_UID,
    };

    // Save to master books
    await set(newBookRef, book);

    // Sync to publicBooks projection if published & public
    await syncPublicProjection(book);

    return book;
  } catch (error) {
    console.error('Error creating book:', error);
    throw error;
  }
}

/**
 * Update an existing book record
 */
export async function updateBook(bookId: string, updates: Partial<Book>): Promise<void> {
  try {
    const bookRef = ref(db, `books/${bookId}`);
    const existingSnap = await get(bookRef);

    if (!existingSnap.exists()) {
      throw new Error(`Book ${bookId} not found.`);
    }

    const existing: Book = { id: bookId, ...existingSnap.val() };
    const now = Date.now();

    const merged: Book = {
      ...existing,
      ...updates,
      id: bookId,
      createdAt: existing.createdAt, // Prevent overriding createdAt
      updatedAt: now,
      publishedAt:
        updates.status === 'published' && !existing.publishedAt
          ? now
          : updates.publishedAt !== undefined
          ? updates.publishedAt
          : existing.publishedAt,
    };

    // Update master book
    await set(bookRef, merged);

    // Synchronize public projection
    await syncPublicProjection(merged);
  } catch (error) {
    console.error(`Error updating book ${bookId}:`, error);
    throw error;
  }
}

/**
 * Publish a book with complete validation checks
 */
export async function publishBook(bookId: string): Promise<void> {
  const bookSnap = await get(ref(db, `books/${bookId}`));
  if (!bookSnap.exists()) {
    throw new Error('বইটি খুঁজে পাওয়া যায়নি।');
  }

  const bookData: Book = bookSnap.val();
  if (!bookData.title?.trim()) {
    throw new Error('বই প্রকাশের জন্য শিরোনাম আবশ্যক।');
  }
  if (!bookData.authorName?.trim()) {
    throw new Error('বই প্রকাশের জন্য লেখকের নাম আবশ্যক।');
  }
  if (!bookData.description?.trim()) {
    throw new Error('বই প্রকাশের জন্য বিবরণ আবশ্যক।');
  }
  if (!bookData.categoryId) {
    throw new Error('বই প্রকাশের জন্য ক্যাটাগরি নির্ধারণ আবশ্যক।');
  }

  // Verify at least one chapter exists (Requirement #70)
  const chapters = await getChapters(bookId, true);
  if (chapters.length === 0) {
    throw new Error('বই প্রকাশ করার আগে অন্তত একটি অধ্যায় (Chapter) যোগ করা আবশ্যক।');
  }

  const now = Date.now();
  await updateBook(bookId, {
    status: 'published',
    visibility: 'public',
    publishedAt: bookData.publishedAt || now,
    chapterCount: chapters.length,
  });
}

/**
 * Unpublish/Archive a book
 */
export async function unpublishBook(bookId: string): Promise<void> {
  await updateBook(bookId, {
    status: 'archived',
    visibility: 'private',
  });
}

/**
 * Archive a book
 */
export async function archiveBook(bookId: string): Promise<void> {
  await updateBook(bookId, {
    status: 'archived',
    visibility: 'private',
  });
}

/**
 * Permanently delete a book (Removes master book, publicBooks, and chapters atomically)
 */
export async function deleteBook(bookId: string): Promise<void> {
  try {
    const updates: Record<string, null> = {
      [`books/${bookId}`]: null,
      [`publicBooks/${bookId}`]: null,
      [`bookContent/${bookId}`]: null,
      [`publicBookContent/${bookId}`]: null,
    };
    await update(ref(db), updates);
  } catch (error) {
    console.error(`Error deleting book ${bookId}:`, error);
    throw error;
  }
}

/**
 * Toggle featured state
 */
export async function toggleFeatured(bookId: string, featured: boolean): Promise<void> {
  await updateBook(bookId, { featured });
}
