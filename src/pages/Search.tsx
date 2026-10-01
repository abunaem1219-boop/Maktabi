import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book, Category } from '../types/book';
import { searchBooks, getPublishedBooks, SearchSortOption } from '../services/bookService';
import { getCategories } from '../services/categoryService';
import { BookGrid } from '../components/book/BookGrid';
import { CategoryIcon } from '../components/book/CategoryIcon';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  normalizeSearchText,
} from '../utils/searchUtils';
import { toBengaliNumerals, getInitials } from '../utils/formatters';
import {
  Search as SearchIcon,
  Filter,
  X,
  ArrowUpDown,
  History,
  Tag,
  User,
  Sparkles,
  BookOpen,
  Check,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface SearchProps {
  initialCategoryId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Search: React.FC<SearchProps> = ({ initialCategoryId, onNavigate }) => {
  // Helper to parse query parameters from hash (e.g. #search?q=islam&category=novel&tag=science)
  const parseHashParams = () => {
    const raw = window.location.hash;
    const queryIndex = raw.indexOf('?');
    if (queryIndex === -1) {
      return { q: '', category: initialCategoryId || 'all', tag: '', author: '', sort: 'newest' as SearchSortOption };
    }
    const searchParams = new URLSearchParams(raw.substring(queryIndex + 1));
    return {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || initialCategoryId || 'all',
      tag: searchParams.get('tag') || '',
      author: searchParams.get('author') || '',
      sort: (searchParams.get('sort') as SearchSortOption) || 'newest',
    };
  };

  const initialParams = parseHashParams();

  const [query, setQuery] = useState(initialParams.q);
  const [debouncedQuery, setDebouncedQuery] = useState(initialParams.q);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialParams.category);
  const [selectedAuthor, setSelectedAuthor] = useState<string>(initialParams.author);
  const [selectedTag, setSelectedTag] = useState<string>(initialParams.tag);
  const [sortOption, setSortOption] = useState<SearchSortOption>(initialParams.sort);
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce search query 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Load categories and all published books once for filter lists and real counts
  useEffect(() => {
    let mounted = true;
    Promise.all([getCategories(true), getPublishedBooks(300)]).then(([cats, books]) => {
      if (mounted) {
        setCategories(cats);
        setAllBooks(books);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Update selected category if prop changes
  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  // Update URL hash parameters on filter changes (friendly deep-linking)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedAuthor) params.set('author', selectedAuthor);
    if (selectedTag) params.set('tag', selectedTag);
    if (sortOption !== 'newest') params.set('sort', sortOption);

    const queryString = params.toString();
    const newHash = queryString ? `#search?${queryString}` : '#search';
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [debouncedQuery, selectedCategory, selectedAuthor, selectedTag, sortOption]);

  // Execute search
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    searchBooks({
      query: debouncedQuery,
      categoryId: selectedCategory,
      authorIdOrName: selectedAuthor,
      tag: selectedTag,
      sortOption,
    })
      .then((data) => {
        if (mounted) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedQuery, selectedCategory, selectedAuthor, selectedTag, sortOption]);

  // Calculate real published book counts per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of allBooks) {
      if (b.categoryId) {
        map[b.categoryId] = (map[b.categoryId] || 0) + 1;
      }
    }
    return map;
  }, [allBooks]);

  // Unique authors list for filter dropdown
  const authorOptions = useMemo(() => {
    const authorsMap = new Map<string, { id: string; name: string; count: number }>();
    for (const b of allBooks) {
      const name = b.authorName?.trim();
      if (!name) continue;
      const key = b.createdBy || name;
      const existing = authorsMap.get(key);
      if (!existing) {
        authorsMap.set(key, { id: key, name, count: 1 });
      } else {
        existing.count += 1;
      }
    }
    return Array.from(authorsMap.values()).sort((a, b) => b.count - a.count);
  }, [allBooks]);

  // Matched author for the author discovery hero card above results
  const matchedAuthor = useMemo(() => {
    if (!debouncedQuery.trim() && !selectedAuthor) return null;
    const target = normalizeSearchText(selectedAuthor || debouncedQuery);
    if (!target) return null;

    const found = authorOptions.find((a) => {
      const aNorm = normalizeSearchText(a.name);
      return aNorm === target || aNorm.includes(target) || a.id.toLowerCase() === target;
    });

    if (found && found.count > 0) {
      // Find author's avatar from a book cover if available
      const sampleBook = allBooks.find((b) => (b.createdBy || b.authorName) === found.id);
      return {
        ...found,
        sampleCover: sampleBook?.coverUrl,
      };
    }
    return null;
  }, [debouncedQuery, selectedAuthor, authorOptions, allBooks]);

  const handleClearAll = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedAuthor('');
    setSelectedTag('');
    setSortOption('newest');
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  const handleClearAllRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedAuthor ? 1 : 0) +
    (selectedTag ? 1 : 0) +
    (sortOption !== 'newest' ? 1 : 0);

  const quickSearchTags = ['কুরআন', 'হাদিস', 'তাফসির', 'উপন্যাস', 'কবিতা', 'ইতিহাস', 'আত্মউন্নয়ন', 'সীরাত'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
          বই অনুসন্ধান ও ক্যাটালগ
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          শিরোনাম, লেখক, বা বিষয় অনুযায়ী কিতাবখানার সমৃদ্ধ সংগ্রহ থেকে খুঁজে নিন
        </p>
      </div>

      {/* Large Search Input Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="কিতাব, লেখক, বিষয় বা ট্যাগ খুঁজুন..."
          className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/40 dark:focus:ring-amber-500/40 shadow-xs text-sm sm:text-base transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="মুছে ফেলুন"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recent Searches (max 8) */}
      {recentSearches.length > 0 && !query && (
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="flex items-center gap-1.5 font-medium">
              <History className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>সাম্প্রতিক অনুসন্ধান:</span>
            </span>
            <button
              onClick={handleClearAllRecent}
              className="text-stone-400 hover:text-red-500 text-[11px] transition-colors"
            >
              ইতিহাস মুছুন
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {recentSearches.map((term, idx) => (
              <span
                key={idx}
                onClick={() => handleSelectRecent(term)}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer transition-colors"
              >
                <span>{term}</span>
                <button
                  onClick={(e) => handleRemoveRecent(term, e)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  aria-label="মুছুন"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Search Tag Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-stone-400 flex items-center gap-1 shrink-0 font-medium">
          <Tag className="w-3.5 h-3.5" /> জনপ্রিয় বিষয়:
        </span>
        {quickSearchTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-850 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Active Filter Badges */}
      {(selectedCategory !== 'all' || selectedAuthor || selectedTag) && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-200">সক্রিয় ফিল্টার:</span>

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-amber-300 dark:border-amber-800 font-medium">
              <span>বিভাগ: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}</span>
              <button onClick={() => setSelectedCategory('all')} aria-label="রিমুভ">
                <X className="w-3 h-3 text-stone-400 hover:text-stone-700" />
              </button>
            </span>
          )}

          {selectedAuthor && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-amber-300 dark:border-amber-800 font-medium">
              <span>লেখক: {selectedAuthor}</span>
              <button onClick={() => setSelectedAuthor('')} aria-label="রিমুভ">
                <X className="w-3 h-3 text-stone-400 hover:text-stone-700" />
              </button>
            </span>
          )}

          {selectedTag && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-amber-300 dark:border-amber-800 font-medium">
              <span>ট্যাগ: #{selectedTag}</span>
              <button onClick={() => setSelectedTag('')} aria-label="রিমুভ">
                <X className="w-3 h-3 text-stone-400 hover:text-stone-700" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearAll}
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold ml-auto text-xs"
          >
            সব সাফ করুন
          </button>
        </div>
      )}

      {/* Filters Bar & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-stone-200 dark:border-stone-800">
        {/* Category Horizontal Filter Chips (Desktop & Mobile Carousel) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-1 min-w-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-700 dark:bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
            }`}
          >
            সব কিতাব ({toBengaliNumerals(allBooks.length)})
          </button>
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-700 dark:bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
                }`}
              >
                <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {toBengaliNumerals(count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Modal Toggle & Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              activeFiltersCount > 0
                ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>ফিল্টার</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-700 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Author Selector (Desktop) */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="hidden md:inline-block px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-700/40 max-w-[160px] truncate"
          >
            <option value="">সকল লেখক</option>
            {authorOptions.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name} ({toBengaliNumerals(a.count)})
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4 text-stone-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SearchSortOption)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-700/40"
            >
              <option value="newest">নতুন প্রকাশিত</option>
              <option value="popular">সর্বাধিক পঠিত ও জনপ্রিয়</option>
              <option value="favorites">সর্বাধিক পছন্দের</option>
              <option value="updated">সম্প্রতি আপডেট</option>
              <option value="title_asc">নাম অনুযায়ী (A-Z)</option>
              <option value="title_desc">নাম অনুযায়ী (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Author Match Hero Card (Step 16) */}
      {matchedAuthor && (
        <div
          onClick={() => onNavigate('author', matchedAuthor.id)}
          className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-amber-50 to-orange-50 dark:from-stone-900 dark:to-amber-950/30 border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-amber-600/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0">
              {getInitials(matchedAuthor.name)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-semibold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>লেখক পরিচিতি</span>
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {matchedAuthor.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                কিতাবখানায় {toBengaliNumerals(matchedAuthor.count)} টি প্রকাশিত কিতাব রয়েছে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
            <span className="hidden sm:inline">প্রোফাইল দেখুন</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      {/* Results Count & Quick Reset */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>
          {loading ? 'অনুসন্ধান করা হচ্ছে...' : `মোট ${toBengaliNumerals(results.length)} টি কিতাব পাওয়া গেছে`}
        </span>
        {(query || selectedCategory !== 'all' || selectedAuthor || selectedTag) && (
          <button
            onClick={handleClearAll}
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold"
          >
            সব ফিল্টার সাফ করুন
          </button>
        )}
      </div>

      {/* Book Results Grid */}
      <BookGrid
        books={results}
        loading={loading}
        onSelectBook={(id) => onNavigate('book', id)}
        onAuthRequired={() => onNavigate('login')}
        emptyTitle={query ? `"${query}" এর জন্য কোনো কিতাব মেলেনি` : 'এই ফিল্টারে কোনো কিতাব মেলেনি'}
        emptyMessage="বানান সঠিকভাবে লিখেছেন কি না যাচাই করুন, অথবা ফিল্টার পরিবর্তন করে অনুসন্ধান করুন।"
        emptyActionLabel="সব ফিল্টার রিসেট করুন"
        onEmptyAction={handleClearAll}
      />

      {/* Mobile Filter Modal / Bottom Sheet */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 font-bold text-base text-stone-900 dark:text-stone-100">
                <Filter className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>অনুসন্ধান ফিল্টার</span>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                বিষয় ও ক্যাটাগরি
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none"
              >
                <option value="all">সব কিতাব ({toBengaliNumerals(allBooks.length)})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({toBengaliNumerals(categoryCounts[c.id] || 0)})
                  </option>
                ))}
              </select>
            </div>

            {/* Author selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                লেখক
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none"
              >
                <option value="">সকল লেখক</option>
                {authorOptions.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({toBengaliNumerals(a.count)})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                সাজানোর ক্রম
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SearchSortOption)}
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none"
              >
                <option value="newest">নতুন প্রকাশিত</option>
                <option value="popular">সর্বাধিক পঠিত ও জনপ্রিয়</option>
                <option value="favorites">সর্বাধিক পছন্দের</option>
                <option value="updated">সম্প্রতি আপডেট</option>
                <option value="title_asc">নাম অনুযায়ী (A-Z)</option>
                <option value="title_desc">নাম অনুযায়ী (Z-A)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100"
              >
                রিসেট করুন
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md"
              >
                ফলাফল দেখুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
