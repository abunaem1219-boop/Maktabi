import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Palette,
  Highlighter,
  ChevronDown,
  Type,
  MoreHorizontal,
  X,
  RemoveFormatting,
} from 'lucide-react';

interface WriterToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onOpenLinkModal: () => void;
  onOpenImageModal: () => void;
  onClearFormatting: () => void;
  savedSelectionRef: React.MutableRefObject<Range | null>;
  activeFormats: Record<string, boolean | string>;
}

const TEXT_COLORS = [
  { label: 'কালো', value: '#1c1917' },
  { label: 'ধূসর', value: '#57534e' },
  { label: 'লাল', value: '#b91c1c' },
  { label: 'খয়েরি', value: '#92400e' },
  { label: 'সবুজ', value: '#15803d' },
  { label: 'নীল', value: '#1d4ed8' },
  { label: 'বেগুনি', value: '#7e22ce' },
];

const HIGHLIGHT_COLORS = [
  { label: 'নেই', value: 'transparent' },
  { label: 'হলুদ', value: '#fef08a' },
  { label: 'কমলা', value: '#fed7aa' },
  { label: 'সবুজ', value: '#bbf7d0' },
  { label: 'নীল', value: '#bae6fd' },
  { label: 'গোলাপি', value: '#fbcfe8' },
];

const FONT_FAMILIES = [
  { label: 'হিন্দ শিলিগুড়ি', value: '"Hind Siliguri", sans-serif' },
  { label: 'নোটো সেরিফ', value: '"Noto Serif Bengali", serif' },
  { label: 'নোটো সান্স', value: '"Noto Sans Bengali", sans-serif' },
  { label: 'ইংরেজি/সিস্টেম', value: 'Inter, system-ui, sans-serif' },
];

const FONT_SIZES = [
  { label: '১৪', value: '14px' },
  { label: '১৬', value: '16px' },
  { label: '১৮', value: '18px' },
  { label: '২০', value: '20px' },
  { label: '২৪', value: '24px' },
  { label: '২৮', value: '28px' },
];

