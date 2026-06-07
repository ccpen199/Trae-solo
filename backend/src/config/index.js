import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '59061', 10),
  frontendPort: parseInt(process.env.FRONTEND_PORT || '49061', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://127.0.0.1:49061',
  databaseUrl: process.env.DATABASE_URL || './data/app.sqlite',
  jwtSecret: process.env.JWT_SECRET || 'deliver-platform-jwt-secret',
  encryptionKey: process.env.ENCRYPTION_KEY || 'deliver-encryption-key-32bytes-2024!',
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID || 'platform-admin',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'platform-secret-2024',
    accessTokenTtl: parseInt(process.env.OAUTH_ACCESS_TOKEN_TTL || '86400', 10),
    refreshTokenTtl: parseInt(process.env.OAUTH_REFRESH_TOKEN_TTL || '604800', 10),
    redirectUri: process.env.VITE_OAUTH_REDIRECT_URL || 'http://127.0.0.1:49061/oauth/callback',
  },
};
