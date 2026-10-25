import React, { useState } from 'react';
import { Project, WatermarkConfig } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { X, Check } from 'lucide-react';

interface HeaderFooterModalProps {
  project: Project;
  language: Language;
  onSave: (updates: Partial<Project>) => void;
  onClose: () => void;
}

export const HeaderFooterModal: React.FC<HeaderFooterModalProps> = ({
  project,
  language,
  onSave,
  onClose,
}) => {
  const t = translations[language];

  const [headerText, setHeaderText] = useState(project.headerText || '');
  const [footerText, setFooterText] = useState(project.footerText || '');
  const [differentFirstPage, setDifferentFirstPage] = useState(!!project.differentFirstPage);
  const [numberingStyle, setNumberingStyle] = useState<'bengali' | 'english' | 'roman'>(
    project.numberingStyle || 'bengali'
  );

  const [watermark, setWatermark] = useState<WatermarkConfig>(
    project.watermark || {
      enabled: false,
      text: 'খসড়া',
      opacity: 0.15,
      angle: -45,
      color: '#64748b',
    }
  );

  const handleSave = () => {
    onSave({
      headerText,
      footerText,
      differentFirstPage,
      numberingStyle,
      watermark,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t.headerFooter} ও {t.watermark}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              হেডার (Header)
            </h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                হেডার টেক্সট
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="যেমন: অধ্যায় ১ / নথির শিরোনাম"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={differentFirstPage}
                onChange={(e) => setDifferentFirstPage(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>প্রথম পেজে হেডার লুকান (Different First Page)</span>
            </label>
          </div>

          {/* Footer & Numbering section */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              ফুটার ও পেজ নম্বর (Footer)
            </h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ফুটার টেক্সট
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="যেমন: গোপনীয় / সর্বস্বত্ব সংরক্ষিত"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                পেজ নাম্বারিং ফরম্যাট
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bengali', label: 'বাংলা (১, ২, ৩)' },
                  { id: 'english', label: 'English (1, 2, 3)' },
                  { id: 'roman', label: 'Roman (i, ii, iii)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNumberingStyle(item.id as any)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                      numberingStyle === item.id
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Watermark Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {t.watermark}
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermark.enabled}
                  onChange={(e) => setWatermark({ ...watermark, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {watermark.enabled && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    জলছাপ টেক্সট
                  </label>
                  <input
                    type="text"
                    value={watermark.text}
                    onChange={(e) => setWatermark({ ...watermark, text: e.target.value })}
                    placeholder="খসড়া / গোপনীয় / DRAFT"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      স্বচ্ছতা (Opacity): {Math.round(watermark.opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.05"
                      value={watermark.opacity}
                      onChange={(e) =>
                        setWatermark({ ...watermark, opacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      ঘূর্ণন কোণ (Angle): {watermark.angle}°
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="15"
                      value={watermark.angle}
                      onChange={(e) =>
                        setWatermark({ ...watermark, angle: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-teal-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" />
            {t.saveBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
