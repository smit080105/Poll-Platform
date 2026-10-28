import { rmSync } from 'node:fs';

for (const path of [
  'node_modules',
  'frontend/node_modules',
  'frontend/dist',
  'backend/node_modules'
]) {
  rmSync(new URL(`../${path}`, import.meta.url), { recursive: true, force: true });
}
