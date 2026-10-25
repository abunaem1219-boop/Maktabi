import { PageMargins, PageSizeName, PageSetup } from '../types';

export const MM_TO_PX_RATIO = 96 / 25.4; // ~3.7795 px per mm
export const INCH_TO_MM = 25.4;
export const CM_TO_MM = 10;

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX_RATIO * 10) / 10;
}

export function pxToMm(px: number): number {
  return Math.round((px / MM_TO_PX_RATIO) * 10) / 10;
}

export interface PageDimension {
  name: PageSizeName;
  labelBn: string;
  labelEn: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export const PAGE_PRESETS: Record<PageSizeName, PageDimension> = {
  A4: {
    name: 'A4',
    labelBn: 'এ৪ (A4)',
    labelEn: 'A4',
    widthMm: 210,
    heightMm: 297,
    description: '210 × 297 mm (আন্তর্জাতিক মানক)'
  },
  A3: {
    name: 'A3',
    labelBn: 'এ৩ (A3)',
    labelEn: 'A3',
    widthMm: 297,
    heightMm: 420,
    description: '297 × 420 mm (পোস্টার / বড় ড্রয়িং)'
  },
  A5: {
    name: 'A5',
    labelBn: 'এ৫ (A5)',
    labelEn: 'A5',
    widthMm: 148,
    heightMm: 210,
    description: '148 × 210 mm (ছোট বই / নোটবুক)'
  },
  A6: {
    name: 'A6',
    labelBn: 'এ৬ (A6)',
    labelEn: 'A6',
    widthMm: 105,
    heightMm: 148,
    description: '105 × 148 mm (পকেট সাইজ / ডায়েরি)'
  },
  B5: {
    name: 'B5',
    labelBn: 'বি৫ (B5)',
    labelEn: 'B5',
    widthMm: 176,
    heightMm: 250,
    description: '176 × 250 mm (বই প্রকাশনা)'
  },
  Letter: {
    name: 'Letter',
    labelBn: 'লেটার (Letter)',
    labelEn: 'Letter',
    widthMm: 215.9,
    heightMm: 279.4,
    description: '8.5 × 11 in (উত্তর আমেরিকা মানক)'
  },
  Legal: {
    name: 'Legal',
    labelBn: 'লিগ্যাল (Legal)',
    labelEn: 'Legal',
    widthMm: 215.9,
    heightMm: 355.6,
    description: '8.5 × 14 in (আইনি নথি / চুক্তি)'
  },
  Executive: {
    name: 'Executive',
    labelBn: 'এক্সিকিউটিভ (Executive)',
    labelEn: 'Executive',
    widthMm: 184.1,
    heightMm: 266.7,
    description: '7.25 × 10.5 in'
  },
  Novel: {
    name: 'Novel',
    labelBn: 'উপন্যাস সাইজ (Novel 5×8 in)',
    labelEn: 'Novel (5×8 in)',
    widthMm: 127,
    heightMm: 203.2,
    description: '127 × 203.2 mm (স্ট্যান্ডার্ড ফিকশন)'
  },
  Pocket: {
    name: 'Pocket',
    labelBn: 'পকেট বুক (Pocket 4.25×6.87 in)',
    labelEn: 'Pocket Book (4.25×6.87 in)',
    widthMm: 107.95,
    heightMm: 174.62,
    description: '108 × 175 mm (পেপারব্যাক)'
  },
  Square: {
    name: 'Square',
    labelBn: 'বর্গাকার (Square 8×8 in)',
    labelEn: 'Square (8×8 in)',
    widthMm: 203.2,
    heightMm: 203.2,
    description: '203 × 203 mm (ছবি / কবিতার বই)'
  },
  Custom: {
    name: 'Custom',
    labelBn: 'কাস্টম (Custom)',
    labelEn: 'Custom',
    widthMm: 210,
    heightMm: 297,
    description: 'নিজস্ব মাপ'
  }
};

export const MARGIN_PRESETS: Record<string, { labelBn: string; labelEn: string; margins: PageMargins }> = {
  normal: {
    labelBn: 'সাধারণ (Normal - ২৫.৪ মিমি / ১ ইঞ্চি)',
    labelEn: 'Normal (25.4 mm / 1 in)',
    margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 }
  },
  narrow: {
    labelBn: 'সংকীর্ণ (Narrow - ১২.৭ মিমি / ০.৫ ইঞ্চি)',
    labelEn: 'Narrow (12.7 mm / 0.5 in)',
    margins: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 }
  },
  moderate: {
    labelBn: 'পরিমিত (Moderate - টপ/বটম ২৫.৪মিমি, লেফট/রাইট ১৯মিমি)',
    labelEn: 'Moderate (Top/Bottom 25.4mm, L/R 19mm)',
    margins: { top: 25.4, bottom: 25.4, left: 19.05, right: 19.05 }
  },
  wide: {
    labelBn: 'প্রশস্ত (Wide - টপ/বটম ২৫.৪মিমি, লেফট/রাইট ৫০.৮মিমি)',
    labelEn: 'Wide (Top/Bottom 25.4mm, L/R 50.8mm)',
    margins: { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8 }
  },
  mirrored: {
    labelBn: 'মিরর্ড (Mirrored বই বাঁধানোর জন্য)',
    labelEn: 'Mirrored (for bookbinding)',
    margins: { top: 25.4, bottom: 25.4, left: 31.75, right: 25.4 }
  }
};

export function createDefaultPageSetup(size: PageSizeName = 'A4', orientation: 'portrait' | 'landscape' = 'portrait'): PageSetup {
  const preset = PAGE_PRESETS[size] || PAGE_PRESETS.A4;
  let width = preset.widthMm;
  let height = preset.heightMm;

  if (orientation === 'landscape' && width < height) {
    [width, height] = [height, width];
  } else if (orientation === 'portrait' && width > height) {
    [width, height] = [height, width];
  }

  return {
    size,
    widthMm: width,
    heightMm: height,
    orientation,
    margins: { ...MARGIN_PRESETS.normal.margins },
    presetName: 'normal'
  };
}
