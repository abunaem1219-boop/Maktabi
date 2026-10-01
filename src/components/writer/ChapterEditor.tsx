import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocalChapter, WriterSettings } from '../../types/writer';
import { sanitizeHtml } from '../../utils/sanitize';
import { toBengaliNumerals } from '../../utils/formatters';

interface ChapterEditorProps {
  chapter: LocalChapter;
  onUpdateChapter: (updates: Partial<LocalChapter>) => void;
  savedSelectionRef: React.MutableRefObject<Range | null>;
  editorRef: React.RefObject<HTMLDivElement | null>;
  settings: WriterSettings;
  onAutosavingChange?: (saving: boolean) => void;
  onOpenLinkModal: () => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapter,
  onUpdateChapter,
  savedSelectionRef,
  editorRef,
  settings,
  onAutosavingChange,
  onOpenLinkModal,
}) => {
  const [title, setTitle] = useState(chapter.title);
  const [wordCount, setWordCount] = useState(chapter.wordCount || 0);
  const [charCount, setCharCount] = useState(chapter.characterCount || 0);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalChangeRef = useRef(false);

  // Sync internal title state when chapter prop changes
  useEffect(() => {
    setTitle(chapter.title);
  }, [chapter.id, chapter.title]);

  // Sync editor innerHTML when chapter ID changes
  useEffect(() => {
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      editorRef.current.innerHTML = chapter.content || '';
      updateMetrics(editorRef.current.innerText || '');
      isInternalChangeRef.current = false;
    }
  }, [chapter.id]);

  const updateMetrics = (text: string) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    setCharCount(chars);
    setWordCount(words);
  };

  // Debounced autosave
  const triggerAutosave = useCallback(
    (newContent: string, newTitle: string) => {
      if (onAutosavingChange) onAutosavingChange(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const sanitized = sanitizeHtml(newContent);
        const plainText = editorRef.current?.innerText || '';
        const words = plainText.trim() ? plainText.trim().split(/\s+/).filter(Boolean).length : 0;
        const chars = plainText.length;

        onUpdateChapter({
          title: newTitle.trim() || 'শিরোনামহীন অধ্যায়',
          content: sanitized,
          wordCount: words,
          characterCount: chars,
          updatedAt: Date.now(),
        });

        if (onAutosavingChange) onAutosavingChange(false);
      }, 500);
    },
    [onUpdateChapter, onAutosavingChange, editorRef]
  );

  const handleInput = () => {
    if (isInternalChangeRef.current) return;
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText || '';
      updateMetrics(text);
      triggerAutosave(html, title);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const html = editorRef.current ? editorRef.current.innerHTML : chapter.content;
    triggerAutosave(html, newTitle);
  };

  // Track selection for toolbar popups
  const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold', false);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        document.execCommand('italic', false);
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        document.execCommand('underline', false);
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        document.execCommand(e.shiftKey ? 'redo' : 'undo', false);
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        document.execCommand('redo', false);
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenLinkModal();
      }
    }
  };

  // Safe paste handler
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');

    if (html) {
      // Sanitize pasted HTML cleanly
      const cleanHtml = sanitizeHtml(html);
      document.execCommand('insertHTML', false, cleanHtml);
    } else {
      // Plain text fallback
      document.execCommand('insertText', false, text);
    }

    handleInput();
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto bg-stone-100/70 dark:bg-stone-950 p-2 sm:p-6 lg:p-8"
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
    >
      <div
        className={`w-full max-w-4xl mx-auto flex-1 flex flex-col transition-all ${
          settings.paperMode
            ? 'bg-amber-50/50 dark:bg-stone-900 shadow-md border border-amber-200/60 dark:border-stone-800 rounded-3xl p-6 sm:p-12'
            : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-10 shadow-xs'
        }`}
      >
        {/* Chapter Title Field */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="অধ্যায়ের শিরোনাম..."
          className="w-full text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 dark:text-stone-100 pb-3 mb-4 border-b border-stone-200 dark:border-stone-800 focus:outline-hidden focus:border-amber-600 transition-colors bg-transparent placeholder:text-stone-300 dark:placeholder:text-stone-700"
        />

        {/* Rich-Text ContentEditable Canvas */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          spellCheck={settings.spellCheck}
          className="flex-1 focus:outline-hidden prose prose-stone dark:prose-invert max-w-none min-h-[50vh] leading-relaxed text-stone-800 dark:text-stone-200"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
          }}
          data-placeholder="এখানে লেখা শুরু করুন..."
        />

        {/* Word and Character Count bar */}
        <div className="pt-4 mt-6 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
          <div className="flex items-center gap-4">
            <span>শব্দ: {toBengaliNumerals(wordCount)}</span>
            <span>অক্ষর: {toBengaliNumerals(charCount)}</span>
          </div>
          <span>স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে</span>
        </div>
      </div>
    </div>
  );
};
