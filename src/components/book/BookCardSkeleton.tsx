import React from 'react';

export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-[2/3] w-full bg-stone-200 dark:bg-stone-800" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-4/5" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
        <div className="h-2.5 bg-stone-100 dark:bg-stone-850 rounded w-2/3 pt-1" />
      </div>
    </div>
  );
};

export const CategoryChipSkeleton: React.FC = () => {
  return (
    <div className="h-10 w-28 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse shrink-0" />
  );
};
