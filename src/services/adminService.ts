import { ref, get, push, set } from 'firebase/database';
import { db, ADMIN_UID } from '../firebase/config';
import { AdminLog, Book } from '../types/book';
import { getAllBooksAdmin, createBook } from './bookService';
import { getCategories, seedDefaultCategories } from './categoryService';
import { createChapter } from './chapterService';
import { getAllUsers } from '../firebase/database';
import { getAllSubmissionsAdmin } from './publishingService';

/**
 * Log administrative operations into `adminLogs`
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetId?: string,
  details?: string
): Promise<void> {
  try {
    const logRef = push(ref(db, 'adminLogs'));
    const log: AdminLog = {
      id: logRef.key as string,
      adminId,
      action,
      targetId: targetId || '',
      details: details || '',
      timestamp: Date.now(),
    };
    await set(logRef, log);
  } catch (error) {
    console.error('Error recording admin audit log:', error);
  }
}

/**
 * Gather accurate aggregated platform metrics
 */
export async function getAdminDetailedStats(): Promise<{
  totalUsers: number;
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  archivedBooks: number;
  featuredBooks: number;
  totalCategories: number;
  totalAuthors: number;
  pendingReviews: number;
  changesRequested: number;
  rejectedBooks: number;
}> {
  try {
    const [users, books, categories, submissions] = await Promise.all([
      getAllUsers(),
      getAllBooksAdmin(),
      getCategories(false),
      getAllSubmissionsAdmin(),
    ]);

    const totalUsers = users.length;
    const totalAuthors = users.filter((u) => u.role === 'author').length;
    const totalBooks = books.length;
    const publishedBooks = books.filter((b) => b.status === 'published').length;
    const draftBooks = books.filter((b) => b.status === 'draft' || b.status === 'private' || b.status === 'only_me').length;
    const archivedBooks = books.filter((b) => b.status === 'archived' || b.status === 'unpublished').length;
    const featuredBooks = books.filter((b) => b.featured === true).length;
    const totalCategories = categories.length;

    const pendingReviews = submissions.filter((s) => s.status === 'pending_review').length;
    const changesRequested = submissions.filter((s) => s.status === 'changes_requested').length;
    const rejectedBooks = submissions.filter((s) => s.status === 'rejected').length;

    return {
      totalUsers,
      totalBooks,
      publishedBooks,
      draftBooks,
      archivedBooks,
      featuredBooks,
      totalCategories,
      totalAuthors,
      pendingReviews,
      changesRequested,
      rejectedBooks,
    };
  } catch (error) {
    console.error('Error fetching admin detailed statistics:', error);
    return {
      totalUsers: 0,
      totalBooks: 0,
      publishedBooks: 0,
      draftBooks: 0,
      archivedBooks: 0,
      featuredBooks: 0,
      totalCategories: 0,
      totalAuthors: 0,
      pendingReviews: 0,
      changesRequested: 0,
      rejectedBooks: 0,
    };
  }
}

/**
 * Optional seed tool triggered strictly by Admin in Admin Console
 */
