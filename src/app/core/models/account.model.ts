import { Timestamp } from 'firebase/firestore';

export type AccountType = 'checking' | 'savings' | 'investment' | 'credit' | 'loan';
export type AccountStatus = 'active' | 'frozen' | 'closed';
export type Currency = 'UAH' | 'USD' | 'EUR';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  iban?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
