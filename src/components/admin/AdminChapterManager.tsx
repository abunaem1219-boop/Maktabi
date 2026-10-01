import React, { useState, useEffect } from 'react';
import { BookChapter } from '../../types/book';
import {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} from '../../services/chapterService';
import { logAdminAction } from '../../services/adminService';
import { ADMIN_UID } from '../../firebase/config';
import { useToast } from '../../context/ToastContext';
import { sanitizeHtml } from '../../utils/sanitize';
import { toBengaliNumerals } from '../../utils/formatters';
import {
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  FileText,
  Eye,
  X,
  Loader2,
  Check,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Quote,
  List,
} from 'lucide-react';

interface AdminChapterManagerProps {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
}

export const AdminChapterManager: React.FC<AdminChapterManagerProps> = ({
  bookId,
  bookTitle,
  onClose,
}) => {
  const { showToast } = useToast();
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<BookChapter | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchChaptersList = async () => {
    setLoading(true);
    try {
      const list = await getChapters(bookId, true);
      setChapters(list);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChaptersList();
  }, [bookId]);

  const openAddModal = () => {
    setEditingChapter(null);
    setTitle('');
    setContent('<p>অধ্যায়ের বিষয়বস্তু এখানে লিখুন...</p>');
    setOrder(chapters.length + 1);
    setPreviewMode(false);
    setModalOpen(true);
  };

  const openEditModal = (ch: BookChapter) => {
    setEditingChapter(ch);
    setTitle(ch.title);
    setContent(ch.content);
    setOrder(ch.order);
    setPreviewMode(false);
    setModalOpen(true);
  };

  const handleInsertTag = (openTag: string, closeTag: string) => {
    setContent((prev) => `${prev}\n${openTag}শিরোনাম বা বাক্য${closeTag}\n`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('অধ্যায়ের শিরোনাম ও বিষয়বস্তু পূরণ করুন।', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingChapter) {
        await updateChapter(bookId, editingChapter.id, {
          title: title.trim(),
          content,
          order: Number(order),
        });
        await logAdminAction(ADMIN_UID, 'CHAPTER_UPDATED', editingChapter.id, `Book: ${bookTitle}`);
        showToast('অধ্যায় সফলভাবে হালনাগাদ করা হয়েছে।', 'success');
      } else {
        await createChapter(bookId, {
          title: title.trim(),
          content,
          order: Number(order),
        });
        await logAdminAction(ADMIN_UID, 'CHAPTER_CREATED', bookId, `Chapter: ${title}`);
        showToast('নতুন অধ্যায় সফলভাবে যোগ করা হয়েছে।', 'success');
      }
      setModalOpen(false);
      fetchChaptersList();
    } catch (err) {
      showToast('অধ্যায় সংরক্ষণে সমস্যা হয়েছে।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ch: BookChapter) => {
    if (!window.confirm(`আপনি কি "${ch.title}" অধ্যায়টি মুছে ফেলতে চান?`)) return;

    try {
      await deleteChapter(bookId, ch.id);
      await logAdminAction(ADMIN_UID, 'CHAPTER_DELETED', ch.id, `Book: ${bookTitle}`);
      showToast('অধ্যায়টি মুছে ফেলা হয়েছে।', 'info');
      fetchChaptersList();
    } catch {
      showToast('অধ্যায় মুছতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length) return;

    const list = [...chapters];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const orderedIds = list.map((c) => c.id);
    try {
      await reorderChapters(bookId, orderedIds);
      fetchChaptersList();
    } catch {
      showToast('ক্রম পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-100 dark:bg-stone-850">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            বইয়ের অধ্যায়সমূহ
          </span>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
            &quot;{bookTitle}&quot;
          </h3>
          <p className="text-xs text-stone-500">
            মোট অধ্যায়: {toBengaliNumerals(chapters.length)} টি
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন অধ্যায়</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            ফিরে যান
          </button>
        </div>
      </div>

      {/* Chapters List */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <p className="text-xs text-stone-400">অধ্যায়সমূহ লোড করা হচ্ছে...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Layers className="w-10 h-10 text-stone-400 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              কোনো অধ্যায় যোগ করা হয়নি
            </h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              বই প্রকাশ করার জন্য অন্তত একটি অধ্যায় যোগ করতে হবে।
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>প্রথম অধ্যায় লিখুন</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {chapters.map((ch, idx) => (
              <div
                key={ch.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-850/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Order & Reorder Controls */}
                  <div className="flex items-center gap-1 shrink-0 text-stone-400">
                    <span className="font-bold text-xs w-5 text-center text-stone-700 dark:text-stone-300">
                      {toBengaliNumerals(ch.order ?? idx + 1)}
                    </span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="text-stone-400 hover:text-stone-700 disabled:opacity-20"
                        title="উপরে নিন"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveOrder(idx, 'down')}
                        disabled={idx === chapters.length - 1}
                        className="text-stone-400 hover:text-stone-700 disabled:opacity-20"
                        title="নিচে নিন"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                      {ch.title}
                    </h4>
                    <span className="text-[11px] text-stone-400">
                      শব্দসংখ্যা: {toBengaliNumerals(ch.wordCount || 0)} টি
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(ch)}
                    className="p-2 rounded-xl text-stone-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-stone-800 transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ch)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Chapter Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 my-8 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {editingChapter ? 'অধ্যায় সম্পাদনা' : 'নতুন অধ্যায় যোগ'}
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              অধ্যায়ের শিরোনাম ও পাঠ্যপুস্তকের বিষয়বস্তু লিখুন
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    অধ্যায়ের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="যেমন: ১ম পরিচ্ছেদ — পথের আহ্বান"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    ক্রম (Order)
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min={1}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>
              </div>

              {/* Formatting Helper Bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-xs">
                <span className="text-[11px] font-semibold text-stone-400 px-2">ট্যাগ যোগ:</span>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<h2>', '</h2>')}
                  className="px-2 py-1 rounded bg-white dark:bg-stone-800 hover:bg-purple-100 text-stone-700 dark:text-stone-300 flex items-center gap-1"
                >
                  <Heading1 className="w-3.5 h-3.5" /> H2
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<h3>', '</h3>')}
                  className="px-2 py-1 rounded bg-white dark:bg-stone-800 hover:bg-purple-100 text-stone-700 dark:text-stone-300 flex items-center gap-1"
                >
                  <Heading2 className="w-3.5 h-3.5" /> H3
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<strong>', '</strong>')}
                  className="px-2 py-1 rounded bg-white dark:bg-stone-800 hover:bg-purple-100 text-stone-700 dark:text-stone-300 flex items-center gap-1"
                >
                  <Bold className="w-3.5 h-3.5" /> বোল্ড
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<em>', '</em>')}
                  className="px-2 py-1 rounded bg-white dark:bg-stone-800 hover:bg-purple-100 text-stone-700 dark:text-stone-300 flex items-center gap-1"
                >
                  <Italic className="w-3.5 h-3.5" /> ইতালিক
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<blockquote>', '</blockquote>')}
                  className="px-2 py-1 rounded bg-white dark:bg-stone-800 hover:bg-purple-100 text-stone-700 dark:text-stone-300 flex items-center gap-1"
                >
                  <Quote className="w-3.5 h-3.5" /> উক্তি
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<p>', '</p>')}
                  className="px-2 py-1 rounded bg-white dark:bg-stone-800 hover:bg-purple-100 text-stone-700 dark:text-stone-300"
                >
                  প্যারাগ্রাফ
                </button>

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                      previewMode
                        ? 'bg-purple-700 text-white'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{previewMode ? 'কোড দেখুন' : 'প্রিভিউ'}</span>
                  </button>
                </div>
              </div>

              {/* Content Editor / Preview */}
              <div>
                {previewMode ? (
                  <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 min-h-[260px] max-h-[400px] overflow-y-auto prose dark:prose-invert text-sm">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(content),
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    required
                    placeholder="<p>এখানে অধ্যায়ের বিস্তারিত কাহিনী বা আলোচনা লিখুন...</p>"
                    className="w-full font-mono text-xs p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600/40 leading-relaxed"
                  />
                )}
                <span className="text-[11px] text-stone-400 mt-1 block">
                  * HTML ফরম্যাট সমর্থিত। সব কোড স্বয়ংক্রিয়ভাবে Sanitize ও XSS ফিল্টার করা হয়।
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
