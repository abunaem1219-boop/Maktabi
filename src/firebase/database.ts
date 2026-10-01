import { ref, get, set, update, child } from 'firebase/database';
import { db, ADMIN_UID } from './config';
import { UserProfile } from '../types/user';

/**
 * Fetch a user profile by UID from /users/{uid}
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Create or sync a user profile upon sign-in/registration
 * Automatically assigns 'admin' role if matching ADMIN_UID
 */
export async function createUserProfile(
  uid: string,
  data: {
    name: string;
    email: string;
    photoURL?: string;
    bio?: string;
    provider?: string;
  }
): Promise<UserProfile> {
  try {
    const existing = await getUserProfile(uid);
    const now = Date.now();
    const isAdmin = uid === ADMIN_UID;

    if (existing) {
      // Merge updates without losing established role unless upgrading to admin
      const updatedProfile: UserProfile = {
        ...existing,
        name: data.name || existing.name,
        photoURL: data.photoURL || existing.photoURL || '',
        updatedAt: now,
        // Always ensure initial admin UID has admin role
        role: isAdmin ? 'admin' : existing.role || 'user',
      };
      await update(ref(db, `users/${uid}`), updatedProfile);
      return updatedProfile;
    }

    const newProfile: UserProfile = {
      uid,
      name: data.name || 'পাঠক (Reader)',
      email: data.email || '',
      photoURL: data.photoURL || '',
      bio: data.bio || '',
      role: isAdmin ? 'admin' : 'user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      provider: data.provider || 'password',
    };

    await set(ref(db, `users/${uid}`), newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error creating user profile in Realtime Database:', error);
    throw error;
  }
}

/**
 * Update an existing user's profile details
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'photoURL'>>
): Promise<void> {
  try {
    const userRef = ref(db, `users/${uid}`);
    const payload = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(userRef, payload);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Fetch all registered users for Admin overview
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      return [];
    }
    const val = snapshot.val();
    return Object.keys(val).map((k) => val[k] as UserProfile);
  } catch (error) {
    console.error('Error fetching all users for admin:', error);
    throw error;
  }
}

/**
 * Retrieve real administrative metrics
 * Uses real database counts. Returns 0 for future modules (books/reviews).
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalAuthors: number;
  publishedBooks: number;
  pendingReviews: number;
}> {
  try {
    const users = await getAllUsers();
    const totalUsers = users.length;
    const totalAuthors = users.filter((u) => u.role === 'author').length;

    // Books and reviews nodes are for future phases; check if they exist or return 0
    let publishedBooks = 0;
    let pendingReviews = 0;

    try {
      const booksSnap = await get(child(ref(db), 'books'));
      if (booksSnap.exists()) {
        const books = booksSnap.val();
        publishedBooks = Object.values(books).filter(
          (b: any) => b.status === 'published' || b.status === 'PUBLISHED'
        ).length;
      }
    } catch {
      publishedBooks = 0;
    }

    try {
      const submissionsSnap = await get(child(ref(db), 'submissions'));
      if (submissionsSnap.exists()) {
        const subs = submissionsSnap.val();
        pendingReviews = Object.values(subs).filter(
          (s: any) => s.status === 'pending' || s.status === 'PENDING'
        ).length;
      }
    } catch {
      pendingReviews = 0;
    }

    return {
      totalUsers,
      totalAuthors,
      publishedBooks,
      pendingReviews,
    };
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return {
      totalUsers: 0,
      totalAuthors: 0,
      publishedBooks: 0,
      pendingReviews: 0,
    };
  }
}
