import React, { useState, useEffect, useRef } from 'react';
import { Book, Category, BookStatus, BookVisibility } from '../../types/book';
import {
  getAllBooksAdmin,
  createBook,
  updateBook,
  publishBook,
  unpublishBook,
  archiveBook,
  deleteBook,
  toggleFeatured,
} from '../../services/bookService';
import { getCategories } from '../../services/categoryService';
import { logAdminAction } from '../../services/adminService';
import { uploadBookCover, getCloudinaryConfig, getOptimizedImageUrl } from '../../services/cloudinaryService';
import { ADMIN_UID } from '../../firebase/config';
import { useToast } from '../../context/ToastContext';
import { toBengaliNumerals, formatBengaliDate } from '../../utils/formatters';
import { AdminChapterManager } from '../../components/admin/AdminChapterManager';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  FileCheck,
  FileArchive,
  Sparkles,
  BookOpen,
  X,
  Loader2,
  RefreshCw,
  Layers,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AdminBooksProps {
  onNavigateToPreview: (bookId: string) => void;
}

export const AdminBooks: React.FC<AdminBooksProps> = ({ onNavigateToPreview }) => {
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Chapter Manager view
  const [activeChapterBook, setActiveChapterBook] = useState<Book | null>(null);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', action: async () => {} });

  // Form Fields
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPublicId, setCoverPublicId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('bn');
  const [status, setStatus] = useState<BookStatus>('published');
  const [visibility, setVisibility] = useState<BookVisibility>('public');
  const [featured, setFeatured] = useState(false);
  const [chapterCount, setChapterCount] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cloudinary upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudinaryConfig = getCloudinaryConfig();

  const fetchBooksAndCategories = async () => {
    setLoading(true);
    try {
      const [bList, cList] = await Promise.all([
        getAllBooksAdmin(),
        getCategories(false),
      ]);
      setBooks(bList);
      setCategories(cList);
      if (cList.length > 0 && !categoryId) {
        setCategoryId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch admin book data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksAndCategories();
  }, []);

  const openAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthorName('');
    setPublisher('');
    setDescription('');
    setCoverUrl('');
    setCoverPublicId('');
    setCategoryId(categories[0]?.id || '');
    setLanguage('bn');
    setStatus('published');
    setVisibility('public');
    setFeatured(false);
    setChapterCount(1);
    setTags([]);
    setTagInput('');
    setUploadProgress(0);
    setFormModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthorName(book.authorName);
    setPublisher(book.publisher || '');
    setDescription(book.description);
    setCoverUrl(book.coverUrl || '');
    setCoverPublicId(book.coverPublicId || '');
    setCategoryId(book.categoryId);
    setLanguage(book.language || 'bn');
    setStatus(book.status);
    setVisibility(book.visibility);
    setFeatured(Boolean(book.featured));
    setChapterCount(book.chapterCount || 1);
    setTags(book.tags || []);
    setTagInput('');
    setUploadProgress(0);
    setFormModalOpen(true);
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!cloudinaryConfig.configured) {
      showToast('Cloudinary কনফিগার করা নেই। অনুগ্রহ করে URL ইনপুট ব্যবহার করুন।', 'warning');
      return;
    }

    setUploadingCover(true);
    setUploadProgress(0);

    try {
      const res = await uploadBookCover(file, (percent) => {
        setUploadProgress(percent);
      });
      setCoverUrl(res.secure_url);
      setCoverPublicId(res.public_id);
      showToast('কভার ছবি সফলভাবে আপলোড হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'কভার আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        if (tags.length >= 8) {
          showToast('সর্বোচ্চ ৮টি ট্যাগ যোগ করা যাবে।', 'warning');
          return;
        }
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !authorName.trim() || !description.trim() || !categoryId) {
      showToast('অনুগ্রহ করে শিরোনাম, লেখক, বিবরণ ও ক্যাটাগরি পূরণ করুন।', 'warning');
      return;
    }

    setSubmitting(true);
    const selectedCat = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCat?.name || '';

    try {
      if (editingBook) {
        await updateBook(editingBook.id, {
          title: title.trim(),
          authorName: authorName.trim(),
          publisher: publisher.trim(),
          description: description.trim(),
          coverUrl: coverUrl.trim(),
          coverPublicId: coverPublicId.trim() || undefined,
          categoryId,
          categoryName,
          language,
          tags,
          status,
          visibility,
          featured,
          chapterCount: Number(chapterCount) || 1,
        });

        await logAdminAction(ADMIN_UID, 'BOOK_UPDATED', editingBook.id, `Updated book ${title}`);
        showToast('বই সফলভাবে হালনাগাদ করা হয়েছে।', 'success');
      } else {
        const newBook = await createBook({
          title: title.trim(),
          authorName: authorName.trim(),
          publisher: publisher.trim(),
          description: description.trim(),
          coverUrl: coverUrl.trim(),
          coverPublicId: coverPublicId.trim() || undefined,
          categoryId,
          categoryName,
          language,
          tags,
          status,
          visibility,
          featured,
          chapterCount: Number(chapterCount) || 1,
          createdBy: ADMIN_UID,
        });

        await logAdminAction(ADMIN_UID, 'BOOK_CREATED', newBook.id, `Created book ${title}`);
        showToast('নতুন বই সফলভাবে লাইব্রেরিতে যুক্ত হয়েছে।', 'success');
      }

      setFormModalOpen(false);
      fetchBooksAndCategories();
    } catch (err: any) {
      showToast(err.message || 'বই সংরক্ষণে সমস্যা হয়েছে।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (book: Book) => {
    try {
      const nextFeatured = !book.featured;
      await toggleFeatured(book.id, nextFeatured);
      await logAdminAction(
        ADMIN_UID,
        nextFeatured ? 'BOOK_FEATURED' : 'BOOK_UNFEATURED',
        book.id,
        book.title
      );
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, featured: nextFeatured } : b))
      );
      showToast(
        `"${book.title}" ${nextFeatured ? 'নির্বাচিত তালিকায় যুক্ত হয়েছে' : 'নির্বাচিত তালিকা থেকে সরানো হয়েছে'}।`,
        'info'
      );
    } catch {
      showToast('নির্বাচিত অবস্থা পরিবর্তন করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handlePublish = async (book: Book) => {
    setConfirmModal({
      open: true,
      title: 'বই প্রকাশ নিশ্চিতকরণ',
      message: `আপনি কি "${book.title}" বইটি জনসাধারণের জন্য লাইব্রেরিতে উন্মুক্ত (Publish) করতে চান? নিশ্চিত করার আগে অন্তত ১টি অধ্যায় থাকা আবশ্যক।`,
      action: async () => {
        try {
          await publishBook(book.id);
          await logAdminAction(ADMIN_UID, 'BOOK_PUBLISHED', book.id, book.title);
          showToast(`"${book.title}" সফলভাবে প্রকাশিত হয়েছে!`, 'success');
          fetchBooksAndCategories();
        } catch (err: any) {
          showToast(err.message || 'বই প্রকাশে ত্রুটি ঘটেছে।', 'error');
        }
      },
    });
  };

  const handleArchive = async (book: Book) => {
    setConfirmModal({
      open: true,
      title: 'বই আর্কাইভ নিশ্চিতকরণ',
      message: `আপনি কি "${book.title}" বইটি আর্কাইভ করতে চান? এটি পাবলিক লাইব্রেরি থেকে লুকানো থাকবে।`,
      action: async () => {
        await unpublishBook(book.id);
        await logAdminAction(ADMIN_UID, 'BOOK_ARCHIVED', book.id, book.title);
        showToast(`"${book.title}" আর্কাইভ করা হয়েছে।`, 'info');
        fetchBooksAndCategories();
      },
    });
  };

  const handleDelete = async (book: Book) => {
    setConfirmModal({
      open: true,
      title: 'বই মুছে ফেলা (Delete)',
      message: `আপনি কি নিশ্চিত যে "${book.title}" বইটি ও এর সমস্ত অধ্যায় স্থায়ীভাবে মুছে ফেলতে চান?`,
      action: async () => {
        await deleteBook(book.id);
        await logAdminAction(ADMIN_UID, 'BOOK_DELETED', book.id, book.title);
        showToast(`"${book.title}" মুছে ফেলা হয়েছে।`, 'info');
        fetchBooksAndCategories();
      },
    });
  };

  // If Chapter Manager view is active for a specific book
  if (activeChapterBook) {
    return (
      <AdminChapterManager
        bookId={activeChapterBook.id}
        bookTitle={activeChapterBook.title}
        onClose={() => {
          setActiveChapterBook(null);
          fetchBooksAndCategories();
        }}
      />
    );
  }

  // Filtered List
  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      b.authorName.toLowerCase().includes(q) ||
      b.publisher?.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || b.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (bStatus: BookStatus, bVisibility: BookVisibility) => {
    if (bStatus === 'published' && bVisibility === 'public') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <FileCheck className="w-3 h-3" />
          <span>প্রকাশিত</span>
        </span>
      );
    }
    if (bStatus === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
          <span>খসড়া</span>
        </span>
      );
    }
    if (bStatus === 'archived') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <FileArchive className="w-3 h-3" />
          <span>আর্কাইভ</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
        <span>{bStatus}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            বই ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            লাইব্রেরির বই তৈরি, Cloudinary কভার, অধ্যায় ব্যবস্থাপনা ও প্রকাশনা
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchBooksAndCategories}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
            title="তাজা করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বই যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="বইয়ের শিরোনাম, লেখক বা প্রকাশকের নাম দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600/40"
        >
          <option value="all">সকল অবস্থা</option>
          <option value="published">প্রকাশিত</option>
          <option value="draft">খসড়া</option>
          <option value="archived">আর্কাইভ</option>
          <option value="private">ব্যক্তিগত</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600/40"
        >
          <option value="all">সকল ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs text-stone-400">বইয়ের তালিকা লোড করা হচ্ছে...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
              কোনো বই পাওয়া যায়নি
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'ফিল্টারের সাথে মেলে এমন কোনো বই নেই।'
                : 'লাইব্রেরিতে এখনো কোনো বই নেই।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 sm:px-6">বইয়ের শিরোনাম ও লেখক</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4 text-center">অধ্যায়সমূহ</th>
                  <th className="py-3 px-4">অবস্থা</th>
                  <th className="py-3 px-4 text-center">নির্বাচিত</th>
                  <th className="py-3 px-4">প্রকাশকাল</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-850/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                          {b.coverUrl ? (
                            <img
                              src={getOptimizedImageUrl(b.coverUrl, { width: 120, height: 160 })}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 dark:text-stone-100 block truncate max-w-xs">
                            {b.title}
                          </span>
                          <span className="text-[11px] text-stone-500 block truncate">
                            {b.authorName} {b.publisher ? `• ${b.publisher}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-stone-600 dark:text-stone-300">
                      {b.categoryName || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setActiveChapterBook(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold border border-purple-200 dark:border-purple-800"
                        title="অধ্যায়সমূহ পরিচালনা করুন"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{toBengaliNumerals(b.chapterCount || 0)} টি</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(b.status, b.visibility)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(b)}
                        className={`p-1 rounded-lg transition-colors ${
                          b.featured
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-stone-300 dark:text-stone-600 hover:text-amber-500'
                        }`}
                        title={b.featured ? 'নির্বাচিত তালিকা থেকে সরান' : 'নির্বাচিত তালিকায় যোগ করুন'}
                      >
                        <Sparkles className={`w-4 h-4 ${b.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                      {formatBengaliDate(b.publishedAt || b.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reader Preview */}
                        <button
                          onClick={() => onNavigateToPreview(b.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100"
                          title="রিডার প্রিভিউ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Publish/Archive */}
                        {b.status === 'published' ? (
                          <button
                            onClick={() => handleArchive(b)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50"
                            title="আর্কাইভ"
                          >
                            <FileArchive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublish(b)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="প্রকাশ করুন"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-purple-600 hover:bg-purple-50"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(b)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal with Cloudinary Integration */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 my-8 relative">
            <button
              onClick={() => setFormModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {editingBook ? 'বইয়ের তথ্য সম্পাদনা' : 'নতুন বই যোগ করুন'}
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              বইয়ের মেটাডাটা ও Cloudinary কভার ছবি নির্বাচন করুন
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    বইয়ের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="যেমন: পথের পাঁচালী"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    লেখকের নাম *
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                    placeholder="যেমন: বিভূতিভূষণ বন্দ্যোপাধ্যায়"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    প্রকাশনী
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="যেমন: জ্ঞানকোষ প্রকাশনী"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    ক্যাটাগরি *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cloudinary Book Cover Upload Section */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    কভার ছবি (Cloudinary Media)
                  </label>
                  {coverUrl && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> কভার সংযুক্ত
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Image Preview Box */}
                  <div className="w-24 h-32 rounded-xl bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 overflow-hidden flex items-center justify-center shrink-0 relative">
                    {coverUrl ? (
                      <img
                        src={getOptimizedImageUrl(coverUrl, { width: 180, height: 240 })}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-stone-400" />
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-stone-950/70 flex flex-col items-center justify-center text-white text-xs">
                        <Loader2 className="w-5 h-5 animate-spin mb-1 text-purple-400" />
                        <span>{uploadProgress}%</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleCoverFileUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{coverUrl ? 'ছবি পরিবর্তন করুন' : 'Cloudinary তে আপলোড'}</span>
                      </button>

                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCoverUrl('');
                            setCoverPublicId('');
                          }}
                          className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>

                    {/* Fallback Direct URL input */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] text-stone-500">অথবা সরাসরি ইমেজ লিংক (URL) দিন:</span>
                      <input
                        type="url"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                      />
                    </div>

                    {!cloudinaryConfig.configured && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Cloudinary এখনো কনফিগার করা হয়নি (.env তে VITE_CLOUDINARY_CLOUD_NAME দিন)। সরাসরি লিংক ব্যবহার করতে পারেন।
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  বইয়ের বিবরণ *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="বইটির পটভূমি বা বিষয়বস্তু সংক্ষেপে লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  ট্যাগসমূহ
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 min-h-[42px]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-semibold"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-purple-500 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "ট্যাগ লিখে Enter চাপুন..." : ""}
                    className="flex-1 bg-transparent text-sm text-stone-900 dark:text-stone-100 focus:outline-none min-w-[120px]"
                  />
                </div>
              </div>

              {/* Status & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                    অবস্থা (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookStatus)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold"
                  >
                    <option value="published">প্রকাশিত (Published)</option>
                    <option value="draft">খসড়া (Draft)</option>
                    <option value="archived">আর্কাইভ (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                    দৃশ্যমানতা (Visibility)
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as BookVisibility)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold"
                  >
                    <option value="public">উন্মুক্ত (Public)</option>
                    <option value="private">গোপন (Private)</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800 dark:text-stone-200">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>নির্বাচিত বই (Featured)</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
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

      {/* Confirmation Dialog */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 relative">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmModal.action();
                  setConfirmModal({ ...confirmModal, open: false });
                }}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-sm"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
