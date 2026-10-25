import React, { useEffect, useState } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
  Palette, Highlighter
} from 'lucide-react';

interface SelectionBubbleMenuProps {
  editor: Editor | null;
  onOpenLinkModal: () => void;
  onOpenColorPicker?: () => void;
}

export const SelectionBubbleMenu: React.FC<SelectionBubbleMenuProps> = ({
  editor,
  onOpenLinkModal,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const match = window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(match || 'ontouchstart' in window);
    };
    checkTouch();
    const media = window.matchMedia('(pointer: coarse)');
    media.addEventListener?.('change', checkTouch);
    return () => media.removeEventListener?.('change', checkTouch);
  }, []);

  // Per RC5: NEVER render custom bubble menu on touch devices to avoid clash with native Android toolbar
  if (!editor || isTouchDevice) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state, from, to }) => {
        return !state.selection.empty && from !== to;
      }}
    >
      <div className="flex items-center gap-1 p-1 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700 select-none">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bold') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-slate-800 text-slate-200'
          }`}
          title="বোল্ড"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('italic') ? 'bg-teal-500 text-white' : 'hover:bg-slate-800 text-slate-200'
          }`}
          title="ইটালিক"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('underline') ? 'bg-teal-500 text-white' : 'hover:bg-slate-800 text-slate-200'
          }`}
          title="আন্ডারলাইন"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onOpenLinkModal();
          }}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('link') ? 'bg-teal-500 text-white' : 'hover:bg-slate-800 text-slate-200'
          }`}
          title="লিংক"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>
    </BubbleMenu>
  );
};
