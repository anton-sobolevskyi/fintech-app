import { Component, effect, inject, input, output, signal, OnInit } from '@angular/core';
import { form, FormRoot, FormField, required, min, minLength } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { AccountService } from '../../../core/services/account.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../core/store/auth/auth.selectors';
import {
  Account,
  Transaction,
  TransactionType,
  TransactionStatus,
  Currency,
} from '../../../core/models';

interface TransactionFormModel {
  accountId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  description: string;
  category: string;
  counterpartyName: string;
  counterpartyIban: string;
  reference: string;
}

@Component({
  selector: 'app-transaction-form-dialog',
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
  templateUrl: './transaction-form-dialog.html',
})
export class TransactionFormDialog implements OnInit {
  private accountService = inject(AccountService);
  private globalStore = inject(Store);

  visible = input(false);
  transaction = input<Transaction | null>(null);
  saving = input(false);

  visibleChange = output<boolean>();
  save = output<TransactionFormModel>();

  accounts = signal<Account[]>([]);

  typeOptions = [
    { label: 'Credit', value: 'credit' },
    { label: 'Debit', value: 'debit' },
    { label: 'Transfer', value: 'transfer' },
    { label: 'Fee', value: 'fee' },
    { label: 'Interest', value: 'interest' },
  ];

  statusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Reversed', value: 'reversed' },
  ];

  currencyOptions = [
    { label: 'UAH', value: 'UAH' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
  ];

  txModel = signal<TransactionFormModel>({
    accountId: '',
    type: 'debit',
    status: 'completed',
    amount: 0,
    currency: 'UAH',
    description: '',
    category: '',
    counterpartyName: '',
    counterpartyIban: '',
    reference: '',
  });

  txForm = form(
    this.txModel,
    (p) => {
      required(p.accountId, { message: 'Account is required' });
      required(p.type, { message: 'Type is required' });
      required(p.status, { message: 'Status is required' });
      required(p.amount, { message: 'Amount is required' });
      min(p.amount, 0.01, { message: 'Amount must be greater than 0' });
      required(p.currency, { message: 'Currency is required' });
      required(p.description, { message: 'Description is required' });
      minLength(p.description, 2, { message: 'Minimum 2 characters' });
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

  ngOnInit(): void {
    const user = this.globalStore.selectSignal(selectCurrentUser)();
    if (user) {
      this.accountService.getByUserId(user.id).subscribe((list) => {
        this.accounts.set(list);
        if (!this.txModel().accountId && list.length > 0) {
          this.txModel.update((m) => ({ ...m, accountId: list[0].id }));
        }
      });
    }
  }

  constructor() {
    effect(() => {
      const tx = this.transaction();
      if (tx) {
        this.txModel.set({
          accountId: tx.accountId,
          type: tx.type,
          status: tx.status,
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description,
          category: tx.category ?? '',
          counterpartyName: tx.counterpartyName ?? '',
          counterpartyIban: tx.counterpartyIban ?? '',
          reference: tx.reference ?? '',
        });
      } else {
        this.txModel.set({
          accountId: this.accounts()[0]?.id ?? '',
          type: 'debit',
          status: 'completed',
          amount: 0,
          currency: 'UAH',
          description: '',
          category: '',
          counterpartyName: '',
          counterpartyIban: '',
          reference: '',
        });
      }
    });
  }

  accountOptions = () =>
    this.accounts().map((a) => ({
      label: `${a.name} (${a.currency})`,
      value: a.id,
    }));

  onHide(): void {
    this.visibleChange.emit(false);
  }
}
