import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyAmZ-SmBj1uCNvvT6HuQAcrUtJ4loyv6i0",
  authDomain: "caption-box-5573e.firebaseapp.com",
  databaseURL: "https://caption-box-5573e-default-rtdb.firebaseio.com",
  projectId: "caption-box-5573e",
  storageBucket: "caption-box-5573e.firebasestorage.app",
  messagingSenderId: "169925927612",
  appId: "1:169925927612:web:f2c02a7d63f6fce438e6b9"
};

// Designated super-administrator UID
export const ADMIN_UID = "4TLEoLWD29NdiiN2LiOrrURLtMw1";

// Initialize Firebase singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
