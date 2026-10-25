import React from 'react';
import { PageMargins } from '../../types';
import { mmToPx } from '../../utils/units';

interface RulerProps {
  pageWidthMm: number;
  margins: PageMargins;
  zoom: number;
}

export const Ruler: React.FC<RulerProps> = ({ pageWidthMm, margins, zoom }) => {
  const widthPx = mmToPx(pageWidthMm);
  const leftMarginPx = mmToPx(margins.left);
  const rightMarginPx = mmToPx(margins.right);
  const totalCm = Math.floor(pageWidthMm / 10);

  // Generate tick marks for each cm and half-cm
  const ticks = [];
  for (let cm = 0; cm <= totalCm; cm++) {
    const posPx = mmToPx(cm * 10);
    ticks.push(
      <div
        key={`cm-${cm}`}
        className="absolute top-0 flex flex-col items-center pointer-events-none"
        style={{ left: `${posPx}px` }}
      >
        <div className="h-3 w-px bg-slate-400 dark:bg-slate-500" />
        <span className="text-[9px] font-sans text-slate-500 dark:text-slate-400 select-none mt-0.5 tabular-nums">
          {cm}
        </span>
      </div>
    );
    if (cm < totalCm) {
      const halfPosPx = mmToPx(cm * 10 + 5);
      ticks.push(
        <div
          key={`half-${cm}`}
          className="absolute top-0 pointer-events-none"
          style={{ left: `${halfPosPx}px` }}
        >
          <div className="h-1.5 w-px bg-slate-300 dark:bg-slate-600" />
        </div>
      );
    }
  }

  return (
    <div className="w-full overflow-hidden flex justify-center py-1 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 select-none">
      <div
        className="relative h-6 bg-slate-200/80 dark:bg-slate-800/80 rounded-sm shadow-inner transition-transform"
        style={{
          width: `${widthPx}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Left Margin Highlight */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-slate-300/80 dark:bg-slate-700/80 border-r border-teal-500/70"
          style={{ width: `${leftMarginPx}px` }}
        />
        {/* Right Margin Highlight */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-slate-300/80 dark:bg-slate-700/80 border-l border-teal-500/70"
          style={{ width: `${rightMarginPx}px` }}
        />

        {/* Cm & half-cm Ticks */}
        {ticks}
      </div>
    </div>
  );
};
