import React, { useState } from 'react';
import { LocalChapter } from '../../types/writer';
import { toBengaliNumerals } from '../../utils/formatters';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Edit2,
  FileText,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface ChapterListProps {
  chapters: LocalChapter[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (chapterId: string, newTitle: string) => void;
  onDuplicateChapter: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onMoveChapter: (chapterId: string, direction: 'up' | 'down') => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDuplicateChapter,
  onDeleteChapter,
  onMoveChapter,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const startRename = (ch: LocalChapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ch.id);
    setEditTitle(ch.title);
  };

  const saveRename = (chapterId: string) => {
    if (editTitle.trim()) {
      onRenameChapter(chapterId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 w-full sm:w-72 shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
          <Layers className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span>অধ্যায় তালিকা ({toBengaliNumerals(chapters.length)})</span>
        </div>
        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
          title="নতুন অধ্যায় যোগ করুন"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন অধ্যায়</span>
        </button>
      </div>

      {/* Chapters Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chapters.map((ch, index) => {
          const isActive = ch.id === activeChapterId;
          const isFirst = index === 0;
          const isLast = index === chapters.length - 1;

          return (
            <div
              key={ch.id}
              onClick={() => onSelectChapter(ch.id)}
              className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 shadow-xs'
                  : 'hover:bg-white dark:hover:bg-stone-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <FileText
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400'
                  }`}
                />

                {editingId === ch.id ? (
                  <div
                    className="flex items-center gap-1 flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(ch.id)}
                      autoFocus
                      className="w-full text-xs px-2 py-1 rounded-lg border border-amber-400 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                    <button
                      onClick={() => saveRename(ch.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isActive
                          ? 'text-amber-950 dark:text-amber-100 font-bold'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {ch.title}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                      {toBengaliNumerals(ch.wordCount || 0)} শব্দ
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {/* Move Up */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isFirst) onMoveChapter(ch.id, 'up');
                  }}
                  disabled={isFirst}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20"
                  title="উপরে নিন"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLast) onMoveChapter(ch.id, 'down');
                  }}
                  disabled={isLast}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20"
                  title="নিচে নিন"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Rename */}
                <button
                  onClick={(e) => startRename(ch, e)}
                  className="p-1 text-stone-400 hover:text-amber-700 dark:hover:text-amber-400"
                  title="নাম পরিবর্তন"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Duplicate */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateChapter(ch.id);
                  }}
                  className="p-1 text-stone-400 hover:text-blue-700 dark:hover:text-blue-400"
                  title="কপি তৈরি করুন"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                {chapters.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(ch.id);
                    }}
                    className="p-1 text-stone-400 hover:text-red-700 dark:hover:text-red-400"
                    title="অধ্যায় মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmModal
          isOpen={true}
          title="অধ্যায় মুছে ফেলবেন?"
          message="এই অধ্যায়টি লোকাল স্টোরেজ থেকে স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
          confirmLabel="মুছে ফেলুন"
          cancelLabel="বাতিল"
          isDestructive={true}
          onConfirm={() => {
            onDeleteChapter(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
};
