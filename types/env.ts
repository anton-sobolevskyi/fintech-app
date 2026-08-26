export interface EnvConfig {
  production: boolean;
  useEmulators: boolean;
  primeNgLicense: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}
