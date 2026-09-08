import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AccountsStore } from '../accounts.store';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { PIcon } from '@primeicons/angular';
import { AccountFormDialog } from '../account-form-dialog/account-form-dialog';
import { TopUpDialog } from '../top-up-dialog/top-up-dialog';
import { TransferDialog } from '../transfer-dialog/transfer-dialog';
import { Account } from '@core/models';
import { formatIban } from '@core/utils';

@Component({
  imports: [
    DecimalPipe,
    ButtonModule,
    CardModule,
    SkeletonModule,
    TagModule,
    TableModule,
    TooltipModule,
    MessageModule,
    PIcon,
    AccountFormDialog,
    TopUpDialog,
    TransferDialog,
  ],
  selector: 'app-accounts',
  styleUrl: './accounts.css',
  templateUrl: './accounts.html',
  providers: [AccountsStore],
})
export class Accounts {
  readonly store = inject(AccountsStore);

  showDialog = signal(false);
  topUpTarget = signal<Account | null>(null);
  transferSource = signal<Account | null>(null);

  openCreate(): void {
    this.showDialog.set(true);
  }

  openTopUp(account: Account): void {
    this.topUpTarget.set(account);
  }

  openTransfer(account: Account): void {
    this.transferSource.set(account);
  }

  generateReport(account: Account): void {
    this.store.generateReportForAccount(account);
  }

  formatIbanText(iban: string): string {
    return formatIban(iban);
  }
}
