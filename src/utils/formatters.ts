/**
 * Format timestamp into Bengali date string
 */
export function formatBengaliDate(timestamp?: number | string | null): string {
  if (!timestamp) return 'অজানা তারিখ';
  const date = new Date(typeof timestamp === 'string' ? Number(timestamp) || timestamp : timestamp);
  
  if (isNaN(date.getTime())) return 'অজানা তারিখ';

  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const day = toBengaliNumerals(date.getDate());
  const month = months[date.getMonth()];
  const year = toBengaliNumerals(date.getFullYear());

  return `${day} ${month}, ${year}`;
}

/**
 * Convert English numerals to Bengali digits
 */
export function toBengaliNumerals(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[Number(digit)]);
}

/**
 * Generate user initials from name
 */
export function getInitials(name?: string): string {
  if (!name) return 'পা';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
