import React, { useState } from 'react';
import { Project, CommentItem } from '../../../types';
import { X, MessageSquare, Check, Trash2, Send } from 'lucide-react';

interface CommentsDrawerProps {
  project: Project;
  onUpdateComments: (comments: CommentItem[]) => void;
  onClose: () => void;
  selectedText?: string;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  project,
  onUpdateComments,
  onClose,
  selectedText = '',
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const comments = project.comments || [];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      text: newCommentText.trim(),
      author: project.author || 'লেখক',
      createdAt: Date.now(),
      resolved: false,
      selectedText: selectedText || undefined,
    };

    onUpdateComments([newComment, ...comments]);
    setNewCommentText('');
  };

  const handleToggleResolve = (id: string) => {
    const updated = comments.map((c) =>
      c.id === id ? { ...c, resolved: !c.resolved } : c
    );
    onUpdateComments(updated);
  };

  const handleDelete = (id: string) => {
    const updated = comments.filter((c) => c.id !== id);
    onUpdateComments(updated);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            মন্তব্যসমূহ ({comments.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Add comment input */}
      <form onSubmit={handleAddComment} className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
        {selectedText && (
          <div className="text-[11px] p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 line-clamp-2 italic">
            "{selectedText}"
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="নতুন মন্তব্য লিখুন..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            কোনো মন্তব্য নেই। টেক্সট সিলেক্ট করে রিভিউ ট্যাবে মন্তব্য যোগ করতে পারেন।
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border transition-all ${
                comment.resolved
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              {comment.selectedText && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic mb-1 border-l-2 border-teal-500 pl-1.5 line-clamp-1">
                  "{comment.selectedText}"
                </div>
              )}
              <div className="text-xs text-slate-800 dark:text-slate-200 mb-2 font-medium">
                {comment.text}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleResolve(comment.id)}
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] ${
                      comment.resolved
                        ? 'text-emerald-600 font-semibold'
                        : 'text-slate-500 hover:text-emerald-600'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    {comment.resolved ? 'সমাধানকৃত' : 'সমাধান'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
