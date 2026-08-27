import { Component, inject, signal } from '@angular/core';
import { selectAuthError, selectAuthLoading } from '../../../core/store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import {
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  validateTree,
} from '@angular/forms/signals';
import { AuthActions } from '../../../core/store/auth/auth.actions';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { LabelModule } from 'primeng/label';
import { RouterLink } from '@angular/router';

@Component({
  imports: [
    FormRoot,
    FormField,
    InputTextModule,
    ButtonDirective,
    CardModule,
    MessageModule,
    LabelModule,
    RouterLink,
  ],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  registerModel = signal({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  registerForm = form(
    this.registerModel,
    (schemaPath) => {
      required(schemaPath.displayName, { message: 'Name is required' });
      minLength(schemaPath.displayName, 2, { message: 'Minimum 2 characters' });
      required(schemaPath.email, { message: 'Email is required' });
      email(schemaPath.email, { message: 'Enter a valid email' });
      required(schemaPath.password, { message: 'Password is required' });
      minLength(schemaPath.password, 6, { message: 'Minimum 6 characters' });
      required(schemaPath.confirmPassword, { message: 'Confirm password is required' });

      validateTree(schemaPath, (ctx) => {
        if (ctx.valueOf(schemaPath.password) !== ctx.valueOf(schemaPath.confirmPassword)) {
          return {
            kind: 'passwordMismatch',
            message: 'Passwords do not match',
            fieldTree: ctx.fieldTree.confirmPassword,
          };
        }

        return null;
      });
    },
    {
      submission: {
        action: async (form) => {
          const { confirmPassword, ...rest } = form().value();

          this.store.dispatch(AuthActions.register(rest));

          return {
            kind: 'serverError',
            message: 'Failed to submit form',
          };
        },
      },
    },
  );
}
