import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Theme = 'system' | 'light' | 'dark';
export type Language = 'en' | 'uk';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  preferences: {
    theme: Theme;
    language: Language;
  };
}
