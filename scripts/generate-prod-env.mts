import { writeFileSync, mkdirSync } from 'fs';
import { dump } from 'js-yaml';
import dotenv from 'dotenv';
import { EnvConfig } from '../types/env';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

const config: EnvConfig = {
  production: true,
  useEmulators: false,
  primeNgLicense: requireEnv('PRIME_NG_LICENSE'),
  firebase: {
    apiKey: requireEnv('FIREBASE_API_KEY'),
    authDomain: requireEnv('FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('FIREBASE_APP_ID'),
  },
};

mkdirSync('./config', { recursive: true });
writeFileSync('./config/env.prod.yaml', dump(config));
console.log('config/env.prod.yaml generated from environment variables');
