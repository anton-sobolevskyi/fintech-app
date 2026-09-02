import { Timestamp } from 'firebase/firestore';
import { Currency, ID } from './common.model';

export type AccountType = 'checking' | 'savings' | 'investment' | 'credit' | 'loan';
export type AccountStatus = 'active' | 'frozen' | 'closed';

export interface Account {
  id: ID;
  userId: ID;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  iban?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
