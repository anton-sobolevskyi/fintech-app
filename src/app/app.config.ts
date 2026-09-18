import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { coreReducer } from './core/store';
import { AuthEffects } from './core/store/auth/auth.effects';
import { UiEffects } from './core/store/ui/ui.effects';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { environment } from '../environments/environment';
import * as Sentry from "@sentry/angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(),
    provideRouter(routes),
    provideStore(coreReducer),
    provideEffects([AuthEffects, UiEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),

    providePrimeNG({
      license: environment.primeNgLicense,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),

    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};
