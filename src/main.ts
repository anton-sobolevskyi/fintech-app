import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import * as Sentry from "@sentry/angular";

import { environment } from './environments/environment';

Sentry.init({
  dsn: environment.sentryDsn,
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/angular/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  }
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
