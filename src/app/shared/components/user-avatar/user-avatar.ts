import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { selectCurrentUser } from '@core/store/auth';
import { Store } from '@ngrx/store';
import { AvatarModule } from 'primeng/avatar';

@Component({
  imports: [AvatarModule, UpperCasePipe],
  selector: 'app-user-avatar',
  styleUrl: './user-avatar.css',
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  private store = inject(Store);

  user = this.store.selectSignal(selectCurrentUser);
}
