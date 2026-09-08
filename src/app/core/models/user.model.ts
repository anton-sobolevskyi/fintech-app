import { Timestamp } from 'firebase/firestore';
import { ID, Locale, Theme } from './common.model';

export type UserRole = 'admin' | 'analyst' | 'client' | 'manager' | 'viewer';
export interface User {
  id: ID;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  department?: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  preferences: {
    theme: Theme;
    language: Locale;
  };
}
