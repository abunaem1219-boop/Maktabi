import React, { useEffect, useState } from 'react';
import { Book, Category, ReadingProgress } from '../types/book';
import { getFeaturedBooks, getLatestBooks, getPublishedBooks } from '../services/bookService';
import { getCategories, seedDefaultCategories } from '../services/categoryService';
import { getRecentReadingHistory } from '../services/readingProgressService';
import { getPopularBooks, getPublicAuthorsSummary, AuthorDiscoverySummary } from '../services/discoveryService';
import { useAuth } from '../context/AuthContext';
import { BookCard } from '../components/book/BookCard';
import { BookCardSkeleton, CategoryChipSkeleton } from '../components/book/BookCardSkeleton';
import { CategoryIcon } from '../components/book/CategoryIcon';
import { toBengaliNumerals, getInitials } from '../utils/formatters';
import { getOptimizedImageUrl } from '../services/cloudinaryService';
import {
  BookOpen,
  Feather,
  Sparkles,
  Compass,
  Clock,
  BookMarked,
  ArrowRight,
  TrendingUp,
  Play,
  Flame,
  Users,
  ChevronRight,
} from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [latestBooks, setLatestBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [popularAuthors, setPopularAuthors] = useState<AuthorDiscoverySummary[]>([]);
  const [recentProgress, setRecentProgress] = useState<ReadingProgress[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        // 1. Load or seed categories
        let cats = await getCategories(true);
        if (cats.length === 0) {
          await seedDefaultCategories();
          cats = await getCategories(true);
        }

        // 2. Parallel fetch for all discovery sections
        const [featured, latest, popular, authors, history, allPublished] = await Promise.all([
          getFeaturedBooks(6),
          getLatestBooks(8),
          getPopularBooks(6),
          getPublicAuthorsSummary(6),
          getRecentReadingHistory(user ? user.uid : null, 4),
          getPublishedBooks(300),
        ]);

        if (mounted) {
          setCategories(cats);
          setFeaturedBooks(featured);
          setLatestBooks(latest);
          setPopularBooks(popular);
          setPopularAuthors(authors);
          setRecentProgress(history);

          // Calculate real book count per category
          const counts: Record<string, number> = {};
          for (const b of allPublished) {
            if (b.categoryId) {
              counts[b.categoryId] = (counts[b.categoryId] || 0) + 1;
            }
          }
          setCategoryCounts(counts);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-900 via-amber-800 to-stone-900 text-white p-6 sm:p-10 shadow-2xl shadow-amber-950/20">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ডিজিটাল লাইব্রেরি ও সাহিত্য আঙিনা</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            আপনার ডিজিটাল লাইব্রেরি
          </h1>

          <p className="text-base sm:text-lg text-amber-100/90 leading-relaxed font-normal">
            পড়ুন, লিখুন এবং নিজের বই প্রকাশ করুন। অফলাইনে বই লিখুন এবং যেকোনো ডিভাইস থেকে নির্বিঘ্নে অ্যাক্সেস করুন।
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('search')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all shadow-lg shadow-amber-950/30 active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>বই খুঁজুন</span>
            </button>

            <button
              onClick={() => onNavigate('writer')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all backdrop-blur-xs active:scale-95"
            >
              <Feather className="w-4 h-4" />
              <span>লেখা শুরু করুন</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 -bottom-10 opacity-15 pointer-events-none transform translate-x-12 translate-y-12">
          <BookOpen className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Continue Reading Section (Real User Progress) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              পড়া চালিয়ে যান (Continue Reading)
            </h2>
          </div>
          {recentProgress.length > 0 && (
            <button
              onClick={() => onNavigate('library')}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>ইতিহাস দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentProgress.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProgress.map((item) => (
              <div
                key={item.bookId}
                onClick={() => onNavigate('reader', item.bookId)}
                className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-14 h-20 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                  {item.coverUrl ? (
                    <img
                      src={getOptimizedImageUrl(item.coverUrl, { width: 100, height: 140 })}
                      alt={item.bookTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {item.bookTitle || 'বই'}
                  </h4>
                  <p className="text-xs text-stone-500 truncate">
                    {item.chapterTitle || 'অধ্যায়'}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>অগ্রগতি</span>
                      <span className="font-bold">{toBengaliNumerals(item.progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Play className="w-4 h-4 fill-current" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <BookMarked className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
              আপনি এখনো কোনো বই পড়া শুরু করেননি।
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <span>বই খুঁজুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Categories Horizontal Discovery Carousel with Real Counts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              বিষয় ও ক্যাটাগরি (Browse Categories)
            </h2>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <CategoryChipSkeleton key={i} />)
          ) : (
            categories.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigate('search', cat.id)}
                  className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all group"
                >
                  <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-stone-800 text-amber-800 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 block whitespace-nowrap">
                      {cat.name}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] text-stone-400 block">
                        {toBengaliNumerals(count)} টি কিতাব
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Popular Authors Discovery Section (Step 16, 17) */}
      {popularAuthors.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                জনপ্রিয় লেখকবৃন্দ (Featured Authors)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>সকল লেখক</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {popularAuthors.map((author) => (
              <div
                key={author.id}
                onClick={() => onNavigate('author', author.id)}
                className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/50 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2.5"
              >
                <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-amber-800 to-amber-600 text-white font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  {getInitials(author.name)}
                </div>

                <div className="w-full">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {author.name}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {toBengaliNumerals(author.bookCount)} টি কিতাব
                  </p>
                </div>

                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  <span>প্রোফাইল</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Books Section */}
      {featuredBooks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                নির্বাচিত বইসমূহ (Featured Books)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>আরও দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
            {featuredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(id) => onNavigate('book', id)}
                onAuthRequired={() => onNavigate('login')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Most Popular Books (Step 10) */}
      {popularBooks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                সর্বাধিক পঠিত ও জনপ্রিয় বই (Popular Books)
              </h2>
            </div>
            <button
              onClick={() => {
                window.location.hash = '#search?sort=popular';
                onNavigate('search');
              }}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
            {popularBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(id) => onNavigate('book', id)}
                onAuthRequired={() => onNavigate('login')}
              />
            ))}
          </div>
        </section>
      )}

      {/* New Releases Section (Step 11) */}
      {latestBooks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                নতুন প্রকাশনা (New Releases)
              </h2>
            </div>
            <button
              onClick={() => {
                window.location.hash = '#search?sort=newest';
                onNavigate('search');
              }}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
            {latestBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(id) => onNavigate('book', id)}
                onAuthRequired={() => onNavigate('login')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Writing Promotional Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-amber-100/80 via-amber-50 to-orange-100/70 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/30 border border-amber-200/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <Feather className="w-3.5 h-3.5" />
            <span>অফলাইন লেখক স্টুডিও</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            আপনার নিজের বই লিখুন
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            ইন্টারনেট না থাকলেও নিশ্চিন্তে লিখুন। স্বয়ংক্রিয়ভাবে লোকাল ড্রাইভে সেভ হবে এবং অনলাইনে আসলে সিঙ্ক ও প্রকাশনা রিভিউয়ে পাঠানো যাবে।
          </p>
        </div>

        <button
          onClick={() => onNavigate('writer')}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-900/20 transition-all active:scale-95"
        >
          <Feather className="w-4 h-4" />
          <span>লেখা শুরু করুন</span>
        </button>
      </section>
    </div>
  );
};
