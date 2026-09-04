import { UpperCasePipe, NgClass } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { selectCurrentUser } from '@core/store/auth';
import { Store } from '@ngrx/store';
import { AvatarModule } from 'primeng/avatar';

@Component({
  imports: [AvatarModule, UpperCasePipe, NgClass],
  selector: 'app-user-avatar',
  styleUrl: './user-avatar.css',
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  private store = inject(Store);

  size = input<'small' | 'normal' | 'large'>('normal');

  user = this.store.selectSignal(selectCurrentUser);

  getClasses = computed(() => {
    return {
      'size-6': this.size() === 'small',
      'size-8': this.size() === 'normal',
      'size-10': this.size() === 'large',
    };
  });
}