export const WriterToolbar: React.FC<WriterToolbarProps> = ({
  onCommand,
  onOpenLinkModal,
  onOpenImageModal,
  onClearFormatting,
  savedSelectionRef,
  activeFormats,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  // Close menus on outside click
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
        setShowHeadingMenu(false);
        setShowFontMenu(false);
        setShowSizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Prevent blur when clicking toolbar buttons to preserve selection
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const exec = (cmd: string, val?: string) => {
    onCommand(cmd, val);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowHeadingMenu(false);
    setShowFontMenu(false);
    setShowSizeMenu(false);
  };

  return (
    <div
      ref={toolbarRef}
      className="sticky top-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-3 py-2 shadow-xs transition-colors"
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between max-w-5xl mx-auto gap-1 overflow-x-auto no-scrollbar">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 dark:border-stone-800 pr-1.5 shrink-0">
          <button
            onClick={() => exec('undo')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="পূর্বাবস্থায় ফিরুন (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('redo')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="পুনরায় করুন (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Headings Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            aria-label="Heading selector"
          >
            <span>হেডিং</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 z-30">
              <button
                onClick={() => exec('formatBlock', '<p>')}
                className="w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200"
              >
                সাধারণ অনুচ্ছেদ (P)
              </button>
              <button
                onClick={() => exec('formatBlock', '<h1>')}
                className="w-full text-left px-3.5 py-2 text-base font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 flex items-center gap-2"
              >
                <Heading1 className="w-4 h-4" /> বড় শিরোনাম (H1)
              </button>
              <button
                onClick={() => exec('formatBlock', '<h2>')}
                className="w-full text-left px-3.5 py-2 text-sm font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-2"
              >
                <Heading2 className="w-4 h-4" /> মাঝারি শিরোনাম (H2)
              </button>
              <button
                onClick={() => exec('formatBlock', '<h3>')}
                className="w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-2"
              >
                <Heading3 className="w-4 h-4" /> ছোট শিরোনাম (H3)
              </button>
            </div>
          )}
        </div>

        {/* Font Family (Desktop & Tablet) */}
        <div className="relative hidden sm:block shrink-0">
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            aria-label="Font family selector"
          >
            <Type className="w-3.5 h-3.5 text-stone-500" />
            <span>ফন্ট</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>
          {showFontMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 z-30">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => exec('fontName', f.value)}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size (Desktop) */}
        <div className="relative hidden md:block shrink-0">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            aria-label="Font size selector"
          >
            <span>আকার</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>
          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 z-30">
              {FONT_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => exec('fontSize', s.value)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200"
                >
                  {s.label} px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Styles: Bold, Italic, Underline, Strike */}
        <div className="flex items-center gap-0.5 border-l border-r border-stone-200 dark:border-stone-800 px-1.5 shrink-0">
          <button
            onClick={() => exec('bold')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.bold
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="বোল্ড (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('italic')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.italic
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="ইটালিক (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('underline')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeFormats.underline
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="আন্ডারলাইন (Ctrl+U)"
            aria-label="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('strikeThrough')}
            className="hidden sm:inline-flex p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="মাঝখানে দাগ (Strikethrough)"
            aria-label="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Color & Highlight */}
        <div className="flex items-center gap-0.5 border-r border-stone-200 dark:border-stone-800 pr-1.5 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="লেখার রঙ (Text Color)"
              aria-label="Text Color"
            >
              <Palette className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 flex gap-1.5 z-30">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => exec('foreColor', c.value)}
                    className="w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 transition-transform hover:scale-110"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="হাইলাইট রঙ (Highlight)"
              aria-label="Highlight"
            >
              <Highlighter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 flex gap-1.5 z-30">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => exec('hiliteColor', c.value)}
                    className="w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 transition-transform hover:scale-110 flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {c.value === 'transparent' && <X className="w-3 h-3 text-stone-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alignment (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-0.5 border-r border-stone-200 dark:border-stone-800 pr-1.5 shrink-0">
          <button
            onClick={() => exec('justifyLeft')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="বামে সারিবদ্ধ"
            aria-label="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('justifyCenter')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="মাঝে সারিবদ্ধ"
            aria-label="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('justifyRight')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="ডানে সারিবদ্ধ"
            aria-label="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('justifyFull')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="জাস্টিফাই (উভয়পাশে সমান)"
            aria-label="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-0.5 border-r border-stone-200 dark:border-stone-800 pr-1.5 shrink-0">
          <button
            onClick={() => exec('insertUnorderedList')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="বুলেট তালিকা"
            aria-label="Unordered List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('insertOrderedList')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="নম্বর তালিকা"
            aria-label="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('formatBlock', '<blockquote>')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="উদ্ধৃতি (Blockquote)"
            aria-label="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('insertHorizontalRule')}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="অনুচ্ছেদ বিভাজক রেখা (Divider)"
            aria-label="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Insert: Link, Image */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onOpenLinkModal}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="লিঙ্ক যুক্ত করুন (Ctrl+K)"
            aria-label="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenImageModal}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="ছবি যুক্ত করুন (অফলাইনেও প্রযোজ্য)"
            aria-label="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onClearFormatting}
            className="hidden sm:inline-flex p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="ফরম্যাটিং মুছে ফেলুন"
            aria-label="Clear formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile More Toggle */}
        <div className="sm:hidden shrink-0">
          <button
            onClick={() => setShowMobileMore(!showMobileMore)}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            aria-label="More formatting options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Extended Drawer/Row */}
      {showMobileMore && (
        <div className="sm:hidden pt-2 mt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => exec('justifyLeft')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('justifyCenter')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('justifyFull')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('insertUnorderedList')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('insertOrderedList')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('formatBlock', '<blockquote>')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => exec('insertHorizontalRule')}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onClearFormatting}
            className="p-1.5 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
