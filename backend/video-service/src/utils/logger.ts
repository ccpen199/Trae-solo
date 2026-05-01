import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, requestId, error, ...meta }) => {
  const logEntry = {
    timestamp,
    level,
    message,
    requestId,
    ...meta,
    error: error ? {
      message: error.message,
      stack: error.stack,
    } : undefined,
  };
  return JSON.stringify(logEntry);
});

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, requestId }) => {
    return `${timestamp} [${level}] ${requestId ? `[${requestId}] ` : ''}${message}`;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    logFormat
  ),
  defaultMeta: {
    service: 'video-service',
    nodeEnv: config.nodeEnv,
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

export const createChildLogger = (requestId: string) => {
  return logger.child({ requestId });
};
