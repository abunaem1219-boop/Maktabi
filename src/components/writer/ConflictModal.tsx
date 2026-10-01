import React from 'react';
import { AlertTriangle, Clock, HardDrive, Cloud, Copy, Check } from 'lucide-react';
import { formatBengaliDate } from '../../utils/formatters';

interface ConflictModalProps {
  isOpen: boolean;
  localUpdatedAt?: number;
  remoteUpdatedAt?: number;
  onKeepLocal: () => void;
  onUseRemote: () => void;
  onForkBoth: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  localUpdatedAt,
  remoteUpdatedAt,
  onKeepLocal,
  onUseRemote,
  onForkBoth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              অনলাইন সংস্করণের সাথে বৈপরীত্য (Conflict)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              এই কিতাবের একটি নতুন অনলাইন সংস্করণ পাওয়া গেছে। আপনার কোনো লেখা যাতে হারিয়ে না যায়, সেজন্য নিচের যে কোনো একটি বিকল্প বেছে নিন:
            </p>
          </div>
        </div>

        {/* Timestamps comparison */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              <span>এই ডিভাইসের সংস্করণ</span>
            </div>
            <p className="text-stone-400">{formatBengaliDate(localUpdatedAt)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>অনলাইনের সংস্করণ</span>
            </div>
            <p className="text-stone-400">{formatBengaliDate(remoteUpdatedAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onKeepLocal}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-amber-600 dark:hover:border-amber-500 bg-white dark:bg-stone-800 text-left transition-colors group"
          >
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                এই ডিভাইসের লেখা বজায় রাখুন
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                আপনার বর্তমান ডিভাইসের লেখাকে অগ্রাধিকার দিয়ে অনলাইনে সিঙ্ক করা হবে।
              </p>
            </div>
            <Check className="w-4 h-4 text-stone-400 group-hover:text-amber-600 shrink-0 ml-2" />
          </button>

          <button
            onClick={onUseRemote}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-blue-600 dark:hover:border-blue-500 bg-white dark:bg-stone-800 text-left transition-colors group"
          >
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                অনলাইন সংস্করণ গ্রহণ করুন
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                অনলাইনের সর্বশেষ সংস্করণ ডাউনলোড করে বর্তমান ড্রাফট আপডেট হবে।
              </p>
            </div>
            <Cloud className="w-4 h-4 text-stone-400 group-hover:text-blue-600 shrink-0 ml-2" />
          </button>

          <button
            onClick={onForkBoth}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500 bg-white dark:bg-stone-800 text-left transition-colors group"
          >
            <div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                উভয়টি রাখুন (একটি নতুন কপি তৈরি করুন)
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                নিরাপত্তার জন্য বর্তমান লেখাকে একটি আলাদা ড্রাফট কপি হিসেবে সংরক্ষণ করুন।
              </p>
            </div>
            <Copy className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 shrink-0 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};
