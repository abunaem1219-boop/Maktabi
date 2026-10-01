export type UserRole = 'user' | 'author' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
  provider: string; // 'password' | 'google'
}
