import React, { useState, useEffect } from 'react';
import { Category } from '../../types/book';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
  getBooksCountForCategory,
} from '../../services/categoryService';
import { logAdminAction } from '../../services/adminService';
import { ADMIN_UID } from '../../firebase/config';
import { useToast } from '../../context/ToastContext';
import { CategoryIcon } from '../../components/book/CategoryIcon';
import { toBengaliNumerals } from '../../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  FolderTree,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('book-open');
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete protection modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [associatedBooksCount, setAssociatedBooksCount] = useState<number>(0);
  const [checkingDelete, setCheckingDelete] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories(false); // Fetch all including inactive
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('book-open');
    setOrder(categories.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'book-open');
    setOrder(cat.order || 1);
    setActive(cat.active !== false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('ক্যাটাগরির নাম আবশ্যক।', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: description.trim(),
          icon: icon.trim(),
          order: Number(order),
          active,
        });
        await logAdminAction(ADMIN_UID, 'CATEGORY_UPDATED', editingCategory.id, `Updated category ${name}`);
        showToast('ক্যাটাগরি সফলভাবে হালনাগাদ করা হয়েছে।', 'success');
      } else {
        const newCat = await createCategory({
          name: name.trim(),
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: description.trim(),
          icon: icon.trim(),
          order: Number(order),
          active,
        });
        await logAdminAction(ADMIN_UID, 'CATEGORY_CREATED', newCat.id, `Created category ${name}`);
        showToast('নতুন ক্যাটাগরি তৈরি হয়েছে।', 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast('ক্যাটাগরি সংরক্ষণে সমস্যা হয়েছে।', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const newStatus = !cat.active;
      await updateCategory(cat.id, { active: newStatus });
      await logAdminAction(
        ADMIN_UID,
        newStatus ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED',
        cat.id
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: newStatus } : c))
      );
      showToast(`ক্যাটাগরি ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।`, 'info');
    } catch {
      showToast('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const promptDeleteCategory = async (cat: Category) => {
    setCategoryToDelete(cat);
    setCheckingDelete(true);
    try {
      const count = await getBooksCountForCategory(cat.id);
      setAssociatedBooksCount(count);
      setDeleteModalOpen(true);
    } catch {
      showToast('বইয়ের সংখ্যা পরীক্ষা করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setCheckingDelete(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      await logAdminAction(ADMIN_UID, 'CATEGORY_DELETED', categoryToDelete.id, categoryToDelete.name);
      showToast(`"${categoryToDelete.name}" ক্যাটাগরি মুছে ফেলা হয়েছে।`, 'info');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch {
      showToast('ক্যাটাগরি মুছতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const count = await seedDefaultCategories();
      if (count > 0) {
        showToast(`${toBengaliNumerals(count)} টি প্রাথমিক ক্যাটাগরি যুক্ত হয়েছে!`, 'success');
        fetchCategories();
      } else {
        showToast('ক্যাটাগরি ইতিমধ্যে উপস্থিত রয়েছে।', 'info');
      }
    } catch {
      showToast('ক্যাটাগরি সিড করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    const currentOrder = currentCat.order ?? index + 1;
    const targetOrder = targetCat.order ?? targetIndex + 1;

    try {
      await Promise.all([
        updateCategory(currentCat.id, { order: targetOrder }),
        updateCategory(targetCat.id, { order: currentOrder }),
      ]);
      fetchCategories();
    } catch {
      showToast('ক্রম পরিবর্তন করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const availableIcons = [
    'book-open',
    'novel',
    'story',
    'poetry',
    'essay',
    'history',
    'education',
    'biography',
    'child',
    'self-dev',
    'science',
    'compass',
    'heart',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            ক্যাটাগরি ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            বইয়ের বিষয়ভিত্তিক শ্রেণিবিন্যাস তৈরি, সম্পাদনা ও সাজানো
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {categories.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ডিফল্ট ক্যাটাগরি তৈরি করুন</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ক্যাটাগরি</span>
          </button>
        </div>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs text-stone-400">ক্যাটাগরি লোড করা হচ্ছে...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderTree className="w-10 h-10 text-stone-400 mx-auto" />
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
              কোনো ক্যাটাগরি পাওয়া যায়নি
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              নতুন ক্যাটাগরি যোগ করুন অথবা ডিফল্ট ক্যাটাগরিগুলো এক ক্লিকে সেটআপ করুন।
            </p>
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>১২ টি ডিফল্ট ক্যাটাগরি যুক্ত করুন</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">ক্রম</th>
                  <th className="py-3 px-4">ক্যাটাগরি</th>
                  <th className="py-3 px-4">স্লাগ (Slug)</th>
                  <th className="py-3 px-4">বিবরণ</th>
                  <th className="py-3 px-4 text-center">অবস্থা</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-850/60 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-stone-500 w-5">
                          {toBengaliNumerals(cat.order ?? idx + 1)}
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
                            disabled={idx === categories.length - 1}
                            className="text-stone-400 hover:text-stone-700 disabled:opacity-20"
                            title="নিচে নিন"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                          <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                      {cat.slug}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          cat.active !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {cat.active !== false ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>সক্রিয়</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>নিষ্ক্রিয়</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-stone-800 transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => promptDeleteCategory(cat)}
                          disabled={checkingDelete}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors"
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

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              বিষয়ভিত্তিক শিরোনাম ও আইকন নির্বাচন করুন
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  ক্যাটাগরির নাম *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: উপন্যাস"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  স্লাগ (URL Slug)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="যেমন: novel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  আইকন নির্বাচন
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
                  {availableIcons.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                        icon === ic
                          ? 'bg-purple-700 text-white shadow-xs scale-105'
                          : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <CategoryIcon iconName={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  সংক্ষিপ্ত বিবরণ
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="এই বিভাগে কী ধরণের বই থাকবে..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    ক্রম সংখ্যা
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min={1}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 dark:text-stone-200">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>সক্রিয় ক্যাটাগরি</span>
                  </label>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Delete Safety Warning Modal (Requirement #9) */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  ক্যাটাগরি মোছার সতর্কতা
                </h3>

                {associatedBooksCount > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                      সতর্কতা: &quot;{categoryToDelete.name}&quot; ক্যাটাগরিতে বর্তমানে{' '}
                      <strong>{toBengaliNumerals(associatedBooksCount)}</strong> টি বই সংযুক্ত রয়েছে!
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      এটি স্থায়ীভাবে মুছে ফেললে বইগুলোর শ্রেণিবিন্যাস ক্ষতিগ্রস্ত হতে পারে। মুছে ফেলার পরিবর্তে আপনি ক্যাটাগরিটিকে <strong>নিষ্ক্রিয় (Deactivate)</strong> করতে পারেন।
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    আপনি কি নিশ্চিত যে &quot;{categoryToDelete.name}&quot; ক্যাটাগরিটি মুছে ফেলতে চান?
                  </p>
                )}

                <div className="pt-4 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    বাতিল
                  </button>

                  {associatedBooksCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleActive(categoryToDelete);
                        setDeleteModalOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-300"
                    >
                      নিষ্ক্রিয় করুন
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
