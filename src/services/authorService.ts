/**
 * KitabKhana Public Author Ecosystem Service
 * Securely accesses and derives public author profiles and published books.
 * Strictly shields private user data, email addresses, and unapproved works.
 */

import { ref, get, set, update } from 'firebase/database';
import { db } from '../firebase/config';
import { Book } from '../types/book';
import { getPublishedBooks } from './bookService';
import { normalizeSearchText } from '../utils/searchUtils';

export interface PublicAuthorProfile {
  uid: string;
  name: string;
  photoURL?: string;
  bio?: string;
  joinedDate?: number;
  publishedBookCount: number;
  totalReads: number;
  categories: string[];
}

/**
 * Fetch a public author's profile and their published books
 * Never exposes private fields or unpublished books.
 */
export async function getPublicAuthorDetails(
  authorIdOrName: string
): Promise<{ profile: PublicAuthorProfile | null; books: Book[] }> {
  if (!authorIdOrName) {
    return { profile: null, books: [] };
  }

  try {
    const allPublished = await getPublishedBooks(300);

    const normTarget = normalizeSearchText(authorIdOrName);
    const slugTarget = authorIdOrName.toLowerCase().replace(/\s+/g, '-');

    // Find all published books that match this author
    const matchedBooks = allPublished.filter((b) => {
      const bCreatedBy = b.createdBy?.toLowerCase();
      const bAuthorId = b.authorId?.toLowerCase();
      const bAuthorNameNorm = normalizeSearchText(b.authorName || '');
      const bSlug = (b.authorName || '').toLowerCase().replace(/\s+/g, '-');

      return (
        bCreatedBy === authorIdOrName.toLowerCase() ||
        bAuthorId === authorIdOrName.toLowerCase() ||
        bAuthorNameNorm === normTarget ||
        bSlug === slugTarget
      );
    });

    // Check if there is an explicit public author record in `publicAuthors/{uid}`
    let explicitProfile: Partial<PublicAuthorProfile> | null = null;
    try {
      const snap = await get(ref(db, `publicAuthors/${authorIdOrName}`));
      if (snap.exists()) {
        explicitProfile = snap.val();
      }
    } catch {
      // If publicAuthors doesn't exist or isn't accessible, derive safely
    }

    if (matchedBooks.length === 0 && !explicitProfile) {
      return { profile: null, books: [] };
    }

    // Determine author's display name
    const authorName =
      explicitProfile?.name ||
      matchedBooks[0]?.authorName ||
      authorIdOrName;

    // Collect all categories this author writes in
    const categoriesSet = new Set<string>();
    let totalReads = 0;

    for (const b of matchedBooks) {
      if (b.categoryName) categoriesSet.add(b.categoryName);
      totalReads += Number(b.readCount) || 0;
    }

    const profile: PublicAuthorProfile = {
      uid: authorIdOrName,
      name: authorName,
      photoURL: explicitProfile?.photoURL || undefined,
      bio:
        explicitProfile?.bio ||
        `কিতাবখানা ডিজিটাল লাইব্রেরির সম্মানিত লেখক। মোট ${matchedBooks.length} টি কিতাব প্রকাশিত হয়েছে।`,
      joinedDate: explicitProfile?.joinedDate || matchedBooks[0]?.publishedAt || matchedBooks[0]?.createdAt,
      publishedBookCount: matchedBooks.length,
      totalReads,
      categories: Array.from(categoriesSet),
    };

    return { profile, books: matchedBooks };
  } catch (error) {
    console.error('Error fetching public author details:', error);
    return { profile: null, books: [] };
  }
}

/**
 * Update author's public profile in `publicAuthors/{uid}`
 */
export async function savePublicAuthorProfile(
  uid: string,
  data: { name: string; photoURL?: string; bio?: string }
): Promise<void> {
  try {
    const authorRef = ref(db, `publicAuthors/${uid}`);
    const existing = await get(authorRef);
    const now = Date.now();

    const payload = {
      uid,
      name: data.name.trim(),
      photoURL: data.photoURL || null,
      bio: data.bio?.trim() || '',
      updatedAt: now,
      joinedDate: existing.exists() ? existing.val().joinedDate || now : now,
    };

    await set(authorRef, payload);
  } catch (error) {
    console.error('Error saving public author profile:', error);
    throw error;
  }
}
