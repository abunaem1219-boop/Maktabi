import React, { useState } from 'react';
import { LocalBook, LocalSyncStatus } from '../../types/writer';
import {
  ArrowLeft,
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Eye,
  Maximize2,
  Minimize2,
  MoreVertical,
  Sliders,
  Send,
  Lock,
  Download,
  HardDrive,
  Layers,
  BookOpen,
  Clock,
} from 'lucide-react';

interface WriterHeaderProps {
  book: LocalBook;
  isAutosaving: boolean;
  isOnline: boolean;
  onBack: () => void;
  onPreview: () => void;
  onToggleFocusMode: () => void;
  isFocusMode: boolean;
  onToggleChaptersDrawer: () => void;
  onOpenMetadata: () => void;
  onSyncOnlyMe: () => void;
  onSubmitForReview: () => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  onExportTxt: () => void;
  onOpenStorageInfo: () => void;
  syncInProgress?: boolean;
}

export const WriterHeader: React.FC<WriterHeaderProps> = ({
  book,
  isAutosaving,
  isOnline,
  onBack,
  onPreview,
  onToggleFocusMode,
  isFocusMode,
  onToggleChaptersDrawer,
  onOpenMetadata,
  onSyncOnlyMe,
  onSubmitForReview,
  onExportJson,
  onExportHtml,
  onExportTxt,
  onOpenStorageInfo,
  syncInProgress = false,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Derive human-friendly save/sync status text and icon
  const renderStatus = () => {
    if (isAutosaving) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">সংরক্ষণ হচ্ছে...</span>
        </div>
      );
    }

    if (syncInProgress) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">ক্লাউডে সিঙ্ক হচ্ছে...</span>
        </div>
      );
    }

    if (!isOnline) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">অফলাইনে সংরক্ষিত</span>
        </div>
      );
    }

    if (book.syncStatus === 'synced') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">সিঙ্কড</span>
        </div>
      );
    }

    if (book.syncStatus === 'pending') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">সিঙ্কের অপেক্ষায়</span>
        </div>
      );
    }

    if (book.syncStatus === 'failed') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">সিঙ্ক ব্যর্থ</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">সংরক্ষিত</span>
      </div>
    );
  };

  return (
    <header className="h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-3 sm:px-4 flex items-center justify-between z-30 transition-colors">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onBack}
          className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors shrink-0"
          title="ড্যাশবোর্ডে ফিরুন"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Mobile Chapters Drawer Toggle */}
        <button
          onClick={onToggleChaptersDrawer}
          className="lg:hidden p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors shrink-0"
          title="অধ্যায় তালিকা"
          aria-label="Chapters"
        >
          <Layers className="w-5 h-5 text-amber-700 dark:text-amber-400" />
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <h1
            onClick={onOpenMetadata}
            className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate cursor-pointer hover:text-amber-700 dark:hover:text-amber-400"
            title="মেটাডাটা দেখতে ক্লিক করুন"
          >
            {book.title || 'শিরোনামহীন কিতাব'}
          </h1>
          <div className="shrink-0">{renderStatus()}</div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Preview Button */}
        <button
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="পাঠকের মতো করে দেখুন"
        >
          <Eye className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span className="hidden sm:inline">প্রিভিউ</span>
        </button>

        {/* Submit for Review Button */}
        {book.status !== 'pending_review' && book.status !== 'published' ? (
          <button
            onClick={onSubmitForReview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors"
            title="অ্যাডমিন রিভিউয়ের জন্য পাঠান"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">রিভিউ পাঠান</span>
          </button>
        ) : book.status === 'pending_review' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">পর্যালোচনাধীন</span>
          </span>
        ) : null}

        {/* Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          className={`p-2 rounded-xl transition-colors ${
            isFocusMode
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title={isFocusMode ? 'ফোকাস মোড বন্ধ করুন' : 'ফোকাস মোড চালু করুন'}
          aria-label="Focus mode"
        >
          {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-2 z-40 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenMetadata();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>কিতাবের তথ্য ও প্রচ্ছদ</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onSyncOnlyMe();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <Lock className="w-4 h-4 text-stone-500" />
                <span>শুধু আমি সংরক্ষণ (Only Me)</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onSubmitForReview();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <Send className="w-4 h-4 text-blue-600" />
                <span>রিভিউয়ের জন্য পাঠান</span>
              </button>

              <div className="my-1 border-t border-stone-100 dark:border-stone-700" />

              <div className="px-4 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                ব্যাকআপ ও এক্সপোর্ট
              </div>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onExportJson();
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>JSON ব্যাকআপ ডাউনলোড</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onExportHtml();
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-orange-600" />
                <span>HTML ফরম্যাটে এক্সপোর্ট</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onExportTxt();
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4 text-stone-500" />
                <span>TXT টেক্সট এক্সপোর্ট</span>
              </button>

              <div className="my-1 border-t border-stone-100 dark:border-stone-700" />

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenStorageInfo();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2.5"
              >
                <HardDrive className="w-4 h-4 text-stone-500" />
                <span>ডিভাইস মেমোরি ও ক্যাশ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
