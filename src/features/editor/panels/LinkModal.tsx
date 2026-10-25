import React, { useState } from 'react';
import { X, Link as LinkIcon, Trash2 } from 'lucide-react';

interface LinkModalProps {
  initialUrl?: string;
  initialText?: string;
  onSetLink: (url: string, text?: string) => void;
  onRemoveLink: () => void;
  onClose: () => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  initialUrl = '',
  initialText = '',
  onSetLink,
  onRemoveLink,
  onClose,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      onRemoveLink();
    } else {
      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith('#') && !formattedUrl.startsWith('mailto:')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      onSetLink(formattedUrl, text.trim() || undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              লিংক যোগ / সম্পাদনা
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              ওয়েব ঠিকানা (URL)
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              প্রদর্শিত টেক্সট
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="লিংকের শিরোনাম"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {initialUrl ? (
              <button
                type="button"
                onClick={() => {
                  onRemoveLink();
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                লিংক সরান
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
              >
                সংরক্ষণ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
