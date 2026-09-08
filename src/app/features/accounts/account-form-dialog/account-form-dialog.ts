import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormRoot, FormField, required, minLength } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { AccountType, Currency } from '@core/models';
import { accountTypeOptions } from '@core/constants';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AccountsStore } from '../accounts.store';

interface AccountFormModel {
  name: string;
  type: AccountType;
  currency: Currency;
}

@Component({
  selector: 'app-account-form-dialog',
  imports: [
    DialogModule,
    FormRoot,
    FormField,
    InputTextModule,
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

  private model = signal<AccountFormModel>({ name: '', type: 'checking', currency: 'UAH' });

  saving = this.store.saving;
  availableCurrencies = this.store.availableCurrencies;

  protected accountTypeOptions = accountTypeOptions;

  protected accountForm = form(
    this.model,
    (p) => {
      required(p.name, { message: 'Account name is required' });
      minLength(p.name, 2, { message: 'Minimum 2 characters' });
      required(p.type, { message: 'Account type is required' });
      required(p.currency, { message: 'Currency is required' });
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid()) return;
          this.store.createAccount(f().value());
          this.visibleChange.emit(false);
        },
      },
    },
  );

  protected onHide(): void {
    this.visibleChange.emit(false);
  }
}
