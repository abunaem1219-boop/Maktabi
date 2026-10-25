import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getMuktolipiEditorExtensions } from './editorExtensions';
import { Project, AppSettings } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { mmToPx } from '../../utils/units';
import { toBengaliNumber, calculateTextStats } from '../../utils/bengali';

import { RibbonToolbar } from './toolbar/RibbonToolbar';
import { MobileFormatBar } from './toolbar/MobileFormatBar';
import { SelectionBubbleMenu } from './toolbar/SelectionBubbleMenu';
import { Ruler } from './Ruler';

import { TablePickerModal } from './panels/TablePickerModal';
import { SymbolPickerModal } from './panels/SymbolPickerModal';
import { ImageInsertModal } from './panels/ImageInsertModal';
import { LinkModal } from './panels/LinkModal';
import { HeaderFooterModal } from './HeaderFooterModal';
import { FindReplaceModal } from './panels/FindReplaceModal';
import { WordStatsModal } from './panels/WordStatsModal';
import { CommentsDrawer } from './panels/CommentsDrawer';
import { OutlineDrawer } from './panels/OutlineDrawer';
import { CoverPageModal } from './panels/CoverPageModal';
import { ExportModal } from '../export/ExportModal';

import {
  ArrowLeft, ZoomIn, ZoomOut,
  FileDown, Minimize2, Smartphone, FileText
} from 'lucide-react';

