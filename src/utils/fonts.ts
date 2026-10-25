export interface FontItem {
  id: string;
  name: string;
  family: string;
  category: 'bn' | 'en' | 'ar' | 'custom';
  categoryLabel: string;
}

export const AVAILABLE_FONTS: FontItem[] = [
  // বাংলা ফন্টসমূহ
  {
    id: 'noto-sans-bengali',
    name: 'নোটো সান্স বাংলা (Noto Sans Bengali)',
    family: '"Noto Sans Bengali", sans-serif',
    category: 'bn',
    categoryLabel: 'বাংলা ফন্ট'
  },
  {
    id: 'noto-serif-bengali',
    name: 'নোটো সেরিফ বাংলা (Noto Serif Bengali)',
    family: '"Noto Serif Bengali", serif',
    category: 'bn',
    categoryLabel: 'বাংলা ফন্ট'
  },
  {
    id: 'hind-siliguri',
    name: 'হিন্দ শিলিগুড়ি (Hind Siliguri)',
    family: '"Hind Siliguri", sans-serif',
    category: 'bn',
    categoryLabel: 'বাংলা ফন্ট'
  },
  {
    id: 'solaiman-lipi',
    name: 'সোলায়মান লিপি (SolaimanLipi / সিস্টেম)',
    family: '"SolaimanLipi", "Kalpurush", "SutonnyMJ", sans-serif',
    category: 'bn',
    categoryLabel: 'বাংলা ফন্ট'
  },

  // ইংরেজি ফন্টসমূহ
  {
    id: 'inter',
    name: 'ইন্টার (Inter / System Sans)',
    family: 'Inter, system-ui, -apple-system, sans-serif',
    category: 'en',
    categoryLabel: 'ইংরেজি / ল্যাটিন'
  },
  {
    id: 'lora',
    name: 'লোরা (Lora - বইয়ের জন্য সেরিফ)',
    family: 'Lora, serif',
    category: 'en',
    categoryLabel: 'ইংরেজি / ল্যাটিন'
  },
  {
    id: 'merriweather',
    name: 'মেরিওয়েদার (Merriweather)',
    family: 'Merriweather, serif',
    category: 'en',
    categoryLabel: 'ইংরেজি / ল্যাটিন'
  },
  {
    id: 'fira-code',
    name: 'ফির্ডা কোড (Fira Code - মনোস্পেস)',
    family: '"Fira Code", monospace',
    category: 'en',
    categoryLabel: 'ইংরেজি / ল্যাটিন'
  },

  // আরবি ফন্টসমূহ
  {
    id: 'amiri',
    name: 'আমিরী (Amiri - কুরআন ও নাসখ শৈলী)',
    family: 'Amiri, serif',
    category: 'ar',
    categoryLabel: 'আরবি ফন্ট'
  },
  {
    id: 'cairo',
    name: 'কায়রো (Cairo - আধুনিক কুফি শৈলী)',
    family: 'Cairo, sans-serif',
    category: 'ar',
    categoryLabel: 'আরবি ফন্ট'
  }
];

/**
 * Checks if the string starts with Arabic characters
 */
export function isArabicText(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode range \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  const trimmed = text.trim();
  if (!trimmed) return false;
  const firstChar = trimmed[0];
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(firstChar);
}

/**
 * Register a custom FontFace in the browser
 */
export async function registerCustomFont(fontName: string, arrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    const font = new FontFace(fontName, arrayBuffer);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    return true;
  } catch (err) {
    console.error('Failed to load custom font:', err);
    return false;
  }
}
