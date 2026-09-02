import { Component, effect, inject, signal } from '@angular/core';
import {
  form,
  FormRoot,
  FormField,
  required,
  minLength,
  email,
  readonly,
} from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { PIcon } from '@primeicons/angular';
import { UserService } from '@core/services/user.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { UiActions } from '@core/store/ui/ui.actions';
import { AuthActions } from '@core/store/auth/auth.actions';
import { Locale, Theme } from '@core/models';

interface ProfileFormModel {
  displayName: string;
  email: string;
  department: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CardModule,
    FormRoot,
    FormField,
    InputTextModule,
    SelectModule,
    ButtonDirective,
    LabelModule,
    MessageModule,
    AvatarModule,
    TagModule,
    PIcon,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private store = inject(Store);
  private userService = inject(UserService);

  user = this.store.selectSignal(selectCurrentUser);

  saving = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  languageOptions = [
    { label: 'Ukrainian', value: 'uk' },
    { label: 'English', value: 'en' },
  ];

  profileModel = signal<ProfileFormModel>({
    displayName: '',
    email: '',
    department: '',
  });

  profileForm = form(
    this.profileModel,
    (p) => {
      required(p.displayName, { message: 'Name is required' });
      minLength(p.displayName, 2, { message: 'Minimum 2 characters' });
      required(p.email, { message: 'Email is required' });
      email(p.email, { message: 'Enter a valid email' });
      readonly(p.email);
    },
    {
      submission: {
        action: async (f) => {
          if (f().invalid()) return;
          await this.saveProfile(f().value());
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const u = this.user();
      if (!u) return;

      this.profileModel.set({
        displayName: u.displayName || '',
        email: u.email || '',
        department: u.department || '',
      });
    });
  }

  private saveProfile(value: ProfileFormModel): void {
    const u = this.user();
    if (!u) return;

    this.saving.set(true);
    this.success.set(null);
    this.error.set(null);

    this.userService
      .update(u.id, {
        displayName: value.displayName,
        department: value.department || undefined,
      })
      .subscribe({
        next: () => {
          this.store.dispatch(AuthActions.updateUser());
          this.success.set('Profile updated successfully');
          this.saving.set(false);
        },
        error: (e) => {
          this.error.set(e?.message || 'Failed to update profile');
          this.saving.set(false);
        },
      });
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  avatarLabel(): string {
    const u = this.user();
    const name = u?.displayName || u?.email || '?';
    return name.charAt(0).toUpperCase();
  }
}
