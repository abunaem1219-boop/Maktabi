export type ProjectType = 'document' | 'book';

export type PageSizeName = 
  | 'A3' 
  | 'A4' 
  | 'A5' 
  | 'A6' 
  | 'B5' 
  | 'Letter' 
  | 'Legal' 
  | 'Executive' 
  | 'Novel' 
  | 'Pocket' 
  | 'Square' 
  | 'Custom';

export type Orientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;    // in mm
  bottom: number; // in mm
  left: number;   // in mm
  right: number;  // in mm
}

export interface PageSetup {
  size: PageSizeName;
  widthMm: number;
  heightMm: number;
  orientation: Orientation;
  margins: PageMargins;
  presetName: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number; // 0 to 1
  angle: number;   // degrees, e.g. -45
  color: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  wordCount?: number;
  content?: any;
}

export interface CommentItem {
  id: string;
  text: string;
  author: string;
  createdAt: number;
  resolved: boolean;
  selectedText?: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  pageSetup: PageSetup;
  content: any; // Tiptap JSON or HTML
  chapters?: Chapter[];
  currentChapterId?: string;
  chapterContents?: Record<string, any>;
  headerText?: string;
  footerText?: string;
  differentFirstPage?: boolean;
  numberingStyle?: 'bengali' | 'english' | 'roman';
  watermark?: WatermarkConfig;
  pageBgColor?: string;
  comments?: CommentItem[];
  targetWordCount?: number;
  wordCount: number;
  charCount: number;
  createdAt: number;
  updatedAt: number;
  author?: string;
  subtitle?: string;
  dedication?: string;
  copyright?: string;
  coverImage?: string;
}

export interface VersionSnapshot {
  id: string;
  projectId: string;
  timestamp: number;
  title: string;
  content: any;
  wordCount: number;
  note?: string;
}

export interface AppSettings {
  id: string;
  theme: 'light' | 'dark' | 'system' | 'amoled';
  language: 'bn' | 'en';
  pageTheme: 'white' | 'night';
  defaultFont: string;
  defaultFontSize: number;
  defaultPageSize: PageSizeName;
  defaultMargins: 'normal' | 'narrow' | 'moderate' | 'wide';
  autoSaveIntervalMs: number;
  defaultAuthor: string;
  useBengaliDigits: boolean;
  rulerVisible: boolean;
  spellcheck: boolean;
}
