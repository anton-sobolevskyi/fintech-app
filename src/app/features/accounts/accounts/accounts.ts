import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AccountsStore } from '../accounts.store';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { PIcon } from '@primeicons/angular';
import { AccountFormDialog } from '../account-form-dialog/account-form-dialog';

@Component({
  imports: [
    ButtonModule,
    CardModule,
    SkeletonModule,
    TagModule,
    TableModule,
    PIcon,
    AccountFormDialog,
  ],
  selector: 'app-accounts',
  styleUrl: './accounts.css',
  templateUrl: './accounts.html',
  providers: [AccountsStore],
})
export class Accounts {
  readonly store = inject(AccountsStore);

  showDialog = signal(false);

  openCreate(): void {
    this.showDialog.set(true);
  }
}
