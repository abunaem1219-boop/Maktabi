import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Undo2, Redo2, MoreHorizontal, CheckSquare, Palette, SplitSquareVertical
} from 'lucide-react';

interface FloatingQuickBarProps {
  editor: Editor | null;
  onOpenColorPicker?: () => void;
  onOpenMoreActions?: () => void;
}

export const FloatingQuickBar: React.FC<FloatingQuickBarProps> = ({
  editor,
  onOpenColorPicker,
  onOpenMoreActions,
}) => {
  const [bottomOffset, setBottomOffset] = useState<number>(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const windowHeight = window.innerHeight;
      const viewportHeight = vv.height;
      const offsetTop = vv.offsetTop;

      // When software keyboard opens on Android/iOS, visualViewport shrinks significantly
      const diff = windowHeight - (viewportHeight + offsetTop);
      if (diff > 120) {
        setIsKeyboardOpen(true);
        setBottomOffset(Math.max(0, diff));
      } else {
        setIsKeyboardOpen(false);
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

  if (!editor) return null;

  // On desktop or when keyboard is closed, show at bottom or if focused on mobile
  return (
    <div
      className={`fixed left-0 right-0 z-40 transition-all duration-150 ease-out flex justify-center px-2 pointer-events-none ${
        isKeyboardOpen ? 'opacity-100' : 'opacity-90 hover:opacity-100'
      }`}
      style={{
        bottom: `${bottomOffset + 8}px`,
      }}
    >
      <div className="pointer-events-auto flex items-center gap-1 px-3 py-1.5 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-full shadow-2xl border border-slate-700/60 max-w-md overflow-x-auto no-scrollbar">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 disabled:opacity-30"
          title="Undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 disabled:opacity-30"
          title="Redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        {/* Bold, Italic, Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            editor.isActive('bold') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-slate-700 text-slate-200'
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            editor.isActive('italic') ? 'bg-teal-500 text-white' : 'hover:bg-slate-700 text-slate-200'
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            editor.isActive('underline') ? 'bg-teal-500 text-white' : 'hover:bg-slate-700 text-slate-200'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        {/* Bullet and Number */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            editor.isActive('bulletList') ? 'bg-teal-500 text-white' : 'hover:bg-slate-700 text-slate-200'
          }`}
          title="Bullet"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${
            editor.isActive('orderedList') ? 'bg-teal-500 text-white' : 'hover:bg-slate-700 text-slate-200'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* Font size quick steps */}
        <button
          type="button"
          onClick={() => {
            const cur = parseInt(editor.getAttributes('textStyle').fontSize || '16', 10);
            editor.chain().focus().setFontSize(`${cur + 2}px`).run();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-xs font-mono font-bold"
          title="ফন্ট সাইজ +"
        >
          A+
        </button>

        {/* Page Break */}
        <button
          type="button"
          onClick={() => (editor.commands as any).setPageBreak?.()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-200"
          title="পেজ ব্রেক"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
