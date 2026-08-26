import { Component, inject, signal } from '@angular/core';
import { email, form, minLength, required, FormRoot, FormField } from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { ButtonDirective } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { LabelModule } from 'primeng/label';
import { MessageModule } from 'primeng/message';

import { selectAuthError, selectAuthLoading } from '../../../core/store/auth/auth.selectors';
import { AuthActions } from '../../../core/store/auth/auth.actions';
import { RouterLink } from '@angular/router';

@Component({
  imports: [
    CardModule,
    FormRoot,
    FormField,
    ButtonDirective,
    MessageModule,
    InputTextModule,
    LabelModule,
    RouterLink,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  loginModel = signal({
    email: '',
    password: '',
  });

  loginForm = form(
    this.loginModel,
    (schemaPath) => {
      (required(schemaPath.email, { message: 'Email is required' }),
        email(schemaPath.email, { message: 'Enter a valid email' }),
        required(schemaPath.password, { message: 'Password is required' }),
        minLength(schemaPath.password, 6, { message: 'Minimum 6 characters' }));
    },
    {
      submission: {
        action: async (form) => {
          this.store.dispatch(AuthActions.login(form().value()));
        },
      },
    },
  );
}
