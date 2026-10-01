import { ref, get, set } from 'firebase/database';
import { db } from '../firebase/config';
import { ReadingProgress } from '../types/book';

const LOCAL_PROGRESS_PREFIX = 'kitabkhana_reading_progress_';

/**
 * Save current reading progress with local fallback for guests
 */
export async function saveReadingProgress(
  uid: string | null,
  progress: ReadingProgress
): Promise<void> {
  const payload: ReadingProgress = {
    ...progress,
    updatedAt: Date.now(),
  };

  // Always keep a local copy for instant offline/guest recovery
  try {
    localStorage.setItem(
      `${LOCAL_PROGRESS_PREFIX}${progress.bookId}`,
      JSON.stringify(payload)
    );
  } catch (e) {
    console.warn('Failed to save progress locally:', e);
  }

  // If user is authenticated, sync to Firebase
  if (uid) {
    try {
      await set(ref(db, `readingProgress/${uid}/${progress.bookId}`), payload);
    } catch (err) {
      console.error('Failed to sync reading progress to Firebase:', err);
    }
  }
}

/**
 * Retrieve saved reading progress for a book
 */
export async function getReadingProgress(
  uid: string | null,
  bookId: string
): Promise<ReadingProgress | null> {
  // If user is authenticated, query Firebase first
  if (uid) {
    try {
      const snap = await get(ref(db, `readingProgress/${uid}/${bookId}`));
      if (snap.exists()) {
        return snap.val() as ReadingProgress;
      }
    } catch (err) {
      console.error('Failed to read reading progress from Firebase:', err);
    }
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${bookId}`);
    if (raw) {
      return JSON.parse(raw) as ReadingProgress;
    }
  } catch (e) {
    console.warn('Failed to read progress from local storage:', e);
  }

  return null;
}

/**
 * Fetch most recent reading items for Continue Reading section
 */
export async function getRecentReadingHistory(
  uid: string | null,
  limitCount = 4
): Promise<ReadingProgress[]> {
  if (!uid) {
    // Collect local entries
    try {
      const list: ReadingProgress[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_PROGRESS_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            list.push(JSON.parse(raw));
          }
        }
      }
      return list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limitCount);
    } catch {
      return [];
    }
  }

  try {
    const snap = await get(ref(db, `readingProgress/${uid}`));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: ReadingProgress[] = Object.keys(val).map((k) => val[k]);
    return list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limitCount);
  } catch (err) {
    console.error('Error fetching recent reading history:', err);
    return [];
  }
}
