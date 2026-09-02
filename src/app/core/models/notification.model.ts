import { Timestamp } from 'firebase/firestore';
import { ID } from './common.model';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: ID;
  userId: ID;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt?: Timestamp;
  link?: string;
}
