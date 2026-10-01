import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastType } from '../../types/toast';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-amber-800 dark:text-amber-400 shrink-0" />,
};

const borders: Record<ToastType, string> = {
  success: 'border-l-4 border-l-emerald-500 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
  warning: 'border-l-4 border-l-amber-500 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
  error: 'border-l-4 border-l-rose-500 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
  info: 'border-l-4 border-l-amber-700 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full px-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg shadow-stone-950/10 transition-all transform duration-200 ${borders[toast.type]}`}
          role="alert"
        >
          {icons[toast.type]}
          <div className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-200 pt-0.5">
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-0.5"
            aria-label="বিজ্ঞপ্তি বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
