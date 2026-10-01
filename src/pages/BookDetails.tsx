import React, { useEffect, useState } from 'react';
import { Book, ReadingProgress } from '../types/book';
import { getBookById, getPublishedBooks } from '../services/bookService';
import { isFavorite, addFavorite, removeFavorite } from '../services/favoriteService';
import { getReadingProgress } from '../services/readingProgressService';
import { calculateRelatedBooks } from '../services/discoveryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBengaliDate, toBengaliNumerals } from '../utils/formatters';
import { BookGrid } from '../components/book/BookGrid';
import { getOptimizedImageUrl } from '../services/cloudinaryService';
import {
  BookOpen,
  Heart,
  Share2,
  ArrowLeft,
  User,
  Building,
  Calendar,
  Globe,
  Tag,
  ShieldAlert,
  Loader2,
  Layers,
  Sparkles,
  BookCheck,
} from 'lucide-react';

interface BookDetailsProps {
  bookId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const BookDetails: React.FC<BookDetailsProps> = ({ bookId, onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadBookData() {
      setLoading(true);
      try {
        const found = await getBookById(bookId, isAdmin);
        if (mounted) {
          setBook(found);
          if (found) {
            // 1. Fetch reading progress
            getReadingProgress(user ? user.uid : null, found.id).then((prog) => {
              if (mounted) setReadingProgress(prog);
            });

            // 2. Fetch all published books to calculate deterministic related books
            getPublishedBooks(200).then((allPublished) => {
              if (mounted) {
                const calculated = calculateRelatedBooks(found, allPublished, 6);
                setRelatedBooks(calculated);
              }
            });

            // 3. Check favorite status if logged in
            if (user) {
              isFavorite(user.uid, found.id).then((isFav) => {
                if (mounted) setFavorited(isFav);
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load book:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBookData();
    return () => {
      mounted = false;
    };
  }, [bookId, isAdmin, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      showToast('পছন্দের তালিকায় রাখতে প্রথমে লগইন করুন।', 'warning');
      onNavigate('login');
      return;
    }
    if (!book || favLoading) return;

    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite(user.uid, book.id);
        setFavorited(false);
        showToast(`"${book.title}" পছন্দের তালিকা থেকে সরানো হয়েছে।`, 'info');
      } else {
        await addFavorite(user.uid, book.id);
        setFavorited(true);
        showToast(`"${book.title}" পছন্দের তালিকায় যোগ করা হয়েছে!`, 'success');
      }
    } catch {
      showToast('পছন্দ হালনাগাদ করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    if (!book) return;

    const shareUrl = `${window.location.origin}/#book/${book.id}`;
    const shareData = {
      title: `${book.title} — কিতাবখানা`,
      text: `${book.title} (লেখক: ${book.authorName}) - কিতাবখানায় অনলাইনে পড়ুন।`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard if user cancels or share fails
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('বইয়ের লিংক কপি হয়েছে!', 'success');
    } catch {
      showToast('লিংক কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700 dark:text-amber-500" />
        <p className="text-xs text-stone-400">বইয়ের বিস্তারিত তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          বইটি খুঁজে পাওয়া যায়নি
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          এই বইটি মুছে ফেলা হয়েছে অথবা বর্তমানে জনসাধারণের জন্য প্রকাশিত নয়।
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লাইব্রেরিতে ফিরে যান</span>
        </button>
      </div>
    );
  }

  const isUnpublished = book.status !== 'published' || book.visibility !== 'public';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Navigation Back */}
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>পূর্ববর্তী পেজে ফিরে যান</span>
      </button>

      {/* Admin Preview Notice */}
      {isUnpublished && (
        <div className="p-4 rounded-2xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700" />
          <span>
            [অ্যাডমিন প্রিভিউ] এই বইটি বর্তমানে অপ্রকাশিত (স্ট্যাটাস: {book.status}, দৃশ্যমানতা: {book.visibility})। সাধারণ পাঠকরা এটি দেখতে পাবেন না।
          </span>
        </div>
      )}

      {/* Book Presentation Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Cover Column */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-56 sm:w-64 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-amber-950/15 border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-850 relative">
            {book.coverUrl && !imageError ? (
              <img
                src={getOptimizedImageUrl(book.coverUrl, { width: 500, height: 750 })}
                alt={book.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-linear-to-b from-amber-100/60 to-stone-200 dark:from-stone-850 dark:to-stone-900">
                <BookOpen className="w-12 h-12 text-amber-700/60 dark:text-amber-500/50 mb-3" />
                <span className="text-sm font-bold text-stone-800 dark:text-stone-100">
                  {book.title}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {book.authorName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details Column */}
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {book.categoryName && (
                <button
                  onClick={() => onNavigate('search', book.categoryId)}
                  className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/60 transition-colors"
                  title="এই ক্যাটাগরির কিতাবসমূহ খুঁজুন"
                >
                  {book.categoryName}
                </button>
              )}
              {book.featured && (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-stone-950" />
                  <span>নির্বাচিত বই</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight">
              {book.title}
            </h1>

            {/* Clickable Author Link */}
            <p className="text-base text-stone-600 dark:text-stone-400 flex items-center gap-2 font-medium">
              <User className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>লেখক:</span>
              <button
                onClick={() => onNavigate('author', book.createdBy || book.authorId || book.authorName)}
                className="text-stone-900 dark:text-stone-100 font-bold hover:text-amber-700 dark:hover:text-amber-400 hover:underline transition-colors"
                title="লেখকের পাবলিক প্রোফাইল ও সকল বই দেখুন"
              >
                {book.authorName}
              </button>
            </p>
          </div>

          {/* Action CTAs with intelligent reading state */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (!book.chapterCount || book.chapterCount === 0) {
                  showToast('এই বইয়ের বিষয়বস্তু এখনো যোগ করা হয়নি।', 'warning');
                  return;
                }
                onNavigate('reader', book.id);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-900/20 active:scale-95 transition-all"
            >
              {readingProgress && readingProgress.progress > 0 ? (
                <>
                  <BookCheck className="w-5 h-5 text-amber-300" />
                  <span>
                    যেখান থেকে শেষ করেছিলেন সেখান থেকে পড়ুন ({toBengaliNumerals(readingProgress.progress)}%)
                  </span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  <span>পড়া শুরু করুন</span>
                </>
              )}
            </button>

            <button
              onClick={handleFavoriteToggle}
              disabled={favLoading}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border transition-all ${
                favorited
                  ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                  : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
              title={favorited ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দের তালিকায় যোগ করুন'}
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-current text-rose-600' : ''}`} />
              <span className="text-xs font-semibold hidden sm:inline">
                {favorited ? 'পছন্দের তালিকায় আছে' : 'পছন্দ করুন'}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-all"
              title="শেয়ার করুন"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs font-semibold hidden sm:inline">শেয়ার</span>
            </button>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            {book.publisher && (
              <div className="space-y-0.5">
                <span className="text-stone-400 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> প্রকাশক
                </span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate">
                  {book.publisher}
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              <span className="text-stone-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> ভাষা
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block uppercase">
                {book.language === 'bn' ? 'বাংলা' : book.language}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-stone-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> প্রকাশকাল
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                {formatBengaliDate(book.publishedAt || book.createdAt)}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-stone-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> মোট অধ্যায়
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                {toBengaliNumerals(book.chapterCount || 1)} টি অধ্যায়
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              বই সম্পর্কে
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line font-normal">
              {book.description}
            </p>
          </div>

          {/* Clickable Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> ট্যাগসমূহ (ক্লিক করে বই খুঁজুন)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {book.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      window.location.hash = `#search?tag=${encodeURIComponent(tag)}`;
                      onNavigate('search');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-stone-600 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-300 text-xs font-medium transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deterministic Multi-Signal Related Books */}
      {relatedBooks.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
              সম্পর্কিত অন্যান্য কিতাব (Related Books)
            </h3>
          </div>
          <BookGrid
            books={relatedBooks}
            onSelectBook={(id) => onNavigate('book', id)}
            onAuthRequired={() => onNavigate('login')}
          />
        </section>
      )}
    </div>
  );
};
