import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, BookChapter, ReadingProgress } from '../types/book';
import { getBookById, incrementBookReadCount, getPublishedBooks } from '../services/bookService';
import { getChapters } from '../services/chapterService';
import { getLocalBook, getChaptersByBookId } from '../services/indexedDbService';
import { calculateRelatedBooks } from '../services/discoveryService';
import {
  saveReadingProgress,
  getReadingProgress,
} from '../services/readingProgressService';
import {
  addBookmark,
  removeBookmark,
  findBookmarkForChapter,
} from '../services/bookmarkService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sanitizeHtml } from '../utils/sanitize';
import { toBengaliNumerals } from '../utils/formatters';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Bookmark as BookmarkIcon,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  List,
  Sun,
  Moon,
  Coffee,
  Check,
  Share2,
  Layers,
  Loader2,
  AlignLeft,
  AlignJustify,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface BookReaderProps {
  bookId: string;
  onNavigate: (view: string, param?: string) => void;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type LineHeight = 'compact' | 'normal' | 'relaxed';
export type FontFamily = 'hind' | 'serif' | 'sans';
export type TextAlign = 'left' | 'justify';

interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  lineHeight: LineHeight;
  fontFamily: FontFamily;
  textAlign: TextAlign;
}

const SETTINGS_STORAGE_KEY = 'kitabkhana_reader_settings';

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'sepia',
  fontSize: 'md',
  lineHeight: 'normal',
  fontFamily: 'serif',
  textAlign: 'justify',
};

