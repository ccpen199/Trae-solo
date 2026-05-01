import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(8472),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DISTRIBUTION_MAX_LEVEL: z.coerce.number().default(3),
  AFTER_SALE_DAYS: z.coerce.number().default(7),
  MIN_WITHDRAW_AMOUNT: z.coerce.number().default(100),
  MAX_WITHDRAW_AMOUNT: z.coerce.number().default(500000),
  MAX_REGISTER_PER_IP: z.coerce.number().default(5),
  MAX_REGISTER_PER_DEVICE: z.coerce.number().default(3),
  ORDER_MIN_INTERVAL_SECONDS: z.coerce.number().default(60),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);
