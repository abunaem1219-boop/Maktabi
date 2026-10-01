import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LocalBook, LocalChapter } from '../../types/writer';
import { saveLocalBook, saveLocalChapter } from '../../services/indexedDbService';
import { storeLocalAsset } from '../../services/offlineWriter/assetService';
import { X, Feather, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newBookId: string) => void;
}

const CATEGORIES = [
  { id: 'islamic', name: 'ইসলামিক ও ধর্মীয়' },
  { id: 'novel', name: 'উপন্যাস' },
  { id: 'story', name: 'ছোটগল্প ও সাহিত্য' },
  { id: 'poetry', name: 'কবিতা' },
  { id: 'history', name: 'ইতিহাস ও ঐতিহ্য' },
  { id: 'biography', name: 'জীবনী ও স্মৃতিচারণ' },
  { id: 'education', name: 'শিক্ষা ও গবেষণা' },
  { id: 'self-dev', name: 'আত্মউন্নয়ন ও অনুপ্রেরণা' },
  { id: 'other', name: 'অন্যান্য' },
];

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { userProfile, user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(userProfile?.name || 'লেখক');
  const [publisherName, setPublisherName] = useState('');
  const [categoryId, setCategoryId] = useState('other');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverLocalId, setCoverLocalId] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const now = Date.now();
      const tempBookId = `book_local_${now}`;
      const { asset, localUrl } = await storeLocalAsset(file, tempBookId);
      setCoverUrl(localUrl);
      setCoverLocalId(asset.id);
      showToast('কভার ছবি সংযুক্ত হয়েছে।', 'success');
    } catch (err: any) {
      showToast(err.message || 'কভার ছবি নির্বাচন ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('অনুগ্রহ করে কিতাবের শিরোনাম লিখুন।', 'warning');
      return;
    }

    setLoading(true);
    try {
      const now = Date.now();
      const bookId = `book_local_${now}_${Math.random().toString(36).substring(2, 7)}`;
      const ownerUid = user?.uid || 'device_local';

      // 1. Create Local Book in IndexedDB (100% Offline Capable)
      const newBook: LocalBook = {
        id: bookId,
        ownerUid,
        title: title.trim(),
        authorName: authorName.trim() || 'লেখক',
        publisherName: publisherName.trim(),
        description: description.trim(),
        categoryId,
        tags: [],
        coverUrl,
        coverLocalId,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
        syncStatus: 'local',
        totalChapters: 1,
        totalWords: 0,
      };

      await saveLocalBook(newBook);

      // 2. Automatically create first chapter "প্রথম অধ্যায়"
      const firstChapterId = `ch_local_${now}_1`;
      const firstChapter: LocalChapter = {
        id: firstChapterId,
        bookId,
        title: 'প্রথম অধ্যায়',
        order: 1,
        content: '<p></p>',
        createdAt: now,
        updatedAt: now,
        wordCount: 0,
        characterCount: 0,
        syncStatus: 'local',
      };

      await saveLocalChapter(firstChapter);

      showToast('নতুন কিতাব তৈরি হয়েছে! লেখা শুরু করুন।', 'success');
      onCreated(bookId);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'কিতাব তৈরিতে সমস্যা হয়েছে।', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-bold text-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Feather className="w-4 h-4" />
            </div>
            <span>নতুন কিতাব শুরু করুন</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            কিতাবের শিরোনাম *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="যেমন: আধ্যাত্মিক জীবনের পথপ্রদর্শক"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Author Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              লেখকের নাম *
            </label>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="লেখকের নাম"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              প্রকাশক (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={publisherName}
              onChange={(e) => setPublisherName(e.target.value)}
              placeholder="প্রকাশনীর নাম"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            ক্যাটাগরি
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="কিতাবের মূল প্রতিপাদ্য..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
          />
        </div>

        {/* Cover selector */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
          <div className="w-12 h-16 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden shrink-0">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-stone-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
              প্রচ্ছদ বা কভার ছবি (ঐচ্ছিক)
            </p>
            <p className="text-[10px] text-stone-400">
              অফলাইনেও নির্বাচন করা যাবে, পরে পরিবর্তন করতে পারবেন
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>নির্বাচন</span>
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>শুরু করুন</span>
          </button>
        </div>
      </form>
    </div>
  );
};
