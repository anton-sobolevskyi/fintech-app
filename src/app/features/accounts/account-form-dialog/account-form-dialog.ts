import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormRoot, FormField, required } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { Currency } from '@core/models';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AccountsStore } from '../accounts.store';

interface AccountFormModel {
  currency: Currency;
}

@Component({
  selector: 'app-account-form-dialog',
  imports: [
    DialogModule,
    FormRoot,
    FormField,
    SelectButtonModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
  ],
  templateUrl: './account-form-dialog.html',
})
export class AccountFormDialog {
  private store = inject(AccountsStore);

  visible = input(false);

  visibleChange = output<boolean>();

  private model = signal<AccountFormModel>({ currency: 'UAH' });

  saving = this.store.saving;
  availableCurrencies = this.store.availableCurrencies;

  protected accountForm = form(
    this.model,
    (p) => {
      required(p.currency, { message: 'Currency is required' });
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid()) return;
          this.store.createAccount(f().value());
        },
      },
    },
  );

  protected onHide(): void {
    this.visibleChange.emit(false);
  }
}
