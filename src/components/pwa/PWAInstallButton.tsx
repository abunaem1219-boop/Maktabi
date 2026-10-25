import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        <span>অ্যাপ ইনস্টল</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span>iOS এ ইনস্টল</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                iPhone / iPad এ ইনস্টল করার নিয়ম
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ১. সাফারি ব্রাউজারের নিচের <strong>শেয়ার (Share)</strong> বাটনে চাপুন।<br />
                ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> এ চাপুন।
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
