import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envSchema = z.object({
  PORT: z.coerce.number().default(9165),
  FRONTEND_PORT: z.coerce.number().default(9166),
  FRONTEND_URL: z.string().url().default('http://localhost:9166'),
  DB_PATH: z.string().default('../data/app.sqlite'),
  JWT_SECRET: z.string().default('api-gateway-jwt-secret-key-2026'),
  JWT_EXPIRES_IN: z.string().default('24h'),
});

const env = envSchema.parse(process.env);

export const config = {
  server: {
    port: env.PORT,
    frontendPort: env.FRONTEND_PORT,
    frontendUrl: env.FRONTEND_URL,
  },
  database: {
    path: path.resolve(__dirname, '../../', env.DB_PATH),
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  api: {
    prefix: '/api/v1',
  },
  proxy: {
    timeout: 30000,
    maxRetries: 3,
  },
  circuitBreaker: {
    failureThreshold: 0.5,
    timeout: 10000,
    resetTimeout: 30000,
  },
};

export type Config = typeof config;
