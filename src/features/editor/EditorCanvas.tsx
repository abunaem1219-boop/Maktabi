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
  FileDown, Minimize2, Smartphone, FileText, Hand
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
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [isActivelyDragging, setIsActivelyDragging] = useState<boolean>(false);
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

  // Sync refs for event listeners to avoid stale closures
  const isPanModeRef = useRef(isPanMode);
  useEffect(() => {
    isPanModeRef.current = isPanMode;
  }, [isPanMode]);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Pointer drag panning refs
  const isPointerDownRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollStartRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const suppressClickUntilRef = useRef<number>(0);
  const panRafRef = useRef<number | null>(null);

  // Two-finger pinch-to-zoom & two-finger pan refs
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const pinchCenterRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const pinchContentAnchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Unified Gesture System: Native Pointer events for Pan Mode + Non-passive touch for pinch-zoom
  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container) return;

    // A. Two-finger pinch-to-zoom and two-finger pan
    // Using { passive: false } enables e.preventDefault() to block browser-level page zoom!
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        pinchStartDistRef.current = dist;
        pinchStartZoomRef.current = zoomRef.current;
        pinchCenterRef.current = { clientX: midX, clientY: midY };

        const rect = container.getBoundingClientRect();
        const clientXInContainer = midX - rect.left;
        const clientYInContainer = midY - rect.top;

        pinchContentAnchorRef.current = {
          x: clientXInContainer + container.scrollLeft,
          y: clientYInContainer + container.scrollTop,
        };
        setIsActivelyDragging(true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistRef.current !== null && pinchStartDistRef.current > 0) {
        e.preventDefault(); // Prevents browser whole-page zoom
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        const factor = dist / pinchStartDistRef.current;
        const rawTargetZoom = pinchStartZoomRef.current * factor;
        const targetZoom = Math.min(2.5, Math.max(0.35, Math.round(rawTargetZoom * 100) / 100));

        // Two-finger pan delta
        const panDeltaX = midX - pinchCenterRef.current.clientX;
        const panDeltaY = midY - pinchCenterRef.current.clientY;

        const rect = container.getBoundingClientRect();
        const clientXInContainer = midX - rect.left;
        const clientYInContainer = midY - rect.top;

        const scaleRatio = targetZoom / pinchStartZoomRef.current;
        const newScrollLeft = pinchContentAnchorRef.current.x * scaleRatio - clientXInContainer - panDeltaX;
        const newScrollTop = pinchContentAnchorRef.current.y * scaleRatio - clientYInContainer - panDeltaY;

        setZoom(targetZoom);
        container.scrollLeft = newScrollLeft;
        container.scrollTop = newScrollTop;

        hasMovedRef.current = true;
        suppressClickUntilRef.current = Date.now() + 250;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDistRef.current = null;
        if (!isPointerDownRef.current) {
          setIsActivelyDragging(false);
        }
      }
    };

    // B. Pointer Events for 1-finger Pan Mode and mouse drag
    const onPointerDown = (e: PointerEvent) => {
      if (isPanModeRef.current || e.button === 1) {
        if (e.button !== 0 && e.button !== 1) return;

        // Prevent virtual keyboard from opening on touch in Pan Mode
        e.preventDefault();

        isPointerDownRef.current = true;
        activePointerIdRef.current = e.pointerId;
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        scrollStartRef.current = {
          left: container.scrollLeft,
          top: container.scrollTop,
        };
        hasMovedRef.current = false;
        setIsActivelyDragging(true);

        try {
          container.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current || activePointerIdRef.current !== e.pointerId) return;

      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;

      if (!hasMovedRef.current && Math.hypot(dx, dy) > 3) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        if (panRafRef.current) cancelAnimationFrame(panRafRef.current);
        panRafRef.current = requestAnimationFrame(() => {
          container.scrollLeft = scrollStartRef.current.left - dx;
          container.scrollTop = scrollStartRef.current.top - dy;
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (activePointerIdRef.current === e.pointerId) {
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        setIsActivelyDragging(false);

        try {
          container.releasePointerCapture(e.pointerId);
        } catch (_) {}

        if (hasMovedRef.current) {
          suppressClickUntilRef.current = Date.now() + 200;
        }
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (activePointerIdRef.current === e.pointerId) {
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        setIsActivelyDragging(false);
        try {
          container.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    // C. Click suppression in capture phase: prevents accidental clicks on links or toolbar after dragging
    const onClickCapture = (e: MouseEvent) => {
      if (Date.now() < suppressClickUntilRef.current || isPanModeRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // D. Smooth Ctrl+Wheel and trackpad pinch-zoom anchored to pointer
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.0025;
        const currentZoom = zoomRef.current;
        const newZoom = Math.min(2.5, Math.max(0.35, Math.round((currentZoom + zoomDelta) * 100) / 100));
        if (newZoom !== currentZoom) {
          const rect = container.getBoundingClientRect();
          const pointerX = e.clientX - rect.left;
          const pointerY = e.clientY - rect.top;
          const contentX = pointerX + container.scrollLeft;
          const contentY = pointerY + container.scrollTop;
          const scaleRatio = newZoom / currentZoom;
          setZoom(newZoom);
          container.scrollLeft = contentX * scaleRatio - pointerX;
          container.scrollTop = contentY * scaleRatio - pointerY;
        }
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerCancel);
    container.addEventListener('lostpointercapture', onPointerCancel);

    container.addEventListener('click', onClickCapture, { capture: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);

      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerCancel);
      container.removeEventListener('lostpointercapture', onPointerCancel);

      container.removeEventListener('click', onClickCapture, { capture: true });
      container.removeEventListener('wheel', onWheel);

      if (panRafRef.current) cancelAnimationFrame(panRafRef.current);
    };
  }, []);

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
          isPanMode={isPanMode}
          onTogglePanMode={() => setIsPanMode(!isPanMode)}
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
        className={`flex-1 overflow-auto p-2 sm:p-4 md:p-8 flex flex-col items-center relative ${canvasBg} transition-colors ${
          isPanMode
            ? isActivelyDragging
              ? 'cursor-grabbing select-none'
              : 'cursor-grab select-none'
            : ''
        }`}
        style={{
          touchAction: isPanMode ? 'none' : 'manipulation',
          userSelect: isPanMode ? 'none' : 'auto',
          WebkitUserSelect: isPanMode ? 'none' : 'auto',
        }}
        onClick={(e) => {
          if (!isPanMode && e.target === e.currentTarget && editor) {
            editor.commands.focus('end');
          }
        }}
      >
        {/* Floating Pan Mode active indicator pill */}
        {isPanMode && (
          <div className="sticky top-2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-700/95 text-white text-xs font-medium shadow-xl backdrop-blur-md border border-teal-500/50 select-none transition-all">
            <Hand className="w-3.5 h-3.5 text-teal-200 shrink-0" />
            <span>{t.panModeActive}</span>
            <button
              type="button"
              onClick={() => setIsPanMode(false)}
              className="ml-1.5 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-bold text-white transition-colors"
            >
              {t.exitPanMode}
            </button>
          </div>
        )}

        {/* Floating Bubble Menu on text selection (desktop only per RC5) */}
        {!isPanMode && (
          <SelectionBubbleMenu
            editor={editor}
            onOpenLinkModal={() => setShowLinkModal(true)}
            onOpenColorPicker={() => {}}
          />
        )}

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
                transition: isActivelyDragging ? 'none' : 'width 75ms ease-out',
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
                    className={`min-h-[500px] relative z-10 ${
                      isPanMode ? 'pointer-events-none select-none' : 'cursor-text select-text'
                    }`}
                    onClick={() => {
                      if (!isPanMode && editor && !editor.isFocused) {
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
          <div
            className={`w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-800 transition-colors my-2 sm:my-4 ${
              isPanMode ? 'pointer-events-none select-none' : ''
            }`}
          >
            <EditorContent
              editor={editor}
              className={isPanMode ? 'pointer-events-none select-none' : 'cursor-text select-text'}
            />
          </div>
        )}
      </main>

      {/* 5. Mobile Floating Quick-Bar (Above keyboard, Android ergonomic) */}
      <MobileFormatBar
        editor={editor}
        isPanMode={isPanMode}
        onTogglePanMode={() => setIsPanMode(!isPanMode)}
      />

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

          {/* Right: Pan mode toggle & Zoom controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Pan Mode Button */}
            <button
              type="button"
              onClick={() => setIsPanMode(!isPanMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border ${
                isPanMode
                  ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isPanMode ? 'প্যান মোড বন্ধ করুন (স্বাভাবিক লেখায় ফিরুন)' : 'প্যান মোড চালু করুন (স্ক্রিন সরাতে ড্র্যাগ করুন)'}
              aria-pressed={isPanMode}
              aria-label="Pan Mode"
            >
              <Hand className={`w-3.5 h-3.5 ${isPanMode ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="hidden xs:inline">{t.panMode}</span>
              {isPanMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

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
