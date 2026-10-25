import React, { useState } from 'react';
import { X, Edit2 } from 'lucide-react';

interface RenameModalProps {
  initialTitle: string;
  onRename: (newTitle: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  initialTitle,
  onRename,
  onClose,
}) => {
  const [title, setTitle] = useState(initialTitle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onRename(title.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              নাম পরিবর্তন করুন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-4">
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-lg shadow-xs"
            >
              সংরক্ষণ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
