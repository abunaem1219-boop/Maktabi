import React, { useState, useEffect } from 'react';
import { Book } from '../types/book';
import { getPublicAuthorDetails, PublicAuthorProfile } from '../services/authorService';
import { BookGrid } from '../components/book/BookGrid';
import { formatBengaliDate, toBengaliNumerals, getInitials } from '../utils/formatters';
import {
  User as UserIcon,
  BookOpen,
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpDown,
  Share2,
  CheckCircle2,
  Eye,
  Loader2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface AuthorProfileProps {
  authorIdOrName: string;
  onNavigate: (view: string, param?: string) => void;
}

export const AuthorProfile: React.FC<AuthorProfileProps> = ({ authorIdOrName, onNavigate }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<PublicAuthorProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<'newest' | 'popular' | 'title_asc'>('newest');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await getPublicAuthorDetails(authorIdOrName);
        if (mounted) {
          setProfile(res.profile);
          setBooks(res.books);
        }
      } catch (err) {
        console.error('Failed to load author profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [authorIdOrName]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: `${profile.name} — কিতাবখানা লেখক প্রোফাইল`,
          text: `কিতাবখানায় ${profile.name}-এর প্রকাশিত কিতাবসমূহ পড়ুন।`,
          url,
        });
        return;
      } catch {
        // Fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('লেখক প্রোফাইলের লিংক কপি করা হয়েছে!', 'success');
    } catch {
      showToast('লিংক কপি করা সম্ভব হয়নি।', 'error');
    }
  };

  // Sort author's books
  const sortedBooks = [...books].sort((a, b) => {
    if (sortOption === 'popular') {
      const scoreA = (Number(a.readCount) || 0) * 1 + (Number(a.favoriteCount) || 0) * 3;
      const scoreB = (Number(b.readCount) || 0) * 1 + (Number(b.favoriteCount) || 0) * 3;
      return scoreB - scoreA || (b.publishedAt || 0) - (a.publishedAt || 0);
    }
    if (sortOption === 'title_asc') {
      return a.title.localeCompare(b.title, 'bn');
    }
    // newest default
    return (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt);
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700 dark:text-amber-500" />
        <p className="text-xs text-stone-400">লেখক প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          লেখক খুঁজে পাওয়া যায়নি
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          এই লেখকের কোনো প্রকাশিত কিতাব বর্তমানে প্ল্যাটফর্মে উপলব্ধ নেই।
        </p>
        <button
          onClick={() => onNavigate('search')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>অন্যান্য কিতাব খুঁজুন</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>পূর্ববর্তী পেজে ফিরে যান</span>
      </button>

      {/* Author Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-amber-700/10 dark:ring-amber-500/20 shadow-lg shadow-amber-950/10"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-linear-to-tr from-amber-800 to-amber-600 text-white text-3xl font-extrabold flex items-center justify-center shadow-lg shadow-amber-950/20">
                {getInitials(profile.name)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-stone-900">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>প্রকাশিত লেখক (Verified Author)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                {profile.name}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              {profile.bio}
            </p>

            {/* Author Stats Row */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>
                  প্রকাশিত কিতাব:{' '}
                  <strong className="text-stone-900 dark:text-stone-100 font-bold">
                    {toBengaliNumerals(profile.publishedBookCount)}
                  </strong>{' '}
                  টি
                </span>
              </span>

              {profile.totalReads > 0 && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    মোট পাঠ:{' '}
                    <strong className="text-stone-900 dark:text-stone-100 font-bold">
                      {toBengaliNumerals(profile.totalReads)}
                    </strong>{' '}
                    বার
                  </span>
                </span>
              )}

              {profile.joinedDate && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>যুক্ত হয়েছেন: {formatBengaliDate(profile.joinedDate)}</span>
                </span>
              )}
            </div>

            {/* Categories */}
            {profile.categories.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="text-[11px] text-stone-400 font-medium">বিভাগ:</span>
                {profile.categories.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate('search', c)}
                    className="px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-200 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share CTA */}
          <div className="shrink-0 self-center sm:self-start">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
              title="লেখক প্রোফাইল শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
              <span>শেয়ার</span>
            </button>
          </div>
        </div>
      </div>

      {/* Author's Books Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              এই লেখকের প্রকাশিত কিতাবসমূহ
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
              {toBengaliNumerals(books.length)}
            </span>
          </div>

          {/* Sort Controls */}
          {books.length > 1 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown className="w-4 h-4 text-stone-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-700/40"
              >
                <option value="newest">নতুন কিতাব আগে</option>
                <option value="popular">জনপ্রিয় কিতাব আগে</option>
                <option value="title_asc">নাম অনুযায়ী (A-Z)</option>
              </select>
            </div>
          )}
        </div>

        {/* Books Grid */}
        <BookGrid
          books={sortedBooks}
          onSelectBook={(id) => onNavigate('book', id)}
          onAuthRequired={() => onNavigate('login')}
          emptyTitle="কোনো প্রকাশিত কিতাব পাওয়া যায়নি"
          emptyMessage="এই লেখকের কিতাব শীঘ্রই প্রকাশিত হবে।"
        />
      </section>
    </div>
  );
};
