/**
 * KitabKhana Discovery & Recommendation Engine
 * Provides deterministic ranking, popularity scoring, multi-signal related book calculation,
 * and author discovery summaries without external AI APIs or fake data.
 */

import { Book } from '../types/book';
import { getPublishedBooks } from './bookService';
import { normalizeSearchText } from '../utils/searchUtils';

export interface AuthorDiscoverySummary {
  id: string; // authorId or createdBy or sanitized authorName
  name: string;
  bookCount: number;
  totalReads: number;
  categories: string[];
  latestBookCover?: string;
  sampleBookTitles: string[];
}

/**
 * Deterministic Popularity Scoring Formula:
 * readCount * 1 + favoriteCount * 3
 */
export function calculateBookPopularity(book: Book): number {
  const reads = Number(book.readCount) || 0;
  const favorites = Number(book.favoriteCount) || 0;
  return reads * 1 + favorites * 3;
}

/**
 * Fetch popular books sorted by transparent popularity score
 */
export async function getPopularBooks(limitCount = 6): Promise<Book[]> {
  try {
    const books = await getPublishedBooks(100);
    return books
      .map((b) => ({ book: b, score: calculateBookPopularity(b) }))
      .sort((a, b) => b.score - a.score || (b.book.publishedAt || 0) - (a.book.publishedAt || 0))
      .map((item) => item.book)
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching popular books:', error);
    return [];
  }
}

/**
 * Deterministic multi-signal related books algorithm:
 * 1. Same category (+10 points)
 * 2. Shared tags (+3 points per tag)
 * 3. Same author (+8 points)
 * 4. Shared title keywords (+2 points per word match)
 */
export function calculateRelatedBooks(
  targetBook: Book,
  candidateBooks: Book[],
  limitCount = 6
): Book[] {
  if (!candidateBooks || candidateBooks.length === 0) return [];

  const targetCategory = targetBook.categoryId;
  const targetAuthor = normalizeSearchText(targetBook.authorName);
  const targetTags = new Set((targetBook.tags || []).map((t) => t.trim().toLowerCase()));
  const targetWords = new Set(
    normalizeSearchText(targetBook.title)
      .split(' ')
      .filter((w) => w.length > 2)
  );

  const scored = candidateBooks
    .filter((b) => b.id !== targetBook.id)
    .map((b) => {
      let score = 0;

      // 1. Same category
      if (b.categoryId && b.categoryId === targetCategory) {
        score += 10;
      }

      // 2. Same author
      if (normalizeSearchText(b.authorName) === targetAuthor) {
        score += 8;
      }

      // 3. Shared tags
      if (b.tags && b.tags.length > 0) {
        for (const t of b.tags) {
          if (targetTags.has(t.trim().toLowerCase())) {
            score += 3;
          }
        }
      }

      // 4. Shared title words
      const bWords = normalizeSearchText(b.title).split(' ');
      for (const w of bWords) {
        if (targetWords.has(w)) {
          score += 2;
        }
      }

      return { book: b, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.book.publishedAt || 0) - (a.book.publishedAt || 0))
    .map((item) => item.book);

  // If scored results are fewer than requested, fill with other published books from same or other categories
  if (scored.length < limitCount) {
    const existingIds = new Set([targetBook.id, ...scored.map((b) => b.id)]);
    const fallback = candidateBooks.filter((b) => !existingIds.has(b.id));
    scored.push(...fallback.slice(0, limitCount - scored.length));
  }

  return scored.slice(0, limitCount);
}

/**
 * Aggregate public authors from published books
 * Yields real author profiles with verified published work counts
 */
export async function getPublicAuthorsSummary(limitCount = 8): Promise<AuthorDiscoverySummary[]> {
  try {
    const books = await getPublishedBooks(200);
    const authorMap = new Map<string, AuthorDiscoverySummary>();

    for (const b of books) {
      const authorName = b.authorName?.trim();
      if (!authorName) continue;

      const authorKey = b.createdBy || b.authorId || authorName.toLowerCase().replace(/\s+/g, '-');
      const existing = authorMap.get(authorKey);

      if (!existing) {
        authorMap.set(authorKey, {
          id: authorKey,
          name: authorName,
          bookCount: 1,
          totalReads: Number(b.readCount) || 0,
          categories: b.categoryName ? [b.categoryName] : [],
          latestBookCover: b.coverUrl,
          sampleBookTitles: [b.title],
        });
      } else {
        existing.bookCount += 1;
        existing.totalReads += Number(b.readCount) || 0;
        if (b.categoryName && !existing.categories.includes(b.categoryName)) {
          existing.categories.push(b.categoryName);
        }
        if (!existing.latestBookCover && b.coverUrl) {
          existing.latestBookCover = b.coverUrl;
        }
        if (existing.sampleBookTitles.length < 3 && !existing.sampleBookTitles.includes(b.title)) {
          existing.sampleBookTitles.push(b.title);
        }
      }
    }

    const list = Array.from(authorMap.values());
    // Sort by book count then total reads
    return list
      .sort((a, b) => b.bookCount - a.bookCount || b.totalReads - a.totalReads)
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error getting public authors summary:', error);
    return [];
  }
}
