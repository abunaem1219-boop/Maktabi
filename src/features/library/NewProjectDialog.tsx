import React, { useState } from 'react';
import { ProjectType, PageSizeName, Orientation, PageMargins } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { PAGE_PRESETS, MARGIN_PRESETS, createDefaultPageSetup } from '../../utils/units';
import { X, FileText, Book, Sparkles, Check } from 'lucide-react';

interface NewProjectDialogProps {
  language: Language;
  onCreateProject: (params: {
    title: string;
    type: ProjectType;
    pageSize: PageSizeName;
    orientation: Orientation;
    margins: PageMargins;
    marginPresetName: string;
  }) => void;
  onClose: () => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  language,
  onCreateProject,
  onClose,
}) => {
  const t = translations[language];

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('document');
  const [pageSize, setPageSize] = useState<PageSizeName>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<string>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || (type === 'book' ? 'নতুন বই' : 'নতুন ডকুমেন্ট');
    const selectedMarginConfig = MARGIN_PRESETS[marginPreset]?.margins || MARGIN_PRESETS.normal.margins;

    onCreateProject({
      title: finalTitle,
      type,
      pageSize,
      orientation,
      margins: selectedMarginConfig,
      marginPresetName: marginPreset,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.createProjectTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* 1. Project Type Selector (Document vs Book) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.projectTypeLabel}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('document')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  type === 'document'
                    ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <FileText className={`w-5 h-5 ${type === 'document' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                  {type === 'document' && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.document}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {t.documentDesc}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('book');
                  setPageSize('Novel');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  type === 'book'
                    ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Book className={`w-5 h-5 ${type === 'book' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                  {type === 'book' && <Check className="w-4 h-4 text-teal-600" />}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.book}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {t.bookDesc}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              প্রজেক্টের নাম (Title)
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'book' ? 'যেমন: নীল জোছনার উপাখ্যান' : 'যেমন: নতুন প্রস্তাবনা ও কার্যবিবরণী'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 3. Page Size Preset Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.pageSizeLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['A4', 'A5', 'Novel', 'Pocket', 'Letter', 'B5'] as PageSizeName[]).map((sizeKey) => {
                const item = PAGE_PRESETS[sizeKey];
                const isSelected = pageSize === sizeKey;
                return (
                  <button
                    key={sizeKey}
                    type="button"
                    onClick={() => setPageSize(sizeKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {item.widthMm} × {item.heightMm} mm
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Orientation & Margins */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.orientationLabel}
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-colors ${
                    orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  লম্বালম্বি
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-colors ${
                    orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  আড়াআড়ি
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.marginLabel}
              </label>
              <select
                aria-label={t.marginLabel}
                value={marginPreset}
                onChange={(e) => setMarginPreset(e.target.value)}
                className="w-full h-9 px-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="normal">সাধারণ (Normal ২৫.৪ মিমি)</option>
                <option value="narrow">সংকীর্ণ (Narrow ১২.৭ মিমি)</option>
                <option value="moderate">পরিমিত (Moderate)</option>
                <option value="wide">প্রশস্ত (Wide)</option>
                <option value="mirrored">বই বাঁধানোর জন্য (Mirrored)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.99] rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{t.createBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
