import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Search,
  Feather,
  Bookmark,
  User as UserIcon,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { getInitials } from '../../utils/formatters';

interface DesktopSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentView, onNavigate }) => {
  const { user, userProfile, isAdmin, openLogoutModal } = useAuth();

  const navItems = [
    { id: 'home', label: 'হোম পেজ', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'অনুসন্ধান ও ফিল্টার', icon: <Search className="w-5 h-5" /> },
    { id: 'library', label: 'আমার লাইব্রেরি', icon: <Bookmark className="w-5 h-5" /> },
    { id: 'writer', label: 'রাইটার স্টুডিও (Writer)', icon: <Feather className="w-5 h-5" />, highlight: true },
    { id: 'profile', label: 'আমার প্রোফাইল', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'সেটিংস ও পছন্দসমূহ', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 h-[calc(100vh-4rem)] sticky top-16 transition-colors">
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
              } ${item.highlight && !isActive ? 'text-amber-700 dark:text-amber-400 font-bold' : ''}`}
            >
              <span className={isActive ? 'text-amber-800 dark:text-amber-400' : 'text-stone-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  নতুন
                </span>
              )}
            </button>
          );
        })}

        {/* Admin Link if Authorized */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="px-4 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
              প্রশাসক এলাকা
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 shadow-xs'
                  : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>অ্যাডমিন ড্যাশবোর্ড</span>
            </button>
          </div>
        )}
      </div>

      {/* User Section / Auth Prompt at Bottom */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-stone-50 dark:bg-stone-850">
            <div className="flex items-center gap-3 overflow-hidden">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-700 dark:bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {getInitials(userProfile?.name || user.displayName || '')}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {userProfile?.name || 'পাঠক'}
                </p>
                <p className="text-[11px] text-stone-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={openLogoutModal}
              className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              <span>লগইন করুন</span>
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-2 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>নতুন অ্যাকাউন্ট</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
