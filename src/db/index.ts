import Dexie, { Table } from 'dexie';
import { Project, VersionSnapshot, AppSettings } from '../types';
import { createDefaultPageSetup } from '../utils/units';

export class MuktolipiDatabase extends Dexie {
  projects!: Table<Project, string>;
  versions!: Table<VersionSnapshot, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('MuktolipiDatabase');
    this.version(1).stores({
      projects: 'id, type, title, updatedAt, createdAt',
      versions: 'id, projectId, timestamp',
      settings: 'id'
    });
  }
}

export const db = new MuktolipiDatabase();

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app-settings',
  theme: 'system',
  language: 'bn',
  pageTheme: 'white',
  defaultFont: 'noto-sans-bengali',
  defaultFontSize: 16,
  defaultPageSize: 'A4',
  defaultMargins: 'normal',
  autoSaveIntervalMs: 1000,
  defaultAuthor: 'লেখক',
  useBengaliDigits: true,
  rulerVisible: true,
  spellcheck: true
};

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app-settings');
  if (settings) return settings;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await db.settings.put(updated);
  return updated;
}

export async function initDatabaseWithSample(): Promise<void> {
  try {
    // Request persistent storage so browser does not clear offline data
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }

    const count = await db.projects.count();
    if (count === 0) {
      const sampleProjectId = 'welcome-guide-doc';
      const sampleContent = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'মুক্তলিপিতে আপনাকে স্বাগতম' }]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'মুক্তলিপি হলো আধুনিক মোবাইল-ফার্স্ট ডকুমেন্ট ও বই লেখার অ্যাপ্লিকেশন। এখানে আপনি মাইক্রোসফট ওয়ার্ডের মতো পেজ-ভিত্তিক ক্যানভাসে নির্ভুলভাবে বাংলা, ইংরেজি ও আরবি লিখতে পারবেন।' }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'প্রধান সুবিধাসমূহ' }]
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'বাস্তব কাগজের পেজ লেআউট: ' }, { type: 'text', text: 'A4, A5, Novel, Pocket ইত্যাদি সাইজে পেজ তৈরি এবং নিখুঁত মার্জিন।' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'অফলাইন ও স্বয়ংক্রিয় সংরক্ষণ: ' }, { type: 'text', text: 'সব ডেটা আপনার ডিভাইসের IndexedDB-তে সুরক্ষিত।' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'উন্নত ফন্ট সমর্থন: ' }, { type: 'text', text: 'বাংলা (নোটো সান্স, নোটো সেরিফ, হিন্দ শিলিগুড়ি), ইংরেজি ও আরবি ফন্ট বিল্ট-ইন।' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'বই মোড: ' }, { type: 'text', text: 'অধ্যায় বিভাজন, কভার পেজ, উৎসর্গ, এবং দৈনিক শব্দ সংখ্যা লক্ষ্য।' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'নিখুঁত PDF ও DOCX এক্সপোর্ট: ' }, { type: 'text', text: 'যুক্তাক্ষর না ভেঙে ঝকঝকে প্রিন্ট ও ফাইল ডাউনলোড।' }] }]
              }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'বহুভাষিক লেখা ও যুক্তাক্ষর' }]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'বাংলা যুক্তাক্ষর পরীক্ষা: ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'ক্ষুদ্র, বিজ্ঞান, ব্যক্তিত্ব, স্বাধীনতা, উজ্জ্বল, সৃষ্টি, ব্রাহ্মণ।' }
            ]
          },
          {
            type: 'paragraph',
            attrs: { dir: 'rtl' },
            content: [
              { type: 'text', text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — আরবি ক্যালিগ্রাফি ও হরফ নির্ভুলভাবে সংযুক্ত হবে।' }
            ]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'English text works seamlessly side by side with full typographic fidelity.' }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'নমুনা টেবিল' }]
          },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'ক্রমিক' }] }] },
                  { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'ফিচার' }] }] },
                  { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'অবস্থা' }] }] }
                ]
              },
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '১' }] }] },
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'WYSIWYG পেজ লেআউট' }] }] },
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'highlight', attrs: { color: '#bbf7d0' } }], text: 'সম্পূর্ণ সক্রিয়' }] }] }
                ]
              },
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '২' }] }] },
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'PDF এক্সপোর্ট' }] }] },
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'highlight', attrs: { color: '#bbf7d0' } }], text: 'উচ্চ রেজোলিউশন' }] }] }
                ]
              }
            ]
          }
        ]
      };

      const sampleProject: Project = {
        id: sampleProjectId,
        title: 'মুক্তলিপি পরিচিতি ও ব্যবহারের নির্দেশিকা',
        type: 'document',
        pageSetup: createDefaultPageSetup('A4', 'portrait'),
        content: sampleContent,
        headerText: 'মুক্তলিপি নির্দেশিকা',
        footerText: 'মুক্তলিপি - আধুনিক বই ও ডকুমেন্ট এডিটর',
        differentFirstPage: true,
        numberingStyle: 'bengali',
        watermark: {
          enabled: false,
          text: 'খসড়া',
          opacity: 0.15,
          angle: -45,
          color: '#64748b'
        },
        wordCount: 180,
        charCount: 1150,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        author: 'মুক্তলিপি টিম',
        subtitle: 'প্রফেশনাল ডকুমেন্ট রাইটার'
      };

      await db.projects.put(sampleProject);
    }
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}
