import React from 'react';
import { X, FileText, Clock, Type, AlignJustify } from 'lucide-react';
import { toBengaliNumber } from '../../../utils/bengali';

interface WordStatsModalProps {
  text: string;
  onClose: () => void;
  useBengaliDigits?: boolean;
}

export const WordStatsModal: React.FC<WordStatsModalProps> = ({
  text,
  onClose,
  useBengaliDigits = true,
}) => {
  const clean = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  const charsWithSpaces = clean.length;
  const charsWithoutSpaces = clean.replace(/\s+/g, '').length;
  
  const wordsArray = clean.split(/[\s,।॥!?;:—\-]+/g).filter((w) => w.length > 0);
  const words = wordsArray.length;
  
  const paragraphsArray = text.split(/\n+/).filter((p) => p.trim().length > 0);
  const paragraphs = Math.max(1, paragraphsArray.length);

  const readingTimeMinutes = Math.max(1, Math.ceil(words / 180));

  const format = (n: number) => (useBengaliDigits ? toBengaliNumber(n) : n.toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              শব্দ ও অক্ষর পরিসংখ্যান
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Type className="w-4 h-4 text-teal-600" />
              <span>মোট শব্দ সংখ্যা</span>
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {format(words)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Type className="w-4 h-4 text-teal-600" />
              <span>মোট অক্ষর (স্পেস সহ)</span>
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {format(charsWithSpaces)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Type className="w-4 h-4 text-teal-600" />
              <span>মোট অক্ষর (স্পেস ছাড়া)</span>
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {format(charsWithoutSpaces)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <AlignJustify className="w-4 h-4 text-teal-600" />
              <span>অনুচ্ছেদ সংখ্যা</span>
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {format(paragraphs)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-800 dark:text-teal-200">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>আনুমানিক পড়ার সময়</span>
            </div>
            <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
              ~ {format(readingTimeMinutes)} মিনিট
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
