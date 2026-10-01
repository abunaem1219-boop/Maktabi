import React from 'react';
import { Book } from '../../types/book';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import { BookOpen } from 'lucide-react';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  onSelectBook: (bookId: string) => void;
  onAuthRequired?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  skeletonCount?: number;
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  loading = false,
  onSelectBook,
  onAuthRequired,
  emptyTitle = 'কোনো বই পাওয়া যায়নি',
  emptyMessage = 'এই বিভাগে বর্তমানে কোনো বই নেই। শীঘ্রই নতুন বই যোগ করা হবে।',
  emptyActionLabel,
  onEmptyAction,
  skeletonCount = 6,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
            {emptyTitle}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {emptyMessage}
          </p>
        </div>
        {emptyActionLabel && onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{emptyActionLabel}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onSelect={onSelectBook}
          onAuthRequired={onAuthRequired}
        />
      ))}
    </div>
  );
};
