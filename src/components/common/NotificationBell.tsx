import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserNotification } from '../../types/book';
import { getUserNotifications, markNotificationAsRead } from '../../services/publishingService';
import { formatBengaliDate, toBengaliNumerals } from '../../utils/formatters';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Send,
  X,
  Check,
} from 'lucide-react';

interface NotificationBellProps {
  onNavigateToBook?: (bookId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateToBook }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let intervalId: any;
    const fetchNotifs = async () => {
      try {
        const list = await getUserNotifications(user.uid);
        setNotifications(list);
      } catch {
        // Ignore
      }
    };

    fetchNotifs();
    intervalId = setInterval(fetchNotifs, 15000); // 15s polling for notifications

    return () => clearInterval(intervalId);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await markNotificationAsRead(user.uid, notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'approved':
      case 'published':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'changes_requested':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'rejected':
      case 'unpublished':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'submission_received':
      default:
        return <Send className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        title="বিজ্ঞপ্তি ও নোটিফিকেশন"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : toBengaliNumerals(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                বিজ্ঞপ্তি সমূহ
              </h4>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {toBengaliNumerals(unreadCount)} টি নতুন
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                কোনো নতুন বিজ্ঞপ্তি নেই
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read && user) {
                      markNotificationAsRead(user.uid, n.id);
                    }
                    if (onNavigateToBook && n.bookId) {
                      setOpen(false);
                      onNavigateToBook(n.bookId);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-colors cursor-pointer text-xs space-y-1 ${
                    n.read
                      ? 'bg-stone-50/60 dark:bg-stone-850/40 border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-stone-900 dark:text-stone-100 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getIcon(n.type)}
                      <span className="font-bold truncate">{n.title}</span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md text-stone-400"
                        title="পঠিত চিহ্নিত করুন"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                    {n.message}
                  </p>

                  <div className="text-[9px] text-stone-400 pt-0.5">
                    {formatBengaliDate(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
