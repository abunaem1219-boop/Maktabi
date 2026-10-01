import { ref, get, set, update, remove, push } from 'firebase/database';
import { db, ADMIN_UID } from '../firebase/config';
import { Category } from '../types/book';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  { name: 'ইসলামিক', slug: 'islamic', icon: 'islamic', description: 'কুরআন, হাদিস, তাফসির ও ইসলামী সাহিত্য', order: 1, active: true },
  { name: 'উপন্যাস', slug: 'novel', icon: 'novel', description: 'সামাজিক, থ্রিলার ও রোমাঞ্চকর উপন্যাস', order: 2, active: true },
  { name: 'গল্প', slug: 'story', icon: 'story', description: 'ছোটগল্প ও চিরায়ত গল্প সংকলন', order: 3, active: true },
  { name: 'কবিতা', slug: 'poetry', icon: 'poetry', description: 'ক্লাসিক ও আধুনিক কবিতার সম্ভার', order: 4, active: true },
  { name: 'প্রবন্ধ ও গবেষণা', slug: 'essay', icon: 'essay', description: 'চিন্তাশীল প্রবন্ধ ও গবেষণাধর্মী রচনা', order: 5, active: true },
  { name: 'ইতিহাস ও ঐতিহ্য', slug: 'history', icon: 'history', description: 'দেশ ও বিশ্বের ঐতিহাসিক অধ্যায়সমূহ', order: 6, active: true },
  { name: 'শিক্ষা ও পাঠ্যপুস্তক', slug: 'education', icon: 'education', description: 'একাডেমিক ও বুদ্ধিবৃত্তিক জ্ঞানচর্চা', order: 7, active: true },
  { name: 'জীবনী ও স্মৃতিকথা', slug: 'biography', icon: 'biography', description: 'মনীষী ও স্মরণীয় ব্যক্তিত্বদের জীবনকথা', order: 8, active: true },
  { name: 'শিশু ও কিশোর সাহিত্য', slug: 'child', icon: 'child', description: 'রংবেরঙের রূপকথা, কমিকস ও ছড়ার আসর', order: 9, active: true },
  { name: 'আত্মউন্নয়ন ও মোটিভেশন', slug: 'self-dev', icon: 'self-dev', description: 'ব্যক্তিত্ব বিকাশ ও জীবন বদলানোর বই', order: 10, active: true },
  { name: 'বিজ্ঞান ও প্রযুক্তি', slug: 'science', icon: 'science', description: 'মহাকাশ, উদ্ভাবন ও ডিজিটাল জ্ঞান', order: 11, active: true },
  { name: 'অন্যান্য', slug: 'other', icon: 'book', description: 'বিবিধ বিষয়ের নির্বাচিত সংগ্রহ', order: 12, active: true },
];

/**
 * Fetch all categories sorted by order
 */
export async function getCategories(onlyActive = true): Promise<Category[]> {
  try {
    const catRef = ref(db, 'categories');
    const snapshot = await get(catRef);

    if (!snapshot.exists()) {
      return [];
    }

    const val = snapshot.val();
    let categories: Category[] = Object.keys(val).map((key) => ({
      id: key,
      ...val[key],
    }));

    if (onlyActive) {
      categories = categories.filter((c) => c.active !== false);
    }

    return categories.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch single category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const snapshot = await get(ref(db, `categories/${id}`));
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
}

/**
 * Count how many books belong to a specific category
 */
export async function getBooksCountForCategory(categoryId: string): Promise<number> {
  try {
    const booksSnapshot = await get(ref(db, 'books'));
    if (!booksSnapshot.exists()) return 0;
    const books = booksSnapshot.val();
    return Object.values(books).filter((b: any) => b.categoryId === categoryId).length;
  } catch (error) {
    console.error('Error counting books for category:', error);
    return 0;
  }
}

/**
 * Create a new Category
 */
export async function createCategory(
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { createdBy?: string }
): Promise<Category> {
  try {
    const newCatRef = push(ref(db, 'categories'));
    const id = newCatRef.key as string;
    const now = Date.now();

    const category: Category = {
      id,
      name: data.name.trim(),
      slug: data.slug?.trim() || data.name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: data.description?.trim() || '',
      icon: data.icon || 'book-open',
      order: data.order ?? 1,
      active: data.active !== false,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || ADMIN_UID,
    };

    await set(newCatRef, category);
    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update an existing Category
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  try {
    const catRef = ref(db, `categories/${id}`);
    const payload = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(catRef, payload);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    await remove(ref(db, `categories/${id}`));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Seed default categories idempotently if empty
 */
export async function seedDefaultCategories(): Promise<number> {
  try {
    const existing = await getCategories(false);
    if (existing.length > 0) {
      return 0; // Already seeded
    }

    const now = Date.now();
    let count = 0;

    for (const item of DEFAULT_CATEGORIES) {
      const newRef = push(ref(db, 'categories'));
      const id = newRef.key as string;
      const cat: Category = {
        id,
        ...item,
        createdAt: now,
        updatedAt: now,
        createdBy: ADMIN_UID,
      };
      await set(newRef, cat);
      count++;
    }

    return count;
  } catch (error) {
    console.error('Error seeding default categories:', error);
    throw error;
  }
}
