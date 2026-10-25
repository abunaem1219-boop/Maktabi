import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Undo2, Redo2, Palette, Highlighter, AlignLeft, AlignCenter,
  AlignRight, SplitSquareVertical, ArrowLeftRight, ChevronRight
} from 'lucide-react';
import { ColorPickerPopover } from '../../../components/ui/ColorPickerPopover';

interface MobileFormatBarProps {
  editor: Editor | null;
  onOpenMoreRibbon?: () => void;
}

export const MobileFormatBar: React.FC<MobileFormatBarProps> = ({
  editor,
  onOpenMoreRibbon,
}) => {
  const [bottomOffset, setBottomOffset] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);

  useEffect(() => {
    if (!editor) return;

    const updateFocus = () => {
      setIsFocused(editor.isFocused || !editor.state.selection.empty);
    };

    editor.on('focus', updateFocus);
    editor.on('blur', updateFocus);
    editor.on('selectionUpdate', updateFocus);

    return () => {
      editor.off('focus', updateFocus);
      editor.off('blur', updateFocus);
      editor.off('selectionUpdate', updateFocus);
    };
  }, [editor]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const windowHeight = window.innerHeight;
      const viewportHeight = vv.height;
      const offsetTop = vv.offsetTop;

      const diff = windowHeight - (viewportHeight + offsetTop);
      if (diff > 80) {
        setBottomOffset(Math.max(0, diff));
      } else {
        setBottomOffset(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Per RC5: Hide completely when editor is not focused/active
  if (!editor || !isFocused) return null;

  const currentFontSize = parseInt(editor.getAttributes('textStyle').fontSize || '16', 10);

  return (
    <div
      className="mobile-format-bar fixed left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md select-none transition-all duration-100"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto no-scrollbar">
        {/* Undo / Redo */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          disabled={!editor.can().undo()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          disabled={!editor.can().redo()}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Bold, Italic, Underline */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
            editor.isActive('bold')
              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
            editor.isActive('italic')
              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
            editor.isActive('underline')
              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Font size - / + */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setFontSize(`${Math.max(10, currentFontSize - 2)}px`).run();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm"
          title="Font Size Minus"
        >
          A−
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setFontSize(`${Math.min(72, currentFontSize + 2)}px`).run();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm"
          title="Font Size Plus"
        >
          A+
        </button>

        {/* Bullet and Number lists */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Alignments */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('left').run();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Left Align"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('center').run();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Center Align"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().setTextAlign('right').run();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Right Align"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        {/* Text Direction toggle */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            const currentDir = editor.getAttributes('paragraph').dir || 'auto';
            const nextDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
            (editor.commands as any).setTextDirection?.(nextDir);
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="দিক পরিবর্তন (LTR / RTL)"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Page Break */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            (editor.commands as any).setPageBreak?.();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="পেজ ব্রেক"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>

        {/* More button */}
        {onOpenMoreRibbon && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onOpenMoreRibbon();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold text-xs px-2 shrink-0"
            title="আরও টুলস"
          >
            <span>আরও</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};
