import Redis from 'ioredis';
import { config } from '../config';

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis = new Redis(redisConfig);

export const redisClient = redis;

export const getQueueKey = (departmentId: string) => `queue:${departmentId}`;
export const getPatientStatusKey = (patientId: string) => `patient:${patientId}:status`;
export const getReservationCodeKey = (code: string) => `reservation:${code}`;
