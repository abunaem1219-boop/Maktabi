import React, { useState, useEffect } from 'react';
import { BookChapter } from '../../types/book';
import { getChapters } from '../../services/chapterService';
import { sanitizeHtml } from '../../utils/sanitize';
import { toBengaliNumerals } from '../../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  Loader2,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';

interface AdminReviewReaderProps {
  bookId: string;
  bookTitle: string;
  onClose?: () => void;
}

export const AdminReviewReader: React.FC<AdminReviewReaderProps> = ({
  bookId,
  bookTitle,
  onClose,
}) => {
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [showToc, setShowToc] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Read directly from master bookContent node with isAdmin = true
        const chs = await getChapters(bookId, true);
        setChapters(chs);
      } catch (err) {
        console.error('Failed to load chapters for review:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookId]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-stone-500 gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-semibold">পান্ডুলিপির অধ্যায়সমূহ লোড হচ্ছে...</span>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="p-8 text-center bg-stone-50 dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
        <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
          এই কিতাবে কোনো অধ্যায় পাওয়া যায়নি।
        </p>
      </div>
    );
  }

  const currentChapter = chapters[activeChapterIndex];

  return (
    <div className="flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden min-h-[500px]">
      {/* Top Reader Bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/50">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="অধ্যায় সূচিপত্র"
          >
            <List className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
              {currentChapter?.title || 'অধ্যায়'}
            </h4>
            <p className="text-[10px] text-stone-400">
              অধ্যায় {toBengaliNumerals(activeChapterIndex + 1)} / {toBengaliNumerals(chapters.length)} |{' '}
              {toBengaliNumerals(currentChapter?.wordCount || 0)} শব্দ
            </p>
          </div>
        </div>

        {/* Font Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
            title="ফন্ট ছোট করুন"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-stone-500 px-1">{fontSize}px</span>
          <button
            onClick={() => setFontSize((s) => Math.min(26, s + 2))}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
            title="ফন্ট বড় করুন"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Table of Contents Drawer */}
        {showToc && (
          <div className="w-64 bg-stone-50 dark:bg-stone-850 border-r border-stone-200 dark:border-stone-800 p-3 space-y-1 overflow-y-auto shrink-0 animate-in slide-in-from-left-4">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 pb-1">
              অধ্যায় তালিকা
            </div>
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapterIndex(idx);
                  setShowToc(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  idx === activeChapterIndex
                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 font-bold'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span className="truncate">{ch.title}</span>
                <span className="text-[10px] text-stone-400 shrink-0 ml-2">
                  {toBengaliNumerals(ch.wordCount || 0)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Chapter Content Surface */}
        <div className="flex-1 p-6 sm:p-10 overflow-y-auto max-h-[600px] leading-relaxed">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3">
              {currentChapter?.title}
            </h2>

            {/* Sanitized HTML Output */}
            <div
              className="prose prose-stone dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 leading-relaxed font-serif"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(currentChapter?.content || ''),
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Chapter Navigation Bar */}
      <div className="flex items-center justify-between p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/50">
        <button
          onClick={() => setActiveChapterIndex((i) => Math.max(0, i - 1))}
          disabled={activeChapterIndex === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>পূর্ববর্তী অধ্যায়</span>
        </button>

        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
          {toBengaliNumerals(activeChapterIndex + 1)} / {toBengaliNumerals(chapters.length)}
        </span>

        <button
          onClick={() => setActiveChapterIndex((i) => Math.min(chapters.length - 1, i + 1))}
          disabled={activeChapterIndex === chapters.length - 1}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span>পরবর্তী অধ্যায়</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
