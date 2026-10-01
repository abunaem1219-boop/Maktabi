import { ref, get, set, remove } from 'firebase/database';
import { db } from '../firebase/config';
import { Book } from '../types/book';
import { getBookById } from './bookService';

/**
 * Add a book to user's favorites
 */
export async function addFavorite(uid: string, bookId: string): Promise<void> {
  try {
    const favRef = ref(db, `favorites/${uid}/${bookId}`);
    await set(favRef, true);
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

/**
 * Remove a book from user's favorites
 */
export async function removeFavorite(uid: string, bookId: string): Promise<void> {
  try {
    const favRef = ref(db, `favorites/${uid}/${bookId}`);
    await remove(favRef);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

/**
 * Check if a book is favorited by the user
 */
export async function isFavorite(uid: string, bookId: string): Promise<boolean> {
  try {
    const favRef = ref(db, `favorites/${uid}/${bookId}`);
    const snapshot = await get(favRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Fetch all favorite book IDs for a user
 */
export async function getUserFavoriteBookIds(uid: string): Promise<string[]> {
  try {
    const userFavsRef = ref(db, `favorites/${uid}`);
    const snapshot = await get(userFavsRef);
    if (!snapshot.exists()) {
      return [];
    }
    const val = snapshot.val();
    return Object.keys(val).filter((k) => val[k] === true);
  } catch (error) {
    console.error('Error fetching user favorite IDs:', error);
    return [];
  }
}

/**
 * Resolve user's favorite IDs into public Book models
 * Ignores deleted, private or archived books gracefully.
 */
export async function getUserFavoriteBooks(uid: string): Promise<Book[]> {
  try {
    const ids = await getUserFavoriteBookIds(uid);
    if (ids.length === 0) return [];

    const bookPromises = ids.map((id) => getBookById(id, false));
    const results = await Promise.all(bookPromises);

    // Keep only non-null, publicly available books
    return results.filter((b): b is Book => b !== null);
  } catch (error) {
    console.error('Error fetching user favorite books:', error);
    return [];
  }
}
