import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import configuration from '../config/configuration';

const config = configuration();
const logLevel = config.logLevel || 'info';
const logDir = config.logDir || './logs';

const logFormat = winston.format.printf(
  ({ timestamp, level, message, context }) => {
    const ctx = context ? `[${context}]` : '[Nest]';
    return `${timestamp} [${level.toUpperCase()}] ${ctx} ${message}`;
  },
);

const commonTransports: winston.transport[] = [
  new DailyRotateFile({
    filename: path.join(logDir, '%DATE%-app.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: logLevel,
  }),
  new DailyRotateFile({
    filename: path.join(logDir, '%DATE%-error.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
  }),
];

if (config.nodeEnv !== 'production') {
  commonTransports.push(
    new winston.transports.Console({
      level: logLevel,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
    }),
  );
}

const winstonLogger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat,
  ),
  transports: commonTransports,
});

export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winstonLogger;
  }

  log(message: any, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, { context, trace });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context });
  }

  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

export const winstonLoggerInstance = new WinstonLogger();