export async function seedDemoLibrary(): Promise<{ categoriesSeeded: number; booksSeeded: number }> {
  try {
    // 1. Seed categories if not already present
    const categoriesCount = await seedDefaultCategories();
    const categories = await getCategories(true);

    const getCatIdBySlug = (slug: string) => {
      const match = categories.find((c) => c.slug === slug);
      return match ? match.id : categories[0]?.id || 'general';
    };

    const getCatNameBySlug = (slug: string) => {
      const match = categories.find((c) => c.slug === slug);
      return match ? match.name : 'সাধারণ';
    };

    // 2. High-quality initial public books
    const demoBooks: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'পথের পাঁচালী (Pather Panchali)',
        authorName: 'বিভূতিভূষণ বন্দ্যোপাধ্যায়',
        publisher: 'মিত্র ও ঘোষ পাবলিশার্স',
        description:
          'নিশ্চিন্দিপুর গ্রামের অপূর্ব পল্লীপ্রকৃতি ও অপু-দুর্গার সারল্যমাখা শৈশবস্মৃতির এক অমর আখ্যান। বাংলা সাহিত্যের অন্যতম কালজয়ী উপন্যাস।',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        categoryId: getCatIdBySlug('novel'),
        categoryName: getCatNameBySlug('novel'),
        language: 'bn',
        tags: ['উপন্যাস', 'ক্লাসিক', 'পল্লীসাহিত্য', 'অপু'],
        status: 'published',
        visibility: 'public',
        featured: true,
        chapterCount: 35,
        publishedAt: Date.now() - 86400000 * 5,
        createdBy: ADMIN_UID,
      },
      {
        title: 'নবীজীবনের আলোকবর্তিকা (Sirat-un-Nabi)',
        authorName: 'মাওলানা আবুল হাসান আলী নদভী',
        publisher: 'ইসলামিক ফাউন্ডেশন',
        description:
          'সর্বকালের সর্বশ্রেষ্ঠ মহামানব হযরত মুহাম্মদ (সা.)-এর পবিত্র জীবনচরিত্র, অনুপম আদর্শ এবং ইসলামের সত্যবাণীর ঐতিহাসিক বিশ্লেষণ।',
        coverUrl: 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=600&auto=format&fit=crop&q=80',
        categoryId: getCatIdBySlug('islamic'),
        categoryName: getCatNameBySlug('islamic'),
        language: 'bn',
        tags: ['ইসলামিক', 'সীরাত', 'জীবনী', 'ইতিহাস'],
        status: 'published',
        visibility: 'public',
        featured: true,
        chapterCount: 22,
        publishedAt: Date.now() - 86400000 * 4,
        createdBy: ADMIN_UID,
      },
      {
        title: 'গীতাঞ্জলি (Gitanjali: Song Offerings)',
        authorName: 'রবীন্দ্রনাথ ঠাকুর',
        publisher: 'বিশ্বভারতী গ্রন্থনবিভাগ',
        description:
          'নোবেল বিজয়ী বিশ্বকবি রবীন্দ্রনাথ ঠাকুরের আধ্যাত্মিক ভাবধারা ও ভক্তিরসে জারিত অমর ভক্তিমূলক কাব্যগ্রন্থ।',
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        categoryId: getCatIdBySlug('poetry'),
        categoryName: getCatNameBySlug('poetry'),
        language: 'bn',
        tags: ['কবিতা', 'রবীন্দ্রনাথ', 'নোবেল', 'আধ্যাত্মিক'],
        status: 'published',
        visibility: 'public',
        featured: true,
        chapterCount: 15,
        publishedAt: Date.now() - 86400000 * 3,
        createdBy: ADMIN_UID,
      },
      {
        title: 'অগ্নিবীণা (Agni-Veena)',
        authorName: 'কাজী নজরুল ইসলাম',
        publisher: 'নজরুল ইন্সটিটিউট',
        description:
          'বিদ্রোহী কবি কাজী নজরুল ইসলামের প্রথম এবং কালজয়ী কাব্যগ্রন্থ। এর মধ্যে অন্তর্ভুক্ত রয়েছে ‘প্রলয়োল্লাস’ ও বিশ্ববিশ্রুত ‘বিদ্রোহী’ কবিতা।',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
        categoryId: getCatIdBySlug('poetry'),
        categoryName: getCatNameBySlug('poetry'),
        language: 'bn',
        tags: ['কবিতা', 'নজরুল', 'বিদ্রোহী', 'দেশপ্রেম'],
        status: 'published',
        visibility: 'public',
        featured: false,
        chapterCount: 12,
        publishedAt: Date.now() - 86400000 * 2,
        createdBy: ADMIN_UID,
      },
      {
        title: 'স্মার্ট চিন্তা ও আত্মউন্নয়নের কলাকৌশল',
        authorName: 'ড. জামিলুর রহমান',
        publisher: 'জ্ঞানকোষ প্রকাশনী',
        description:
          'আধুনিক যুগে মনঃসংযোগ বৃদ্ধি, সময় ব্যবস্থাপনা, ইতিবাচক মানসিকতা গঠন এবং ব্যক্তিগত উৎকর্ষ সাধনের কার্যকর নির্দেশিকা।',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
        categoryId: getCatIdBySlug('self-dev'),
        categoryName: getCatNameBySlug('self-dev'),
        language: 'bn',
        tags: ['আত্মউন্নয়ন', 'মনোবিজ্ঞান', 'সফলতা', 'পরামর্শ'],
        status: 'published',
        visibility: 'public',
        featured: false,
        chapterCount: 18,
        publishedAt: Date.now() - 86400000 * 1,
        createdBy: ADMIN_UID,
      },
    ];

    let booksCount = 0;
    for (const b of demoBooks) {
      const createdBook = await createBook(b);
      booksCount++;

      // Create rich initial chapters so the reader can be tested immediately
      if (b.title.includes('পথের পাঁচালী')) {
        await createChapter(createdBook.id, {
          title: '১ম পরিচ্ছেদ: নিশ্চিন্দিপুর গ্রামের সকাল',
          order: 1,
          content: `<p>নিশ্চিন্দিপুর গ্রামের উত্তর পাড়ায় হরির বাড়ি। বাড়ির চারিদিকে বাঁশবন, আমবাগান ও প্রাচীন বনতুলসীর ঝাড়। সকালের সূর্য সবেমাত্র বাঁশঝাড়ের পাতার ফাঁক দিয়ে সোনালী কিরণ ছড়িয়ে দিচ্ছে।</p>
          <p>অপু দাওয়ায় বসে বাবার কাঠের দোয়াত থেকে কালি নিয়ে তালপাতায় আঁচড় কাটছিল। এমন সময় ভেতর বাড়ি থেকে দুর্গার কণ্ঠ শোনা গেল—‘অপু, ও অপু! শুনছিস? চালতা কুড়োতে যাবি?’</p>
          <blockquote>পল্লী প্রকৃতির শ্যামল কোল জুড়ে জড়িয়ে আছে শৈশবের অফুরন্ত আনন্দ। কোনো কৃত্রিমতা নেই, নেই কোনো নগর জীবনের কোলাহল।</blockquote>
          <p>অপু খাতা গুটিয়ে তক্ষুনি লাফিয়ে উঠল। মা সর্বজয়া রান্নাঘর থেকে বলে উঠলেন—‘রোদে বেরোবি নে দুর্গা, জ্বরে পড়বি!’ কিন্তু কে শোনে কার কথা!</p>`,
        });

        await createChapter(createdBook.id, {
          title: '২য় পরিচ্ছেদ: বনফুলের মেলা ও রেললাইন',
          order: 2,
          content: `<p>দুর্গা আগে আগে চলছে আর অপু তার পেছনে ছুটে চলেছে। বাতাসে ভাটফুলের মিষ্টি সুবাস ভাসছে। হঠাৎ দূরে এক তীব্র বাঁশির শব্দ শোনা গেল। কু ঝিক ঝিক শব্দে মাটির বুক কাঁপিয়ে উঠছে।</p>
          <h3>রেলগাড়ি দেখার আনন্দ</h3>
          <p>অপু চিৎকার করে উঠল—‘দিদি, ওই যে রেলগাড়ি!’ কাশবনের শুভ্র চাদর ভেদ করে দূরপাল্লার ট্রেনটি লোহার খাঁচা নিয়ে ধোঁয়া উড়িয়ে চলে গেল। দুই ভাইবোনের বিস্ময়ভরা চোখের দৃষ্টি যেন পলকহীন স্তব্ধ হয়ে রইল।</p>`,
        });
      } else if (b.title.includes('গীতাঞ্জলি')) {
        await createChapter(createdBook.id, {
          title: '১ম গান: আমার মাথা নত করে দাও হে',
          order: 1,
          content: `<h2>আমার মাথা নত করে দাও হে</h2>
          <p>আমার মাথা নত করে দাও হে তোমার চরণধূলার তলে।<br/>সকল অহংকার হে আমার ডুবাও চোখের জলে॥</p>
          <p>নিজেরে করিতে গৌরব দান নিজেরে কেবলি করি অপমান,<br/>আপনারে শুধু ঘেরিয়া ঘেরিয়া ঘুরে মরি পলে পলে।<br/>সকল অহংকার হে আমার ডুবাও চোখের জলে॥</p>
          <blockquote>আমারে না যেন করি প্রচার আমার আপন কাজে,<br/>তোমারি ইচ্ছা কর হে পূর্ণ আমার জীবনমাঝে॥</blockquote>`,
        });
        await createChapter(createdBook.id, {
          title: '২য় গান: বিপদে মোরে রক্ষা করো',
          order: 2,
          content: `<h2>বিপদে মোরে রক্ষা করো</h2>
          <p>বিপদে মোরে রক্ষা করো এ নহে মোর প্রার্থনা,<br/>বিপদে আমি না যেন করি ভয়।<br/>দুঃখতাপে ব্যথিত চিতে নাই-বা দিলে সান্ত্বনা,<br/>দুঃখে যেন করিতে পারি জয়॥</p>
          <p>সহায় মোর না যদি জুটে নিজের বল না যেন টুটে,<br/>সংসারেতে ঘটিলে ক্ষতি লভিলে শুধু বঞ্চনা<br/>নিজের মনে না যেন মানি ক্ষয়॥</p>`,
        });
      } else {
        await createChapter(createdBook.id, {
          title: '১ম অধ্যায়: প্রারম্ভিকা ও মূল ভাবনা',
          order: 1,
          content: `<h2>সূচনা ও প্রেক্ষাপট</h2>
          <p>যেকোনো মহৎ সাহিত্যকর্ম মানুষের অন্তর্নিহিত চিন্তা ও চেতনাকে আলোকিত করে। এই গ্রন্থের প্রতিটি পৃষ্ঠায় রয়েছে জীবনের নিগূঢ় সত্যের সন্ধান।</p>
          <p>পাঠক যখন গভীর মনোযোগ ও অনুভূতির সাথে এই শব্দমালার ভেতর প্রবেশ করবেন, তখন তিনি এক অনন্য ভাবনার জগতের সন্ধান পাবেন।</p>
          <blockquote>জ্ঞান ও সাহিত্য হলো সেই আলোকবর্তিকা যা অন্ধকারের মধ্যেও পথ প্রদর্শন করে।</blockquote>`,
        });
      }
    }

    await logAdminAction(
      ADMIN_UID,
      'DEMO_DATA_SEEDED',
      '',
      `Seeded ${categoriesCount} categories and ${booksCount} demo books.`
    );

    return { categoriesSeeded: categoriesCount, booksSeeded: booksCount };
  } catch (error) {
    console.error('Error seeding demo library:', error);
    throw error;
  }
}
