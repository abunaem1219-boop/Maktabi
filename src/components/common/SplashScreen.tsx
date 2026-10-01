import React from 'react';
import { BookOpen } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <div className="flex flex-col items-center animate-fade-in px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-900/20 mb-6 relative">
          <BookOpen className="w-10 h-10 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-stone-50 dark:border-stone-950" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-1">
          কিতাবখানা
        </h1>
        <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold mb-2">
          KitabKhana
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          আপনার প্রিয় ডিজিটাল লাইব্রেরি ও সাহিত্য আঙিনা
        </p>

        <div className="mt-8 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
};
