import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { X, Search, Replace, ChevronDown, ChevronUp } from 'lucide-react';
import { toBengaliNumber } from '../../../utils/bengali';

interface FindReplaceModalProps {
  editor: Editor | null;
  onClose: () => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  editor,
  onClose,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Search in doc
  const handleFind = (term: string) => {
    setFindText(term);
    if (!editor || !term.trim()) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }

    const text = editor.getText();
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const matches = text.match(regex);
    setMatchCount(matches ? matches.length : 0);
    setCurrentMatchIndex(matches && matches.length > 0 ? 1 : 0);
  };

  const handleReplaceSingle = () => {
    if (!editor || !findText.trim()) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, ' ');
    const isMatched = matchCase
      ? selected === findText
      : selected.toLowerCase() === findText.toLowerCase();

    if (isMatched) {
      editor.commands.insertContent(replaceText);
      handleFind(findText);
    } else {
      // Find next occurrence and select it
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!editor || !findText.trim()) return;
    const currentHtml = editor.getHTML();
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const replacedHtml = currentHtml.replace(regex, replaceText);
    editor.commands.setContent(replacedHtml);
    setMatchCount(0);
  };

  const handleFindNext = () => {
    if (!editor || !findText.trim()) return;
    const content = editor.getText();
    const search = matchCase ? findText : findText.toLowerCase();
    const target = matchCase ? content : content.toLowerCase();
    const index = target.indexOf(search, editor.state.selection.to);
    const foundIndex = index !== -1 ? index : target.indexOf(search);

    if (foundIndex !== -1) {
      editor.chain().setTextSelection({ from: foundIndex + 1, to: foundIndex + 1 + findText.length }).focus().run();
      setCurrentMatchIndex((prev) => (prev < matchCount ? prev + 1 : 1));
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-80 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>খুঁজুন ও প্রতিস্থাপন (Find & Replace)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Find input */}
      <div className="space-y-1.5">
        <div className="relative">
          <input
            type="text"
            value={findText}
            onChange={(e) => handleFind(e.target.value)}
            placeholder="কী খুঁজতে চান..."
            className="w-full pl-3 pr-16 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          {matchCount > 0 && (
            <span className="absolute right-2 top-1.5 text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">
              {toBengaliNumber(currentMatchIndex)}/{toBengaliNumber(matchCount)}
            </span>
          )}
        </div>

        {/* Replace input */}
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="কী দিয়ে বদলাবেন..."
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Match case checkbox */}
      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 select-none">
        <input
          type="checkbox"
          checked={matchCase}
          onChange={(e) => {
            setMatchCase(e.target.checked);
            handleFind(findText);
          }}
          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        <span>কেস মিলিয়ে (Match Case)</span>
      </label>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleFindNext}
          disabled={matchCount === 0}
          className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          পরবর্তী (Next)
        </button>
        <button
          type="button"
          onClick={handleReplaceSingle}
          disabled={matchCount === 0}
          className="py-1.5 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          বদলে দিন
        </button>
        <button
          type="button"
          onClick={handleReplaceAll}
          disabled={matchCount === 0}
          className="col-span-2 py-1.5 px-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 shadow-xs"
        >
          সবগুলো বদলে দিন ({toBengaliNumber(matchCount)})
        </button>
      </div>
    </div>
  );
};
