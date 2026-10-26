import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Project, PageSetup } from '../../../types';
import { translations, Language } from '../../../utils/i18n';
import { AVAILABLE_FONTS, FontItem } from '../../../utils/fonts';
import { ColorPickerPopover } from '../../../components/ui/ColorPickerPopover';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Indent as IndentIcon, Outdent,
  Undo2, Redo2, Search, Paintbrush, Palette, Highlighter, RemoveFormatting,
  Type, Image as ImageIcon, Table as TableIcon, Link as LinkIcon,
  BookOpen, Sparkles, FileText, LayoutGrid, Eye, CheckCircle2,
  Rows, Columns, Trash2, Calendar, SplitSquareVertical, Minus, Compass, ArrowLeftRight,
  Hand
} from 'lucide-react';

interface RibbonToolbarProps {
  editor: Editor | null;
  project: Project;
  language: Language;
  onUpdateProject: (updates: Partial<Project>) => void;
  onOpenTableModal: () => void;
  onOpenImageModal: () => void;
  onOpenLinkModal: () => void;
  onOpenSymbolModal: () => void;
  onOpenHeaderFooterModal: () => void;
  onOpenFindReplace: () => void;
  onOpenComments: () => void;
  onOpenOutline: () => void;
  onOpenWordStats: () => void;
  onToggleFocusMode: () => void;
  isFocusMode: boolean;
  pageMode: 'white' | 'night';
  onSetPageMode: (mode: 'white' | 'night') => void;
  viewLayout: 'print' | 'reflow';
  onSetViewLayout: (layout: 'print' | 'reflow') => void;
  rulerVisible: boolean;
  onToggleRuler: () => void;
  spellcheck: boolean;
  onToggleSpellcheck: () => void;
  isPanMode?: boolean;
  onTogglePanMode?: () => void;
}

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  editor,
  project,
  language,
  onUpdateProject,
  onOpenTableModal,
  onOpenImageModal,
  onOpenLinkModal,
  onOpenSymbolModal,
  onOpenHeaderFooterModal,
  onOpenFindReplace,
  onOpenComments,
  onOpenOutline,
  onOpenWordStats,
  onToggleFocusMode,
  isFocusMode,
  pageMode,
  onSetPageMode,
  viewLayout,
  onSetViewLayout,
  rulerVisible,
  onToggleRuler,
  spellcheck,
  onToggleSpellcheck,
  isPanMode = false,
  onTogglePanMode,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout' | 'review' | 'view'>('home');

  // Popovers
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLineHeightMenu, setShowLineHeightMenu] = useState(false);
  const [showCaseMenu, setShowCaseMenu] = useState(false);

  // Format Painter state
  const [copiedFormat, setCopiedFormat] = useState<any | null>(null);

  if (!editor) return null;

  // Active state helpers
  const isBold = editor.isActive('bold');
  const isItalic = editor.isActive('italic');
  const isUnderline = editor.isActive('underline');
  const isStrike = editor.isActive('strike');
  const isSubscript = editor.isActive('subscript');
  const isSuperscript = editor.isActive('superscript');
  const isBulletList = editor.isActive('bulletList');
  const isOrderedList = editor.isActive('orderedList');
  const isTaskList = editor.isActive('taskList');
  const isTable = editor.isActive('table');

  // Format painter handler
  const handleCopyFormat = () => {
    const attrs = editor.getAttributes('textStyle');
    const marks = {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      color: attrs.color || null,
      fontFamily: attrs.fontFamily || null,
      fontSize: attrs.fontSize || null,
    };
    setCopiedFormat(marks);
  };

  const handleApplyFormat = () => {
    if (!copiedFormat) return;
    let chain = editor.chain().focus();
    if (copiedFormat.bold) chain = chain.setBold(); else chain = chain.unsetBold();
    if (copiedFormat.italic) chain = chain.setItalic(); else chain = chain.unsetItalic();
    if (copiedFormat.underline) chain = chain.setUnderline(); else chain = chain.unsetUnderline();
    if (copiedFormat.strike) chain = chain.setStrike(); else chain = chain.unsetStrike();
    if (copiedFormat.color) chain = chain.setColor(copiedFormat.color);
    if (copiedFormat.fontFamily) chain = chain.setFontFamily(copiedFormat.fontFamily);
    if (copiedFormat.fontSize) chain = chain.setFontSize(copiedFormat.fontSize);
    chain.run();
    setCopiedFormat(null);
  };

  // Change Case for selected text
  const handleChangeCase = (mode: 'upper' | 'lower' | 'title' | 'sentence') => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (!text) return;

    let modified = text;
    if (mode === 'upper') modified = text.toUpperCase();
    else if (mode === 'lower') modified = text.toLowerCase();
    else if (mode === 'title') {
      modified = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    } else if (mode === 'sentence') {
      modified = text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
    }
    editor.commands.insertContent(modified);
    setShowCaseMenu(false);
  };

  // Insert Table of Contents
  const handleInsertTOC = () => {
    const headings: { level: number; text: string }[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'heading') {
        headings.push({ level: node.attrs.level, text: node.textContent });
      }
    });

    if (headings.length === 0) {
      alert('ডকুমেন্টে কোনো হেডিং পাওয়া যায়নি। প্রথমে কিছু হেডিং তৈরি করুন।');
      return;
    }

    const tocHtml = `
      <div class="callout-box my-4 p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20" data-type="callout-box" data-color="teal">
        <h3 style="font-weight: bold; margin-bottom: 8px;">সূচিপত্র (Table of Contents)</h3>
        <ul style="list-style-type: none; padding-left: 0; margin: 0;">
          ${headings
            .map(
              (h) => `
            <li style="margin-left: ${(h.level - 1) * 16}px; padding: 4px 0; border-bottom: 1px dotted rgba(100,116,139,0.3); display: flex; justify-content: space-between;">
              <span>${h.text}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
    editor.commands.insertContent(tocHtml);
  };

  // Insert today's date
  const handleInsertDate = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    editor.commands.insertContent(formattedDate);
  };

  // Text Direction switch LTR/RTL
  const handleToggleTextDirection = (dir: 'ltr' | 'rtl' | 'auto') => {
    (editor.commands as any).setTextDirection?.(dir);
  };

  return (
    <div className="ribbon-toolbar-root bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs select-none sticky top-0 z-30">
      {/* 1. Ribbon Tabs Row */}
      <div className="flex items-center px-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'home', label: t.homeTab },
          { id: 'insert', label: t.insertTab },
          { id: 'layout', label: t.layoutTab },
          { id: 'review', label: t.reviewTab },
          { id: 'view', label: t.viewTab },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[42px] px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Ribbon Action Controls Row */}
      <div className="px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar min-h-[52px]">
        {/* ===================== HOME TAB ===================== */}
        {activeTab === 'home' && (
          <>
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="পূর্বাবস্থায় ফেরান (Ctrl+Z)"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="পুনরায় করুন (Ctrl+Y)"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={copiedFormat ? handleApplyFormat : handleCopyFormat}
                title={copiedFormat ? 'ফরম্যাট প্রয়োগ করুন' : 'ফরম্যাট কপি করুন (Format Painter)'}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  copiedFormat
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 animate-pulse'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
              </button>
              {onTogglePanMode && (
                <button
                  type="button"
                  onClick={onTogglePanMode}
                  title={isPanMode ? 'প্যান মোড সক্রিয় — সাধারণ লেখায় ফিরতে ক্লিক করুন' : 'প্যান মোড চালু করুন (Pan Mode)'}
                  aria-label="Pan Mode"
                  aria-pressed={isPanMode}
                  className={`min-h-[40px] px-2 flex items-center gap-1.5 rounded-lg transition-all border ${
                    isPanMode
                      ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Hand className={`w-4 h-4 ${isPanMode ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                  <span className="text-xs whitespace-nowrap">{t.panMode}</span>
                  {isPanMode && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              )}
            </div>

            {/* Font Family Dropdown */}
            <div className="pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <select
                aria-label={t.fontFamily}
                value={editor.getAttributes('textStyle').fontFamily || 'noto-sans-bengali'}
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                className="h-10 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[145px] truncate focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font.id} value={font.family}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size (+ / - / select) */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(editor.getAttributes('textStyle').fontSize || '16', 10);
                  const next = Math.max(8, current - 2);
                  editor.chain().focus().setFontSize(`${next}px`).run();
                }}
                className="w-8 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                title="ফন্ট সাইজ কমান"
              >
                −
              </button>
              <span className="text-xs font-mono font-semibold tabular-nums w-7 text-center">
                {parseInt(editor.getAttributes('textStyle').fontSize || '16', 10)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(editor.getAttributes('textStyle').fontSize || '16', 10);
                  const next = Math.min(96, current + 2);
                  editor.chain().focus().setFontSize(`${next}px`).run();
                }}
                className="w-8 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                title="ফন্ট সাইজ বাড়ান"
              >
                +
              </button>
            </div>

            {/* Bold, Italic, Underline, Strike */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isBold
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="বোল্ড (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isItalic
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="ইটালিক (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isUnderline
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="আন্ডারলাইন (Ctrl+U)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isStrike
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="স্ট্রাইকথ্রু"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isSubscript ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="সাবস্ক্রিপ্ট (H₂O)"
              >
                <Subscript className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                  isSuperscript ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="সুপারস্ক্রিপ্ট (E=mc²)"
              >
                <Superscript className="w-4 h-4" />
              </button>
            </div>

            {/* Colors (Text & Highlight) */}
            <div className="relative flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowHighlightPicker(false);
                }}
                className="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                title="টেক্সটের রং"
              >
                <Palette className="w-4 h-4" />
                <span
                  className="w-4 h-1 rounded-full mt-0.5"
                  style={{ backgroundColor: editor.getAttributes('textStyle').color || '#0d9488' }}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowColorPicker(false);
                }}
                className="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                title="হাইলাইট রং"
              >
                <Highlighter className="w-4 h-4" />
                <span
                  className="w-4 h-1 rounded-full mt-0.5"
                  style={{ backgroundColor: editor.getAttributes('highlight').color || '#fef08a' }}
                />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="সব ফরম্যাটিং মুছুন"
              >
                <RemoveFormatting className="w-4 h-4" />
              </button>

              {/* Color popovers */}
              {showColorPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <div className="absolute top-12 left-0 z-50">
                    <ColorPickerPopover
                      currentColor={editor.getAttributes('textStyle').color}
                      onSelectColor={(color) => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      onClear={() => {
                        editor.chain().focus().unsetColor().run();
                        setShowColorPicker(false);
                      }}
                      title={t.textColor}
                    />
                  </div>
                </>
              )}

              {showHighlightPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowHighlightPicker(false)}
                  />
                  <div className="absolute top-12 left-8 z-50">
                    <ColorPickerPopover
                      isHighlight
                      currentColor={editor.getAttributes('highlight').color}
                      onSelectColor={(color) => {
                        editor.chain().focus().setHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }}
                      onClear={() => {
                        editor.chain().focus().unsetHighlight().run();
                        setShowHighlightPicker(false);
                      }}
                      title={t.highlightColor}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Alignments */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="বামে সাজান"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="মাঝামাঝি"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="ডানে সাজান"
              >
                <AlignRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  editor.isActive({ textAlign: 'justify' }) ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="উভয়পাশে সমান (জাস্টিফাই)"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDir = editor.getAttributes('paragraph').dir || 'auto';
                  handleToggleTextDirection(currentDir === 'rtl' ? 'ltr' : 'rtl');
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  editor.getAttributes('paragraph').dir === 'rtl' ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : ''
                }`}
                title="টেক্সট দিক (LTR / RTL)"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Lists & Indents */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  isBulletList ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="বুলেট লিস্ট"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  isOrderedList ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="নাম্বার লিস্ট"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  isTaskList ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="চেকলিস্ট"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().decreaseIndent().run()}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="ইন্ডেন্ট কমান"
              >
                <Outdent className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().increaseIndent().run()}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="ইন্ডেন্ট বাড়ান"
              >
                <IndentIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Styles Gallery (Headings, Paragraph, Blockquote) */}
            <div className="flex items-center gap-1 shrink-0">
              <select
                aria-label="টেক্সট স্টাইল"
                value={
                  editor.isActive('heading', { level: 1 })
                    ? 'h1'
                    : editor.isActive('heading', { level: 2 })
                    ? 'h2'
                    : editor.isActive('heading', { level: 3 })
                    ? 'h3'
                    : editor.isActive('blockquote')
                    ? 'quote'
                    : 'p'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
                  else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
                  else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
                  else if (val === 'quote') editor.chain().focus().toggleBlockquote().run();
                  else editor.chain().focus().setParagraph().run();
                }}
                className="h-10 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="p">সাধারণ লেখা (Normal)</option>
                <option value="h1">হেডিং ১ (Heading 1)</option>
                <option value="h2">হেডিং ২ (Heading 2)</option>
                <option value="h3">হেডিং ৩ (Heading 3)</option>
                <option value="quote">উদ্ধৃতি (Blockquote)</option>
              </select>
            </div>
          </>
        )}

        {/* ===================== INSERT TAB ===================== */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Image */}
            <button
              type="button"
              onClick={onOpenImageModal}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.insertImage}</span>
            </button>

            {/* Table */}
            <button
              type="button"
              onClick={onOpenTableModal}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <TableIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.insertTable}</span>
            </button>

            {/* Table context actions if cursor inside table */}
            {isTable && (
              <div className="flex items-center gap-1 px-1.5 py-1 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  title="নিচে সারি যোগ"
                  className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 rounded-md text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700"
                >
                  +সারি
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  title="ডানে কলাম যোগ"
                  className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 rounded-md text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700"
                >
                  +কলাম
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  title="সারি মুছুন"
                  className="px-1.5 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                >
                  -সারি
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  title="কলাম মুছুন"
                  className="px-1.5 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                >
                  -কলাম
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  title="টেবিল মুছুন"
                  className="px-1.5 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Link */}
            <button
              type="button"
              onClick={onOpenLinkModal}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <LinkIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.insertLink}</span>
            </button>

            {/* Page Break */}
            <button
              type="button"
              onClick={() => (editor.commands as any).setPageBreak?.()}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Ctrl+Enter"
            >
              <SplitSquareVertical className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.pageBreak}</span>
            </button>

            {/* Symbols */}
            <button
              type="button"
              onClick={onOpenSymbolModal}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.symbolsAndEmoji}</span>
            </button>

            {/* Callout Box */}
            <button
              type="button"
              onClick={() => (editor.commands as any).toggleCalloutBox?.()}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.textBox}</span>
            </button>

            {/* Table of Contents */}
            <button
              type="button"
              onClick={handleInsertTOC}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.tableOfContents}</span>
            </button>

            {/* Header / Footer & Watermark */}
            <button
              type="button"
              onClick={onOpenHeaderFooterModal}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.headerFooter}</span>
            </button>

            {/* Current Date */}
            <button
              type="button"
              onClick={handleInsertDate}
              className="min-h-[44px] px-3 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.dateField}</span>
            </button>
          </div>
        )}

        {/* ===================== LAYOUT TAB ===================== */}
        {activeTab === 'layout' && (
          <div className="flex items-center gap-3 shrink-0">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.pageSize}:
              </span>
              <select
                aria-label={t.pageSize}
                value={project.pageSetup.size}
                onChange={(e) => {
                  const newSize = e.target.value as any;
                  // update page setup size
                  const currentSetup = project.pageSetup;
                  onUpdateProject({
                    pageSetup: {
                      ...currentSetup,
                      size: newSize,
                    },
                  });
                }}
                className="h-10 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="Novel">Novel (5 × 8 in)</option>
                <option value="Pocket">Pocket (4.25 × 6.87 in)</option>
                <option value="B5">B5 (176 × 250 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
                <option value="Legal">Legal (8.5 × 14 in)</option>
                <option value="Square">Square (8 × 8 in)</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.orientationLabel}:
              </span>
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    const current = project.pageSetup;
                    let w = current.widthMm;
                    let h = current.heightMm;
                    if (w > h) [w, h] = [h, w];
                    onUpdateProject({
                      pageSetup: { ...current, orientation: 'portrait', widthMm: w, heightMm: h },
                    });
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    project.pageSetup.orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.portrait}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = project.pageSetup;
                    let w = current.widthMm;
                    let h = current.heightMm;
                    if (w < h) [w, h] = [h, w];
                    onUpdateProject({
                      pageSetup: { ...current, orientation: 'landscape', widthMm: w, heightMm: h },
                    });
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    project.pageSetup.orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.landscape}
                </button>
              </div>
            </div>

            {/* Margins */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.margins}:
              </span>
              <select
                aria-label={t.margins}
                value={project.pageSetup.presetName || 'normal'}
                onChange={(e) => {
                  const val = e.target.value;
                  const current = project.pageSetup;
                  let margins = { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 };
                  if (val === 'narrow') margins = { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 };
                  else if (val === 'moderate') margins = { top: 25.4, bottom: 25.4, left: 19.05, right: 19.05 };
                  else if (val === 'wide') margins = { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8 };
                  else if (val === 'mirrored') margins = { top: 25.4, bottom: 25.4, left: 31.75, right: 25.4 };

                  onUpdateProject({
                    pageSetup: {
                      ...current,
                      presetName: val,
                      margins,
                    },
                  });
                }}
                className="h-10 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="normal">সাধারণ (Normal 25.4mm)</option>
                <option value="narrow">সংকীর্ণ (Narrow 12.7mm)</option>
                <option value="moderate">পরিমিত (Moderate 19mm)</option>
                <option value="wide">প্রশস্ত (Wide 50.8mm)</option>
                <option value="mirrored">বই বাঁধানোর জন্য (Mirrored)</option>
              </select>
            </div>
          </div>
        )}

        {/* ===================== REVIEW TAB ===================== */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Find & Replace */}
            <button
              type="button"
              onClick={onOpenFindReplace}
              className="min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.findReplace}</span>
            </button>

            {/* Word Count Statistics */}
            <button
              type="button"
              onClick={onOpenWordStats}
              className="min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.wordCountDetails}</span>
            </button>

            {/* Spellcheck Toggle */}
            <button
              type="button"
              onClick={onToggleSpellcheck}
              className={`min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg border transition-colors ${
                spellcheck
                  ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-300'
                  : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">
                {t.spellcheck}: {spellcheck ? 'চালু' : 'বন্ধ'}
              </span>
            </button>

            {/* Comments */}
            <button
              type="button"
              onClick={onOpenComments}
              className="min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span className="text-xs font-medium whitespace-nowrap">{t.comments}</span>
              {project.comments && project.comments.length > 0 && (
                <span className="px-1.5 py-0.2 bg-teal-600 text-white rounded-full text-[10px] font-bold">
                  {project.comments.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ===================== VIEW TAB ===================== */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-2 shrink-0">
            {/* View Layout Mode (Print Page vs Reflow) */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => onSetViewLayout('print')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewLayout === 'print'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.printLayout}
              </button>
              <button
                type="button"
                onClick={() => onSetViewLayout('reflow')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewLayout === 'reflow'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.reflowLayout}
              </button>
            </div>

            {/* Page Display Mode (White vs Night page) */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => onSetPageMode('white')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  pageMode === 'white'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.whitePage}
              </button>
              <button
                type="button"
                onClick={() => onSetPageMode('night')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  pageMode === 'night'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.nightPage}
              </button>
            </div>

            {/* Document Outline Drawer */}
            <button
              type="button"
              onClick={onOpenOutline}
              className="min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.outlineDrawer}</span>
            </button>

            {/* Toggle Ruler */}
            <button
              type="button"
              onClick={onToggleRuler}
              className={`min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg border transition-colors ${
                rulerVisible
                  ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-300'
                  : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">{t.showRuler}</span>
            </button>

            {/* Pan Mode */}
            {onTogglePanMode && (
              <button
                type="button"
                onClick={onTogglePanMode}
                className={`min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg border transition-all ${
                  isPanMode
                    ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isPanMode ? 'প্যান মোড বন্ধ করুন' : 'প্যান মোড চালু করুন'}
                aria-pressed={isPanMode}
                aria-label="Pan Mode"
              >
                <Hand className={`w-4 h-4 ${isPanMode ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                <span className="text-xs font-medium whitespace-nowrap">
                  {t.panMode}: {isPanMode ? 'চালু' : 'বন্ধ'}
                </span>
                {isPanMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            )}

            {/* Focus Mode */}
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="min-h-[44px] px-3.5 flex items-center gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium whitespace-nowrap">{t.focusMode}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
