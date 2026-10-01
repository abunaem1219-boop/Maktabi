import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LocalBook,
  LocalChapter,
  WriterSettings,
  SyncQueueItem,
} from '../types/writer';
import {
  getLocalBook,
  saveLocalBook,
  getChaptersByBookId,
  saveLocalChapter,
  deleteLocalChapter,
  reorderLocalChapters,
  saveEditorState,
  getEditorState,
  exportBookAsJson,
} from '../services/indexedDbService';
import {
  isNetworkOnline,
  subscribeToSyncStatus,
  syncOnlyMeBook,
  submitBookForReview,
} from '../services/offlineWriter/syncService';
import {
  checkBookConflict,
  resolveConflictUseRemote,
  resolveConflictForkLocal,
} from '../services/offlineWriter/conflictService';
import { WriterHeader } from '../components/writer/WriterHeader';
import { WriterToolbar } from '../components/writer/WriterToolbar';
import { ChapterList } from '../components/writer/ChapterList';
import { ChapterEditor } from '../components/writer/ChapterEditor';
import { ImageInsertModal } from '../components/writer/ImageInsertModal';
import { LinkInsertModal } from '../components/writer/LinkInsertModal';
import { BookMetadataModal } from '../components/writer/BookMetadataModal';
import { ConflictModal } from '../components/writer/ConflictModal';
import { StorageInfoModal } from '../components/writer/StorageInfoModal';
import { SubmitChecklistModal } from '../components/writer/SubmitChecklistModal';
import { Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitize';

interface WriterEditorProps {
  bookId: string;
  initialChapterId?: string;
  onNavigate: (view: string, param?: string) => void;
}

const DEFAULT_SETTINGS: WriterSettings = {
  paperMode: false,
  focusMode: false,
  spellCheck: true,
  fontSize: 18,
  fontFamily: '"Hind Siliguri", sans-serif',
};

export const WriterEditor: React.FC<WriterEditorProps> = ({
  bookId,
  initialChapterId,
  onNavigate,
}) => {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState<LocalBook | null>(null);
  const [chapters, setChapters] = useState<LocalChapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isOnline, setIsOnline] = useState(isNetworkOnline());
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Layout & Navigation states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [chaptersDrawerOpen, setChaptersDrawerOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<WriterSettings>(DEFAULT_SETTINGS);

  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    hasConflict: boolean;
    localUpdatedAt?: number;
    remoteUpdatedAt?: number;
  }>({ hasConflict: false });

  // Formatting state
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean | string>>({});

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Online / Offline synchronization subscription
  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((online) => {
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  // Load Book and Chapters from IndexedDB
  const loadBookData = useCallback(async () => {
    try {
      setLoading(true);
      const b = await getLocalBook(bookId);
      if (!b) {
        showToast('কিতাবটি লোকাল স্টোরেজে পাওয়া যায়নি।', 'error');
        onNavigate('writer');
        return;
      }
      setBook(b);

      const chs = await getChaptersByBookId(bookId);
      setChapters(chs);

      // Determine initial active chapter:
      // Priority: route param -> saved editorState -> first chapter
      let targetChapterId = initialChapterId;
      if (!targetChapterId) {
        const savedState = await getEditorState(bookId);
        if (savedState && chs.some((c) => c.id === savedState.activeChapterId)) {
          targetChapterId = savedState.activeChapterId;
        } else if (chs.length > 0) {
          targetChapterId = chs[0].id;
        }
      }

      if (targetChapterId) {
        setActiveChapterId(targetChapterId);
      }

      // Check conflict with Firebase if online
      if (isNetworkOnline()) {
        const conflictRes = await checkBookConflict(b);
        if (conflictRes.hasConflict) {
          setConflictData({
            hasConflict: true,
            localUpdatedAt: conflictRes.localUpdatedAt,
            remoteUpdatedAt: conflictRes.remoteUpdatedAt,
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading book into writer:', err);
      showToast('কিতাবের ডাটা লোড করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setLoading(false);
    }
  }, [bookId, initialChapterId, onNavigate, showToast]);

  useEffect(() => {
    loadBookData();
  }, [loadBookData]);

  // Save active chapter to EditorState in IndexedDB
  const handleSelectChapter = async (chId: string) => {
    setActiveChapterId(chId);
    setChaptersDrawerOpen(false); // Close mobile drawer if open
    await saveEditorState({
      bookId,
      activeChapterId: chId,
      updatedAt: Date.now(),
    });
  };

  // Active chapter object
  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];

  // Update chapter handler
  const handleUpdateChapter = async (updates: Partial<LocalChapter>) => {
    if (!activeChapter) return;
    const updatedCh: LocalChapter = {
      ...activeChapter,
      ...updates,
      updatedAt: Date.now(),
    };

    // Save to IndexedDB immediately
    await saveLocalChapter(updatedCh);

    // Update in-memory state
    setChapters((prev) =>
      prev.map((c) => (c.id === updatedCh.id ? updatedCh : c))
    );

    // Update book updatedAt & recalculate word count
    if (book) {
      const updatedBook: LocalBook = {
        ...book,
        updatedAt: Date.now(),
        lastOpenedAt: Date.now(),
      };
      setBook(updatedBook);
      await saveLocalBook(updatedBook);
    }
  };

  // Toolbar command execution with selection restoration
  const handleCommand = (cmd: string, val?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();

      // Restore selection if lost
      if (savedSelectionRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedSelectionRef.current);
        }
      }

      document.execCommand(cmd, false, val);

      // Trigger change in editor
      const html = editorRef.current.innerHTML;
      if (activeChapter) {
        handleUpdateChapter({ content: html });
      }

      // Update active formats
      updateActiveFormats();
    }
  };

  const updateActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    } catch {
      // Ignore
    }
  };

  const handleClearFormatting = () => {
    handleCommand('removeFormat');
  };

  // Link Insertion
  const handleInsertLink = (url: string, text: string, newTab: boolean) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedSelectionRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedSelectionRef.current);
        }
      }

      const targetAttr = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      const safeLinkHtml = `<a href="${url}"${targetAttr}>${text}</a>`;
      document.execCommand('insertHTML', false, safeLinkHtml);

      if (activeChapter) {
        handleUpdateChapter({ content: editorRef.current.innerHTML });
      }
    }
  };

  // Image Insertion
  const handleInsertImage = (imageUrl: string, altText: string, assetId?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedSelectionRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedSelectionRef.current);
        }
      }

      const assetAttr = assetId ? ` data-asset-id="${assetId}"` : '';
      const imgHtml = `<p><img src="${imageUrl}" alt="${altText}"${assetAttr} class="rounded-2xl max-w-full my-4 shadow-sm" /></p><p></p>`;
      document.execCommand('insertHTML', false, imgHtml);

      if (activeChapter) {
        handleUpdateChapter({ content: editorRef.current.innerHTML });
      }
    }
  };

  // Chapter Management: Add
  const handleAddChapter = async () => {
    const now = Date.now();
    const newOrder = chapters.length + 1;
    const newId = `ch_local_${now}_${newOrder}`;
    const newCh: LocalChapter = {
      id: newId,
      bookId,
      title: `অধ্যায় ${newOrder}`,
      order: newOrder,
      content: '<p></p>',
      createdAt: now,
      updatedAt: now,
      wordCount: 0,
      characterCount: 0,
      syncStatus: 'local',
    };

    await saveLocalChapter(newCh);
    setChapters([...chapters, newCh]);
    setActiveChapterId(newId);
    showToast(`নতুন অধ্যায় (${newCh.title}) যোগ করা হয়েছে।`, 'success');
  };

  // Chapter Management: Rename
  const handleRenameChapter = async (chId: string, newTitle: string) => {
    const ch = chapters.find((c) => c.id === chId);
    if (!ch) return;

    const updated = { ...ch, title: newTitle, updatedAt: Date.now() };
    await saveLocalChapter(updated);
    setChapters(chapters.map((c) => (c.id === chId ? updated : c)));
    showToast('অধ্যায়ের নাম পরিবর্তন হয়েছে।', 'success');
  };

  // Chapter Management: Duplicate
  const handleDuplicateChapter = async (chId: string) => {
    const ch = chapters.find((c) => c.id === chId);
    if (!ch) return;

    const now = Date.now();
    const dupId = `ch_local_${now}_dup`;
    const dupCh: LocalChapter = {
      ...ch,
      id: dupId,
      title: `${ch.title} (কপি)`,
      order: chapters.length + 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await saveLocalChapter(dupCh);
    setChapters([...chapters, dupCh]);
    setActiveChapterId(dupId);
    showToast('অধ্যায়ের কপি তৈরি হয়েছে।', 'success');
  };

  // Chapter Management: Delete
  const handleDeleteChapter = async (chId: string) => {
    if (chapters.length <= 1) {
      showToast('কিতাবের একমাত্র অধ্যায় মুছে ফেলা যাবে না।', 'warning');
      return;
    }

    await deleteLocalChapter(chId, bookId);
    const remaining = chapters.filter((c) => c.id !== chId);
    setChapters(remaining);

    if (activeChapterId === chId) {
      setActiveChapterId(remaining[0].id);
    }
    showToast('অধ্যায়টি মুছে ফেলা হয়েছে।', 'info');
  };

  // Chapter Management: Reorder
  const handleMoveChapter = async (chId: string, direction: 'up' | 'down') => {
    const index = chapters.findIndex((c) => c.id === chId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map((c) => c.id);
    await reorderLocalChapters(bookId, orderedIds);
    setChapters(reordered);
  };

  // Book Metadata Save
  const handleSaveMetadata = async (updates: Partial<LocalBook>) => {
    if (!book) return;
    const updatedBook: LocalBook = {
      ...book,
      ...updates,
      updatedAt: Date.now(),
    };
    setBook(updatedBook);
    await saveLocalBook(updatedBook);
    showToast('কিতাবের তথ্য সফলভাবে সংরক্ষিত হয়েছে।', 'success');
  };

  // Sync: Only Me
  const handleSyncOnlyMe = async () => {
    if (!book) return;
    setSyncInProgress(true);
    try {
      const res = await syncOnlyMeBook(book.id, user?.uid || 'device_local', userProfile?.name);
      showToast(res.message, 'success');
      const refreshed = await getLocalBook(book.id);
      if (refreshed) setBook(refreshed);
    } catch (err: any) {
      showToast(err.message || 'সিঙ্ক ব্যর্থ হয়েছে।', 'error');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Sync: Submit for Review (opens checklist & validation modal)
  const handleSubmitForReview = () => {
    if (!book) return;
    if (!user) {
      showToast('পর্যালোচনার জন্য জমা দেওয়ার পূর্বে অনুগ্রহ করে লগইন করুন।', 'warning');
      return;
    }
    setShowSubmitModal(true);
  };

  // Export handlers
  const handleExportJson = async () => {
    try {
      const json = await exportBookAsJson(bookId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book?.title || 'kitab'}_backup.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('JSON ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে।', 'success');
    } catch (err: any) {
      showToast(err.message || 'এক্সপোর্ট ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleExportHtml = () => {
    if (!book) return;
    const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #92400e; }
    h2 { border-bottom: 2px solid #e7e5e4; padding-bottom: 8px; margin-top: 40px; }
  </style>
</head>
<body>
  <h1>${book.title}</h1>
  <p><strong>লেখক:</strong> ${book.authorName}</p>
  <hr>
  ${chapters.map((ch) => `<h2>${ch.title}</h2>\n<div>${ch.content}</div>`).join('\n\n')}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title || 'kitab'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML ফাইল এক্সপোর্ট হয়েছে।', 'success');
  };

  const handleExportTxt = () => {
    if (!book) return;
    const fullText = `${book.title}\nলেখক: ${book.authorName}\n\n========================\n\n` +
      chapters.map((ch) => {
        const plain = ch.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return `[ ${ch.title} ]\n\n${plain}`;
      }).join('\n\n------------------------\n\n');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title || 'kitab'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('টেক্সট ফাইল এক্সপোর্ট হয়েছে।', 'success');
  };

  // Preview in Reader
  const handlePreview = () => {
    // Open reader in local preview mode
    onNavigate('reader', `${bookId}?preview=local`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 gap-3">
        <Loader2 className="w-8 h-8 text-amber-700 dark:text-amber-400 animate-spin" />
        <span className="text-sm font-semibold">পান্ডুলিপি প্রস্তুত হচ্ছে...</span>
      </div>
    );
  }

  if (!book || !activeChapter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-600 mb-3" />
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">কিতাব পাওয়া যায়নি</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          এই কিতাবের কোনো ড্রাফট লোকাল স্টোরেজে খুঁজে পাওয়া যায়নি।
        </p>
        <button
          onClick={() => onNavigate('writer')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs shadow-md"
        >
          ড্যাশবোর্ডে ফিরুন
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-stone-900 overflow-hidden">
      {/* Top Header */}
      <WriterHeader
        book={book}
        isAutosaving={isAutosaving}
        isOnline={isOnline}
        onBack={() => onNavigate('writer')}
        onPreview={handlePreview}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        isFocusMode={isFocusMode}
        onToggleChaptersDrawer={() => setChaptersDrawerOpen(!chaptersDrawerOpen)}
        onOpenMetadata={() => setShowMetadataModal(true)}
        onSyncOnlyMe={handleSyncOnlyMe}
        onSubmitForReview={handleSubmitForReview}
        onExportJson={handleExportJson}
        onExportHtml={handleExportHtml}
        onExportTxt={handleExportTxt}
        onOpenStorageInfo={() => setShowStorageModal(true)}
        syncInProgress={syncInProgress}
      />

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs flex items-center justify-center gap-2 shadow-xs shrink-0">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>আপনি এখন অফলাইনে আছেন। আপনার লেখা ডিভাইসেই নিরাপদে সংরক্ষণ হচ্ছে।</span>
        </div>
      )}

      {/* Formatting Toolbar */}
      {!isFocusMode && (
        <WriterToolbar
          onCommand={handleCommand}
          onOpenLinkModal={() => setShowLinkModal(true)}
          onOpenImageModal={() => setShowImageModal(true)}
          onClearFormatting={handleClearFormatting}
          savedSelectionRef={savedSelectionRef}
          activeFormats={activeFormats}
        />
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (Chapters) */}
        {!isFocusMode && (
          <div className="hidden lg:block h-full">
            <ChapterList
              chapters={chapters}
              activeChapterId={activeChapterId}
              onSelectChapter={handleSelectChapter}
              onAddChapter={handleAddChapter}
              onRenameChapter={handleRenameChapter}
              onDuplicateChapter={handleDuplicateChapter}
              onDeleteChapter={handleDeleteChapter}
              onMoveChapter={handleMoveChapter}
            />
          </div>
        )}

        {/* Mobile Chapters Drawer */}
        {chaptersDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
              onClick={() => setChaptersDrawerOpen(false)}
            />
            <div className="relative z-50 w-72 h-full bg-white dark:bg-stone-900 shadow-2xl">
              <ChapterList
                chapters={chapters}
                activeChapterId={activeChapterId}
                onSelectChapter={handleSelectChapter}
                onAddChapter={handleAddChapter}
                onRenameChapter={handleRenameChapter}
                onDuplicateChapter={handleDuplicateChapter}
                onDeleteChapter={handleDeleteChapter}
                onMoveChapter={handleMoveChapter}
              />
            </div>
          </div>
        )}

        {/* Center Editor Surface */}
        <ChapterEditor
          chapter={activeChapter}
          onUpdateChapter={handleUpdateChapter}
          savedSelectionRef={savedSelectionRef}
          editorRef={editorRef}
          settings={settings}
          onAutosavingChange={setIsAutosaving}
          onOpenLinkModal={() => setShowLinkModal(true)}
        />
      </div>

      {/* Modals */}
      {showImageModal && (
        <ImageInsertModal
          isOpen={true}
          bookId={book.id}
          chapterId={activeChapter.id}
          onClose={() => setShowImageModal(false)}
          onInsert={handleInsertImage}
        />
      )}

      {showLinkModal && (
        <LinkInsertModal
          isOpen={true}
          onClose={() => setShowLinkModal(false)}
          onInsert={handleInsertLink}
        />
      )}

      {showMetadataModal && (
        <BookMetadataModal
          isOpen={true}
          book={book}
          onClose={() => setShowMetadataModal(false)}
          onSave={handleSaveMetadata}
        />
      )}

      {showStorageModal && (
        <StorageInfoModal
          isOpen={true}
          onClose={() => setShowStorageModal(false)}
          onCleared={() => {
            loadBookData();
          }}
        />
      )}

      {showSubmitModal && (
        <SubmitChecklistModal
          isOpen={true}
          book={book}
          chapters={chapters}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={() => {
            loadBookData();
          }}
        />
      )}

      {conflictData.hasConflict && (
        <ConflictModal
          isOpen={true}
          localUpdatedAt={conflictData.localUpdatedAt}
          remoteUpdatedAt={conflictData.remoteUpdatedAt}
          onKeepLocal={() => {
            setConflictData({ hasConflict: false });
            showToast('ডিভাইসের সংস্করণ বহাল রাখা হয়েছে।', 'info');
          }}
          onUseRemote={async () => {
            try {
              await resolveConflictUseRemote(book.id);
              setConflictData({ hasConflict: false });
              showToast('অনলাইন সংস্করণ গ্রহণ করা হয়েছে।', 'success');
              loadBookData();
            } catch (err: any) {
              showToast(err.message || 'রিমোট লোড ব্যর্থ হয়েছে।', 'error');
            }
          }}
          onForkBoth={async () => {
            try {
              const forked = await resolveConflictForkLocal(book, chapters);
              setConflictData({ hasConflict: false });
              showToast(`নতুন কপি তৈরি হয়েছে: ${forked.title}`, 'success');
              onNavigate('writer', forked.id);
            } catch (err: any) {
              showToast(err.message || 'কপি তৈরি ব্যর্থ হয়েছে।', 'error');
            }
          }}
        />
      )}
    </div>
  );
};
