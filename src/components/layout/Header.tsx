import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BookOpen, Search, Sun, Moon, ShieldCheck, User as UserIcon } from 'lucide-react';
import { getInitials } from '../../utils/formatters';
import { NotificationBell } from '../common/NotificationBell';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string, subParam?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, userProfile, isAdmin } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group text-left shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-900/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 block leading-tight">
              কিতাবখানা
            </span>
            <span className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold block leading-none">
              KitabKhana
            </span>
          </div>
        </button>

        {/* Search Bar Trigger (Visible on tablet and desktop) */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full border text-sm transition-all ${
              currentView === 'search'
                ? 'border-amber-700 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-stone-100 ring-2 ring-amber-700/20'
                : 'border-stone-200 dark:border-stone-750 bg-stone-100/70 dark:bg-stone-800/70 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Search className="w-4 h-4 text-stone-400" />
            <span className="text-stone-400 font-normal">বই, লেখক বা ক্যাটাগরি খুঁজুন...</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin shortcut badge if authorized */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
              }`}
              title="অ্যাডমিন প্যানেল"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">অ্যাডমিন</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="থিম পরিবর্তন করুন"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-stone-600" />
            )}
          </button>

          {/* Realtime Notifications */}
          <NotificationBell onNavigateToBook={(bookId) => onNavigate('book', bookId)} />

          {/* User Profile or Login CTA */}
          {user ? (
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border transition-all ${
                currentView === 'profile'
                  ? 'border-amber-700 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-stone-200 dark:border-stone-750 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-700 dark:bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                  {getInitials(userProfile?.name || user.displayName || '')}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-semibold text-stone-800 dark:text-stone-200 max-w-[100px] truncate">
                {userProfile?.name || 'পাঠক'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
