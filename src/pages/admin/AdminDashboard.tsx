import React, { useEffect, useState } from 'react';
import { getAdminDetailedStats, seedDemoLibrary } from '../../services/adminService';
import { toBengaliNumerals } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  BookOpen,
  FolderTree,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  PlusCircle,
  FileCheck,
  FileArchive,
  Database,
  Clock,
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectTab }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalBooks: number;
    publishedBooks: number;
    draftBooks: number;
    archivedBooks: number;
    featuredBooks: number;
    totalCategories: number;
    totalAuthors: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await getAdminDetailedStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeedDemoData = async () => {
    if (!window.confirm('আপনি কি টেস্ট ডেমো বই ও ক্যাটাগরি ডাটাবেসে সিড করতে চান?')) {
      return;
    }
    setSeeding(true);
    try {
      const res = await seedDemoLibrary();
      showToast(
        `সফলভাবে ${toBengaliNumerals(res.categoriesSeeded)} টি ক্যাটাগরি ও ${toBengaliNumerals(res.booksSeeded)} টি ডেমো বই যুক্ত হয়েছে!`,
        'success'
      );
      await loadStats();
    } catch (err) {
      showToast('ডেমো ডাটা সিড করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const statCards = [
    {
      id: 'reviews',
      title: 'রিভিউয়ের অপেক্ষায়',
      count: stats ? toBengaliNumerals((stats as any).pendingReviews || 0) : '০',
      desc: 'লেখকদের পাঠানো নতুন কিতাব',
      icon: <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      action: () => onSelectTab('reviews'),
      actionLabel: 'রিভিউ কিউ দেখুন',
      highlight: true,
    },
    {
      id: 'books',
      title: 'সর্বমোট বই',
      count: stats ? toBengaliNumerals(stats.totalBooks) : '০',
      desc: 'ডাটাবেসে সংরক্ষিত মোট বই',
      icon: <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      action: () => onSelectTab('books'),
      actionLabel: 'বই পরিচালনা করুন',
    },
    {
      id: 'published',
      title: 'প্রকাশিত বই',
      count: stats ? toBengaliNumerals(stats.publishedBooks) : '০',
      desc: 'পাঠকদের জন্য উন্মুক্ত (Public)',
      icon: <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      action: () => onSelectTab('books'),
      actionLabel: 'প্রকাশিত বই দেখুন',
    },
    {
      id: 'categories',
      title: 'ক্যাটাগরিসমূহ',
      count: stats ? toBengaliNumerals(stats.totalCategories) : '০',
      desc: 'সক্রিয় বিষয়ভিত্তিক শ্রেণিবিন্যাস',
      icon: <FolderTree className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      action: () => onSelectTab('categories'),
      actionLabel: 'ক্যাটাগরি ম্যানেজ করুন',
    },
    {
      id: 'featured',
      title: 'নির্বাচিত বই',
      count: stats ? toBengaliNumerals(stats.featuredBooks) : '০',
      desc: 'হোমে প্রদর্শিত বিশেষ বই',
      icon: <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      action: () => onSelectTab('books'),
      actionLabel: 'নির্বাচিত বই তালিকা',
    },
    {
      id: 'users',
      title: 'নিবন্ধিত ব্যবহারকারী',
      count: stats ? toBengaliNumerals(stats.totalUsers) : '০',
      desc: 'রিয়েলটাইম ডাটাবেসে মোট পাঠক',
      icon: <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      action: () => onSelectTab('users'),
      actionLabel: 'ইউজার তালিকা দেখুন',
    },
    {
      id: 'archived',
      title: 'আর্কাইভকৃত বই',
      count: stats ? toBengaliNumerals(stats.archivedBooks) : '০',
      desc: 'অপ্রকাশিত বা লুকানো বই',
      icon: <FileArchive className="w-6 h-6 text-stone-600 dark:text-stone-400" />,
      bg: 'bg-stone-100 dark:bg-stone-850',
      action: () => onSelectTab('books'),
      actionLabel: 'আর্কাইভ দেখুন',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-purple-900 via-indigo-950 to-stone-900 text-white shadow-xl shadow-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>প্রশাসনিক নিয়ন্ত্রণ কেন্দ্র</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            অ্যাডমিন ড্যাশবোর্ড
          </h2>
          <p className="text-sm text-purple-200/80 leading-relaxed">
            কিতাবখানা প্ল্যাটফর্মের রিয়েলটাইম বই ক্যাটালগ, ক্যাটাগরি ও ব্যবহারকারী পর্যবেক্ষণ।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSelectTab('books')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন বই যোগ করুন</span>
          </button>

          <button
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-xs transition-all disabled:opacity-50"
            title="পরীক্ষামূলক ডেমো ডাটা তৈরি করুন"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
            ) : (
              <Database className="w-4 h-4 text-purple-300" />
            )}
            <span>ডেমো ডাটা সিড করুন</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-2xl ${card.bg}`}>{card.icon}</div>
              <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {card.count}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {card.title}
              </h4>
              <p className="text-xs text-stone-400 mt-0.5">{card.desc}</p>
            </div>

            <button
              onClick={card.action}
              className="pt-2 border-t border-stone-100 dark:border-stone-800 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline flex items-center justify-between"
            >
              <span>{card.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
