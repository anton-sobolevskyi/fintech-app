export interface EnvConfig {
  production: boolean;
  useEmulators: boolean;
  primeNgLicense: string;
  sentryDsn: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}
