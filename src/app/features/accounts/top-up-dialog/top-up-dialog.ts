import { Component, effect, inject, input, output, signal } from '@angular/core';
import { form, FormRoot, FormField, required, min } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { Account } from '@core/models';
import { AccountsStore } from '../accounts.store';

interface TopUpFormModel {
  amount: number;
}

@Component({
  selector: 'app-top-up-dialog',
  imports: [
    DialogModule,
    FormRoot,
    FormField,
    InputTextModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
  ],
  templateUrl: './top-up-dialog.html',
})
export class TopUpDialog {
  private store = inject(AccountsStore);

  visible = input(false);
  account = input<Account | null>(null);

  visibleChange = output<boolean>();

  operating = this.store.operating;
  error = this.store.error;

  private model = signal<TopUpFormModel>({ amount: 0 });

  protected topUpForm = form(
    this.model,
    (p) => {
      required(p.amount, { message: 'Amount is required' });
      min(p.amount, 0.01, { message: 'Amount must be greater than 0' });
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid() || !this.account()) return;
          this.store.topUp({ accountId: this.account()!.id, amount: f().value().amount });
          this.visibleChange.emit(false);
        },
      },
    },
  );

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.model.set({ amount: 0 });
      }
    });
  }

  protected onHide(): void {
    this.visibleChange.emit(false);
  }
}