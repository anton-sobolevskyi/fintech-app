import { Timestamp } from 'firebase/firestore';
import { ID, Locale } from './common.model';

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Theme = 'system' | 'light' | 'dark';

export interface User {
  id: ID;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  preferences: {
    theme: Theme;
    language: Locale;
  };
}
