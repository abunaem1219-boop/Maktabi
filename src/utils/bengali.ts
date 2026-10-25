const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string): string {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

export function toRomanNumeral(num: number): string {
  if (num <= 0) return num.toString();
  const romanLookup: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ];
  let result = '';
  let n = num;
  for (const [val, sym] of romanLookup) {
    while (n >= val) {
      result += sym;
      n -= val;
    }
  }
  return result;
}

export function formatPageNumber(pageIndex: number, style: 'bengali' | 'english' | 'roman' = 'bengali'): string {
  switch (style) {
    case 'bengali':
      return toBengaliNumber(pageIndex);
    case 'roman':
      return toRomanNumeral(pageIndex);
    case 'english':
    default:
      return pageIndex.toString();
  }
}

/**
 * Calculates word and character count properly handling Bengali, Arabic and English
 */
export function calculateTextStats(text: string): { words: number; chars: number; readingTimeMinutes: number } {
  if (!text) return { words: 0, chars: 0, readingTimeMinutes: 0 };
  
  // Clean zero-width chars and normalize
  const clean = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  const chars = clean.length;

  if (chars === 0) {
    return { words: 0, chars: 0, readingTimeMinutes: 0 };
  }

  // Split on whitespace or common punctuation
  // Bengali danda '।' and double danda '॥', commas, etc.
  const wordsArray = clean.split(/[\s,।॥!?;:—\-]+/g).filter(w => w.length > 0);
  const words = wordsArray.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 180));

  return { words, chars, readingTimeMinutes };
}
