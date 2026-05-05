import Queue from 'bull';
import { redisConfig } from './redis';
import dotenv from 'dotenv';

dotenv.config();

export const fundNotificationQueue = new Queue('fund-company-notification', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const dPlanQueue = new Queue('dplan-execution', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const dailyIncomeQueue = new Queue('daily-income-calculation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});
