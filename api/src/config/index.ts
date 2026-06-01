import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '53490'),
  host: process.env.HOST || '127.0.0.1',
  frontendPort: parseInt(process.env.FRONTEND_PORT || '43490'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://127.0.0.1:43490',
  jwtSecret: process.env.JWT_SECRET || 'asset_management_jwt_secret_key_2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databasePath: process.env.DATABASE_PATH || './data/app.sqlite',
  env: process.env.NODE_ENV || 'development',
  tail4: process.env.TAIL4 || '3490',
  projectDir: process.env.PROJECT_DIR || 'may-63490',
};

export function validatePort(port: number, type: 'frontend' | 'backend'): boolean {
  const minPort = type === 'frontend' ? 40000 : 50000;
  const maxPort = type === 'frontend' ? 49999 : 59999;
  return port >= minPort && port <= maxPort;
}

export function getFallbackPorts(slot: number): { frontend: number; backend: number } {
  const tail4 = parseInt(config.tail4);
  const base = 40000 + slot * 1000;
  return {
    frontend: base + tail4,
    backend: base + 10000 + tail4,
  };
}
