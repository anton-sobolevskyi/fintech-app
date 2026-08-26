import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import type { EnvConfig } from '../types/env';

const isProd = process.argv.includes('--prod');
const yamlPath = isProd ? './config/env.prod.yaml' : './config/env.yaml';

const raw = readFileSync(yamlPath, 'utf8');
const config = load(raw) as EnvConfig;

const output = `// AUTO-GENERATED from ${yamlPath} — do not edit directly
export const environment = ${JSON.stringify(config, null, 2)};
`;

mkdirSync('./src/environments', { recursive: true });
writeFileSync('./src/environments/environment.ts', output);
console.log(`environment.ts generated from ${yamlPath}`);
