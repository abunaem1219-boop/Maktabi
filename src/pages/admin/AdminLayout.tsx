import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminBooks } from './AdminBooks';
import { AdminCategories } from './AdminCategories';
import { AdminReviews } from './AdminReviews';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  PenTool,
  Tags,
  Image,
  Bell,
  Settings,
  ArrowLeft,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

interface AdminLayoutProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          প্রবেশাধিকার সংরক্ষিত
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          এই পৃষ্ঠাটি শুধুমাত্র প্ল্যাটফর্ম প্রশাসকদের জন্য অনুমোদিত।
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোমে ফিরে যান</span>
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="w-4 h-4" />, ready: true },
    { id: 'books', label: 'বই ব্যবস্থাপনা', icon: <BookOpen className="w-4 h-4" />, ready: true },
    { id: 'categories', label: 'ক্যাটাগরি ম্যানেজমেন্ট', icon: <Tags className="w-4 h-4" />, ready: true },
    { id: 'users', label: 'ব্যবহারকারী পরিচালনা', icon: <Users className="w-4 h-4" />, ready: true },
    { id: 'reviews', label: 'অনুমোদন ও রিভিউ (Review Queue)', icon: <Clock className="w-4 h-4" />, ready: true },
    { id: 'authors', label: 'লেখক প্রোফাইল', icon: <PenTool className="w-4 h-4" />, ready: false, phase: 'Phase 6' },
    { id: 'banners', label: 'ব্যানার ও বিজ্ঞাপন', icon: <Image className="w-4 h-4" />, ready: false, phase: 'Phase 6' },
    { id: 'announcements', label: 'ঘোষণা ও নোটিশ', icon: <Bell className="w-4 h-4" />, ready: false, phase: 'Phase 7' },
    { id: 'settings', label: 'প্ল্যাটফর্ম কনফিগ', icon: <Settings className="w-4 h-4" />, ready: false, phase: 'Phase 6' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="হোমে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                কিতাবখানা অ্যাডমিন কনসোল
              </h1>
            </div>
            <p className="text-xs text-stone-400">
              সুপার অ্যাডমিনের জন্য সুরক্ষিত প্রশাসনিক প্যানেল
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
            ADMIN UID: {user?.uid.substring(0, 8)}...
          </span>
        </div>
      </div>

      {/* Admin Horizontal Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 dark:border-stone-800">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 border border-stone-200 dark:border-stone-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {!item.ready && (
                <span className="text-[9px] bg-stone-200 dark:bg-stone-800 text-stone-500 px-1.5 py-0.2 rounded font-normal">
                  {item.phase}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab View Content */}
      {activeTab === 'dashboard' && <AdminDashboard onSelectTab={setActiveTab} />}
      {activeTab === 'books' && (
        <AdminBooks onNavigateToPreview={(id) => onNavigate('book', id)} />
      )}
      {activeTab === 'categories' && <AdminCategories />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'reviews' && <AdminReviews />}
      {activeTab !== 'dashboard' &&
        activeTab !== 'books' &&
        activeTab !== 'categories' &&
        activeTab !== 'users' &&
        activeTab !== 'reviews' && (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <Clock className="w-10 h-10 text-purple-500 mx-auto" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              এই মডিউলটি পরবর্তী ধাপে কার্যকর করা হবে।
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200"
            >
              ড্যাশবোর্ডে ফিরুন
            </button>
          </div>
        )}
    </div>
  );
};
