import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { EditProfileModal } from './EditProfileModal';
import { formatBengaliDate, getInitials } from '../utils/formatters';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Edit3,
  Bookmark,
  Heart,
  Feather,
  Settings,
  LogOut,
  ShieldCheck,
  CheckCircle,
  LogIn,
} from 'lucide-react';

interface ProfileProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, userProfile, isAdmin, openLogoutModal } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          প্রোফাইল দেখতে প্রবেশ করুন
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          আপনার সংরক্ষিত বই, বুকমার্ক এবং লেখক স্টুডিও অ্যাক্সেস করতে কিতাবখানায় লগইন করুন।
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-md shadow-amber-900/20"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন করুন</span>
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors"
          >
            <span>নিবন্ধন করুন</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.name}
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-amber-700/10 dark:ring-amber-500/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-linear-to-tr from-amber-800 to-amber-600 text-white text-3xl font-extrabold flex items-center justify-center shadow-lg shadow-amber-950/20">
                {getInitials(userProfile?.name || user.displayName || '')}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-stone-900">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {userProfile?.name || user.displayName || 'সম্মানিত পাঠক'}
              </h1>

              {isAdmin ? (
                <Badge variant="admin">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrator</span>
                </Badge>
              ) : userProfile?.role === 'author' ? (
                <Badge variant="author">লেখক (Author)</Badge>
              ) : (
                <Badge variant="secondary">সাধারণ পাঠক</Badge>
              )}

              <Badge variant="success">সক্রিয় (Active)</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>নিবন্ধন: {formatBengaliDate(userProfile?.createdAt)}</span>
              </span>
            </div>

            {userProfile?.bio ? (
              <p className="text-sm text-stone-600 dark:text-stone-300 pt-1 leading-relaxed">
                {userProfile.bio}
              </p>
            ) : (
              <p className="text-xs text-stone-400 italic pt-1">
                কোনো পরিচিতি যোগ করা হয়নি।
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('author', user.uid)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-all"
              title="পাঠকরা আপনার যে পাবলিক প্রোফাইল দেখতে পান"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>পাবলিক প্রোফাইল</span>
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>প্রোফাইল সম্পাদনা</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Shortcut Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <button
          onClick={() => onNavigate('library')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                আমার বুকমার্কসমূহ
              </h4>
              <p className="text-xs text-stone-400">সংরক্ষিত পৃষ্ঠা ও অবস্থান</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('library')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-stone-800 text-rose-600 dark:text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                পছন্দের তালিকা
              </h4>
              <p className="text-xs text-stone-400">আপনার প্রিয় বইসমূহ</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('write')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                আমার লেখালেখি
              </h4>
              <p className="text-xs text-stone-400">খসড়া ও প্রকাশিত বই</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-600/40 text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                সেটিংস ও পছন্দসমূহ
              </h4>
              <p className="text-xs text-stone-400">থিম ও অ্যাপ কাস্টমাইজেশন</p>
            </div>
          </div>
        </button>

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 hover:border-purple-500 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  অ্যাডমিন ড্যাশবোর্ড
                </h4>
                <p className="text-xs text-purple-600 dark:text-purple-400">ইউজার ও বই পরিচালনা</p>
              </div>
            </div>
          </button>
        )}

        <button
          onClick={openLogoutModal}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 dark:hover:border-rose-900 text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                লগআউট করুন
              </h4>
              <p className="text-xs text-stone-400">অ্যাকাউন্ট থেকে প্রস্থান</p>
            </div>
          </div>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  );
};
