import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Locale, Theme, User } from '@core/models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // Login
    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ user: User }>(),
    'Login Failure': props<{ error: string }>(),

    // Register
    Register: props<{ email: string; password: string; displayName: string }>(),
    'Register Success': props<{ user: User }>(),
    'Register Failure': props<{ error: string }>(),

    // Logout
    Logout: emptyProps(),
    'Logout Success': emptyProps(),

    // Load User
    'Load User': emptyProps(),
    'Load User Success': props<{ user: User | null }>(),
    'Load User Failure': props<{ error: string }>(),

    // Update User
    'Update User': emptyProps(),
    'Update User Success': props<{ user: User | null }>(),
    'Update User Failure': props<{ error: string }>(),

    'Clear Error': emptyProps(),

    'Update Preferences': props<{ theme?: Theme; language?: Locale }>(),
    'Update Preferences Success': props<{ theme?: Theme; language?: Locale }>(),
    'Update Preferences Failure': props<{ error: string }>(),
  },
});
