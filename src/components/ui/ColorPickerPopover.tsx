import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';

interface ColorPickerPopoverProps {
  currentColor?: string;
  onSelectColor: (color: string) => void;
  onClear: () => void;
  title: string;
}

const PALETTE = [
  '#000000', '#1e293b', '#475569', '#64748b', '#94a3b8', '#cbd5e1',
  '#0d9488', '#059669', '#16a34a', '#65a30d', '#ca8a04', '#d97706',
  '#dc2626', '#e11d48', '#c026d3', '#7c3aed', '#2563eb', '#0284c7'
];

const HIGHLIGHT_PALETTE = [
  '#fef08a', '#fde047', '#bbf7d0', '#86efac', '#a5f3fc', '#bae6fd',
  '#fbcfe8', '#fecdd3', '#fed7aa', '#e9d5ff', '#cbd5e1', '#ffffff'
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps & { isHighlight?: boolean }> = ({
  currentColor,
  onSelectColor,
  onClear,
  title,
  isHighlight = false,
}) => {
  const [customHex, setCustomHex] = useState(currentColor || (isHighlight ? '#fef08a' : '#0d9488'));
  const palette = isHighlight ? HIGHLIGHT_PALETTE : PALETTE;

  return (
    <div className="p-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl space-y-3 select-none">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
        <span>{title}</span>
        <button
          type="button"
          onClick={onClear}
          title="রং মুছুন"
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-500 dark:hover:text-red-400"
        >
          <RotateCcw className="w-3 h-3" />
          রিসেট
        </button>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-6 gap-1.5">
        {palette.map((color) => {
          const isSelected = currentColor?.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
              style={{ backgroundColor: color }}
              title={color}
            >
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 ${
                    color === '#000000' || color === '#1e293b' || color === '#0d9488' || color === '#dc2626'
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Hex Custom Input */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <input
          type="color"
          value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#0d9488'}
          onChange={(e) => {
            setCustomHex(e.target.value);
            onSelectColor(e.target.value);
          }}
          className="w-7 h-7 rounded-sm border-0 cursor-pointer p-0 bg-transparent"
        />
        <input
          type="text"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-2 py-1 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        />
        <button
          type="button"
          onClick={() => onSelectColor(customHex)}
          className="px-2 py-1 text-xs font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          ওকে
        </button>
      </div>
    </div>
  );
};
