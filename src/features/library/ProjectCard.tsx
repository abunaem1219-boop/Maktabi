import React, { useState } from 'react';
import { Project } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { toBengaliNumber } from '../../utils/bengali';
import { exportProjectBackupJson } from '../export/textExports';
import {
  FileText, Book, MoreVertical, Copy, Edit2, Trash2,
  FileDown, Calendar, Clock
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  language: Language;
  viewMode: 'grid' | 'list';
  onOpen: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
  useBengaliDigits?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  language,
  viewMode,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
  useBengaliDigits = true,
}) => {
  const t = translations[language];
  const [menuOpen, setMenuOpen] = useState(false);

  // Extract snippet text
  const getPreviewSnippet = () => {
    try {
      if (typeof project.content === 'object' && project.content?.content) {
        for (const node of project.content.content) {
          if (node.type === 'paragraph' && node.content) {
            const str = node.content.map((c: any) => c.text || '').join('');
            if (str.trim()) return str.trim();
          }
        }
      }
    } catch (e) {}
    return 'কোনো টেক্সট নেই...';
  };

  const formattedDate = new Date(project.updatedAt).toLocaleDateString(
    language === 'bn' ? 'bn-BD' : 'en-US',
    { month: 'short', day: 'numeric' }
  );

  const wordCountStr = useBengaliDigits
    ? toBengaliNumber(project.wordCount || 0)
    : (project.wordCount || 0).toString();

  if (viewMode === 'list') {
    return (
      <div className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-teal-500/80 transition-all hover:shadow-sm">
        <div onClick={onOpen} className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            {project.type === 'book' ? <Book className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {project.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{wordCountStr} {t.words}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px]">{project.pageSetup.size}</span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* 3-dot menu */}
        <div className="relative shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-10 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 space-y-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {t.rename}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <Copy className="w-3.5 h-3.5" />
                {t.duplicate}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  exportProjectBackupJson(project);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <FileDown className="w-3.5 h-3.5" />
                {t.exportBackup}
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.delete}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid Card
  return (
    <div className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-teal-500/80 transition-all hover:shadow-md cursor-pointer">
      <div onClick={onOpen} className="flex-1">
        {/* Top bar of card */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            {project.type === 'book' ? <Book className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {project.pageSetup.size}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2">
          {project.title}
        </h4>

        {/* Content Snippet */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
          {getPreviewSnippet()}
        </p>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {wordCountStr} {t.words}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formattedDate}</span>
        </div>

        {/* 3-dot trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-8 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 space-y-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {t.rename}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <Copy className="w-3.5 h-3.5" />
                {t.duplicate}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  exportProjectBackupJson(project);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-left"
              >
                <FileDown className="w-3.5 h-3.5" />
                {t.exportBackup}
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.delete}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
