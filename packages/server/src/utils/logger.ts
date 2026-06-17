import winston from 'winston';
import { generateTraceId } from '@platform/shared';

const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const traceId = meta.traceId || generateTraceId();
  const metaStr = Object.keys(meta).length > 0 && meta.traceId
    ? JSON.stringify(meta, (k, v) => k === 'traceId' ? undefined : v)
    : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${traceId}] ${message} ${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat,
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      customFormat,
    ),
  }));
}

export const createChildLogger = (traceId: string) => {
  return logger.child({ traceId });
};
