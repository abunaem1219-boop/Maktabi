import React, { useState, useRef } from 'react';
import { Project } from '../../../types';
import { X, Image, BookCheck, Upload, Sparkles } from 'lucide-react';

interface CoverPageModalProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onClose: () => void;
}

export const CoverPageModal: React.FC<CoverPageModalProps> = ({
  project,
  onUpdateProject,
  onClose,
}) => {
  const [author, setAuthor] = useState(project.author || '');
  const [subtitle, setSubtitle] = useState(project.subtitle || '');
  const [dedication, setDedication] = useState(project.dedication || '');
  const [copyright, setCopyright] = useState(
    project.copyright || `© ${new Date().getFullYear()} ${project.author || 'লেখক'}। সর্বস্বত্ব সংরক্ষিত।`
  );
  const [coverImage, setCoverImage] = useState<string | undefined>(project.coverImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCoverImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyTemplate = (type: 'novel' | 'islamic' | 'poetry' | 'notebook') => {
    let font = 'noto-serif-bengali';
    let margins = { top: 25.4, bottom: 25.4, left: 31.75, right: 25.4 }; // mirrored
    let size: any = 'Novel';

    if (type === 'novel') {
      font = 'noto-serif-bengali';
      size = 'Novel';
    } else if (type === 'islamic') {
      font = 'amiri';
      size = 'B5';
    } else if (type === 'poetry') {
      font = 'hind-siliguri';
      size = 'Square';
    } else if (type === 'notebook') {
      font = 'noto-sans-bengali';
      size = 'A5';
    }

    onUpdateProject({
      author,
      subtitle,
      dedication,
      copyright,
      coverImage,
      pageSetup: {
        ...project.pageSetup,
        size,
        margins,
      },
    });
    alert('টেমপ্লেট সফলভাবে প্রয়োগ করা হয়েছে!');
    onClose();
  };

  const handleSave = () => {
    onUpdateProject({
      author,
      subtitle,
      dedication,
      copyright,
      coverImage,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              বইয়ের কভার পেজ ও তথ্য
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Cover image preview & upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              কভার চিত্র (Cover Image)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {coverImage ? (
              <div className="relative w-36 h-48 mx-auto rounded-xl overflow-hidden border-2 border-teal-500 shadow-lg">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-2 py-1 text-[10px] bg-black/70 text-white rounded-md"
                >
                  পরিবর্তন
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-36 h-48 mx-auto rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 flex flex-col items-center justify-center p-3 cursor-pointer bg-slate-50 dark:bg-slate-800/40 text-center"
              >
                <Upload className="w-6 h-6 text-teal-600 mb-1" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  কভার ছবি আপলোড করুন
                </span>
              </div>
            )}
          </div>

          {/* Author and Subtitle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                লেখকের নাম
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="লেখকের নাম..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                উপ-শিরোনাম (Subtitle)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="উপ-শিরোনাম..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dedication */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              উৎসর্গ পেজের বার্তা (Dedication)
            </label>
            <textarea
              rows={2}
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="যাঁদের অনুপ্রেরণায় এই বই..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Copyright notice */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              কপিরাইট তথ্য (Copyright Page)
            </label>
            <textarea
              rows={2}
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Preset Book Templates */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              বইয়ের দ্রুত টেমপ্লেট প্রিসেট
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleApplyTemplate('novel')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  উপন্যাস (Novel)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  5×8 in মাপ, সেরিফ ফন্ট, পরিমিত মার্জিন
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate('poetry')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  কবিতার বই (Poetry)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Square মাপ, মার্জিত ফন্ট
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate('islamic')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  ধর্মীয় / শিক্ষামূলক
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  B5 মাপ, আমিরী ও আরবি ফন্ট
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate('notebook')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  নোটবুক (A5)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  148×210 mm, নোটো সান্স ফন্ট
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