interface EditorCanvasProps {
  project: Project;
  settings: AppSettings;
  language: Language;
  onUpdateProject: (updates: Partial<Project>) => void;
  onBackToLibrary: () => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  project,
  settings,
  language,
  onUpdateProject,
  onBackToLibrary,
}) => {
  const t = translations[language];

  // View state
  const [zoom, setZoom] = useState<number>(1);
  const [viewLayout, setViewLayout] = useState<'print' | 'reflow'>('print');
  const [pageMode, setPageMode] = useState<'white' | 'night'>(settings.pageTheme || 'white');
  const [rulerVisible, setRulerVisible] = useState<boolean>(settings.rulerVisible ?? true);
  const [spellcheck, setSpellcheck] = useState<boolean>(settings.spellcheck ?? true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Multi-page measurement driven by decoration pagination
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showHeaderFooterModal, setShowHeaderFooterModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showWordStats, setShowWordStats] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Selected text for comment / link
  const [selectedText, setSelectedText] = useState('');

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveProjectContent = useCallback(
    (newContent: any, wordCount: number, charCount: number) => {
      setSaveStatus('saving');
      onUpdateProject({
        content: newContent,
        wordCount,
        charCount,
        updatedAt: Date.now(),
      });
      setTimeout(() => {
        setSaveStatus('saved');
      }, 300);
    },
    [onUpdateProject]
  );

  // Initialize Tiptap Editor with centralized Muktolipi extensions
  const editor = useEditor({
    extensions: getMuktolipiEditorExtensions({
      project,
      isPaginated: viewLayout === 'print',
      onPageCountChange: (count, curr) => {
        setPageCount(count);
        setCurrentPage(curr);
      },
      onEditHeaderFooter: () => setShowHeaderFooterModal(true),
    }),
    content: project.content || { type: 'doc', content: [{ type: 'paragraph' }] },
    autofocus: true,
    editorProps: {
      attributes: {
        class:
          'muktolipi-prose prose prose-teal max-w-none focus:outline-hidden min-h-[400px] leading-relaxed transition-colors',
        spellcheck: spellcheck ? 'true' : 'false',
        lang: 'bn',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setSaveStatus('saving');
      const text = currentEditor.getText();
      const stats = calculateTextStats(text);

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        saveProjectContent(currentEditor.getJSON(), stats.words, stats.chars);
      }, settings.autoSaveIntervalMs || 1000);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to } = currentEditor.state.selection;
      if (from !== to) {
        setSelectedText(currentEditor.state.doc.textBetween(from, to, ' '));
      }
    },
  });

  // Flush save synchronously before exit / unmount / tab close
  const flushSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (editor && !editor.isDestroyed) {
      const text = editor.getText();
      const stats = calculateTextStats(text);
      saveProjectContent(editor.getJSON(), stats.words, stats.chars);
    }
  }, [editor, saveProjectContent]);

  // Handle visibility change, beforeunload, and unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushSave();
      }
    };
    const handleBeforeUnload = () => {
      flushSave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushSave();
    };
  }, [flushSave]);

  const handleBackToLibrary = () => {
    flushSave();
    onBackToLibrary();
  };

  // Page geometry
  const pageWidthPx = mmToPx(project.pageSetup.widthMm);
  const pageHeightPx = mmToPx(project.pageSetup.heightMm);
  const leftMarginPx = mmToPx(project.pageSetup.margins.left);
  const rightMarginPx = mmToPx(project.pageSetup.margins.right);

  // Fit Width calculation
  const handleFitWidth = useCallback(() => {
    if (pagesContainerRef.current) {
      const availableWidth = pagesContainerRef.current.clientWidth - 32;
      const fit = Math.min(2.5, Math.max(0.35, availableWidth / pageWidthPx));
      setZoom(Math.round(fit * 100) / 100);
    }
  }, [pageWidthPx]);

  // Auto-fit on mobile screens on initial load
  useEffect(() => {
    if (pagesContainerRef.current) {
      const availableWidth = pagesContainerRef.current.clientWidth - 32;
      if (availableWidth < pageWidthPx) {
        const fit = Math.min(2, Math.max(0.35, availableWidth / pageWidthPx));
        setZoom(Math.round(fit * 100) / 100);
      }
    }
  }, [pageWidthPx]);

  // Touch pinch-to-zoom and double-tap gestures
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.35, Math.round(touchStartZoomRef.current * factor * 100) / 100));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }
    // Double tap toggle between Fit Width and 100%
    if (e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (Math.abs(zoom - 1) < 0.1) {
          handleFitWidth();
        } else {
          setZoom(1);
        }
      }
      lastTapRef.current = now;
    }
  };

  // Keyboard shortcut listener for Ctrl+S, Ctrl+P, Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowExportModal(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flushSave]);

  // Page background style depending on white page vs night page
  const isNightPage = pageMode === 'night';
  const pagePaperBg = isNightPage ? 'bg-[#1e1e1e] text-[#f1f5f9]' : 'bg-white text-[#0f172a]';
  const canvasBg = 'bg-slate-200/75 dark:bg-slate-950';

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* 1. Top Application Bar */}
      {!isFocusMode && (
        <header className="no-print flex items-center justify-between px-3 md:px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBackToLibrary}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="লাইব্রেরিতে ফিরে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Document Title & Type */}
            <div className="min-w-0 flex flex-col">
              <input
                type="text"
                value={project.title}
                onChange={(e) => onUpdateProject({ title: e.target.value })}
                className="text-sm md:text-base font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:outline-hidden focus:ring-1 focus:ring-teal-500 rounded-sm px-1 py-0.5 truncate max-w-[160px] sm:max-w-xs md:max-w-md"
                placeholder="প্রজেক্ট শিরোনাম..."
              />
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1 truncate">
                <span>{project.type === 'book' ? 'বই মোড' : 'ডকুমেন্ট'}</span>
                <span>·</span>
                <span className="font-mono">{project.pageSetup.size}</span>
                <span>·</span>
                <span className="text-teal-600 dark:text-teal-400 font-medium">
                  {saveStatus === 'saved' ? t.saved : t.saving}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Mobile view toggle, stats, export) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile View Toggle: Mobile View ⇄ Page View */}
            <button
              type="button"
              onClick={() => setViewLayout((prev) => (prev === 'print' ? 'reflow' : 'print'))}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 sm:hidden"
              title={viewLayout === 'print' ? 'মোবাইল রিফ্লো ভিউ' : 'প্রিন্ট পেজ ভিউ'}
            >
              {viewLayout === 'print' ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  <span>মোবাইল</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>পেজ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowWordStats(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              title="পরিসংখ্যান"
            >
              <span className="font-mono font-bold text-teal-600">
                {settings.useBengaliDigits ? toBengaliNumber(project.wordCount || 0) : project.wordCount || 0}
              </span>
              <span>শব্দ</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden xs:inline">এক্সপোর্ট</span>
            </button>
          </div>
        </header>
      )}

      {/* 2. Ribbon Toolbar */}
      {!isFocusMode && (
        <RibbonToolbar
          editor={editor}
          project={project}
          language={language}
          onUpdateProject={onUpdateProject}
          onOpenTableModal={() => setShowTableModal(true)}
          onOpenImageModal={() => setShowImageModal(true)}
          onOpenLinkModal={() => setShowLinkModal(true)}
          onOpenSymbolModal={() => setShowSymbolModal(true)}
          onOpenHeaderFooterModal={() => setShowHeaderFooterModal(true)}
          onOpenFindReplace={() => setShowFindReplace(true)}
          onOpenComments={() => setShowComments(true)}
          onOpenOutline={() => setShowOutline(true)}
          onOpenWordStats={() => setShowWordStats(true)}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          isFocusMode={isFocusMode}
          pageMode={pageMode}
          onSetPageMode={setPageMode}
          viewLayout={viewLayout}
          onSetViewLayout={setViewLayout}
          rulerVisible={rulerVisible}
          onToggleRuler={() => setRulerVisible(!rulerVisible)}
          spellcheck={spellcheck}
          onToggleSpellcheck={() => setSpellcheck(!spellcheck)}
        />
      )}

      {/* 3. Document Ruler (Hidden on mobile <768px per RC4) */}
      {!isFocusMode && rulerVisible && viewLayout === 'print' && (
        <div className="no-print ruler-root hidden md:block">
          <Ruler pageWidthMm={project.pageSetup.widthMm} margins={project.pageSetup.margins} zoom={zoom} />
        </div>
      )}

      {/* 4. Canvas Viewport Area */}
      <main
        ref={pagesContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 overflow-auto p-2 sm:p-4 md:p-8 flex flex-col items-center relative ${canvasBg} transition-colors`}
        onClick={(e) => {
          if (e.target === e.currentTarget && editor) {
            editor.commands.focus('end');
          }
        }}
      >
        {/* Floating Bubble Menu on text selection (desktop only per RC5) */}
        <SelectionBubbleMenu
          editor={editor}
          onOpenLinkModal={() => setShowLinkModal(true)}
          onOpenColorPicker={() => {}}
        />

        {/* Paper Sheet Container */}
        {viewLayout === 'print' ? (
          <div
            className="w-full flex justify-center py-2 sm:py-4 overflow-visible"
            style={{ minWidth: 'min-content' }}
          >
            {/* Outer zoom wrapper sizing container */}
            <div
              style={{
                width: `${pageWidthPx * zoom}px`,
                margin: '0 auto',
                transition: 'width 75ms ease-out',
              }}
            >
              {/* Inner scaled container */}
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  width: `${pageWidthPx}px`,
                }}
              >
                {/* The WYSIWYG Page Sheet */}
                <div
                  className={`muktolipi-page-sheet relative rounded-sm shadow-xl transition-colors border border-slate-300/80 dark:border-slate-800 print:border-none print:shadow-none print:rounded-none ${pagePaperBg}`}
                  style={{
                    width: `${pageWidthPx}px`,
                    minHeight: `${pageHeightPx}px`,
                    paddingLeft: `${leftMarginPx}px`,
                    paddingRight: `${rightMarginPx}px`,
                  }}
                  data-page-index="1"
                >
                  {/* Watermark Overlay (if enabled) */}
                  {project.watermark?.enabled && project.watermark.text && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
                      style={{
                        opacity: project.watermark.opacity || 0.15,
                        transform: `rotate(${project.watermark.angle || -45}deg)`,
                      }}
                    >
                      <span
                        className="text-6xl md:text-8xl font-bold whitespace-nowrap tracking-widest uppercase font-serif"
                        style={{ color: project.watermark.color || '#64748b' }}
                      >
                        {project.watermark.text}
                      </span>
                    </div>
                  )}

                  {/* Tiptap Editor Content */}
                  <div
                    ref={contentWrapperRef}
                    className="min-h-[500px] cursor-text select-text relative z-10"
                    onClick={() => {
                      if (editor && !editor.isFocused) {
                        editor.commands.focus();
                      }
                    }}
                  >
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Reflow / Web Layout Mode for phone writing */
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-800 transition-colors my-2 sm:my-4">
            <EditorContent editor={editor} className="cursor-text select-text" />
          </div>
        )}
      </main>

      {/* 5. Mobile Floating Quick-Bar (Above keyboard, Android ergonomic) */}
      <MobileFormatBar editor={editor} />

      {/* 6. Bottom Status Bar */}
      {!isFocusMode && (
        <footer className="no-print status-bar-root flex items-center justify-between px-3 md:px-6 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 z-30 shrink-0 select-none">
          {/* Left: Page count and words */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-medium text-[11px] sm:text-xs">
              পেজ{' '}
              <strong className="text-teal-600 dark:text-teal-400">
                {settings.useBengaliDigits ? toBengaliNumber(currentPage) : currentPage}
              </strong>{' '}
              /{' '}
              {settings.useBengaliDigits ? toBengaliNumber(pageCount) : pageCount}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-[11px] sm:text-xs">
              <strong className="text-slate-900 dark:text-white">
                {settings.useBengaliDigits
                  ? toBengaliNumber(project.wordCount || 0)
                  : project.wordCount || 0}
              </strong>{' '}
              শব্দ
            </span>
          </div>

          {/* Right: Zoom controls, Fit and 100% buttons always accessible */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              title="জুম কমান"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] tabular-nums w-10 text-center font-semibold">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              title="জুম বাড়ান"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFitWidth}
              className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 rounded-md transition-colors"
              title="স্ক্রিনের প্রস্থে ফিট করুন"
            >
              Fit
            </button>

            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 rounded-md transition-colors"
              title="১০০% জুম"
            >
              100%
            </button>
          </div>
        </footer>
      )}

      {/* Floating Exit Focus Mode Button */}
      {isFocusMode && (
        <button
          type="button"
          onClick={() => setIsFocusMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs backdrop-blur-md hover:bg-slate-900 shadow-xl transition-all"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>ফোকাস মোড ত্যাগ করুন</span>
        </button>
      )}

      {/* Modals & Slide-out Panels */}
      {showTableModal && (
        <TablePickerModal
          onInsertTable={(rows, cols) => {
            editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
          }}
          onClose={() => setShowTableModal(false)}
        />
      )}

      {showSymbolModal && (
        <SymbolPickerModal
          onInsertSymbol={(symbol) => {
            editor?.chain().focus().insertContent(symbol).run();
          }}
          onClose={() => setShowSymbolModal(false)}
        />
      )}

      {showImageModal && (
        <ImageInsertModal
          onInsertImage={(src, alt) => {
            editor?.chain().focus().setImage({ src, alt }).run();
          }}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {showLinkModal && (
        <LinkModal
          initialUrl={editor?.getAttributes('link').href || ''}
          initialText={selectedText}
          onSetLink={(url, text) => {
            if (text && text !== selectedText) {
              editor?.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
            } else {
              editor?.chain().focus().setLink({ href: url }).run();
            }
          }}
          onRemoveLink={() => {
            editor?.chain().focus().unsetLink().run();
          }}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {showHeaderFooterModal && (
        <HeaderFooterModal
          project={project}
          language={language}
          onSave={onUpdateProject}
          onClose={() => setShowHeaderFooterModal(false)}
        />
      )}

      {showFindReplace && (
        <FindReplaceModal editor={editor} onClose={() => setShowFindReplace(false)} />
      )}

      {showWordStats && (
        <WordStatsModal
          text={editor?.getText() || ''}
          onClose={() => setShowWordStats(false)}
          useBengaliDigits={settings.useBengaliDigits}
        />
      )}

      {showComments && (
        <CommentsDrawer
          project={project}
          selectedText={selectedText}
          onUpdateComments={(comments) => onUpdateProject({ comments })}
          onClose={() => setShowComments(false)}
        />
      )}

      {showOutline && (
        <OutlineDrawer
          editor={editor}
          project={project}
          onUpdateProject={onUpdateProject}
          onClose={() => setShowOutline(false)}
          onOpenCoverEditor={() => {
            setShowOutline(false);
            setShowCoverModal(true);
          }}
        />
      )}

      {showCoverModal && (
        <CoverPageModal
          project={project}
          onUpdateProject={onUpdateProject}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          project={project}
          language={language}
          pagesContainerRef={pagesContainerRef}
          editorHtml={editor?.getHTML() || ''}
          editorText={editor?.getText() || ''}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
