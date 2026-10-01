import { ref, get, set, remove, push } from 'firebase/database';
import { db } from '../firebase/config';
import { Bookmark } from '../types/book';

/**
 * Add a new bookmark
 */
export async function addBookmark(
  uid: string,
  data: Omit<Bookmark, 'id' | 'createdAt'>
): Promise<Bookmark> {
  try {
    const newRef = push(ref(db, `bookmarks/${uid}`));
    const id = newRef.key as string;
    const bookmark: Bookmark = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await set(newRef, bookmark);
    return bookmark;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

/**
 * Delete a bookmark
 */
export async function removeBookmark(uid: string, bookmarkId: string): Promise<void> {
  try {
    await remove(ref(db, `bookmarks/${uid}/${bookmarkId}`));
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

/**
 * Check if a specific book & chapter is bookmarked
 */
export async function findBookmarkForChapter(
  uid: string,
  bookId: string,
  chapterId: string
): Promise<Bookmark | null> {
  try {
    const snap = await get(ref(db, `bookmarks/${uid}`));
    if (!snap.exists()) return null;

    const val = snap.val();
    const foundId = Object.keys(val).find(
      (k) => val[k].bookId === bookId && val[k].chapterId === chapterId
    );

    if (foundId) {
      return { id: foundId, ...val[foundId] };
    }
    return null;
  } catch (error) {
    console.error('Error finding bookmark:', error);
    return null;
  }
}

/**
 * Fetch all bookmarks for a user
 */
export async function getUserBookmarks(uid: string): Promise<Bookmark[]> {
  try {
    const snap = await get(ref(db, `bookmarks/${uid}`));
    if (!snap.exists()) return [];

    const val = snap.val();
    const list: Bookmark[] = Object.keys(val).map((k) => ({
      id: k,
      ...val[k],
    }));

    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return [];
  }
}
