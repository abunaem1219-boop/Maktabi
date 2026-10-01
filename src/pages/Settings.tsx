import React from 'react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Sun, Moon, Laptop, BookOpen, Bell, Globe, Shield, Info, HardDrive } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'light',
      label: 'হালকা (Light)',
      icon: <Sun className="w-5 h-5 text-amber-600" />,
      desc: 'দিনের আলোতে আরামদায়ক পড়ার জন্য উপযুক্ত।',
    },
    {
      id: 'dark',
      label: 'গাঢ় (Dark)',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      desc: 'স্বল্প আলো ও রাতের জন্য চোখের স্বস্তিদায়ক থিম।',
    },
    {
      id: 'system',
      label: 'সিস্টেম (System)',
      icon: <Laptop className="w-5 h-5 text-stone-500" />,
      desc: 'আপনার ডিভাইস বা অপারেটিং সিস্টেমের থিম অনুসরণ করবে।',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
          সেটিংস ও পছন্দসমূহ
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          অ্যাপের আবহ, প্রদর্শন এবং অন্যান্য অভিজ্ঞতা নিজের মতো কাস্টমাইজ করুন
        </p>
      </div>

      {/* Theme Appearance Section */}
      <section className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
            অ্যাপের রূপরেখা (Appearance)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            বর্তমানে ব্যবহৃত থিম:{' '}
            <span className="font-semibold text-amber-700 dark:text-amber-400 uppercase">
              {resolvedTheme}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-700 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-700/20 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800">
                    {opt.icon}
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-700 dark:bg-amber-400 ring-4 ring-amber-700/20" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {opt.label}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Future Settings Sections (Explicitly Communicated) */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider px-1">
          অন্যান্য সুবিধা ও সেটিংস
        </h3>

        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800/80 shadow-sm overflow-hidden">
          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  রিডার ফন্ট ও ব্যবধান সেটিংস
                </h4>
                <p className="text-xs text-stone-400">হিন্দ শিলিগুড়ি, নোতো সেরিফ ও সেপিয়া মোড</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              Phase 3 (Reader)
            </span>
          </div>

          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-stone-800 text-blue-600 dark:text-blue-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  অফলাইন স্টোরেজ ব্যবস্থাপনা
                </h4>
                <p className="text-xs text-stone-400">IndexedDB ও ক্যাশ সাফাই ব্যবস্থাপনা</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
              Phase 4 (Offline)
            </span>
          </div>

          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-stone-800 text-purple-600 dark:text-purple-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  নোটিফিকেশন ও আপডেট
                </h4>
                <p className="text-xs text-stone-400">নতুন বই ও পাণ্ডুলিপি অনুমোদনের নোটিশ</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
              Phase 7
            </span>
          </div>

          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  ভাষা (Language)
                </h4>
                <p className="text-xs text-stone-400">বাংলা (পূর্বনির্ধারিত) ও English</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              বাংলা (BN)
            </span>
          </div>
        </div>
      </section>

      {/* About & Version Info */}
      <section className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              কিতাবখানা (KitabKhana)
            </h3>
            <p className="text-xs text-stone-400">সংস্করণ 1.0.0 (Phase 1 Foundation)</p>
          </div>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
          একটি অত্যাধুনিক উন্মুক্ত ডিজিটাল লাইব্রেরি এবং লেখক প্রকাশনা প্ল্যাটফর্ম। অফলাইনে নির্বিঘ্নে লিখুন এবং যেকোনো সময় পাঠকদের সাথে ভাগ করে নিন আপনার সাহিত্যকর্ম।
        </p>
      </section>
    </div>
  );
};
