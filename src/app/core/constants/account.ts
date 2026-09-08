import { AccountType, Currency } from '@core/models';

type Option<TLabel extends string, TValue> = {
  label: TLabel;
  value: TValue;
};

export const currencyOptions: Option<Currency, Currency>[] = [
  { label: 'UAH', value: 'UAH' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
];

export const accountTypeOptions: Option<string, AccountType>[] = [
  { label: 'Checking', value: 'checking' },
  { label: 'Savings', value: 'savings' },
];

