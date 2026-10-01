import React, { useState, useRef } from 'react';
import { LocalBook } from '../../types/writer';
import { X, BookOpen, Upload, Loader2, Tag, Check, Image as ImageIcon } from 'lucide-react';
import { storeLocalAsset } from '../../services/offlineWriter/assetService';
import { useToast } from '../../context/ToastContext';

interface BookMetadataModalProps {
  isOpen: boolean;
  book: LocalBook;
  onClose: () => void;
  onSave: (updated: Partial<LocalBook>) => void;
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

export const BookMetadataModal: React.FC<BookMetadataModalProps> = ({
  isOpen,
  book,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState(book.title || '');
  const [authorName, setAuthorName] = useState(book.authorName || '');
  const [publisherName, setPublisherName] = useState(book.publisherName || '');
  const [categoryId, setCategoryId] = useState(book.categoryId || 'other');
  const [description, setDescription] = useState(book.description || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(book.tags || []);
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || '');
  const [coverLocalId, setCoverLocalId] = useState(book.coverLocalId || '');
  const [coverUploading, setCoverUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    try {
      // Store local asset in IndexedDB (offline-ready)
      const { asset, localUrl } = await storeLocalAsset(file, book.id);
      setCoverUrl(localUrl);
      setCoverLocalId(asset.id);
      showToast('কভার ছবি সফলভাবে সংযুক্ত করা হয়েছে।', 'success');
    } catch (err: any) {
      showToast(err.message || 'কভার ছবি নির্বাচন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('কিতাবের শিরোনাম আবশ্যক।', 'warning');
      return;
    }

    onSave({
      title: title.trim(),
      authorName: authorName.trim(),
      publisherName: publisherName.trim(),
      categoryId,
      description: description.trim(),
      tags,
      coverUrl,
      coverLocalId,
      updatedAt: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-bold text-lg">
            <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>কিতাবের তথ্য ও মেটাডাটা</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cover Preview & Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
          <div className="w-24 h-32 rounded-xl bg-stone-200 dark:bg-stone-700 overflow-hidden shrink-0 flex items-center justify-center border border-stone-300 dark:border-stone-600 relative">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-stone-400" />
            )}
            {coverUploading && (
              <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              কিতাবের প্রচ্ছদ বা কভার ছবি
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              প্রচ্ছদ নির্বাচন করলে তা ডিভাইসে সংরক্ষিত হবে এবং অনলাইনে আপলোড হবে।
            </p>
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
              disabled={coverUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{coverUrl ? 'প্রচ্ছদ পরিবর্তন' : 'প্রচ্ছদ যোগ করুন'}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            কিতাবের শিরোনাম *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="যেমন: আধ্যাত্মিক পথের সন্ধানে"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Author & Publisher */}
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
              প্রকাশক / প্রকাশনা (ঐচ্ছিক)
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
            ক্যাটাগরি বা বিভাগ
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
            কিতাবের পরিচিতি বা সংক্ষেপ
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="কিতাবের মূল ভাব ও পাঠককে আকর্ষিত করার মতো সংক্ষিপ্ত বিবরণ..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            ট্যাগসমূহ
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="ট্যাগ লিখে এন্টার চাপুন"
              className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200"
            >
              যোগ করুন
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs"
                >
                  <Tag className="w-3 h-3" />
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </div>
  );
};
