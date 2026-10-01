import React, { useState, useEffect } from 'react';
import { Book, Bookmark, ReadingProgress } from '../types/book';
import { getUserFavoriteBooks } from '../services/favoriteService';
import { getUserBookmarks, removeBookmark } from '../services/bookmarkService';
import { getRecentReadingHistory } from '../services/readingProgressService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookGrid } from '../components/book/BookGrid';
import { toBengaliNumerals, formatBengaliDate } from '../utils/formatters';
import { getOptimizedImageUrl } from '../services/cloudinaryService';
import {
  Bookmark as BookmarkIcon,
  Heart,
  Clock,
  DownloadCloud,
  BookOpen,
  LogIn,
  Trash2,
  Play,
  Layers,
} from 'lucide-react';

interface LibraryProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'favorites' | 'bookmarks' | 'history' | 'offline'>('favorites');
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(false);

  // Load active tab data
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (activeTab === 'favorites') {
          if (user) {
            const list = await getUserFavoriteBooks(user.uid);
            if (mounted) setFavoriteBooks(list);
          } else {
            if (mounted) setFavoriteBooks([]);
          }
        } else if (activeTab === 'bookmarks') {
          if (user) {
            const bms = await getUserBookmarks(user.uid);
            if (mounted) setBookmarks(bms);
          } else {
            if (mounted) setBookmarks([]);
          }
        } else if (activeTab === 'history') {
          const hist = await getRecentReadingHistory(user ? user.uid : null, 20);
          if (mounted) setReadingHistory(hist);
        }
      } catch (err) {
        console.error('Failed to load library tab data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [user, activeTab]);

  const handleDeleteBookmark = async (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await removeBookmark(user.uid, bmId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bmId));
      showToast('বুকমার্ক মুছে ফেলা হয়েছে।', 'info');
    } catch {
      showToast('বুকমার্ক মুছতে সমস্যা হয়েছে।', 'error');
    }
  };

  const tabs = [
    { id: 'favorites', label: 'পছন্দের তালিকা', icon: <Heart className="w-4 h-4" /> },
    { id: 'bookmarks', label: 'বুকমার্কসমূহ', icon: <BookmarkIcon className="w-4 h-4" /> },
    { id: 'history', label: 'পড়ার ইতিহাস', icon: <Clock className="w-4 h-4" /> },
    { id: 'offline', label: 'অফলাইন বই', icon: <DownloadCloud className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            আমার লাইব্রেরি
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            আপনার প্রিয় বই, বুকমার্ক এবং ব্যক্তিগত অধ্যয়নের সম্পূর্ণ রেকর্ড
          </p>
        </div>

        {!user && (
          <button
            onClick={() => onNavigate('login')}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন করে সিঙ্ক করুন</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-1 ${
              activeTab === tab.id
                ? 'border-amber-700 dark:border-amber-500 text-amber-800 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. Favorites Tab */}
      {activeTab === 'favorites' && (
        !user ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                পছন্দের তালিকা দেখতে লগইন করুন
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                আপনার পছন্দের বইগুলো ক্লাউডে সংরক্ষিত থাকবে এবং যেকোনো ডিভাইস থেকে দেখা যাবে।
              </p>
            </div>
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন করুন</span>
            </button>
          </div>
        ) : (
          <BookGrid
            books={favoriteBooks}
            loading={loading}
            onSelectBook={(id) => onNavigate('book', id)}
            onAuthRequired={() => onNavigate('login')}
            emptyTitle="কোনো প্রিয় বই যুক্ত করা হয়নি"
            emptyMessage="বই ব্রাউজ করার সময় হার্ট (♡) আইকনে ক্লিক করে সহজেই প্রিয় তালিকায় যোগ করতে পারবেন।"
            emptyActionLabel="নতুন বই খুঁজুন"
            onEmptyAction={() => onNavigate('search')}
          />
        )
      )}

      {/* 2. Bookmarks Tab (Phase 3 Real Bookmarks) */}
      {activeTab === 'bookmarks' && (
        !user ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <BookmarkIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                বুকমার্ক দেখতে লগইন করুন
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                বই পড়ার সময় পৃষ্ঠা বুকমার্ক করে রাখতে কিতাবখানায় প্রবেশ করুন।
              </p>
            </div>
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন করুন</span>
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <BookmarkIcon className="w-12 h-12 text-stone-400 mx-auto" />
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
              কোনো বুকমার্ক সংরক্ষিত নেই
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              বই পড়ার সময় উপরের টুলবারের বুকমার্ক (🔖) আইকনে ক্লিক করে গুরুত্বপূর্ণ অধ্যায় সংরক্ষণ করুন।
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm"
            >
              <span>বই পড়া শুরু করুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                onClick={() => onNavigate('reader', bm.bookId)}
                className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className="w-14 h-20 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                  {bm.coverUrl ? (
                    <img
                      src={getOptimizedImageUrl(bm.coverUrl, { width: 100, height: 140 })}
                      alt={bm.bookTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 block uppercase tracking-wider">
                    বুকমার্ক
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {bm.bookTitle}
                  </h4>
                  <p className="text-xs text-stone-500 truncate font-medium">
                    {bm.chapterTitle}
                  </p>
                  <p className="text-[10px] text-stone-400 pt-1">
                    সংরক্ষিত: {formatBengaliDate(bm.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteBookmark(bm.id, e)}
                  className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors"
                  title="বুকমার্ক মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* 3. Reading History Tab (Phase 3 Real History) */}
      {activeTab === 'history' && (
        readingHistory.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <Clock className="w-12 h-12 text-stone-400 mx-auto" />
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
              পড়ার পূর্ববর্তী কোনো ইতিহাস নেই
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              যেকোনো বই পড়া শুরু করলে আপনার সর্বশেষ অবস্থান ও পড়ার অগ্রগতি এখানে সংরক্ষিত থাকবে।
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold"
            >
              <span>বই খুঁজুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {readingHistory.map((item) => (
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

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>সর্বশেষ অগ্রগতি</span>
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
        )
      )}

      {/* 4. Offline Books Tab (Phase 7 Roadmap) */}
      {activeTab === 'offline' && (
        <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <DownloadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
              অফলাইন বই ডাউনলোড ও ক্যাশিং (Phase 7)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Service Worker এবং IndexedDB ব্যবহার করে ইন্টারনেট ছাড়া সম্পূর্ণ বই পড়ার সুবিধা পরবর্তী ধাপে যুক্ত করা হবে।
            </p>
          </div>

          <button
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>নতুন বই ব্রাউজ করুন</span>
          </button>
        </div>
      )}
    </div>
  );
};
