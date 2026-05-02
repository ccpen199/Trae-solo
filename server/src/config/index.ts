import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(28765),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  DB_DIALECT: z.enum(['postgres', 'sqlite']).default('sqlite'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('exam_admin'),
  DB_PASSWORD: z.string().default('ExamSecurePass2024'),
  DB_NAME: z.string().default('online_exam_system'),
  DB_STORAGE: z.string().default('./data/exam_system.db'),
  
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  USE_REDIS: z.coerce.boolean().default(false),
  
  JWT_SECRET: z.string().min(32).default('ExamJwtSecretKey2024VeryLongKeyForSecurity'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  EXAM_AUTO_SAVE_INTERVAL: z.coerce.number().default(30000),
  EXAM_MAX_SCREEN_SWITCHES: z.coerce.number().default(3),
  EXAM_WARNING_THRESHOLD: z.coerce.number().default(2),
});

export const env = envSchema.parse(process.env);

export type EnvConfig = typeof env;
