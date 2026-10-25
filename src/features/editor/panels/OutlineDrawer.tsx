import React, { useState } from 'react';
import { Project, Chapter } from '../../../types';
import { Editor } from '@tiptap/react';
import { X, BookOpen, ListTree, Plus, Trash2, Edit2, Target, Sparkles, Image, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toBengaliNumber } from '../../../utils/bengali';

interface OutlineDrawerProps {
  editor: Editor | null;
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onClose: () => void;
  onOpenCoverEditor?: () => void;
}

export const OutlineDrawer: React.FC<OutlineDrawerProps> = ({
  editor,
  project,
  onUpdateProject,
  onClose,
  onOpenCoverEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'headings' | 'chapters' | 'goal'>('headings');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [targetInput, setTargetInput] = useState(project.targetWordCount?.toString() || '1000');

  // Collect headings from Tiptap doc
  const headings: { level: number; text: string; pos: number }[] = [];
  if (editor) {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          level: node.attrs.level,
          text: node.textContent || 'শিরোনামহীন',
          pos,
        });
      }
    });
  }

  // Jump to heading in editor
  const handleJumpToPos = (pos: number) => {
    if (!editor) return;
    editor.chain().setTextSelection(pos).focus().scrollIntoView().run();
  };

  // Add chapter in book mode
  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    const chapters = project.chapters || [];
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: newChapterTitle.trim(),
      order: chapters.length + 1,
      wordCount: 0,
    };

    onUpdateProject({
      chapters: [...chapters, newChapter],
    });
    setNewChapterTitle('');

    // Also insert chapter heading into editor with page break
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'pageBreak' },
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: newChapter.title }] },
          { type: 'paragraph' }
        ])
        .run();
    }
  };

  const handleDeleteChapter = (id: string) => {
    const chapters = (project.chapters || []).filter((c) => c.id !== id);
    onUpdateProject({ chapters });
  };

  const handleSaveGoal = () => {
    const num = parseInt(targetInput, 10);
    if (!isNaN(num) && num > 0) {
      onUpdateProject({ targetWordCount: num });
      if (project.wordCount >= num) {
        confetti({ particleCount: 80, spread: 60 });
      }
    }
  };

  const targetGoal = project.targetWordCount || 1000;
  const currentWords = project.wordCount || 0;
  const progressPercent = Math.min(100, Math.round((currentWords / targetGoal) * 100));

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {project.type === 'book' ? 'বই ও অধ্যায় নেভিগেশন' : 'ডকুমেন্ট আউটলাইন'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 px-3 pt-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('headings')}
          className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'headings'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          হেডিংস ({headings.length})
        </button>

        {project.type === 'book' && (
          <button
            type="button"
            onClick={() => setActiveTab('chapters')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'chapters'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            অধ্যায়সমূহ ({project.chapters?.length || 0})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('goal')}
          className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'goal'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          লেখার লক্ষ্য
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* ================= HEADINGS ================= */}
        {activeTab === 'headings' && (
          <div>
            {headings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                কোনো হেডিং তৈরি করা হয়নি। লেখায় হেডিং ১, ২ বা ৩ যোগ করলে এখানে তালিকা আসবে।
              </div>
            ) : (
              <div className="space-y-1">
                {headings.map((h, idx) => (
                  <button
                    key={`${h.pos}-${idx}`}
                    type="button"
                    onClick={() => {
                      handleJumpToPos(h.pos);
                      onClose();
                    }}
                    className="w-full text-left py-2 px-2.5 rounded-lg text-xs font-medium hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 group"
                    style={{ paddingLeft: `${(h.level - 1) * 14 + 10}px` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 opacity-70 group-hover:scale-125 transition-transform" />
                    <span className="truncate">{h.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= CHAPTERS (BOOK MODE) ================= */}
        {activeTab === 'chapters' && (
          <div className="space-y-4">
            {/* Add chapter */}
            <form onSubmit={handleAddChapter} className="flex gap-2">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="নতুন অধ্যায়ের নাম..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newChapterTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Chapter List */}
            <div className="space-y-1.5">
              {(project.chapters || []).map((ch, idx) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-mono font-bold text-teal-600">
                      {toBengaliNumber(idx + 1)}.
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {ch.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteChapter(ch.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Book Cover and Frontmatter Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={onOpenCoverEditor}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100"
              >
                <Image className="w-4 h-4" />
                বইয়ের কভার পেজ ও তথ্য সম্পাদনা
              </button>
            </div>
          </div>
        )}

        {/* ================= WRITING GOAL ================= */}
        {activeTab === 'goal' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  দৈনিক লেখার অগ্রগতি
                </span>
                <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>আজকের শব্দ: {toBengaliNumber(currentWords)}</span>
                <span>লক্ষ্য: {toBengaliNumber(targetGoal)}</span>
              </div>
            </div>

            {/* Set Target Goal */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                লক্ষ্য পরিবর্তন করুন (শব্দ সংখ্যা)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors"
                >
                  সেট করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
