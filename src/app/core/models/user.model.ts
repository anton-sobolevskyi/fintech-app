import { Timestamp } from 'firebase/firestore';
import { ID } from './common.model';

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
}
