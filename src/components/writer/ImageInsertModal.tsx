import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Loader2, AlertCircle } from 'lucide-react';
import { storeLocalAsset } from '../../services/offlineWriter/assetService';

interface ImageInsertModalProps {
  isOpen: boolean;
  bookId: string;
  chapterId?: string;
  onClose: () => void;
  onInsert: (imageUrl: string, altText: string, assetId?: string) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  bookId,
  chapterId,
  onClose,
  onInsert,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('অনুগ্রহ করে একটি ছবি (JPG, PNG বা WebP) নির্বাচন করুন।');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারে।');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('অনুগ্রহ করে একটি ছবি নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Store locally in IndexedDB first (works 100% offline!)
      const { asset, localUrl } = await storeLocalAsset(selectedFile, bookId, chapterId);
      onInsert(localUrl, altText.trim() || 'চিত্র', asset.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'ছবি সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-lg">
            <ImageIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>অধ্যায়ে ছবি যুক্ত করুন</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-600 dark:hover:border-amber-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50 dark:bg-stone-800/40"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative group w-full max-h-48 overflow-hidden rounded-xl">
              <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48 rounded-xl" />
              <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                ছবি পরিবর্তন করতে ক্লিক করুন
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                ছবি আপলোড করতে ট্যাপ করুন বা ড্র্যাগ করুন
              </div>
              <div className="text-xs text-stone-400">
                JPG, PNG, WebP (সর্বোচ্চ ১০MB) — অফলাইনেও সংরক্ষিত হবে
              </div>
            </div>
          )}
        </div>

        {/* Alt text field */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            ছবির বিবরণ বা ক্যাপশন (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="যেমন: পান্ডুলিপির মূল মানচিত্র..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedFile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>যুক্ত করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
