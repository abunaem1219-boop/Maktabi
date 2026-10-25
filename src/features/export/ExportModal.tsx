import React, { useState } from 'react';
import { Project } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { exportToImageBasedPdf, printDocument } from './pdf';
import { exportToDocx } from './docx';
import { exportToHtml, exportToTxt, exportToMarkdown, exportProjectBackupJson } from './textExports';
import { X, FileDown, Printer, Share2, Loader2, FileText, Code2 } from 'lucide-react';

interface ExportModalProps {
  project: Project;
  language: Language;
  pagesContainerRef: React.RefObject<HTMLDivElement | null>;
  editorHtml: string;
  editorText: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  language,
  pagesContainerRef,
  editorHtml,
  editorText,
  onClose,
}) => {
  const t = translations[language];
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handleExportPdfImage = async () => {
    if (!pagesContainerRef.current) return;
    try {
      setIsExporting(true);
      setProgress(10);
      setStatusMessage('PDF প্রস্তুত হচ্ছে…');

      const blob = await exportToImageBasedPdf(pagesContainerRef.current, project, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      // Trigger Web Share or download
      const { shareOrSaveFile } = await import('./pdf');
      await shareOrSaveFile(blob, `${project.title || 'document'}.pdf`, 'application/pdf');

      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('PDF export error:', err);
      alert('ছবি-ভিত্তিক PDF তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে প্রিন্ট ভিউ PDF অপশনটি ব্যবহার করুন।');
      setIsExporting(false);
    }
  };

  const handleExportPdfPrint = () => {
    printDocument(project, editorHtml);
    onClose();
  };

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      setStatusMessage('DOCX তৈরি হচ্ছে…');
      await exportToDocx(project);
      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('DOCX export error:', err);
      alert('DOCX ফাইলে রূপান্তর করার সময় ত্রুটি ঘটেছে।');
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: `${project.title}\n\n${editorText.substring(0, 300)}...`,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    } else {
      navigator.clipboard?.writeText(editorText);
      alert('ডকুমেন্টের লেখা ক্লিপবোর্ডে কপি করা হয়েছে!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.export}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress state */}
        {isExporting ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center px-4">
              {statusMessage || t.exporting}
            </p>
            <div className="w-full max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400">{progress}%</span>
          </div>
        ) : (
          <div className="my-4 space-y-2.5">
            {/* 1. PDF Options */}
            <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/20 space-y-2">
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                PDF ও প্রিন্ট অপশন
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportPdfImage}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 hover:border-teal-500 text-left transition-colors shadow-xs"
                >
                  <div className="text-xs font-semibold text-teal-900 dark:text-teal-100 flex items-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5 text-teal-600" />
                    <span>PDF (নির্ভুল ইমেজ)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    হুবহু স্ক্রিনের ফন্ট ও লেআউট
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdfPrint}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 hover:border-teal-500 text-left transition-colors shadow-xs"
                >
                  <div className="text-xs font-semibold text-teal-900 dark:text-teal-100 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-teal-600" />
                    <span>প্রিন্ট / ভেক্টর PDF</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    সিলেক্টযোগ্য টেক্সট ও সরাসরি প্রিন্ট
                  </div>
                </button>
              </div>
            </div>

            {/* 2. DOCX */}
            <button
              type="button"
              onClick={handleExportDocx}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.exportDocx}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  MS Word / Google Docs (বাংলা ফন্ট ও কমপ্লেক্স স্ক্রিপ্ট সাপোর্টসহ)
                </div>
              </div>
              <FileDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* 3. HTML & TXT & MD */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={async () => {
                  await exportToHtml(project, editorHtml);
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-center transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">HTML</div>
                <div className="text-[10px] text-slate-400">ওয়েব পেজ</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await exportToTxt(project, editorText);
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-center transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">TXT</div>
                <div className="text-[10px] text-slate-400">প্লেইন টেক্সট</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await exportToMarkdown(project, editorText);
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-center transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">MD</div>
                <div className="text-[10px] text-slate-400">মার্কডাউন</div>
              </button>
            </div>

            {/* 4. Project Backup JSON & Direct Share */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await exportProjectBackupJson(project);
                  onClose();
                }}
                className="flex-1 py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 truncate"
              >
                JSON ব্যাকআপ
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>শেয়ার</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
