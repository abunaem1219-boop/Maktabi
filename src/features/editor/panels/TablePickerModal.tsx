import React, { useState } from 'react';
import { X, Table as TableIcon } from 'lucide-react';
import { toBengaliNumber } from '../../../utils/bengali';

interface TablePickerModalProps {
  onInsertTable: (rows: number, cols: number) => void;
  onClose: () => void;
}

export const TablePickerModal: React.FC<TablePickerModalProps> = ({
  onInsertTable,
  onClose,
}) => {
  const maxRows = 8;
  const maxCols = 8;
  const [hoveredRow, setHoveredRow] = useState(3);
  const [hoveredCol, setHoveredCol] = useState(3);

  const handleSelect = (r: number, c: number) => {
    onInsertTable(r, c);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xs shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              টেবিল যোগ করুন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 flex flex-col items-center">
          <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            {Array.from({ length: maxRows }).map((_, r) =>
              Array.from({ length: maxCols }).map((_, c) => {
                const isHighlighted = r < hoveredRow && c < hoveredCol;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onMouseEnter={() => {
                      setHoveredRow(r + 1);
                      setHoveredCol(c + 1);
                    }}
                    onClick={() => handleSelect(r + 1, c + 1)}
                    className={`w-6 h-6 rounded-xs border transition-colors ${
                      isHighlighted
                        ? 'bg-teal-500 border-teal-600 shadow-xs'
                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                    }`}
                  />
                );
              })
            )}
          </div>

          <div className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
            মাপ: <span className="text-teal-600 dark:text-teal-400 font-bold">{toBengaliNumber(hoveredRow)}</span> সারি × <span className="text-teal-600 dark:text-teal-400 font-bold">{toBengaliNumber(hoveredCol)}</span> কলাম ({hoveredRow} × {hoveredCol})
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSelect(hoveredRow, hoveredCol)}
          className="w-full py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs"
        >
          টেবিল তৈরি করুন ({hoveredRow} × {hoveredCol})
        </button>
      </div>
    </div>
  );
};
