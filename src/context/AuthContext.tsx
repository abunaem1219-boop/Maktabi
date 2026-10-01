import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, ADMIN_UID } from '../firebase/config';
import { getUserProfile, createUserProfile } from '../firebase/database';
import { logoutUser } from '../firebase/auth';
import { UserProfile } from '../types/user';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  showLogoutModal: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const { showToast } = useToast();

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      let profile = await getUserProfile(currentUser.uid);
      if (!profile) {
        profile = await createUserProfile(currentUser.uid, {
          name: currentUser.displayName || 'সম্মানিত পাঠক',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          provider: currentUser.providerData[0]?.providerId || 'password',
        });
      }
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to load profile from database:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  }, [fetchProfile]);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setShowLogoutModal(false);
      showToast('সফলভাবে লগআউট হয়েছে।', 'info');
    } catch (err: any) {
      showToast('লগআউট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    }
  };

  const isAdmin = Boolean(
    (user && user.uid === ADMIN_UID) || (userProfile && userProfile.role === 'admin')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        refreshProfile,
        showLogoutModal,
        openLogoutModal,
        closeLogoutModal,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
