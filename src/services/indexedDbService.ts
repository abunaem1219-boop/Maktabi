/**
 * KitabKhana Offline-First Writer Studio — IndexedDB Storage Service
 * Provides robust, typed, promise-based local persistence for books, chapters, assets, editor state, and sync queue.
 */

import {
  LocalBook,
  LocalChapter,
  LocalAsset,
  SyncQueueItem,
  EditorStateRecord,
  StorageEstimateResult,
} from '../types/writer';

const DB_NAME = 'KitabKhanaWriterDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open (or create/upgrade) the IndexedDB database instance
 */
export function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Books Store
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('ownerUid', 'ownerUid', { unique: false });
        bookStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        bookStore.createIndex('status', 'status', { unique: false });
        bookStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // 2. Chapters Store
      if (!db.objectStoreNames.contains('chapters')) {
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chapterStore.createIndex('bookId', 'bookId', { unique: false });
        chapterStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        chapterStore.createIndex('bookId_order', ['bookId', 'order'], { unique: false });
      }

      // 3. Local Assets (Images/Media)
      if (!db.objectStoreNames.contains('assets')) {
        const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
        assetStore.createIndex('bookId', 'bookId', { unique: false });
        assetStore.createIndex('uploadStatus', 'uploadStatus', { unique: false });
      }

      // 4. Synchronization Queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('bookId', 'bookId', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 5. Editor State (active chapter, cursor position)
      if (!db.objectStoreNames.contains('editorState')) {
        db.createObjectStore('editorState', { keyPath: 'bookId' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      db.onclose = () => {
        dbPromise = null;
      };

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = (event) => {
      dbPromise = null;
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('IndexedDB open error:', error);
      reject(error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

/* ==========================================================================
   BOOKS CRUD
   ========================================================================== */

export async function saveLocalBook(book: LocalBook): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readwrite');
    const store = tx.objectStore('books');
    const req = store.put({
      ...book,
      updatedAt: Date.now(),
    });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalBook(id: string): Promise<LocalBook | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllLocalBooks(ownerUid?: string): Promise<LocalBook[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const req = store.getAll();

    req.onsuccess = () => {
      let books: LocalBook[] = req.result || [];
      if (ownerUid) {
        books = books.filter((b) => b.ownerUid === ownerUid || b.ownerUid === 'device_local');
      }
      // Sort by updatedAt descending
      books.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      resolve(books);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalBook(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['books', 'chapters', 'assets', 'syncQueue', 'editorState'], 'readwrite');

    // 1. Delete Book
    tx.objectStore('books').delete(id);

    // 2. Delete Editor State
    tx.objectStore('editorState').delete(id);

    // 3. Delete Chapters for Book
    const chapterStore = tx.objectStore('chapters');
    const chapterIndex = chapterStore.index('bookId');
    const chapterReq = chapterIndex.getAllKeys(id);
    chapterReq.onsuccess = () => {
      const keys = chapterReq.result || [];
      keys.forEach((k) => chapterStore.delete(k));
    };

    // 4. Delete Assets for Book
    const assetStore = tx.objectStore('assets');
    const assetIndex = assetStore.index('bookId');
    const assetReq = assetIndex.getAllKeys(id);
    assetReq.onsuccess = () => {
      const keys = assetReq.result || [];
      keys.forEach((k) => assetStore.delete(k));
    };

    // 5. Delete Sync Queue entries for Book
    const queueStore = tx.objectStore('syncQueue');
    const queueIndex = queueStore.index('bookId');
    const queueReq = queueIndex.getAllKeys(id);
    queueReq.onsuccess = () => {
      const keys = queueReq.result || [];
      keys.forEach((k) => queueStore.delete(k));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ==========================================================================
   CHAPTERS CRUD
   ========================================================================== */

export async function saveLocalChapter(chapter: LocalChapter): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['chapters', 'books'], 'readwrite');
    const chapterStore = tx.objectStore('chapters');
    const now = Date.now();

    chapterStore.put({
      ...chapter,
      updatedAt: now,
    });

    // Also update parent book's lastOpenedAt and updatedAt
    const bookStore = tx.objectStore('books');
    const getBookReq = bookStore.get(chapter.bookId);
    getBookReq.onsuccess = () => {
      const book = getBookReq.result;
      if (book) {
        book.updatedAt = now;
        book.lastOpenedAt = now;
        bookStore.put(book);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalChapter(id: string): Promise<LocalChapter | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getChaptersByBookId(bookId: string): Promise<LocalChapter[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('bookId');
    const req = index.getAll(bookId);

    req.onsuccess = () => {
      const chapters: LocalChapter[] = req.result || [];
      chapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      resolve(chapters);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalChapter(id: string, bookId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function reorderLocalChapters(bookId: string, orderedIds: string[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    const now = Date.now();

    orderedIds.forEach((id, index) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.order = index + 1;
          item.updatedAt = now;
          store.put(item);
        }
      };
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ==========================================================================
   ASSETS CRUD
   ========================================================================== */

export async function saveLocalAsset(asset: LocalAsset): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    const store = tx.objectStore('assets');
    const req = store.put(asset);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalAsset(id: string): Promise<LocalAsset | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readonly');
    const store = tx.objectStore('assets');
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAssetsByBookId(bookId: string): Promise<LocalAsset[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readonly');
    const store = tx.objectStore('assets');
    const index = store.index('bookId');
    const req = index.getAll(bookId);

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalAsset(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    const store = tx.objectStore('assets');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* ==========================================================================
   EDITOR STATE
   ========================================================================== */

export async function saveEditorState(state: EditorStateRecord): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('editorState', 'readwrite');
    const store = tx.objectStore('editorState');
    const req = store.put({
      ...state,
      updatedAt: Date.now(),
    });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getEditorState(bookId: string): Promise<EditorStateRecord | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('editorState', 'readonly');
    const store = tx.objectStore('editorState');
    const req = store.get(bookId);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/* ==========================================================================
   SYNC QUEUE CRUD
   ========================================================================== */

export async function enqueueSync(
  item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>
): Promise<SyncQueueItem> {
  const db = await getDb();
  const now = Date.now();
  const queueItem: SyncQueueItem = {
    ...item,
    id: `sync_${now}_${Math.random().toString(36).substring(2, 8)}`,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const req = store.put(queueItem);

    req.onsuccess = () => resolve(queueItem);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('status');
    const req = index.getAll('pending');

    req.onsuccess = () => {
      const items: SyncQueueItem[] = req.result || [];
      items.sort((a, b) => a.createdAt - b.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        const merged: SyncQueueItem = {
          ...item,
          ...updates,
          updatedAt: Date.now(),
        };
        store.put(merged);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSyncQueueItem(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearCompletedSyncQueue(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const index = store.index('status');
    const req = index.getAllKeys('completed');

    req.onsuccess = () => {
      const keys = req.result || [];
      keys.forEach((k) => store.delete(k));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ==========================================================================
   STORAGE ESTIMATION & UTILITIES
   ========================================================================== */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '০ KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export async function getStorageEstimate(): Promise<StorageEstimateResult> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 1;
      const usagePercent = Math.min(100, Math.round((usageBytes / quotaBytes) * 100));

      return {
        usageBytes,
        quotaBytes,
        usagePercent,
        usageFormatted: formatBytes(usageBytes),
        quotaFormatted: formatBytes(quotaBytes),
        isLow: usagePercent > 85,
      };
    } catch (e) {
      console.warn('Storage estimate failed:', e);
    }
  }

  return {
    usageBytes: 0,
    quotaBytes: 0,
    usagePercent: 0,
    usageFormatted: 'অজানা',
    quotaFormatted: 'অজানা',
    isLow: false,
  };
}

/* ==========================================================================
   IMPORT / EXPORT BACKUPS
   ========================================================================== */

export interface BookBackupPayload {
  format: 'kitabkhana_backup_v1';
  exportedAt: number;
  book: LocalBook;
  chapters: LocalChapter[];
}

export async function exportBookAsJson(bookId: string): Promise<string> {
  const book = await getLocalBook(bookId);
  if (!book) {
    throw new Error('কিতাবটি লোকাল স্টোরেজে পাওয়া যায়নি।');
  }

  const chapters = await getChaptersByBookId(bookId);
  const payload: BookBackupPayload = {
    format: 'kitabkhana_backup_v1',
    exportedAt: Date.now(),
    book,
    chapters,
  };

  return JSON.stringify(payload, null, 2);
}

export async function importBookFromJson(
  jsonStr: string,
  currentOwnerUid: string
): Promise<LocalBook> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('অবৈধ JSON ফাইল ফরম্যাট।');
  }

  if (parsed.format !== 'kitabkhana_backup_v1' || !parsed.book || !Array.isArray(parsed.chapters)) {
    throw new Error('এই ফাইলটি কিতাবখানা ব্যাকআপ ফাইল নয়।');
  }

  const now = Date.now();
  const newBookId = `book_local_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const importedBook: LocalBook = {
    ...parsed.book,
    id: newBookId,
    ownerUid: currentOwnerUid || 'device_local',
    title: `${parsed.book.title || 'অনুরূপ কিতাব'} (ইম্পোর্ট)`,
    status: 'draft',
    syncStatus: 'local',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  await saveLocalBook(importedBook);

  for (let i = 0; i < parsed.chapters.length; i++) {
    const ch = parsed.chapters[i];
    const newChapterId = `ch_local_${now}_${i + 1}`;
    const importedChapter: LocalChapter = {
      ...ch,
      id: newChapterId,
      bookId: newBookId,
      order: ch.order ?? (i + 1),
      createdAt: now,
      updatedAt: now,
    };
    await saveLocalChapter(importedChapter);
  }

  return importedBook;
}

export async function clearAllLocalDraftData(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['books', 'chapters', 'assets', 'syncQueue', 'editorState'], 'readwrite');
    tx.objectStore('books').clear();
    tx.objectStore('chapters').clear();
    tx.objectStore('assets').clear();
    tx.objectStore('syncQueue').clear();
    tx.objectStore('editorState').clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
