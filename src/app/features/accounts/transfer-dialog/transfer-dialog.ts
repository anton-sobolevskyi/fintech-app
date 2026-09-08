import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { form, FormRoot, FormField, required, min, minLength } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Account } from '@core/models';
import { isValidIban, formatIban } from '@core/utils';
import { AccountsStore } from '../accounts.store';

interface TransferFormModel {
  iban: string;
  amount: number;
}

@Component({
  selector: 'app-transfer-dialog',
  imports: [
    DecimalPipe,
    DialogModule,
    FormRoot,
    FormField,
    InputTextModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './transfer-dialog.html',
})
export class TransferDialog {
  private store = inject(AccountsStore);

  visible = input(false);
  account = input<Account | null>(null);

  visibleChange = output<boolean>();

  operating = this.store.operating;
  error = this.store.error;
  recipient = this.store.recipient;
  recipientLoading = this.store.recipientLoading;
  recipientError = this.store.recipientError;

  private model = signal<TransferFormModel>({ iban: '', amount: 0 });

  protected transferForm = form(
    this.model,
    (p) => {
      required(p.iban, { message: 'IBAN is required' });
      minLength(p.iban, 15, { message: 'IBAN is too short' });
      required(p.amount, { message: 'Amount is required' });
      min(p.amount, 0.01, { message: 'Amount must be greater than 0' });
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid() || !this.account() || !this.recipient()) return;
          this.store.transfer({
            fromAccountId: this.account()!.id,
            toIban: f().value().iban,
            amount: f().value().amount,
          });
          this.visibleChange.emit(false);
        },
      },
    },
  );

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.model.set({ iban: '', amount: 0 });
        this.store.clearRecipient();
      }
    });
  }

  protected lookupRecipient(): void {
    const iban = this.model().iban.replace(/\s/g, '').toUpperCase();
    if (!iban || !isValidIban(iban) || this.operating()) return;
    this.store.lookupByIban(iban);
  }

  protected currencyMismatch(): boolean {
    const source = this.account();
    const recipient = this.recipient();
    return !!source && !!recipient && source.currency !== recipient.currency;
  }

  protected formattedIban(iban: string): string {
    return formatIban(iban);
  }

  protected onHide(): void {
    this.visibleChange.emit(false);
  }
}