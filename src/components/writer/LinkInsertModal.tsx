import React, { useState } from 'react';
import { X, Link2, AlertCircle } from 'lucide-react';

interface LinkInsertModalProps {
  isOpen: boolean;
  initialText?: string;
  initialUrl?: string;
  onClose: () => void;
  onInsert: (url: string, text: string, newTab: boolean) => void;
}

export const LinkInsertModal: React.FC<LinkInsertModalProps> = ({
  isOpen,
  initialText = '',
  initialUrl = '',
  onClose,
  onInsert,
}) => {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const [newTab, setNewTab] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('অনুগ্রহ করে একটি লিঙ্ক URL দিন।');
      return;
    }

    // Safety check against javascript: or vbscript:
    if (/^(javascript|vbscript|data):/i.test(trimmedUrl)) {
      setError('নিরাপত্তাজনিত কারণে এই ধরণের লিঙ্ক অনুমোদিত নয়।');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    onInsert(trimmedUrl, text.trim() || trimmedUrl, newTab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-lg">
            <Link2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span>হাইপারলিঙ্ক যুক্ত করুন</span>
          </div>
          <button
            type="button"
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

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            লিঙ্ক টেক্সট
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="প্রদর্শিত লেখার নাম"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            ওয়েবসাইট ঠিকানা (URL)
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            autoFocus
          />
        </div>

        <label className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-400 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={newTab}
            onChange={(e) => setNewTab(e.target.checked)}
            className="rounded-sm border-stone-300 text-amber-700 focus:ring-amber-500"
          />
          <span>নতুন ট্যাবে খুলুন (Open in new tab)</span>
        </label>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all"
          >
            যোগ করুন
          </button>
        </div>
      </form>
    </div>
  );
};
