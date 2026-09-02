import { Component, effect, input, output, signal } from '@angular/core';
import {
  form,
  FormRoot,
  FormField,
  required,
  minLength,
  min,
} from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { Account, AccountType, AccountStatus, Currency } from '@core/models';

interface AccountFormModel {
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  iban: string;
}

@Component({
  selector: 'app-account-form-dialog',
  standalone: true,
  imports: [
    DialogModule,
    FormRoot,
    FormField,
    InputTextModule,
    SelectModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
  ],
  templateUrl: './account-form-dialog.html',
})
export class AccountFormDialog {
  visible = input(false);
  account = input<Account | null>(null);
  saving = input(false);

  visibleChange = output<boolean>();
  save = output<AccountFormModel>();

  typeOptions = [
    { label: 'Checking', value: 'checking' },
    { label: 'Savings', value: 'savings' },
    { label: 'Investment', value: 'investment' },
    { label: 'Credit', value: 'credit' },
    { label: 'Loan', value: 'loan' },
  ];

  currencyOptions = [
    { label: 'UAH', value: 'UAH' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Frozen', value: 'frozen' },
    { label: 'Closed', value: 'closed' },
  ];

  accountModel = signal<AccountFormModel>({
    name: '',
    type: 'checking',
    currency: 'UAH',
    balance: 0,
    availableBalance: 0,
    status: 'active',
    iban: '',
  });

  accountForm = form(
    this.accountModel,
    (p) => {
      required(p.name, { message: 'Name is required' });
      minLength(p.name, 2, { message: 'Minimum 2 characters' });
      required(p.type, { message: 'Type is required' });
      required(p.currency, { message: 'Currency is required' });
      required(p.status, { message: 'Status is required' });
      min(p.balance, 0, { message: 'Balance cannot be negative' });
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid()) return;
          this.save.emit(f().value());
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const acc = this.account();
      if (acc) {
        this.accountModel.set({
          name: acc.name,
          type: acc.type,
          currency: acc.currency,
          balance: acc.balance,
          availableBalance: acc.availableBalance,
          status: acc.status,
          iban: acc.iban ?? '',
        });
      } else {
        this.accountModel.set({
          name: '',
          type: 'checking',
          currency: 'UAH',
          balance: 0,
          availableBalance: 0,
          status: 'active',
          iban: '',
        });
      }
    });
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }
}