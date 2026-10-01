import React, { useState, useEffect } from 'react';
import { Book } from '../../types/book';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isFavorite, addFavorite, removeFavorite } from '../../services/favoriteService';
import { Heart, Sparkles, BookOpen, User } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (bookId: string) => void;
  onAuthRequired?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onAuthRequired }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [favorited, setFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (user) {
      isFavorite(user.uid, book.id).then((fav) => {
        if (mounted) setFavorited(fav);
      });
    } else {
      setFavorited(false);
    }
    return () => {
      mounted = false;
    };
  }, [user, book.id]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      showToast('পছন্দের তালিকায় রাখতে প্রথমে লগইন করুন।', 'warning');
      if (onAuthRequired) onAuthRequired();
      return;
    }

    if (favLoading) return;
    setFavLoading(true);

    try {
      if (favorited) {
        await removeFavorite(user.uid, book.id);
        setFavorited(false);
        showToast(`"${book.title}" পছন্দের তালিকা থেকে সরানো হয়েছে।`, 'info');
      } else {
        await addFavorite(user.uid, book.id);
        setFavorited(true);
        showToast(`"${book.title}" পছন্দের তালিকায় যোগ করা হয়েছে!`, 'success');
      }
    } catch (err) {
      showToast('পছন্দের তালিকা হালনাগাদ করতে সমস্যা হয়েছে।', 'error');
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(book.id)}
      className="group cursor-pointer rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-700/40 dark:hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-950/5 dark:hover:shadow-black/20 transition-all duration-300 flex flex-col overflow-hidden relative"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(book.id);
        }
      }}
      aria-label={`${book.title} - ${book.authorName}`}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] w-full bg-stone-100 dark:bg-stone-850 overflow-hidden flex items-center justify-center">
        {book.coverUrl && !imageError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-linear-to-b from-amber-100/60 to-stone-200 dark:from-stone-800 dark:to-stone-900">
            <BookOpen className="w-10 h-10 text-amber-700/60 dark:text-amber-500/50 mb-2" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 line-clamp-2">
              {book.title}
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
              {book.authorName}
            </span>
          </div>
        )}

        {/* Featured Tag */}
        {book.featured && (
          <div className="absolute top-2.5 left-2.5 bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3 h-3 fill-stone-950" />
            <span>নির্বাচিত</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          disabled={favLoading}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 shadow-sm ${
            favorited
              ? 'bg-rose-600 text-white'
              : 'bg-stone-900/60 text-white hover:bg-rose-600/90'
          }`}
          aria-label={favorited ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দের তালিকায় যোগ করুন'}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Category Pill Over Image */}
        {book.categoryName && (
          <div className="absolute bottom-2 left-2 bg-stone-950/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[85%]">
            {book.categoryName}
          </div>
        )}
      </div>

      {/* Book Metadata */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
            {book.title}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-1 line-clamp-1">
            <User className="w-3 h-3 shrink-0 text-stone-400" />
            <span>{book.authorName}</span>
          </p>
        </div>

        {book.publisher && (
          <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate pt-1 border-t border-stone-100 dark:border-stone-850">
            {book.publisher}
          </p>
        )}
      </div>
    </div>
  );
};
