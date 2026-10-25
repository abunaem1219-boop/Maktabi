import React from 'react';
import { Project } from '../../types';
import { formatPageNumber } from '../../utils/bengali';

interface PageHeaderFooterProps {
  pageIndex: number;
  totalPages: number;
  project: Project;
  onEditHeaderFooter?: () => void;
  isPrintOrExport?: boolean;
}

export const PageHeaderFooter: React.FC<PageHeaderFooterProps> = ({
  pageIndex,
  project,
  onEditHeaderFooter,
  isPrintOrExport = false,
}) => {
  const isFirstPage = pageIndex === 1;
  const hideOnFirstPage = project.differentFirstPage && isFirstPage;
  const pageNumStr = formatPageNumber(pageIndex, project.numberingStyle || 'bengali');

  return (
    <>
      {/* Header Slot */}
      <div
        onClick={onEditHeaderFooter}
        title={!isPrintOrExport ? 'ডাবল ক্লিক করে হেডার এডিট করুন' : undefined}
        className={`page-header-slot w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none pb-2 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors ${
          !isPrintOrExport ? 'cursor-pointer hover:border-teal-500/80 hover:text-teal-600 dark:hover:text-teal-400' : ''
        }`}
      >
        <span className="truncate max-w-[65%] font-medium">
          {hideOnFirstPage ? '' : (project.headerText || project.title)}
        </span>
        <span className="text-[11px] font-mono tabular-nums opacity-80">
          {hideOnFirstPage ? '' : `${pageNumStr}`}
        </span>
      </div>

      {/* Watermark Overlay (if enabled) */}
      {project.watermark?.enabled && project.watermark.text && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
          style={{
            opacity: project.watermark.opacity || 0.15,
            transform: `rotate(${project.watermark.angle || -45}deg)`,
          }}
        >
          <span
            className="text-6xl md:text-8xl font-bold whitespace-nowrap tracking-widest uppercase font-serif"
            style={{ color: project.watermark.color || '#64748b' }}
          >
            {project.watermark.text}
          </span>
        </div>
      )}

      {/* Footer Slot */}
      <div
        onClick={onEditHeaderFooter}
        title={!isPrintOrExport ? 'ডাবল ক্লিক করে ফুটার এডিট করুন' : undefined}
        className={`page-footer-slot w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none pt-2 border-t border-slate-200/60 dark:border-slate-700/60 transition-colors ${
          !isPrintOrExport ? 'cursor-pointer hover:border-teal-500/80 hover:text-teal-600 dark:hover:text-teal-400' : ''
        }`}
      >
        <span className="truncate max-w-[60%] text-[11px]">
          {project.footerText || ''}
        </span>
        <span className="text-[11px] font-mono tabular-nums font-semibold">
          {pageNumStr}
        </span>
      </div>
    </>
  );
};
