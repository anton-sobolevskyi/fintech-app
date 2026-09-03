import { Component, input, output, signal } from '@angular/core';
import { form, FormRoot, FormField, required, minLength } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { Account, AccountType, Currency } from '@core/models';
import { accountTypeOptions, currencyOptions } from '@core/constants';

interface AccountFormModel {
  name: string;
  type: AccountType;
  currency: Currency;
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
  private accountModel = signal<AccountFormModel>({
    name: '',
    type: 'checking',
    currency: 'UAH',
  });

  visible = input(false);
  account = input<Account | null>(null);
  saving = input(false);

  visibleChange = output<boolean>();
  save = output<AccountFormModel>();

  protected typeOptions = accountTypeOptions;
  protected currencyOptions = currencyOptions;

  protected accountForm = form(
    this.accountModel,
    (p) => {
      required(p.name, { message: 'Name is required' });
      minLength(p.name, 2, { message: 'Minimum 2 characters' });
      required(p.type, { message: 'Type is required' });
      required(p.currency, { message: 'Currency is required' });
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

  protected onHide(): void {
    this.visibleChange.emit(false);
  }
}
