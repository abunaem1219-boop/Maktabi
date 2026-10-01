import React, { useEffect, useState } from 'react';
import { X, HardDrive, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  getStorageEstimate,
  clearAllLocalDraftData,
  getAllLocalBooks,
} from '../../services/indexedDbService';
import { StorageEstimateResult, LocalBook } from '../../types/writer';
import { toBengaliNumerals } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface StorageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleared?: () => void;
}

export const StorageInfoModal: React.FC<StorageInfoModalProps> = ({
  isOpen,
  onClose,
  onCleared,
}) => {
  const { showToast } = useToast();
  const [estimate, setEstimate] = useState<StorageEstimateResult | null>(null);
  const [localBooks, setLocalBooks] = useState<LocalBook[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getStorageEstimate().then(setEstimate);
      getAllLocalBooks().then(setLocalBooks);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unsyncedCount = localBooks.filter((b) => b.syncStatus !== 'synced').length;

  const handleClearCache = async () => {
    try {
      await clearAllLocalDraftData();
      showToast('ডিভাইসের লোকাল ড্রাফট মেমোরি পরিষ্কার করা হয়েছে।', 'info');
      if (onCleared) onCleared();
      onClose();
    } catch {
      showToast('মেমোরি পরিষ্কার ব্যর্থ হয়েছে।', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-lg">
            <HardDrive className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>ডিভাইস স্টোরেজ ও মেমোরি</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Bar */}
        {estimate && (
          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
              <span>ব্যবহৃত মেমোরি</span>
              <span>{toBengaliNumerals(estimate.usageFormatted)} / {toBengaliNumerals(estimate.quotaFormatted)} ({toBengaliNumerals(estimate.usagePercent)}%)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  estimate.isLow ? 'bg-red-500' : 'bg-amber-600 dark:bg-amber-500'
                }`}
                style={{ width: `${Math.max(2, estimate.usagePercent)}%` }}
              />
            </div>
            {estimate.isLow && (
              <p className="text-[11px] text-red-600 dark:text-red-400">
                সতর্কতা: আপনার ব্রাউজারের স্টোরেজ প্রায় পূর্ণ।
              </p>
            )}
          </div>
        )}

        {/* Local Items Summary */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {toBengaliNumerals(localBooks.length)}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">মোট লোকাল কিতাব</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {toBengaliNumerals(unsyncedCount)}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">সিঙ্কের অপেক্ষায়</p>
          </div>
        </div>

        {/* Clear Cache Area */}
        {!showConfirmClear ? (
          <div className="pt-2">
            <button
              onClick={() => setShowConfirmClear(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>লোকাল ড্রাফট ক্যাশ খালি করুন</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>
                {unsyncedCount > 0
                  ? `আপনার ${toBengaliNumerals(unsyncedCount)} টি লেখা এখনো অনলাইনে সংরক্ষিত হয়নি! এটি মুছে ফেললে অফলাইন খসড়া চিরতরে মুছে যাবে। আপনি কি নিশ্চিত?`
                  : 'আপনি কি নিশ্চিতভাবে এই ডিভাইসের সংরক্ষিত ড্রাফট ডেটা মুছে ফেলতে চান?'}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800"
              >
                বাতিল
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                হ্যাঁ, নিশ্চিত মুছে ফেলুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
