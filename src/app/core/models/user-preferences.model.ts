import { Timestamp } from 'firebase/firestore';
import { ID, Locale, Theme } from './common.model';

export interface UserPreferences {
  id: ID;
  theme: Theme;
  language: Locale;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'> = {
  theme: 'system',
  language: 'en',
};
