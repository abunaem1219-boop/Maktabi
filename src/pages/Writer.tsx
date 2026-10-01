import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocalBook, LocalBookStatus, StorageEstimateResult } from '../types/writer';
import {
  getAllLocalBooks,
  deleteLocalBook,
  saveLocalBook,
  getChaptersByBookId,
  saveLocalChapter,
  exportBookAsJson,
  getStorageEstimate,
  importBookFromJson,
} from '../services/indexedDbService';
import { isNetworkOnline, subscribeToSyncStatus } from '../services/offlineWriter/syncService';
import { NewBookModal } from '../components/writer/NewBookModal';
import { StorageInfoModal } from '../components/writer/StorageInfoModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatBengaliDate, toBengaliNumerals } from '../utils/formatters';
import {
  Feather,
  Plus,
  BookOpen,
  Clock,
  FileText,
  Lock,
  Send,
  CheckCircle2,
  Trash2,
  Copy,
  Download,
  Upload,
  HardDrive,
  WifiOff,
  Cloud,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface WriterProps {
  onNavigate: (view: string, param?: string) => void;
  openNewBookInitially?: boolean;
}

export const Writer: React.FC<WriterProps> = ({ onNavigate, openNewBookInitially = false }) => {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const [books, setBooks] = useState<LocalBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(isNetworkOnline());
  const [filter, setFilter] = useState<'all' | LocalBookStatus>('all');

  // Modals
  const [showNewModal, setShowNewModal] = useState(openNewBookInitially);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<LocalBook | null>(null);

  // Storage estimation
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimateResult | null>(null);

  // File input for import JSON backup
  const importInputRef = React.useRef<HTMLInputElement>(null);

  // Subscribe to connectivity
  useEffect(() => {
    const unsub = subscribeToSyncStatus((online) => setIsOnline(online));
    return () => unsub();
  }, []);

  const loadLocalBooks = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getAllLocalBooks(user?.uid);
      setBooks(list);
      const est = await getStorageEstimate();
      setStorageEstimate(est);
    } catch (err) {
      console.error('Failed to load local books:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadLocalBooks();
  }, [loadLocalBooks]);

  // Handle Account Migration for local drafts created while logged out
  const handleMigrateAccount = async () => {
    if (!user) return;
    try {
      const deviceBooks = await getAllLocalBooks();
      const unowned = deviceBooks.filter((b) => b.ownerUid === 'device_local');
      for (const b of unowned) {
        b.ownerUid = user.uid;
        await saveLocalBook(b);
      }
      showToast(`${toBengaliNumerals(unowned.length)} টি খসড়া আপনার অ্যাকাউন্টে যুক্ত করা হয়েছে।`, 'success');
      loadLocalBooks();
    } catch {
      showToast('অ্যাকাউন্টে মাইগ্রেশন ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Duplicate Book
  const handleDuplicateBook = async (book: LocalBook, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const now = Date.now();
      const newBookId = `book_local_${now}_dup`;
      const chapters = await getChaptersByBookId(book.id);

      const dupBook: LocalBook = {
        ...book,
        id: newBookId,
        title: `${book.title} (অনুলিপি)`,
        status: 'draft',
        syncStatus: 'local',
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
      };

      await saveLocalBook(dupBook);

      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const newChId = `ch_local_${now}_${i + 1}`;
        await saveLocalChapter({
          ...ch,
          id: newChId,
          bookId: newBookId,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'local',
        });
      }

      showToast(`কিতাবের কপি তৈরি হয়েছে: ${dupBook.title}`, 'success');
      loadLocalBooks();
    } catch {
      showToast('কপি তৈরিতে সমস্যা হয়েছে।', 'error');
    }
  };

  // Delete Book
  const handleDeleteBook = async () => {
    if (!deleteConfirmBook) return;
    try {
      await deleteLocalBook(deleteConfirmBook.id);
      showToast('খসড়া কিতাবটি মুছে ফেলা হয়েছে।', 'info');
      setDeleteConfirmBook(null);
      loadLocalBooks();
    } catch {
      showToast('কিতাব মুছতে সমস্যা হয়েছে।', 'error');
    }
  };

  // Export JSON
  const handleExportJson = async (book: LocalBook, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const json = await exportBookAsJson(book.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}_backup.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে।', 'success');
    } catch (err: any) {
      showToast(err.message || 'এক্সপোর্ট ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Import JSON backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = await importBookFromJson(text, user?.uid || 'device_local');
      showToast(`সফলভাবে ইম্পোর্ট হয়েছে: ${imported.title}`, 'success');
      loadLocalBooks();
      onNavigate('writer', imported.id);
    } catch (err: any) {
      showToast(err.message || 'ইম্পোর্ট ব্যর্থ হয়েছে।', 'error');
    }
  };

  // Filtered books
  const filteredBooks = books.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const unownedCount = books.filter((b) => b.ownerUid === 'device_local').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-3">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">আপনি এখন অফলাইনে আছেন। </span>
            আপনার লেখা ডিভাইসের IndexedDB-তে নিরাপদে সংরক্ষণ হচ্ছে। ইন্টারনেট ফিরে এলে ক্লাউডে সিঙ্ক করতে পারবেন।
          </div>
        </div>
      )}

      {/* Account migration banner if unowned drafts exist while logged in */}
      {user && unownedCount > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              আপনার ডিভাইসে {toBengaliNumerals(unownedCount)} টি অফলাইন খসড়া পাওয়া গেছে। এগুলো আপনার {user.email} অ্যাকাউন্টে যুক্ত করবেন?
            </span>
          </div>
          <button
            onClick={handleMigrateAccount}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shrink-0"
          >
            অ্যাকাউন্টে যুক্ত করুন
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Feather className="w-3.5 h-3.5" />
            <span>লেখক প্রকাশনা স্টুডিও</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            রাইটার স্টুডিও ও খসড়া খাতা
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            অফলাইনেও নিখুঁতভাবে লিখুন, সাজান এবং পাঠকদের জন্য প্রস্তুত করুন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Storage modal button */}
          <button
            onClick={() => setShowStorageModal(true)}
            className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            title="ডিভাইস মেমোরি ও স্টোরেজ"
          >
            <HardDrive className="w-5 h-5 text-stone-500" />
          </button>

          {/* Import JSON Backup */}
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="JSON ব্যাকআপ ইম্পোর্ট"
          >
            <Upload className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">ইম্পোর্ট</span>
          </button>

          {/* Create New Book button */}
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-900/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কিতাব</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          সব খসড়া ({toBengaliNumerals(books.length)})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            filter === 'draft'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          লোকাল ড্রাফট ({toBengaliNumerals(books.filter((b) => b.status === 'draft').length)})
        </button>
        <button
          onClick={() => setFilter('only_me')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            filter === 'only_me'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          শুধু আমি / প্রাইভেট ({toBengaliNumerals(books.filter((b) => b.status === 'only_me').length)})
        </button>
        <button
          onClick={() => setFilter('pending_review')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            filter === 'pending_review'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          পর্যালোচনায় ({toBengaliNumerals(books.filter((b) => b.status === 'pending_review').length)})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            filter === 'published'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          প্রকাশিত ({toBengaliNumerals(books.filter((b) => b.status === 'published').length)})
        </button>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-dashed border-stone-300 dark:border-stone-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              কোনো খসড়া কিতাব নেই
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
              আপনার চিন্তাভাবনা ও জ্ঞানকে কিতাবের পাতায় রূপ দিন। ইন্টারনেট সংযোগ ছাড়াই লিখতে পারবেন।
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কিতাব শুরু করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((b) => {
            return (
              <div
                key={b.id}
                onClick={() => onNavigate('writer', b.id)}
                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-amber-600/40 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Top: Status & Sync badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'published'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : b.status === 'pending_review'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : (b.status as any) === 'changes_requested'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        : (b.status as any) === 'rejected'
                        ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                        : b.status === 'only_me'
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {b.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                    {b.status === 'pending_review' && <Send className="w-3 h-3" />}
                    {(b.status as any) === 'changes_requested' && <AlertTriangle className="w-3 h-3" />}
                    {(b.status as any) === 'rejected' && <XCircle className="w-3 h-3" />}
                    {b.status === 'only_me' && <Lock className="w-3 h-3" />}
                    {b.status === 'draft' && <FileText className="w-3 h-3" />}
                    <span>
                      {b.status === 'published'
                        ? 'প্রকাশিত'
                        : b.status === 'pending_review'
                        ? 'পর্যালোচনায়'
                        : (b.status as any) === 'changes_requested'
                        ? 'সংশোধন প্রয়োজন'
                        : (b.status as any) === 'rejected'
                        ? 'প্রত্যাখ্যাত'
                        : b.status === 'only_me'
                        ? 'শুধু আমি'
                        : 'খসড়া'}
                    </span>
                  </span>

                  {/* Sync status indicator */}
                  <span
                    className={`text-[10px] flex items-center gap-1 font-medium ${
                      b.syncStatus === 'synced'
                        ? 'text-emerald-600'
                        : b.syncStatus === 'pending'
                        ? 'text-amber-600'
                        : 'text-stone-400'
                    }`}
                  >
                    <Cloud className="w-3 h-3" />
                    <span>
                      {b.syncStatus === 'synced'
                        ? 'সিঙ্কড'
                        : b.syncStatus === 'pending'
                        ? 'অপেক্ষমান'
                        : 'ডিভাইসে সংরক্ষিত'}
                    </span>
                  </span>
                </div>

                {/* Book Details */}
                <div className="flex gap-3 mb-4">
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      className="w-16 h-22 object-cover rounded-xl shadow-xs shrink-0 border border-stone-200 dark:border-stone-800"
                    />
                  ) : (
                    <div className="w-16 h-22 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                      {b.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                      {b.authorName}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 dark:text-stone-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatBengaliDate(b.updatedAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-stone-400">
                    <button
                      onClick={(e) => handleDuplicateBook(b, e)}
                      className="p-1.5 hover:text-blue-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="কপি তৈরি করুন"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleExportJson(b, e)}
                      className="p-1.5 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="JSON ব্যাকআপ"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmBook(b);
                      }}
                      className="p-1.5 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                      title="খসড়া মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                    <span>লিখুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Book Modal */}
      {showNewModal && (
        <NewBookModal
          isOpen={true}
          onClose={() => setShowNewModal(false)}
          onCreated={(newBookId) => {
            loadLocalBooks();
            onNavigate('writer', newBookId);
          }}
        />
      )}

      {/* Storage Info Modal */}
      {showStorageModal && (
        <StorageInfoModal
          isOpen={true}
          onClose={() => setShowStorageModal(false)}
          onCleared={loadLocalBooks}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBook && (
        <ConfirmModal
          isOpen={true}
          title="খসড়া কিতাবটি মুছে ফেলবেন?"
          message={`"${deleteConfirmBook.title}" কিতাবটি এবং এর সব অধ্যায় এই ডিভাইসের লোকাল স্টোরেজ থেকে মুছে যাবে।`}
          confirmLabel="মুছে ফেলুন"
          cancelLabel="বাতিল"
          isDestructive={true}
          onConfirm={handleDeleteBook}
          onCancel={() => setDeleteConfirmBook(null)}
        />
      )}
    </div>
  );
};
