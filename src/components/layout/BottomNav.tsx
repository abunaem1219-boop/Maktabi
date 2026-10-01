import React from 'react';
import { Home, Search, Feather, Bookmark, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 safe-bottom transition-colors"
      aria-label="মোবাইল নেভিগেশন"
    >
      <div className="grid grid-cols-5 items-center h-16 px-2 max-w-lg mx-auto">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentView === 'home'
              ? 'text-amber-700 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">হোম</span>
        </button>

        {/* Search */}
        <button
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentView === 'search'
              ? 'text-amber-700 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">অনুসন্ধান</span>
        </button>

        {/* Write (Prominently Elevated Button) */}
        <div className="flex justify-center -mt-5">
          <button
            onClick={() => onNavigate('writer')}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              currentView === 'write' || currentView === 'writer'
                ? 'bg-amber-800 dark:bg-amber-500 ring-4 ring-amber-700/20 shadow-amber-900/40 scale-105'
                : 'bg-amber-700 dark:bg-amber-600 shadow-amber-900/30 hover:scale-105'
            }`}
            aria-label="বই বা অধ্যায় লিখুন"
          >
            <Feather className="w-5 h-5" />
          </button>
        </div>

        {/* Library */}
        <button
          onClick={() => onNavigate('library')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentView === 'library'
              ? 'text-amber-700 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">লাইব্রেরি</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            currentView === 'profile' || currentView === 'login' || currentView === 'register'
              ? 'text-amber-700 dark:text-amber-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">প্রোফাইল</span>
        </button>
      </div>
    </nav>
  );
};
