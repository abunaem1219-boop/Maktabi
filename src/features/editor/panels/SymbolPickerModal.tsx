import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface SymbolPickerModalProps {
  onInsertSymbol: (symbol: string) => void;
  onClose: () => void;
}

export const SymbolPickerModal: React.FC<SymbolPickerModalProps> = ({
  onInsertSymbol,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'bengali' | 'math' | 'currency' | 'arabic' | 'arrows' | 'emoji'>('bengali');

  const SYMBOL_CATEGORIES = {
    bengali: {
      name: 'বাংলা চিহ্ন ও যুক্তাক্ষর',
      items: ['।', '॥', '৳', 'ঽ', 'ৎ', 'ং', 'ঃ', 'ঁ', '৺', '৲', 'ক্ষ', 'জ্ঞ', 'ষ্ণ', 'ঙ্গ', 'ঙ্ক', 'ঞ্জ', 'ঞ্চ', 'ম্প', 'ম্ভ', 'ন্দ', 'ন্ধ', 'ষ্ট', 'ষ্ঠ', 'ত্র', 'গ্র', 'শ্র', 'হ্ম'],
    },
    math: {
      name: 'গাণিতিক প্রতীক',
      items: ['±', '×', '÷', '≠', '≤', '≥', '∞', '∑', '√', 'π', '‰', '≈', '∂', '∫', '∝', '∠', '°', 'µ', '½', '¼', '¾', '²', '³', 'ⁿ'],
    },
    currency: {
      name: 'মুদ্রা',
      items: ['৳', '$', '€', '£', '¥', '₹', '₿', '₩', '₽', '¢', '₺', '₫'],
    },
    arabic: {
      name: 'আরবি ক্যালিগ্রাফি ও হরকত',
      items: ['﷽', 'ﷺ', 'ﷻ', 'ﷲ', 'ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ۖ', 'ۗ', 'ۘ', 'ۙ', 'ۚ', 'ۛ', 'ۜ', '۝', '۞'],
    },
    arrows: {
      name: 'তীর ও নির্দেশক',
      items: ['←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇔', '➔', '▲', '▼', '◄', '►', '✓', '✔', '✕', '✗', '★', '☆', '◆', '◇', '●', '○', '■', '□'],
    },
    emoji: {
      name: 'উপযোগী ইমোজি',
      items: ['✒️', '📝', '📖', '📚', '🔖', '📌', '💡', '✨', '⭐', '🔥', '❤️', '👍', '👏', '🎯', '⏳', '📅', '🔍', '⚙️', '💬', '🕊️', '🌿', '☕'],
    },
  };

  const handleSelect = (sym: string) => {
    onInsertSymbol(sym);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              বিশেষ চিহ্ন ও প্রতীক
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 no-scrollbar border-b border-slate-100 dark:border-slate-800">
          {Object.entries(SYMBOL_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as any)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Symbols Grid */}
        <div className="py-4 overflow-y-auto grid grid-cols-6 gap-2">
          {SYMBOL_CATEGORIES[activeTab].items.map((sym, idx) => (
            <button
              key={`${activeTab}-${idx}`}
              type="button"
              onClick={() => handleSelect(sym)}
              className="h-10 flex items-center justify-center text-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-500 text-slate-800 dark:text-slate-200 transition-all active:scale-95 shadow-xs"
            >
              {sym}
            </button>
          ))}
        </div>

        <div className="pt-2 text-center text-xs text-slate-400">
          যেকোনো চিহ্নে ক্লিক করলে তা সরাসরি লেখার ভেতর কার্সরে বসে যাবে।
        </div>
      </div>
    </div>
  );
};