export const BookReader: React.FC<BookReaderProps> = ({ bookId, onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);

  // UI Control toggles
  const [controlsVisible, setControlsVisible] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recommendations, setRecommendations] = useState<Book[]>([]);

  // Bookmark status for active chapter
  const [currentBookmarkId, setCurrentBookmarkId] = useState<string | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Touch swipe gesture tracking
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Reading container ref
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const progressDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Reader Settings
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Failed to read reader settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save reader settings:', e);
      }
      return updated;
    });
  };

  // Load Book and Chapters
  useEffect(() => {
    let mounted = true;

    async function loadReader() {
      setLoading(true);
      try {
        const cleanId = bookId.split('?')[0];
        const isLocalPreview =
          window.location.hash.includes('preview=local') || cleanId.startsWith('book_local_');

        let bookData: Book | null = null;
        let chapterList: BookChapter[] = [];

        if (isLocalPreview) {
          const localB = await getLocalBook(cleanId);
          if (localB) {
            bookData = {
              id: localB.id,
              title: localB.title,
              authorName: localB.authorName,
              publisher: localB.publisherName,
              description: localB.description || '',
              coverUrl: localB.coverUrl,
              categoryId: localB.categoryId || 'other',
              language: 'bn',
              tags: localB.tags || [],
              status: localB.status as any,
              visibility: 'private',
              featured: false,
              chapterCount: 0,
              createdAt: localB.createdAt,
              updatedAt: localB.updatedAt,
              createdBy: localB.ownerUid,
            };
            const localChs = await getChaptersByBookId(cleanId);
            chapterList = localChs.map((c) => ({
              id: c.id,
              bookId: c.bookId,
              title: c.title,
              order: c.order,
              content: c.content,
              wordCount: c.wordCount,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            }));
            bookData.chapterCount = chapterList.length;
          }
        }

        if (!bookData) {
          const [remoteBook, remoteChs] = await Promise.all([
            getBookById(cleanId, isAdmin),
            getChapters(cleanId, isAdmin),
          ]);
          bookData = remoteBook;
          chapterList = remoteChs;
        }

        if (cleanId && !isLocalPreview) {
          incrementBookReadCount(cleanId);
        }

        if (mounted) {
          setBook(bookData);
          setChapters(chapterList);

          if (bookData) {
            getPublishedBooks(50).then((all) => {
              if (mounted) {
                const rel = calculateRelatedBooks(bookData as Book, all, 3);
                setRecommendations(rel);
              }
            });
          }

          if (chapterList.length > 0) {
            // Restore saved progress if available
            const savedProgress = await getReadingProgress(user ? user.uid : null, bookId);
            if (savedProgress && savedProgress.chapterId) {
              const matchedIdx = chapterList.findIndex((c) => c.id === savedProgress.chapterId);
              if (matchedIdx !== -1) {
                setActiveChapterIndex(matchedIdx);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load book for reader:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReader();
    return () => {
      mounted = false;
    };
  }, [bookId, isAdmin, user]);

  // Check bookmark for current active chapter
  const checkBookmark = useCallback(async () => {
    if (!user || chapters.length === 0) {
      setCurrentBookmarkId(null);
      return;
    }
    const currentChapter = chapters[activeChapterIndex];
    if (!currentChapter) return;

    try {
      const found = await findBookmarkForChapter(user.uid, bookId, currentChapter.id);
      setCurrentBookmarkId(found ? found.id : null);
    } catch {
      setCurrentBookmarkId(null);
    }
  }, [user, bookId, chapters, activeChapterIndex]);

  useEffect(() => {
    checkBookmark();
  }, [checkBookmark]);

  // Save Progress (Debounced)
  const reportProgress = useCallback(
    (chapterIdx: number) => {
      if (chapters.length === 0 || !book) return;
      const ch = chapters[chapterIdx];
      if (!ch) return;

      if (progressDebounceTimer.current) {
        clearTimeout(progressDebounceTimer.current);
      }

      progressDebounceTimer.current = setTimeout(() => {
        const progressPercentage = Math.round(((chapterIdx + 1) / chapters.length) * 100);
        const progressRecord: ReadingProgress = {
          bookId,
          bookTitle: book.title,
          coverUrl: book.coverUrl,
          chapterId: ch.id,
          chapterTitle: ch.title,
          progress: progressPercentage,
          updatedAt: Date.now(),
        };

        saveReadingProgress(user ? user.uid : null, progressRecord);
      }, 800);
    },
    [chapters, book, bookId, user]
  );

  // Navigate Chapters
  const goToChapter = (index: number) => {
    if (index < 0 || index >= chapters.length) return;
    setChapterLoading(true);
    setActiveChapterIndex(index);
    setTocOpen(false);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    reportProgress(index);
    setTimeout(() => {
      setChapterLoading(false);
    }, 150);
  };

  // Bookmark Toggle Handler
  const handleToggleBookmark = async () => {
    if (!user) {
      showToast('বুকমার্ক সংরক্ষণ করতে প্রথমে লগইন করুন।', 'warning');
      onNavigate('login');
      return;
    }

    const currentChapter = chapters[activeChapterIndex];
    if (!currentChapter || !book || bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      if (currentBookmarkId) {
        await removeBookmark(user.uid, currentBookmarkId);
        setCurrentBookmarkId(null);
        showToast('বুকমার্ক সরানো হয়েছে।', 'info');
      } else {
        const newBm = await addBookmark(user.uid, {
          bookId: book.id,
          bookTitle: book.title,
          coverUrl: book.coverUrl,
          chapterId: currentChapter.id,
          chapterTitle: currentChapter.title,
          position: activeChapterIndex + 1,
        });
        setCurrentBookmarkId(newBm.id);
        showToast(`"${currentChapter.title}" বুকমার্কে সংরক্ষিত হয়েছে!`, 'success');
      }
    } catch {
      showToast('বুকমার্ক হালনাগাদ করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Touch Swipe Handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is prominent and greater than vertical scroll
    if (Math.abs(deltaX) > 75 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && activeChapterIndex < chapters.length - 1) {
        // Swiped Left -> Next Chapter
        goToChapter(activeChapterIndex + 1);
        showToast('পরবর্তী অধ্যায়ে গেছেন', 'info', 1500);
      } else if (deltaX > 0 && activeChapterIndex > 0) {
        // Swiped Right -> Previous Chapter
        goToChapter(activeChapterIndex - 1);
        showToast('পূর্ববর্তী অধ্যায়ে গেছেন', 'info', 1500);
      }
    }
  };

  // Share Handler
  const handleShare = async () => {
    if (!book) return;
    const shareUrl = `${window.location.origin}/#book/${book.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title} — কিতাবখানায় অনলাইনে পড়ুন।`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('বইয়ের লিংক কপি হয়েছে!', 'success');
    });
  };

  // Theme Styling Classes
  const themeClasses = {
    light: 'bg-white text-stone-900',
    sepia: 'bg-[#fbf0d9] text-[#5f4b32]',
    dark: 'bg-[#121212] text-stone-200',
  }[settings.theme];

  const headerThemeClasses = {
    light: 'bg-white/90 border-stone-200 text-stone-800',
    sepia: 'bg-[#f5e7c8]/95 border-[#ebd9b2] text-[#4f3e29]',
    dark: 'bg-[#18181a]/95 border-stone-800 text-stone-200',
  }[settings.theme];

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-loose',
    xl: 'text-xl sm:text-2xl leading-loose',
  }[settings.fontSize];

  const fontFamilyStyle = {
    hind: "'Hind Siliguri', sans-serif",
    serif: "'Noto Serif Bengali', serif",
    sans: "'Noto Sans Bengali', sans-serif",
  }[settings.fontFamily];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
        <Loader2 className="w-10 h-10 animate-spin text-amber-700 dark:text-amber-500 mb-3" />
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
          বইয়ের পান্ডুলিপি লোড করা হচ্ছে...
        </p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-stone-50 dark:bg-stone-950">
        <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          বইটি খুঁজে পাওয়া যায়নি
        </h2>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-bold"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-stone-50 dark:bg-stone-950">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          এই বইয়ের বিষয়বস্তু এখনো যোগ করা হয়নি
        </h2>
        <p className="text-xs text-stone-500 max-w-sm">
          লেখক বা প্রকাশক এখনো বইটির কোনো অধ্যায় প্রকাশ করেননি। শীঘ্রই অধ্যায় যুক্ত করা হবে।
        </p>
        <button
          onClick={() => onNavigate('book', book.id)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>বইয়ের তথ্যে ফিরে যান</span>
        </button>
      </div>
    );
  }

  const currentChapter = chapters[activeChapterIndex];

  return (
    <div
      ref={readerContainerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`min-h-screen transition-colors duration-300 relative flex flex-col ${themeClasses}`}
      style={{ fontFamily: fontFamilyStyle }}
    >
      {/* Sticky Reader Header Toolbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b px-3 sm:px-6 py-2.5 flex items-center justify-between transition-transform duration-300 ${headerThemeClasses} ${
          controlsVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => onNavigate('book', book.id)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            title="বইয়ের পৃষ্ঠায় ফিরুন"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold truncate">
              {book.title}
            </h2>
            <p className="text-[10px] sm:text-xs opacity-75 truncate">
              {currentChapter ? currentChapter.title : ''} • (
              {toBengaliNumerals(activeChapterIndex + 1)} /{' '}
              {toBengaliNumerals(chapters.length)})
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* TOC Trigger */}
          <button
            onClick={() => setTocOpen(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="সূচিপত্র (Table of Contents)"
          >
            <List className="w-5 h-5" />
          </button>

          {/* Bookmark Toggle */}
          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`p-2 rounded-xl transition-colors ${
              currentBookmarkId
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={currentBookmarkId ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}
          >
            <BookmarkIcon
              className={`w-5 h-5 ${currentBookmarkId ? 'fill-current' : ''}`}
            />
          </button>

          {/* Typography Settings Trigger */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="রিডার সেটিংস"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'ফুলস্ক্রিন থেকে বের হন' : 'ফুলস্ক্রিন মোড'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="hidden sm:flex p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="শেয়ার"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Reading Surface */}
      <main
        onClick={() => setControlsVisible(!controlsVisible)}
        className="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 md:px-12 pt-20 pb-28 cursor-pointer select-text"
      >
        {chapterLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin opacity-50" />
            <span className="text-xs opacity-75">অধ্যায় লোড হচ্ছে...</span>
          </div>
        ) : (
          <article className="space-y-6 animate-fade-in">
            {/* Chapter Heading */}
            <div className="border-b border-current/15 pb-4 space-y-1">
              <span className="text-xs uppercase tracking-widest font-semibold opacity-60">
                অধ্যায় {toBengaliNumerals(activeChapterIndex + 1)}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                {currentChapter.title}
              </h1>
            </div>

            {/* Sanitized Chapter Body */}
            <div
              className={`space-y-4 tracking-normal ${fontSizeClass} ${
                settings.textAlign === 'justify' ? 'text-justify' : 'text-left'
              }`}
              style={{
                lineHeight:
                  settings.lineHeight === 'compact'
                    ? '1.6'
                    : settings.lineHeight === 'normal'
                    ? '1.9'
                    : '2.3',
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(currentChapter.content),
              }}
            />

            {/* End of Chapter Navigation Buttons */}
            <div className="pt-12 border-t border-current/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToChapter(activeChapterIndex - 1);
                }}
                disabled={activeChapterIndex === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-current/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs sm:text-sm font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>পূর্ববর্তী অধ্যায়</span>
              </button>

              <span className="text-xs opacity-60 font-semibold">
                অধ্যায় {toBengaliNumerals(activeChapterIndex + 1)} /{' '}
                {toBengaliNumerals(chapters.length)}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToChapter(activeChapterIndex + 1);
                }}
                disabled={activeChapterIndex === chapters.length - 1}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-current/20 hover:bg-black/5 dark:hover:bg-white/10 text-xs sm:text-sm font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>পরবর্তী অধ্যায়</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Step 15: Book Completion & Discovery Section */}
            {activeChapterIndex === chapters.length - 1 && (
              <div className="mt-14 p-6 sm:p-8 rounded-3xl border border-current/15 bg-black/5 dark:bg-white/5 space-y-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">এই কিতাবটি পড়া শেষ! 🎉</h3>
                  <p className="text-xs sm:text-sm opacity-75 max-w-md mx-auto">
                    মাশাআল্লাহ! আপনি কিতাবটির সবকটি অধ্যায় সফলভাবে সমাপ্ত করেছেন।
                  </p>
                </div>

                {recommendations.length > 0 && (
                  <div className="space-y-4 pt-4 text-left border-t border-current/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>আরও পড়ুন (সম্পর্কিত কিতাবসমূহ):</span>
                      </h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('search');
                        }}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold"
                      >
                        লাইব্রেরিতে খুঁজুন →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {recommendations.map((rb) => (
                        <div
                          key={rb.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('book', rb.id);
                          }}
                          className="group cursor-pointer p-3 rounded-2xl border border-current/15 hover:border-amber-600/50 bg-white/40 dark:bg-black/20 transition-all flex items-center gap-3"
                        >
                          {rb.coverUrl ? (
                            <img
                              src={rb.coverUrl}
                              alt={rb.title}
                              className="w-12 h-16 object-cover rounded-xl shrink-0 border border-current/10"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded-xl bg-amber-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-amber-700">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold truncate group-hover:text-amber-600 transition-colors">
                              {rb.title}
                            </h5>
                            <p className="text-[11px] opacity-75 truncate">{rb.authorName}</p>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-1">
                              পড়া শুরু করুন →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        )}
      </main>

      {/* Persistent Bottom Reading Progress Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t px-4 py-2 flex items-center justify-between text-[11px] transition-transform duration-300 ${headerThemeClasses} ${
          controlsVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <span className="truncate max-w-[200px] sm:max-w-sm font-medium">
          {currentChapter ? currentChapter.title : ''}
        </span>

        <div className="flex items-center gap-3">
          <div className="w-24 sm:w-36 h-1.5 rounded-full bg-current/15 overflow-hidden">
            <div
              className="h-full bg-amber-600 dark:bg-amber-400 transition-all duration-300"
              style={{
                width: `${Math.round(
                  ((activeChapterIndex + 1) / chapters.length) * 100
                )}%`,
              }}
            />
          </div>
          <span className="font-bold font-mono">
            {toBengaliNumerals(
              Math.round(((activeChapterIndex + 1) / chapters.length) * 100)
            )}
            %
          </span>
        </div>
      </footer>

      {/* Table of Contents Drawer (TOC) */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setTocOpen(false)}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs animate-fade-in"
          />

          <div
            className={`relative z-10 w-full max-w-sm h-full shadow-2xl flex flex-col animate-slide-right ${headerThemeClasses}`}
          >
            <div className="p-4 border-b border-current/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm sm:text-base">সূচিপত্র (TOC)</h3>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-current/10">
              {chapters.map((ch, idx) => {
                const isActive = idx === activeChapterIndex;
                return (
                  <button
                    key={ch.id}
                    onClick={() => goToChapter(idx)}
                    className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors ${
                      isActive
                        ? 'bg-amber-500/15 font-bold text-amber-800 dark:text-amber-300'
                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs opacity-60 font-mono w-5">
                        {toBengaliNumerals(idx + 1)}.
                      </span>
                      <span className="text-xs sm:text-sm truncate">
                        {ch.title}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reader Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border relative space-y-6 ${headerThemeClasses}`}
          >
            <button
              onClick={() => setSettingsOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>রিডার পছন্দসমূহ (Settings)</span>
            </h3>

            {/* Reading Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                থিম কালার (Theme)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateSetting('theme', 'light')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    settings.theme === 'light'
                      ? 'border-amber-600 ring-2 ring-amber-500/30 font-bold bg-white text-stone-900'
                      : 'bg-white text-stone-900 border-stone-300'
                  }`}
                >
                  <Sun className="w-4 h-4" /> হালকা
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('theme', 'sepia')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    settings.theme === 'sepia'
                      ? 'border-amber-800 ring-2 ring-amber-700/30 font-bold bg-[#fbf0d9] text-[#5f4b32]'
                      : 'bg-[#fbf0d9] text-[#5f4b32] border-[#e7d8b5]'
                  }`}
                >
                  <Coffee className="w-4 h-4" /> সেপিয়া
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('theme', 'dark')}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    settings.theme === 'dark'
                      ? 'border-amber-500 ring-2 ring-amber-500/30 font-bold bg-stone-900 text-stone-100'
                      : 'bg-stone-900 text-stone-200 border-stone-800'
                  }`}
                >
                  <Moon className="w-4 h-4" /> গাঢ়
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                ফন্ট সাইজ (Font Size)
              </label>
              <div className="grid grid-cols-4 gap-2 text-center">
                {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updateSetting('fontSize', sz)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      settings.fontSize === sz
                        ? 'border-amber-600 bg-amber-500/20 font-bold'
                        : 'border-current/15 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {sz === 'sm' && 'ছোট'}
                    {sz === 'md' && 'মাঝারি'}
                    {sz === 'lg' && 'বড়'}
                    {sz === 'xl' && 'বিশাল'}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height & Alignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  লাইন স্পেসিং
                </label>
                <div className="flex gap-1.5">
                  {(['compact', 'normal', 'relaxed'] as LineHeight[]).map(
                    (lh) => (
                      <button
                        key={lh}
                        type="button"
                        onClick={() => updateSetting('lineHeight', lh)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                          settings.lineHeight === lh
                            ? 'border-amber-600 bg-amber-500/20 font-bold'
                            : 'border-current/15'
                        }`}
                      >
                        {lh === 'compact' && 'কম'}
                        {lh === 'normal' && 'স্বাভাবিক'}
                        {lh === 'relaxed' && 'বেশি'}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                  অ্যালাইনমেন্ট
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateSetting('textAlign', 'left')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                      settings.textAlign === 'left'
                        ? 'border-amber-600 bg-amber-500/20 font-bold'
                        : 'border-current/15'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" /> বাঁয়ে
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting('textAlign', 'justify')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 ${
                      settings.textAlign === 'justify'
                        ? 'border-amber-600 bg-amber-500/20 font-bold'
                        : 'border-current/15'
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" /> সমান
                  </button>
                </div>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-70">
                বাংলা ফন্ট নির্বাচন
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateSetting('fontFamily', 'serif')}
                  className={`py-2 rounded-xl border text-xs ${
                    settings.fontFamily === 'serif'
                      ? 'border-amber-600 bg-amber-500/20 font-bold'
                      : 'border-current/15'
                  }`}
                  style={{ fontFamily: "'Noto Serif Bengali', serif" }}
                >
                  নোতো সেরিফ
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('fontFamily', 'hind')}
                  className={`py-2 rounded-xl border text-xs ${
                    settings.fontFamily === 'hind'
                      ? 'border-amber-600 bg-amber-500/20 font-bold'
                      : 'border-current/15'
                  }`}
                  style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                >
                  হিন্দ শিলিগুড়ি
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('fontFamily', 'sans')}
                  className={`py-2 rounded-xl border text-xs ${
                    settings.fontFamily === 'sans'
                      ? 'border-amber-600 bg-amber-500/20 font-bold'
                      : 'border-current/15'
                  }`}
                  style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                >
                  নোতো স্যান্স
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold shadow-sm"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
