import React, { useState, useEffect } from 'react';
import { LocalBook, LocalChapter } from '../../types/writer';
import { validateBookForSubmission, submitBookForModeration } from '../../services/publishingService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { toBengaliNumerals } from '../../utils/formatters';
import {
  X,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  Loader2,
  Check,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface SubmitChecklistModalProps {
  isOpen: boolean;
  book: LocalBook;
  chapters: LocalChapter[];
  onClose: () => void;
  onSubmitted: () => void;
}

export const SubmitChecklistModal: React.FC<SubmitChecklistModalProps> = ({
  isOpen,
  book,
  chapters,
  onClose,
  onSubmitted,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [copyrightConfirmed, setCopyrightConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isOpen) return null;

  const totalWords = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  const validation = validateBookForSubmission(book, chapters);

  const checklistItems = [
    { label: 'কিতাবের নাম/শিরোনাম', valid: Boolean(book.title?.trim()) },
    { label: 'লেখকের নাম', valid: Boolean(book.authorName?.trim()) },
    { label: 'ক্যাটাগরি বা বিভাগ নির্ধারণ', valid: Boolean(book.categoryId && book.categoryId !== 'all') },
    { label: 'কিতাবের সংক্ষিপ্ত পরিচিতি/বিবরণ', valid: Boolean(book.description?.trim()) },
    { label: 'প্রচ্ছদ বা কভার ছবি', valid: Boolean(book.coverUrl?.trim()) },
    { label: 'কমপক্ষে একটি অধ্যায়', valid: chapters.length > 0 },
    {
      label: 'অধ্যায়ের লেখা সম্পূর্ণ',
      valid: chapters.length > 0 && chapters.every((c) => c.content?.replace(/<[^>]*>/g, '').trim().length > 0),
    },
    { label: 'অনলাইন ড্রাফট সিঙ্ক সম্পন্ন', valid: book.syncStatus === 'synced' || book.syncStatus === 'local' },
  ];

  const handleStartSubmit = () => {
    if (!validation.isValid) {
      showToast('অনুগ্রহ করে কিতাবের সমস্ত প্রয়োজনীয় তথ্য পূরণ করুন।', 'warning');
      return;
    }
    if (!copyrightConfirmed) {
      showToast('অনুগ্রহ করে স্বত্বাধিকার ও প্রকাশনার ঘোষণাটি নিশ্চিত করুন।', 'warning');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!user) {
      showToast('রিভিউয়ে পাঠানোর জন্য লগইন করা আবশ্যক।', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitBookForModeration(book.id, user.uid, copyrightConfirmed);
      showToast('আপনার কিতাবটি সফলভাবে অ্যাডমিন রিভিউয়ের জন্য পাঠানো হয়েছে!', 'success');
      setShowConfirmDialog(false);
      onSubmitted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'সাবমিশন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-bold text-lg">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span>প্রকাশনা ও রিভিউ চেকলিস্ট</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book Summary Card */}
        <div className="flex gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt="Cover"
              className="w-16 h-22 object-cover rounded-xl shadow-xs shrink-0 border border-stone-200 dark:border-stone-700"
            />
          ) : (
            <div className="w-16 h-22 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
              {book.title || 'শিরোনামহীন কিতাব'}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              লেখক: {book.authorName || 'অজানা'} {book.publisherName ? `| প্রকাশনী: ${book.publisherName}` : ''}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-stone-400 dark:text-stone-500 pt-1">
              <span>অধ্যায়: {toBengaliNumerals(chapters.length)}</span>
              <span>মোট শব্দ: {toBengaliNumerals(totalWords)}</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            প্রকাশনার পূর্বশর্ত যাচাই
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {checklistItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                  item.valid
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                }`}
              >
                {item.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Errors Notice */}
        {!validation.isValid && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>কিতাবটি রিভিউতে পাঠানোর জন্য নিচের বিষয়গুলো পূরণ করতে হবে:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600 dark:text-stone-300 pl-1">
              {validation.missingFields.map((f, i) => (
                <li key={i}>{f} প্রদান করুন</li>
              ))}
              {validation.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Copyright Declaration */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={copyrightConfirmed}
              onChange={(e) => setCopyrightConfirmed(e.target.checked)}
              className="mt-0.5 rounded-sm border-stone-300 text-amber-700 focus:ring-amber-500 shrink-0"
            />
            <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                স্বত্বাধিকার ও সত্যতা নিশ্চিতকরণ
              </span>
              আমি নিশ্চিত করছি যে এই কিতাবের বিষয়বস্তুর প্রকাশনার অধিকার আমার আছে এবং এটি কিতাবখানার নীতিমালা অনুযায়ী লাইব্রেরিতে উন্মুক্ত করার জন্য প্রস্তুত।
            </div>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={!validation.isValid || !copyrightConfirmed}
            onClick={handleStartSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>রিভিউয়ের জন্য পাঠান</span>
          </button>
        </div>

        {/* Confirmation Sub-Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    রিভিউতে পাঠাতে নিশ্চিত?
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    অ্যাডমিন পর্যালোচনা করে এটি লাইব্রেরিতে প্রকাশ করবেন।
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                জমা দেওয়ার পর কিতাবটি <strong>পর্যালোচনাধীন (Pending Review)</strong> হিসেবে থাকবে। অ্যাডমিন অনুমোদন দিলে তা পাঠকদের জন্য প্রকাশিত হবে।
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmSubmit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>হ্যাঁ, নিশ্চিত পাঠান</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
