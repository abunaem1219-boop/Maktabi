import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { createUserProfile, getUserProfile } from './database';
import { UserProfile } from '../types/user';

/**
 * Register a new user with Email, Password and Full Name
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    
    // Create Realtime Database record
    const profile = await createUserProfile(cred.user.uid, {
      name,
      email,
      photoURL: cred.user.photoURL || '',
      provider: 'password',
    });

    return { user: cred.user, profile };
  } catch (error) {
    throw error;
  }
}

/**
 * Sign in existing user with Email and Password
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    let profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      profile = await createUserProfile(cred.user.uid, {
        name: cred.user.displayName || 'পাঠক',
        email: cred.user.email || '',
        photoURL: cred.user.photoURL || '',
        provider: 'password',
      });
    }
    return { user: cred.user, profile };
  } catch (error) {
    throw error;
  }
}

/**
 * Sign in or Register using Google Sign-In Popup
 */
export async function loginWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    let profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      profile = await createUserProfile(cred.user.uid, {
        name: cred.user.displayName || 'গুগল পাঠক',
        email: cred.user.email || '',
        photoURL: cred.user.photoURL || '',
        provider: 'google',
      });
    }
    return { user: cred.user, profile };
  } catch (error) {
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
}

/**
 * Format raw Firebase errors into user-friendly localized messages
 */
export function getFriendlyAuthErrorMessage(err: any): string {
  if (!err) return 'অপ্রত্যাশিত কোনো সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  const code = err.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'সঠিক ইমেইল ঠিকানা প্রদান করুন।';
    case 'auth/user-disabled':
      return 'এই অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।';
    case 'auth/user-not-found':
      return 'এই ইমেইলে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
    case 'auth/email-already-in-use':
      return 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে। অন্য ইমেইল ব্যবহার করুন বা লগইন করুন।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।';
    case 'auth/popup-closed-by-user':
      return 'গুগল সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে।';
    case 'auth/popup-blocked':
      return 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ অনুমোদন করুন।';
    case 'auth/network-request-failed':
      return 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। আপনার নেটওয়ার্ক চেক করুন।';
    case 'auth/too-many-requests':
      return 'অতিরিক্ত ব্যর্থ চেষ্টার কারণে অ্যাকাউন্ট সাময়িকভাবে লক হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
    default:
      return err.message || 'একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।';
  }
}
