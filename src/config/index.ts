import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8765),
  API_PREFIX: z.string().default('/api/v1'),
  
  DATABASE_URL: z.string(),
  
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  SMS_ENABLED: z.coerce.boolean().default(false),
  PUSH_ENABLED: z.coerce.boolean().default(false),
  
  CRON_REMINDER_ENABLED: z.coerce.boolean().default(true),
  CRON_RENEWAL_ENABLED: z.coerce.boolean().default(true),
  CRON_REPORT_ENABLED: z.coerce.boolean().default(true),
  
  TIMETABLE_MAX_ATTEMPTS: z.coerce.number().default(100),
  TIMETABLE_CONFLICT_THRESHOLD: z.coerce.number().default(0),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ 环境变量验证失败:', parsedEnv.error.format());
  process.exit(1);
}

export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  apiPrefix: parsedEnv.data.API_PREFIX,
  
  database: {
    url: parsedEnv.data.DATABASE_URL,
  },
  
  redis: {
    url: parsedEnv.data.REDIS_URL,
    password: parsedEnv.data.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: parsedEnv.data.JWT_SECRET,
    expiresIn: parsedEnv.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsedEnv.data.JWT_REFRESH_EXPIRES_IN,
  },
  
  bcrypt: {
    saltRounds: parsedEnv.data.BCRYPT_SALT_ROUNDS,
  },
  
  log: {
    level: parsedEnv.data.LOG_LEVEL,
  },
  
  notification: {
    smsEnabled: parsedEnv.data.SMS_ENABLED,
    pushEnabled: parsedEnv.data.PUSH_ENABLED,
  },
  
  cron: {
    reminderEnabled: parsedEnv.data.CRON_REMINDER_ENABLED,
    renewalEnabled: parsedEnv.data.CRON_RENEWAL_ENABLED,
    reportEnabled: parsedEnv.data.CRON_REPORT_ENABLED,
  },
  
  timetable: {
    maxAttempts: parsedEnv.data.TIMETABLE_MAX_ATTEMPTS,
    conflictThreshold: parsedEnv.data.TIMETABLE_CONFLICT_THRESHOLD,
  },
  
  isDevelopment: parsedEnv.data.NODE_ENV === 'development',
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
};

export const RARE_PORTS = [8765, 9876, 12345, 23456, 34567, 45678, 56789, 67890, 78901, 89012, 90123];

export default config;
