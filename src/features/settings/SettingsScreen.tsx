import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { AVAILABLE_FONTS } from '../../utils/fonts';
import {
  ArrowLeft, Palette, Globe, HardDrive, Trash2, Keyboard,
  Info, Check, Sparkles, ShieldCheck
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  language: Language;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onClearAllData: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  language,
  onUpdateSettings,
  onClearAllData,
  onBack,
}) => {
  const t = translations[language];
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [persistedStatus, setPersistedStatus] = useState<string | null>(null);

  const handlePersistStorage = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      setPersistedStatus(isPersisted ? 'স্থায়ী স্টোরেজ সক্রিয় রয়েছে ✓' : 'ব্রাউজারে সংরক্ষিত');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.appSettings}
          </h2>
        </div>
      </header>

      {/* Settings Form Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* 1. Theme and Appearance */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Palette className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              থিম ও ভাষা (Appearance & Language)
            </h3>
          </div>

          {/* Theme selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.theme}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'light', label: t.lightTheme },
                { id: 'dark', label: t.darkTheme },
                { id: 'system', label: 'সিস্টেম' },
                { id: 'amoled', label: t.amoledTheme },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: item.id as any })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    settings.theme === item.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.languageSetting}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bn', label: 'বাংলা (বাংলা ইন্টারফেস)' },
                { id: 'en', label: 'English (US)' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onUpdateSettings({ language: lang.id as any })}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                    settings.language === lang.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bengali Digits toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer select-none">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {t.useBengaliDigitsSetting} (১, ২, ৩)
            </span>
            <input
              type="checkbox"
              checked={settings.useBengaliDigits}
              onChange={(e) => onUpdateSettings({ useBengaliDigits: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
          </label>
        </section>

        {/* 2. Defaults for Editor */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              এডিটর ডিফল্ট (Editor Defaults)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.defaultFontSetting}
              </label>
              <select
                aria-label={t.defaultFontSetting}
                value={settings.defaultFont}
                onChange={(e) => onUpdateSettings({ defaultFont: e.target.value })}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.authorSetting}
              </label>
              <input
                type="text"
                value={settings.defaultAuthor || ''}
                onChange={(e) => onUpdateSettings({ defaultAuthor: e.target.value })}
                placeholder="লেখকের নাম..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* 3. Keyboard Shortcuts Table */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Keyboard className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {t.shortcutsTitle} (কিবোর্ড শর্টকাট)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { key: 'Ctrl + B', label: 'বোল্ড (Bold)' },
              { key: 'Ctrl + I', label: 'ইটালিক (Italic)' },
              { key: 'Ctrl + U', label: 'আন্ডারলাইন (Underline)' },
              { key: 'Ctrl + Z', label: 'পূর্বাবস্থায় ফেরা (Undo)' },
              { key: 'Ctrl + Y', label: 'পুনরায় করা (Redo)' },
              { key: 'Ctrl + S', label: 'তৎক্ষণাৎ সংরক্ষণ (Save)' },
              { key: 'Ctrl + F', label: 'খুঁজুন ও প্রতিস্থাপন' },
              { key: 'Ctrl + Enter', label: 'পেজ ব্রেক যোগ' },
              { key: 'Tab / Shift+Tab', label: 'ইন্ডেন্ট বাড়ানো / কমানো' },
              { key: 'Ctrl + P', label: 'প্রিন্ট / PDF এক্সপোর্ট' },
            ].map((sc) => (
              <div
                key={sc.key}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-400">{sc.label}</span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 shadow-2xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Storage & Clear Data */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <HardDrive className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              স্টোরেজ ও ডেটা (Storage)
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                অফলাইন পারসিস্টেন্ট স্টোরেজ
              </div>
              <div className="text-[11px] text-slate-400">
                ব্রাউজার যাতে কম মেমোরির কারণে ডেটা না মুছে ফেলে
              </div>
            </div>
            <button
              type="button"
              onClick={handlePersistStorage}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 transition-colors"
            >
              {persistedStatus || 'স্থায়ী নিশ্চিত করুন'}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors border border-red-200 dark:border-red-900/50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.clearAllData}</span>
            </button>
          </div>
        </section>

        {/* 5. About */}
        <section className="text-center py-6 text-xs text-slate-400 space-y-1">
          <div className="font-bold text-slate-600 dark:text-slate-400">
            মুক্তলিপি (Muktolipi) — সংস্করণ ১.০
          </div>
          <div>প্রফেশনাল মোবাইল-ফার্স্ট ওয়ার্ড ও বই এডিটর · সম্পূর্ণ অফলাইন ও সুরক্ষিত</div>
        </section>
      </main>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-sm font-bold">{t.clearAllData}</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.clearConfirm}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
