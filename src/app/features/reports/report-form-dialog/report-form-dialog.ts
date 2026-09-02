import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { form, FormRoot, FormField, required, minLength } from '@angular/forms/signals';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { AccountService } from '../../../core/services/account.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../core/store/auth/auth.selectors';
import { Account, ReportType } from '../../../core/models';
import { CreateReportPayload } from '../reports.store';

interface ReportFormModel {
  title: string;
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  currencies: string[];
}

@Component({
  selector: 'app-report-form-dialog',
  standalone: true,
  imports: [
    DialogModule,
    FormRoot,
    FormField,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
  ],
  templateUrl: './report-form-dialog.html',
})
export class ReportFormDialog implements OnInit {
  private accountService = inject(AccountService);
  private globalStore = inject(Store);

  visible = input(false);
  saving = input(false);
  visibleChange = output<boolean>();
  save = output<CreateReportPayload>();

  accounts = signal<Account[]>([]);

  typeOptions = [
    { label: 'Balance', value: 'balance' },
    { label: 'Transactions', value: 'transactions' },
    { label: 'Performance', value: 'performance' },
    { label: 'Custom', value: 'custom' },
  ];

  currencyOptions = [
    { label: 'UAH', value: 'UAH' },
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
  ];

  private today = new Date().toISOString().slice(0, 10);
  private monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  model = signal<ReportFormModel>({
    title: '',
    type: 'transactions',
    dateFrom: this.monthAgo,
    dateTo: this.today,
    accountIds: [],
    currencies: [],
  });

  reportForm = form(
    this.model,
    (p) => {
      required(p.title, { message: 'Title is required' });
      minLength(p.title, 2, { message: 'Minimum 2 characters' });
      required(p.type, { message: 'Type is required' });
      required(p.dateFrom, { message: 'Start date is required' });
      required(p.dateTo, { message: 'End date is required' });
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
    if (!user) return;
    this.accountService.getByUserId(user.id).subscribe((list) => this.accounts.set(list));
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
