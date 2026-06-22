import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

export function loadProjectEnv() {
  if (loaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(__dirname, '../../backend/.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
  }

  loaded = true;
}
