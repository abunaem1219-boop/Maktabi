/**
 * KitabKhana Search & Discovery Normalization Utility
 * Provides Unicode normalization, bilingual English-Bengali transliteration/synonym matching,
 * tokenization, and localStorage recent search history management.
 */

// Common Bengali-English transliteration / synonym dictionary for search intent
const SEARCH_SYNONYMS: Record<string, string[]> = {
  quran: ['কুরআন', 'কোরআন', 'কুরান', 'quran', 'koran'],
  কুরআন: ['কুরআন', 'কোরআন', 'কুরান', 'quran', 'koran'],
  hadith: ['হাদিস', 'হাদীস', 'hadith', 'hadeeth'],
  হাদিস: ['হাদিস', 'হাদীস', 'hadith', 'hadeeth'],
  islam: ['ইসলাম', 'ইসলামিক', 'ইসলামী', 'islam', 'islamic'],
  ইসলাম: ['ইসলাম', 'ইসলামিক', 'ইসলামী', 'islam', 'islamic'],
  tafsir: ['তাফসির', 'তাফসীর', 'tafsir', 'tafseer'],
  তাফসির: ['তাফসির', 'তাফসীর', 'tafsir', 'tafseer'],
  seerat: ['সীরাত', 'সিরাত', 'জীবনী', 'seerat', 'sirat', 'biography'],
  সীরাত: ['সীরাত', 'সিরাত', 'জীবনী', 'seerat', 'sirat', 'biography'],
  history: ['ইতিহাস', 'ঐতিহাসিক', 'history', 'historical'],
  ইতিহাস: ['ইতিহাস', 'ঐতিহাসিক', 'history', 'historical'],
  novel: ['উপন্যাস', 'novel'],
  উপন্যাস: ['উপন্যাস', 'novel'],
  story: ['গল্প', 'ছোটগল্প', 'story'],
  গল্প: ['গল্প', 'ছোটগল্প', 'story'],
  poem: ['কবিতা', 'কাব্য', 'poem', 'poetry'],
  কবিতা: ['কবিতা', 'কাব্য', 'poem', 'poetry'],
  science: ['বিজ্ঞান', 'বিজ্ঞান ও প্রযুক্তি', 'science'],
  বিজ্ঞান: ['বিজ্ঞান', 'বিজ্ঞান ও প্রযুক্তি', 'science'],
  motivation: ['আত্মউন্নয়ন', 'অনুপ্রেরণা', 'মোটিভেশন', 'self-development', 'motivation'],
  আত্মউন্নয়ন: ['আত্মউন্নয়ন', 'অনুপ্রেরণা', 'মোটিভেশন', 'self-development', 'motivation'],
  education: ['শিক্ষা', 'পাঠ্যপুস্তক', 'education'],
  শিক্ষা: ['শিক্ষা', 'পাঠ্যপুস্তক', 'education'],
  rabindranath: ['রবীন্দ্রনাথ', 'ঠাকুর', 'rabindranath', 'tagore'],
  রবীন্দ্রনাথ: ['রবীন্দ্রনাথ', 'ঠাকুর', 'rabindranath', 'tagore'],
  kazi: ['কাজী', 'নজরুল', 'nazrul'],
  নজরুল: ['নজরুল', 'কাজী', 'nazrul'],
};

/**
 * Normalizes text for search indexing and querying:
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Lowercases English letters
 * - Removes common punctuation marks
 * - Normalizes Bengali Unicode characters (zero-width characters, hasant, nukta)
 */
export function normalizeSearchText(input: string): string {
  if (!input) return '';

  return input
    .toLowerCase()
    // Remove zero-width characters (ZWNJ, ZWJ)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize unicode composition
    .normalize('NFC')
    // Remove special punctuation that confuses word matching, keeping letters and Bengali characters
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>।]/g, ' ')
    // Collapse multiple whitespaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get synonym/expanded terms for a query token
 */
export function getExpandedSearchTerms(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const termsSet = new Set<string>();

  for (const token of tokens) {
    termsSet.add(token);
    // Check synonym dictionary
    for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
      if (key === token || synonyms.includes(token)) {
        synonyms.forEach((s) => termsSet.add(s.toLowerCase()));
      }
    }
  }

  return Array.from(termsSet);
}

/**
 * Match score calculator between a book record and query
 * Returns a score > 0 if matched, higher score = higher relevance
 */
export function calculateSearchMatchScore(
  book: {
    title: string;
    authorName: string;
    publisher?: string;
    categoryName?: string;
    description?: string;
    tags?: string[];
  },
  query: string
): number {
  if (!query || !query.trim()) return 1;

  const normalizedQuery = normalizeSearchText(query);
  const expandedTerms = getExpandedSearchTerms(query);

  const titleNorm = normalizeSearchText(book.title);
  const authorNorm = normalizeSearchText(book.authorName);
  const publisherNorm = normalizeSearchText(book.publisher || '');
  const categoryNorm = normalizeSearchText(book.categoryName || '');
  const descNorm = normalizeSearchText(book.description || '');
  const tagsNorm = (book.tags || []).map(normalizeSearchText);

  let score = 0;

  // Exact phrase matches (highest priority)
  if (titleNorm === normalizedQuery) score += 100;
  else if (titleNorm.includes(normalizedQuery)) score += 50;

  if (authorNorm === normalizedQuery) score += 80;
  else if (authorNorm.includes(normalizedQuery)) score += 40;

  if (categoryNorm.includes(normalizedQuery)) score += 30;
  if (publisherNorm.includes(normalizedQuery)) score += 20;

  for (const tag of tagsNorm) {
    if (tag === normalizedQuery) score += 35;
    else if (tag.includes(normalizedQuery)) score += 20;
  }

  // Token & Synonym checks
  for (const term of expandedTerms) {
    if (titleNorm.includes(term)) score += 15;
    if (authorNorm.includes(term)) score += 12;
    if (categoryNorm.includes(term)) score += 10;
    if (tagsNorm.some((t) => t.includes(term))) score += 8;
    if (descNorm.includes(term)) score += 4;
  }

  return score;
}

/* ==========================================================================
   RECENT SEARCHES STORAGE (Client localStorage, max 8 items, safe)
   ========================================================================== */

const RECENT_SEARCHES_KEY = 'kitabkhana_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  const clean = query.trim();
  if (!clean || clean.length < 2) return;

  try {
    const existing = getRecentSearches();
    const updated = [clean, ...existing.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage issues
  }
}

export function removeRecentSearch(query: string): void {
  try {
    const existing = getRecentSearches();
    const updated = existing.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}
